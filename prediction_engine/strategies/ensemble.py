#!/usr/bin/env python3
"""
Ensemble Strategy

A meta-strategy that combines predictions from multiple strategies,
weighting them by their recent performance.

This addresses Boz's point about regime detection - rather than running
momentum and mean reversion blindly, we weight by what's been working recently.

Features:
- Rolling window performance tracking
- Dynamic weight adjustment based on recent accuracy
- Confidence calibration based on strategy agreement
"""

from typing import List, Optional, Dict
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime

from .base import PredictionStrategy, PredictionResult
from .momentum import MomentumStrategy
from .sma_crossover import SMACrossoverStrategy
from .random_baseline import RandomBaselineStrategy
from data.models import Direction, Magnitude
from data.coingecko_client import HistoricalPrice


@dataclass
class StrategyVote:
    """A weighted vote from a strategy."""
    strategy_name: str
    direction: Direction
    magnitude: Magnitude
    confidence: float
    weight: float  # Based on recent performance


class EnsembleStrategy(PredictionStrategy):
    """
    Ensemble prediction strategy that combines multiple strategies.
    
    Uses rolling window performance to weight strategies - strategies
    that have been performing well recently get more weight.
    
    This provides natural regime adaptation without explicit regime detection.
    """
    
    def __init__(
        self, 
        lookback_window: int = 10,  # Days to track performance
        min_weight: float = 0.1,     # Minimum weight for any strategy
        max_weight: float = 0.5      # Maximum weight cap
    ):
        super().__init__(
            name="ensemble",
            description=f"Performance-weighted ensemble (lookback={lookback_window}d)"
        )
        
        self.lookback_window = lookback_window
        self.min_weight = min_weight
        self.max_weight = max_weight
        
        # Component strategies (excluding random baseline)
        self.strategies = [
            MomentumStrategy(),
            SMACrossoverStrategy(),
        ]
        
        # Performance tracking: {strategy_name: [recent_accuracy_scores]}
        self._performance_history: Dict[str, List[float]] = defaultdict(list)
        
        # Store predictions for later verification
        self._pending_predictions: Dict[str, Dict] = {}
    
    def predict(
        self, 
        symbol: str,
        current_price: float,
        historical_prices: List[HistoricalPrice],
        **kwargs
    ) -> Optional[PredictionResult]:
        """
        Generate a weighted ensemble prediction.
        
        1. Get predictions from all component strategies
        2. Weight by recent performance
        3. Combine into a single prediction
        """
        if len(historical_prices) < 30:  # Need enough data for SMA
            return None
        
        # Update performance tracking based on recent data
        self._update_performance_tracking(symbol, historical_prices)
        
        # Collect votes from all strategies
        votes = []
        for strategy in self.strategies:
            result = strategy.predict(
                symbol=symbol,
                current_price=current_price,
                historical_prices=historical_prices
            )
            
            if result:
                weight = self._get_strategy_weight(strategy.name)
                votes.append(StrategyVote(
                    strategy_name=strategy.name,
                    direction=result.direction,
                    magnitude=result.magnitude,
                    confidence=result.confidence,
                    weight=weight
                ))
        
        if not votes:
            return None
        
        # Combine votes into final prediction
        return self._combine_votes(symbol, votes)
    
    def _update_performance_tracking(
        self, 
        symbol: str,
        historical_prices: List[HistoricalPrice]
    ):
        """
        Backtest component strategies on recent data to track performance.
        
        This simulates what would have happened if we used each strategy
        over the lookback window.
        """
        if len(historical_prices) < self.lookback_window + 10:
            return
        
        # Use last N days for performance tracking
        for strategy in self.strategies:
            correct_count = 0
            total_count = 0
            
            # Simulate predictions over lookback window
            for i in range(len(historical_prices) - self.lookback_window - 1, len(historical_prices) - 1):
                if i < 21:  # Need enough history for SMA
                    continue
                    
                history = historical_prices[:i+1]
                current_price = history[-1].price
                next_price = historical_prices[i + 1].price
                
                # What actually happened
                actual_change = (next_price - current_price) / current_price
                actual_direction = Direction.UP if actual_change >= 0 else Direction.DOWN
                
                # What strategy would have predicted
                result = strategy.predict(
                    symbol=symbol,
                    current_price=current_price,
                    historical_prices=history[-30:]
                )
                
                if result:
                    total_count += 1
                    if result.direction == actual_direction:
                        correct_count += 1
            
            # Store accuracy for this strategy
            if total_count > 0:
                accuracy = correct_count / total_count
                history = self._performance_history[strategy.name]
                history.append(accuracy)
                
                # Keep only recent history
                if len(history) > 20:
                    self._performance_history[strategy.name] = history[-20:]
    
    def _get_strategy_weight(self, strategy_name: str) -> float:
        """
        Calculate weight for a strategy based on recent performance.
        
        Strategies that have been more accurate recently get higher weights.
        """
        history = self._performance_history.get(strategy_name, [])
        
        if not history:
            # No history yet, use equal weights
            return 1.0 / len(self.strategies)
        
        # Use exponentially weighted average (more recent = more weight)
        weights = [0.5 ** (len(history) - i - 1) for i in range(len(history))]
        total_weight = sum(weights)
        weighted_accuracy = sum(w * acc for w, acc in zip(weights, history)) / total_weight
        
        # Convert accuracy to weight
        # Better than 50% = weight > 0.5, worse = weight < 0.5
        raw_weight = weighted_accuracy
        
        # Clamp to [min_weight, max_weight]
        clamped_weight = max(self.min_weight, min(self.max_weight, raw_weight))
        
        return clamped_weight
    
    def _combine_votes(
        self, 
        symbol: str,
        votes: List[StrategyVote]
    ) -> PredictionResult:
        """
        Combine weighted votes into a single prediction.
        """
        # Normalize weights
        total_weight = sum(v.weight for v in votes)
        
        # Count weighted votes for each direction
        up_weight = sum(v.weight * v.confidence for v in votes if v.direction == Direction.UP)
        down_weight = sum(v.weight * v.confidence for v in votes if v.direction == Direction.DOWN)
        
        # Direction is the one with more weighted votes
        if up_weight >= down_weight:
            direction = Direction.UP
            direction_strength = up_weight / (up_weight + down_weight) if (up_weight + down_weight) > 0 else 0.5
        else:
            direction = Direction.DOWN
            direction_strength = down_weight / (up_weight + down_weight) if (up_weight + down_weight) > 0 else 0.5
        
        # Magnitude: weight the magnitudes
        magnitude_scores = {Magnitude.SMALL: 0.0, Magnitude.MEDIUM: 0.0, Magnitude.LARGE: 0.0}
        for v in votes:
            magnitude_scores[v.magnitude] += v.weight
        magnitude = max(magnitude_scores.keys(), key=lambda m: magnitude_scores[m])
        
        # Confidence based on:
        # - How much strategies agree (agreement = higher confidence)
        # - Average confidence of agreeing strategies
        # - Direction strength
        agreeing_votes = [v for v in votes if v.direction == direction]
        
        if agreeing_votes:
            avg_confidence = sum(v.confidence * v.weight for v in agreeing_votes) / sum(v.weight for v in agreeing_votes)
            agreement_ratio = len(agreeing_votes) / len(votes)
            
            # Combine: strong agreement + high confidence = high ensemble confidence
            confidence = (direction_strength * 0.5) + (avg_confidence * 0.3) + (agreement_ratio * 0.2)
        else:
            confidence = 0.5
        
        # Clamp confidence
        confidence = max(0.35, min(0.9, confidence))
        
        # Build reasoning
        vote_summary = ", ".join([
            f"{v.strategy_name}={v.direction.value}@{v.weight:.2f}" 
            for v in votes
        ])
        reasoning = f"Ensemble ({len(agreeing_votes)}/{len(votes)} agree): {vote_summary}"
        
        return PredictionResult(
            symbol=symbol,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence,
            reasoning=reasoning
        )
    
    def get_current_weights(self) -> Dict[str, float]:
        """Get current weights for all strategies (for debugging/display)."""
        return {s.name: self._get_strategy_weight(s.name) for s in self.strategies}
