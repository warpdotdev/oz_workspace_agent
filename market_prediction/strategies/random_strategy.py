"""
Random Baseline Strategy

The dumbest possible strategy - pure random guessing.
If we can't beat this, we should go home.

This serves as our baseline. Any real strategy must beat
50% directional accuracy consistently.
"""

import random
from typing import List, Tuple

from .base import Strategy
from ..data.models import PriceHistory, Direction, Magnitude


class RandomStrategy(Strategy):
    """
    Random prediction strategy.
    
    Flips a coin for direction, randomly picks magnitude,
    and uses 0.5 confidence (appropriately uncertain).
    
    Expected performance:
    - Direction accuracy: ~50%
    - Magnitude accuracy: ~33% (1 in 3 buckets)
    - Combined accuracy: ~17%
    """
    
    def __init__(self, seed: int = None):
        super().__init__(
            name="random",
            description="Random baseline - pure coin flip prediction"
        )
        if seed is not None:
            random.seed(seed)
    
    def predict(
        self,
        asset: str,
        price_history: List[PriceHistory],
        current_price: float
    ) -> Tuple[Direction, Magnitude, float]:
        """
        Make a completely random prediction.
        
        Ignores all input data - that's the point.
        """
        # Coin flip for direction
        direction = random.choice([Direction.UP, Direction.DOWN])
        
        # Random magnitude bucket
        magnitude = random.choice([Magnitude.SMALL, Magnitude.MEDIUM, Magnitude.LARGE])
        
        # Confidence is 0.5 - we're appropriately uncertain
        confidence = 0.5
        
        return direction, magnitude, confidence
