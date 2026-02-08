#!/usr/bin/env python3
"""
Market Prediction CLI

Command-line interface for running predictions, viewing results,
and checking accuracy. Power user interface.

Usage:
    python -m cli.main predict          # Run predictions for tomorrow
    python -m cli.main verify           # Verify pending predictions
    python -m cli.main leaderboard      # Show strategy leaderboard
    python -m cli.main history          # Show recent predictions
    python -m cli.main backfill         # Backfill historical price data
"""

import argparse
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from storage.models import Database, Direction, MagnitudeBucket
from data.coingecko import DataIngestionService, CoinGeckoClient, DEFAULT_COINS
from strategies.base import ALL_STRATEGIES, get_strategy
from verification.engine import VerificationEngine
from verification.backtest import Backtester, run_multi_asset_backtest


def cmd_predict(args):
    """Run predictions for target date"""
    db = Database(args.db)
    data_service = DataIngestionService(db)
    
    target_date = date.today() + timedelta(days=args.days_ahead)
    symbols = args.symbols.split(',') if args.symbols else DEFAULT_COINS[:3]  # Default to top 3
    
    print(f"\n🔮 Generating predictions for {target_date}")
    print(f"   Symbols: {', '.join(symbols)}")
    print(f"   Strategies: {', '.join(s.name for s in ALL_STRATEGIES)}")
    print()
    
    # First, ensure we have recent price data
    print("Fetching current prices...")
    data_service.fetch_and_store_current_prices(symbols)
    
    # Get historical data for strategies
    print("Fetching historical data...")
    for symbol in symbols:
        data_service.fetch_and_store_historical(symbol, days=30)
    
    # Run predictions
    print(f"\nRunning predictions...")
    print("-" * 70)
    
    for symbol in symbols:
        print(f"\n{symbol.upper()}")
        
        # Get current price and history
        latest = db.get_latest_price(symbol)
        if not latest:
            print(f"  ❌ No price data available")
            continue
        
        current_price = latest.price_usd
        print(f"  Current price: ${current_price:,.2f}")
        
        # Get price history
        start = datetime.now() - timedelta(days=60)
        end = datetime.now()
        history = db.get_prices(symbol, start, end)
        
        # Run each strategy
        for strategy in ALL_STRATEGIES:
            output = strategy.predict(symbol, current_price, history, target_date)
            
            # Store prediction
            prediction = strategy.to_prediction_record(
                symbol, current_price, output, target_date
            )
            pred_id = db.insert_prediction(prediction)
            
            # Display
            arrow = "📈" if output.direction == Direction.UP else "📉" if output.direction == Direction.DOWN else "➡️"
            print(f"  {strategy.name:<18} {arrow} {output.direction.value:<6} "
                  f"{output.magnitude.value:<6} (conf: {output.confidence:.0%})")
            if args.verbose:
                print(f"    └─ {output.reasoning}")
    
    print(f"\n✅ Predictions stored in {args.db}")
    db.close()


def cmd_verify(args):
    """Verify pending predictions"""
    db = Database(args.db)
    engine = VerificationEngine(db)
    
    print("\n🔍 Verifying pending predictions...")
    verified = engine.verify_all_pending()
    
    if verified:
        print(f"\n✅ Verified {len(verified)} predictions")
        
        # Show summary
        correct = sum(1 for _, r in verified if r.direction_correct)
        print(f"   Direction accuracy: {correct}/{len(verified)} ({correct/len(verified)*100:.1f}%)")
    else:
        print("\n  No predictions to verify")
    
    db.close()


def cmd_leaderboard(args):
    """Show strategy leaderboard"""
    db = Database(args.db)
    engine = VerificationEngine(db)
    
    engine.print_leaderboard(days=args.days)
    
    db.close()


