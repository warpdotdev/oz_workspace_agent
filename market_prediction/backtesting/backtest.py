#!/usr/bin/env python3
"""
Backtesting Harness

Test prediction strategies against historical data.
This is critical - we can't verify a prediction system by waiting for tomorrow.
"""

import sys
import os
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Direction, Magnitude, PricePoint, Prediction, Database
from strategies.base import BaseStrategy, get_all_strategies, get_strategy


@dataclass
class BacktestResult:
    """Result of a single backtest prediction."""
    prediction: Prediction
    actual_price: float
    actual_direction: Direction
    actual_magnitude: Magnitude
    direction_correct: bool
    magnitude_correct: bool


@dataclass
class BacktestSummary:
    """Summary statistics for a backtest run."""
    strategy: str
    asset: str
    total_predictions: int
    direction_correct: int
    magnitude_correct: int
    start_date: datetime
    end_date: datetime
    
    @property
    def direction_accuracy(self) -> float:
        if self.total_predictions == 0:
            return 0.0
        return (self.direction_correct / self.total_predictions) * 100
    
    @property
    def magnitude_accuracy(self) -> float:
        if self.total_predictions == 0:
            return 0.0
        return (self.magnitude_correct / self.total_predictions) * 100
    
    def to_dict(self) -> dict:
        return {
            "strategy": self.strategy,
            "asset": self.asset,
            "total_predictions": self.total_predictions,
            "direction_correct": self.direction_correct,
            "direction_accuracy": round(self.direction_accuracy, 2),
            "magnitude_correct": self.magnitude_correct,
            "magnitude_accuracy": round(self.magnitude_accuracy, 2),
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
        }


