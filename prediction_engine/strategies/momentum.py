#!/usr/bin/env python3
"""
Momentum Strategy

A strategy that predicts based on recent price momentum.
The idea: assets that are moving strongly in one direction
tend to continue in that direction (trend following).

This is a contrarian-aware momentum strategy that also considers
when a trend might be exhausted.
"""

from typing import List, Optional
from .base import PredictionStrategy, PredictionResult
from data.models import Direction, Magnitude
from data.coingecko_client import HistoricalPrice


class MomentumStrategy(PredictionStrategy):
    """
    Momentum-based prediction strategy.
    
    Uses recent price momentum to predict future direction.
    Considers both short-term and medium-term momentum.
    """
    
    def __init__(
        self, 
        short_period: int = 3,   # 3-day momentum
        medium_period: int = 10  # 10-day momentum
    ):
        super().__init__(
            name="momentum",
            description=f"Momentum ({short_period}d/{medium_period}d)"
        )
        self.short_period = short_period
        self.medium_period = medium_period
    
    def predict(
        self, 
        symbol: str,
        current_price: float,
        historical_prices: List[HistoricalPrice],
        **kwargs
    ) -> Optional[PredictionResult]:
        """
        Generate a prediction based on momentum signals.
        """
        prices = self.get_prices_as_list(historical_prices)
        
        # Need enough data
        if len(prices) < self.medium_period:
            return None
        
        # Calculate momentum at different timeframes
        short_momentum = self.calculate_momentum(prices, self.short_period)
        medium_momentum = self.calculate_momentum(prices, self.medium_period)
        
        if short_momentum is None or medium_momentum is None:
            return None
        
        # Analyze momentum alignment
        short_up = short_momentum > 0
        medium_up = medium_momentum > 0
        aligned = short_up == medium_up
        
        # Base direction on short-term momentum (more responsive)
        if short_up:
            direction = Direction.UP
        else:
            direction = Direction.DOWN
        
        # Calculate momentum strength
        abs_short = abs(short_momentum)
        abs_medium = abs(medium_momentum)
        avg_momentum = (abs_short + abs_medium) / 2
        
        # Determine magnitude based on momentum strength
        if avg_momentum > 10:
            magnitude = Magnitude.LARGE
        elif avg_momentum > 4:
            magnitude = Magnitude.MEDIUM
        else:
            magnitude = Magnitude.SMALL
        
        # Calculate confidence
        # - Higher when momentum is aligned (both timeframes agree)
        # - Higher when momentum is strong
        # - Lower when momentum is weak or conflicting
        
        if aligned:
            # Aligned momentum - confident trend
            base_confidence = 0.55 + min(avg_momentum / 30, 0.3)
        else:
            # Conflicting signals - less confident
            base_confidence = 0.4 + min(abs_short / 30, 0.2)
        
        # Check for potential exhaustion (extreme momentum might reverse)
        if abs_short > 15:
            # Very strong short-term move might be exhausting
            base_confidence *= 0.85
        
        confidence = min(max(base_confidence, 0.35), 0.9)
        
        alignment_status = "ALIGNED" if aligned else "CONFLICTING"
        reasoning = (
            f"Short momentum ({self.short_period}d): {short_momentum:+.2f}%, "
            f"Medium momentum ({self.medium_period}d): {medium_momentum:+.2f}% "
            f"[{alignment_status}]"
        )
        
        return PredictionResult(
            symbol=symbol,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning=reasoning
        )
