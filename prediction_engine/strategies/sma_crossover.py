#!/usr/bin/env python3
"""
Simple Moving Average (SMA) Crossover Strategy

A classic technical analysis strategy that generates signals based on
the crossover of short-term and long-term moving averages.

- Bullish signal: Short SMA crosses above Long SMA
- Bearish signal: Short SMA crosses below Long SMA
"""

from typing import List, Optional
from .base import PredictionStrategy, PredictionResult
from data.models import Direction, Magnitude
from data.coingecko_client import HistoricalPrice


class SMACrossoverStrategy(PredictionStrategy):
    """
    SMA Crossover prediction strategy.
    
    Uses the relationship between short-term and long-term SMAs
    to predict price direction.
    """
    
    def __init__(
        self, 
        short_period: int = 7,  # 7-day SMA
        long_period: int = 21   # 21-day SMA
    ):
        super().__init__(
            name="sma_crossover",
            description=f"SMA Crossover ({short_period}/{long_period})"
        )
        self.short_period = short_period
        self.long_period = long_period
    
    def predict(
        self, 
        symbol: str,
        current_price: float,
        historical_prices: List[HistoricalPrice],
        **kwargs
    ) -> Optional[PredictionResult]:
        """
        Generate a prediction based on SMA crossover signals.
        """
        prices = self.get_prices_as_list(historical_prices)
        
        # Need enough data for the long SMA
        if len(prices) < self.long_period:
            return None
        
        # Calculate SMAs
        short_sma = self.calculate_sma(prices, self.short_period)
        long_sma = self.calculate_sma(prices, self.long_period)
        
        if short_sma is None or long_sma is None:
            return None
        
        # Calculate previous SMAs to detect crossover
        prices_yesterday = prices[:-1] if len(prices) > 1 else prices
        prev_short_sma = self.calculate_sma(prices_yesterday, self.short_period)
        prev_long_sma = self.calculate_sma(prices_yesterday, self.long_period)
        
        # Determine direction based on SMA relationship
        if short_sma > long_sma:
            direction = Direction.UP
        else:
            direction = Direction.DOWN
        
        # Calculate the strength of the signal (distance between SMAs)
        sma_diff_pct = abs(short_sma - long_sma) / long_sma * 100
        
        # Detect if we just had a crossover (stronger signal)
        just_crossed = False
        if prev_short_sma and prev_long_sma:
            was_above = prev_short_sma > prev_long_sma
            is_above = short_sma > long_sma
            just_crossed = was_above != is_above
        
        # Determine magnitude based on SMA separation
        if sma_diff_pct > 5:
            magnitude = Magnitude.LARGE
        elif sma_diff_pct > 2:
            magnitude = Magnitude.MEDIUM
        else:
            magnitude = Magnitude.SMALL
        
        # Confidence based on:
        # - Strength of separation (more = more confident)
        # - Whether we just crossed (crossover = more confident)
        base_confidence = min(0.5 + (sma_diff_pct / 10), 0.8)
        if just_crossed:
            confidence = min(base_confidence + 0.15, 0.95)
        else:
            confidence = base_confidence
        
        reasoning = (
            f"Short SMA ({self.short_period}d): ${short_sma:,.2f}, "
            f"Long SMA ({self.long_period}d): ${long_sma:,.2f}. "
            f"Separation: {sma_diff_pct:.2f}%"
            + (" [CROSSOVER]" if just_crossed else "")
        )
        
        return PredictionResult(
            symbol=symbol,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning=reasoning
        )
