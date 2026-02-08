"""
SMA Crossover Strategy

Classic technical analysis: compare short-term and long-term
Simple Moving Averages. When short SMA crosses above long SMA,
that's a bullish signal. When it crosses below, that's bearish.

This is one of the most widely used technical indicators.
"""

from typing import List, Tuple

from .base import Strategy
from ..data.models import PriceHistory, Direction, Magnitude


class SMACrossoverStrategy(Strategy):
    """
    Simple Moving Average Crossover strategy.
    
    Logic:
    - Calculate short-term SMA (e.g., 7-day)
    - Calculate long-term SMA (e.g., 21-day)
    - If short SMA > long SMA: bullish (predict UP)
    - If short SMA < long SMA: bearish (predict DOWN)
    - Magnitude based on the gap between SMAs
    - Confidence based on how clear the crossover signal is
    """
    
    def __init__(self, short_period: int = 7, long_period: int = 21):
        super().__init__(
            name="sma_crossover",
            description=f"SMA Crossover ({short_period}-day vs {long_period}-day)"
        )
        self.short_period = short_period
        self.long_period = long_period
    
    def predict(
        self,
        asset: str,
        price_history: List[PriceHistory],
        current_price: float
    ) -> Tuple[Direction, Magnitude, float]:
        """
        Predict based on SMA crossover signal.
        """
        if not price_history or len(price_history) < self.long_period:
            # Not enough data for long SMA - default to neutral
            return Direction.UP, Magnitude.SMALL, 0.5
        
        # Calculate SMAs
        short_sma = self._calculate_sma(price_history, self.short_period)
        long_sma = self._calculate_sma(price_history, self.long_period)
        
        if short_sma is None or long_sma is None:
            return Direction.UP, Magnitude.SMALL, 0.5
        
        # Calculate the gap between SMAs as percentage of price
        sma_gap_pct = ((short_sma - long_sma) / long_sma) * 100
        
        # Direction based on SMA relationship
        direction = Direction.UP if short_sma > long_sma else Direction.DOWN
        
        # Magnitude based on gap size
        abs_gap = abs(sma_gap_pct)
        if abs_gap > 5:
            magnitude = Magnitude.LARGE
        elif abs_gap > 2:
            magnitude = Magnitude.MEDIUM
        else:
            magnitude = Magnitude.SMALL
        
        # Confidence based on how clear the signal is
        # Also consider if current price confirms the SMA signal
        price_above_short = current_price > short_sma
        signal_confirmed = (direction == Direction.UP and price_above_short) or \
                          (direction == Direction.DOWN and not price_above_short)
        
        if abs_gap > 5 and signal_confirmed:
            confidence = 0.7
        elif abs_gap > 2 and signal_confirmed:
            confidence = 0.62
        elif signal_confirmed:
            confidence = 0.55
        else:
            confidence = 0.52  # Conflicting signals = low confidence
        
        return direction, magnitude, confidence
    
    def _calculate_sma(self, price_history: List[PriceHistory], period: int) -> float:
        """Calculate Simple Moving Average for the most recent N periods."""
        if len(price_history) < period:
            return None
        
        # Get the most recent 'period' prices
        recent_prices = [p.price_usd for p in price_history[-period:]]
        return sum(recent_prices) / len(recent_prices)
