#!/usr/bin/env python3
"""
Verification Engine

Compares predictions vs actual outcomes and calculates accuracy metrics.
This is where the truth lives - did our predictions actually work?
"""

import sys
import os
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Direction, Magnitude, Prediction, Database
from data.coingecko import CoinGeckoClient


@dataclass
class VerificationResult:
    """Result of verifying a single prediction."""
    prediction_id: str
    success: bool
    actual_direction: Optional[Direction]
    actual_magnitude: Optional[Magnitude]
    actual_pct_change: Optional[float]
    direction_correct: Optional[bool]
    magnitude_correct: Optional[bool]
    error: Optional[str] = None


class Verifier:
    """
    Verifies predictions against actual market outcomes.
    
    This is the moment of truth - we find out if our predictions were right.
    """
    
    def __init__(self, db: Database, client: Optional[CoinGeckoClient] = None):
        self.db = db
        self.client = client or CoinGeckoClient(db)
    
    def verify_pending(self) -> list[VerificationResult]:
        """
        Verify all predictions that are due for verification.
        
        A prediction is due when:
        - It hasn't been verified yet
        - Its target_time has passed
        """
        now = datetime.utcnow()
        pending = self.db.get_unverified_predictions(before=now)
        
        results = []
        for prediction in pending:
            result = self.verify_prediction(prediction)
            results.append(result)
        
        return results
    
    def verify_prediction(self, prediction: Prediction) -> VerificationResult:
        """
        Verify a single prediction against actual outcome.
        
        Returns:
            VerificationResult with the outcome
        """
        try:
            # Get the actual price at target time
            actual_price = self.db.get_price_at_time(
                prediction.asset,
                prediction.target_time,
                tolerance_hours=2
            )
            
            if actual_price is None:
                # Try to fetch from API
                # Note: This only works for recent data
                current_price = self.client.get_current_price(prediction.asset)
                
                # Check if current time is close to target time
                now = datetime.utcnow()
                if abs((now - prediction.target_time).total_seconds()) <= 7200:  # 2 hours
                    actual_price = current_price
            
            if actual_price is None:
                return VerificationResult(
                    prediction_id=prediction.id,
                    success=False,
                    actual_direction=None,
                    actual_magnitude=None,
                    actual_pct_change=None,
                    direction_correct=None,
                    magnitude_correct=None,
                    error="Could not find actual price at target time"
                )
            
            # Calculate actual change
            start_price = prediction.price_at_prediction
            end_price = actual_price.price_usd
            pct_change = ((end_price - start_price) / start_price) * 100
            
            actual_direction = Direction.UP if pct_change >= 0 else Direction.DOWN
            actual_magnitude = Magnitude.from_percentage(pct_change)
            
            direction_correct = prediction.direction == actual_direction
            magnitude_correct = prediction.magnitude == actual_magnitude
            
            # Update prediction in database
            prediction.price_at_target = end_price
            prediction.actual_direction = actual_direction
            prediction.actual_magnitude = actual_magnitude
            prediction.direction_correct = direction_correct
            prediction.magnitude_correct = magnitude_correct
            prediction.verified_at = datetime.utcnow()
            
            self.db.save_prediction(prediction)
            
            return VerificationResult(
                prediction_id=prediction.id,
                success=True,
                actual_direction=actual_direction,
                actual_magnitude=actual_magnitude,
                actual_pct_change=pct_change,
                direction_correct=direction_correct,
                magnitude_correct=magnitude_correct
            )
            
        except Exception as e:
            return VerificationResult(
                prediction_id=prediction.id,
                success=False,
                actual_direction=None,
                actual_magnitude=None,
                actual_pct_change=None,
                direction_correct=None,
                magnitude_correct=None,
                error=str(e)
            )
    
    def calculate_brier_score(self, predictions: list[Prediction]) -> float:
        """
        Calculate Brier score for a set of verified predictions.
        
        Brier score measures the accuracy of probabilistic predictions.
        Lower is better (0 = perfect, 1 = worst).
        
        For each prediction:
        - If direction was correct: score = (1 - confidence)^2
        - If direction was wrong: score = confidence^2
        
        Final score is the mean.
        """
        verified = [p for p in predictions if p.verified_at is not None and p.direction_correct is not None]
        
        if not verified:
            return 1.0  # Worst possible score if no data
        
        total_score = 0.0
        for p in verified:
            if p.direction_correct:
                # Prediction was right - ideally confidence was high
                total_score += (1 - p.confidence) ** 2
            else:
                # Prediction was wrong - ideally confidence was low
                total_score += p.confidence ** 2
        
        return total_score / len(verified)
    
    def get_leaderboard(self) -> list[dict]:
        """
        Get strategy leaderboard with all metrics.
        
        Returns:
            List of dicts with strategy stats, sorted by direction accuracy
        """
        stats_list = self.db.get_strategy_stats()
        
        leaderboard = []
        for stats in stats_list:
            # Get predictions for Brier score
            predictions = self.db.get_predictions_by_strategy(stats.strategy, verified_only=True)
            brier_score = self.calculate_brier_score(predictions)
            
            leaderboard.append({
                "strategy": stats.strategy,
                "total_predictions": stats.total_predictions,
                "verified_predictions": stats.verified_predictions,
                "direction_accuracy": round(stats.direction_accuracy, 2),
                "magnitude_accuracy": round(stats.magnitude_accuracy, 2),
                "brier_score": round(brier_score, 4),
                "beats_random": stats.direction_accuracy > 50.0
            })
        
        # Sort by direction accuracy (descending)
        leaderboard.sort(key=lambda x: x["direction_accuracy"], reverse=True)
        
        return leaderboard
    
    def print_leaderboard(self):
        """Print a formatted leaderboard."""
        leaderboard = self.get_leaderboard()
        
        print("\n" + "=" * 80)
        print("STRATEGY LEADERBOARD")
        print("=" * 80)
        
        if not leaderboard:
            print("No verified predictions yet.")
            return
        
        print(f"{'Strategy':<18} {'Verified':>10} {'Dir Acc':>10} {'Mag Acc':>10} {'Brier':>8} {'Status':>10}")
        print("-" * 80)
        
        for entry in leaderboard:
            status = "✓ BEATS" if entry["beats_random"] else "✗ FAILS"
            print(
                f"{entry['strategy']:<18} "
                f"{entry['verified_predictions']:>10} "
                f"{entry['direction_accuracy']:>9.1f}% "
                f"{entry['magnitude_accuracy']:>9.1f}% "
                f"{entry['brier_score']:>8.4f} "
                f"{status:>10}"
            )
        
        print("-" * 80)
        print("Brier Score: 0.0 = perfect calibration, 1.0 = worst possible")
        print("Status: Beats random 50% baseline for direction predictions")


def main():
    """Run verification on pending predictions."""
    db = Database("market_predictions.db")
    verifier = Verifier(db)
    
    print("Checking for predictions to verify...")
    results = verifier.verify_pending()
    
    if not results:
        print("No predictions due for verification.")
    else:
        print(f"\nVerified {len(results)} predictions:")
        for r in results:
            if r.success:
                status = "✓" if r.direction_correct else "✗"
                print(f"  {status} {r.prediction_id[:8]}... - {r.actual_pct_change:+.2f}% actual")
            else:
                print(f"  ? {r.prediction_id[:8]}... - {r.error}")
    
    # Print leaderboard
    verifier.print_leaderboard()
    
    db.close()


if __name__ == "__main__":
    main()
