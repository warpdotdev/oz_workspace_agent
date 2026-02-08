"""Prediction strategies for the market prediction engine."""
from .base import PredictionStrategy, PredictionResult
from .sma_crossover import SMACrossoverStrategy
from .random_baseline import RandomBaselineStrategy
from .momentum import MomentumStrategy

# All available strategies
ALL_STRATEGIES = [
    SMACrossoverStrategy,
    RandomBaselineStrategy,
    MomentumStrategy,
]

def get_all_strategies():
    """Get instances of all available strategies."""
    return [
        SMACrossoverStrategy(),
        RandomBaselineStrategy(),
        MomentumStrategy(),
    ]

__all__ = [
    "PredictionStrategy", "PredictionResult",
    "SMACrossoverStrategy", "RandomBaselineStrategy", "MomentumStrategy",
    "ALL_STRATEGIES", "get_all_strategies"
]
