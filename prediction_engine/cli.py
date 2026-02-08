#!/usr/bin/env python3
"""
Market Prediction Engine - CLI

Commands:
  predict  - Make new predictions for all strategies
  verify   - Check and verify past predictions
  status   - Show current strategy standings
  history  - Show prediction history
  run      - Start dashboard server
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from tabulate import tabulate

sys.path.insert(0, str(Path(__file__).parent))

from data.models import init_db, get_session, Prediction, Outcome, StrategyStats
from orchestrator import PredictionOrchestrator
from verification import PredictionVerifier


def cmd_predict(args):
    """Make new predictions."""
    print("🚀 Market Prediction Engine - Making Predictions")
    print("=" * 60)
    
    symbols = args.symbols.split(",") if args.symbols else None
    orchestrator = PredictionOrchestrator(symbols=symbols)
    orchestrator.run_prediction_cycle()


def cmd_verify(args):
    """Verify pending predictions."""
    print("🔍 Market Prediction Engine - Verification")
    print("=" * 60)
    
    verifier = PredictionVerifier()
    verifier.verify_pending_predictions()
    
    print("\n📊 Summary:")
    summary = verifier.get_verification_summary()
    print(f"  Total predictions: {summary['total_predictions']}")
    print(f"  Verified: {summary['verified']}")
    print(f"  Pending: {summary['pending']}")
    if summary['verified'] > 0:
        print(f"  Direction accuracy: {summary['direction_accuracy']:.1%}")
        print(f"  Magnitude accuracy: {summary['magnitude_accuracy']:.1%}")


def cmd_status(args):
    """Show current strategy standings."""
    print("📊 Market Prediction Engine - Strategy Leaderboard")
    print("=" * 60)
    
    verifier = PredictionVerifier()
    strategies = verifier.get_strategy_performance()
    
    if not strategies:
        print("\nNo strategies with verified predictions yet.")
        print("Run 'predict' to make predictions, then 'verify' after 24 hours.")
        return
    
    # Create leaderboard table
    headers = ["Rank", "Strategy", "Predictions", "Verified", "Direction", "Magnitude", "Combined"]
    rows = []
    
    for i, s in enumerate(strategies, 1):
        rows.append([
            f"#{i}",
            s["name"],
            s["total_predictions"],
            s["verified"],
            f"{s['direction_accuracy']:.1%}" if s["verified"] > 0 else "-",
            f"{s['magnitude_accuracy']:.1%}" if s["verified"] > 0 else "-",
            f"{s['combined_accuracy']:.1%}" if s["verified"] > 0 else "-"
        ])
    
    print("\n" + tabulate(rows, headers=headers, tablefmt="simple"))
    
    # Also show strategies without verified predictions
    session = get_session()
    try:
        all_stats = session.query(StrategyStats).all()
        unverified = [s for s in all_stats if s.verified_predictions == 0 and s.total_predictions > 0]
        if unverified:
            print("\n📋 Strategies awaiting verification:")
            for s in unverified:
                print(f"  • {s.name}: {s.total_predictions} predictions pending")
    finally:
        session.close()


def cmd_history(args):
    """Show prediction history."""
    print("📜 Market Prediction Engine - Prediction History")
    print("=" * 60)
    
    session = get_session()
    try:
        query = session.query(Prediction).order_by(Prediction.prediction_time.desc())
        
        if args.symbol:
            query = query.filter(Prediction.symbol == args.symbol.lower())
        
        if args.strategy:
            query = query.filter(Prediction.strategy_name == args.strategy)
        
        limit = args.limit or 20
        predictions = query.limit(limit).all()
        
        if not predictions:
            print("\nNo predictions found.")
            return
        
        headers = ["Time", "Symbol", "Strategy", "Prediction", "Conf", "Result"]
        rows = []
        
        for p in predictions:
            pred_str = f"{p.predicted_direction.value} {p.predicted_magnitude.value}"
            
            if p.outcome:
                result = "✅" if p.outcome.direction_correct else "❌"
                result += f" ({p.outcome.actual_price_change_pct:+.1f}%)"
            else:
                now = datetime.utcnow()
                if p.target_time > now:
                    hours_left = (p.target_time - now).total_seconds() / 3600
                    result = f"⏳ {hours_left:.0f}h"
                else:
                    result = "⏳ pending"
            
            rows.append([
                p.prediction_time.strftime("%m/%d %H:%M"),
                p.symbol,
                p.strategy_name,
                pred_str,
                f"{p.confidence:.0%}",
                result
            ])
        
        print("\n" + tabulate(rows, headers=headers, tablefmt="simple"))
        
        total = session.query(Prediction).count()
        if total > limit:
            print(f"\n(Showing {limit} of {total} predictions. Use --limit to see more)")
    
    finally:
        session.close()


def cmd_run(args):
    """Start the web dashboard."""
    print("🌐 Starting Market Prediction Dashboard...")
    print("=" * 60)
    
    try:
        from dashboard.app import create_app
        app = create_app()
        
        port = args.port or 5000
        print(f"\n🚀 Dashboard running at http://localhost:{port}")
        print("Press Ctrl+C to stop\n")
        
        app.run(host="0.0.0.0", port=port, debug=args.debug)
    except ImportError as e:
        print(f"❌ Could not start dashboard: {e}")
        print("Make sure Flask is installed: pip install flask")


def cmd_init(args):
    """Initialize the database."""
    print("🔧 Initializing database...")
    init_db()
    print("✅ Database initialized!")


def main():
    parser = argparse.ArgumentParser(
        description="Market Prediction Engine - Predict crypto prices with multiple strategies",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s predict                    Make predictions for default coins
  %(prog)s predict -s bitcoin,dogecoin   Make predictions for specific coins
  %(prog)s verify                     Verify past predictions
  %(prog)s status                     Show strategy leaderboard
  %(prog)s history                    Show prediction history
  %(prog)s history -n 50              Show last 50 predictions
  %(prog)s run                        Start web dashboard
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # predict command
    predict_parser = subparsers.add_parser("predict", help="Make new predictions")
    predict_parser.add_argument("-s", "--symbols", help="Comma-separated coin symbols (default: bitcoin,ethereum,solana)")
    predict_parser.set_defaults(func=cmd_predict)
    
    # verify command
    verify_parser = subparsers.add_parser("verify", help="Verify pending predictions")
    verify_parser.set_defaults(func=cmd_verify)
    
    # status command
    status_parser = subparsers.add_parser("status", help="Show strategy leaderboard")
    status_parser.set_defaults(func=cmd_status)
    
    # history command
    history_parser = subparsers.add_parser("history", help="Show prediction history")
    history_parser.add_argument("--symbol", help="Filter by symbol")
    history_parser.add_argument("--strategy", help="Filter by strategy")
    history_parser.add_argument("-n", "--limit", type=int, help="Number of predictions to show")
    history_parser.set_defaults(func=cmd_history)
    
    # run command
    run_parser = subparsers.add_parser("run", help="Start web dashboard")
    run_parser.add_argument("-p", "--port", type=int, default=5000, help="Port to run on")
    run_parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    run_parser.set_defaults(func=cmd_run)
    
    # init command
    init_parser = subparsers.add_parser("init", help="Initialize database")
    init_parser.set_defaults(func=cmd_init)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
