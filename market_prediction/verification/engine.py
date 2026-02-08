#!/usr/bin/env python3
"""
Verification Engine

The truth-telling component. Compares predictions against actual outcomes
and calculates accuracy metrics. This is where the receipts live.
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

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
    """Summary of verification results"""
    total_verified: int
    direction_accuracy: float
    magnitude_accuracy: float
    combined_accuracy: float  # Both direction AND magnitude correct
    by_strategy: Dict[str, Dict[str, float]]


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
    
    def print_leaderboard(self, days: int = 30):
        """Print a leaderboard of strategy performance"""
        summary = self.get_verification_summary(days)
        
        print(f"\n{'='*60}")
        print(f"STRATEGY LEADERBOARD (Last {days} days)")
        print(f"{'='*60}")
        
        if not summary.by_strategy:
            print("No verified predictions yet.")
            return
        
        # Sort by direction accuracy (most important metric)
        ranked = sorted(
            summary.by_strategy.items(),
            key=lambda x: x[1]['direction_accuracy'],
            reverse=True
        )
        
        print(f"\n{'Strategy':<20} {'Dir Acc':<10} {'Mag Acc':<10} {'Combined':<10} {'N':<6}")
        print("-" * 60)
        
        for i, (name, metrics) in enumerate(ranked, 1):
            medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
            print(f"{medal} {name:<18} {metrics['direction_accuracy']*100:>6.1f}%   "
                  f"{metrics['magnitude_accuracy']*100:>6.1f}%   "
                  f"{metrics['combined_accuracy']*100:>6.1f}%   "
                  f"{metrics['total']:<6}")
        
        print(f"\n{'='*60}")
        print(f"Overall: {summary.total_verified} predictions verified")
        print(f"  Direction accuracy: {summary.direction_accuracy*100:.1f}%")
        print(f"  Magnitude accuracy: {summary.magnitude_accuracy*100:.1f}%")
        print(f"  Combined accuracy:  {summary.combined_accuracy*100:.1f}%")
        
        # Compare to random baseline
        random_perf = summary.by_strategy.get('random_baseline', {})
        if random_perf:
            print(f"\nRandom baseline: {random_perf.get('direction_accuracy', 0)*100:.1f}% direction accuracy")
            
            # Find best non-random strategy
            non_random = [(n, m) for n, m in ranked if n != 'random_baseline']
            if non_random:
                best_name, best_metrics = non_random[0]
                if best_metrics['direction_accuracy'] > random_perf.get('direction_accuracy', 0):
                    improvement = (best_metrics['direction_accuracy'] - 
                                  random_perf.get('direction_accuracy', 0)) * 100
                    print(f"Best strategy ({best_name}) beats random by {improvement:.1f} percentage points")
                else:
                    print(f"⚠️  No strategy is currently beating random baseline!")


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
