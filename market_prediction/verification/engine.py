#!/usr/bin/env python3
"""
Verification Engine

The truth-telling component. Compares predictions against actual outcomes
and calculates accuracy metrics. This is where the receipts live.

Enhanced with:
- Brier Score for probabilistic calibration
- Statistical significance testing (binomial test)
- Confidence calibration analysis
- Train/test split support for backtesting
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
import math
import statistics

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from storage.models import (
    Database, Prediction, VerificationResult, StrategyPerformance,
    Direction, MagnitudeBucket
)
from data.coingecko import DataIngestionService, CoinGeckoClient


@dataclass
class VerificationSummary:
    """Summary of verification results with statistical rigor"""
    total_verified: int
    direction_accuracy: float
    magnitude_accuracy: float
    combined_accuracy: float  # Both direction AND magnitude correct
    by_strategy: Dict[str, Dict[str, float]]
    
    # Statistical significance
    p_value: Optional[float] = None  # Binomial test vs 50% baseline
    is_significant: bool = False     # p < 0.05
    confidence_interval: Tuple[float, float] = (0.0, 0.0)  # 95% CI


@dataclass
class StrategyStats:
    """Comprehensive stats for a single strategy"""
    name: str
    n_predictions: int
    direction_accuracy: float
    magnitude_accuracy: float
    combined_accuracy: float
    avg_confidence: float
    
    # Brier Score (lower is better, 0 = perfect, 0.25 = random at 50%)
    brier_score: float = 0.25
    
    # Calibration: how well confidence matches accuracy
    calibration_error: float = 0.0  # |avg_confidence - accuracy|
    is_overconfident: bool = False
    
    # Statistical significance vs random baseline
    p_value: float = 1.0
    is_significant: bool = False
    edge_vs_random: float = 0.0  # Percentage points above 50%


# =============================================================================
# Statistical Helper Functions
# =============================================================================

def binomial_p_value(successes: int, trials: int, p0: float = 0.5) -> float:
    """
    Calculate two-tailed binomial test p-value.
    
    Tests H0: true accuracy = p0 (default 50%)
    Returns p-value for observing this many or more extreme successes.
    
    Uses normal approximation for large n, exact for small n.
    """
    if trials == 0:
        return 1.0
    
    observed_p = successes / trials
    
    # For small samples, use exact binomial (simplified)
    if trials < 30:
        # Exact binomial probability
        # P(X >= k) + P(X <= n-k) for two-tailed
        from math import comb
        
        def binom_pmf(k, n, p):
            return comb(n, k) * (p ** k) * ((1-p) ** (n-k))
        
        # Calculate tail probability
        if observed_p >= p0:
            p_tail = sum(binom_pmf(k, trials, p0) for k in range(successes, trials + 1))
        else:
            p_tail = sum(binom_pmf(k, trials, p0) for k in range(0, successes + 1))
        
        return min(2 * p_tail, 1.0)  # Two-tailed
    
    # Normal approximation for larger samples
    std_err = math.sqrt(p0 * (1 - p0) / trials)
    if std_err == 0:
        return 1.0
    
    z = (observed_p - p0) / std_err
    
    # Approximate p-value using error function
    # P(|Z| > |z|) ≈ 2 * (1 - Φ(|z|))
    p_value = 2 * (1 - 0.5 * (1 + math.erf(abs(z) / math.sqrt(2))))
    
    return p_value


def wilson_confidence_interval(successes: int, trials: int, 
                               confidence: float = 0.95) -> Tuple[float, float]:
    """
    Wilson score confidence interval for binomial proportion.
    
    More accurate than normal approximation, especially for extreme p or small n.
    """
    if trials == 0:
        return (0.0, 1.0)
    
    p = successes / trials
    
    # Z-score for confidence level
    z = 1.96 if confidence == 0.95 else 1.645 if confidence == 0.90 else 2.576
    
    denominator = 1 + z**2 / trials
    center = (p + z**2 / (2 * trials)) / denominator
    spread = z * math.sqrt((p * (1 - p) + z**2 / (4 * trials)) / trials) / denominator
    
    return (max(0, center - spread), min(1, center + spread))


def calculate_brier_score(predictions: List[Tuple[float, bool]]) -> float:
    """
    Calculate Brier Score for probabilistic predictions.
    
    Args:
        predictions: List of (confidence, correct) tuples
                    confidence = predicted probability of UP
                    correct = True if prediction was correct
    
    Returns:
        Brier score (0 = perfect, 0.25 = random at 50% confidence)
    
    Lower is better. A well-calibrated predictor has Brier score < 0.25
    """
    if not predictions:
        return 0.25
    
    # Brier = (1/n) * Σ(forecast - outcome)²
    total = 0.0
    for confidence, correct in predictions:
        outcome = 1.0 if correct else 0.0
        total += (confidence - outcome) ** 2
    
    return total / len(predictions)


def analyze_calibration(predictions: List[Tuple[float, bool]], 
                       n_bins: int = 5) -> Dict:
    """
    Analyze confidence calibration.
    
    Bins predictions by confidence level and compares to actual accuracy.
    A well-calibrated model has accuracy ≈ confidence in each bin.
    
    Returns:
        Dict with calibration analysis including bins and overall error
    """
    if not predictions:
        return {'bins': [], 'calibration_error': 0.0, 'is_overconfident': False}
    
    # Sort into bins
    bins = [[] for _ in range(n_bins)]
    for conf, correct in predictions:
        bin_idx = min(int(conf * n_bins), n_bins - 1)
        bins[bin_idx].append((conf, correct))
    
    calibration_data = []
    total_error = 0.0
    total_count = 0
    
    for i, bin_preds in enumerate(bins):
        if not bin_preds:
            continue
        
        bin_min = i / n_bins
        bin_max = (i + 1) / n_bins
        avg_conf = sum(c for c, _ in bin_preds) / len(bin_preds)
        accuracy = sum(1 for _, correct in bin_preds if correct) / len(bin_preds)
        
        calibration_data.append({
            'bin_range': (bin_min, bin_max),
            'count': len(bin_preds),
            'avg_confidence': avg_conf,
            'accuracy': accuracy,
            'error': avg_conf - accuracy  # Positive = overconfident
        })
        
        total_error += abs(avg_conf - accuracy) * len(bin_preds)
        total_count += len(bin_preds)
    
    overall_error = total_error / total_count if total_count > 0 else 0.0
    
    # Determine if overall overconfident
    avg_confidence = sum(c for c, _ in predictions) / len(predictions)
    overall_accuracy = sum(1 for _, correct in predictions if correct) / len(predictions)
    is_overconfident = avg_confidence > overall_accuracy
    
    return {
        'bins': calibration_data,
        'calibration_error': overall_error,
        'is_overconfident': is_overconfident,
        'avg_confidence': avg_confidence,
        'overall_accuracy': overall_accuracy
    }


class VerificationEngine:
    """
    Engine for verifying predictions against actual outcomes.
    
    This is where the rubber meets the road. Every prediction gets verified
    once the target date passes.
    """
    
    def __init__(self, db: Database, data_service: DataIngestionService = None):
        self.db = db
        self.data_service = data_service or DataIngestionService(db)
    
    def verify_prediction(self, prediction: Prediction) -> Optional[VerificationResult]:
        """
        Verify a single prediction against actual outcome.
        
        Args:
            prediction: The prediction to verify
        
        Returns:
            VerificationResult if verification successful, None otherwise
        """
        # Get actual price on target date
        target_datetime = datetime.combine(prediction.target_date, datetime.min.time())
        actual_price = self.data_service.get_price_on_date(
            prediction.symbol, 
            target_datetime
        )
        
        if actual_price is None:
            print(f"  Could not get price for {prediction.symbol} on {prediction.target_date}")
            return None
        
        # Calculate actual change
        price_change_pct = ((actual_price - prediction.price_at_prediction) / 
                          prediction.price_at_prediction) * 100
        
        # Determine actual direction
        if price_change_pct > 0.1:  # Small threshold to avoid noise
            actual_direction = Direction.UP
        elif price_change_pct < -0.1:
            actual_direction = Direction.DOWN
        else:
            actual_direction = Direction.NEUTRAL
        
        # Determine actual magnitude
        abs_change = abs(price_change_pct)
        if abs_change < 2.0:
            actual_magnitude = MagnitudeBucket.SMALL
        elif abs_change < 5.0:
            actual_magnitude = MagnitudeBucket.MEDIUM
        else:
            actual_magnitude = MagnitudeBucket.LARGE
        
        # Check correctness
        direction_correct = (prediction.direction == actual_direction or
                           (prediction.direction in [Direction.UP, Direction.DOWN] and
                            actual_direction == Direction.NEUTRAL))  # Lenient on neutral
        
        magnitude_correct = (prediction.magnitude == actual_magnitude)
        
        result = VerificationResult(
            id=None,
            prediction_id=prediction.id,
            actual_price=actual_price,
            actual_direction=actual_direction,
            actual_magnitude=actual_magnitude,
            direction_correct=direction_correct,
            magnitude_correct=magnitude_correct,
            price_change_pct=price_change_pct,
            verified_at=datetime.utcnow()
        )
        
        return result
    
    def verify_all_pending(self) -> List[Tuple[Prediction, VerificationResult]]:
        """
        Verify all predictions that are due for verification.
        
        Returns:
            List of (prediction, result) tuples for verified predictions
        """
        pending = self.db.get_unverified_predictions()
        print(f"Found {len(pending)} unverified predictions")
        
        verified = []
        for prediction in pending:
            print(f"  Verifying {prediction.strategy_name} prediction for "
                  f"{prediction.symbol} ({prediction.target_date})")
            
            result = self.verify_prediction(prediction)
            if result:
                self.db.insert_verification(result)
                verified.append((prediction, result))
                
                status = "✓" if result.direction_correct else "✗"
                print(f"    {status} Predicted: {prediction.direction.value} {prediction.magnitude.value}, "
                      f"Actual: {result.actual_direction.value} {result.actual_magnitude.value} "
                      f"({result.price_change_pct:+.2f}%)")
        
        return verified
    
    def get_verification_summary(self, days: int = 30) -> VerificationSummary:
        """
        Get a summary of verification results over recent period.
        
        Args:
            days: Number of days to look back
        
        Returns:
            VerificationSummary with accuracy metrics
        """
        results = self.db.get_recent_predictions_with_results(limit=500)
        
        # Filter to verified predictions within timeframe
        cutoff = date.today() - timedelta(days=days)
        verified = [
            r for r in results 
            if r['verified'] and r['prediction'].target_date >= cutoff
        ]
        
        if not verified:
            return VerificationSummary(
                total_verified=0,
                direction_accuracy=0.0,
                magnitude_accuracy=0.0,
                combined_accuracy=0.0,
                by_strategy={}
            )
        
        # Calculate overall accuracy
        total = len(verified)
        direction_correct = sum(1 for r in verified if r['direction_correct'])
        magnitude_correct = sum(1 for r in verified if r['magnitude_correct'])
        both_correct = sum(1 for r in verified 
                         if r['direction_correct'] and r['magnitude_correct'])
        
        # Calculate by strategy
        by_strategy = {}
        strategies = set(r['prediction'].strategy_name for r in verified)
        
        for strategy in strategies:
            strat_results = [r for r in verified 
                           if r['prediction'].strategy_name == strategy]
            strat_total = len(strat_results)
            
            if strat_total > 0:
                by_strategy[strategy] = {
                    'total': strat_total,
                    'direction_accuracy': sum(1 for r in strat_results 
                                             if r['direction_correct']) / strat_total,
                    'magnitude_accuracy': sum(1 for r in strat_results 
                                             if r['magnitude_correct']) / strat_total,
                    'combined_accuracy': sum(1 for r in strat_results 
                                            if r['direction_correct'] and 
                                            r['magnitude_correct']) / strat_total,
                    'avg_confidence': sum(r['prediction'].confidence 
                                         for r in strat_results) / strat_total
                }
        
        return VerificationSummary(
            total_verified=total,
            direction_accuracy=direction_correct / total,
            magnitude_accuracy=magnitude_correct / total,
            combined_accuracy=both_correct / total,
            by_strategy=by_strategy
        )
    
    def get_strategy_stats(self, days: int = 30) -> List[StrategyStats]:
        """
        Get comprehensive statistics for all strategies.
        
        Includes Brier score, p-value, confidence calibration, etc.
        This is where the rigorous truth lives.
        """
        results = self.db.get_recent_predictions_with_results(limit=1000)
        
        # Filter to verified predictions within timeframe
        cutoff = date.today() - timedelta(days=days)
        verified = [
            r for r in results 
            if r['verified'] and r['prediction'].target_date >= cutoff
        ]
        
        if not verified:
            return []
        
        # Group by strategy
        strategies = {}
        for r in verified:
            name = r['prediction'].strategy_name
            if name not in strategies:
                strategies[name] = []
            strategies[name].append(r)
        
        stats_list = []
        
        for name, strat_results in strategies.items():
            n = len(strat_results)
            
            # Basic accuracy
            direction_correct = sum(1 for r in strat_results if r['direction_correct'])
            magnitude_correct = sum(1 for r in strat_results if r['magnitude_correct'])
            both_correct = sum(1 for r in strat_results 
                              if r['direction_correct'] and r['magnitude_correct'])
            
            direction_acc = direction_correct / n
            magnitude_acc = magnitude_correct / n
            combined_acc = both_correct / n
            avg_conf = sum(r['prediction'].confidence for r in strat_results) / n
            
            # Brier Score
            brier_data = [(r['prediction'].confidence, r['direction_correct']) 
                         for r in strat_results]
            brier = calculate_brier_score(brier_data)
            
            # Calibration analysis
            calibration = analyze_calibration(brier_data)
            
            # Statistical significance (binomial test vs 50%)
            p_val = binomial_p_value(direction_correct, n, 0.5)
            ci = wilson_confidence_interval(direction_correct, n)
            
            stats = StrategyStats(
                name=name,
                n_predictions=n,
                direction_accuracy=direction_acc,
                magnitude_accuracy=magnitude_acc,
                combined_accuracy=combined_acc,
                avg_confidence=avg_conf,
                brier_score=brier,
                calibration_error=calibration['calibration_error'],
                is_overconfident=calibration['is_overconfident'],
                p_value=p_val,
                is_significant=(p_val < 0.05),
                edge_vs_random=(direction_acc - 0.5) * 100  # percentage points
            )
            stats_list.append(stats)
        
        # Sort by direction accuracy
        stats_list.sort(key=lambda s: s.direction_accuracy, reverse=True)
        
        return stats_list
    
    def print_leaderboard(self, days: int = 30, verbose: bool = True):
        """
        Print a leaderboard of strategy performance with statistical rigor.
        
        Args:
            days: Number of days to look back
            verbose: If True, show additional statistical details
        """
        stats = self.get_strategy_stats(days)
        
        print(f"\n{'='*80}")
        print(f"STRATEGY LEADERBOARD (Last {days} days)")
        print(f"{'='*80}")
        
        if not stats:
            print("No verified predictions yet.")
            return
        
        # Main table
        print(f"\n{'Strategy':<18} {'Dir %':<8} {'N':<6} {'p-value':<10} {'Sig?':<5} {'Brier':<8} {'Cal Err':<8}")
        print("-" * 80)
        
        for i, s in enumerate(stats, 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
            sig_marker = "✓" if s.is_significant else ""
            
            # Highlight if beating random with significance
            if s.is_significant and s.direction_accuracy > 0.5:
                sig_marker = "✓✓"  # Strong signal
            
            print(f"{medal} {s.name:<16} {s.direction_accuracy*100:>5.1f}%  "
                  f"{s.n_predictions:<6} "
                  f"{s.p_value:<10.4f} "
                  f"{sig_marker:<5} "
                  f"{s.brier_score:<8.4f} "
                  f"{s.calibration_error*100:>5.1f}%")
        
        # Summary stats
        total_n = sum(s.n_predictions for s in stats)
        total_correct = sum(int(s.direction_accuracy * s.n_predictions) for s in stats)
        overall_acc = total_correct / total_n if total_n > 0 else 0
        overall_p = binomial_p_value(total_correct, total_n, 0.5)
        overall_ci = wilson_confidence_interval(total_correct, total_n)
        
        print(f"\n{'='*80}")
        print(f"SUMMARY")
        print(f"  Total predictions: {total_n}")
        print(f"  Overall accuracy: {overall_acc*100:.1f}% (95% CI: {overall_ci[0]*100:.1f}%-{overall_ci[1]*100:.1f}%)")
        print(f"  Overall p-value: {overall_p:.4f} {'(SIGNIFICANT)' if overall_p < 0.05 else '(not significant)'}")
        
        # Statistical interpretation
        if verbose:
            print(f"\n{'='*80}")
            print(f"INTERPRETATION")
            
            # Find best non-random strategy
            non_random = [s for s in stats if s.name != 'random_baseline']
            random_baseline = next((s for s in stats if s.name == 'random_baseline'), None)
            
            if non_random:
                best = non_random[0]
                if best.is_significant and best.direction_accuracy > 0.5:
                    print(f"  ✅ {best.name} shows statistically significant edge!")
                    print(f"     - {best.edge_vs_random:+.1f} percentage points vs random")
                    print(f"     - p-value: {best.p_value:.4f} (less than 0.05)")
                    if best.is_overconfident:
                        print(f"     - ⚠️  BUT it's overconfident (cal error: {best.calibration_error*100:.1f}%)")
                else:
                    print(f"  ⚠️  No strategy shows statistically significant edge yet.")
                    print(f"     - Best: {best.name} at {best.direction_accuracy*100:.1f}% (p={best.p_value:.4f})")
                    if total_n < 100:
                        print(f"     - Need more data: {total_n} predictions (recommend 100+)")
            
            if random_baseline:
                print(f"\n  Random baseline: {random_baseline.direction_accuracy*100:.1f}% "
                      f"(expected: ~50%)")
            
            # Brier score interpretation
            print(f"\n  Brier Score Guide:")
            print(f"     0.00 = Perfect predictions")
            print(f"     0.25 = Random guessing at 50% confidence")
            print(f"     < 0.25 = Better than random")


class AccuracyTracker:
    """
    Track rolling accuracy metrics for strategies.
    
    Useful for detecting when strategies start to degrade or improve.
    """
    
    def __init__(self, db: Database, window_size: int = 20):
        self.db = db
        self.window_size = window_size
    
    def get_rolling_accuracy(self, strategy_name: str) -> List[Dict]:
        """
        Get rolling accuracy over time for a strategy.
        
        Returns list of dicts with date and accuracy for each window.
        """
        results = self.db.get_recent_predictions_with_results(limit=200)
        
        # Filter to this strategy and verified
        strat_results = [
            r for r in results 
            if r['prediction'].strategy_name == strategy_name and r['verified']
        ]
        
        # Sort by target date
        strat_results.sort(key=lambda x: x['prediction'].target_date)
        
        if len(strat_results) < self.window_size:
            return []
        
        rolling = []
        for i in range(self.window_size, len(strat_results) + 1):
            window = strat_results[i - self.window_size:i]
            direction_acc = sum(1 for r in window if r['direction_correct']) / self.window_size
            
            rolling.append({
                'date': window[-1]['prediction'].target_date,
                'direction_accuracy': direction_acc,
                'sample_size': self.window_size
            })
        
        return rolling
    
    def detect_performance_change(self, strategy_name: str, 
                                   threshold: float = 0.1) -> Optional[str]:
        """
        Detect if a strategy's performance has significantly changed.
        
        Returns:
            String describing the change, or None if no significant change
        """
        rolling = self.get_rolling_accuracy(strategy_name)
        
        if len(rolling) < 3:
            return None
        
        # Compare recent to historical
        recent = rolling[-3:]
        historical = rolling[:-3]
        
        if not historical:
            return None
        
        recent_avg = sum(r['direction_accuracy'] for r in recent) / len(recent)
        hist_avg = sum(r['direction_accuracy'] for r in historical) / len(historical)
        
        change = recent_avg - hist_avg
        
        if change > threshold:
            return f"📈 {strategy_name} is IMPROVING: +{change*100:.1f}% direction accuracy"
        elif change < -threshold:
            return f"📉 {strategy_name} is DEGRADING: {change*100:.1f}% direction accuracy"
        
        return None


class Backtester:
    """
    Backtesting with proper train/test split.
    
    Boz was right: you can't validate a prediction system by waiting for tomorrow.
    This class tests strategies on historical data with proper out-of-sample validation.
    """
    
    def __init__(self, db: Database, data_service: DataIngestionService = None):
        self.db = db
        self.data_service = data_service or DataIngestionService(db)
    
    def run_train_test_backtest(self, 
                                 symbol: str,
                                 total_days: int = 90,
                                 train_ratio: float = 0.6) -> Dict:
        """
        Run backtest with train/test split.
        
        Args:
            symbol: Asset to backtest (e.g., 'bitcoin')
            total_days: Total historical days to use
            train_ratio: Fraction of data for training (0.6 = 60% train, 40% test)
        
        Returns:
            Dict with train and test results for each strategy
        """
        from strategies.base import ALL_STRATEGIES
        
        print(f"\n{'='*80}")
        print(f"TRAIN/TEST BACKTEST: {symbol.upper()}")
        print(f"  Total days: {total_days}")
        print(f"  Split: {train_ratio*100:.0f}% train / {(1-train_ratio)*100:.0f}% test")
        print(f"{'='*80}")
        
        # Get price history
        end_date = datetime.now()
        start_date = end_date - timedelta(days=total_days + 30)  # Extra for lookback
        
        prices = self.db.get_prices(symbol, start_date, end_date)
        
        if len(prices) < total_days:
            print(f"  ⚠️  Insufficient data: {len(prices)} days (need {total_days})")
            return {}
        
        # Split into train and test periods
        split_idx = int(len(prices) * train_ratio)
        train_prices = prices[:split_idx]
        test_prices = prices[split_idx:]
        
        train_days = len(train_prices)
        test_days = len(test_prices)
        
        print(f"\n  Train period: {train_prices[0].timestamp.date()} to {train_prices[-1].timestamp.date()} ({train_days} days)")
        print(f"  Test period: {test_prices[0].timestamp.date()} to {test_prices[-1].timestamp.date()} ({test_days} days)")
        
        results = {}
        
        for strategy in ALL_STRATEGIES:
            train_results = self._evaluate_strategy(strategy, symbol, train_prices)
            test_results = self._evaluate_strategy(strategy, symbol, test_prices)
            
            results[strategy.name] = {
                'train': train_results,
                'test': test_results,
                'overfit_risk': self._calculate_overfit_risk(train_results, test_results)
            }
        
        # Print results
        self._print_backtest_results(results)
        
        return results
    
    def _evaluate_strategy(self, strategy, symbol: str, prices: list) -> Dict:
        """Evaluate strategy on a price series"""
        if len(prices) < 30:  # Need minimum lookback
            return {'accuracy': 0, 'n': 0, 'correct': 0}
        
        correct = 0
        total = 0
        predictions_data = []  # For Brier score
        
        # Walk through prices, predicting next day
        for i in range(30, len(prices) - 1):
            lookback = prices[:i]
            current_price = prices[i].price_usd
            next_price = prices[i + 1].price_usd
            
            # Get prediction
            target_date = prices[i + 1].timestamp.date()
            output = strategy.predict(symbol, current_price, lookback, target_date)
            
            # Determine actual direction
            actual_change = ((next_price - current_price) / current_price) * 100
            if actual_change > 0.1:
                actual_direction = Direction.UP
            elif actual_change < -0.1:
                actual_direction = Direction.DOWN
            else:
                actual_direction = Direction.NEUTRAL
            
            # Check if correct (lenient on neutral)
            is_correct = (output.direction == actual_direction or
                         (output.direction in [Direction.UP, Direction.DOWN] and
                          actual_direction == Direction.NEUTRAL))
            
            if is_correct:
                correct += 1
            total += 1
            predictions_data.append((output.confidence, is_correct))
        
        if total == 0:
            return {'accuracy': 0, 'n': 0, 'correct': 0, 'brier': 0.25, 'p_value': 1.0}
        
        accuracy = correct / total
        brier = calculate_brier_score(predictions_data)
        p_val = binomial_p_value(correct, total, 0.5)
        
        return {
            'accuracy': accuracy,
            'n': total,
            'correct': correct,
            'brier': brier,
            'p_value': p_val,
            'is_significant': p_val < 0.05
        }
    
    def _calculate_overfit_risk(self, train: Dict, test: Dict) -> str:
        """Assess overfit risk based on train/test gap"""
        if train['n'] == 0 or test['n'] == 0:
            return "UNKNOWN"
        
        gap = train['accuracy'] - test['accuracy']
        
        if gap > 0.15:
            return "HIGH"
        elif gap > 0.05:
            return "MODERATE"
        elif gap < -0.05:
            return "IMPROVING"  # Test better than train (rare, good sign)
        else:
            return "LOW"
    
    def _print_backtest_results(self, results: Dict):
        """Print formatted backtest results"""
        print(f"\n{'Strategy':<18} {'Train %':<10} {'Test %':<10} {'Gap':<8} {'Overfit?':<10} {'Test p':<10}")
        print("-" * 80)
        
        # Sort by test accuracy (what actually matters)
        sorted_results = sorted(results.items(), 
                               key=lambda x: x[1]['test']['accuracy'], 
                               reverse=True)
        
        for i, (name, data) in enumerate(sorted_results, 1):
            train_acc = data['train']['accuracy'] * 100
            test_acc = data['test']['accuracy'] * 100
            gap = train_acc - test_acc
            
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
            
            # Significance marker for test set
            sig = "✓" if data['test'].get('is_significant', False) else ""
            
            print(f"{medal} {name:<16} {train_acc:>6.1f}%    {test_acc:>6.1f}%    "
                  f"{gap:>+5.1f}%   {data['overfit_risk']:<10} "
                  f"{data['test'].get('p_value', 1.0):<8.4f} {sig}")
        
        print(f"\n{'='*80}")
        print("INTERPRETATION")
        print("  - Gap = Train% - Test% (positive = possible overfit)")
        print("  - Only trust strategies that perform well on TEST set")
        print("  - p < 0.05 on test set = statistically significant edge")
        
        # Find best on test set
        best_test = sorted_results[0]
        if best_test[1]['test'].get('is_significant', False):
            print(f"\n  ✅ {best_test[0]} shows significant edge on out-of-sample test!")
        else:
            print(f"\n  ⚠️  No strategy shows significant edge on test set yet.")


if __name__ == "__main__":
    # Test verification engine
    from storage.models import Database
    
    db = Database("market_predictions.db")
    engine = VerificationEngine(db)
    
    # Verify pending predictions
    print("Verifying pending predictions...")
    verified = engine.verify_all_pending()
    print(f"Verified {len(verified)} predictions")
    
    # Print leaderboard
    engine.print_leaderboard()
    
    db.close()
