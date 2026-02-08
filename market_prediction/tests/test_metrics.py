#!/usr/bin/env python3
"""
Tests for advanced verification metrics.

These tests verify that our statistical analysis is correct.
Because if we're lying to ourselves about our edge, what's the point?
"""

import sys
import os
import unittest
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Prediction, Direction, Magnitude
from verification.metrics import (
    calculate_calibration,
    calculate_significance,
    train_test_split_backtest,
    CalibrationBucket,
)


def make_prediction(
    direction_correct: bool,
    confidence: float = 0.5,
    days_ago: int = 0
) -> Prediction:
    """Helper to create a verified prediction for testing."""
    now = datetime.utcnow()
    pred_time = now - timedelta(days=days_ago)
    
    return Prediction(
        id=f"test-{days_ago}-{direction_correct}",
        asset="bitcoin",
        strategy="test_strategy",
        prediction_time=pred_time,
        target_time=pred_time + timedelta(hours=24),
        direction=Direction.UP,
        magnitude=Magnitude.SMALL,
        confidence=confidence,
        price_at_prediction=50000.0,
        price_at_target=51000.0 if direction_correct else 49000.0,
        actual_direction=Direction.UP if direction_correct else Direction.DOWN,
        actual_magnitude=Magnitude.SMALL,
        direction_correct=direction_correct,
        magnitude_correct=True,
        verified_at=pred_time + timedelta(hours=24)
    )


class TestStatisticalSignificance(unittest.TestCase):
    """Tests for statistical significance calculations."""
    
    def test_perfect_accuracy_is_significant(self):
        """100% accuracy with reasonable n should be significant."""
        sig = calculate_significance(n_correct=20, n_total=20, baseline=50.0)
        
        self.assertEqual(sig.accuracy, 100.0)
        self.assertEqual(sig.edge, 50.0)
        self.assertTrue(sig.is_significant())
        self.assertLess(sig.p_value, 0.001)
    
    def test_random_accuracy_not_significant(self):
        """50% accuracy should not be significant."""
        sig = calculate_significance(n_correct=50, n_total=100, baseline=50.0)
        
        self.assertEqual(sig.accuracy, 50.0)
        self.assertEqual(sig.edge, 0.0)
        self.assertFalse(sig.is_significant())
        self.assertGreater(sig.p_value, 0.05)
    
    def test_small_edge_large_n(self):
        """Small edge can be significant with large n."""
        # 55% accuracy with n=400 should be significant
        sig = calculate_significance(n_correct=220, n_total=400, baseline=50.0)
        
        self.assertAlmostEqual(sig.accuracy, 55.0, places=5)
        self.assertAlmostEqual(sig.edge, 5.0, places=5)
        self.assertTrue(sig.is_significant())
    
    def test_small_edge_small_n(self):
        """Small edge is NOT significant with small n."""
        # 60% accuracy with n=30 should NOT be significant
        sig = calculate_significance(n_correct=18, n_total=30, baseline=50.0)
        
        self.assertEqual(sig.accuracy, 60.0)
        self.assertEqual(sig.edge, 10.0)
        self.assertFalse(sig.is_significant())
    
    def test_required_n_calculation(self):
        """Test calculation of required n for significance."""
        sig = calculate_significance(n_correct=60, n_total=100, baseline=50.0)
        
        # With 10% edge, should need ~97 predictions for significance
        required = sig.required_n_for_significance()
        self.assertGreater(required, 50)
        self.assertLess(required, 150)
    
    def test_empty_predictions(self):
        """Handle zero predictions gracefully."""
        sig = calculate_significance(n_correct=0, n_total=0, baseline=50.0)
        
        self.assertEqual(sig.accuracy, 0.0)
        self.assertEqual(sig.p_value, 1.0)
        self.assertFalse(sig.is_significant())


