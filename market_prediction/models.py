#!/usr/bin/env python3
"""
Market Prediction Engine - Core Data Models

Defines the prediction contract:
- Direction: UP/DOWN
- Magnitude: SMALL (0-2%), MEDIUM (2-5%), LARGE (5%+)
- 24-hour prediction window
"""

import sqlite3
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import json


class Direction(Enum):
    """Predicted price direction."""
    UP = "UP"
    DOWN = "DOWN"


class Magnitude(Enum):
    """Predicted magnitude of price change."""
    SMALL = "SMALL"      # 0-2%
    MEDIUM = "MEDIUM"    # 2-5%
    LARGE = "LARGE"      # 5%+
    
    @classmethod
    def from_percentage(cls, pct: float) -> "Magnitude":
        """Convert a percentage change to a magnitude bucket."""
        abs_pct = abs(pct)
        if abs_pct < 2.0:
            return cls.SMALL
        elif abs_pct < 5.0:
            return cls.MEDIUM
        else:
            return cls.LARGE


@dataclass
class PricePoint:
    """A single price observation."""
    asset: str
    timestamp: datetime
    price_usd: float
    
    def to_dict(self) -> dict:
        return {
            "asset": self.asset,
            "timestamp": self.timestamp.isoformat(),
            "price_usd": self.price_usd
        }


@dataclass
class Prediction:
    """
    A single prediction record.
    
    This is the core data structure that captures:
    - What we predicted
    - When we predicted it
    - What actually happened (filled in later)
    """
    id: str
    asset: str
    strategy: str
    
    # Timing
    prediction_time: datetime
    target_time: datetime  # prediction_time + 24h
    
    # The prediction itself
    direction: Direction
    magnitude: Magnitude
    confidence: float  # 0.0 - 1.0
    
    # Prices (target price filled in after verification)
    price_at_prediction: float
    price_at_target: Optional[float] = None
    
    # Verification results (filled in after verification)
    actual_direction: Optional[Direction] = None
    actual_magnitude: Optional[Magnitude] = None
    direction_correct: Optional[bool] = None
    magnitude_correct: Optional[bool] = None
    verified_at: Optional[datetime] = None
    
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
            "direction_correct": self.direction_correct,
            "magnitude_correct": self.magnitude_correct,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Prediction":
        return cls(
            id=data["id"],
            asset=data["asset"],
            strategy=data["strategy"],
            prediction_time=datetime.fromisoformat(data["prediction_time"]),
            target_time=datetime.fromisoformat(data["target_time"]),
            direction=Direction(data["direction"]),
            magnitude=Magnitude(data["magnitude"]),
            confidence=data["confidence"],
            price_at_prediction=data["price_at_prediction"],
            price_at_target=data.get("price_at_target"),
            actual_direction=Direction(data["actual_direction"]) if data.get("actual_direction") else None,
            actual_magnitude=Magnitude(data["actual_magnitude"]) if data.get("actual_magnitude") else None,
            direction_correct=data.get("direction_correct"),
            magnitude_correct=data.get("magnitude_correct"),
            verified_at=datetime.fromisoformat(data["verified_at"]) if data.get("verified_at") else None
        )


@dataclass
class StrategyStats:
    """Aggregated statistics for a prediction strategy."""
    strategy: str
    total_predictions: int
    verified_predictions: int
    direction_correct: int
    magnitude_correct: int
    
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
    
    def to_dict(self) -> dict:
        return {
            "strategy": self.strategy,
            "total_predictions": self.total_predictions,
            "verified_predictions": self.verified_predictions,
            "direction_correct": self.direction_correct,
            "direction_accuracy": round(self.direction_accuracy, 2),
            "magnitude_correct": self.magnitude_correct,
            "magnitude_accuracy": round(self.magnitude_accuracy, 2)
        }


