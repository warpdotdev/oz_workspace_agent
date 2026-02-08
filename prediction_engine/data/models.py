#!/usr/bin/env python3
"""
Market Prediction Engine - Database Models

SQLAlchemy models for storing predictions, outcomes, and strategy performance.
"""

import os
from datetime import datetime
from enum import Enum
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Database setup
DB_PATH = os.environ.get('PREDICTION_DB_PATH', 'predictions.db')
engine = create_engine(f'sqlite:///{DB_PATH}', echo=False)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Direction(str, Enum):
    """Price movement direction."""
    UP = "UP"
    DOWN = "DOWN"


class Magnitude(str, Enum):
    """Price movement magnitude buckets."""
    SMALL = "SMALL"      # 0-2%
    MEDIUM = "MEDIUM"    # 2-5%
    LARGE = "LARGE"      # 5%+


class Prediction(Base):
    """A prediction made by a strategy."""
    __tablename__ = 'predictions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    strategy_name = Column(String, nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)  # e.g., "bitcoin", "ethereum"
    
    # The prediction itself
    predicted_direction = Column(SQLEnum(Direction), nullable=False)
    predicted_magnitude = Column(SQLEnum(Magnitude), nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    
    # Price at prediction time (for reference)
    price_at_prediction = Column(Float, nullable=True)
    
    # Timestamps
    prediction_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    target_time = Column(DateTime, nullable=False)  # When we expect to verify
    
    # Relationship to outcome
    outcome = relationship("Outcome", back_populates="prediction", uselist=False)
    
    def __repr__(self):
        return f"<Prediction {self.strategy_name}:{self.symbol} {self.predicted_direction.value} {self.predicted_magnitude.value} @ {self.confidence:.0%}>"


class Outcome(Base):
    """The actual outcome for a prediction."""
    __tablename__ = 'outcomes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey('predictions.id'), unique=True, nullable=False)
    
    # What actually happened
    actual_direction = Column(SQLEnum(Direction), nullable=False)
    actual_magnitude = Column(SQLEnum(Magnitude), nullable=False)
    actual_price_change_pct = Column(Float, nullable=False)
    actual_price = Column(Float, nullable=True)
    
    # Did we get it right?
    direction_correct = Column(Integer, nullable=False)  # 1 or 0
    magnitude_correct = Column(Integer, nullable=False)  # 1 or 0
    
    # When we verified
    verified_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship
    prediction = relationship("Prediction", back_populates="outcome")
    
    def __repr__(self):
        return f"<Outcome {self.actual_direction.value} {self.actual_magnitude.value} ({self.actual_price_change_pct:+.2f}%)>"


class StrategyStats(Base):
    """Aggregated statistics for each strategy."""
    __tablename__ = 'strategy_stats'
    
    name = Column(String, primary_key=True)
    description = Column(String, nullable=True)
    
    # Counts
    total_predictions = Column(Integer, default=0)
    verified_predictions = Column(Integer, default=0)
    
    # Accuracy metrics
    correct_direction = Column(Integer, default=0)
    correct_magnitude = Column(Integer, default=0)
    
    # Derived metrics (updated on each verification)
    direction_accuracy = Column(Float, default=0.0)
    magnitude_accuracy = Column(Float, default=0.0)
    combined_accuracy = Column(Float, default=0.0)
    
    # Confidence calibration
    avg_confidence = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_prediction_at = Column(DateTime, nullable=True)
    last_verified_at = Column(DateTime, nullable=True)
    
    def update_accuracy(self):
        """Recalculate accuracy metrics."""
        if self.verified_predictions > 0:
            self.direction_accuracy = self.correct_direction / self.verified_predictions
            self.magnitude_accuracy = self.correct_magnitude / self.verified_predictions
            # Combined: both direction AND magnitude correct
            self.combined_accuracy = (self.direction_accuracy + self.magnitude_accuracy) / 2
    
    def __repr__(self):
        return f"<Strategy {self.name}: {self.direction_accuracy:.1%} direction, {self.magnitude_accuracy:.1%} magnitude>"


def init_db():
    """Initialize the database, creating all tables."""
    Base.metadata.create_all(engine)


def get_session():
    """Get a new database session."""
    return SessionLocal()


def get_magnitude_from_pct(pct: float) -> Magnitude:
    """Convert a percentage change to a magnitude bucket."""
    abs_pct = abs(pct)
    if abs_pct < 2:
        return Magnitude.SMALL
    elif abs_pct < 5:
        return Magnitude.MEDIUM
    else:
        return Magnitude.LARGE


def get_direction_from_pct(pct: float) -> Direction:
    """Convert a percentage change to a direction."""
    return Direction.UP if pct >= 0 else Direction.DOWN


if __name__ == "__main__":
    # Quick test
    init_db()
    print("Database initialized!")
