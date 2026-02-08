#!/usr/bin/env python3
"""
Market Prediction Engine CLI

Usage:
    python -m market_prediction.cli.main <command> [options]

Commands:
    predict     Generate predictions for assets
    verify      Verify pending predictions
    backtest    Backtest strategies against historical data
    status      Show current predictions and performance
    fetch       Fetch and store price data
    leaderboard Show strategy performance leaderboard
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from market_prediction.data import Database, CoinGeckoClient
from market_prediction.strategies import (
    RandomStrategy,
    MomentumStrategy,
    MeanReversionStrategy,
    SMACrossoverStrategy,
    EnsembleStrategy,
)
from market_prediction.verification import Verifier, Backtester


# Default strategies (base strategies for comparison)
BASE_STRATEGIES = [
    RandomStrategy(),
    MomentumStrategy(),
    MeanReversionStrategy(),
    SMACrossoverStrategy(),
]

# Default strategies including ensemble
DEFAULT_STRATEGIES = BASE_STRATEGIES + [
    EnsembleStrategy(BASE_STRATEGIES[:]),  # Copy to avoid shared state
]

# Default assets
DEFAULT_ASSETS = ["bitcoin", "ethereum"]


def get_strategy_by_name(name: str):
    """Get a strategy instance by name."""
    base = {
        "random": RandomStrategy(),
        "momentum": MomentumStrategy(),
        "mean_reversion": MeanReversionStrategy(),
        "sma_crossover": SMACrossoverStrategy(),
    }
    if name == "ensemble":
        return EnsembleStrategy(list(base.values()))
    return base.get(name)


def cmd_predict(args):
    """Generate predictions for assets."""
    db = Database(args.db)
    client = CoinGeckoClient()
    
    assets = args.assets.split(",") if args.assets else DEFAULT_ASSETS
    strategies = []
    
    if args.strategy:
        strategy = get_strategy_by_name(args.strategy)
        if strategy:
            strategies = [strategy]
        else:
            print(f"Unknown strategy: {args.strategy}")
            return 1
    else:
        strategies = DEFAULT_STRATEGIES
    
    print(f"Generating predictions for: {', '.join(assets)}")
    print(f"Using strategies: {', '.join(s.name for s in strategies)}")
    print("-" * 50)
    
    for asset in assets:
        # Fetch current price
        current = client.get_current_price(asset)
        if not current:
            print(f"  ERROR: Could not fetch price for {asset}")
            continue
        
        # Store the current price
        db.save_price(current)
        
        # Get historical prices for strategy calculations
        history = db.get_price_history(asset, days=30)
        if len(history) < 21:
            # Fetch history if we don't have enough
            print(f"  Fetching historical data for {asset}...")
            backtester = Backtester(db, client)
            backtester.fetch_and_store_history(asset, 90)
            history = db.get_price_history(asset, days=30)
        
        print(f"\n{asset.upper()} @ ${current.price_usd:,.2f}")
        
        for strategy in strategies:
            prediction = strategy.create_prediction(asset, history, current.price_usd)
            db.save_prediction(prediction)
            
            print(f"  {strategy.name:20} -> {prediction.direction.value.upper():5} "
                  f"{prediction.magnitude.value:7} (conf: {prediction.confidence:.2f})")
    
    print("\n✓ Predictions saved to database")
    return 0


def cmd_verify(args):
    """Verify pending predictions."""
    db = Database(args.db)
    client = CoinGeckoClient()
    verifier = Verifier(db, client)
    
    print("Checking for predictions to verify...")
    results = verifier.verify_pending()
    
    if not results:
        print("No predictions pending verification.")
        return 0
    
    print(f"\nVerified {len(results)} predictions:")
    print("-" * 70)
    
    for prediction, success in results:
        if success:
            dir_result = "✓" if prediction.direction_correct else "✗"
            mag_result = "✓" if prediction.magnitude_correct else "✗"
            print(f"  {prediction.asset:10} {prediction.strategy:15} "
                  f"Dir:{dir_result} Mag:{mag_result} "
                  f"(pred:{prediction.direction.value} actual:{prediction.actual_direction.value} "
                  f"change:{prediction.percentage_change:+.2f}%)")
        else:
            print(f"  {prediction.asset:10} {prediction.strategy:15} "
                  f"FAILED to verify (could not fetch price)")
    
    return 0


def cmd_backtest(args):
    """Backtest strategies against historical data with proper statistical rigor."""
    db = Database(args.db)
    client = CoinGeckoClient()
    backtester = Backtester(db, client)
    
    days = args.days or 90  # More days for better statistics
    use_split = not args.no_split  # Default to using train/test split
    
    strategies = []
    if args.strategy:
        strategy = get_strategy_by_name(args.strategy)
        if strategy:
            strategies = [strategy]
        else:
            print(f"Unknown strategy: {args.strategy}")
            return 1
    else:
        strategies = DEFAULT_STRATEGIES
    
    # Multi-asset backtest
    if args.multi_asset:
        assets = args.assets.split(",") if args.assets else DEFAULT_ASSETS
        print(f"Multi-asset backtest on {', '.join(assets)} over {days} days...")
        print(f"Train/test split: {'ON (reporting out-of-sample accuracy)' if use_split else 'OFF (in-sample warning!)'}")
        print("Fetching historical data (this may take a moment)...\n")
        
        results = backtester.backtest_multi_asset(strategies, assets, days, train_test_split=use_split)
        
        # Print per-asset results
        for asset in assets:
            print(f"\n{asset.upper()}")
            print("-" * 70)
            print(f"{'Strategy':<20} {'Dir %':>8} {'p-value':>10} {'Sig?':>6} {'n':>6}")
            print("-" * 70)
            
            for result in results["per_asset_results"][asset]:
                if "error" in result:
                    print(f"{result.get('strategy', 'unknown'):<20} ERROR: {result['error']}")
                else:
                    sig_marker = "*" if result.get("significant", False) else ""
                    print(f"{result['strategy']:<20} "
                          f"{result['direction_accuracy']:>7.1f}% "
                          f"{result.get('p_value', 1.0):>10.4f} "
                          f"{sig_marker:>6} "
                          f"{result['total_predictions']:>6}")
        
        # Print summary
        print("\n" + "=" * 70)
        print("STRATEGY SUMMARY (Combined across all assets)")
        print("=" * 70)
        print(f"{'Strategy':<20} {'Combined %':>12} {'p-value':>10} {'Replicates?':>12}")
        print("-" * 70)
        
        for name, summary in results["strategy_summary"].items():
            replicates = "YES" if summary["edge_replicates"] else "no"
            sig = "*" if summary["combined_significant"] else ""
            print(f"{name:<20} "
                  f"{summary['combined_accuracy']:>11.1f}% "
                  f"{summary['combined_p_value']:>10.4f}{sig} "
                  f"{replicates:>12}")
        
        print("-" * 70)
        print("* = statistically significant (p < 0.05)")
        print("Replicates = significant in majority of individual assets")
        
        return 0
    
    # Single asset backtest
    asset = args.asset or "bitcoin"
    
    print(f"Backtesting on {asset} over {days} days...")
    print(f"Train/test split: {'ON (reporting out-of-sample accuracy)' if use_split else 'OFF (in-sample warning!)'}")
    print("Fetching historical data (this may take a moment)...")
    
    # Ensure we have enough data
    backtester.fetch_and_store_history(asset, days + 60)
    
    print("-" * 70)
    print(f"{'Strategy':<20} {'Dir %':>8} {'p-value':>10} {'Sig?':>6} {'n':>6}")
    print("-" * 70)
    
    results = backtester.backtest_all_strategies(strategies, asset, days, train_test_split=use_split)
    
    for result in results:
        if "error" in result:
            print(f"{result.get('strategy', 'unknown'):<20} ERROR: {result['error']}")
        else:
            sig_marker = "*" if result.get("significant", False) else ""
            print(f"{result['strategy']:<20} "
                  f"{result['direction_accuracy']:>7.1f}% "
                  f"{result.get('p_value', 1.0):>10.4f} "
                  f"{sig_marker:>6} "
                  f"{result['total_predictions']:>6}")
            
            # Show train vs test comparison if split was used
            if use_split and "train_metrics" in result:
                train = result["train_metrics"]
                test = result["test_metrics"]
                print(f"{'':>20} (train: {train['direction_accuracy']:.1f}% n={train['n']}, "
                      f"test: {test['direction_accuracy']:.1f}% n={test['n']})")
    
    print("-" * 70)
    print("* = statistically significant (p < 0.05)")
    
    # Show if any strategy has real signal
    significant_strategies = [r for r in results if r.get("significant", False) and r.get("strategy") != "random"]
    
    if significant_strategies:
        print(f"\n✓ {len(significant_strategies)} strategies show statistically significant edge!")
        for s in significant_strategies:
            print(f"   - {s['strategy']}: {s['direction_accuracy']:.1f}% (p={s['p_value']:.4f})")
    else:
        print("\n⚠ No strategies show statistically significant edge yet.")
        print("  Need more data or better strategies.")
    
    return 0


def cmd_status(args):
    """Show current predictions and performance."""
    db = Database(args.db)
    
    print("Recent Predictions")
    print("=" * 70)
    
    predictions = db.get_recent_predictions(limit=args.limit or 20)
    
    if not predictions:
        print("No predictions found.")
        return 0
    
    for pred in predictions:
        status = "PENDING" if not pred.is_verified else (
            "✓" if pred.direction_correct else "✗"
        )
        
        if pred.is_verified:
            print(f"  {pred.prediction_time.strftime('%Y-%m-%d %H:%M')} "
                  f"{pred.asset:10} {pred.strategy:15} "
                  f"{pred.direction.value:>5} -> {pred.actual_direction.value:>5} "
                  f"[{status}] ({pred.percentage_change:+.2f}%)")
        else:
            target_str = pred.target_time.strftime('%Y-%m-%d %H:%M')
            print(f"  {pred.prediction_time.strftime('%Y-%m-%d %H:%M')} "
                  f"{pred.asset:10} {pred.strategy:15} "
                  f"{pred.direction.value:>5} @ ${pred.price_at_prediction:,.0f} "
                  f"[{status}] -> {target_str}")
    
    return 0


def cmd_leaderboard(args):
    """Show strategy performance leaderboard."""
    db = Database(args.db)
    verifier = Verifier(db)
    
    print("Strategy Leaderboard")
    print("=" * 70)
    print(f"{'Rank':<6} {'Strategy':<20} {'Dir %':>10} {'Mag %':>10} {'n':>8}")
    print("-" * 70)
    
    leaderboard = verifier.get_leaderboard()
    
    if not leaderboard:
        print("No verified predictions yet. Run predictions and wait for verification.")
        return 0
    
    for rank, perf in enumerate(leaderboard, 1):
        if perf["verified_predictions"] > 0:
            print(f"{rank:<6} {perf['strategy']:<20} "
                  f"{perf['direction_accuracy']:>9.1f}% "
                  f"{perf['magnitude_accuracy']:>9.1f}% "
                  f"{perf['verified_predictions']:>8}")
    
    print("-" * 70)
    print("(Dir % = directional accuracy, Mag % = magnitude accuracy, n = verified predictions)")
    
    return 0


def cmd_fetch(args):
    """Fetch and store price data."""
    db = Database(args.db)
    client = CoinGeckoClient()
    backtester = Backtester(db, client)
    
    assets = args.assets.split(",") if args.assets else DEFAULT_ASSETS
    days = args.days or 90
    
    print(f"Fetching {days} days of price data...")
    
    for asset in assets:
        print(f"  {asset}... ", end="", flush=True)
        count = backtester.fetch_and_store_history(asset, days)
        print(f"{count} data points")
    
    print("\n✓ Data stored in database")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Market Prediction Engine CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        "--db",
        default="market_predictions.db",
        help="Path to SQLite database (default: market_predictions.db)"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # predict command
    predict_parser = subparsers.add_parser("predict", help="Generate predictions")
    predict_parser.add_argument("--assets", help="Comma-separated list of assets")
    predict_parser.add_argument("--strategy", help="Specific strategy to use")
    
    # verify command
    verify_parser = subparsers.add_parser("verify", help="Verify pending predictions")
    
    # backtest command
    backtest_parser = subparsers.add_parser("backtest", help="Backtest strategies with statistical rigor")
    backtest_parser.add_argument("--asset", help="Asset to backtest (default: bitcoin)")
    backtest_parser.add_argument("--assets", help="Comma-separated assets for multi-asset backtest")
    backtest_parser.add_argument("--days", type=int, help="Days of history (default: 90)")
    backtest_parser.add_argument("--strategy", help="Specific strategy to test")
    backtest_parser.add_argument("--multi-asset", action="store_true", help="Run multi-asset backtest")
    backtest_parser.add_argument("--no-split", action="store_true", help="Disable train/test split (not recommended)")
    
    # status command
    status_parser = subparsers.add_parser("status", help="Show predictions and status")
    status_parser.add_argument("--limit", type=int, help="Number of predictions to show")
    
    # leaderboard command
    leaderboard_parser = subparsers.add_parser("leaderboard", help="Show strategy leaderboard")
    
    # fetch command
    fetch_parser = subparsers.add_parser("fetch", help="Fetch historical price data")
    fetch_parser.add_argument("--assets", help="Comma-separated list of assets")
    fetch_parser.add_argument("--days", type=int, help="Days of history (default: 90)")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    commands = {
        "predict": cmd_predict,
        "verify": cmd_verify,
        "backtest": cmd_backtest,
        "status": cmd_status,
        "leaderboard": cmd_leaderboard,
        "fetch": cmd_fetch,
    }
    
    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
