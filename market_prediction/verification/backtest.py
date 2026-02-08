#!/usr/bin/env python3
"""
Backtesting Module with Statistical Rigor

The truth-telling system for strategy validation:
- Train/test split to prove out-of-sample validity
- P-value calculation using binomial test
- Significance level indicators (*, **, ***)
- Multi-asset validation

Usage:
    python -m cli.main backtest -s bitcoin -d 90 --train-ratio 0.6
"""

import sys
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Tuple
import math

sys.path.insert(0, str(Path(__file__).parent.parent))

from storage.models import Database, Direction, MagnitudeBucket, PriceRecord
from strategies.base import ALL_STRATEGIES, BaseStrategy, PredictionOutput


@dataclass
class BacktestResult:
    """Result from a single backtest prediction"""
    strategy_name: str
    symbol: str
    prediction_date: date
    target_date: date
    predicted_direction: Direction
    predicted_magnitude: MagnitudeBucket
    actual_direction: Direction
    actual_magnitude: MagnitudeBucket
    direction_correct: bool
    magnitude_correct: bool
    price_at_prediction: float
    price_at_target: float
    actual_change_pct: float
    confidence: float


@dataclass 
class StrategyBacktestStats:
    """Aggregated statistics for a strategy's backtest"""
    strategy_name: str
    n_predictions: int
    direction_correct: int
    magnitude_correct: int
    direction_accuracy: float
    magnitude_accuracy: float
    p_value: float  # vs random 50% baseline
    significance: str  # '', '*', '**', '***'
    avg_confidence: float
    

def binomial_test_pvalue(successes: int, trials: int, p0: float = 0.5) -> float:
    """
    Calculate one-sided p-value for binomial test.
    
    Tests H0: true success rate <= p0
    vs H1: true success rate > p0
    
    Uses normal approximation for n >= 30, exact calculation otherwise.
    """
    if trials == 0:
        return 1.0
    
    observed_p = successes / trials
    
    if observed_p <= p0:
        return 1.0  # Can't beat baseline if at or below it
    
    if trials >= 30:
        # Normal approximation
        se = math.sqrt(p0 * (1 - p0) / trials)
        z = (observed_p - p0) / se
        # One-sided p-value (upper tail)
        p_value = 0.5 * math.erfc(z / math.sqrt(2))
    else:
        # Exact binomial calculation
        # P(X >= successes) where X ~ Binomial(n, p0)
        p_value = 0.0
        for k in range(successes, trials + 1):
            # Binomial coefficient * p^k * (1-p)^(n-k)
            coef = math.comb(trials, k)
            p_value += coef * (p0 ** k) * ((1 - p0) ** (trials - k))
    
    return p_value


def get_significance_stars(p_value: float) -> str:
    """Return significance stars based on p-value"""
    if p_value < 0.001:
        return "***"
    elif p_value < 0.01:
        return "**"
    elif p_value < 0.05:
        return "*"
    return ""


