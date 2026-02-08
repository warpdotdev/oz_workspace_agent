#!/usr/bin/env python3
"""
Market Prediction Engine - Command Line Interface

Commands:
  fetch       Fetch historical price data from CoinGecko
  predict     Generate predictions using all strategies
  verify      Verify pending predictions against actual outcomes  
  backtest    Run backtests on historical data
  status      Show current predictions and strategy leaderboard
  prices      Show recent prices
"""

import argparse
import sys
import os
from datetime import datetime, timedelta
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Database, Direction, Magnitude
from data.coingecko import CoinGeckoClient
from strategies.base import get_all_strategies, get_strategy
from backtesting.backtest import Backtester
from verification.verifier import Verifier


DEFAULT_DB_PATH = "market_predictions.db"
DEFAULT_ASSETS = ["bitcoin", "ethereum"]


def cmd_fetch(args):
    """Fetch historical price data."""
    db = Database(args.db)
    client = CoinGeckoClient(db)
    
    assets = args.assets.split(",") if args.assets else DEFAULT_ASSETS
    days = args.days
    
    print(f"Fetching {days} days of hourly price data for: {', '.join(assets)}")
    
    for asset in assets:
        print(f"\n{asset}:")
        prices = client.get_hourly_prices(asset, days=days, save_to_db=True)
        if prices:
            print(f"  ✓ Fetched {len(prices)} price points")
            print(f"  First: ${prices[0].price_usd:,.2f} at {prices[0].timestamp}")
            print(f"  Last:  ${prices[-1].price_usd:,.2f} at {prices[-1].timestamp}")
        else:
            print(f"  ✗ Failed to fetch prices")
    
    db.close()
    print("\nDone!")


def cmd_predict(args):
    """Generate predictions using all strategies."""
    db = Database(args.db)
    client = CoinGeckoClient(db)
    
    assets = args.assets.split(",") if args.assets else DEFAULT_ASSETS
    strategies = get_all_strategies() if not args.strategy else [get_strategy(args.strategy)]
    strategies = [s for s in strategies if s is not None]
    
    if not strategies:
        print(f"Error: Unknown strategy '{args.strategy}'")
        db.close()
        return
    
    now = datetime.utcnow()
    predictions_made = 0
    
    print(f"Generating 24h predictions for: {', '.join(assets)}")
    print(f"Strategies: {', '.join(s.name for s in strategies)}")
    print("-" * 60)
    
    for asset in assets:
        # Get current price
        current_price = client.get_current_price(asset)
        if not current_price:
            print(f"\n{asset}: Could not fetch current price")
            continue
        
        # Get historical prices for strategy calculations
        start_date = now - timedelta(days=30)
        history = db.get_prices(asset, start_date, now)
        
        if len(history) < 48:
            print(f"\n{asset}: Insufficient historical data (need at least 48 hourly points)")
            continue
        
        print(f"\n{asset} (current: ${current_price.price_usd:,.2f}):")
        
        for strategy in strategies:
            prediction = strategy.predict(
                asset=asset,
                current_price=current_price.price_usd,
                price_history=history,
                prediction_time=now
            )
            
            if prediction:
                db.save_prediction(prediction)
                predictions_made += 1
                
                arrow = "↑" if prediction.direction == Direction.UP else "↓"
                print(
                    f"  {strategy.name:<18} {arrow} {prediction.direction.value:<4} "
                    f"({prediction.magnitude.value:<6}) "
                    f"confidence: {prediction.confidence:.0%}"
                )
            else:
                print(f"  {strategy.name:<18} - insufficient data")
    
    print("-" * 60)
    print(f"Total predictions made: {predictions_made}")
    print(f"Target time: {now + timedelta(hours=24)} UTC")
    
    db.close()


def cmd_verify(args):
    """Verify pending predictions against actual outcomes."""
    db = Database(args.db)
    verifier = Verifier(db)
    
    print("Checking for predictions to verify...")
    results = verifier.verify_pending()
    
    if not results:
        print("No predictions due for verification.")
    else:
        correct = sum(1 for r in results if r.success and r.direction_correct)
        total = sum(1 for r in results if r.success)
        
        print(f"\nVerified {len(results)} predictions:")
        for r in results:
            if r.success:
                status = "✓" if r.direction_correct else "✗"
                print(f"  {status} {r.prediction_id[:8]}... - {r.actual_pct_change:+.2f}% actual")
            else:
                print(f"  ? {r.prediction_id[:8]}... - {r.error}")
        
        if total > 0:
            print(f"\nDirection accuracy: {correct}/{total} ({correct/total*100:.1f}%)")
    
    # Print leaderboard
    verifier.print_leaderboard()
    
    db.close()


def cmd_backtest(args):
    """Run backtests on historical data."""
    db = Database(args.db)
    backtester = Backtester(db)
    
    asset = args.asset
    days = args.days
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Check data availability
    prices = db.get_prices(asset, start_date - timedelta(days=30), end_date)
    
    if len(prices) < 100:
        print(f"Not enough data for backtest. Run 'fetch' command first.")
        print(f"  Have: {len(prices)} price points")
        print(f"  Need: at least 100")
        db.close()
        return
    
    print(f"Running backtest for {asset}")
    print(f"Period: {start_date.date()} to {end_date.date()}")
    print(f"Data points: {len(prices)}")
    
    # Run all strategies
    summaries = backtester.run_all_strategies(
        asset=asset,
        start_date=start_date,
        end_date=end_date,
        prediction_interval_hours=24
    )
    
    backtester.print_comparison(summaries)
    
    # Output JSON if requested
    if args.json:
        output = {name: s.to_dict() for name, s in summaries.items()}
        print("\n" + json.dumps(output, indent=2))
    
    db.close()


def cmd_status(args):
    """Show current predictions and strategy leaderboard."""
    db = Database(args.db)
    verifier = Verifier(db)
    
    # Recent predictions
    predictions = db.get_recent_predictions(limit=args.limit)
    
    print("\n" + "=" * 80)
    print("RECENT PREDICTIONS")
    print("=" * 80)
    
    if not predictions:
        print("No predictions yet. Run 'predict' command first.")
    else:
        print(f"{'Asset':<12} {'Strategy':<18} {'Direction':>10} {'Magnitude':>10} {'Status':>12}")
        print("-" * 80)
        
        for p in predictions:
            if p.verified_at:
                if p.direction_correct:
                    status = "✓ CORRECT"
                else:
                    status = "✗ WRONG"
            else:
                status = "⏳ PENDING"
            
            arrow = "↑" if p.direction == Direction.UP else "↓"
            print(
                f"{p.asset:<12} "
                f"{p.strategy:<18} "
                f"{arrow} {p.direction.value:>7} "
                f"{p.magnitude.value:>10} "
                f"{status:>12}"
            )
    
    # Show leaderboard
    verifier.print_leaderboard()
    
    db.close()


def cmd_prices(args):
    """Show recent prices."""
    db = Database(args.db)
    
    asset = args.asset
    hours = args.hours
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(hours=hours)
    
    prices = db.get_prices(asset, start_date, end_date)
    
    print(f"\nRecent prices for {asset} (last {hours} hours):")
    print("-" * 50)
    
    if not prices:
        print("No price data. Run 'fetch' command first.")
    else:
        # Show last N prices
        for p in prices[-20:]:
            print(f"  {p.timestamp.strftime('%Y-%m-%d %H:%M')} UTC  ${p.price_usd:>12,.2f}")
        
        if len(prices) > 20:
            print(f"  ... and {len(prices) - 20} more")
        
        # Calculate change
        if len(prices) >= 2:
            first_price = prices[0].price_usd
            last_price = prices[-1].price_usd
            change = ((last_price - first_price) / first_price) * 100
            print(f"\nChange over period: {change:+.2f}%")
    
    db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Market Prediction Engine - Testable and Verifiable Predictions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch 60 days of historical data
  python -m market_prediction.cli.main fetch --days 60

  # Generate predictions for BTC and ETH
  python -m market_prediction.cli.main predict

  # Run backtest on historical data
  python -m market_prediction.cli.main backtest --days 30

  # Check prediction accuracy
  python -m market_prediction.cli.main verify

  # View status and leaderboard
  python -m market_prediction.cli.main status
"""
    )
    
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help="Database path")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Fetch command
    fetch_parser = subparsers.add_parser("fetch", help="Fetch historical price data")
    fetch_parser.add_argument("--assets", help="Comma-separated asset list (default: bitcoin,ethereum)")
    fetch_parser.add_argument("--days", type=int, default=60, help="Days of history to fetch (default: 60)")
    
    # Predict command
    predict_parser = subparsers.add_parser("predict", help="Generate predictions")
    predict_parser.add_argument("--assets", help="Comma-separated asset list")
    predict_parser.add_argument("--strategy", help="Specific strategy to use (default: all)")
    
    # Verify command
    verify_parser = subparsers.add_parser("verify", help="Verify pending predictions")
    
    # Backtest command
    backtest_parser = subparsers.add_parser("backtest", help="Run backtests")
    backtest_parser.add_argument("--asset", default="bitcoin", help="Asset to backtest")
    backtest_parser.add_argument("--days", type=int, default=30, help="Days to backtest")
    backtest_parser.add_argument("--json", action="store_true", help="Output JSON results")
    
    # Status command
    status_parser = subparsers.add_parser("status", help="Show predictions and leaderboard")
    status_parser.add_argument("--limit", type=int, default=20, help="Number of predictions to show")
    
    # Prices command
    prices_parser = subparsers.add_parser("prices", help="Show recent prices")
    prices_parser.add_argument("--asset", default="bitcoin", help="Asset to show")
    prices_parser.add_argument("--hours", type=int, default=48, help="Hours of price history")
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    commands = {
        "fetch": cmd_fetch,
        "predict": cmd_predict,
        "verify": cmd_verify,
        "backtest": cmd_backtest,
        "status": cmd_status,
        "prices": cmd_prices,
    }
    
    cmd_func = commands.get(args.command)
    if cmd_func:
        cmd_func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
