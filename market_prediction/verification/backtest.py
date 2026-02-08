"""
Backtesting Engine

Test prediction strategies against historical data.
This is critical - we can't wait for tomorrow to know if our
strategies have any merit.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any

from ..data.database import Database
from ..data.coingecko import CoinGeckoClient
from ..data.models import PriceHistory, Prediction, Direction, Magnitude, StrategyPerformance
from ..strategies.base import Strategy


class Backtester:
    """
    Backtest strategies against historical data.
    
    This allows us to test strategies before deploying them
    for live predictions.
    """
    
    def __init__(self, db: Database, client: CoinGeckoClient = None):
        self.db = db
        self.client = client or CoinGeckoClient()
    
    def fetch_and_store_history(self, asset: str, days: int = 90) -> int:
        """
        Fetch historical price data and store in database.
        
        Returns the number of price records saved.
        """
        prices = self.client.get_historical_prices(asset, days)
        
        if prices:
            self.db.save_prices(prices)
        
        return len(prices)
    
    def backtest_strategy(
        self,
        strategy: Strategy,
        asset: str,
        days: int = 30,
        prediction_interval_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Backtest a strategy against historical data.
        
        Args:
            strategy: The strategy to test
            asset: Asset to test on
            days: Number of days of history to test
            prediction_interval_hours: Hours between predictions
            
        Returns:
            Backtest results including accuracy metrics
        """
        # Get price history from database
        price_history = self.db.get_price_history(asset, days)
        
        if len(price_history) < 48:  # Need at least 48 data points
            # Try fetching if not enough data
            self.fetch_and_store_history(asset, days + 30)
            price_history = self.db.get_price_history(asset, days)
        
        if len(price_history) < 48:
            return {
                "error": "Not enough historical data",
                "data_points": len(price_history),
                "required": 48
            }
        
        # Run backtest
        predictions = []
        results = []
        
        # Need enough history for strategy (at least 21 days for SMA)
        min_history_points = 21
        
        for i in range(min_history_points, len(price_history) - 24):
            # Get history up to this point
            history_slice = price_history[:i]
            current_price = price_history[i].price_usd
            
            # Check if we have a price 24 hours later
            future_idx = i + 24  # Assuming hourly data
            if future_idx >= len(price_history):
                break
            
            future_price = price_history[future_idx].price_usd
            
            # Make prediction
            direction, magnitude, confidence = strategy.predict(
                asset, history_slice, current_price
            )
            
            # Create synthetic prediction
            pred = Prediction(
                asset=asset,
                strategy=strategy.name,
                prediction_time=price_history[i].timestamp,
                target_time=price_history[future_idx].timestamp,
                direction=direction,
                magnitude=magnitude,
                confidence=confidence,
                price_at_prediction=current_price,
            )
            
            # Verify against actual outcome
            pred.verify(future_price)
            
            predictions.append(pred)
            results.append({
                "prediction_time": pred.prediction_time.isoformat(),
                "predicted_direction": direction.value,
                "actual_direction": pred.actual_direction.value,
                "direction_correct": pred.direction_correct,
                "predicted_magnitude": magnitude.value,
                "actual_magnitude": pred.actual_magnitude.value,
                "magnitude_correct": pred.magnitude_correct,
                "confidence": confidence,
                "actual_change_pct": pred.percentage_change,
            })
        
        # Calculate aggregate metrics
        if not predictions:
            return {"error": "No predictions could be made", "predictions": 0}
        
        total = len(predictions)
        direction_correct = sum(1 for p in predictions if p.direction_correct)
        magnitude_correct = sum(1 for p in predictions if p.magnitude_correct)
        both_correct = sum(1 for p in predictions if p.direction_correct and p.magnitude_correct)
        
        return {
            "strategy": strategy.name,
            "asset": asset,
            "total_predictions": total,
            "direction_accuracy": (direction_correct / total) * 100,
            "magnitude_accuracy": (magnitude_correct / total) * 100,
            "overall_accuracy": (both_correct / total) * 100,
            "direction_correct": direction_correct,
            "magnitude_correct": magnitude_correct,
            "both_correct": both_correct,
            "sample_results": results[:10] if len(results) > 10 else results,  # First 10 for inspection
        }
    
    def backtest_all_strategies(
        self,
        strategies: List[Strategy],
        asset: str,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Backtest multiple strategies and return comparative results.
        """
        results = []
        
        for strategy in strategies:
            result = self.backtest_strategy(strategy, asset, days)
            results.append(result)
        
        # Sort by direction accuracy
        results.sort(key=lambda r: r.get("direction_accuracy", 0), reverse=True)
        
        return results
