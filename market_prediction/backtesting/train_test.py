#!/usr/bin/env python3
"""
Train/Test Split Backtesting

The critical piece Boz was complaining about: we need out-of-sample
validation to know if our strategies are actually predictive or just
overfit to the training period.
"""

import sys
import os
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Direction, Magnitude, PricePoint, Database
from strategies.base import BaseStrategy, get_all_strategies
from backtesting.backtest import Backtester, BacktestSummary


@dataclass
class TrainTestResult:
    """Results from train/test split evaluation."""
    strategy: str
    train_summary: BacktestSummary
    test_summary: BacktestSummary
    
    @property
    def overfit_signal(self) -> float:
        """
        Difference between train and test accuracy.
        Positive = overfit (train > test)
        Negative = robust (test >= train)
        """
        return self.train_summary.direction_accuracy - self.test_summary.direction_accuracy
    
    @property
    def is_robust(self) -> bool:
        """Strategy is robust if test accuracy >= train accuracy - 5%"""
        return self.overfit_signal < 5.0


class TrainTestBacktester:
    """
    Backtester with proper train/test split.
    
    Train on first portion of data, validate on held-out portion.
    If performance degrades significantly on test, the strategy is overfit.
    """
    
    def __init__(self, db: Database, train_ratio: float = 0.7):
        """
        Args:
            db: Database connection
            train_ratio: Fraction of data to use for training (default 70%)
        """
        self.db = db
        self.backtester = Backtester(db)
        self.train_ratio = train_ratio
    
    def run(
        self,
        strategy: BaseStrategy,
        asset: str,
        start_date: datetime,
        end_date: datetime,
        prediction_interval_hours: int = 24
    ) -> TrainTestResult:
        """
        Run train/test split backtest.
        
        Args:
            strategy: Strategy to test
            asset: Asset to test on
            start_date: Start of entire period
            end_date: End of entire period
            prediction_interval_hours: Prediction frequency
            
        Returns:
            TrainTestResult with both train and test performance
        """
        # Calculate split point
        total_days = (end_date - start_date).days
        train_days = int(total_days * self.train_ratio)
        
        split_date = start_date + timedelta(days=train_days)
        
        # Run on train period
        _, train_summary = self.backtester.run(
            strategy=strategy,
            asset=asset,
            start_date=start_date,
            end_date=split_date,
            prediction_interval_hours=prediction_interval_hours
        )
        
        # Run on test period (out-of-sample)
        _, test_summary = self.backtester.run(
            strategy=strategy,
            asset=asset,
            start_date=split_date,
            end_date=end_date,
            prediction_interval_hours=prediction_interval_hours
        )
        
        return TrainTestResult(
            strategy=strategy.name,
            train_summary=train_summary,
            test_summary=test_summary
        )
    
    def run_all_strategies(
        self,
        asset: str,
        start_date: datetime,
        end_date: datetime,
        prediction_interval_hours: int = 24
    ) -> dict[str, TrainTestResult]:
        """Run train/test split for all strategies."""
        results = {}
        
        for strategy in get_all_strategies():
            result = self.run(
                strategy=strategy,
                asset=asset,
                start_date=start_date,
                end_date=end_date,
                prediction_interval_hours=prediction_interval_hours
            )
            results[strategy.name] = result
        
        return results
    
    def print_comparison(self, results: dict[str, TrainTestResult]):
        """Print train vs test comparison."""
        print("\n" + "=" * 85)
        print("TRAIN/TEST SPLIT RESULTS")
        print("=" * 85)
        
        if not results:
            print("No results to display.")
            return
        
        # Calculate split info from first result
        first = list(results.values())[0]
        train_days = (first.train_summary.end_date - first.train_summary.start_date).days
        test_days = (first.test_summary.end_date - first.test_summary.start_date).days
        
        print(f"Train period: {first.train_summary.start_date.date()} to {first.train_summary.end_date.date()} ({train_days} days)")
        print(f"Test period:  {first.test_summary.start_date.date()} to {first.test_summary.end_date.date()} ({test_days} days)")
        print()
        
        print(f"{'Strategy':<18} {'Train Dir%':>10} {'Test Dir%':>10} {'Δ':>8} {'Train Mag%':>10} {'Test Mag%':>10} {'Status':<10}")
        print("-" * 85)
        
        # Sort by test accuracy (what matters)
        sorted_results = sorted(
            results.items(),
            key=lambda x: x[1].test_summary.direction_accuracy,
            reverse=True
        )
        
        for name, result in sorted_results:
            train_dir = result.train_summary.direction_accuracy
            test_dir = result.test_summary.direction_accuracy
            delta = test_dir - train_dir
            train_mag = result.train_summary.magnitude_accuracy
            test_mag = result.test_summary.magnitude_accuracy
            
            status = "✓ ROBUST" if result.is_robust else "⚠ OVERFIT"
            delta_str = f"{delta:+.1f}%"
            
            print(
                f"{name:<18} {train_dir:>9.1f}% {test_dir:>9.1f}% {delta_str:>8} "
                f"{train_mag:>9.1f}% {test_mag:>9.1f}% {status:<10}"
            )
        
        print("-" * 85)
        print("\nKey:")
        print("  Train Dir% - Direction accuracy on training data (in-sample)")
        print("  Test Dir%  - Direction accuracy on test data (out-of-sample) ← THIS IS WHAT MATTERS")
        print("  Δ          - Difference (negative = better on test)")
        print("  ROBUST     - Test accuracy within 5% of train")
        print("  OVERFIT    - Test accuracy dropped significantly from train")


def main():
    """Run train/test split backtest."""
    db = Database("market_predictions.db")
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=60)
    
    # Check data availability
    prices = db.get_prices("bitcoin", start_date - timedelta(days=30), end_date)
    if len(prices) < 200:
        print("Not enough data. Run 'fetch --days 60' first.")
        db.close()
        return
    
    print(f"Running train/test split (70/30) from {start_date.date()} to {end_date.date()}")
    print(f"Data points available: {len(prices)}")
    
    backtester = TrainTestBacktester(db, train_ratio=0.7)
    
    results = backtester.run_all_strategies(
        asset="bitcoin",
        start_date=start_date,
        end_date=end_date,
        prediction_interval_hours=24
    )
    
    backtester.print_comparison(results)
    db.close()


if __name__ == "__main__":
    main()
