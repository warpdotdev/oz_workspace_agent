"""
Base strategy interface.

All prediction strategies must implement this interface.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from ..data.models import Prediction, PriceHistory, Direction, Magnitude


class Strategy(ABC):
    """
    Base class for all prediction strategies.
    
    A strategy takes historical price data and produces a prediction
    for the next 24 hours.
    """
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    def predict(
        self, 
        asset: str, 
        price_history: List[PriceHistory],
        current_price: float
    ) -> Tuple[Direction, Magnitude, float]:
        """
        Make a prediction based on price history.
        
        Args:
            asset: The asset to predict
            price_history: Historical price data (oldest first)
            current_price: Current price of the asset
            
        Returns:
            Tuple of (direction, magnitude, confidence)
        """
        pass
    
    def create_prediction(
        self,
        asset: str,
        price_history: List[PriceHistory],
        current_price: float
    ) -> Prediction:
        """
        Create a full Prediction object.
        
        This is a convenience method that wraps predict() and creates
        the full prediction record.
        """
        direction, magnitude, confidence = self.predict(asset, price_history, current_price)
        
        now = datetime.utcnow()
        
        return Prediction(
            asset=asset,
            strategy=self.name,
            prediction_time=now,
            target_time=now + timedelta(hours=24),
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            price_at_prediction=current_price,
        )
    
    def __repr__(self):
        return f"Strategy({self.name})"
