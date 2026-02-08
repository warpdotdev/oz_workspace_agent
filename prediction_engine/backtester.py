#!/usr/bin/env python3
"""
Backtester Module

Proper backtesting with train/test splits and statistical significance testing.
Because Boz is right - 55.9% on n=102 is noise, not signal.

Key features:
- Train/test split validation (no peeking at future data)
- Statistical significance testing (p-values, confidence intervals)
- Multi-asset support (test if edge replicates across assets)
- Rolling window analysis (detect regime changes)
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import math
import random

sys.path.insert(0, str(Path(__file__).parent))

from data.models import Direction, Magnitude, get_direction_from_pct, get_magnitude_from_pct
from data.coingecko_client import get_client, HistoricalPrice
from strategies import get_all_strategies, PredictionStrategy


@dataclass
class BacktestPrediction:
    """A single backtest prediction result."""
    strategy_name: str
    symbol: str
    prediction_date: datetime
    predicted_direction: Direction
    predicted_magnitude: Magnitude
    confidence: float
    actual_direction: Direction
    actual_magnitude: Magnitude
    actual_change_pct: float
    direction_correct: bool
    magnitude_correct: bool


@dataclass
class BacktestResult:
    """Results from backtesting a strategy."""
    strategy_name: str
    symbol: str
    total_predictions: int
    direction_correct: int
    magnitude_correct: int
    direction_accuracy: float
    magnitude_accuracy: float
    
    # Statistical significance
    p_value: float  # Against 50% baseline
    is_significant: bool  # p < 0.05
    
    # Train vs Test split results (if applicable)
    train_accuracy: Optional[float] = None
    test_accuracy: Optional[float] = None
    train_n: Optional[int] = None
    test_n: Optional[int] = None
    
    # Confidence interval
    ci_lower: float = 0.0
    ci_upper: float = 0.0
    
    def __repr__(self):
        sig = "✓ SIGNIFICANT" if self.is_significant else "✗ not significant"
        return (f"{self.strategy_name} on {self.symbol}: "
                f"{self.direction_accuracy:.1%} ({self.direction_correct}/{self.total_predictions}) "
                f"[p={self.p_value:.3f} {sig}]")


class Backtester:
    """
    Backtesting engine with proper statistical rigor.
    
    Features:
    - Train/test split to detect overfitting
    - Statistical significance testing
    - Multi-asset validation
    """
    
    def __init__(self, strategies: List[PredictionStrategy] = None):
        self.client = get_client()
        self.strategies = strategies or get_all_strategies()
    
    def fetch_historical_data(
        self, 
        symbol: str, 
        days: int = 90
    ) -> List[HistoricalPrice]:
        """Fetch historical price data for backtesting."""
        print(f"📊 Fetching {days} days of historical data for {symbol}...")
        return self.client.get_historical_prices(symbol, days=days)
    
    def run_backtest(
        self,
        symbol: str,
        historical_prices: List[HistoricalPrice],
        lookback_window: int = 30,
        prediction_horizon: int = 1,  # 1 day ahead
        train_test_split: float = 0.7,  # 70% train, 30% test
    ) -> Dict[str, BacktestResult]:
        """
        Run backtest for all strategies on a single asset.
        
        Args:
            symbol: Asset symbol (e.g., "bitcoin")
            historical_prices: List of historical prices (oldest first)
            lookback_window: Days of history to use for each prediction
            prediction_horizon: Days ahead to predict
            train_test_split: Fraction of data for training (0.7 = 70% train)
        
        Returns:
            Dict mapping strategy name to BacktestResult
        """
        if len(historical_prices) < lookback_window + prediction_horizon + 10:
            raise ValueError(f"Need at least {lookback_window + prediction_horizon + 10} days of data")
        
        # Calculate split point
        n_predictions = len(historical_prices) - lookback_window - prediction_horizon
        split_idx = int(n_predictions * train_test_split)
        
        results = {}
        
        for strategy in self.strategies:
            predictions_train = []
            predictions_test = []
            
            # Iterate through time, making predictions
            for i in range(lookback_window, len(historical_prices) - prediction_horizon):
                # Historical data available at prediction time
                history = historical_prices[:i+1]
                current_price = history[-1].price
                
                # What actually happened
                future_price = historical_prices[i + prediction_horizon].price
                actual_change_pct = ((future_price - current_price) / current_price) * 100
                actual_direction = get_direction_from_pct(actual_change_pct)
                actual_magnitude = get_magnitude_from_pct(actual_change_pct)
                
                # Make prediction using only historical data (no look-ahead)
                result = strategy.predict(
                    symbol=symbol,
                    current_price=current_price,
                    historical_prices=history[-lookback_window:]
                )
                
                if result is None:
                    continue
                
                prediction = BacktestPrediction(
                    strategy_name=strategy.name,
                    symbol=symbol,
                    prediction_date=history[-1].timestamp,
                    predicted_direction=result.direction,
                    predicted_magnitude=result.magnitude,
                    confidence=result.confidence,
                    actual_direction=actual_direction,
                    actual_magnitude=actual_magnitude,
                    actual_change_pct=actual_change_pct,
                    direction_correct=(result.direction == actual_direction),
                    magnitude_correct=(result.magnitude == actual_magnitude)
                )
                
                # Assign to train or test set based on index
                pred_idx = i - lookback_window
                if pred_idx < split_idx:
                    predictions_train.append(prediction)
                else:
                    predictions_test.append(prediction)
            
            # Calculate results
            all_predictions = predictions_train + predictions_test
            result = self._calculate_backtest_result(
                strategy.name, 
                symbol, 
                all_predictions,
                predictions_train,
                predictions_test
            )
            results[strategy.name] = result
        
        return results
    
    def run_multi_asset_backtest(
        self,
        symbols: List[str] = ["bitcoin", "ethereum"],
        days: int = 90,
        train_test_split: float = 0.7
    ) -> Dict[str, Dict[str, BacktestResult]]:
        """
        Run backtest across multiple assets to validate edge replicates.
        
        Returns:
            Dict[symbol][strategy_name] -> BacktestResult
        """
        all_results = {}
        
        for symbol in symbols:
            print(f"\n{'='*60}")
            print(f"Backtesting {symbol.upper()}")
            print('='*60)
            
            historical = self.fetch_historical_data(symbol, days=days)
            if len(historical) < 40:
                print(f"⚠️ Insufficient data for {symbol}, skipping")
                continue
            
            results = self.run_backtest(
                symbol=symbol,
                historical_prices=historical,
                train_test_split=train_test_split
            )
            all_results[symbol] = results
        
        return all_results
    
    def _calculate_backtest_result(
        self,
        strategy_name: str,
        symbol: str,
        all_predictions: List[BacktestPrediction],
        train_predictions: List[BacktestPrediction],
        test_predictions: List[BacktestPrediction]
    ) -> BacktestResult:
        """Calculate backtest statistics with significance testing."""
        
        n = len(all_predictions)
        if n == 0:
            return BacktestResult(
                strategy_name=strategy_name,
                symbol=symbol,
                total_predictions=0,
                direction_correct=0,
                magnitude_correct=0,
                direction_accuracy=0.0,
                magnitude_accuracy=0.0,
                p_value=1.0,
                is_significant=False
            )
        
        # Overall accuracy
        direction_correct = sum(1 for p in all_predictions if p.direction_correct)
        magnitude_correct = sum(1 for p in all_predictions if p.magnitude_correct)
        direction_accuracy = direction_correct / n
        magnitude_accuracy = magnitude_correct / n
        
        # Train/test split accuracy
        train_accuracy = None
        test_accuracy = None
        train_n = len(train_predictions)
        test_n = len(test_predictions)
        
        if train_n > 0:
            train_correct = sum(1 for p in train_predictions if p.direction_correct)
            train_accuracy = train_correct / train_n
        
        if test_n > 0:
            test_correct = sum(1 for p in test_predictions if p.direction_correct)
            test_accuracy = test_correct / test_n
        
        # Statistical significance (binomial test against 50%)
        p_value = self._binomial_test(direction_correct, n, 0.5)
        is_significant = p_value < 0.05
        
        # 95% confidence interval using Wilson score
        ci_lower, ci_upper = self._wilson_score_interval(direction_correct, n)
        
        return BacktestResult(
            strategy_name=strategy_name,
            symbol=symbol,
            total_predictions=n,
            direction_correct=direction_correct,
            magnitude_correct=magnitude_correct,
            direction_accuracy=direction_accuracy,
            magnitude_accuracy=magnitude_accuracy,
            p_value=p_value,
            is_significant=is_significant,
            train_accuracy=train_accuracy,
            test_accuracy=test_accuracy,
            train_n=train_n,
            test_n=test_n,
            ci_lower=ci_lower,
            ci_upper=ci_upper
        )
    
    def _binomial_test(self, successes: int, n: int, p0: float = 0.5) -> float:
        """
        Two-tailed binomial test.
        
        Tests if observed success rate is significantly different from p0.
        Returns p-value.
        
        Uses normal approximation for n > 30.
        """
        if n == 0:
            return 1.0
        
        observed_p = successes / n
        
        # Normal approximation (valid for n > 30)
        if n >= 30:
            se = math.sqrt(p0 * (1 - p0) / n)
            if se == 0:
                return 1.0
            z = abs(observed_p - p0) / se
            # Two-tailed p-value using normal approximation
            p_value = 2 * (1 - self._normal_cdf(z))
            return p_value
        
        # For small n, use exact binomial calculation
        # This is a simplified version - for production use scipy.stats.binom_test
        return self._exact_binomial_test(successes, n, p0)
    
    def _exact_binomial_test(self, k: int, n: int, p: float) -> float:
        """Exact two-tailed binomial test for small samples."""
        def binom_pmf(k, n, p):
            """Binomial probability mass function."""
            coeff = math.factorial(n) / (math.factorial(k) * math.factorial(n - k))
            return coeff * (p ** k) * ((1 - p) ** (n - k))
        
        observed_prob = binom_pmf(k, n, p)
        
        # Sum probabilities of all outcomes as extreme or more extreme
        p_value = 0.0
        for i in range(n + 1):
            prob = binom_pmf(i, n, p)
            if prob <= observed_prob:
                p_value += prob
        
        return min(p_value, 1.0)
    
    def _normal_cdf(self, x: float) -> float:
        """Standard normal CDF approximation."""
        return 0.5 * (1 + math.erf(x / math.sqrt(2)))
    
    def _wilson_score_interval(
        self, 
        successes: int, 
        n: int, 
        confidence: float = 0.95
    ) -> Tuple[float, float]:
        """
        Calculate Wilson score confidence interval.
        
        More accurate than normal approximation for small n or extreme proportions.
        """
        if n == 0:
            return (0.0, 1.0)
        
        z = 1.96  # 95% confidence
        p_hat = successes / n
        
        denominator = 1 + z**2 / n
        center = (p_hat + z**2 / (2 * n)) / denominator
        margin = z * math.sqrt((p_hat * (1 - p_hat) + z**2 / (4 * n)) / n) / denominator
        
        return (max(0, center - margin), min(1, center + margin))
    
    def print_results(
        self, 
        results: Dict[str, BacktestResult],
        symbol: str = None
    ):
        """Pretty print backtest results."""
        
        title = f"Backtest Results" + (f" - {symbol.upper()}" if symbol else "")
        print(f"\n{'='*70}")
        print(f"  {title}")
        print('='*70)
        
        # Sort by direction accuracy
        sorted_results = sorted(
            results.values(), 
            key=lambda r: r.direction_accuracy, 
            reverse=True
        )
        
        print(f"\n{'Strategy':<20} {'Dir Acc':>10} {'n':>6} {'p-value':>10} {'95% CI':>15} {'Train':>8} {'Test':>8}")
        print("-" * 70)
        
        for r in sorted_results:
            sig_marker = "✓" if r.is_significant else " "
            ci_str = f"[{r.ci_lower:.1%}-{r.ci_upper:.1%}]"
            train_str = f"{r.train_accuracy:.1%}" if r.train_accuracy else "-"
            test_str = f"{r.test_accuracy:.1%}" if r.test_accuracy else "-"
            
            print(f"{r.strategy_name:<20} {r.direction_accuracy:>9.1%} {r.total_predictions:>6} "
                  f"{r.p_value:>9.4f}{sig_marker} {ci_str:>15} {train_str:>8} {test_str:>8}")
        
        print("-" * 70)
        print("✓ = statistically significant (p < 0.05)")
        
        # Summary insights
        print("\n📊 Key Insights:")
        
        # Check if any strategy beats random significantly
        significant_winners = [r for r in sorted_results if r.is_significant and r.direction_accuracy > 0.5]
        if significant_winners:
            best = significant_winners[0]
            print(f"  • {best.strategy_name} shows significant edge: {best.direction_accuracy:.1%} "
                  f"(p={best.p_value:.4f})")
        else:
            print("  • No strategy shows statistically significant edge over random")
        
        # Check train vs test degradation
        for r in sorted_results:
            if r.train_accuracy and r.test_accuracy:
                degradation = r.train_accuracy - r.test_accuracy
                if degradation > 0.1:
                    print(f"  ⚠️ {r.strategy_name}: {degradation:.1%} accuracy drop from train to test "
                          f"(possible overfit)")
    
    def print_multi_asset_summary(
        self, 
        all_results: Dict[str, Dict[str, BacktestResult]]
    ):
        """Print summary comparing strategy performance across assets."""
        
        print(f"\n{'='*70}")
        print("  Cross-Asset Performance Summary")
        print('='*70)
        
        # Get unique strategies
        strategies = set()
        for results in all_results.values():
            strategies.update(results.keys())
        
        # Build comparison table
        print(f"\n{'Strategy':<20}", end="")
        for symbol in all_results.keys():
            print(f" {symbol.upper()[:6]:>12}", end="")
        print(f" {'Avg':>8} {'Consistent?':>12}")
        print("-" * (20 + 13 * len(all_results) + 22))
        
        for strategy in sorted(strategies):
            print(f"{strategy:<20}", end="")
            
            accuracies = []
            significant_count = 0
            
            for symbol, results in all_results.items():
                if strategy in results:
                    r = results[strategy]
                    sig = "✓" if r.is_significant else " "
                    print(f" {r.direction_accuracy:>10.1%}{sig}", end="")
                    accuracies.append(r.direction_accuracy)
                    if r.is_significant and r.direction_accuracy > 0.5:
                        significant_count += 1
                else:
                    print(f" {'-':>12}", end="")
            
            # Average and consistency
            if accuracies:
                avg = sum(accuracies) / len(accuracies)
                consistent = significant_count == len(all_results) and avg > 0.52
                consistent_str = "YES ✓" if consistent else "NO"
                print(f" {avg:>7.1%} {consistent_str:>12}")
            else:
                print()
        
        print("-" * (20 + 13 * len(all_results) + 22))
        print("\n📊 Edge Replication Check:")
        
        for strategy in sorted(strategies):
            edges = []
            for symbol, results in all_results.items():
                if strategy in results:
                    r = results[strategy]
                    if r.is_significant and r.direction_accuracy > 0.5:
                        edges.append(symbol)
            
            if len(edges) == len(all_results):
                print(f"  ✓ {strategy}: Edge replicates across ALL assets")
            elif edges:
                print(f"  ? {strategy}: Edge found only on {', '.join(edges)}")
            else:
                print(f"  ✗ {strategy}: No significant edge on any asset")


def run_full_backtest():
    """Run a comprehensive backtest with train/test splits."""
    backtester = Backtester()
    
    print("🧪 Running Comprehensive Backtest with Statistical Validation")
    print("="*70)
    print("\nSettings:")
    print("  • Train/Test Split: 70% / 30%")
    print("  • Assets: Bitcoin, Ethereum")
    print("  • Historical Data: 90 days")
    print("  • Significance Level: α = 0.05")
    
    results = backtester.run_multi_asset_backtest(
        symbols=["bitcoin", "ethereum"],
        days=90,
        train_test_split=0.7
    )
    
    # Print per-asset results
    for symbol, symbol_results in results.items():
        backtester.print_results(symbol_results, symbol)
    
    # Print cross-asset summary
    backtester.print_multi_asset_summary(results)
    
    return results


if __name__ == "__main__":
    run_full_backtest()
