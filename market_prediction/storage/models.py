#!/usr/bin/env python3
"""
Market Prediction Engine - Database Models

SQLite-based storage for:
- Price history (raw market data)
- Predictions (what strategies predicted)
- Verification results (how predictions performed)
- Strategy performance (aggregate accuracy metrics)
"""

import sqlite3
from dataclasses import dataclass
from datetime import datetime, date
from enum import Enum
from typing import Optional, List
from pathlib import Path


class Direction(Enum):
    UP = "up"
    DOWN = "down"
    NEUTRAL = "neutral"


class MagnitudeBucket(Enum):
    """Price movement magnitude buckets"""
    SMALL = "0-2%"      # 0-2% change
    MEDIUM = "2-5%"     # 2-5% change  
    LARGE = "5%+"       # 5%+ change


@dataclass
class PriceRecord:
    """A single price data point"""
    id: Optional[int]
    symbol: str           # e.g., "bitcoin", "ethereum"
    timestamp: datetime
    price_usd: float
    volume_24h: Optional[float] = None
    market_cap: Optional[float] = None
    
    def to_tuple(self):
        return (self.symbol, self.timestamp.isoformat(), self.price_usd, 
                self.volume_24h, self.market_cap)


@dataclass  
class Prediction:
    """A prediction made by a strategy"""
    id: Optional[int]
    strategy_name: str
    symbol: str
    prediction_date: date      # When the prediction was made
    target_date: date          # What date we're predicting for
    direction: Direction
    magnitude: MagnitudeBucket
    confidence: float          # 0.0 - 1.0
    price_at_prediction: float
    predicted_price: Optional[float] = None  # Optional specific price target
    created_at: Optional[datetime] = None
    
    def to_tuple(self):
        return (
            self.strategy_name, self.symbol, 
            self.prediction_date.isoformat(), self.target_date.isoformat(),
            self.direction.value, self.magnitude.value, self.confidence,
            self.price_at_prediction, self.predicted_price,
            (self.created_at or datetime.utcnow()).isoformat()
        )


@dataclass
class VerificationResult:
    """Result of verifying a prediction against actual outcome"""
    id: Optional[int]
    prediction_id: int
    actual_price: float
    actual_direction: Direction
    actual_magnitude: MagnitudeBucket
    direction_correct: bool
    magnitude_correct: bool
    price_change_pct: float
    verified_at: datetime
    
    def to_tuple(self):
        return (
            self.prediction_id, self.actual_price,
            self.actual_direction.value, self.actual_magnitude.value,
            self.direction_correct, self.magnitude_correct,
            self.price_change_pct, self.verified_at.isoformat()
        )


@dataclass
class StrategyPerformance:
    """Aggregate performance metrics for a strategy"""
    strategy_name: str
    symbol: str
    total_predictions: int
    direction_accuracy: float     # % of direction predictions correct
    magnitude_accuracy: float     # % of magnitude predictions correct
    avg_confidence: float
    confidence_calibration: float # How well confidence correlates with accuracy
    last_updated: datetime


