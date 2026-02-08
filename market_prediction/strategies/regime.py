#!/usr/bin/env python3
"""
Market Regime Detection

Identifies whether the market is in a trending or ranging regime.
- Trending: Momentum strategies work better
- Ranging: Mean reversion strategies work better

This allows the ensemble strategy to weight strategies appropriately.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PricePoint


class MarketRegime(Enum):
    """Market regime types."""
    TRENDING_UP = "TRENDING_UP"
    TRENDING_DOWN = "TRENDING_DOWN"
    RANGING = "RANGING"
    HIGH_VOLATILITY = "HIGH_VOLATILITY"
    UNKNOWN = "UNKNOWN"


@dataclass
class RegimeAnalysis:
    """Results of regime detection."""
    regime: MarketRegime
    confidence: float  # 0.0 - 1.0
    volatility: float  # Annualized volatility estimate
    trend_strength: float  # -1.0 (strong down) to 1.0 (strong up)
    adx: float  # Average Directional Index (trend strength indicator)


class RegimeDetector:
    """
    Detects market regime using multiple indicators:
    
    1. Volatility: Standard deviation of returns
    2. Trend Strength: Directional persistence (how often consecutive moves in same direction)
    3. ADX-like metric: Simplified Average Directional Index
    
    Thresholds:
    - High volatility: annualized vol > 80%
    - Trending: ADX > 25 and directional persistence > 60%
    - Ranging: ADX < 20 or directional persistence < 50%
    """
    
    def __init__(
        self,
        lookback_hours: int = 168,  # 7 days
        volatility_threshold: float = 80.0,  # annualized %
        adx_trend_threshold: float = 25.0,
        adx_range_threshold: float = 20.0,
        persistence_threshold: float = 0.6
    ):
        self.lookback_hours = lookback_hours
        self.volatility_threshold = volatility_threshold
        self.adx_trend_threshold = adx_trend_threshold
        self.adx_range_threshold = adx_range_threshold
        self.persistence_threshold = persistence_threshold
    
    def detect(
        self,
        price_history: list[PricePoint],
        current_time: datetime
    ) -> RegimeAnalysis:
        """
        Analyze price history and determine current market regime.
        
        Args:
            price_history: Historical prices, oldest to newest
            current_time: Current timestamp for filtering
            
        Returns:
            RegimeAnalysis with regime classification and metrics
        """
        # Filter to lookback window
        cutoff = current_time - timedelta(hours=self.lookback_hours)
        relevant_prices = [p for p in price_history if p.timestamp >= cutoff]
        
        if len(relevant_prices) < 24:  # Need at least 1 day of data
            return RegimeAnalysis(
                regime=MarketRegime.UNKNOWN,
                confidence=0.0,
                volatility=0.0,
                trend_strength=0.0,
                adx=0.0
            )
        
        # Calculate metrics
        volatility = self._calculate_volatility(relevant_prices)
        trend_strength = self._calculate_trend_strength(relevant_prices)
        adx = self._calculate_adx(relevant_prices)
        persistence = self._calculate_directional_persistence(relevant_prices)
        
        # Classify regime
        regime, confidence = self._classify_regime(
            volatility, trend_strength, adx, persistence
        )
        
        return RegimeAnalysis(
            regime=regime,
            confidence=confidence,
            volatility=volatility,
            trend_strength=trend_strength,
            adx=adx
        )
    
    def _calculate_volatility(self, prices: list[PricePoint]) -> float:
        """Calculate annualized volatility from hourly returns."""
        if len(prices) < 2:
            return 0.0
        
        # Calculate hourly returns
        returns = []
        for i in range(1, len(prices)):
            if prices[i-1].price_usd > 0:
                ret = (prices[i].price_usd - prices[i-1].price_usd) / prices[i-1].price_usd
                returns.append(ret)
        
        if not returns:
            return 0.0
        
        # Standard deviation of returns
        mean_ret = sum(returns) / len(returns)
        variance = sum((r - mean_ret) ** 2 for r in returns) / len(returns)
        hourly_std = variance ** 0.5
        
        # Annualize (sqrt(8760) for hourly data)
        annualized = hourly_std * (8760 ** 0.5) * 100
        return annualized
    
    def _calculate_trend_strength(self, prices: list[PricePoint]) -> float:
        """
        Calculate trend strength from -1.0 (strong downtrend) to 1.0 (strong uptrend).
        
        Uses overall percentage change normalized by volatility.
        """
        if len(prices) < 2:
            return 0.0
        
        first_price = prices[0].price_usd
        last_price = prices[-1].price_usd
        
        if first_price <= 0:
            return 0.0
        
        pct_change = (last_price - first_price) / first_price
        
        # Normalize by expected range (roughly 2 std devs over period)
        volatility = self._calculate_volatility(prices)
        if volatility <= 0:
            return max(-1.0, min(1.0, pct_change * 10))
        
        # Expected move over lookback period
        hours = len(prices)
        expected_move = (volatility / 100) * ((hours / 8760) ** 0.5)
        
        if expected_move <= 0:
            return 0.0
        
        # Trend strength = actual move / expected move, clamped to [-1, 1]
        strength = pct_change / (2 * expected_move)
        return max(-1.0, min(1.0, strength))
    
    def _calculate_adx(self, prices: list[PricePoint]) -> float:
        """
        Calculate simplified ADX-like metric.
        
        ADX measures trend strength regardless of direction.
        Higher ADX = stronger trend (either up or down).
        Lower ADX = ranging/choppy market.
        
        This is a simplified version using directional movement.
        """
        if len(prices) < 14:
            return 0.0
        
        # Calculate plus/minus directional movement
        plus_dm = []
        minus_dm = []
        true_range = []
        
        for i in range(1, len(prices)):
            high = prices[i].price_usd
            low = prices[i-1].price_usd
            prev_close = prices[i-1].price_usd
            
            # Simplified: use price change as proxy for high-low
            change = prices[i].price_usd - prices[i-1].price_usd
            
            if change > 0:
                plus_dm.append(change)
                minus_dm.append(0)
            else:
                plus_dm.append(0)
                minus_dm.append(abs(change))
            
            # True range (simplified)
            tr = abs(change)
            true_range.append(max(tr, 0.01))  # Avoid division by zero
        
        # Smooth over 14 periods
        period = min(14, len(plus_dm))
        if period < 7:
            return 0.0
        
        smoothed_plus_dm = sum(plus_dm[-period:]) / period
        smoothed_minus_dm = sum(minus_dm[-period:]) / period
        smoothed_tr = sum(true_range[-period:]) / period
        
        if smoothed_tr <= 0:
            return 0.0
        
        # Plus/Minus directional indicators
        plus_di = (smoothed_plus_dm / smoothed_tr) * 100
        minus_di = (smoothed_minus_dm / smoothed_tr) * 100
        
        # ADX
        di_sum = plus_di + minus_di
        if di_sum <= 0:
            return 0.0
        
        dx = abs(plus_di - minus_di) / di_sum * 100
        return dx
    
    def _calculate_directional_persistence(self, prices: list[PricePoint]) -> float:
        """
        Calculate how often consecutive price moves are in the same direction.
        
        High persistence (>60%) = trending market
        Low persistence (<50%) = choppy/ranging market
        """
        if len(prices) < 3:
            return 0.5
        
        same_direction_count = 0
        total_comparisons = 0
        
        prev_direction = None
        for i in range(1, len(prices)):
            change = prices[i].price_usd - prices[i-1].price_usd
            current_direction = 1 if change >= 0 else -1
            
            if prev_direction is not None:
                total_comparisons += 1
                if current_direction == prev_direction:
                    same_direction_count += 1
            
            prev_direction = current_direction
        
        if total_comparisons == 0:
            return 0.5
        
        return same_direction_count / total_comparisons
    
    def _classify_regime(
        self,
        volatility: float,
        trend_strength: float,
        adx: float,
        persistence: float
    ) -> tuple[MarketRegime, float]:
        """
        Classify market regime based on calculated metrics.
        
        Returns:
            Tuple of (regime, confidence)
        """
        # High volatility regime takes precedence
        if volatility > self.volatility_threshold:
            return MarketRegime.HIGH_VOLATILITY, min(0.9, volatility / 100)
        
        # Check for trending
        is_trending = (
            adx > self.adx_trend_threshold or
            persistence > self.persistence_threshold
        )
        
        if is_trending:
            confidence = min(0.85, (adx / 50 + persistence) / 2)
            if trend_strength > 0.2:
                return MarketRegime.TRENDING_UP, confidence
            elif trend_strength < -0.2:
                return MarketRegime.TRENDING_DOWN, confidence
        
        # Check for ranging
        is_ranging = (
            adx < self.adx_range_threshold or
            persistence < 0.5
        )
        
        if is_ranging:
            confidence = min(0.8, 1 - (adx / 50))
            return MarketRegime.RANGING, confidence
        
        # Default to unknown with low confidence
        return MarketRegime.UNKNOWN, 0.3


def get_regime_weight_adjustments(regime: MarketRegime) -> dict[str, float]:
    """
    Get weight adjustments for each strategy based on current regime.
    
    Returns multipliers for each strategy:
    - Values > 1.0 = increase weight
    - Values < 1.0 = decrease weight
    - Values = 1.0 = no change
    """
    adjustments = {
        "random": 1.0,  # Never adjust random
        "momentum": 1.0,
        "mean_reversion": 1.0,
        "sma_crossover": 1.0,
    }
    
    if regime == MarketRegime.TRENDING_UP or regime == MarketRegime.TRENDING_DOWN:
        # Favor trend-following strategies
        adjustments["momentum"] = 1.5
        adjustments["sma_crossover"] = 1.3
        adjustments["mean_reversion"] = 0.6
        
    elif regime == MarketRegime.RANGING:
        # Favor mean reversion
        adjustments["mean_reversion"] = 1.5
        adjustments["momentum"] = 0.6
        adjustments["sma_crossover"] = 0.8
        
    elif regime == MarketRegime.HIGH_VOLATILITY:
        # High volatility - reduce confidence in all strategies
        adjustments["momentum"] = 0.7
        adjustments["mean_reversion"] = 0.7
        adjustments["sma_crossover"] = 0.7
    
    return adjustments
