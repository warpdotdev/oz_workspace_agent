"""
Market Prediction Engine

A testable and verifiable market prediction system.

Features:
- Multiple prediction strategies competing against each other
- Historical backtesting
- Live prediction with verification
- Strategy leaderboard with accuracy metrics
"""

from .models import (
    Direction,
    Magnitude,
    PricePoint,
    Prediction,
    StrategyStats,
    Database,
)

__version__ = "0.1.0"
__all__ = [
    "Direction",
    "Magnitude", 
    "PricePoint",
    "Prediction",
    "StrategyStats",
    "Database",
]
