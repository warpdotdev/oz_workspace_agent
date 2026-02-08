#!/usr/bin/env python3
"""
Advanced Verification Metrics

This is where the truth gets dissected:
- Confidence calibration: Are we as good as we think we are?
- Statistical significance: Is our edge real or just noise?
- Train/test split: Out-of-sample validation
"""

import math
from dataclasses import dataclass
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import Prediction


@dataclass
class CalibrationBucket:
    """Calibration data for a confidence range."""
    confidence_range: tuple[float, float]  # (min, max)
    total_predictions: int
    correct_predictions: int
    
    @property
    def expected_accuracy(self) -> float:
        """Midpoint of confidence range."""
        return (self.confidence_range[0] + self.confidence_range[1]) / 2
    
    @property
    def actual_accuracy(self) -> float:
        """Actual accuracy in this bucket."""
        if self.total_predictions == 0:
            return 0.0
        return self.correct_predictions / self.total_predictions
    
    @property
    def calibration_error(self) -> float:
        """How far off our confidence is from reality."""
        return self.actual_accuracy - self.expected_accuracy


@dataclass
class CalibrationReport:
    """Full calibration analysis."""
    buckets: list[CalibrationBucket]
    expected_calibration_error: float  # ECE - lower is better
    overconfidence_ratio: float  # >1 means overconfident
    underconfidence_ratio: float  # >1 means underconfident
    
    def is_well_calibrated(self, threshold: float = 0.05) -> bool:
        """Check if calibration error is acceptable."""
        return self.expected_calibration_error < threshold


@dataclass 
class StatisticalSignificance:
    """Statistical analysis of prediction results."""
    n_predictions: int
    accuracy: float
    baseline: float  # Usually 50%
    edge: float  # accuracy - baseline
    standard_error: float
    z_score: float
    p_value: float
    confidence_interval_95: tuple[float, float]
    
    def is_significant(self, alpha: float = 0.05) -> bool:
        """Is the edge statistically significant at alpha level?"""
        return self.p_value < alpha
    
    def required_n_for_significance(self, target_edge: Optional[float] = None) -> int:
        """How many predictions needed for current edge to be significant?"""
        edge = target_edge or self.edge
        if edge <= 0:
            return float('inf')
        # For p < 0.05, need z > 1.96
        # z = edge * sqrt(n) / sqrt(p*(1-p))
        # Solving for n: n = (1.96 * sqrt(p*(1-p)) / edge)^2
        p = self.baseline / 100
        required = (1.96 * math.sqrt(p * (1 - p)) / (edge / 100)) ** 2
        return int(math.ceil(required))


def calculate_calibration(predictions: list[Prediction], n_buckets: int = 5) -> CalibrationReport:
    """
    Calculate confidence calibration.
    
    A well-calibrated model has confidence scores that match actual accuracy.
    If we say "80% confident", we should be right 80% of the time.
    """
    verified = [p for p in predictions 
                if p.verified_at is not None and p.direction_correct is not None]
    
    if not verified:
        return CalibrationReport(
            buckets=[],
            expected_calibration_error=1.0,
            overconfidence_ratio=0.0,
            underconfidence_ratio=0.0
        )
    
    # Create confidence buckets
    bucket_size = 1.0 / n_buckets
    buckets = []
    
    for i in range(n_buckets):
        min_conf = i * bucket_size
        max_conf = (i + 1) * bucket_size
        
        bucket_preds = [p for p in verified 
                       if min_conf <= p.confidence < max_conf or 
                       (i == n_buckets - 1 and p.confidence == max_conf)]
        
        correct = sum(1 for p in bucket_preds if p.direction_correct)
        
        buckets.append(CalibrationBucket(
            confidence_range=(min_conf, max_conf),
            total_predictions=len(bucket_preds),
            correct_predictions=correct
        ))
    
    # Calculate Expected Calibration Error (ECE)
    # Weighted average of calibration errors
    total = len(verified)
    ece = sum(
        (b.total_predictions / total) * abs(b.calibration_error) 
        for b in buckets if b.total_predictions > 0
    )
    
    # Calculate over/underconfidence
    overconfident_buckets = [b for b in buckets 
                            if b.total_predictions > 0 and b.calibration_error < 0]
    underconfident_buckets = [b for b in buckets 
                             if b.total_predictions > 0 and b.calibration_error > 0]
    
    overconf_ratio = (
        sum(b.total_predictions for b in overconfident_buckets) / total
        if overconfident_buckets else 0.0
    )
    underconf_ratio = (
        sum(b.total_predictions for b in underconfident_buckets) / total
        if underconfident_buckets else 0.0
    )
    
    return CalibrationReport(
        buckets=buckets,
        expected_calibration_error=ece,
        overconfidence_ratio=overconf_ratio,
        underconfidence_ratio=underconf_ratio
    )


