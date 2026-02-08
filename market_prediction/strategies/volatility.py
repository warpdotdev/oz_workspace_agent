#!/usr/bin/env python3
"""
Volatility-Focused Strategies

Based on Naz's observation: the technical strategies show 60-66% magnitude
accuracy while only 45-48% direction accuracy. The signal is in volatility,
not direction.

These strategies capitalize on that by:
1. Predicting volatility regimes (high/low vol)
2. Using regime to inform direction predictions
"""

import math
from datetime import datetime, timedelta
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import Direction, Magnitude, PricePoint, Prediction
from strategies.base import BaseStrategy


class VolatilityRegimeStrategy(BaseStrategy):
    """
    Uses realized volatility to predict magnitude, then uses
    regime-appropriate logic for direction.
    
    Key insight: volatility clusters. High vol follows high vol,
    low vol follows low vol. This is well-documented (GARCH effect).
    
    Direction logic:
    - High vol regime: use mean reversion (extreme moves reverse)
    - Low vol regime: use momentum (trends persist in calm markets)
    """
    
    name = "volatility_regime"
    description = "Regime-switching: momentum in low vol, mean reversion in high vol"
    
    def __init__(self, vol_window_hours: int = 72, vol_threshold: float = 2.5):
        """
        Args:
            vol_window_hours: Hours to calculate realized volatility
            vol_threshold: Daily vol % above which = high vol regime
        """
        self.vol_window_hours = vol_window_hours
        self.vol_threshold = vol_threshold
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """Generate regime-aware prediction."""
        if len(price_history) < self.vol_window_hours:
            return None
        
        # Calculate recent volatility
        recent_prices = price_history[-self.vol_window_hours:]
        vol = self._calculate_volatility(recent_prices)
        
        if vol is None:
            return None
        
        # Determine regime
        high_vol = vol > self.vol_threshold
        
        # Get recent return for direction
        lookback_hours = 24
        cutoff_time = prediction_time - timedelta(hours=lookback_hours)
        old_prices = [p for p in price_history if p.timestamp <= cutoff_time]
        if not old_prices:
            old_price = price_history[0].price_usd
        else:
            old_price = old_prices[-1].price_usd
        
        if old_price <= 0:
            return None
        
        pct_change = ((current_price - old_price) / old_price) * 100
        
        if high_vol:
            # High volatility: use mean reversion
            # Large moves tend to reverse
            if abs(pct_change) > 2.0:
                direction = Direction.DOWN if pct_change > 0 else Direction.UP
                confidence = min(0.7, 0.5 + abs(pct_change) / 20)
            else:
                direction = Direction.UP if pct_change >= 0 else Direction.DOWN
                confidence = 0.45
        else:
            # Low volatility: use momentum
            # Trends persist in calm markets
            direction = Direction.UP if pct_change >= 0 else Direction.DOWN
            confidence = min(0.65, 0.5 + abs(pct_change) / 15)
        
        # Magnitude prediction based on volatility regime
        if vol > 4.0:
            magnitude = Magnitude.LARGE
        elif vol > 2.0:
            magnitude = Magnitude.MEDIUM
        else:
            magnitude = Magnitude.SMALL
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )
    
    def _calculate_volatility(self, prices: list[PricePoint]) -> Optional[float]:
        """
        Calculate annualized volatility from hourly prices.
        Returns daily volatility as percentage.
        """
        if len(prices) < 2:
            return None
        
        # Calculate hourly returns
        returns = []
        for i in range(1, len(prices)):
            if prices[i-1].price_usd > 0:
                ret = (prices[i].price_usd - prices[i-1].price_usd) / prices[i-1].price_usd
                returns.append(ret)
        
        if len(returns) < 10:
            return None
        
        # Calculate standard deviation of returns
        mean_ret = sum(returns) / len(returns)
        variance = sum((r - mean_ret) ** 2 for r in returns) / len(returns)
        hourly_vol = math.sqrt(variance)
        
        # Convert to daily volatility (24 hours)
        daily_vol = hourly_vol * math.sqrt(24) * 100  # As percentage
        
        return daily_vol