class Backtester:
    """
    Backtest prediction strategies against historical data.
    
    The key insight: we simulate making predictions at each historical point
    and immediately verify against the actual outcome (which we already have).
    """
    
    def __init__(self, db: Database):
        self.db = db
    
    def run(
        self,
        strategy: BaseStrategy,
        asset: str,
        start_date: datetime,
        end_date: datetime,
        prediction_interval_hours: int = 24
    ) -> tuple[list[BacktestResult], BacktestSummary]:
        """
        Run a backtest for a strategy on historical data.
        
        Args:
            strategy: The strategy to test
            asset: Asset to test on
            start_date: Start of backtest period
            end_date: End of backtest period  
            prediction_interval_hours: How often to make predictions
            
        Returns:
            Tuple of (list of individual results, summary statistics)
        """
        # Load all historical prices for the period
        # We need extra history before start_date for strategy lookback
        lookback_start = start_date - timedelta(days=30)
        all_prices = self.db.get_prices(asset, lookback_start, end_date)
        
        if len(all_prices) < 48:  # Need at least 2 days of hourly data
            return [], BacktestSummary(
                strategy=strategy.name,
                asset=asset,
                total_predictions=0,
                direction_correct=0,
                magnitude_correct=0,
                start_date=start_date,
                end_date=end_date
            )
        
        results = []
        current_time = start_date
        
        while current_time + timedelta(hours=24) <= end_date:
            # Get price history up to current_time
            history = [p for p in all_prices if p.timestamp <= current_time]
            
            if not history:
                current_time += timedelta(hours=prediction_interval_hours)
                continue
            
            current_price = history[-1].price_usd
            
            # Make prediction
            prediction = strategy.predict(
                asset=asset,
                current_price=current_price,
                price_history=history,
                prediction_time=current_time
            )
            
            if prediction is None:
                current_time += timedelta(hours=prediction_interval_hours)
                continue
            
            # Find actual price 24 hours later
            target_time = current_time + timedelta(hours=24)
            future_prices = [p for p in all_prices 
                           if target_time - timedelta(hours=2) <= p.timestamp <= target_time + timedelta(hours=2)]
            
            if not future_prices:
                current_time += timedelta(hours=prediction_interval_hours)
                continue
            
            # Get closest price to target time
            actual_price = min(future_prices, key=lambda p: abs((p.timestamp - target_time).total_seconds())).price_usd
            
            # Verify prediction
            result = self._verify_prediction(prediction, current_price, actual_price)
            results.append(result)
            
            current_time += timedelta(hours=prediction_interval_hours)
        
        # Calculate summary
        summary = BacktestSummary(
            strategy=strategy.name,
            asset=asset,
            total_predictions=len(results),
            direction_correct=sum(1 for r in results if r.direction_correct),
            magnitude_correct=sum(1 for r in results if r.magnitude_correct),
            start_date=start_date,
            end_date=end_date
        )
        
        return results, summary
    
    def _verify_prediction(
        self,
        prediction: Prediction,
        start_price: float,
        end_price: float
    ) -> BacktestResult:
        """Verify a prediction against actual outcome."""
        # Calculate actual change
        pct_change = ((end_price - start_price) / start_price) * 100
        
        actual_direction = Direction.UP if pct_change >= 0 else Direction.DOWN
        actual_magnitude = Magnitude.from_percentage(pct_change)
        
        return BacktestResult(
            prediction=prediction,
            actual_price=end_price,
            actual_direction=actual_direction,
            actual_magnitude=actual_magnitude,
            direction_correct=prediction.direction == actual_direction,
            magnitude_correct=prediction.magnitude == actual_magnitude
        )
    
    def run_all_strategies(
        self,
        asset: str,
        start_date: datetime,
        end_date: datetime,
        prediction_interval_hours: int = 24
    ) -> dict[str, BacktestSummary]:
        """
        Run backtest for all available strategies.
        
        Returns:
            Dict mapping strategy name to summary
        """
        summaries = {}
        
        for strategy in get_all_strategies():
            _, summary = self.run(
                strategy=strategy,
                asset=asset,
                start_date=start_date,
                end_date=end_date,
                prediction_interval_hours=prediction_interval_hours
            )
            summaries[strategy.name] = summary
            
        return summaries
    
    def print_comparison(self, summaries: dict[str, BacktestSummary]):
        """Print a comparison table of strategy performance."""
        print("\n" + "=" * 70)
        print("BACKTEST RESULTS")
        print("=" * 70)
        
        if not summaries:
            print("No results to display.")
            return
        
        # Sort by direction accuracy
        sorted_strategies = sorted(
            summaries.items(),
            key=lambda x: x[1].direction_accuracy,
            reverse=True
        )
        
        print(f"{'Strategy':<20} {'Predictions':>12} {'Dir Acc':>10} {'Mag Acc':>10}")
        print("-" * 70)
        
        for name, summary in sorted_strategies:
            print(
                f"{name:<20} {summary.total_predictions:>12} "
                f"{summary.direction_accuracy:>9.1f}% {summary.magnitude_accuracy:>9.1f}%"
            )
        
        print("-" * 70)
        
        # Highlight if any beat random
        random_summary = summaries.get("random")
        if random_summary and random_summary.direction_accuracy > 0:
            print("\nStrategies beating random baseline (50% expected):")
            for name, summary in sorted_strategies:
                if name != "random" and summary.direction_accuracy > random_summary.direction_accuracy:
                    diff = summary.direction_accuracy - random_summary.direction_accuracy
                    print(f"  ✓ {name}: +{diff:.1f}% over random")


    def run_train_test_split(
        self,
        asset: str,
        total_days: int = 60,
        train_ratio: float = 0.67,
        prediction_interval_hours: int = 24
    ) -> dict[str, dict]:
        """
        Run backtest with train/test split validation.
        
        This is critical for detecting overfitting:
        - Train period: optimize/observe strategy behavior
        - Test period: validate on unseen data
        
        Args:
            asset: Asset to test
            total_days: Total days of data to use
            train_ratio: Fraction of data for training (default: 67%)
            prediction_interval_hours: How often to make predictions
            
        Returns:
            Dict with train and test results for each strategy
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=total_days)
        
        # Calculate split point
        split_days = int(total_days * train_ratio)
        split_date = start_date + timedelta(days=split_days)
        
        results = {}
        
        for strategy in get_all_strategies():
            # Run on training period
            _, train_summary = self.run(
                strategy=strategy,
                asset=asset,
                start_date=start_date,
                end_date=split_date,
                prediction_interval_hours=prediction_interval_hours
            )
            
            # Run on test period (out-of-sample)
            _, test_summary = self.run(
                strategy=strategy,
                asset=asset,
                start_date=split_date,
                end_date=end_date,
                prediction_interval_hours=prediction_interval_hours
            )
            
            results[strategy.name] = {
                "train": train_summary,
                "test": test_summary,
                "overfit_detected": self._detect_overfit(train_summary, test_summary)
            }
        
        return results
    
    def _detect_overfit(self, train: BacktestSummary, test: BacktestSummary) -> bool:
        """
        Detect potential overfitting by comparing train vs test performance.
        
        Returns True if:
        - Train accuracy is significantly better than test (>10% drop)
        - Test accuracy is at or below random chance (50%)
        """
        if train.total_predictions == 0 or test.total_predictions == 0:
            return False
        
        accuracy_drop = train.direction_accuracy - test.direction_accuracy
        test_below_random = test.direction_accuracy <= 50.0
        
        return accuracy_drop > 10.0 or (train.direction_accuracy > 55.0 and test_below_random)
    
    def print_train_test_comparison(self, results: dict[str, dict]):
        """Print comparison of train vs test performance."""
        print("\n" + "=" * 80)
        print("TRAIN/TEST SPLIT VALIDATION")
        print("=" * 80)
        print("\nThis validates out-of-sample performance. Overfit = train looks good but test fails.")
        print()
        print(f"{'Strategy':<18} {'Train Acc':>10} {'Test Acc':>10} {'Δ':>8} {'Status':>12}")
        print("-" * 80)
        
        for name, data in sorted(results.items(), key=lambda x: x[1]['test'].direction_accuracy, reverse=True):
            train_acc = data['train'].direction_accuracy
            test_acc = data['test'].direction_accuracy
            delta = test_acc - train_acc
            
            if data['overfit_detected']:
                status = "⚠️  OVERFIT"
            elif test_acc > 52.0:  # Need > 52% to have meaningful edge with this sample size
                status = "✓ SIGNAL?"
            else:
                status = "✗ NO EDGE"
            
            print(
                f"{name:<18} "
                f"{train_acc:>9.1f}% "
                f"{test_acc:>9.1f}% "
                f"{delta:>+7.1f}% "
                f"{status:>12}"
            )
        
        print("-" * 80)
        print("\nKey: Test Acc > 52% with stable or improving delta = potential real edge")


def main():
    """Run a quick backtest demo."""
    db = Database("market_predictions.db")
    backtester = Backtester(db)
    
    # Check if we have data
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    prices = db.get_prices("bitcoin", start_date - timedelta(days=30), end_date)
    
    if len(prices) < 100:
        print("Not enough data for backtest. Run 'fetch' command first to get historical data.")
        db.close()
        return
    
    print(f"Running backtest from {start_date.date()} to {end_date.date()}")
    print(f"Data points available: {len(prices)}")
    
    # Run all strategies
    summaries = backtester.run_all_strategies(
        asset="bitcoin",
        start_date=start_date,
        end_date=end_date,
        prediction_interval_hours=24
    )
    
    backtester.print_comparison(summaries)
    db.close()


if __name__ == "__main__":
    main()