# Database schema
SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    price_usd REAL NOT NULL,
    UNIQUE(asset, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_prices_asset_timestamp ON prices(asset, timestamp);

CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    asset TEXT NOT NULL,
    strategy TEXT NOT NULL,
    prediction_time TEXT NOT NULL,
    target_time TEXT NOT NULL,
    direction TEXT NOT NULL,
    magnitude TEXT NOT NULL,
    confidence REAL NOT NULL,
    price_at_prediction REAL NOT NULL,
    price_at_target REAL,
    actual_direction TEXT,
    actual_magnitude TEXT,
    direction_correct INTEGER,
    magnitude_correct INTEGER,
    verified_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_predictions_strategy ON predictions(strategy);
CREATE INDEX IF NOT EXISTS idx_predictions_target_time ON predictions(target_time);
CREATE INDEX IF NOT EXISTS idx_predictions_verified ON predictions(verified_at);
"""


class Database:
    """SQLite database wrapper for price and prediction storage."""
    
    def __init__(self, db_path: str = "market_predictions.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()
    
    def _init_schema(self):
        """Initialize database tables."""
        self.conn.executescript(SCHEMA_SQL)
        self.conn.commit()
    
    # Price operations
    
    def save_price(self, price: PricePoint):
        """Save a price point to the database."""
        self.conn.execute(
            """
            INSERT OR REPLACE INTO prices (asset, timestamp, price_usd)
            VALUES (?, ?, ?)
            """,
            (price.asset, price.timestamp.isoformat(), price.price_usd)
        )
        self.conn.commit()
    
    def save_prices(self, prices: list[PricePoint]):
        """Bulk save price points."""
        self.conn.executemany(
            """
            INSERT OR REPLACE INTO prices (asset, timestamp, price_usd)
            VALUES (?, ?, ?)
            """,
            [(p.asset, p.timestamp.isoformat(), p.price_usd) for p in prices]
        )
        self.conn.commit()
    
    def get_prices(self, asset: str, start: datetime, end: datetime) -> list[PricePoint]:
        """Get prices for an asset within a time range."""
        cursor = self.conn.execute(
            """
            SELECT asset, timestamp, price_usd FROM prices
            WHERE asset = ? AND timestamp >= ? AND timestamp <= ?
            ORDER BY timestamp ASC
            """,
            (asset, start.isoformat(), end.isoformat())
        )
        return [
            PricePoint(
                asset=row["asset"],
                timestamp=datetime.fromisoformat(row["timestamp"]),
                price_usd=row["price_usd"]
            )
            for row in cursor.fetchall()
        ]
    
    def get_latest_price(self, asset: str) -> Optional[PricePoint]:
        """Get the most recent price for an asset."""
        cursor = self.conn.execute(
            """
            SELECT asset, timestamp, price_usd FROM prices
            WHERE asset = ?
            ORDER BY timestamp DESC
            LIMIT 1
            """,
            (asset,)
        )
        row = cursor.fetchone()
        if row:
            return PricePoint(
                asset=row["asset"],
                timestamp=datetime.fromisoformat(row["timestamp"]),
                price_usd=row["price_usd"]
            )
        return None
    
    def get_price_at_time(self, asset: str, target_time: datetime, tolerance_hours: int = 1) -> Optional[PricePoint]:
        """Get price closest to a specific time within tolerance."""
        start = target_time - timedelta(hours=tolerance_hours)
        end = target_time + timedelta(hours=tolerance_hours)
        
        cursor = self.conn.execute(
            """
            SELECT asset, timestamp, price_usd,
                   ABS(julianday(timestamp) - julianday(?)) as time_diff
            FROM prices
            WHERE asset = ? AND timestamp >= ? AND timestamp <= ?
            ORDER BY time_diff ASC
            LIMIT 1
            """,
            (target_time.isoformat(), asset, start.isoformat(), end.isoformat())
        )
        row = cursor.fetchone()
        if row:
            return PricePoint(
                asset=row["asset"],
                timestamp=datetime.fromisoformat(row["timestamp"]),
                price_usd=row["price_usd"]
            )
        return None
    
    # Prediction operations
    
    def save_prediction(self, prediction: Prediction):
        """Save a prediction to the database."""
        self.conn.execute(
            """
            INSERT OR REPLACE INTO predictions 
            (id, asset, strategy, prediction_time, target_time, direction, magnitude,
             confidence, price_at_prediction, price_at_target, actual_direction,
             actual_magnitude, direction_correct, magnitude_correct, verified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                prediction.id,
                prediction.asset,
                prediction.strategy,
                prediction.prediction_time.isoformat(),
                prediction.target_time.isoformat(),
                prediction.direction.value,
                prediction.magnitude.value,
                prediction.confidence,
                prediction.price_at_prediction,
                prediction.price_at_target,
                prediction.actual_direction.value if prediction.actual_direction else None,
                prediction.actual_magnitude.value if prediction.actual_magnitude else None,
                1 if prediction.direction_correct else (0 if prediction.direction_correct is False else None),
                1 if prediction.magnitude_correct else (0 if prediction.magnitude_correct is False else None),
                prediction.verified_at.isoformat() if prediction.verified_at else None
            )
        )
        self.conn.commit()
    
    def get_unverified_predictions(self, before: datetime) -> list[Prediction]:
        """Get predictions that are due for verification."""
        cursor = self.conn.execute(
            """
            SELECT * FROM predictions
            WHERE verified_at IS NULL AND target_time <= ?
            ORDER BY target_time ASC
            """,
            (before.isoformat(),)
        )
        return [self._row_to_prediction(row) for row in cursor.fetchall()]
    
    def get_predictions_by_strategy(self, strategy: str, verified_only: bool = False) -> list[Prediction]:
        """Get all predictions for a strategy."""
        query = "SELECT * FROM predictions WHERE strategy = ?"
        if verified_only:
            query += " AND verified_at IS NOT NULL"
        query += " ORDER BY prediction_time DESC"
        
        cursor = self.conn.execute(query, (strategy,))
        return [self._row_to_prediction(row) for row in cursor.fetchall()]
    
    def get_strategy_stats(self) -> list[StrategyStats]:
        """Get aggregated statistics for all strategies."""
        cursor = self.conn.execute(
            """
            SELECT 
                strategy,
                COUNT(*) as total_predictions,
                SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) as verified_predictions,
                SUM(CASE WHEN direction_correct = 1 THEN 1 ELSE 0 END) as direction_correct,
                SUM(CASE WHEN magnitude_correct = 1 THEN 1 ELSE 0 END) as magnitude_correct
            FROM predictions
            GROUP BY strategy
            ORDER BY verified_predictions DESC
            """
        )
        return [
            StrategyStats(
                strategy=row["strategy"],
                total_predictions=row["total_predictions"],
                verified_predictions=row["verified_predictions"],
                direction_correct=row["direction_correct"] or 0,
                magnitude_correct=row["magnitude_correct"] or 0
            )
            for row in cursor.fetchall()
        ]
    
    def get_recent_predictions(self, limit: int = 20) -> list[Prediction]:
        """Get most recent predictions."""
        cursor = self.conn.execute(
            """
            SELECT * FROM predictions
            ORDER BY prediction_time DESC
            LIMIT ?
            """,
            (limit,)
        )
        return [self._row_to_prediction(row) for row in cursor.fetchall()]
    
    def _row_to_prediction(self, row: sqlite3.Row) -> Prediction:
        """Convert a database row to a Prediction object."""
        return Prediction(
            id=row["id"],
            asset=row["asset"],
            strategy=row["strategy"],
            prediction_time=datetime.fromisoformat(row["prediction_time"]),
            target_time=datetime.fromisoformat(row["target_time"]),
            direction=Direction(row["direction"]),
            magnitude=Magnitude(row["magnitude"]),
            confidence=row["confidence"],
            price_at_prediction=row["price_at_prediction"],
            price_at_target=row["price_at_target"],
            actual_direction=Direction(row["actual_direction"]) if row["actual_direction"] else None,
            actual_magnitude=Magnitude(row["actual_magnitude"]) if row["actual_magnitude"] else None,
            direction_correct=bool(row["direction_correct"]) if row["direction_correct"] is not None else None,
            magnitude_correct=bool(row["magnitude_correct"]) if row["magnitude_correct"] is not None else None,
            verified_at=datetime.fromisoformat(row["verified_at"]) if row["verified_at"] else None
        )
    
    def close(self):
        """Close the database connection."""
        self.conn.close()
