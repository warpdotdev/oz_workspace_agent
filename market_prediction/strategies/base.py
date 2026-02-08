#!/usr/bin/env python3
"""
Market Prediction Strategies - Base Classes

Each strategy must:
1. Take historical price data as input
2. Output a prediction with direction, magnitude bucket, and confidence
3. Track its own performance over time
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
import random
import statistics

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from storage.models import (
    PriceRecord, Prediction, Direction, MagnitudeBucket, Database
)


@dataclass
class PredictionOutput:
    """Output from a strategy's predict method"""
    direction: Direction
    magnitude: MagnitudeBucket
    confidence: float  # 0.0 - 1.0
    reasoning: str     # Human-readable explanation
    predicted_price: Optional[float] = None


class BaseStrategy(ABC):
    """
    Abstract base class for all prediction strategies.
    
    Strategies compete against each other. Each strategy gets its own
    track record, and over time we can weight them by accuracy.
    """
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    def predict(self, 
                symbol: str, 
                current_price: float,
                price_history: List[PriceRecord],
                target_date: date) -> PredictionOutput:
        """
        Generate a prediction for the target date.
        
        Args:
            symbol: The asset symbol (e.g., "bitcoin")
            current_price: Current price of the asset
            price_history: Historical price data (oldest to newest)
            target_date: The date we're predicting for
        
        Returns:
            PredictionOutput with direction, magnitude, and confidence
        """
        pass
    
    def to_prediction_record(self, 
                             symbol: str,
                             current_price: float,
                             output: PredictionOutput,
                             target_date: date) -> Prediction:
        """Convert strategy output to a Prediction record for storage"""
        return Prediction(
            id=None,
            strategy_name=self.name,
            symbol=symbol,
            prediction_date=date.today(),
            target_date=target_date,
            direction=output.direction,
            magnitude=output.magnitude,
            confidence=output.confidence,
            price_at_prediction=current_price,
            predicted_price=output.predicted_price
        )
    
    @staticmethod
    def calculate_magnitude_bucket(pct_change: float) -> MagnitudeBucket:
        """Determine magnitude bucket from percentage change"""
        abs_change = abs(pct_change)
        if abs_change < 2.0:
            return MagnitudeBucket.SMALL
        elif abs_change < 5.0:
            return MagnitudeBucket.MEDIUM
        else:
            return MagnitudeBucket.LARGE
    
    @staticmethod
    def get_price_returns(prices: List[PriceRecord]) -> List[float]:
        """Calculate daily returns from price history"""
        if len(prices) < 2:
            return []
        
        returns = []
        for i in range(1, len(prices)):
            prev_price = prices[i-1].price_usd
            curr_price = prices[i].price_usd
            if prev_price > 0:
                pct_return = ((curr_price - prev_price) / prev_price) * 100
                returns.append(pct_return)
        
        return returns


class RandomStrategy(BaseStrategy):
    """
    Random baseline strategy - the bar everyone else must beat.
    
    Makes random predictions to establish a baseline. If other strategies
    can't consistently beat random, they're not adding value.
    """
    
    def __init__(self):
        super().__init__(
            name="random_baseline",
            description="Random predictions as a baseline comparison"
        )
    
    def predict(self, 
                symbol: str, 
                current_price: float,
                price_history: List[PriceRecord],
                target_date: date) -> PredictionOutput:
        
        # Random direction (50/50)
        direction = random.choice([Direction.UP, Direction.DOWN])
        
        # Random magnitude (weighted towards smaller moves - more realistic)
        magnitude = random.choices(
            [MagnitudeBucket.SMALL, MagnitudeBucket.MEDIUM, MagnitudeBucket.LARGE],
            weights=[0.6, 0.3, 0.1]
        )[0]
        
        # Low confidence - it's random after all
        confidence = random.uniform(0.3, 0.5)
        
        return PredictionOutput(
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning="Random prediction (baseline strategy)"
        )


