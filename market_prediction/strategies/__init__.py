"""
Prediction strategies for the market prediction engine.

Each strategy implements the same interface and can be backtested
and compared against each other.
"""

from .base import Strategy
from .random_strategy import RandomStrategy
from .momentum import MomentumStrategy
from .mean_reversion import MeanReversionStrategy
from .sma_crossover import SMACrossoverStrategy
from .ensemble import EnsembleStrategy, AdaptiveEnsemble

__all__ = [
    "Strategy",
    "RandomStrategy",
    "MomentumStrategy", 
    "MeanReversionStrategy",
    "SMACrossoverStrategy",
    "EnsembleStrategy",
    "AdaptiveEnsemble",
]
