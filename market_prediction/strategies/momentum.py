"""
Momentum Strategy

Simple trend following: if it went up recently, predict it will continue up.
This exploits the tendency of markets to trend in the short term.

"The trend is your friend."
"""

from typing import List, Tuple

from .base import Strategy
from ..data.models import PriceHistory, Direction, Magnitude


class MomentumStrategy(Strategy):
    """
    Momentum/Trend Following strategy.
    
    Logic:
    - Look at the price change over the lookback period
    - If price went up, predict UP
    - If price went down, predict DOWN
    - Magnitude based on how strong the recent move was
    - Confidence based on consistency of the trend
    """
    
    def __init__(self, lookback_hours: int = 24):
        super().__init__(
            name="momentum",
            description=f"Trend following - if it's going up, predict up ({lookback_hours}h lookback)"
        )
        self.lookback_hours = lookback_hours
    
    def predict(
        self,
        asset: str,
        price_history: List[PriceHistory],
        current_price: float
    ) -> Tuple[Direction, Magnitude, float]:
        """
        Predict based on recent momentum.
        """
        if not price_history or len(price_history) < 2:
            # Not enough data - default to neutral
            return Direction.UP, Magnitude.SMALL, 0.5
        
        # Get price from lookback period ago
        lookback_price = self._get_lookback_price(price_history, current_price)
        
        # Calculate percentage change
        pct_change = ((current_price - lookback_price) / lookback_price) * 100
        
        # Direction follows the trend
        direction = Direction.UP if pct_change > 0 else Direction.DOWN
        
        # Magnitude based on strength of recent move
        magnitude = Magnitude.from_percentage(pct_change)
        
        # Confidence based on magnitude of recent move (stronger moves = more confident)
        # But capped - we're never that confident
        abs_change = abs(pct_change)
        if abs_change > 5:
            confidence = 0.7
        elif abs_change > 2:
            confidence = 0.6
        else:
            confidence = 0.55
        
        return direction, magnitude, confidence
    
    def _get_lookback_price(self, price_history: List[PriceHistory], current_price: float) -> float:
        """Get the price from the lookback period ago."""
        # Price history should be sorted oldest first
        # Find the price closest to lookback_hours ago
        if not price_history:
            return current_price
        
        # Simple approach: use the oldest price in the provided history
        # Assumption: caller provides appropriate history window
        return price_history[0].price_usd
