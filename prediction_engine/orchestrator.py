#!/usr/bin/env python3
"""
Prediction Orchestrator

Coordinates the prediction cycle:
1. Fetches current market data
2. Runs all strategies
3. Stores predictions in database
4. Provides access to prediction results
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional

sys.path.insert(0, str(Path(__file__).parent))

from data.models import (
    init_db, get_session, Prediction, StrategyStats, 
    Direction, Magnitude
)
from data.coingecko_client import get_client, CoinGeckoClient
from strategies import get_all_strategies, PredictionStrategy, PredictionResult


class PredictionOrchestrator:
    """
    Orchestrates the prediction cycle across all strategies.
    """
    
    # Default coins to track
    DEFAULT_SYMBOLS = ["bitcoin", "ethereum", "solana"]
    
    def __init__(self, symbols: List[str] = None):
        self.symbols = symbols or self.DEFAULT_SYMBOLS
        self.client = get_client()
        self.strategies = get_all_strategies()
        
        # Ensure database is initialized
        init_db()
    
    def run_prediction_cycle(self, symbols: List[str] = None) -> Dict[str, List[Prediction]]:
        """
        Run a full prediction cycle for all strategies and symbols.
        
        Returns:
            Dict mapping symbol to list of predictions made
        """
        symbols = symbols or self.symbols
        all_predictions = {}
        
        session = get_session()
        
        try:
            for symbol in symbols:
                print(f"\n📊 Processing {symbol}...")
                predictions = self._make_predictions_for_symbol(symbol, session)
                all_predictions[symbol] = predictions
                
            session.commit()
            print(f"\n✅ Prediction cycle complete! Made {sum(len(p) for p in all_predictions.values())} predictions.")
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error during prediction cycle: {e}")
            raise
        finally:
            session.close()
        
        return all_predictions
    
    def _make_predictions_for_symbol(
        self, 
        symbol: str, 
        session
    ) -> List[Prediction]:
        """Make predictions from all strategies for a single symbol."""
        predictions = []
        
        # Get current price
        price_data = self.client.get_current_price(symbol)
        if not price_data:
            print(f"  ⚠️ Could not fetch price for {symbol}")
            return predictions
        
        current_price = price_data.price_usd
        print(f"  Current price: ${current_price:,.2f}")
        
        # Get historical prices (30 days for SMA calculations)
        historical = self.client.get_historical_prices(symbol, days=30)
        if len(historical) < 10:
            print(f"  ⚠️ Insufficient historical data for {symbol}")
            return predictions
        
        # Target time is 24 hours from now
        target_time = datetime.utcnow() + timedelta(days=1)
        
        # Run each strategy
        for strategy in self.strategies:
            try:
                result = strategy.predict(
                    symbol=symbol,
                    current_price=current_price,
                    historical_prices=historical
                )
                
                if result:
                    # Create and store prediction
                    prediction = Prediction(
                        strategy_name=strategy.name,
                        symbol=symbol,
                        predicted_direction=result.direction,
                        predicted_magnitude=result.magnitude,
                        confidence=result.confidence,
                        price_at_prediction=current_price,
                        target_time=target_time
                    )
                    session.add(prediction)
                    predictions.append(prediction)
                    
                    # Update strategy stats
                    self._update_strategy_stats(strategy, session)
                    
                    print(f"  [{strategy.name}] {result.direction.value} {result.magnitude.value} @ {result.confidence:.0%}")
                    if result.reasoning:
                        print(f"    └─ {result.reasoning}")
                        
            except Exception as e:
                print(f"  ⚠️ Strategy {strategy.name} failed: {e}")
        
        return predictions
    
    def _update_strategy_stats(self, strategy: PredictionStrategy, session):
        """Update or create strategy statistics."""
        stats = session.query(StrategyStats).filter_by(name=strategy.name).first()
        
        if not stats:
            stats = StrategyStats(
                name=strategy.name,
                description=strategy.description,
                total_predictions=0,
                verified_predictions=0,
                correct_direction=0,
                correct_magnitude=0
            )
            session.add(stats)
            session.flush()  # Ensure defaults are set
        
        stats.total_predictions = (stats.total_predictions or 0) + 1
        stats.last_prediction_at = datetime.utcnow()
    
    def get_latest_predictions(self, symbol: str = None) -> List[Prediction]:
        """Get the most recent predictions, optionally filtered by symbol."""
        session = get_session()
        try:
            query = session.query(Prediction).order_by(Prediction.prediction_time.desc())
            
            if symbol:
                query = query.filter(Prediction.symbol == symbol)
            
            # Get predictions from the last prediction cycle (last 24 hours)
            cutoff = datetime.utcnow() - timedelta(days=1)
            query = query.filter(Prediction.prediction_time > cutoff)
            
            return query.all()
        finally:
            session.close()
    
    def get_pending_verifications(self) -> List[Prediction]:
        """Get predictions that are due for verification (target time has passed)."""
        session = get_session()
        try:
            now = datetime.utcnow()
            return session.query(Prediction)\
                .filter(Prediction.target_time <= now)\
                .filter(Prediction.outcome == None)\
                .order_by(Prediction.target_time.asc())\
                .all()
        finally:
            session.close()
    
    def get_strategy_leaderboard(self) -> List[StrategyStats]:
        """Get strategy statistics ordered by accuracy."""
        session = get_session()
        try:
            return session.query(StrategyStats)\
                .filter(StrategyStats.verified_predictions > 0)\
                .order_by(StrategyStats.direction_accuracy.desc())\
                .all()
        finally:
            session.close()


def run_daily_predictions():
    """Convenience function to run the daily prediction cycle."""
    orchestrator = PredictionOrchestrator()
    return orchestrator.run_prediction_cycle()


if __name__ == "__main__":
    print("🚀 Market Prediction Engine - Running prediction cycle...")
    print("=" * 60)
    run_daily_predictions()
