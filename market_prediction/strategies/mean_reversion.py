"""
Mean Reversion Strategy

Counter-trend strategy: if price moved significantly in one direction,
predict it will revert back.

"What goes up must come down" - contrarian approach.

This exploits the tendency of markets to oscillate around a mean,
especially after extreme moves.
"""

from typing import List, Tuple

from .base import Strategy
from ..data.models import PriceHistory, Direction, Magnitude


class MeanReversionStrategy(Strategy):
    """
    Mean Reversion strategy.
    
    Logic:
    - Look at the price change over the lookback period
    - If price went up significantly, predict DOWN (reversion)
    - If price went down significantly, predict UP (reversion)
    - Small moves get neutral predictions (no strong signal)
    - Confidence based on how extreme the recent move was
    """
    
    def __init__(self, lookback_hours: int = 24, threshold_pct: float = 2.0):
        super().__init__(
            name="mean_reversion",
            description=f"Contrarian - bet against big moves ({threshold_pct}% threshold)"
        )
        self.lookback_hours = lookback_hours
        self.threshold_pct = threshold_pct
    
    def predict(
        self,
        asset: str,
        price_history: List[PriceHistory],
        current_price: float
    ) -> Tuple[Direction, Magnitude, float]:
        """
        Predict based on mean reversion assumption.
        """
        if not price_history or len(price_history) < 2:
            # Not enough data - default to neutral
            return Direction.UP, Magnitude.SMALL, 0.5
        
        # Get price from lookback period ago
        lookback_price = self._get_lookback_price(price_history)
        
        # Calculate percentage change
        pct_change = ((current_price - lookback_price) / lookback_price) * 100
        abs_change = abs(pct_change)
        
        # Mean reversion: predict OPPOSITE of recent move
        if abs_change < self.threshold_pct:
            # Small move - weak signal, predict continuation (slight momentum bias)
            direction = Direction.UP if pct_change > 0 else Direction.DOWN
            magnitude = Magnitude.SMALL
            confidence = 0.5
        else:
            # Significant move - predict reversion
            direction = Direction.DOWN if pct_change > 0 else Direction.UP
            
            # Magnitude prediction: expect a smaller reversion than the original move
            if abs_change > 5:
                magnitude = Magnitude.MEDIUM  # Big moves revert partially
            else:
                magnitude = Magnitude.SMALL   # Medium moves have small reversions
            
            # Confidence increases with extremity of move
            if abs_change > 7:
                confidence = 0.7
            elif abs_change > 5:
                confidence = 0.65
            else:
                confidence = 0.58
        
        return direction, magnitude, confidence
    
    def _get_lookback_price(self, price_history: List[PriceHistory]) -> float:
        """Get the price from the lookback period ago."""
        # Use the oldest price in the provided history
        return price_history[0].price_usd