def calculate_significance(
    n_correct: int, 
    n_total: int, 
    baseline: float = 50.0
) -> StatisticalSignificance:
    """
    Calculate statistical significance of prediction accuracy.
    
    Uses binomial test against baseline (usually 50% for random chance).
    """
    if n_total == 0:
        return StatisticalSignificance(
            n_predictions=0,
            accuracy=0.0,
            baseline=baseline,
            edge=0.0,
            standard_error=0.0,
            z_score=0.0,
            p_value=1.0,
            confidence_interval_95=(0.0, 0.0)
        )
    
    accuracy = (n_correct / n_total) * 100
    edge = accuracy - baseline
    
    # Standard error for proportion
    p = baseline / 100
    se = math.sqrt(p * (1 - p) / n_total) * 100
    
    # Z-score
    z = edge / se if se > 0 else 0.0
    
    # Two-tailed p-value (approximation using normal distribution)
    # For a proper implementation, use scipy.stats.norm.sf
    # This is a reasonable approximation for n > 30
    p_value = 2 * (1 - _normal_cdf(abs(z)))
    
    # 95% confidence interval
    margin = 1.96 * se
    ci_low = accuracy - margin
    ci_high = accuracy + margin
    
    return StatisticalSignificance(
        n_predictions=n_total,
        accuracy=accuracy,
        baseline=baseline,
        edge=edge,
        standard_error=se,
        z_score=z,
        p_value=p_value,
        confidence_interval_95=(ci_low, ci_high)
    )


def _normal_cdf(x: float) -> float:
    """
    Standard normal CDF approximation.
    Accurate to ~7 decimal places.
    """
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


def train_test_split_backtest(
    predictions: list[Prediction],
    train_ratio: float = 0.6
) -> dict:
    """
    Split predictions into train/test and calculate metrics for both.
    
    This is critical - if our edge doesn't hold out-of-sample, it's not real.
    """
    # Sort by prediction time
    sorted_preds = sorted(predictions, key=lambda p: p.prediction_time)
    verified = [p for p in sorted_preds 
                if p.verified_at is not None and p.direction_correct is not None]
    
    if len(verified) < 10:
        return {
            "error": "Not enough verified predictions for train/test split",
            "n_verified": len(verified)
        }
    
    split_idx = int(len(verified) * train_ratio)
    train_preds = verified[:split_idx]
    test_preds = verified[split_idx:]
    
    def calc_metrics(preds: list[Prediction]) -> dict:
        n_total = len(preds)
        n_correct = sum(1 for p in preds if p.direction_correct)
        sig = calculate_significance(n_correct, n_total)
        return {
            "n": n_total,
            "accuracy": sig.accuracy,
            "edge": sig.edge,
            "p_value": sig.p_value,
            "significant": sig.is_significant()
        }
    
    train_metrics = calc_metrics(train_preds)
    test_metrics = calc_metrics(test_preds)
    
    # The key question: does edge persist out-of-sample?
    edge_persistence = (
        test_metrics["edge"] / train_metrics["edge"] 
        if train_metrics["edge"] != 0 else 0.0
    )
    
    return {
        "train": train_metrics,
        "test": test_metrics,
        "edge_persistence": edge_persistence,  # >0.5 is encouraging
        "train_period": (
            train_preds[0].prediction_time.isoformat(),
            train_preds[-1].prediction_time.isoformat()
        ) if train_preds else None,
        "test_period": (
            test_preds[0].prediction_time.isoformat(),
            test_preds[-1].prediction_time.isoformat()
        ) if test_preds else None,
        "verdict": _get_split_verdict(train_metrics, test_metrics)
    }