class SMAStrategy(BaseStrategy):
    """
    Simple Moving Average Crossover Strategy.
    
    Classic technical analysis approach:
    - Fast SMA (7 day) crosses above Slow SMA (21 day) = Bullish
    - Fast SMA crosses below Slow SMA = Bearish
    - Distance between SMAs indicates strength
    """
    
    def __init__(self, fast_period: int = 7, slow_period: int = 21):
        super().__init__(
            name="sma_crossover",
            description=f"SMA crossover ({fast_period}/{slow_period} day)"
        )
        self.fast_period = fast_period
        self.slow_period = slow_period
    
    def predict(self, 
                symbol: str, 
                current_price: float,
                price_history: List[PriceRecord],
                target_date: date) -> PredictionOutput:
        
        if len(price_history) < self.slow_period:
            # Not enough data - fall back to neutral
            return PredictionOutput(
                direction=Direction.NEUTRAL,
                magnitude=MagnitudeBucket.SMALL,
                confidence=0.3,
                reasoning=f"Insufficient data ({len(price_history)} days, need {self.slow_period})"
            )
        
        prices = [p.price_usd for p in price_history]
        
        # Calculate SMAs
        fast_sma = statistics.mean(prices[-self.fast_period:])
        slow_sma = statistics.mean(prices[-self.slow_period:])
        
        # Previous SMAs (for crossover detection)
        if len(prices) > self.slow_period:
            prev_fast_sma = statistics.mean(prices[-(self.fast_period+1):-1])
            prev_slow_sma = statistics.mean(prices[-(self.slow_period+1):-1])
        else:
            prev_fast_sma = fast_sma
            prev_slow_sma = slow_sma
        
        # Determine direction from crossover
        currently_above = fast_sma > slow_sma
        was_above = prev_fast_sma > prev_slow_sma
        
        if currently_above and not was_above:
            # Bullish crossover
            direction = Direction.UP
            base_confidence = 0.7
        elif not currently_above and was_above:
            # Bearish crossover
            direction = Direction.DOWN
            base_confidence = 0.7
        elif currently_above:
            # Already in uptrend
            direction = Direction.UP
            base_confidence = 0.55
        else:
            # Already in downtrend
            direction = Direction.DOWN
            base_confidence = 0.55
        
        # Magnitude based on SMA divergence
        divergence_pct = abs((fast_sma - slow_sma) / slow_sma) * 100
        
        if divergence_pct < 2:
            magnitude = MagnitudeBucket.SMALL
        elif divergence_pct < 5:
            magnitude = MagnitudeBucket.MEDIUM
        else:
            magnitude = MagnitudeBucket.LARGE
            base_confidence += 0.1  # Strong signals get confidence boost
        
        # Cap confidence
        confidence = min(base_confidence, 0.85)
        
        # Predicted price
        if direction == Direction.UP:
            if magnitude == MagnitudeBucket.SMALL:
                predicted_change = 0.01
            elif magnitude == MagnitudeBucket.MEDIUM:
                predicted_change = 0.035
            else:
                predicted_change = 0.07
        else:
            if magnitude == MagnitudeBucket.SMALL:
                predicted_change = -0.01
            elif magnitude == MagnitudeBucket.MEDIUM:
                predicted_change = -0.035
            else:
                predicted_change = -0.07
        
        predicted_price = current_price * (1 + predicted_change)
        
        return PredictionOutput(
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning=f"Fast SMA ({self.fast_period}d): ${fast_sma:,.2f}, "
                     f"Slow SMA ({self.slow_period}d): ${slow_sma:,.2f}, "
                     f"Divergence: {divergence_pct:.2f}%",
            predicted_price=predicted_price
        )


class MomentumStrategy(BaseStrategy):
    """
    Momentum-based Strategy.
    
    Looks at recent price momentum and extrapolates:
    - Strong recent gains → expect continuation (with diminishing confidence)
    - Strong recent losses → expect continuation (with diminishing confidence)
    - Uses volatility to gauge confidence
    """
    
    def __init__(self, lookback_period: int = 14):
        super().__init__(
            name="momentum",
            description=f"Momentum strategy ({lookback_period} day lookback)"
        )
        self.lookback_period = lookback_period
    
    def predict(self, 
                symbol: str, 
                current_price: float,
                price_history: List[PriceRecord],
                target_date: date) -> PredictionOutput:
        
        if len(price_history) < self.lookback_period:
            return PredictionOutput(
                direction=Direction.NEUTRAL,
                magnitude=MagnitudeBucket.SMALL,
                confidence=0.3,
                reasoning=f"Insufficient data ({len(price_history)} days, need {self.lookback_period})"
            )
        
        # Get returns
        returns = self.get_price_returns(price_history[-self.lookback_period:])
        
        if not returns:
            return PredictionOutput(
                direction=Direction.NEUTRAL,
                magnitude=MagnitudeBucket.SMALL,
                confidence=0.3,
                reasoning="Could not calculate returns"
            )
        
        # Calculate momentum metrics
        total_return = sum(returns)
        avg_return = statistics.mean(returns)
        volatility = statistics.stdev(returns) if len(returns) > 1 else 0
        
        # Recent momentum (last 7 days vs previous)
        recent_returns = returns[-7:] if len(returns) >= 7 else returns
        recent_momentum = sum(recent_returns)
        
        # Direction based on momentum
        if recent_momentum > 1.0:  # >1% gain in recent period
            direction = Direction.UP
        elif recent_momentum < -1.0:  # >1% loss
            direction = Direction.DOWN
        else:
            direction = Direction.NEUTRAL
        
        # Magnitude based on strength of momentum
        abs_momentum = abs(recent_momentum)
        if abs_momentum < 2:
            magnitude = MagnitudeBucket.SMALL
        elif abs_momentum < 5:
            magnitude = MagnitudeBucket.MEDIUM
        else:
            magnitude = MagnitudeBucket.LARGE
        
        # Confidence inversely related to volatility
        # High volatility = less predictable = lower confidence
        if volatility < 2:
            base_confidence = 0.7
        elif volatility < 5:
            base_confidence = 0.55
        else:
            base_confidence = 0.4
        
        # Adjust confidence based on momentum strength
        if abs_momentum > 5:
            base_confidence += 0.1
        
        confidence = min(max(base_confidence, 0.3), 0.85)
        
        # Predicted price - extrapolate recent momentum but with decay
        decay_factor = 0.5  # Don't expect full continuation
        expected_change = (recent_momentum / 100) * decay_factor
        predicted_price = current_price * (1 + expected_change)
        
        return PredictionOutput(
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning=f"Total return ({self.lookback_period}d): {total_return:+.2f}%, "
                     f"Recent momentum (7d): {recent_momentum:+.2f}%, "
                     f"Volatility: {volatility:.2f}%",
            predicted_price=predicted_price
        )


