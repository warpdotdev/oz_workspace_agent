"""
Core data models for the prediction engine.

These models define the prediction contract and price history storage.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
import uuid


class Direction(Enum):
    """Price direction prediction."""
    UP = "up"
    DOWN = "down"


class Magnitude(Enum):
    """
    Price change magnitude buckets.
    
    SMALL: 0-2% change
    MEDIUM: 2-5% change  
    LARGE: 5%+ change
    """
    SMALL = "small"    # 0-2%
    MEDIUM = "medium"  # 2-5%
    LARGE = "large"    # 5%+
    
    @classmethod
    def from_percentage(cls, pct_change: float) -> "Magnitude":
        """Determine magnitude bucket from percentage change."""
        abs_change = abs(pct_change)
        if abs_change < 2.0:
            return cls.SMALL
        elif abs_change < 5.0:
            return cls.MEDIUM
        else:
            return cls.LARGE


@dataclass
class PriceHistory:
    """Historical price record for an asset."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    asset: str = ""  # e.g., "bitcoin", "ethereum"
    timestamp: datetime = field(default_factory=datetime.utcnow)
    price_usd: float = 0.0
    volume_24h: Optional[float] = None
    market_cap: Optional[float] = None
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "asset": self.asset,
            "timestamp": self.timestamp.isoformat(),
            "price_usd": self.price_usd,
            "volume_24h": self.volume_24h,
            "market_cap": self.market_cap,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "PriceHistory":
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            asset=data.get("asset", ""),
            timestamp=datetime.fromisoformat(data["timestamp"]) if isinstance(data.get("timestamp"), str) else data.get("timestamp", datetime.utcnow()),
            price_usd=data.get("price_usd", 0.0),
            volume_24h=data.get("volume_24h"),
            market_cap=data.get("market_cap"),
        )


@dataclass
class Prediction:
    """
    A market prediction with full audit trail.
    
    This is the core prediction contract. Each prediction contains:
    - What we predicted (direction, magnitude, confidence)
    - When we predicted it (prediction_time)
    - What strategy made the prediction
    - The actual price at prediction time
    - The target time (24h later)
    - After verification: the actual outcome
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Prediction inputs
    asset: str = ""  # e.g., "bitcoin", "ethereum"
    strategy: str = ""  # Which strategy made this prediction
    prediction_time: datetime = field(default_factory=datetime.utcnow)
    target_time: datetime = field(default_factory=datetime.utcnow)  # prediction_time + 24h
    
    # The prediction
    direction: Direction = Direction.UP
    magnitude: Magnitude = Magnitude.SMALL
    confidence: float = 0.5  # 0.0 - 1.0
    
    # Price at prediction time
    price_at_prediction: float = 0.0
    
    # Verification (filled in later)
    price_at_target: Optional[float] = None
    actual_direction: Optional[Direction] = None
    actual_magnitude: Optional[Magnitude] = None
    verified_at: Optional[datetime] = None
    
    # Computed outcomes
    direction_correct: Optional[bool] = None
    magnitude_correct: Optional[bool] = None
    percentage_change: Optional[float] = None
    
    @property
    def is_verified(self) -> bool:
        """Check if this prediction has been verified."""
        return self.verified_at is not None
    
    def verify(self, actual_price: float) -> None:
        """
        Verify the prediction against the actual price.
        
        This fills in all the verification fields.
        """
        self.price_at_target = actual_price
        self.verified_at = datetime.utcnow()
        
        # Calculate actual change
        self.percentage_change = ((actual_price - self.price_at_prediction) / self.price_at_prediction) * 100
        
        # Determine actual direction
        if actual_price > self.price_at_prediction:
            self.actual_direction = Direction.UP
        else:
            self.actual_direction = Direction.DOWN
        
        # Determine actual magnitude
        self.actual_magnitude = Magnitude.from_percentage(self.percentage_change)
        
        # Check if predictions were correct
        self.direction_correct = (self.direction == self.actual_direction)
        self.magnitude_correct = (self.magnitude == self.actual_magnitude)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "asset": self.asset,
            "strategy": self.strategy,
            "prediction_time": self.prediction_time.isoformat(),
            "target_time": self.target_time.isoformat(),
            "direction": self.direction.value,
            "magnitude": self.magnitude.value,
            "confidence": self.confidence,
            "price_at_prediction": self.price_at_prediction,
            "price_at_target": self.price_at_target,
            "actual_direction": self.actual_direction.value if self.actual_direction else None,
            "actual_magnitude": self.actual_magnitude.value if self.actual_magnitude else None,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "direction_correct": self.direction_correct,
            "magnitude_correct": self.magnitude_correct,
            "percentage_change": self.percentage_change,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Prediction":
        pred = cls(
            id=data.get("id", str(uuid.uuid4())),
            asset=data.get("asset", ""),
            strategy=data.get("strategy", ""),
            prediction_time=datetime.fromisoformat(data["prediction_time"]) if isinstance(data.get("prediction_time"), str) else data.get("prediction_time", datetime.utcnow()),
            target_time=datetime.fromisoformat(data["target_time"]) if isinstance(data.get("target_time"), str) else data.get("target_time", datetime.utcnow()),
            direction=Direction(data.get("direction", "up")),
            magnitude=Magnitude(data.get("magnitude", "small")),
            confidence=data.get("confidence", 0.5),
            price_at_prediction=data.get("price_at_prediction", 0.0),
        )
        
        # Verification fields
        if data.get("price_at_target") is not None:
            pred.price_at_target = data["price_at_target"]
        if data.get("actual_direction"):
            pred.actual_direction = Direction(data["actual_direction"])
        if data.get("actual_magnitude"):
            pred.actual_magnitude = Magnitude(data["actual_magnitude"])
        if data.get("verified_at"):
            pred.verified_at = datetime.fromisoformat(data["verified_at"]) if isinstance(data["verified_at"], str) else data["verified_at"]
        pred.direction_correct = data.get("direction_correct")
        pred.magnitude_correct = data.get("magnitude_correct")
        pred.percentage_change = data.get("percentage_change")
        
        return pred


@dataclass
class StrategyPerformance:
    """Performance metrics for a prediction strategy."""
    strategy: str
    total_predictions: int = 0
    verified_predictions: int = 0
    direction_correct: int = 0
    magnitude_correct: int = 0
    both_correct: int = 0
    
    @property
    def direction_accuracy(self) -> float:
        """Percentage of correct direction predictions."""
        if self.verified_predictions == 0:
            return 0.0
        return (self.direction_correct / self.verified_predictions) * 100
    
    @property
    def magnitude_accuracy(self) -> float:
        """Percentage of correct magnitude predictions."""
        if self.verified_predictions == 0:
            return 0.0
        return (self.magnitude_correct / self.verified_predictions) * 100
    
    @property
    def overall_accuracy(self) -> float:
        """Percentage where both direction and magnitude were correct."""
        if self.verified_predictions == 0:
            return 0.0
        return (self.both_correct / self.verified_predictions) * 100
    
    def to_dict(self) -> dict:
        return {
            "strategy": self.strategy,
            "total_predictions": self.total_predictions,
            "verified_predictions": self.verified_predictions,
            "direction_correct": self.direction_correct,
            "magnitude_correct": self.magnitude_correct,
            "both_correct": self.both_correct,
            "direction_accuracy": self.direction_accuracy,
            "magnitude_accuracy": self.magnitude_accuracy,
            "overall_accuracy": self.overall_accuracy,
        }