class Backtester:
    """
    Backtester with train/test split for out-of-sample validation.
    
    This is where we prove (or disprove) that strategies have real edge.
    """
    
    def __init__(self, db: Database):
        self.db = db
    
    def get_historical_prices(self, symbol: str, days: int) -> List[PriceRecord]:
        """Get historical price data for backtesting"""
        end = datetime.utcnow()
        start = end - timedelta(days=days + 60)  # Extra buffer for lookback periods
        return self.db.get_prices(symbol, start, end)
    
    def run_single_backtest(
        self,
        strategy: BaseStrategy,
        symbol: str,
        prices: List[PriceRecord],
        prediction_idx: int
    ) -> Optional[BacktestResult]:
        """
        Run a single backtest prediction at a specific point in time.
        
        Args:
            strategy: Strategy to test
            symbol: Asset symbol
            prices: Full price history
            prediction_idx: Index in prices array to make prediction FROM
            
        Returns:
            BacktestResult or None if insufficient data
        """
        # Need at least prediction_idx prices for history, and one more for target
        if prediction_idx < 30 or prediction_idx >= len(prices) - 1:
            return None
        
        # Price history available to the strategy (no look-ahead!)
        history = prices[:prediction_idx + 1]
        current_price = history[-1].price_usd
        prediction_date = history[-1].timestamp.date()
        
        # Target price (what we're predicting)
        target = prices[prediction_idx + 1]
        target_date = target.timestamp.date()
        target_price = target.price_usd
        
        # Run the strategy
        try:
            output = strategy.predict(symbol, current_price, history, target_date)
        except Exception as e:
            return None
        
        # Calculate actual outcome
        change_pct = ((target_price - current_price) / current_price) * 100
        
        if change_pct > 0.1:
            actual_direction = Direction.UP
        elif change_pct < -0.1:
            actual_direction = Direction.DOWN
        else:
            actual_direction = Direction.NEUTRAL
        
        abs_change = abs(change_pct)
        if abs_change < 2.0:
            actual_magnitude = MagnitudeBucket.SMALL
        elif abs_change < 5.0:
            actual_magnitude = MagnitudeBucket.MEDIUM
        else:
            actual_magnitude = MagnitudeBucket.LARGE
        
        # Check correctness (lenient on neutral - matching behavior in engine.py)
        direction_correct = (
            output.direction == actual_direction or
            (output.direction in [Direction.UP, Direction.DOWN] and 
             actual_direction == Direction.NEUTRAL)
        )
        magnitude_correct = (output.magnitude == actual_magnitude)
        
        return BacktestResult(
            strategy_name=strategy.name,
            symbol=symbol,
            prediction_date=prediction_date,
            target_date=target_date,
            predicted_direction=output.direction,
            predicted_magnitude=output.magnitude,
            actual_direction=actual_direction,
            actual_magnitude=actual_magnitude,
            direction_correct=direction_correct,
            magnitude_correct=magnitude_correct,
            price_at_prediction=current_price,
            price_at_target=target_price,
            actual_change_pct=change_pct,
            confidence=output.confidence
        )
    
    def run_backtest(
        self,
        symbol: str,
        days: int = 90,
        train_ratio: float = 0.6,
        strategies: List[BaseStrategy] = None
    ) -> Tuple[Dict[str, StrategyBacktestStats], Dict[str, StrategyBacktestStats]]:
        """
        Run full backtest with train/test split.
        
        Args:
            symbol: Asset to backtest
            days: Total days of data to use
            train_ratio: Fraction of data for training (rest is test)
            strategies: Strategies to test (defaults to ALL_STRATEGIES)
            
        Returns:
            Tuple of (train_stats, test_stats) dictionaries keyed by strategy name
        """
        if strategies is None:
            strategies = ALL_STRATEGIES
        
        prices = self.get_historical_prices(symbol, days)
        
        if len(prices) < 60:
            print(f"Insufficient data: only {len(prices)} price points")
            return {}, {}
        
        # Calculate split point
        # Skip first 30 days for lookback period
        usable_start = 30
        usable_end = len(prices) - 1  # Need at least one target
        usable_range = usable_end - usable_start
        
        split_point = usable_start + int(usable_range * train_ratio)
        
        train_results: Dict[str, List[BacktestResult]] = {s.name: [] for s in strategies}
        test_results: Dict[str, List[BacktestResult]] = {s.name: [] for s in strategies}
        
        # Run backtests
        for idx in range(usable_start, usable_end):
            for strategy in strategies:
                result = self.run_single_backtest(strategy, symbol, prices, idx)
                if result:
                    if idx < split_point:
                        train_results[strategy.name].append(result)
                    else:
                        test_results[strategy.name].append(result)
        
        # Calculate statistics
        train_stats = {}
        test_stats = {}
        
        for strategy in strategies:
            train_stats[strategy.name] = self._calculate_stats(
                strategy.name, train_results[strategy.name]
            )
            test_stats[strategy.name] = self._calculate_stats(
                strategy.name, test_results[strategy.name]
            )
        
        return train_stats, test_stats
    
    def _calculate_stats(
        self, 
        strategy_name: str, 
        results: List[BacktestResult]
    ) -> StrategyBacktestStats:
        """Calculate aggregate statistics from backtest results"""
        n = len(results)
        
        if n == 0:
            return StrategyBacktestStats(
                strategy_name=strategy_name,
                n_predictions=0,
                direction_correct=0,
                magnitude_correct=0,
                direction_accuracy=0.0,
                magnitude_accuracy=0.0,
                p_value=1.0,
                significance="",
                avg_confidence=0.0
            )
        
        dir_correct = sum(1 for r in results if r.direction_correct)
        mag_correct = sum(1 for r in results if r.magnitude_correct)
        
        dir_accuracy = dir_correct / n
        mag_accuracy = mag_correct / n
        avg_conf = sum(r.confidence for r in results) / n
        
        # P-value vs 50% baseline for directional accuracy
        p_value = binomial_test_pvalue(dir_correct, n, 0.5)
        significance = get_significance_stars(p_value)
        
        return StrategyBacktestStats(
            strategy_name=strategy_name,
            n_predictions=n,
            direction_correct=dir_correct,
            magnitude_correct=mag_correct,
            direction_accuracy=dir_accuracy,
            magnitude_accuracy=mag_accuracy,
            p_value=p_value,
            significance=significance,
            avg_confidence=avg_conf
        )
    
    def print_backtest_report(
        self,
        train_stats: Dict[str, StrategyBacktestStats],
        test_stats: Dict[str, StrategyBacktestStats],
        symbol: str = None
    ):
        """Print formatted backtest report"""
        
        title = f"BACKTEST RESULTS{f' - {symbol.upper()}' if symbol else ''}"
        print(f"\n{'='*70}")
        print(title)
        print(f"{'='*70}")
        
        # TRAIN SET
        print(f"\n🎓 TRAINING SET (in-sample)")
        print("-" * 70)
        print(f"{'Strategy':<20} {'N':<6} {'Accuracy':<12} {'P-value':<12} {'Sig':<5}")
        print("-" * 70)
        
        for name, stats in sorted(train_stats.items(), 
                                   key=lambda x: x[1].direction_accuracy, 
                                   reverse=True):
            if stats.n_predictions > 0:
                print(f"{name:<20} {stats.n_predictions:<6} "
                      f"{stats.direction_accuracy*100:>6.1f}%      "
                      f"{stats.p_value:<12.4f} {stats.significance:<5}")
        
        # TEST SET
        print(f"\n🧪 TEST SET (out-of-sample) ← THIS IS WHAT MATTERS")
        print("-" * 70)
        print(f"{'Strategy':<20} {'N':<6} {'Accuracy':<12} {'P-value':<12} {'Sig':<5}")
        print("-" * 70)
        
        for name, stats in sorted(test_stats.items(),
                                   key=lambda x: x[1].direction_accuracy,
                                   reverse=True):
            if stats.n_predictions > 0:
                print(f"{name:<20} {stats.n_predictions:<6} "
                      f"{stats.direction_accuracy*100:>6.1f}%      "
                      f"{stats.p_value:<12.4f} {stats.significance:<5}")
        
        # Analysis
        print(f"\n{'='*70}")
        print("STATISTICAL INTERPRETATION")
        print("-" * 70)
        print("  * = p < 0.05 (95% confidence)")
        print(" ** = p < 0.01 (99% confidence)")  
        print("*** = p < 0.001 (99.9% confidence)")
        print()
        
        # Find significant strategies
        significant = [
            (name, stats) for name, stats in test_stats.items()
            if stats.significance and stats.n_predictions > 0
        ]
        
        if significant:
            print("✅ Strategies with significant edge (test set):")
            for name, stats in significant:
                print(f"   {name}: {stats.direction_accuracy*100:.1f}% "
                      f"(p={stats.p_value:.4f}) {stats.significance}")
        else:
            print("⚠️  No strategies show statistically significant edge in test set.")
            print("   This could mean:")
            print("   - More data needed (n is too small)")
            print("   - Market is efficient (no simple edge exists)")
            print("   - Need more sophisticated strategies")
        
        # Check for overfitting
        print()
        for name, train_stat in train_stats.items():
            test_stat = test_stats.get(name)
            if train_stat.n_predictions > 0 and test_stat and test_stat.n_predictions > 0:
                train_acc = train_stat.direction_accuracy
                test_acc = test_stat.direction_accuracy
                if train_acc - test_acc > 0.1:  # 10% drop
                    print(f"⚠️  {name}: possible overfit - "
                          f"train {train_acc*100:.1f}% vs test {test_acc*100:.1f}%")


def run_multi_asset_backtest(
    db: Database,
    symbols: List[str],
    days: int = 90,
    train_ratio: float = 0.6
) -> Dict[str, Tuple[Dict, Dict]]:
    """
    Run backtest across multiple assets to check if edge generalizes.
    
    Returns dict mapping symbol to (train_stats, test_stats) tuple.
    """
    backtester = Backtester(db)
    results = {}
    
    for symbol in symbols:
        print(f"\nBacktesting {symbol}...")
        train_stats, test_stats = backtester.run_backtest(
            symbol, days, train_ratio
        )
        results[symbol] = (train_stats, test_stats)
    
    return results


if __name__ == "__main__":
    # Quick test
    db = Database("market_predictions.db")
    backtester = Backtester(db)
    
    print("Running backtest...")
    train_stats, test_stats = backtester.run_backtest("bitcoin", days=90)
    backtester.print_backtest_report(train_stats, test_stats, "bitcoin")
    
    db.close()
