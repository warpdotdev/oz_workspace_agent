"""
SQLite database for storing predictions and price history.

This provides persistent storage that's easy to inspect and query.
"""

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
from contextlib import contextmanager

from .models import Prediction, PriceHistory, Direction, Magnitude, StrategyPerformance


class Database:
    """SQLite database for the prediction engine."""
    
    def __init__(self, db_path: str = "market_predictions.db"):
        self.db_path = Path(db_path)
        self._init_db()
    
    @contextmanager
    def _get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()
    
    def _init_db(self):
        """Initialize database tables."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Price history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id TEXT PRIMARY KEY,
                    asset TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    price_usd REAL NOT NULL,
                    volume_24h REAL,
                    market_cap REAL,
                    UNIQUE(asset, timestamp)
                )
            """)
            
            # Predictions table
            cursor.execute("""
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
                    verified_at TEXT,
                    direction_correct INTEGER,
                    magnitude_correct INTEGER,
                    percentage_change REAL
                )
            """)
            
            # Create indexes for common queries
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_predictions_asset ON predictions(asset)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_predictions_strategy ON predictions(strategy)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_predictions_target_time ON predictions(target_time)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_price_history_asset_timestamp ON price_history(asset, timestamp)")
    
    # Price History Methods
    
    def save_price(self, price: PriceHistory) -> None:
        """Save a price history record."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO price_history 
                (id, asset, timestamp, price_usd, volume_24h, market_cap)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                price.id,
                price.asset,
                price.timestamp.isoformat(),
                price.price_usd,
                price.volume_24h,
                price.market_cap,
            ))
    
    def save_prices(self, prices: List[PriceHistory]) -> None:
        """Bulk save price history records."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT OR REPLACE INTO price_history 
                (id, asset, timestamp, price_usd, volume_24h, market_cap)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                (p.id, p.asset, p.timestamp.isoformat(), p.price_usd, p.volume_24h, p.market_cap)
                for p in prices
            ])
    
    def get_latest_price(self, asset: str) -> Optional[PriceHistory]:
        """Get the most recent price for an asset."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM price_history 
                WHERE asset = ? 
                ORDER BY timestamp DESC 
                LIMIT 1
            """, (asset,))
            row = cursor.fetchone()
            if row:
                return PriceHistory.from_dict(dict(row))
        return None
    
    def get_price_at_time(self, asset: str, target_time: datetime, tolerance_minutes: int = 60) -> Optional[PriceHistory]:
        """Get price closest to a specific time within tolerance."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            min_time = (target_time - timedelta(minutes=tolerance_minutes)).isoformat()
            max_time = (target_time + timedelta(minutes=tolerance_minutes)).isoformat()
            
            cursor.execute("""
                SELECT * FROM price_history 
                WHERE asset = ? AND timestamp BETWEEN ? AND ?
                ORDER BY ABS(julianday(timestamp) - julianday(?))
                LIMIT 1
            """, (asset, min_time, max_time, target_time.isoformat()))
            row = cursor.fetchone()
            if row:
                return PriceHistory.from_dict(dict(row))
        return None
    
    def get_price_history(self, asset: str, days: int = 30) -> List[PriceHistory]:
        """Get price history for the last N days."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            since = (datetime.utcnow() - timedelta(days=days)).isoformat()
            cursor.execute("""
                SELECT * FROM price_history 
                WHERE asset = ? AND timestamp >= ?
                ORDER BY timestamp ASC
            """, (asset, since))
            return [PriceHistory.from_dict(dict(row)) for row in cursor.fetchall()]
    
    # Prediction Methods
    
    def save_prediction(self, prediction: Prediction) -> None:
        """Save a prediction."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO predictions 
                (id, asset, strategy, prediction_time, target_time, direction, magnitude, 
                 confidence, price_at_prediction, price_at_target, actual_direction, 
                 actual_magnitude, verified_at, direction_correct, magnitude_correct, percentage_change)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
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
                prediction.verified_at.isoformat() if prediction.verified_at else None,
                1 if prediction.direction_correct else (0 if prediction.direction_correct is False else None),
                1 if prediction.magnitude_correct else (0 if prediction.magnitude_correct is False else None),
                prediction.percentage_change,
            ))
    
    def get_prediction(self, prediction_id: str) -> Optional[Prediction]:
        """Get a specific prediction by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM predictions WHERE id = ?", (prediction_id,))
            row = cursor.fetchone()
            if row:
                return self._row_to_prediction(dict(row))
        return None
    
    def get_pending_verifications(self) -> List[Prediction]:
        """Get predictions that are due for verification (target_time has passed, not yet verified)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.utcnow().isoformat()
            cursor.execute("""
                SELECT * FROM predictions 
                WHERE verified_at IS NULL AND target_time <= ?
                ORDER BY target_time ASC
            """, (now,))
            return [self._row_to_prediction(dict(row)) for row in cursor.fetchall()]
    
    def get_predictions_by_strategy(self, strategy: str, limit: int = 100) -> List[Prediction]:
        """Get predictions for a specific strategy."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM predictions 
                WHERE strategy = ?
                ORDER BY prediction_time DESC
                LIMIT ?
            """, (strategy, limit))
            return [self._row_to_prediction(dict(row)) for row in cursor.fetchall()]
    
    def get_predictions_by_asset(self, asset: str, limit: int = 100) -> List[Prediction]:
        """Get predictions for a specific asset."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM predictions 
                WHERE asset = ?
                ORDER BY prediction_time DESC
                LIMIT ?
            """, (asset, limit))
            return [self._row_to_prediction(dict(row)) for row in cursor.fetchall()]
    
    def get_recent_predictions(self, limit: int = 50) -> List[Prediction]:
        """Get most recent predictions."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM predictions 
                ORDER BY prediction_time DESC
                LIMIT ?
            """, (limit,))
            return [self._row_to_prediction(dict(row)) for row in cursor.fetchall()]
    
    def get_strategy_performance(self, strategy: Optional[str] = None) -> List[StrategyPerformance]:
        """Get performance metrics for strategies."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            if strategy:
                cursor.execute("""
                    SELECT 
                        strategy,
                        COUNT(*) as total_predictions,
                        SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) as verified_predictions,
                        SUM(CASE WHEN direction_correct = 1 THEN 1 ELSE 0 END) as direction_correct,
                        SUM(CASE WHEN magnitude_correct = 1 THEN 1 ELSE 0 END) as magnitude_correct,
                        SUM(CASE WHEN direction_correct = 1 AND magnitude_correct = 1 THEN 1 ELSE 0 END) as both_correct
                    FROM predictions
                    WHERE strategy = ?
                    GROUP BY strategy
                """, (strategy,))
            else:
                cursor.execute("""
                    SELECT 
                        strategy,
                        COUNT(*) as total_predictions,
                        SUM(CASE WHEN verified_at IS NOT NULL THEN 1 ELSE 0 END) as verified_predictions,
                        SUM(CASE WHEN direction_correct = 1 THEN 1 ELSE 0 END) as direction_correct,
                        SUM(CASE WHEN magnitude_correct = 1 THEN 1 ELSE 0 END) as magnitude_correct,
                        SUM(CASE WHEN direction_correct = 1 AND magnitude_correct = 1 THEN 1 ELSE 0 END) as both_correct
                    FROM predictions
                    GROUP BY strategy
                    ORDER BY verified_predictions DESC
                """)
            
            results = []
            for row in cursor.fetchall():
                results.append(StrategyPerformance(
                    strategy=row["strategy"],
                    total_predictions=row["total_predictions"],
                    verified_predictions=row["verified_predictions"] or 0,
                    direction_correct=row["direction_correct"] or 0,
                    magnitude_correct=row["magnitude_correct"] or 0,
                    both_correct=row["both_correct"] or 0,
                ))
            return results
    
    def _row_to_prediction(self, row: dict) -> Prediction:
        """Convert a database row to a Prediction object."""
        return Prediction.from_dict({
            "id": row["id"],
            "asset": row["asset"],
            "strategy": row["strategy"],
            "prediction_time": row["prediction_time"],
            "target_time": row["target_time"],
            "direction": row["direction"],
            "magnitude": row["magnitude"],
            "confidence": row["confidence"],
            "price_at_prediction": row["price_at_prediction"],
            "price_at_target": row["price_at_target"],
            "actual_direction": row["actual_direction"],
            "actual_magnitude": row["actual_magnitude"],
            "verified_at": row["verified_at"],
            "direction_correct": bool(row["direction_correct"]) if row["direction_correct"] is not None else None,
            "magnitude_correct": bool(row["magnitude_correct"]) if row["magnitude_correct"] is not None else None,
            "percentage_change": row["percentage_change"],
        })
