#!/usr/bin/env python3
"""
Random Baseline Strategy

A control strategy that makes random predictions.
This serves as a baseline - any good strategy should beat random chance!

This keeps us honest by providing a benchmark to compare against.
"""

import random
from typing import List, Optional
from .base import PredictionStrategy, PredictionResult
from data.models import Direction, Magnitude
from data.coingecko_client import HistoricalPrice


class RandomBaselineStrategy(PredictionStrategy):
    """
    Random prediction strategy - our control group.
    
    Makes completely random predictions with random confidence.
    Over time, this should average ~50% direction accuracy and 
    ~33% magnitude accuracy (3 buckets).
    """
    
    def __init__(self, seed: int = None):
        super().__init__(
            name="random_baseline",
            description="Random predictions (control group)"
        )
        if seed is not None:
            random.seed(seed)
    
    def predict(
        self, 
        symbol: str,
        current_price: float,
        historical_prices: List[HistoricalPrice],
        **kwargs
    ) -> Optional[PredictionResult]:
        """
        Generate a completely random prediction.
        """
        # Random direction
        direction = random.choice([Direction.UP, Direction.DOWN])
        
        # Random magnitude
        magnitude = random.choice([Magnitude.SMALL, Magnitude.MEDIUM, Magnitude.LARGE])
        
        # Random confidence between 0.3 and 0.7
        # (we don't claim to be very confident or very uncertain)
        confidence = random.uniform(0.3, 0.7)
        
        reasoning = "Random prediction (baseline for comparison)"
        
        return PredictionResult(
            symbol=symbol,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning=reasoning
        )
