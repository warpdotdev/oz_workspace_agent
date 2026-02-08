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
from strategies.base import BaseStrategy, get_all_strategies, get_strategy, get_all_strategies_with_ensemble


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
        prediction_interval_hours: int = 24,
        track_performance: bool = False
    ) -> tuple[list[BacktestResult], BacktestSummary]:
        """
        Run a backtest for a strategy on historical data.
        
        Args:
            strategy: The strategy to test
            asset: Asset to test on
            start_date: Start of backtest period
            end_date: End of backtest period  
            prediction_interval_hours: How often to make predictions
            track_performance: If True and strategy is ensemble, track performance for weighting
            
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
        
        # Check if this is an ensemble strategy that needs performance tracking
        is_ensemble = hasattr(strategy, 'record_result') and hasattr(strategy, 'clear_history')
        if is_ensemble and track_performance:
            strategy.clear_history()
        
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
            
            # For ensemble strategies, also track constituent strategy performance
            if is_ensemble and track_performance:
                # Run constituent strategies and track their results
                for sub_strategy in strategy.strategies:
                    sub_pred = sub_strategy.predict(
                        asset=asset,
                        current_price=current_price,
                        price_history=history,
                        prediction_time=current_time
                    )
                    if sub_pred:
                        sub_result = self._verify_prediction(sub_pred, current_price, actual_price)
                        strategy.record_result(
                            sub_strategy.name,
                            current_time,
                            sub_result.direction_correct
                        )
            
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
        prediction_interval_hours: int = 24,
        include_ensemble: bool = False
    ) -> dict[str, BacktestSummary]:
        """
        Run backtest for all available strategies.
        
        Args:
            asset: Asset to test on
            start_date: Start of backtest period
            end_date: End of backtest period
            prediction_interval_hours: How often to make predictions
            include_ensemble: If True, also test ensemble strategies
        
        Returns:
            Dict mapping strategy name to summary
        """
        summaries = {}
        
        strategies = get_all_strategies_with_ensemble() if include_ensemble else get_all_strategies()
        
        for strategy in strategies:
            is_ensemble = hasattr(strategy, 'record_result')
            _, summary = self.run(
                strategy=strategy,
                asset=asset,
                start_date=start_date,
                end_date=end_date,
                prediction_interval_hours=prediction_interval_hours,
                track_performance=is_ensemble
            )
            summaries[strategy.name] = summary
            
        return summaries
    
    def run_multi_asset(
        self,
        assets: list[str],
        start_date: datetime,
        end_date: datetime,
        prediction_interval_hours: int = 24,
        include_ensemble: bool = False
    ) -> dict[str, dict[str, BacktestSummary]]:
        """
        Run backtest across multiple assets.
        
        This helps validate whether a strategy's edge replicates across different assets.
        
        Args:
            assets: List of assets to test
            start_date: Start of backtest period
            end_date: End of backtest period
            prediction_interval_hours: How often to make predictions
            include_ensemble: If True, also test ensemble strategies
            
        Returns:
            Nested dict: {asset: {strategy: summary}}
        """
        results = {}
        
        for asset in assets:
            results[asset] = self.run_all_strategies(
                asset=asset,
                start_date=start_date,
                end_date=end_date,
                prediction_interval_hours=prediction_interval_hours,
                include_ensemble=include_ensemble
            )
        
        return results
    
    def print_multi_asset_comparison(self, results: dict[str, dict[str, BacktestSummary]]):
        """
        Print comparison across assets to validate strategy edge replication.
        """
        print("\n" + "=" * 80)
        print("MULTI-ASSET BACKTEST RESULTS")
        print("=" * 80)
        
        if not results:
            print("No results to display.")
            return
        
        # Get all strategies
        all_strategies = set()
        for asset_results in results.values():
            all_strategies.update(asset_results.keys())
        
        # Print header
        assets = list(results.keys())
        header = f"{'Strategy':<22}"
        for asset in assets:
            header += f" {asset[:10]:>12}"
        header += f" {'Average':>12}"
        print(header)
        print("-" * 80)
        
        # Sort strategies by average accuracy
        strategy_avg = {}
        for strategy in all_strategies:
            accuracies = []
            for asset in assets:
                if strategy in results[asset]:
                    accuracies.append(results[asset][strategy].direction_accuracy)
            if accuracies:
                strategy_avg[strategy] = sum(accuracies) / len(accuracies)
            else:
                strategy_avg[strategy] = 0.0
        
        sorted_strategies = sorted(strategy_avg.items(), key=lambda x: x[1], reverse=True)
        
        for strategy, avg in sorted_strategies:
            row = f"{strategy:<22}"
            for asset in assets:
                if strategy in results[asset]:
                    acc = results[asset][strategy].direction_accuracy
                    row += f" {acc:>11.1f}%"
                else:
                    row += f" {'N/A':>12}"
            row += f" {avg:>11.1f}%"
            print(row)
        
        print("-" * 80)
        
        # Check for edge replication
        print("\nEdge Replication Analysis:")
        random_avg = strategy_avg.get('random', 50.0)
        
        for strategy, avg in sorted_strategies:
            if strategy == 'random':
                continue
            
            # Check if strategy beats random consistently
            beats_random_count = 0
            for asset in assets:
                if strategy in results[asset] and 'random' in results[asset]:
                    if results[asset][strategy].direction_accuracy > results[asset]['random'].direction_accuracy:
                        beats_random_count += 1
            
            if beats_random_count == len(assets):
                print(f"  ✓ {strategy}: Beats random on ALL assets (+{avg - random_avg:.1f}% avg edge)")
            elif beats_random_count > len(assets) / 2:
                print(f"  ~ {strategy}: Beats random on {beats_random_count}/{len(assets)} assets")
            else:
                print(f"  ✗ {strategy}: Inconsistent - only beats random on {beats_random_count}/{len(assets)} assets")
    
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