class ATRStrategy(BaseStrategy):
    """
    Average True Range (ATR) based strategy.
    
    ATR measures volatility by looking at the range of price movement.
    When ATR is expanding, expect larger moves.
    When ATR is contracting, expect smaller moves.
    
    Direction: based on price relative to recent range midpoint.
    """
    
    name = "atr"
    description = "ATR-based: direction from range position, magnitude from ATR"
    
    def __init__(self, atr_period_hours: int = 48):
        self.atr_period_hours = atr_period_hours
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """Generate ATR-based prediction."""
        if len(price_history) < self.atr_period_hours:
            return None
        
        recent_prices = price_history[-self.atr_period_hours:]
        
        # Calculate ATR (simplified: average of high-low ranges per 24h periods)
        atr = self._calculate_atr(recent_prices)
        
        if atr is None:
            return None
        
        # Calculate range position
        prices = [p.price_usd for p in recent_prices]
        high = max(prices)
        low = min(prices)
        range_mid = (high + low) / 2
        
        # Direction based on position in range
        if current_price > range_mid:
            # Upper half of range - test of resistance
            # If near high, expect pullback (mean reversion)
            pct_from_mid = (current_price - range_mid) / range_mid * 100
            if pct_from_mid > 2:
                direction = Direction.DOWN
                confidence = min(0.6, 0.45 + pct_from_mid / 20)
            else:
                direction = Direction.UP
                confidence = 0.5
        else:
            # Lower half of range - test of support
            pct_from_mid = (range_mid - current_price) / range_mid * 100
            if pct_from_mid > 2:
                direction = Direction.UP
                confidence = min(0.6, 0.45 + pct_from_mid / 20)
            else:
                direction = Direction.DOWN
                confidence = 0.5
        
        # Magnitude from ATR
        atr_pct = (atr / current_price) * 100
        if atr_pct > 5:
            magnitude = Magnitude.LARGE
        elif atr_pct > 2:
            magnitude = Magnitude.MEDIUM
        else:
            magnitude = Magnitude.SMALL
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )
    
    def _calculate_atr(self, prices: list[PricePoint]) -> Optional[float]:
        """Calculate Average True Range."""
        if len(prices) < 24:
            return None
        
        # Group into 24h periods
        true_ranges = []
        period_start = 0
        
        while period_start + 24 <= len(prices):
            period_prices = prices[period_start:period_start + 24]
            period_values = [p.price_usd for p in period_prices]
            
            high = max(period_values)
            low = min(period_values)
            true_range = high - low
            true_ranges.append(true_range)
            
            period_start += 24
        
        if not true_ranges:
            return None
        
        return sum(true_ranges) / len(true_ranges)


class VolatilityBreakoutStrategy(BaseStrategy):
    """
    Volatility breakout strategy.
    
    When price breaks out of a low-volatility consolidation,
    the move tends to continue in that direction.
    
    Uses Bollinger Band width as volatility measure.
    """
    
    name = "vol_breakout"
    description = "Breakout from low-vol consolidation tends to continue"
    
    def __init__(self, lookback_hours: int = 72, bb_period: int = 20):
        self.lookback_hours = lookback_hours
        self.bb_period = bb_period
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """Generate breakout prediction."""
        if len(price_history) < self.lookback_hours:
            return None
        
        recent = price_history[-self.lookback_hours:]
        
        # Calculate Bollinger Band width (normalized)
        prices = [p.price_usd for p in recent[-self.bb_period:]]
        if len(prices) < self.bb_period:
            return None
        
        sma = sum(prices) / len(prices)
        variance = sum((p - sma) ** 2 for p in prices) / len(prices)
        std = math.sqrt(variance)
        
        upper_band = sma + 2 * std
        lower_band = sma - 2 * std
        band_width_pct = ((upper_band - lower_band) / sma) * 100
        
        # Determine if we're in breakout condition
        if current_price > upper_band:
            # Bullish breakout
            direction = Direction.UP
            confidence = min(0.7, 0.5 + band_width_pct / 20)
            # After breakout, expect continuation
            magnitude = Magnitude.MEDIUM if band_width_pct < 3 else Magnitude.LARGE
        elif current_price < lower_band:
            # Bearish breakout  
            direction = Direction.DOWN
            confidence = min(0.7, 0.5 + band_width_pct / 20)
            magnitude = Magnitude.MEDIUM if band_width_pct < 3 else Magnitude.LARGE
        else:
            # Inside bands - low conviction
            # Lean toward mean reversion
            if current_price > sma:
                direction = Direction.DOWN
            else:
                direction = Direction.UP
            confidence = 0.45
            magnitude = Magnitude.SMALL
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )
