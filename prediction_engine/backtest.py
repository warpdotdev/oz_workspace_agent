#!/usr/bin/env python3
"""
Backtest Module - Statistical Rigor Edition

This module provides proper backtesting with:
1. Train/test split for out-of-sample validation
2. Statistical significance testing (p-values)
3. Multiple timeframe analysis
4. Per-strategy performance breakdown

Because 55% on n=102 is NOT signal until proven otherwise.
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
import math
import random

sys.path.insert(0, str(Path(__file__).parent))

from data.coingecko_client import get_client, HistoricalPrice
from data.models import Direction, Magnitude, get_direction_from_pct, get_magnitude_from_pct
from strategies import get_all_strategies, PredictionStrategy
from strategies.base import PredictionResult


@dataclass
class BacktestPrediction:
    """A single prediction made during backtesting."""
    strategy_name: str
    symbol: str
    prediction_time: datetime
    target_time: datetime
    predicted_direction: Direction
    predicted_magnitude: Magnitude
    confidence: float
    price_at_prediction: float
    actual_direction: Optional[Direction] = None
    actual_magnitude: Optional[Magnitude] = None
    actual_price: Optional[float] = None
    actual_change_pct: Optional[float] = None
    direction_correct: Optional[bool] = None
    magnitude_correct: Optional[bool] = None


@dataclass
class StrategyBacktestResult:
    """Aggregated backtest results for a single strategy."""
    name: str
    predictions: List[BacktestPrediction] = field(default_factory=list)
    
    @property
    def total(self) -> int:
        return len(self.predictions)
    
    @property
    def correct_direction(self) -> int:
        return sum(1 for p in self.predictions if p.direction_correct)
    
    @property
    def correct_magnitude(self) -> int:
        return sum(1 for p in self.predictions if p.magnitude_correct)
    
    @property
    def direction_accuracy(self) -> float:
        return self.correct_direction / self.total if self.total > 0 else 0.0
    
    @property
    def magnitude_accuracy(self) -> float:
        return self.correct_magnitude / self.total if self.total > 0 else 0.0
    
    def calculate_p_value(self, baseline: float = 0.5) -> float:
        """
        Calculate p-value using binomial test.
        
        Null hypothesis: strategy accuracy = baseline (random chance)
        Alternative: strategy accuracy > baseline
        
        Returns the probability of seeing this many correct predictions
        (or more) by random chance.
        """
        if self.total == 0:
            return 1.0
        
        n = self.total
        k = self.correct_direction
        p = baseline
        
        # One-tailed binomial test: P(X >= k)
        # Using normal approximation for large n
        if n >= 30:
            # Normal approximation
            mean = n * p
            std = math.sqrt(n * p * (1 - p))
            if std == 0:
                return 1.0
            z = (k - mean - 0.5) / std  # continuity correction
            # P(Z >= z) using complementary error function approximation
            p_value = 0.5 * math.erfc(z / math.sqrt(2))
        else:
            # Exact binomial for small n
            p_value = 0.0
            for i in range(k, n + 1):
                # C(n, i) * p^i * (1-p)^(n-i)
                coeff = math.comb(n, i)
                p_value += coeff * (p ** i) * ((1 - p) ** (n - i))
        
        return p_value
    
    def get_significance_level(self) -> str:
        """Return human-readable significance level."""
        p = self.calculate_p_value()
        if p < 0.001:
            return "***"  # p < 0.001
        elif p < 0.01:
            return "**"   # p < 0.01
        elif p < 0.05:
            return "*"    # p < 0.05
        elif p < 0.1:
            return "."    # p < 0.1
        else:
            return ""     # not significant


@dataclass
class BacktestResult:
    """Complete backtest results across all strategies."""
    symbol: str
    start_date: datetime
    end_date: datetime
    train_cutoff: datetime  # Date separating train/test
    strategies: Dict[str, StrategyBacktestResult] = field(default_factory=dict)
    
    # Separate train/test results
    train_results: Dict[str, StrategyBacktestResult] = field(default_factory=dict)
    test_results: Dict[str, StrategyBacktestResult] = field(default_factory=dict)


class Backtester:
    """
    Runs backtests with proper train/test splits.
    
    Key features:
    - No look-ahead bias: predictions only use data available at prediction time
    - Train/test split: validate out-of-sample
    - Statistical significance: calculate p-values
    """
    
    def __init__(self, prediction_horizon_hours: int = 24):
        self.prediction_horizon = timedelta(hours=prediction_horizon_hours)
        self.client = get_client()
        self.strategies = get_all_strategies()
    
    def run_backtest(
        self, 
        symbol: str = "bitcoin",
        days: int = 90,
        train_ratio: float = 0.6,  # 60% train, 40% test
        verbose: bool = True
    ) -> BacktestResult:
        """
        Run a full backtest with train/test split.
        
        Args:
            symbol: Asset to backtest (CoinGecko ID)
            days: Number of days of historical data
            train_ratio: Proportion of data for training
            verbose: Print progress
        
        Returns:
            BacktestResult with train/test breakdown
        """
        if verbose:
            print(f"\n🔬 Running backtest for {symbol.upper()}")
            print(f"   Data: {days} days | Train/Test: {train_ratio:.0%}/{1-train_ratio:.0%}")
            print("=" * 60)
        
        # Fetch historical data
        if verbose:
            print("📥 Fetching historical data...")
        
        historical = self.client.get_historical_prices(symbol, days=days)
        
        if len(historical) < 30:
            raise ValueError(f"Insufficient data: got {len(historical)} points, need at least 30")
        
        if verbose:
            print(f"   Got {len(historical)} price points")
        
        # Calculate train/test split
        train_size = int(len(historical) * train_ratio)
        train_cutoff_idx = train_size
        train_cutoff = historical[train_cutoff_idx].timestamp
        
        # Initialize results
        result = BacktestResult(
            symbol=symbol,
            start_date=historical[0].timestamp,
            end_date=historical[-1].timestamp,
            train_cutoff=train_cutoff
        )
        
        for strategy in self.strategies:
            result.strategies[strategy.name] = StrategyBacktestResult(name=strategy.name)
            result.train_results[strategy.name] = StrategyBacktestResult(name=strategy.name)
            result.test_results[strategy.name] = StrategyBacktestResult(name=strategy.name)
        
        # Run predictions through time (no look-ahead bias)
        # We need at least 21 days of data before making predictions (for SMA-21)
        min_history = 21
        
        if verbose:
            print("🔄 Simulating predictions...")
        
        predictions_made = 0
        
        for i in range(min_history, len(historical) - 1):
            # Current point in time
            current_data = historical[:i + 1]  # Data available at this point
            current_price = current_data[-1].price
            current_time = current_data[-1].timestamp
            
            # Target time (24 hours ahead)
            target_time = current_time + self.prediction_horizon
            
            # Find actual price at target time
            actual_price = None
            for j in range(i + 1, len(historical)):
                if historical[j].timestamp >= target_time:
                    actual_price = historical[j].price
                    break
            
            if actual_price is None:
                continue  # Not enough future data for this prediction
            
            # Calculate actual outcome
            actual_change_pct = ((actual_price - current_price) / current_price) * 100
            actual_direction = get_direction_from_pct(actual_change_pct)
            actual_magnitude = get_magnitude_from_pct(actual_change_pct)
            
            # Determine if this is train or test period
            is_train = i < train_cutoff_idx
            
            # Run each strategy
            for strategy in self.strategies:
                try:
                    prediction_result = strategy.predict(
                        symbol=symbol,
                        current_price=current_price,
                        historical_prices=current_data
                    )
                    
                    if prediction_result is None:
                        continue
                    
                    # Create backtest prediction record
                    bt_pred = BacktestPrediction(
                        strategy_name=strategy.name,
                        symbol=symbol,
                        prediction_time=current_time,
                        target_time=target_time,
                        predicted_direction=prediction_result.direction,
                        predicted_magnitude=prediction_result.magnitude,
                        confidence=prediction_result.confidence,
                        price_at_prediction=current_price,
                        actual_direction=actual_direction,
                        actual_magnitude=actual_magnitude,
                        actual_price=actual_price,
                        actual_change_pct=actual_change_pct,
                        direction_correct=(prediction_result.direction == actual_direction),
                        magnitude_correct=(prediction_result.magnitude == actual_magnitude)
                    )
                    
                    # Add to results
                    result.strategies[strategy.name].predictions.append(bt_pred)
                    
                    if is_train:
                        result.train_results[strategy.name].predictions.append(bt_pred)
                    else:
                        result.test_results[strategy.name].predictions.append(bt_pred)
                    
                    predictions_made += 1
                    
                except Exception as e:
                    if verbose:
                        print(f"   ⚠️ {strategy.name} failed at {current_time}: {e}")
        
        if verbose:
            print(f"   Made {predictions_made} total predictions")
        
        return result
    
    def print_results(self, result: BacktestResult, show_train_test: bool = True):
        """Pretty print backtest results with statistical analysis."""
        print(f"\n{'='*70}")
        print(f"📊 BACKTEST RESULTS: {result.symbol.upper()}")
        print(f"{'='*70}")
        print(f"Period: {result.start_date.date()} to {result.end_date.date()}")
        print(f"Train/Test cutoff: {result.train_cutoff.date()}")
        
        # Overall results
        print(f"\n{'─'*70}")
        print("📈 OVERALL PERFORMANCE (all data)")
        print(f"{'─'*70}")
        print(f"{'Strategy':<20} {'N':>6} {'Accuracy':>10} {'P-value':>10} {'Sig':>5}")
        print(f"{'─'*70}")
        
        sorted_strategies = sorted(
            result.strategies.values(),
            key=lambda s: s.direction_accuracy,
            reverse=True
        )
        
        for s in sorted_strategies:
            sig = s.get_significance_level()
            p_val = s.calculate_p_value()
            print(f"{s.name:<20} {s.total:>6} {s.direction_accuracy:>9.1%} {p_val:>10.4f} {sig:>5}")
        
        if show_train_test:
            # Train results
            print(f"\n{'─'*70}")
            print("🎯 TRAIN SET (in-sample)")
            print(f"{'─'*70}")
            print(f"{'Strategy':<20} {'N':>6} {'Accuracy':>10} {'P-value':>10} {'Sig':>5}")
            print(f"{'─'*70}")
            
            for s_name in [s.name for s in sorted_strategies]:
                s = result.train_results[s_name]
                if s.total == 0:
                    continue
                sig = s.get_significance_level()
                p_val = s.calculate_p_value()
                print(f"{s.name:<20} {s.total:>6} {s.direction_accuracy:>9.1%} {p_val:>10.4f} {sig:>5}")
            
            # Test results (this is what matters!)
            print(f"\n{'─'*70}")
            print("🧪 TEST SET (out-of-sample) ← THIS IS WHAT MATTERS")
            print(f"{'─'*70}")
            print(f"{'Strategy':<20} {'N':>6} {'Accuracy':>10} {'P-value':>10} {'Sig':>5}")
            print(f"{'─'*70}")
            
            for s_name in [s.name for s in sorted_strategies]:
                s = result.test_results[s_name]
                if s.total == 0:
                    continue
                sig = s.get_significance_level()
                p_val = s.calculate_p_value()
                print(f"{s.name:<20} {s.total:>6} {s.direction_accuracy:>9.1%} {p_val:>10.4f} {sig:>5}")
        
        # Statistical interpretation
        print(f"\n{'─'*70}")
        print("📋 INTERPRETATION")
        print(f"{'─'*70}")
        print("Significance levels: *** p<0.001, ** p<0.01, * p<0.05, . p<0.1")
        print("\n⚠️  Key question: Does the TRAIN edge hold in TEST?")
        
        # Find best train and check if it holds in test
        best_train = max(result.train_results.values(), key=lambda s: s.direction_accuracy)
        test_perf = result.test_results[best_train.name]
        
        train_acc = best_train.direction_accuracy
        test_acc = test_perf.direction_accuracy if test_perf.total > 0 else 0
        
        if test_perf.total > 0:
            if test_acc >= train_acc - 0.05:  # Edge holds within 5%
                print(f"\n✅ {best_train.name}: Train {train_acc:.1%} → Test {test_acc:.1%}")
                print("   Edge appears to hold out-of-sample!")
            else:
                print(f"\n❌ {best_train.name}: Train {train_acc:.1%} → Test {test_acc:.1%}")
                print("   Edge degraded out-of-sample. Likely overfit.")
        else:
            print(f"\n⚠️  Insufficient test data for {best_train.name}")
    
    def run_multi_asset_backtest(
        self,
        symbols: List[str] = None,
        days: int = 90,
        train_ratio: float = 0.6
    ) -> Dict[str, BacktestResult]:
        """
        Run backtest across multiple assets to validate edge generalization.
        """
        if symbols is None:
            symbols = ["bitcoin", "ethereum", "solana"]
        
        results = {}
        for symbol in symbols:
            try:
                print(f"\n{'='*60}")
                result = self.run_backtest(symbol, days=days, train_ratio=train_ratio)
                results[symbol] = result
                self.print_results(result)
            except Exception as e:
                print(f"❌ Failed to backtest {symbol}: {e}")
        
        # Cross-asset summary
        print(f"\n{'='*70}")
        print("🌍 CROSS-ASSET SUMMARY")
        print(f"{'='*70}")
        
        # Aggregate test performance by strategy
        strategy_test_results: Dict[str, List[float]] = {}
        for symbol, result in results.items():
            for s_name, s_result in result.test_results.items():
                if s_result.total > 0:
                    if s_name not in strategy_test_results:
                        strategy_test_results[s_name] = []
                    strategy_test_results[s_name].append(s_result.direction_accuracy)
        
        print(f"{'Strategy':<20} {'Assets Tested':>14} {'Avg Test Acc':>14} {'All >50%?':>10}")
        print(f"{'─'*70}")
        
        for s_name, accs in sorted(strategy_test_results.items(), 
                                    key=lambda x: sum(x[1])/len(x[1]) if x[1] else 0,
                                    reverse=True):
            avg = sum(accs) / len(accs) if accs else 0
            all_above_50 = all(a > 0.5 for a in accs)
            check = "✅" if all_above_50 else "❌"
            print(f"{s_name:<20} {len(accs):>14} {avg:>13.1%} {check:>10}")
        
        return results


def run_quick_backtest():
    """Run a quick backtest for testing."""
    bt = Backtester()
    result = bt.run_backtest("bitcoin", days=60, train_ratio=0.6)
    bt.print_results(result)
    return result


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Backtest prediction strategies")
    parser.add_argument("--symbol", default="bitcoin", help="Asset to backtest")
    parser.add_argument("--days", type=int, default=90, help="Days of historical data")
    parser.add_argument("--train-ratio", type=float, default=0.6, help="Train/test split ratio")
    parser.add_argument("--multi-asset", action="store_true", help="Run across BTC, ETH, SOL")
    
    args = parser.parse_args()
    
    bt = Backtester()
    
    if args.multi_asset:
        bt.run_multi_asset_backtest(days=args.days, train_ratio=args.train_ratio)
    else:
        result = bt.run_backtest(args.symbol, days=args.days, train_ratio=args.train_ratio)
        bt.print_results(result)