class Database:
    """SQLite database manager for market predictions"""
    
    def __init__(self, db_path: str = "market_predictions.db"):
        self.db_path = Path(db_path)
        self.conn = None
        self._init_db()
    
    def _init_db(self):
        """Initialize database schema"""
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        
        self.conn.executescript("""
            -- Price history table
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                price_usd REAL NOT NULL,
                volume_24h REAL,
                market_cap REAL,
                UNIQUE(symbol, timestamp)
            );
            
            -- Predictions table
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                strategy_name TEXT NOT NULL,
                symbol TEXT NOT NULL,
                prediction_date TEXT NOT NULL,
                target_date TEXT NOT NULL,
                direction TEXT NOT NULL,
                magnitude TEXT NOT NULL,
                confidence REAL NOT NULL,
                price_at_prediction REAL NOT NULL,
                predicted_price REAL,
                created_at TEXT NOT NULL,
                UNIQUE(strategy_name, symbol, prediction_date, target_date)
            );
            
            -- Verification results table
            CREATE TABLE IF NOT EXISTS verification_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id INTEGER NOT NULL,
                actual_price REAL NOT NULL,
                actual_direction TEXT NOT NULL,
                actual_magnitude TEXT NOT NULL,
                direction_correct INTEGER NOT NULL,
                magnitude_correct INTEGER NOT NULL,
                price_change_pct REAL NOT NULL,
                verified_at TEXT NOT NULL,
                FOREIGN KEY (prediction_id) REFERENCES predictions(id),
                UNIQUE(prediction_id)
            );
            
            -- Indexes for common queries
            CREATE INDEX IF NOT EXISTS idx_prices_symbol_time ON price_history(symbol, timestamp);
            CREATE INDEX IF NOT EXISTS idx_predictions_strategy ON predictions(strategy_name);
            CREATE INDEX IF NOT EXISTS idx_predictions_target ON predictions(target_date);
        """)
        self.conn.commit()
    
    def close(self):
        if self.conn:
            self.conn.close()
    
    # Price history methods
    def insert_price(self, record: PriceRecord) -> int:
        """Insert a price record, returns the id"""
        cursor = self.conn.execute("""
            INSERT OR REPLACE INTO price_history 
            (symbol, timestamp, price_usd, volume_24h, market_cap)
            VALUES (?, ?, ?, ?, ?)
        """, record.to_tuple())
        self.conn.commit()
        return cursor.lastrowid
    
    def get_prices(self, symbol: str, start: datetime, end: datetime) -> List[PriceRecord]:
        """Get price history for a symbol in a time range"""
        cursor = self.conn.execute("""
            SELECT * FROM price_history 
            WHERE symbol = ? AND timestamp >= ? AND timestamp <= ?
            ORDER BY timestamp ASC
        """, (symbol, start.isoformat(), end.isoformat()))
        
        return [
            PriceRecord(
                id=row['id'],
                symbol=row['symbol'],
                timestamp=datetime.fromisoformat(row['timestamp']),
                price_usd=row['price_usd'],
                volume_24h=row['volume_24h'],
                market_cap=row['market_cap']
            )
            for row in cursor.fetchall()
        ]
    
    def get_latest_price(self, symbol: str) -> Optional[PriceRecord]:
        """Get the most recent price for a symbol"""
        cursor = self.conn.execute("""
            SELECT * FROM price_history 
            WHERE symbol = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (symbol,))
        row = cursor.fetchone()
        if row:
            return PriceRecord(
                id=row['id'],
                symbol=row['symbol'],
                timestamp=datetime.fromisoformat(row['timestamp']),
                price_usd=row['price_usd'],
                volume_24h=row['volume_24h'],
                market_cap=row['market_cap']
            )
        return None
    
    # Prediction methods
    def insert_prediction(self, prediction: Prediction) -> int:
        """Insert a prediction, returns the id"""
        cursor = self.conn.execute("""
            INSERT OR REPLACE INTO predictions
            (strategy_name, symbol, prediction_date, target_date, direction,
             magnitude, confidence, price_at_prediction, predicted_price, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, prediction.to_tuple())
        self.conn.commit()
        return cursor.lastrowid
    
    def get_predictions_for_date(self, target_date: date) -> List[Prediction]:
        """Get all predictions for a specific target date"""
        cursor = self.conn.execute("""
            SELECT * FROM predictions WHERE target_date = ?
        """, (target_date.isoformat(),))
        
        return [self._row_to_prediction(row) for row in cursor.fetchall()]
    
    def get_unverified_predictions(self) -> List[Prediction]:
        """Get predictions that haven't been verified yet"""
        cursor = self.conn.execute("""
            SELECT p.* FROM predictions p
            LEFT JOIN verification_results v ON p.id = v.prediction_id
            WHERE v.id IS NULL AND p.target_date < date('now')
        """)
        return [self._row_to_prediction(row) for row in cursor.fetchall()]
    
    def get_strategy_predictions(self, strategy_name: str, 
                                  limit: int = 100) -> List[Prediction]:
        """Get recent predictions for a specific strategy"""
        cursor = self.conn.execute("""
            SELECT * FROM predictions 
            WHERE strategy_name = ?
            ORDER BY created_at DESC
            LIMIT ?
        """, (strategy_name, limit))
        return [self._row_to_prediction(row) for row in cursor.fetchall()]
    
    def _row_to_prediction(self, row) -> Prediction:
        return Prediction(
            id=row['id'],
            strategy_name=row['strategy_name'],
            symbol=row['symbol'],
            prediction_date=date.fromisoformat(row['prediction_date']),
            target_date=date.fromisoformat(row['target_date']),
            direction=Direction(row['direction']),
            magnitude=MagnitudeBucket(row['magnitude']),
            confidence=row['confidence'],
            price_at_prediction=row['price_at_prediction'],
            predicted_price=row['predicted_price'],
            created_at=datetime.fromisoformat(row['created_at'])
        )
    
    # Verification methods
    def insert_verification(self, result: VerificationResult) -> int:
        """Insert a verification result"""
        cursor = self.conn.execute("""
            INSERT OR REPLACE INTO verification_results
            (prediction_id, actual_price, actual_direction, actual_magnitude,
             direction_correct, magnitude_correct, price_change_pct, verified_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, result.to_tuple())
        self.conn.commit()
        return cursor.lastrowid
    
    def get_strategy_performance(self, strategy_name: str, 
                                  symbol: Optional[str] = None) -> StrategyPerformance:
        """Calculate aggregate performance for a strategy"""
        query = """
            SELECT 
                p.strategy_name,
                p.symbol,
                COUNT(*) as total,
                AVG(CASE WHEN v.direction_correct THEN 1.0 ELSE 0.0 END) as dir_acc,
                AVG(CASE WHEN v.magnitude_correct THEN 1.0 ELSE 0.0 END) as mag_acc,
                AVG(p.confidence) as avg_conf
            FROM predictions p
            JOIN verification_results v ON p.id = v.prediction_id
            WHERE p.strategy_name = ?
        """
        params = [strategy_name]
        
        if symbol:
            query += " AND p.symbol = ?"
            params.append(symbol)
        
        query += " GROUP BY p.strategy_name"
        if symbol:
            query += ", p.symbol"
        
        cursor = self.conn.execute(query, params)
        row = cursor.fetchone()
        
        if not row or row['total'] == 0:
            return StrategyPerformance(
                strategy_name=strategy_name,
                symbol=symbol or "all",
                total_predictions=0,
                direction_accuracy=0.0,
                magnitude_accuracy=0.0,
                avg_confidence=0.0,
                confidence_calibration=0.0,
                last_updated=datetime.utcnow()
            )
        
        return StrategyPerformance(
            strategy_name=row['strategy_name'],
            symbol=row['symbol'] if symbol else "all",
            total_predictions=row['total'],
            direction_accuracy=row['dir_acc'],
            magnitude_accuracy=row['mag_acc'],
            avg_confidence=row['avg_conf'],
            confidence_calibration=0.0,  # TODO: Calculate correlation
            last_updated=datetime.utcnow()
        )
    
    def get_all_strategies_performance(self) -> List[StrategyPerformance]:
        """Get performance for all strategies"""
        cursor = self.conn.execute("""
            SELECT DISTINCT strategy_name FROM predictions
        """)
        strategies = [row['strategy_name'] for row in cursor.fetchall()]
        return [self.get_strategy_performance(s) for s in strategies]
    
    def get_recent_predictions_with_results(self, limit: int = 50) -> List[dict]:
        """Get recent predictions with their verification results"""
        cursor = self.conn.execute("""
            SELECT 
                p.*,
                v.actual_price,
                v.actual_direction,
                v.actual_magnitude,
                v.direction_correct,
                v.magnitude_correct,
                v.price_change_pct,
                v.verified_at
            FROM predictions p
            LEFT JOIN verification_results v ON p.id = v.prediction_id
            ORDER BY p.target_date DESC, p.strategy_name
            LIMIT ?
        """, (limit,))
        
        results = []
        for row in cursor.fetchall():
            pred = self._row_to_prediction(row)
            result = {
                'prediction': pred,
                'verified': row['actual_price'] is not None,
                'actual_price': row['actual_price'],
                'actual_direction': Direction(row['actual_direction']) if row['actual_direction'] else None,
                'actual_magnitude': MagnitudeBucket(row['actual_magnitude']) if row['actual_magnitude'] else None,
                'direction_correct': bool(row['direction_correct']) if row['direction_correct'] is not None else None,
                'magnitude_correct': bool(row['magnitude_correct']) if row['magnitude_correct'] is not None else None,
                'price_change_pct': row['price_change_pct']
            }
            results.append(result)
        
        return results