class TestConfidenceCalibration(unittest.TestCase):
    """Tests for confidence calibration analysis."""
    
    def test_perfect_calibration(self):
        """Test perfectly calibrated predictions."""
        predictions = []
        
        # Create predictions where actual accuracy matches confidence
        # Low confidence (0.3) - 30% correct
        for i in range(10):
            predictions.append(make_prediction(
                direction_correct=(i < 3),  # 3/10 correct
                confidence=0.3,
                days_ago=i
            ))
        
        # High confidence (0.7) - 70% correct
        for i in range(10):
            predictions.append(make_prediction(
                direction_correct=(i < 7),  # 7/10 correct
                confidence=0.7,
                days_ago=i + 10
            ))
        
        report = calculate_calibration(predictions, n_buckets=5)
        
        # ECE should be relatively low for well-calibrated predictions
        self.assertLess(report.expected_calibration_error, 0.2)
    
    def test_overconfident_predictions(self):
        """Test when we're overconfident (high confidence, low accuracy)."""
        predictions = []
        
        # High confidence (0.8) but only 30% correct
        for i in range(10):
            predictions.append(make_prediction(
                direction_correct=(i < 3),
                confidence=0.8,
                days_ago=i
            ))
        
        report = calculate_calibration(predictions, n_buckets=5)
        
        # Should show overconfidence
        self.assertGreater(report.overconfidence_ratio, 0.5)
    
    def test_empty_predictions(self):
        """Handle empty prediction list."""
        report = calculate_calibration([], n_buckets=5)
        
        self.assertEqual(report.expected_calibration_error, 1.0)
        self.assertEqual(len(report.buckets), 0)


class TestTrainTestSplit(unittest.TestCase):
    """Tests for train/test split validation."""
    
    def test_consistent_edge(self):
        """Test when edge is consistent across train/test."""
        predictions = []
        
        # Create 20 predictions with 60% accuracy throughout
        for i in range(20):
            predictions.append(make_prediction(
                direction_correct=(i % 5 != 0),  # 80% correct
                confidence=0.6,
                days_ago=20 - i
            ))
        
        results = train_test_split_backtest(predictions, train_ratio=0.6)
        
        self.assertNotIn("error", results)
        self.assertIn("train", results)
        self.assertIn("test", results)
        self.assertIn("edge_persistence", results)
        
        # Both should show positive edge
        self.assertGreater(results["train"]["edge"], 0)
        self.assertGreater(results["test"]["edge"], 0)
    
    def test_overfit_detection(self):
        """Test detection of overfitting (edge disappears in test)."""
        predictions = []
        
        # Train period: 80% accuracy (first 12)
        for i in range(12):
            predictions.append(make_prediction(
                direction_correct=(i % 5 != 0),  # 80% correct
                confidence=0.7,
                days_ago=20 - i
            ))
        
        # Test period: 50% accuracy (last 8)
        for i in range(8):
            predictions.append(make_prediction(
                direction_correct=(i % 2 == 0),  # 50% correct
                confidence=0.7,
                days_ago=8 - i
            ))
        
        results = train_test_split_backtest(predictions, train_ratio=0.6)
        
        # Edge should persist less than 50%
        self.assertLess(results["edge_persistence"], 0.5)
    
    def test_insufficient_data(self):
        """Handle insufficient data gracefully."""
        predictions = [
            make_prediction(direction_correct=True, days_ago=i)
            for i in range(5)
        ]
        
        results = train_test_split_backtest(predictions)
        
        self.assertIn("error", results)


class TestCalibrationBucket(unittest.TestCase):
    """Tests for calibration bucket calculations."""
    
    def test_bucket_accuracy(self):
        """Test bucket accuracy calculation."""
        bucket = CalibrationBucket(
            confidence_range=(0.6, 0.8),
            total_predictions=10,
            correct_predictions=7
        )
        
        self.assertEqual(bucket.actual_accuracy, 0.7)
        self.assertEqual(bucket.expected_accuracy, 0.7)
        self.assertAlmostEqual(bucket.calibration_error, 0.0, places=5)
    
    def test_bucket_overconfidence(self):
        """Test bucket showing overconfidence."""
        bucket = CalibrationBucket(
            confidence_range=(0.8, 1.0),
            total_predictions=10,
            correct_predictions=5
        )
        
        self.assertEqual(bucket.actual_accuracy, 0.5)
        self.assertEqual(bucket.expected_accuracy, 0.9)
        self.assertAlmostEqual(bucket.calibration_error, -0.4, places=5)


if __name__ == "__main__":
    unittest.main()
