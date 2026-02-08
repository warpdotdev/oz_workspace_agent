#!/usr/bin/env python3
"""
Calibration & Statistical Metrics

The truth module. If we say we're 80% confident, we better be right 80% of the time.
This is where we separate signal from noise.

Implements:
- Brier Score (lower = better calibrated)
- Confidence Calibration Curve
- Statistical Significance Testing (binomial test)
- Expected Calibration Error (ECE)
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from datetime import date, timedelta
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from storage.models import Database, Direction


@dataclass
class CalibrationBucket:
    """A bucket for confidence calibration analysis"""
    confidence_range: Tuple[float, float]  # e.g., (0.6, 0.7)
    predictions: int
    correct: int
    accuracy: float
    avg_confidence: float
    calibration_error: float  # |accuracy - avg_confidence|


@dataclass 
class CalibrationReport:
    """Full calibration report for a strategy"""
    strategy_name: str
    total_predictions: int
    
    # Brier Score: lower is better, 0 = perfect, 0.25 = random guessing
    brier_score: float
    
    # Overall accuracy
    direction_accuracy: float
    
    # Expected Calibration Error: lower is better
    expected_calibration_error: float
    
    # Calibration by confidence bucket
    buckets: List[CalibrationBucket]
    
    # Statistical significance
    p_value: float  # Probability this accuracy happened by chance
    is_significant: bool  # p < 0.05
    beats_random: bool
    edge_over_random: float  # percentage points


class CalibrationAnalyzer:
    """
    Analyze prediction calibration and statistical significance.
    
    The goal: separate signal from noise, and ensure confidence 
    scores actually mean something.
    """
    
    def __init__(self, db: Database):
        self.db = db
    
    def calculate_brier_score(self, predictions: List[Dict]) -> float:
        """
        Calculate Brier Score for probabilistic predictions.
        
        Brier Score = (1/n) * Σ(confidence - outcome)²
        
        Where:
        - confidence = predicted probability of UP (0.0 to 1.0)
        - outcome = 1 if actually went UP, 0 if DOWN
        
        Lower is better:
        - 0.0 = perfect calibration
        - 0.25 = random guessing (50% confidence, 50% accuracy)
        - >0.25 = worse than random
        """
        if not predictions:
            return 0.25  # Default to random
        
        brier_sum = 0.0
        count = 0
        
        for p in predictions:
            if not p.get('verified') or p.get('actual_direction') is None:
                continue
            
            pred = p['prediction']
            
            # Convert to probability of UP
            if pred.direction == Direction.UP:
                prob_up = pred.confidence
            elif pred.direction == Direction.DOWN:
                prob_up = 1 - pred.confidence  # Confident DOWN = low prob UP
            else:
                prob_up = 0.5  # Neutral
            
            # Outcome: 1 if went UP, 0 if DOWN
            if p['actual_direction'] == Direction.UP:
                outcome = 1.0
            elif p['actual_direction'] == Direction.DOWN:
                outcome = 0.0
            else:
                outcome = 0.5  # Neutral
            
            brier_sum += (prob_up - outcome) ** 2
            count += 1
        
        if count == 0:
            return 0.25
        
        return brier_sum / count
    
    def binomial_test(self, successes: int, trials: int, 
                      null_probability: float = 0.5) -> float:
        """
        Calculate p-value using binomial test.
        
        Tests if observed success rate is significantly different from
        the null hypothesis (default: 50% random baseline).
        
        Returns p-value. Lower p-value = more significant.
        """
        if trials == 0:
            return 1.0
        
        # Use normal approximation for large n
        if trials >= 30:
            # z = (observed - expected) / std_dev
            expected = trials * null_probability
            std_dev = math.sqrt(trials * null_probability * (1 - null_probability))
            
            if std_dev == 0:
                return 1.0
            
            z = (successes - expected) / std_dev
            
            # Two-tailed p-value using normal CDF approximation
            # Using Abramowitz and Stegun approximation for standard normal CDF
            p_value = 2 * (1 - self._normal_cdf(abs(z)))
            
            return p_value
        
        # For small n, use exact binomial (simplified)
        # P(X >= k) for one-sided test
        p_value = 0.0
        for k in range(successes, trials + 1):
            p_value += self._binomial_pmf(k, trials, null_probability)
        
        return min(1.0, 2 * p_value)  # Two-tailed
    
    def _normal_cdf(self, x: float) -> float:
        """Approximate standard normal CDF"""
        # Abramowitz and Stegun approximation
        a1 = 0.254829592
        a2 = -0.284496736
        a3 = 1.421413741
        a4 = -1.453152027
        a5 = 1.061405429
        p = 0.3275911
        
        sign = 1 if x >= 0 else -1
        x = abs(x) / math.sqrt(2)
        
        t = 1.0 / (1.0 + p * x)
        y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * math.exp(-x * x)
        
        return 0.5 * (1.0 + sign * y)
    
    def _binomial_pmf(self, k: int, n: int, p: float) -> float:
        """Calculate binomial probability mass function"""
        # C(n,k) * p^k * (1-p)^(n-k)
        coeff = math.comb(n, k)
        return coeff * (p ** k) * ((1 - p) ** (n - k))
    
    def get_calibration_buckets(self, predictions: List[Dict], 
                                 n_buckets: int = 5) -> List[CalibrationBucket]:
        """
        Bin predictions by confidence and calculate accuracy per bucket.
        
        A well-calibrated model should have accuracy ≈ confidence in each bucket.
        """
        # Define bucket ranges
        bucket_size = 1.0 / n_buckets
        buckets_data = []
        
        for i in range(n_buckets):
            low = i * bucket_size
            high = (i + 1) * bucket_size
            buckets_data.append({
                'range': (low, high),
                'correct': 0,
                'total': 0,
                'confidence_sum': 0.0
            })
        
        # Assign predictions to buckets
        for p in predictions:
            if not p.get('verified'):
                continue
            
            pred = p['prediction']
            conf = pred.confidence
            
            # Find bucket
            bucket_idx = min(int(conf / bucket_size), n_buckets - 1)
            
            buckets_data[bucket_idx]['total'] += 1
            buckets_data[bucket_idx]['confidence_sum'] += conf
            
            if p.get('direction_correct'):
                buckets_data[bucket_idx]['correct'] += 1
        
        # Create CalibrationBucket objects
        result = []
        for b in buckets_data:
            if b['total'] > 0:
                accuracy = b['correct'] / b['total']
                avg_conf = b['confidence_sum'] / b['total']
                result.append(CalibrationBucket(
                    confidence_range=b['range'],
                    predictions=b['total'],
                    correct=b['correct'],
                    accuracy=accuracy,
                    avg_confidence=avg_conf,
                    calibration_error=abs(accuracy - avg_conf)
                ))
            else:
                result.append(CalibrationBucket(
                    confidence_range=b['range'],
                    predictions=0,
                    correct=0,
                    accuracy=0.0,
                    avg_confidence=(b['range'][0] + b['range'][1]) / 2,
                    calibration_error=0.0
                ))
        
        return result
    
    def calculate_ece(self, buckets: List[CalibrationBucket]) -> float:
        """
        Calculate Expected Calibration Error.
        
        ECE = Σ (n_b / n) * |accuracy_b - confidence_b|
        
        Lower is better. 0 = perfectly calibrated.
        """
        total_samples = sum(b.predictions for b in buckets)
        
        if total_samples == 0:
            return 0.0
        
        ece = 0.0
        for bucket in buckets:
            if bucket.predictions > 0:
                weight = bucket.predictions / total_samples
                ece += weight * bucket.calibration_error
        
        return ece
    
    def generate_calibration_report(self, strategy_name: str,
                                     days: int = 30) -> CalibrationReport:
        """
        Generate a full calibration report for a strategy.
        """
        # Get predictions
        results = self.db.get_recent_predictions_with_results(limit=500)
        cutoff = date.today() - timedelta(days=days)
        
        # Filter to this strategy and verified within timeframe
        predictions = [
            r for r in results
            if r['prediction'].strategy_name == strategy_name
            and r['verified']
            and r['prediction'].target_date >= cutoff
        ]
        
        total = len(predictions)
        if total == 0:
            return CalibrationReport(
                strategy_name=strategy_name,
                total_predictions=0,
                brier_score=0.25,
                direction_accuracy=0.0,
                expected_calibration_error=0.0,
                buckets=[],
                p_value=1.0,
                is_significant=False,
                beats_random=False,
                edge_over_random=0.0
            )
        
        # Calculate metrics
        correct = sum(1 for p in predictions if p['direction_correct'])
        accuracy = correct / total
        
        brier = self.calculate_brier_score(predictions)
        buckets = self.get_calibration_buckets(predictions)
        ece = self.calculate_ece(buckets)
        
        # Statistical significance
        p_value = self.binomial_test(correct, total, 0.5)
        is_significant = p_value < 0.05
        beats_random = accuracy > 0.5
        edge = (accuracy - 0.5) * 100  # percentage points
        
        return CalibrationReport(
            strategy_name=strategy_name,
            total_predictions=total,
            brier_score=brier,
            direction_accuracy=accuracy,
            expected_calibration_error=ece,
            buckets=buckets,
            p_value=p_value,
            is_significant=is_significant,
            beats_random=beats_random,
            edge_over_random=edge
        )
    
    def print_calibration_report(self, report: CalibrationReport):
        """Pretty print a calibration report"""
        print(f"\n{'='*60}")
        print(f"CALIBRATION REPORT: {report.strategy_name}")
        print(f"{'='*60}")
        
        if report.total_predictions == 0:
            print("No verified predictions for this strategy.")
            return
        
        # Key metrics
        print(f"\n📊 KEY METRICS")
        print(f"   Predictions: {report.total_predictions}")
        print(f"   Direction Accuracy: {report.direction_accuracy*100:.1f}%")
        
        # Brier score interpretation
        brier_quality = "🟢 Good" if report.brier_score < 0.2 else \
                       "🟡 Okay" if report.brier_score < 0.25 else \
                       "🔴 Poor (worse than random)"
        print(f"   Brier Score: {report.brier_score:.4f} {brier_quality}")
        
        # ECE interpretation
        ece_quality = "🟢 Well-calibrated" if report.expected_calibration_error < 0.1 else \
                     "🟡 Moderately calibrated" if report.expected_calibration_error < 0.2 else \
                     "🔴 Poorly calibrated"
        print(f"   Expected Calibration Error: {report.expected_calibration_error:.4f} {ece_quality}")
        
        # Statistical significance
        print(f"\n📈 STATISTICAL SIGNIFICANCE")
        print(f"   p-value: {report.p_value:.4f}")
        
        if report.is_significant and report.beats_random:
            print(f"   ✅ SIGNIFICANT: {report.edge_over_random:+.1f}pp edge over random")
            print(f"      (95% confident this isn't luck)")
        elif report.beats_random:
            print(f"   ⚠️  Edge of {report.edge_over_random:+.1f}pp but NOT STATISTICALLY SIGNIFICANT")
            print(f"      (Could be random chance - need more data)")
        else:
            print(f"   ❌ NOT beating random baseline")
        
        # Calibration curve
        print(f"\n📉 CALIBRATION BY CONFIDENCE BUCKET")
        print(f"   {'Confidence':<15} {'Accuracy':<12} {'N':<8} {'Error':<10}")
        print(f"   {'-'*50}")
        
        for bucket in report.buckets:
            low, high = bucket.confidence_range
            range_str = f"{low*100:.0f}%-{high*100:.0f}%"
            
            if bucket.predictions > 0:
                # Color code calibration error
                if bucket.calibration_error < 0.1:
                    status = "✓"
                elif bucket.calibration_error < 0.2:
                    status = "~"
                else:
                    status = "✗"
                
                print(f"   {range_str:<15} {bucket.accuracy*100:>5.1f}%      "
                      f"{bucket.predictions:<8} {bucket.calibration_error:.3f} {status}")
            else:
                print(f"   {range_str:<15} {'N/A':>6}      {0:<8} {'N/A':>6}")
        
        # Interpretation
        print(f"\n💡 INTERPRETATION")
        if report.brier_score < 0.2 and report.is_significant:
            print("   Strong strategy with good calibration. Worth watching.")
        elif report.is_significant:
            print("   Has edge but calibration needs work. Confidence scores unreliable.")
        elif report.brier_score < 0.25:
            print("   Calibration okay but no proven edge yet. Need more predictions.")
        else:
            print("   Not showing useful signal. Consider dropping or reworking.")
    
    def compare_strategies(self, days: int = 30) -> Dict[str, CalibrationReport]:
        """Generate calibration reports for all strategies"""
        # Get all strategy names
        results = self.db.get_recent_predictions_with_results(limit=500)
        strategies = set(r['prediction'].strategy_name for r in results if r['verified'])
        
        reports = {}
        for strategy in strategies:
            reports[strategy] = self.generate_calibration_report(strategy, days)
        
        return reports
    
    def print_comparison_summary(self, days: int = 30):
        """Print a summary comparison of all strategies"""
        reports = self.compare_strategies(days)
        
        if not reports:
            print("\nNo verified predictions to analyze.")
            return
        
        print(f"\n{'='*80}")
        print(f"STRATEGY CALIBRATION COMPARISON (Last {days} days)")
        print(f"{'='*80}")
        
        # Sort by whether significant and edge
        sorted_reports = sorted(
            reports.values(),
            key=lambda r: (r.is_significant, r.edge_over_random),
            reverse=True
        )
        
        print(f"\n{'Strategy':<20} {'Accuracy':<10} {'Brier':<10} {'ECE':<10} {'p-value':<10} {'Verdict':<15}")
        print("-" * 80)
        
        for r in sorted_reports:
            if r.total_predictions == 0:
                verdict = "No data"
            elif r.is_significant and r.beats_random:
                verdict = f"✅ +{r.edge_over_random:.1f}pp EDGE"
            elif r.beats_random:
                verdict = "⚠️  Unproven"
            else:
                verdict = "❌ No edge"
            
            print(f"{r.strategy_name:<20} {r.direction_accuracy*100:>5.1f}%    "
                  f"{r.brier_score:.4f}    {r.expected_calibration_error:.4f}    "
                  f"{r.p_value:.4f}    {verdict}")
        
        # Summary
        significant = [r for r in sorted_reports if r.is_significant and r.beats_random]
        if significant:
            print(f"\n🏆 STRATEGIES WITH PROVEN EDGE: {', '.join(r.strategy_name for r in significant)}")
        else:
            print(f"\n⚠️  NO STRATEGIES WITH STATISTICALLY SIGNIFICANT EDGE YET")
            print(f"   Need more predictions or better strategies.")


if __name__ == "__main__":
    # Test calibration analyzer
    db = Database("market_predictions.db")
    analyzer = CalibrationAnalyzer(db)
    
    analyzer.print_comparison_summary(days=30)
    
    db.close()
