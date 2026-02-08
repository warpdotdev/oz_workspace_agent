#!/usr/bin/env python3
"""
Prediction Verifier

Compares predictions against actual market outcomes.
This is where the truth lives! 📊

- Fetches actual prices at target times
- Calculates accuracy metrics
- Updates strategy statistics
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

sys.path.insert(0, str(Path(__file__).parent.parent))

from data.models import (
    get_session, Prediction, Outcome, StrategyStats,
    Direction, Magnitude, get_direction_from_pct, get_magnitude_from_pct
)
from data.coingecko_client import get_client


class PredictionVerifier:
    """
    Verifies predictions against actual market outcomes.
    
    This is the source of truth - no BS, just cold hard data.
    """
    
    def __init__(self):
        self.client = get_client()
    
    def verify_pending_predictions(self) -> List[Tuple[Prediction, Outcome]]:
        """
        Verify all predictions whose target time has passed.
        
        Returns:
            List of (prediction, outcome) tuples for verified predictions
        """
        session = get_session()
        verified = []
        
        try:
            # Get predictions ready for verification
            now = datetime.utcnow()
            pending = session.query(Prediction)\
                .filter(Prediction.target_time <= now)\
                .filter(Prediction.outcome == None)\
                .all()
            
            print(f"📋 Found {len(pending)} predictions to verify")
            
            for prediction in pending:
                outcome = self._verify_single_prediction(prediction, session)
                if outcome:
                    verified.append((prediction, outcome))
            
            session.commit()
            print(f"✅ Verified {len(verified)} predictions")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error during verification: {e}")
            raise
        finally:
            session.close()
        
        return verified
    
    def _verify_single_prediction(
        self, 
        prediction: Prediction, 
        session
    ) -> Optional[Outcome]:
        """Verify a single prediction and record the outcome."""
        
        # Get current price (or price at target time if in past)
        if prediction.target_time.date() < datetime.utcnow().date():
            actual_price = self.client.get_price_at_time(
                prediction.symbol, 
                prediction.target_time
            )
        else:
            price_data = self.client.get_current_price(prediction.symbol)
            actual_price = price_data.price_usd if price_data else None
        
        if actual_price is None:
            print(f"  ⚠️ Could not get price for {prediction.symbol}")
            return None
        
        # Calculate actual price change
        if prediction.price_at_prediction is None or prediction.price_at_prediction == 0:
            print(f"  ⚠️ Missing price_at_prediction for {prediction.id}")
            return None
        
        price_change_pct = (
            (actual_price - prediction.price_at_prediction) 
            / prediction.price_at_prediction * 100
        )
        
        # Determine actual direction and magnitude
        actual_direction = get_direction_from_pct(price_change_pct)
        actual_magnitude = get_magnitude_from_pct(price_change_pct)
        
        # Check if predictions were correct
        direction_correct = 1 if prediction.predicted_direction == actual_direction else 0
        magnitude_correct = 1 if prediction.predicted_magnitude == actual_magnitude else 0
        
        # Create outcome record
        outcome = Outcome(
            prediction_id=prediction.id,
            actual_direction=actual_direction,
            actual_magnitude=actual_magnitude,
            actual_price_change_pct=price_change_pct,
            actual_price=actual_price,
            direction_correct=direction_correct,
            magnitude_correct=magnitude_correct
        )
        session.add(outcome)
        
        # Update strategy stats
        self._update_strategy_stats(prediction.strategy_name, outcome, session)
        
        # Print result
        status = "✅" if direction_correct else "❌"
        print(f"  {status} [{prediction.strategy_name}] {prediction.symbol}: "
              f"Predicted {prediction.predicted_direction.value}, "
              f"Actual {actual_direction.value} ({price_change_pct:+.2f}%)")
        
        return outcome
    
    def _update_strategy_stats(
        self, 
        strategy_name: str, 
        outcome: Outcome, 
        session
    ):
        """Update strategy statistics with new verification result."""
        stats = session.query(StrategyStats).filter_by(name=strategy_name).first()
        
        if not stats:
            # Shouldn't happen, but create if needed
            stats = StrategyStats(name=strategy_name)
            session.add(stats)
        
        stats.verified_predictions += 1
        stats.correct_direction += outcome.direction_correct
        stats.correct_magnitude += outcome.magnitude_correct
        stats.last_verified_at = datetime.utcnow()
        
        # Recalculate accuracy
        stats.update_accuracy()
    
    def get_verification_summary(self) -> dict:
        """Get a summary of verification statistics."""
        session = get_session()
        try:
            total_predictions = session.query(Prediction).count()
            verified_count = session.query(Outcome).count()
            pending_count = session.query(Prediction)\
                .filter(Prediction.outcome == None)\
                .filter(Prediction.target_time <= datetime.utcnow())\
                .count()
            
            # Calculate overall accuracy
            if verified_count > 0:
                direction_correct = session.query(Outcome)\
                    .filter(Outcome.direction_correct == 1).count()
                magnitude_correct = session.query(Outcome)\
                    .filter(Outcome.magnitude_correct == 1).count()
                
                direction_accuracy = direction_correct / verified_count
                magnitude_accuracy = magnitude_correct / verified_count
            else:
                direction_accuracy = 0
                magnitude_accuracy = 0
            
            return {
                "total_predictions": total_predictions,
                "verified": verified_count,
                "pending": pending_count,
                "direction_accuracy": direction_accuracy,
                "magnitude_accuracy": magnitude_accuracy
            }
        finally:
            session.close()
    
    def get_strategy_performance(self) -> List[dict]:
        """Get performance metrics for each strategy."""
        session = get_session()
        try:
            stats = session.query(StrategyStats)\
                .order_by(StrategyStats.direction_accuracy.desc())\
                .all()
            
            return [
                {
                    "name": s.name,
                    "description": s.description,
                    "total_predictions": s.total_predictions,
                    "verified": s.verified_predictions,
                    "direction_accuracy": s.direction_accuracy,
                    "magnitude_accuracy": s.magnitude_accuracy,
                    "combined_accuracy": s.combined_accuracy
                }
                for s in stats
            ]
        finally:
            session.close()


def verify_predictions():
    """Convenience function to run verification."""
    verifier = PredictionVerifier()
    return verifier.verify_pending_predictions()


if __name__ == "__main__":
    print("🔍 Market Prediction Engine - Verification")
    print("=" * 60)
    verify_predictions()
    
    print("\n📊 Summary:")
    verifier = PredictionVerifier()
    summary = verifier.get_verification_summary()
    print(f"  Total predictions: {summary['total_predictions']}")
    print(f"  Verified: {summary['verified']}")
    print(f"  Pending: {summary['pending']}")
    print(f"  Direction accuracy: {summary['direction_accuracy']:.1%}")
    print(f"  Magnitude accuracy: {summary['magnitude_accuracy']:.1%}")
