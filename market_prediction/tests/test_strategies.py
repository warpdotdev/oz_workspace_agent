#!/usr/bin/env python3
"""
Unit tests for market prediction strategies and verification logic.
"""

import unittest
import os
import sys
from datetime import datetime, timedelta
import tempfile

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Direction, Magnitude, PricePoint, Prediction, Database
from strategies.base import (
    RandomStrategy,
    MomentumStrategy,
    MeanReversionStrategy,
    SMAStrategy,
    get_all_strategies,
)


class TestMagnitude(unittest.TestCase):
    """Test magnitude bucket classification."""
    
    def test_small_magnitude(self):
        self.assertEqual(Magnitude.from_percentage(0.5), Magnitude.SMALL)
        self.assertEqual(Magnitude.from_percentage(1.9), Magnitude.SMALL)
        self.assertEqual(Magnitude.from_percentage(-1.0), Magnitude.SMALL)
    
    def test_medium_magnitude(self):
        self.assertEqual(Magnitude.from_percentage(2.0), Magnitude.MEDIUM)
        self.assertEqual(Magnitude.from_percentage(3.5), Magnitude.MEDIUM)
        self.assertEqual(Magnitude.from_percentage(-4.9), Magnitude.MEDIUM)
    
    def test_large_magnitude(self):
        self.assertEqual(Magnitude.from_percentage(5.0), Magnitude.LARGE)
        self.assertEqual(Magnitude.from_percentage(10.0), Magnitude.LARGE)
        self.assertEqual(Magnitude.from_percentage(-7.5), Magnitude.LARGE)


class TestStrategies(unittest.TestCase):
    """Test prediction strategies."""
    
    def setUp(self):
        """Create test price history."""
        self.now = datetime.utcnow()
        self.base_price = 50000.0
        
        # Create 7 days of hourly price data
        self.price_history = []
        for i in range(168):  # 7 days * 24 hours
            timestamp = self.now - timedelta(hours=168-i)
            # Add some variation
            variation = (i % 24) * 10  # Simple hourly variation
            price = self.base_price + variation
            self.price_history.append(PricePoint(
                asset="bitcoin",
                timestamp=timestamp,
                price_usd=price
            ))
        
        self.current_price = self.price_history[-1].price_usd
    
    def test_random_strategy(self):
        """Test that random strategy always returns a prediction."""
        strategy = RandomStrategy()
        
        for _ in range(10):
            prediction = strategy.predict(
                asset="bitcoin",
                current_price=self.current_price,
                price_history=self.price_history,
                prediction_time=self.now
            )
            
            self.assertIsNotNone(prediction)
            self.assertIn(prediction.direction, [Direction.UP, Direction.DOWN])
            self.assertIn(prediction.magnitude, [Magnitude.SMALL, Magnitude.MEDIUM, Magnitude.LARGE])
            self.assertEqual(prediction.confidence, 0.5)
    
    def test_momentum_strategy(self):
        """Test momentum strategy follows recent trend."""
        strategy = MomentumStrategy()
        
        # Create uptrend history
        uptrend_history = []
        for i in range(48):
            timestamp = self.now - timedelta(hours=48-i)
            price = 50000 + (i * 100)  # Consistent uptrend
            uptrend_history.append(PricePoint(
                asset="bitcoin",
                timestamp=timestamp,
                price_usd=price
            ))
        
        prediction = strategy.predict(
            asset="bitcoin",
            current_price=uptrend_history[-1].price_usd,
            price_history=uptrend_history,
            prediction_time=self.now
        )
        
        self.assertIsNotNone(prediction)
        self.assertEqual(prediction.direction, Direction.UP)
    
    def test_mean_reversion_strategy(self):
        """Test mean reversion predicts reversal after big move."""
        strategy = MeanReversionStrategy(threshold_pct=2.0)
        
        # Create history with big recent drop
        history = []
        for i in range(48):
            timestamp = self.now - timedelta(hours=48-i)
            if i < 24:
                price = 50000  # Flat first day
            else:
                price = 50000 - ((i - 24) * 200)  # Drop second day
            history.append(PricePoint(
                asset="bitcoin",
                timestamp=timestamp,
                price_usd=price
            ))
        
        prediction = strategy.predict(
            asset="bitcoin",
            current_price=history[-1].price_usd,
            price_history=history,
            prediction_time=self.now
        )
        
        self.assertIsNotNone(prediction)
        # After a big drop, mean reversion should predict UP
        self.assertEqual(prediction.direction, Direction.UP)
    
    def test_sma_strategy(self):
        """Test SMA strategy returns prediction with enough data."""
        strategy = SMAStrategy()
        
        prediction = strategy.predict(
            asset="bitcoin",
            current_price=self.current_price,
            price_history=self.price_history,
            prediction_time=self.now
        )
        
        self.assertIsNotNone(prediction)
        self.assertIn(prediction.direction, [Direction.UP, Direction.DOWN])
    
    def test_sma_strategy_insufficient_data(self):
        """Test SMA strategy returns None with insufficient data."""
        strategy = SMAStrategy()
        
        # Only 24 hours of data
        short_history = self.price_history[-24:]
        
        prediction = strategy.predict(
            asset="bitcoin",
            current_price=self.current_price,
            price_history=short_history,
            prediction_time=self.now
        )
        
        # Should return None due to insufficient data
        self.assertIsNone(prediction)
    
    def test_all_strategies_available(self):
        """Test that all strategies are available in registry."""
        strategies = get_all_strategies()
        
        self.assertEqual(len(strategies), 4)
        names = [s.name for s in strategies]
        self.assertIn("random", names)
        self.assertIn("momentum", names)
        self.assertIn("mean_reversion", names)
        self.assertIn("sma_crossover", names)


