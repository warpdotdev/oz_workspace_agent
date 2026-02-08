#!/usr/bin/env python3
"""
Prediction Strategies - Base Classes and Implementations

All strategies follow the same interface:
- Input: historical prices
- Output: direction, magnitude, confidence
"""

import random
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Optional
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import Direction, Magnitude, PricePoint, Prediction


class BaseStrategy(ABC):
    """
    Abstract base class for prediction strategies.
    
    All strategies must implement the `predict` method.
    """
    
    name: str = "base"
    description: str = "Base strategy"
    
    @abstractmethod
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """
        Generate a prediction for the next 24 hours.
        
        Args:
            asset: The asset being predicted
            current_price: Current price of the asset
            price_history: Historical prices, ordered oldest to newest
            prediction_time: When this prediction is being made
            
        Returns:
            A Prediction object, or None if insufficient data
        """
        pass
    
    def _create_prediction(
        self,
        asset: str,
        current_price: float,
        prediction_time: datetime,
        direction: Direction,
        magnitude: Magnitude,
        confidence: float
    ) -> Prediction:
        """Helper to create a prediction with standard fields."""
        return Prediction(
            id=str(uuid.uuid4()),
            asset=asset,
            strategy=self.name,
            prediction_time=prediction_time,
            target_time=prediction_time + timedelta(hours=24),
            direction=direction,
            magnitude=magnitude,
            confidence=max(0.0, min(1.0, confidence)),  # Clamp to [0, 1]
            price_at_prediction=current_price
        )
    
    def _calculate_returns(self, prices: list[PricePoint], periods: int = 1) -> list[float]:
        """Calculate percentage returns from price history."""
        if len(prices) < periods + 1:
            return []
        
        returns = []
        for i in range(periods, len(prices)):
            old_price = prices[i - periods].price_usd
            new_price = prices[i].price_usd
            if old_price > 0:
                pct_return = ((new_price - old_price) / old_price) * 100
                returns.append(pct_return)
        
        return returns


class RandomStrategy(BaseStrategy):
    """
    Random baseline strategy - pure coin flip.
    
    If we can't beat this, our other strategies are worthless.
    Expected accuracy: 50% directional, ~33% magnitude.
    """
    
    name = "random"
    description = "Random baseline - coin flip for direction, random magnitude"
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """Generate a random prediction."""
        direction = random.choice([Direction.UP, Direction.DOWN])
        magnitude = random.choice([Magnitude.SMALL, Magnitude.MEDIUM, Magnitude.LARGE])
        confidence = 0.5  # Always 50% confident (coin flip)
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )


class MomentumStrategy(BaseStrategy):
    """
    Momentum strategy - trend following.
    
    If the price went up recently, predict it will continue up.
    This is the simplest trend-following approach.
    """
    
    name = "momentum"
    description = "Momentum - if recent trend is up, predict up (trend following)"
    
    def __init__(self, lookback_hours: int = 24):
        self.lookback_hours = lookback_hours
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """Predict based on recent price momentum."""
        if len(price_history) < 2:
            return None
        
        # Find the price from lookback_hours ago
        cutoff_time = prediction_time - timedelta(hours=self.lookback_hours)
        
        # Get prices before cutoff
        old_prices = [p for p in price_history if p.timestamp <= cutoff_time]
        if not old_prices:
            # Use oldest available price
            old_price = price_history[0].price_usd
        else:
            old_price = old_prices[-1].price_usd
        
        if old_price <= 0:
            return None
        
        # Calculate recent return
        pct_change = ((current_price - old_price) / old_price) * 100
        
        # Momentum: predict continuation of trend
        direction = Direction.UP if pct_change >= 0 else Direction.DOWN
        magnitude = Magnitude.from_percentage(pct_change)
        
        # Confidence based on strength of momentum
        confidence = min(0.8, 0.5 + abs(pct_change) / 20)
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )


class MeanReversionStrategy(BaseStrategy):
    """
    Mean reversion strategy - contrarian approach.
    
    If the price went up significantly, predict it will come back down.
    Based on the idea that extreme moves tend to reverse.
    """
    
    name = "mean_reversion"
    description = "Mean reversion - predict reversal after significant moves"
    
    def __init__(self, lookback_hours: int = 24, threshold_pct: float = 2.0):
        self.lookback_hours = lookback_hours
        self.threshold_pct = threshold_pct  # Minimum move to trigger reversal prediction
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """Predict based on mean reversion after significant moves."""
        if len(price_history) < 2:
            return None
        
        # Find the price from lookback_hours ago
        cutoff_time = prediction_time - timedelta(hours=self.lookback_hours)
        
        old_prices = [p for p in price_history if p.timestamp <= cutoff_time]
        if not old_prices:
            old_price = price_history[0].price_usd
        else:
            old_price = old_prices[-1].price_usd
        
        if old_price <= 0:
            return None
        
        # Calculate recent return
        pct_change = ((current_price - old_price) / old_price) * 100
        
        # Mean reversion: predict opposite direction if move was significant
        if abs(pct_change) >= self.threshold_pct:
            # Predict reversal
            direction = Direction.DOWN if pct_change > 0 else Direction.UP
            # Predict smaller magnitude for the reversal
            expected_reversal = abs(pct_change) * 0.5  # Expect 50% retracement
            magnitude = Magnitude.from_percentage(expected_reversal)
            confidence = min(0.75, 0.5 + abs(pct_change) / 30)
        else:
            # No significant move - predict continuation with low confidence
            direction = Direction.UP if pct_change >= 0 else Direction.DOWN
            magnitude = Magnitude.SMALL
            confidence = 0.4
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )


class SMAStrategy(BaseStrategy):
    """
    Simple Moving Average Crossover strategy.
    
    Uses 7-day and 21-day moving averages.
    - Price above both MAs = bullish (predict UP)
    - Price below both MAs = bearish (predict DOWN)
    - Mixed = predict based on short MA vs long MA
    """
    
    name = "sma_crossover"
    description = "SMA Crossover - 7-day vs 21-day moving average signals"
    
    def __init__(self, short_period: int = 7, long_period: int = 21):
        self.short_period = short_period  # days
        self.long_period = long_period    # days
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """Predict based on SMA crossover signals."""
        # Need enough data for long period (21 days * 24 hours = 504 hourly points ideally)
        # But we'll work with what we have
        
        if len(price_history) < 48:  # Need at least 2 days of hourly data
            return None
        
        # Get daily prices (sample at 24h intervals)
        daily_prices = self._resample_daily(price_history)
        
        if len(daily_prices) < self.short_period:
            return None
        
        # Calculate SMAs
        short_sma = self._calculate_sma(daily_prices, self.short_period)
        long_sma = self._calculate_sma(daily_prices, min(self.long_period, len(daily_prices)))
        
        if short_sma is None or long_sma is None:
            return None
        
        # Determine signal
        if current_price > short_sma and current_price > long_sma:
            # Bullish - price above both MAs
            direction = Direction.UP
            confidence = 0.65
        elif current_price < short_sma and current_price < long_sma:
            # Bearish - price below both MAs
            direction = Direction.DOWN
            confidence = 0.65
        elif short_sma > long_sma:
            # Golden cross - short MA above long MA
            direction = Direction.UP
            confidence = 0.55
        else:
            # Death cross - short MA below long MA
            direction = Direction.DOWN
            confidence = 0.55
        
        # Magnitude based on distance from SMA
        pct_from_sma = ((current_price - short_sma) / short_sma) * 100
        magnitude = Magnitude.from_percentage(abs(pct_from_sma))
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )
    
    def _resample_daily(self, prices: list[PricePoint]) -> list[float]:
        """Resample hourly prices to daily (last price of each day)."""
        if not prices:
            return []
        
        # Group by date
        daily = {}
        for p in prices:
            date_key = p.timestamp.date()
            daily[date_key] = p.price_usd  # Last price for each day
        
        # Return in chronological order
        return [daily[k] for k in sorted(daily.keys())]
    
    def _calculate_sma(self, prices: list[float], period: int) -> Optional[float]:
        """Calculate simple moving average."""
        if len(prices) < period:
            return None
        
        return sum(prices[-period:]) / period


# Import volatility strategies
from strategies.volatility import (
    VolatilityRegimeStrategy,
    ATRStrategy,
    VolatilityBreakoutStrategy
)

# Strategy registry
STRATEGIES = {
    "random": RandomStrategy(),
    "momentum": MomentumStrategy(),
    "mean_reversion": MeanReversionStrategy(),
    "sma_crossover": SMAStrategy(),
    "volatility_regime": VolatilityRegimeStrategy(),
    "atr": ATRStrategy(),
    "vol_breakout": VolatilityBreakoutStrategy(),
}


def get_strategy(name: str) -> Optional[BaseStrategy]:
    """Get a strategy by name."""
    return STRATEGIES.get(name)


def get_all_strategies() -> list[BaseStrategy]:
    """Get all available strategies."""
    return list(STRATEGIES.values())