def cmd_history(args):
    """Show recent predictions and results"""
    db = Database(args.db)
    
    results = db.get_recent_predictions_with_results(limit=args.limit)
    
    if not results:
        print("\nNo predictions found.")
        return
    
    print(f"\n{'Date':<12} {'Symbol':<10} {'Strategy':<18} {'Pred':<10} {'Actual':<10} {'✓/✗':<4}")
    print("-" * 70)
    
    current_date = None
    for r in results:
        pred = r['prediction']
        
        # Date separator
        if pred.target_date != current_date:
            if current_date:
                print()
            current_date = pred.target_date
        
        pred_str = f"{pred.direction.value} {pred.magnitude.value}"
        
        if r['verified']:
            actual_str = f"{r['actual_direction'].value} {r['actual_magnitude'].value}"
            status = "✓" if r['direction_correct'] else "✗"
            change_str = f"({r['price_change_pct']:+.1f}%)"
        else:
            actual_str = "pending"
            status = "⏳"
            change_str = ""
        
        print(f"{pred.target_date!s:<12} {pred.symbol:<10} {pred.strategy_name:<18} "
              f"{pred_str:<10} {actual_str:<10} {status:<4} {change_str}")
    
    db.close()


def cmd_backfill(args):
    """Backfill historical price data"""
    db = Database(args.db)
    data_service = DataIngestionService(db)
    
    symbols = args.symbols.split(',') if args.symbols else DEFAULT_COINS
    
    print(f"\n📊 Backfilling {args.days} days of history for: {', '.join(symbols)}")
    
    results = data_service.backfill_all_coins(symbols, days=args.days)
    
    print(f"\n✅ Backfill complete:")
    for symbol, count in results.items():
        print(f"   {symbol}: {count} records")
    
    db.close()


def cmd_backtest(args):
    """
    Run backtest with train/test split for statistical validation.
    
    This is where the truth lives - out-of-sample validation with p-values.
    """
    db = Database(args.db)
    
    symbols = args.symbols.split(',') if args.symbols else ['bitcoin']
    
    if len(symbols) == 1:
        # Single asset backtest with detailed report
        backtester = Backtester(db)
        train_stats, test_stats = backtester.run_backtest(
            symbol=symbols[0],
            days=args.days,
            train_ratio=args.train_ratio
        )
        backtester.print_backtest_report(train_stats, test_stats, symbols[0])
    else:
        # Multi-asset backtest
        results = run_multi_asset_backtest(
            db=db,
            symbols=symbols,
            days=args.days,
            train_ratio=args.train_ratio
        )
        
        # Print summary across all assets
        print(f"\n{'='*70}")
        print("MULTI-ASSET BACKTEST SUMMARY (Test Set)")
        print(f"{'='*70}")
        print(f"\n{'Strategy':<20} ", end="")
        for symbol in symbols:
            print(f"{symbol:<12} ", end="")
        print("Avg")
        print("-" * (20 + 13 * (len(symbols) + 1)))
        
        # Aggregate by strategy
        strategy_names = set()
        for symbol, (train, test) in results.items():
            strategy_names.update(test.keys())
        
        for strat in sorted(strategy_names):
            print(f"{strat:<20} ", end="")
            accs = []
            for symbol in symbols:
                _, test_stats = results[symbol]
                if strat in test_stats and test_stats[strat].n_predictions > 0:
                    acc = test_stats[strat].direction_accuracy
                    sig = test_stats[strat].significance
                    accs.append(acc)
                    print(f"{acc*100:>5.1f}%{sig:<5} ", end="")
                else:
                    print(f"{'N/A':<12} ", end="")
            
            if accs:
                avg = sum(accs) / len(accs)
                print(f"{avg*100:>5.1f}%")
            else:
                print("N/A")
    
    db.close()


def cmd_status(args):
    """Show current status"""
    db = Database(args.db)
    
    # Count predictions
    pending = db.get_unverified_predictions()
    recent = db.get_recent_predictions_with_results(limit=100)
    verified = [r for r in recent if r['verified']]
    
    print(f"\n📊 Market Prediction Engine Status")
    print(f"   Database: {args.db}")
    print(f"\n   Predictions:")
    print(f"     Pending verification: {len(pending)}")
    print(f"     Recently verified: {len(verified)}")
    
    if verified:
        correct = sum(1 for r in verified if r['direction_correct'])
        print(f"     Recent accuracy: {correct/len(verified)*100:.1f}%")
    
    # Show latest prices
    print(f"\n   Latest prices:")
    for symbol in DEFAULT_COINS[:5]:
        latest = db.get_latest_price(symbol)
        if latest:
            age = (datetime.utcnow() - latest.timestamp).total_seconds() / 3600
            print(f"     {symbol}: ${latest.price_usd:,.2f} ({age:.1f}h ago)")
    
    db.close()


def cmd_prices(args):
    """Fetch and display current prices"""
    db = Database(args.db)
    data_service = DataIngestionService(db)
    
    symbols = args.symbols.split(',') if args.symbols else DEFAULT_COINS
    
    print(f"\n💰 Fetching current prices...")
    records = data_service.fetch_and_store_current_prices(symbols)
    
    print(f"\n{'Symbol':<12} {'Price':<15} {'Market Cap':<18} {'24h Volume':<18}")
    print("-" * 65)
    
    for record in records:
        mc = f"${record.market_cap/1e9:.1f}B" if record.market_cap else "N/A"
        vol = f"${record.volume_24h/1e9:.1f}B" if record.volume_24h else "N/A"
        print(f"{record.symbol:<12} ${record.price_usd:<14,.2f} {mc:<18} {vol:<18}")
    
    db.close()


def main():
    parser = argparse.ArgumentParser(
        description='Market Prediction Engine CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m cli.main predict                    # Predict for tomorrow
  python -m cli.main predict --days-ahead 7    # Predict for 7 days ahead  
  python -m cli.main verify                     # Verify pending predictions
  python -m cli.main leaderboard               # Show strategy rankings
  python -m cli.main history --limit 20        # Show last 20 predictions
  python -m cli.main backfill --days 90        # Backfill 90 days of data
  python -m cli.main prices                     # Show current prices
  python -m cli.main backtest -s bitcoin -d 90 # Backtest with train/test split
        """
    )
    
    parser.add_argument('--db', default='market_predictions.db',
                       help='Database file path')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # predict command
    p_predict = subparsers.add_parser('predict', help='Generate predictions')
    p_predict.add_argument('--days-ahead', type=int, default=1,
                          help='Days ahead to predict (default: 1)')
    p_predict.add_argument('--symbols', type=str,
                          help='Comma-separated symbols (default: bitcoin,ethereum,solana)')
    p_predict.add_argument('-v', '--verbose', action='store_true',
                          help='Show detailed reasoning')
    p_predict.set_defaults(func=cmd_predict)
    
    # verify command
    p_verify = subparsers.add_parser('verify', help='Verify pending predictions')
    p_verify.set_defaults(func=cmd_verify)
    
    # leaderboard command
    p_leader = subparsers.add_parser('leaderboard', help='Show strategy leaderboard')
    p_leader.add_argument('--days', type=int, default=30,
                         help='Days to look back (default: 30)')
    p_leader.set_defaults(func=cmd_leaderboard)
    
    # history command
    p_history = subparsers.add_parser('history', help='Show prediction history')
    p_history.add_argument('--limit', type=int, default=50,
                          help='Number of predictions to show (default: 50)')
    p_history.set_defaults(func=cmd_history)
    
    # backfill command
    p_backfill = subparsers.add_parser('backfill', help='Backfill historical data')
    p_backfill.add_argument('--days', type=int, default=90,
                           help='Days of history to fetch (default: 90)')
    p_backfill.add_argument('--symbols', type=str,
                           help='Comma-separated symbols')
    p_backfill.set_defaults(func=cmd_backfill)
    
    # status command
    p_status = subparsers.add_parser('status', help='Show current status')
    p_status.set_defaults(func=cmd_status)
    
    # prices command  
    p_prices = subparsers.add_parser('prices', help='Fetch and show current prices')
    p_prices.add_argument('--symbols', type=str,
                         help='Comma-separated symbols')
    p_prices.set_defaults(func=cmd_prices)
    
    # backtest command (statistical rigor!)
    p_backtest = subparsers.add_parser('backtest', 
        help='Run backtest with train/test split for statistical validation')
    p_backtest.add_argument('-s', '--symbols', type=str, default='bitcoin',
                           help='Comma-separated symbols (default: bitcoin)')
    p_backtest.add_argument('-d', '--days', type=int, default=90,
                           help='Days of historical data (default: 90)')
    p_backtest.add_argument('--train-ratio', type=float, default=0.6,
                           help='Fraction of data for training (default: 0.6)')
    p_backtest.set_defaults(func=cmd_backtest)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == '__main__':
    main()
