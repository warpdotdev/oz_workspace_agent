#!/usr/bin/env python3
"""
Prediction Strategy Base Class

All prediction strategies inherit from this abstract base class.
Each strategy must implement the `predict` method.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from data.models import Direction, Magnitude
from data.coingecko_client import HistoricalPrice


@dataclass
class PredictionResult:
    """Result of a prediction from a strategy."""
    symbol: str
    direction: Direction
    magnitude: Magnitude
    confidence: float  # 0.0 - 1.0
    reasoning: str = ""  # Optional explanation
    
    def __repr__(self):
        return f"{self.symbol}: {self.direction.value} {self.magnitude.value} @ {self.confidence:.0%}"


class PredictionStrategy(ABC):
    """
    Abstract base class for all prediction strategies.
    
    Strategies compete by making predictions. Their accuracy is tracked
    over time, allowing us to weight them by performance.
    """
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    def predict(
        self, 
        symbol: str,
        current_price: float,
        historical_prices: List[HistoricalPrice],
        **kwargs
    ) -> Optional[PredictionResult]:
        """
        Make a prediction for a given symbol.
        
        Args:
            symbol: The coin/asset symbol (e.g., "bitcoin")
            current_price: Current price in USD
            historical_prices: List of historical prices (oldest first)
            **kwargs: Additional data that specific strategies might need
        
        Returns:
            PredictionResult with direction, magnitude, and confidence,
            or None if the strategy cannot make a prediction
        """
        pass
    
    def get_prices_as_list(self, historical_prices: List[HistoricalPrice]) -> List[float]:
        """Helper to extract just the price values from historical data."""
        return [hp.price for hp in historical_prices]
    
    def calculate_sma(self, prices: List[float], period: int) -> Optional[float]:
        """Calculate Simple Moving Average for a given period."""
        if len(prices) < period:
            return None
        return sum(prices[-period:]) / period
    
    def calculate_ema(self, prices: List[float], period: int) -> Optional[float]:
        """Calculate Exponential Moving Average for a given period."""
        if len(prices) < period:
            return None
        
        multiplier = 2 / (period + 1)
        ema = prices[0]
        
        for price in prices[1:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def calculate_momentum(self, prices: List[float], period: int = 10) -> Optional[float]:
        """
        Calculate momentum as percentage change over period.
        
        Returns:
            Percentage change from `period` days ago to now
        """
        if len(prices) < period:
            return None
        
        old_price = prices[-period]
        current_price = prices[-1]
        
        if old_price == 0:
            return None
        
        return ((current_price - old_price) / old_price) * 100
    
    def __repr__(self):
        return f"{self.__class__.__name__}(name={self.name})"