class TestDatabase(unittest.TestCase):
    """Test database operations."""
    
    def setUp(self):
        """Create temporary database."""
        self.temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
        self.temp_file.close()
        self.db = Database(self.temp_file.name)
    
    def tearDown(self):
        """Clean up temporary database."""
        self.db.close()
        os.unlink(self.temp_file.name)
    
    def test_save_and_retrieve_price(self):
        """Test saving and retrieving prices."""
        now = datetime.utcnow()
        price = PricePoint(
            asset="bitcoin",
            timestamp=now,
            price_usd=50000.0
        )
        
        self.db.save_price(price)
        
        # Retrieve
        retrieved = self.db.get_latest_price("bitcoin")
        
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.asset, "bitcoin")
        self.assertEqual(retrieved.price_usd, 50000.0)
    
    def test_save_and_retrieve_prediction(self):
        """Test saving and retrieving predictions."""
        now = datetime.utcnow()
        prediction = Prediction(
            id="test-123",
            asset="bitcoin",
            strategy="test_strategy",
            prediction_time=now,
            target_time=now + timedelta(hours=24),
            direction=Direction.UP,
            magnitude=Magnitude.SMALL,
            confidence=0.6,
            price_at_prediction=50000.0
        )
        
        self.db.save_prediction(prediction)
        
        # Retrieve
        predictions = self.db.get_recent_predictions(limit=10)
        
        self.assertEqual(len(predictions), 1)
        self.assertEqual(predictions[0].id, "test-123")
        self.assertEqual(predictions[0].direction, Direction.UP)
    
    def test_get_unverified_predictions(self):
        """Test retrieving unverified predictions."""
        now = datetime.utcnow()
        past = now - timedelta(hours=25)  # Target time has passed
        
        prediction = Prediction(
            id="unverified-123",
            asset="bitcoin",
            strategy="test_strategy",
            prediction_time=past - timedelta(hours=24),
            target_time=past,
            direction=Direction.UP,
            magnitude=Magnitude.SMALL,
            confidence=0.6,
            price_at_prediction=50000.0
        )
        
        self.db.save_prediction(prediction)
        
        # Should be in unverified list
        unverified = self.db.get_unverified_predictions(before=now)
        
        self.assertEqual(len(unverified), 1)
        self.assertEqual(unverified[0].id, "unverified-123")


class TestPrediction(unittest.TestCase):
    """Test Prediction model."""
    
    def test_prediction_serialization(self):
        """Test prediction to_dict and from_dict."""
        now = datetime.utcnow()
        prediction = Prediction(
            id="test-123",
            asset="bitcoin",
            strategy="momentum",
            prediction_time=now,
            target_time=now + timedelta(hours=24),
            direction=Direction.UP,
            magnitude=Magnitude.MEDIUM,
            confidence=0.65,
            price_at_prediction=50000.0
        )
        
        # Serialize
        data = prediction.to_dict()
        
        self.assertEqual(data["id"], "test-123")
        self.assertEqual(data["direction"], "UP")
        self.assertEqual(data["magnitude"], "MEDIUM")
        
        # Deserialize
        restored = Prediction.from_dict(data)
        
        self.assertEqual(restored.id, prediction.id)
        self.assertEqual(restored.direction, prediction.direction)
        self.assertEqual(restored.magnitude, prediction.magnitude)


if __name__ == "__main__":
    unittest.main()
