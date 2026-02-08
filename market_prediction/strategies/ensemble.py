#!/usr/bin/env python3
"""
Ensemble Strategy

Combines multiple prediction strategies using dynamic weighting based on:
1. Recent performance (accuracy over rolling window)
2. Market regime (trending vs ranging)

The goal is to produce better predictions than any single strategy alone.
"""

import uuid
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import Direction, Magnitude, PricePoint, Prediction
from strategies.base import BaseStrategy, get_all_strategies
from strategies.regime import RegimeDetector, MarketRegime, get_regime_weight_adjustments


@dataclass
class StrategyWeight:
    """Tracks a strategy's weight and recent performance."""
    strategy_name: str
    base_weight: float  # From recent accuracy
    regime_multiplier: float  # From regime detection
    final_weight: float  # base_weight * regime_multiplier, normalized
    recent_accuracy: float  # Directional accuracy over lookback period
    prediction_count: int  # Number of predictions in lookback


class EnsembleStrategy(BaseStrategy):
    """
    Ensemble strategy that combines multiple strategies.
    
    Weighting approach:
    1. Calculate each strategy's recent directional accuracy
    2. Apply regime-based adjustments
    3. Weight predictions by normalized weights
    4. Aggregate to final prediction using weighted voting
    
    Special handling:
    - Random baseline is excluded (no edge expected)
    - Strategies with no recent predictions get default weight
    - Minimum weight applied to prevent total exclusion
    """
    
    name = "ensemble"
    description = "Ensemble - dynamically weights strategies by recent performance and market regime"
    
    def __init__(
        self,
        lookback_hours: int = 168,  # 7 days for performance tracking
        min_predictions_for_weight: int = 5,
        min_weight: float = 0.1,
        include_random: bool = False
    ):
        self.lookback_hours = lookback_hours
        self.min_predictions_for_weight = min_predictions_for_weight
        self.min_weight = min_weight
        self.include_random = include_random
        self.regime_detector = RegimeDetector()
        
        # Get constituent strategies (exclude random by default)
        self.strategies = [
            s for s in get_all_strategies()
            if s.name != "random" or include_random
        ]
        
        # Track performance history (filled during backtesting)
        self.performance_history: dict[str, list[tuple[datetime, bool]]] = defaultdict(list)
    
    def predict(
        self,
        asset: str,
        current_price: float,
        price_history: list[PricePoint],
        prediction_time: datetime
    ) -> Optional[Prediction]:
        """
        Generate ensemble prediction by combining all strategies.
        """
        if len(price_history) < 48:
            return None
        
        # Get predictions from all strategies
        strategy_predictions: dict[str, Prediction] = {}
        for strategy in self.strategies:
            pred = strategy.predict(asset, current_price, price_history, prediction_time)
            if pred:
                strategy_predictions[strategy.name] = pred
        
        if not strategy_predictions:
            return None
        
        # Get current market regime
        regime_analysis = self.regime_detector.detect(price_history, prediction_time)
        regime_adjustments = get_regime_weight_adjustments(regime_analysis.regime)
        
        # Calculate weights
        weights = self._calculate_weights(prediction_time, regime_adjustments)
        
        # Weighted voting for direction
        up_weight = 0.0
        down_weight = 0.0
        
        for strategy_name, pred in strategy_predictions.items():
            weight = weights.get(strategy_name, StrategyWeight(
                strategy_name=strategy_name,
                base_weight=1.0,
                regime_multiplier=1.0,
                final_weight=1.0 / len(strategy_predictions),
                recent_accuracy=0.5,
                prediction_count=0
            )).final_weight
            
            if pred.direction == Direction.UP:
                up_weight += weight
            else:
                down_weight += weight
        
        # Determine direction by majority weighted vote
        total_weight = up_weight + down_weight
        if total_weight <= 0:
            return None
        
        direction = Direction.UP if up_weight >= down_weight else Direction.DOWN
        direction_confidence = max(up_weight, down_weight) / total_weight
        
        # Weighted average for magnitude
        magnitude_scores = {Magnitude.SMALL: 0.0, Magnitude.MEDIUM: 0.0, Magnitude.LARGE: 0.0}
        
        for strategy_name, pred in strategy_predictions.items():
            weight = weights.get(strategy_name, StrategyWeight(
                strategy_name=strategy_name,
                base_weight=1.0,
                regime_multiplier=1.0,
                final_weight=1.0 / len(strategy_predictions),
                recent_accuracy=0.5,
                prediction_count=0
            )).final_weight
            magnitude_scores[pred.magnitude] += weight
        
        magnitude = max(magnitude_scores, key=magnitude_scores.get)
        
        # Confidence = weighted average of constituent confidences, adjusted by agreement
        weighted_confidence_sum = 0.0
        for strategy_name, pred in strategy_predictions.items():
            weight = weights.get(strategy_name, StrategyWeight(
                strategy_name=strategy_name,
                base_weight=1.0,
                regime_multiplier=1.0,
                final_weight=1.0 / len(strategy_predictions),
                recent_accuracy=0.5,
                prediction_count=0
            )).final_weight
            weighted_confidence_sum += weight * pred.confidence
        
        # Adjust confidence by how much agreement there is
        agreement_factor = direction_confidence  # Higher agreement = higher confidence
        confidence = weighted_confidence_sum * agreement_factor
        confidence = max(0.3, min(0.9, confidence))  # Clamp
        
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=direction,
            magnitude=magnitude,
            confidence=confidence
        )
    
    def _calculate_weights(
        self,
        current_time: datetime,
        regime_adjustments: dict[str, float]
    ) -> dict[str, StrategyWeight]:
        """
        Calculate weights for each strategy based on recent performance.
        """
        weights = {}
        cutoff = current_time - timedelta(hours=self.lookback_hours)
        
        for strategy in self.strategies:
            name = strategy.name
            
            # Get recent performance from history
            recent = [
                (t, correct) for t, correct in self.performance_history.get(name, [])
                if t >= cutoff
            ]
            
            if len(recent) >= self.min_predictions_for_weight:
                correct_count = sum(1 for _, c in recent if c)
                accuracy = correct_count / len(recent)
            else:
                # Default to 50% (random baseline) if insufficient data
                accuracy = 0.5
            
            # Base weight: accuracy above random gets higher weight
            # accuracy = 0.5 -> base_weight = 1.0
            # accuracy = 0.6 -> base_weight = 1.2
            # accuracy = 0.4 -> base_weight = 0.8
            base_weight = max(self.min_weight, accuracy / 0.5)
            
            # Apply regime adjustment
            regime_multiplier = regime_adjustments.get(name, 1.0)
            
            weights[name] = StrategyWeight(
                strategy_name=name,
                base_weight=base_weight,
                regime_multiplier=regime_multiplier,
                final_weight=0.0,  # Will normalize below
                recent_accuracy=accuracy,
                prediction_count=len(recent)
            )
        
        # Normalize weights to sum to 1
        total_raw = sum(w.base_weight * w.regime_multiplier for w in weights.values())
        if total_raw > 0:
            for w in weights.values():
                w.final_weight = (w.base_weight * w.regime_multiplier) / total_raw
        else:
            # Equal weights if nothing works
            equal_weight = 1.0 / len(weights)
            for w in weights.values():
                w.final_weight = equal_weight
        
        return weights
    
    def record_result(self, strategy_name: str, prediction_time: datetime, correct: bool):
        """
        Record a prediction result for weight calculation.
        
        This should be called during backtesting to track performance.
        """
        self.performance_history[strategy_name].append((prediction_time, correct))
    
    def clear_history(self):
        """Clear performance history."""
        self.performance_history.clear()
    
    def get_current_weights(self, current_time: datetime) -> dict[str, StrategyWeight]:
        """Get current strategy weights for inspection."""
        # Use default regime adjustments
        return self._calculate_weights(current_time, {
            "momentum": 1.0,
            "mean_reversion": 1.0,
            "sma_crossover": 1.0,
            "random": 1.0,
        })