def _get_split_verdict(train: dict, test: dict) -> str:
    """Get human-readable verdict on train/test results."""
    if train["edge"] <= 0:
        return "NO_EDGE_IN_SAMPLE"
    
    if test["edge"] <= 0:
        return "OVERFIT - Edge disappeared out-of-sample"
    
    if test["edge"] < train["edge"] * 0.3:
        return "SIGNIFICANT_DECAY - Edge dropped by >70%"
    
    if test["significant"]:
        return "VALIDATED - Edge is significant out-of-sample"
    
    if test["edge"] > 0:
        return "PROMISING - Positive but not yet significant"
    
    return "INCONCLUSIVE"


def print_calibration_report(report: CalibrationReport):
    """Print a formatted calibration report."""
    print("\n" + "=" * 60)
    print("CONFIDENCE CALIBRATION REPORT")
    print("=" * 60)
    
    print(f"\nExpected Calibration Error (ECE): {report.expected_calibration_error:.3f}")
    print(f"  (0.0 = perfectly calibrated, lower is better)")
    
    print(f"\nOverconfidence ratio: {report.overconfidence_ratio:.1%}")
    print(f"Underconfidence ratio: {report.underconfidence_ratio:.1%}")
    
    if report.buckets:
        print(f"\n{'Confidence':<15} {'N':>6} {'Expected':>10} {'Actual':>10} {'Error':>10}")
        print("-" * 60)
        
        for b in report.buckets:
            if b.total_predictions > 0:
                range_str = f"{b.confidence_range[0]:.0%}-{b.confidence_range[1]:.0%}"
                error_str = f"{b.calibration_error:+.1%}"
                print(
                    f"{range_str:<15} "
                    f"{b.total_predictions:>6} "
                    f"{b.expected_accuracy:>9.1%} "
                    f"{b.actual_accuracy:>9.1%} "
                    f"{error_str:>10}"
                )
    
    verdict = "✓ WELL CALIBRATED" if report.is_well_calibrated() else "✗ NEEDS CALIBRATION"
    print(f"\nVerdict: {verdict}")


def print_significance_report(sig: StatisticalSignificance):
    """Print a formatted significance report."""
    print("\n" + "=" * 60)
    print("STATISTICAL SIGNIFICANCE REPORT")
    print("=" * 60)
    
    print(f"\nSample size (n): {sig.n_predictions}")
    print(f"Accuracy: {sig.accuracy:.1f}%")
    print(f"Baseline: {sig.baseline:.1f}%")
    print(f"Edge: {sig.edge:+.1f}%")
    
    print(f"\nZ-score: {sig.z_score:.2f}")
    print(f"P-value: {sig.p_value:.4f}")
    print(f"95% CI: [{sig.confidence_interval_95[0]:.1f}%, {sig.confidence_interval_95[1]:.1f}%]")
    
    if sig.is_significant():
        print("\n✓ STATISTICALLY SIGNIFICANT (p < 0.05)")
    else:
        required = sig.required_n_for_significance()
        if required != float('inf'):
            print(f"\n✗ NOT SIGNIFICANT - Need ~{required} predictions at current edge")
        else:
            print("\n✗ NO POSITIVE EDGE")


def print_train_test_report(results: dict):
    """Print a formatted train/test split report."""
    print("\n" + "=" * 60)
    print("TRAIN/TEST SPLIT VALIDATION")
    print("=" * 60)
    
    if "error" in results:
        print(f"\nError: {results['error']}")
        return
    
    train = results["train"]
    test = results["test"]
    
    print(f"\n{'Metric':<15} {'Train':>15} {'Test':>15}")
    print("-" * 50)
    print(f"{'N predictions':<15} {train['n']:>15} {test['n']:>15}")
    print(f"{'Accuracy':<15} {train['accuracy']:>14.1f}% {test['accuracy']:>14.1f}%")
    print(f"{'Edge vs 50%':<15} {train['edge']:>+14.1f}% {test['edge']:>+14.1f}%")
    print(f"{'P-value':<15} {train['p_value']:>15.4f} {test['p_value']:>15.4f}")
    print(f"{'Significant?':<15} {str(train['significant']):>15} {str(test['significant']):>15}")
    
    print(f"\nEdge persistence: {results['edge_persistence']:.1%}")
    print(f"Verdict: {results['verdict']}")
