"""
Verification Engine

This module verifies predictions against actual market outcomes.
It runs periodically (or on-demand) to check predictions that
have reached their target time.
"""

from datetime import datetime
from typing import List, Tuple

from ..data.database import Database
from ..data.coingecko import CoinGeckoClient
from ..data.models import Prediction


class Verifier:
    """
    Verifies predictions against actual market outcomes.
    
    This is the "truth machine" - it compares what we predicted
    against what actually happened.
    """
    
    def __init__(self, db: Database, client: CoinGeckoClient = None):
        self.db = db
        self.client = client or CoinGeckoClient()
    
    def verify_pending(self) -> List[Tuple[Prediction, bool]]:
        """
        Verify all predictions that are due for verification.
        
        Returns:
            List of (prediction, success) tuples where success
            indicates if verification completed successfully.
        """
        pending = self.db.get_pending_verifications()
        results = []
        
        for prediction in pending:
            success = self._verify_prediction(prediction)
            results.append((prediction, success))
        
        return results
    
    def _verify_prediction(self, prediction: Prediction) -> bool:
        """
        Verify a single prediction.
        
        Returns True if verification succeeded, False otherwise.
        """
        # First, try to get price from our stored history
        price_record = self.db.get_price_at_time(
            prediction.asset, 
            prediction.target_time,
            tolerance_minutes=120  # 2 hour tolerance
        )
        
        if price_record:
            actual_price = price_record.price_usd
        else:
            # Fetch current price if target time is recent
            current_time = datetime.utcnow()
            hours_since_target = (current_time - prediction.target_time).total_seconds() / 3600
            
            if hours_since_target < 2:  # Within 2 hours of target
                price_data = self.client.get_current_price(prediction.asset)
                if price_data:
                    actual_price = price_data.price_usd
                    # Store for future reference
                    self.db.save_price(price_data)
                else:
                    return False
            else:
                # Target time is too far in the past, try historical API
                price_data = self.client.get_price_at_date(
                    prediction.asset,
                    prediction.target_time
                )
                if price_data:
                    actual_price = price_data.price_usd
                    self.db.save_price(price_data)
                else:
                    return False
        
        # Verify the prediction
        prediction.verify(actual_price)
        
        # Save updated prediction
        self.db.save_prediction(prediction)
        
        return True
    
    def get_leaderboard(self) -> List[dict]:
        """
        Get the strategy leaderboard sorted by directional accuracy.
        
        Returns a list of strategy performance dicts.
        """
        performances = self.db.get_strategy_performance()
        
        # Sort by direction accuracy (primary) then by verified predictions (secondary)
        sorted_perf = sorted(
            performances,
            key=lambda p: (p.direction_accuracy, p.verified_predictions),
            reverse=True
        )
        
        return [p.to_dict() for p in sorted_perf]
