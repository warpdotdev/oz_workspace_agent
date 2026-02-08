"""Prediction strategies for the market prediction engine."""
from .base import PredictionStrategy, PredictionResult
from .sma_crossover import SMACrossoverStrategy
from .random_baseline import RandomBaselineStrategy
from .momentum import MomentumStrategy
from .ensemble import EnsembleStrategy

# All available strategies
ALL_STRATEGIES = [
    SMACrossoverStrategy,
    RandomBaselineStrategy,
    MomentumStrategy,
    EnsembleStrategy,
]

def get_all_strategies():
    """Get instances of all available strategies."""
    return [
        SMACrossoverStrategy(),
        RandomBaselineStrategy(),
        MomentumStrategy(),
        EnsembleStrategy(),
    ]

__all__ = [
    "PredictionStrategy", "PredictionResult",
    "SMACrossoverStrategy", "RandomBaselineStrategy", "MomentumStrategy",
    "EnsembleStrategy",
    "ALL_STRATEGIES", "get_all_strategies"
]