class MeanReversionStrategy(BaseStrategy):
    """
    Mean Reversion Strategy - bet on prices returning to average.
    
    The contrarian approach:
    - Prices significantly above moving average → expect pullback
    - Prices significantly below moving average → expect bounce
    - Uses standard deviation to determine "significant"
    """
    
    def __init__(self, lookback_period: int = 21, std_threshold: float = 1.5):
        super().__init__(
            name="mean_reversion",
            description=f"Mean reversion ({lookback_period}d, {std_threshold} std threshold)"
        )
        self.lookback_period = lookback_period
        self.std_threshold = std_threshold
    
    def predict(self, 
                symbol: str, 
                current_price: float,
                price_history: List[PriceRecord],
                target_date: date) -> PredictionOutput:
        
        if len(price_history) < self.lookback_period:
            return PredictionOutput(
                direction=Direction.NEUTRAL,
                magnitude=MagnitudeBucket.SMALL,
                confidence=0.3,
                reasoning=f"Insufficient data ({len(price_history)} days, need {self.lookback_period})"
            )
        
        prices = [p.price_usd for p in price_history[-self.lookback_period:]]
        
        mean_price = statistics.mean(prices)
        std_price = statistics.stdev(prices) if len(prices) > 1 else 0
        
        if std_price == 0:
            return PredictionOutput(
                direction=Direction.NEUTRAL,
                magnitude=MagnitudeBucket.SMALL,
                confidence=0.3,
                reasoning="No price variation in lookback period"
            )
        
        # How many standard deviations from mean?
        z_score = (current_price - mean_price) / std_price
        
        if z_score > self.std_threshold:
            # Price is high - expect reversion down
            direction = Direction.DOWN
            strength = abs(z_score)
        elif z_score < -self.std_threshold:
            # Price is low - expect reversion up
            direction = Direction.UP
            strength = abs(z_score)
        else:
            # Price near mean - weak signal
            direction = Direction.NEUTRAL
            strength = 0
        
        # Magnitude based on how far from mean
        if strength < 1.5:
            magnitude = MagnitudeBucket.SMALL
        elif strength < 2.5:
            magnitude = MagnitudeBucket.MEDIUM
        else:
            magnitude = MagnitudeBucket.LARGE
        
        # Confidence based on strength of signal
        if strength == 0:
            confidence = 0.35
        elif strength < 2:
            confidence = 0.5
        elif strength < 3:
            confidence = 0.65
        else:
            confidence = 0.75
        
        # Predicted price - partial reversion to mean
        reversion_factor = 0.3  # Expect 30% reversion
        predicted_price = current_price + (mean_price - current_price) * reversion_factor
        
        return PredictionOutput(
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning=f"Mean: ${mean_price:,.2f}, Current: ${current_price:,.2f}, "
                     f"Z-score: {z_score:+.2f}",
            predicted_price=predicted_price
        )


# Registry of all available strategies
ALL_STRATEGIES = [
    RandomStrategy(),
    SMAStrategy(fast_period=7, slow_period=21),
    MomentumStrategy(lookback_period=14),
    MeanReversionStrategy(lookback_period=21, std_threshold=1.5),
]


def get_strategy(name: str) -> Optional[BaseStrategy]:
    """Get a strategy by name"""
    for strategy in ALL_STRATEGIES:
        if strategy.name == name:
            return strategy
    return None


def get_all_strategy_names() -> List[str]:
    """Get names of all available strategies"""
    return [s.name for s in ALL_STRATEGIES]
