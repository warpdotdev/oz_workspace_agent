#!/usr/bin/env python3
"""
Market Prediction Engine - Main Runner

Orchestrates the entire prediction workflow:
1. Fetch latest price data
2. Run all strategies to generate predictions
3. Verify past predictions
4. Report results

Can run as:
- One-shot: python runner.py
- Scheduled: python runner.py --schedule
"""

import argparse
import time
import schedule
from datetime import date, datetime, timedelta
from typing import List

from storage.models import Database
from data.coingecko import DataIngestionService, DEFAULT_COINS
from strategies.base import ALL_STRATEGIES
from verification.engine import VerificationEngine


class PredictionRunner:
    """Orchestrates the prediction workflow"""
    
    def __init__(self, db_path: str = "market_predictions.db", 
                 symbols: List[str] = None):
        self.db_path = db_path
        self.symbols = symbols or DEFAULT_COINS[:3]  # Default to top 3
    
    def run_daily_workflow(self, days_ahead: int = 1):
        """
        Run the complete daily workflow:
        1. Verify yesterday's predictions
        2. Fetch fresh data
        3. Generate tomorrow's predictions
        """
        print(f"\n{'='*60}")
        print(f"🔮 Market Prediction Engine - Daily Run")
        print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        db = Database(self.db_path)
        data_service = DataIngestionService(db)
        verification_engine = VerificationEngine(db, data_service)
        
        # Step 1: Verify past predictions
        print("\n📋 Step 1: Verifying past predictions...")
        verified = verification_engine.verify_all_pending()
        if verified:
            correct = sum(1 for _, r in verified if r.direction_correct)
            print(f"   Verified {len(verified)} predictions ({correct} correct)")
        else:
            print("   No predictions to verify")
        
        # Step 2: Fetch current data
        print("\n📊 Step 2: Fetching market data...")
        data_service.fetch_and_store_current_prices(self.symbols)
        for symbol in self.symbols:
            data_service.fetch_and_store_historical(symbol, days=30)
        print(f"   Updated data for: {', '.join(self.symbols)}")
        
        # Step 3: Generate predictions
        target_date = date.today() + timedelta(days=days_ahead)
        print(f"\n🔮 Step 3: Generating predictions for {target_date}...")
        predictions_made = self._generate_predictions(db, target_date)
        print(f"   Generated {predictions_made} predictions")
        
        # Step 4: Print summary
        print("\n📈 Current Leaderboard:")
        verification_engine.print_leaderboard(days=30)
        
        db.close()
        print(f"\n✅ Daily run complete!")
        return predictions_made
    
    def _generate_predictions(self, db: Database, target_date: date) -> int:
        """Generate predictions for all symbols and strategies"""
        predictions_made = 0
        
        for symbol in self.symbols:
            latest = db.get_latest_price(symbol)
            if not latest:
                print(f"   ⚠️ No price data for {symbol}")
                continue
            
            current_price = latest.price_usd
            
            # Get price history
            start = datetime.now() - timedelta(days=60)
            end = datetime.now()
            history = db.get_prices(symbol, start, end)
            
            print(f"\n   {symbol.upper()} (${current_price:,.2f})")
            
            for strategy in ALL_STRATEGIES:
                output = strategy.predict(symbol, current_price, history, target_date)
                
                prediction = strategy.to_prediction_record(
                    symbol, current_price, output, target_date
                )
                db.insert_prediction(prediction)
                predictions_made += 1
                
                arrow = "📈" if output.direction.value == "up" else "📉" if output.direction.value == "down" else "➡️"
                print(f"     {strategy.name:<18} {arrow} {output.direction.value} "
                      f"{output.magnitude.value} ({output.confidence:.0%})")
        
        return predictions_made
    
    def run_scheduled(self, run_time: str = "00:00"):
        """
        Run the prediction workflow on a schedule.
        
        Args:
            run_time: Time to run daily (24h format, e.g., "00:00")
        """
        print(f"\n🕐 Scheduling daily run at {run_time}")
        print(f"   Press Ctrl+C to stop\n")
        
        # Schedule daily run
        schedule.every().day.at(run_time).do(self.run_daily_workflow)
        
        # Also run immediately on start
        print("Running initial workflow...")
        self.run_daily_workflow()
        
        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def backfill_and_simulate(self, days: int = 30):
        """
        Backfill data and simulate predictions for past dates.
        Useful for building initial track record.
        """
        print(f"\n🔄 Backfilling {days} days of predictions...")
        
        db = Database(self.db_path)
        data_service = DataIngestionService(db)
        
        # Backfill historical data
        print("Fetching historical data...")
        data_service.backfill_all_coins(self.symbols, days=days + 30)
        
        # Generate predictions for each past day
        today = date.today()
        predictions_made = 0
        
        for i in range(days, 0, -1):
            prediction_date = today - timedelta(days=i)
            target_date = prediction_date + timedelta(days=1)
            
            print(f"\nSimulating predictions for {prediction_date} → {target_date}")
            
            for symbol in self.symbols:
                # Get price as of prediction date
                pred_datetime = datetime.combine(prediction_date, datetime.min.time())
                price = data_service.get_price_on_date(symbol, pred_datetime)
                
                if not price:
                    continue
                
                # Get historical data up to prediction date
                start = pred_datetime - timedelta(days=60)
                history = db.get_prices(symbol, start, pred_datetime)
                
                for strategy in ALL_STRATEGIES:
                    output = strategy.predict(symbol, price, history, target_date)
                    
                    from storage.models import Prediction
                    prediction = Prediction(
                        id=None,
                        strategy_name=strategy.name,
                        symbol=symbol,
                        prediction_date=prediction_date,
                        target_date=target_date,
                        direction=output.direction,
                        magnitude=output.magnitude,
                        confidence=output.confidence,
                        price_at_prediction=price,
                        predicted_price=output.predicted_price
                    )
                    db.insert_prediction(prediction)
                    predictions_made += 1
        
        print(f"\n✅ Generated {predictions_made} historical predictions")
        
        # Now verify them
        print("\nVerifying historical predictions...")
        engine = VerificationEngine(db, data_service)
        verified = engine.verify_all_pending()
        print(f"Verified {len(verified)} predictions")
        
        # Show results
        engine.print_leaderboard(days=days)
        
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description='Market Prediction Engine Runner'
    )
    
    parser.add_argument('--db', default='market_predictions.db',
                       help='Database file path')
    parser.add_argument('--symbols', type=str,
                       help='Comma-separated symbols to predict')
    parser.add_argument('--schedule', action='store_true',
                       help='Run on schedule (daily)')
    parser.add_argument('--time', default='00:00',
                       help='Time to run daily (when using --schedule)')
    parser.add_argument('--backfill', type=int, metavar='DAYS',
                       help='Backfill N days of historical predictions')
    
    args = parser.parse_args()
    
    symbols = args.symbols.split(',') if args.symbols else None
    runner = PredictionRunner(db_path=args.db, symbols=symbols)
    
    if args.backfill:
        runner.backfill_and_simulate(days=args.backfill)
    elif args.schedule:
        runner.run_scheduled(run_time=args.time)
    else:
        runner.run_daily_workflow()


if __name__ == '__main__':
    main()
