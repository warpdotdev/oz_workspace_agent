"""
Ensemble Strategy

Combines multiple strategies by weighting their predictions
based on recent performance. Natural selection for prediction algorithms.

This addresses Boz's concern about running momentum and mean reversion
"blindly" - instead, we weight by what's actually working.
"""

from typing import List, Tuple, Dict, Optional
from collections import defaultdict

from .base import Strategy
from ..data.models import PriceHistory, Direction, Magnitude


class EnsembleStrategy(Strategy):
    """
    Ensemble strategy that weights component strategies by performance.
    
    How it works:
    1. Each component strategy makes a prediction
    2. We weight predictions by recent accuracy (rolling window)
    3. Final prediction is weighted vote
    4. Confidence reflects agreement among strategies
    
    This is regime-adaptive: if momentum is working, it gets more weight.
    If mean reversion is working, it takes over. No manual tuning needed.
    """
    
    def __init__(
        self,
        strategies: List[Strategy],
        lookback_predictions: int = 20,
        min_weight: float = 0.1
    ):
        """
        Initialize ensemble strategy.
        
        Args:
            strategies: Component strategies to combine
            lookback_predictions: How many recent predictions to use for weighting
            min_weight: Minimum weight for any strategy (prevents complete exclusion)
        """
        super().__init__(
            name="ensemble",
            description=f"Ensemble of {len(strategies)} strategies weighted by performance"
        )
        self.strategies = strategies
        self.lookback_predictions = lookback_predictions
        self.min_weight = min_weight
        
        # Track performance history for each strategy
        # Format: {strategy_name: [(prediction_correct: bool, timestamp)]}
        self.performance_history: Dict[str, List[Tuple[bool, float]]] = defaultdict(list)
    
    def update_performance(self, strategy_name: str, was_correct: bool, timestamp: float = 0.0):
        """
        Update performance history for a strategy.
        
        Call this after each prediction is verified.
        """
        self.performance_history[strategy_name].append((was_correct, timestamp))
        
        # Keep only recent history
        if len(self.performance_history[strategy_name]) > self.lookback_predictions * 2:
            self.performance_history[strategy_name] = self.performance_history[strategy_name][-self.lookback_predictions:]
    
    def _get_strategy_weights(self) -> Dict[str, float]:
        """
        Calculate weights for each strategy based on recent performance.
        
        Returns dict mapping strategy name to weight (0.0 to 1.0).
        """
        weights = {}
        
        for strategy in self.strategies:
            name = strategy.name
            history = self.performance_history.get(name, [])
            
            if not history:
                # No history yet - use equal weight
                weights[name] = 1.0 / len(self.strategies)
            else:
                # Use recent accuracy as weight
                recent = history[-self.lookback_predictions:]
                if recent:
                    accuracy = sum(1 for correct, _ in recent if correct) / len(recent)
                    # Apply minimum weight floor
                    weights[name] = max(accuracy, self.min_weight)
                else:
                    weights[name] = self.min_weight
        
        # Normalize weights to sum to 1
        total = sum(weights.values())
        if total > 0:
            weights = {k: v / total for k, v in weights.items()}
        
        return weights
    
    def predict(
        self,
        asset: str,
        price_history: List[PriceHistory],
        current_price: float
    ) -> Tuple[Direction, Magnitude, float]:
        """
        Make ensemble prediction by weighted voting.
        """
        weights = self._get_strategy_weights()
        
        # Collect predictions from all strategies
        up_weight = 0.0
        down_weight = 0.0
        magnitude_votes: Dict[Magnitude, float] = defaultdict(float)
        confidence_sum = 0.0
        weight_sum = 0.0
        
        for strategy in self.strategies:
            direction, magnitude, confidence = strategy.predict(
                asset, price_history, current_price
            )
            
            weight = weights.get(strategy.name, 1.0 / len(self.strategies))
            
            # Weighted vote for direction
            if direction == Direction.UP:
                up_weight += weight * confidence
            else:
                down_weight += weight * confidence
            
            # Weighted vote for magnitude
            magnitude_votes[magnitude] += weight
            
            # Track weighted confidence
            confidence_sum += weight * confidence
            weight_sum += weight
        
        # Final direction is weighted majority
        direction = Direction.UP if up_weight >= down_weight else Direction.DOWN
        
        # Final magnitude is highest weighted vote
        magnitude = max(magnitude_votes.keys(), key=lambda m: magnitude_votes[m])
        
        # Final confidence based on:
        # 1. Weighted average of component confidences
        # 2. Agreement among strategies (higher if they agree)
        avg_confidence = confidence_sum / weight_sum if weight_sum > 0 else 0.5
        
        # Agreement factor: how lopsided was the vote?
        total_direction_weight = up_weight + down_weight
        if total_direction_weight > 0:
            agreement = abs(up_weight - down_weight) / total_direction_weight
        else:
            agreement = 0.0
        
        # Combine: base confidence adjusted by agreement
        # High agreement = boost confidence, low agreement = reduce it
        confidence = avg_confidence * (0.7 + 0.3 * agreement)
        confidence = max(0.5, min(0.85, confidence))  # Keep in reasonable range
        
        return direction, magnitude, confidence
    
    def get_component_weights(self) -> Dict[str, float]:
        """Get current weights for inspection."""
        return self._get_strategy_weights()


class AdaptiveEnsemble(EnsembleStrategy):
    """
    Adaptive ensemble that updates weights during backtesting.
    
    This is for use in backtests where we want the ensemble to
    learn from the training period and apply to test period.
    """
    
    def __init__(
        self,
        strategies: List[Strategy],
        lookback_predictions: int = 20,
        min_weight: float = 0.1,
        adaptation_rate: float = 0.1
    ):
        super().__init__(strategies, lookback_predictions, min_weight)
        self.name = "adaptive_ensemble"
        self.description = f"Adaptive ensemble that learns from recent performance"
        self.adaptation_rate = adaptation_rate
        
        # Exponential moving average of accuracy for each strategy
        self.ema_accuracy: Dict[str, float] = {s.name: 0.5 for s in strategies}
    
    def update_performance(self, strategy_name: str, was_correct: bool, timestamp: float = 0.0):
        """Update EMA accuracy for the strategy."""
        super().update_performance(strategy_name, was_correct, timestamp)
        
        # Update EMA
        current = 1.0 if was_correct else 0.0
        if strategy_name in self.ema_accuracy:
            self.ema_accuracy[strategy_name] = (
                self.adaptation_rate * current + 
                (1 - self.adaptation_rate) * self.ema_accuracy[strategy_name]
            )
        else:
            self.ema_accuracy[strategy_name] = current
    
    def _get_strategy_weights(self) -> Dict[str, float]:
        """Use EMA accuracy as weights."""
        weights = {}
        
        for strategy in self.strategies:
            accuracy = self.ema_accuracy.get(strategy.name, 0.5)
            weights[strategy.name] = max(accuracy, self.min_weight)
        
        # Normalize
        total = sum(weights.values())
        if total > 0:
            weights = {k: v / total for k, v in weights.items()}
        
        return weights