class AdaptiveEnsembleStrategy(EnsembleStrategy):
    """
    Enhanced ensemble that adapts more aggressively to recent performance.
    
    Differences from base ensemble:
    - Shorter lookback (48 hours vs 168)
    - More aggressive weight changes
    - Includes regime detection with higher impact
    """
    
    name = "adaptive_ensemble"
    description = "Adaptive ensemble - rapidly adjusts to recent market conditions"
    
    def __init__(self):
        super().__init__(
            lookback_hours=48,
            min_predictions_for_weight=3,
            min_weight=0.05
        )
    
    def _calculate_weights(
        self,
        current_time: datetime,
        regime_adjustments: dict[str, float]
    ) -> dict[str, StrategyWeight]:
        """
        More aggressive weight calculation.
        """
        weights = {}
        cutoff = current_time - timedelta(hours=self.lookback_hours)
        
        for strategy in self.strategies:
            name = strategy.name
            
            recent = [
                (t, correct) for t, correct in self.performance_history.get(name, [])
                if t >= cutoff
            ]
            
            if len(recent) >= self.min_predictions_for_weight:
                correct_count = sum(1 for _, c in recent if c)
                accuracy = correct_count / len(recent)
            else:
                accuracy = 0.5
            
            # More aggressive: square the deviation from 0.5
            # accuracy = 0.6 -> base_weight = 1.44 (vs 1.2 in base)
            # accuracy = 0.4 -> base_weight = 0.64 (vs 0.8 in base)
            deviation = (accuracy - 0.5) * 2
            base_weight = max(self.min_weight, 1.0 + deviation * abs(deviation))
            
            # Stronger regime adjustment
            regime_multiplier = regime_adjustments.get(name, 1.0)
            # Amplify regime effect
            if regime_multiplier > 1.0:
                regime_multiplier = 1.0 + (regime_multiplier - 1.0) * 1.5
            elif regime_multiplier < 1.0:
                regime_multiplier = 1.0 - (1.0 - regime_multiplier) * 1.5
            
            weights[name] = StrategyWeight(
                strategy_name=name,
                base_weight=base_weight,
                regime_multiplier=regime_multiplier,
                final_weight=0.0,
                recent_accuracy=accuracy,
                prediction_count=len(recent)
            )
        
        # Normalize
        total_raw = sum(w.base_weight * w.regime_multiplier for w in weights.values())
        if total_raw > 0:
            for w in weights.values():
                w.final_weight = (w.base_weight * w.regime_multiplier) / total_raw
        else:
            equal_weight = 1.0 / len(weights)
            for w in weights.values():
                w.final_weight = equal_weight
        
        return weights
