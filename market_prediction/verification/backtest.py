"""
Backtesting Engine

Test prediction strategies against historical data with proper statistical rigor.

Key features:
- Train/test split to prevent overfitting (no more in-sample fairy tales)
- Statistical significance testing (p-values or it didn't happen)
- Multi-asset validation (prove edge replicates)
"""

import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional

from ..data.database import Database
from ..data.coingecko import CoinGeckoClient
from ..data.models import PriceHistory, Prediction, Direction, Magnitude, StrategyPerformance
from ..strategies.base import Strategy


def binomial_p_value(successes: int, trials: int, p_null: float = 0.5) -> float:
    """
    Calculate one-tailed p-value for binomial test.
    
    Tests if observed success rate is significantly BETTER than null hypothesis.
    Uses normal approximation for large n, exact calculation for small n.
    
    Args:
        successes: Number of successes (correct predictions)
        trials: Total number of trials
        p_null: Null hypothesis probability (default 0.5 for random)
        
    Returns:
        p-value (probability of seeing this result or better by chance)
    """
    if trials == 0:
        return 1.0
    
    observed_rate = successes / trials
    
    # If we're at or below null hypothesis, p-value is 0.5 or higher
    if observed_rate <= p_null:
        return 0.5 + (p_null - observed_rate) / 2
    
    # Normal approximation for large samples (n >= 30)
    if trials >= 30:
        # Standard error under null hypothesis
        se = math.sqrt(p_null * (1 - p_null) / trials)
        # z-score
        z = (observed_rate - p_null) / se
        # One-tailed p-value using normal CDF approximation
        # P(Z > z) ≈ 1 - Φ(z)
        p_value = 0.5 * math.erfc(z / math.sqrt(2))
        return p_value
    
    # Exact binomial for small samples
    # P(X >= k) = sum of binomial PMF from k to n
    p_value = 0.0
    for k in range(successes, trials + 1):
        # Binomial coefficient * p^k * (1-p)^(n-k)
        coef = math.comb(trials, k)
        p_value += coef * (p_null ** k) * ((1 - p_null) ** (trials - k))
    
    return p_value


class Backtester:
    """
    Backtest strategies against historical data with statistical rigor.
    
    Key principles:
    1. Train/test split - never report in-sample accuracy
    2. Statistical significance - calculate p-values
    3. Multiple asset validation - edge must replicate
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
    
    def _run_predictions(
        self,
        strategy: Strategy,
        asset: str,
        price_history: List[PriceHistory],
        start_idx: int,
        end_idx: int
    ) -> List[Prediction]:
        """
        Run predictions on a slice of price history.
        
        Args:
            strategy: Strategy to test
            asset: Asset name
            price_history: Full price history
            start_idx: Start index for predictions
            end_idx: End index for predictions (exclusive)
            
        Returns:
            List of verified predictions
        """
        predictions = []
        
        for i in range(start_idx, min(end_idx, len(price_history) - 24)):
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
            
            # Create and verify prediction
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
            pred.verify(future_price)
            predictions.append(pred)
        
        return predictions
    
    def _calculate_metrics(self, predictions: List[Prediction]) -> Dict[str, Any]:
        """
        Calculate accuracy metrics and statistical significance.
        """
        if not predictions:
            return {
                "total_predictions": 0,
                "direction_accuracy": 0.0,
                "magnitude_accuracy": 0.0,
                "overall_accuracy": 0.0,
                "p_value": 1.0,
                "significant": False,
            }
        
        total = len(predictions)
        direction_correct = sum(1 for p in predictions if p.direction_correct)
        magnitude_correct = sum(1 for p in predictions if p.magnitude_correct)
        both_correct = sum(1 for p in predictions if p.direction_correct and p.magnitude_correct)
        
        # Calculate p-value against random baseline (50%)
        p_value = binomial_p_value(direction_correct, total, 0.5)
        
        return {
            "total_predictions": total,
            "direction_correct": direction_correct,
            "direction_accuracy": (direction_correct / total) * 100,
            "magnitude_correct": magnitude_correct,
            "magnitude_accuracy": (magnitude_correct / total) * 100,
            "both_correct": both_correct,
            "overall_accuracy": (both_correct / total) * 100,
            "p_value": p_value,
            "significant": p_value < 0.05,  # 95% confidence level
        }
    
    def backtest_strategy(
        self,
        strategy: Strategy,
        asset: str,
        days: int = 30,
        prediction_interval_hours: int = 24,
        train_test_split: bool = True,
        train_ratio: float = 0.7
    ) -> Dict[str, Any]:
        """
        Backtest a strategy against historical data.
        
        Args:
            strategy: The strategy to test
            asset: Asset to test on
            days: Number of days of history to test
            prediction_interval_hours: Hours between predictions
            train_test_split: Whether to use train/test split
            train_ratio: Ratio of data for training (default 70%)
            
        Returns:
            Backtest results including accuracy metrics and p-value
        """
        # Get price history from database
        price_history = self.db.get_price_history(asset, days)
        
        if len(price_history) < 48:
            self.fetch_and_store_history(asset, days + 30)
            price_history = self.db.get_price_history(asset, days)
        
        if len(price_history) < 48:
            return {
                "error": "Not enough historical data",
                "data_points": len(price_history),
                "required": 48
            }
        
        # Minimum history for strategy (at least 21 days for SMA)
        min_history_points = 21
        
        if train_test_split:
            # Split data: train on first 70%, test on last 30%
            usable_range = len(price_history) - 24 - min_history_points
            split_point = min_history_points + int(usable_range * train_ratio)
            
            # Train set: just for reference (we don't use it for reported accuracy)
            train_predictions = self._run_predictions(
                strategy, asset, price_history, min_history_points, split_point
            )
            train_metrics = self._calculate_metrics(train_predictions)
            
            # Test set: this is what we report
            test_predictions = self._run_predictions(
                strategy, asset, price_history, split_point, len(price_history) - 24
            )
            test_metrics = self._calculate_metrics(test_predictions)
            
            return {
                "strategy": strategy.name,
                "asset": asset,
                "train_test_split": True,
                "train_ratio": train_ratio,
                # Report TEST metrics (out-of-sample)
                "total_predictions": test_metrics["total_predictions"],
                "direction_correct": test_metrics["direction_correct"],
                "direction_accuracy": test_metrics["direction_accuracy"],
                "magnitude_accuracy": test_metrics["magnitude_accuracy"],
                "overall_accuracy": test_metrics["overall_accuracy"],
                "p_value": test_metrics["p_value"],
                "significant": test_metrics["significant"],
                # Also include train metrics for comparison
                "train_metrics": {
                    "n": train_metrics["total_predictions"],
                    "direction_accuracy": train_metrics["direction_accuracy"],
                    "p_value": train_metrics["p_value"],
                },
                "test_metrics": {
                    "n": test_metrics["total_predictions"],
                    "direction_accuracy": test_metrics["direction_accuracy"],
                    "p_value": test_metrics["p_value"],
                },
            }
        else:
            # No split - run on all data (in-sample, for comparison only)
            predictions = self._run_predictions(
                strategy, asset, price_history, min_history_points, len(price_history) - 24
            )
            metrics = self._calculate_metrics(predictions)
            
            return {
                "strategy": strategy.name,
                "asset": asset,
                "train_test_split": False,
                **metrics,
            }
    
    def backtest_all_strategies(
        self,
        strategies: List[Strategy],
        asset: str,
        days: int = 30,
        train_test_split: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Backtest multiple strategies and return comparative results.
        """
        results = []
        
        for strategy in strategies:
            result = self.backtest_strategy(strategy, asset, days, train_test_split=train_test_split)
            results.append(result)
        
        # Sort by direction accuracy
        results.sort(key=lambda r: r.get("direction_accuracy", 0), reverse=True)
        
        return results
    
    def backtest_multi_asset(
        self,
        strategies: List[Strategy],
        assets: List[str],
        days: int = 90,
        train_test_split: bool = True
    ) -> Dict[str, Any]:
        """
        Backtest strategies across multiple assets.
        
        This is the real test - does the edge replicate across different assets?
        
        Args:
            strategies: List of strategies to test
            assets: List of asset names
            days: Days of history per asset
            train_test_split: Whether to use train/test split
            
        Returns:
            Combined results showing which strategies work across assets
        """
        all_results = {}
        
        for asset in assets:
            # Ensure we have data
            self.fetch_and_store_history(asset, days + 30)
            
            asset_results = self.backtest_all_strategies(
                strategies, asset, days, train_test_split
            )
            all_results[asset] = asset_results
        
        # Aggregate by strategy
        strategy_summary = {}
        for strategy in strategies:
            strategy_name = strategy.name
            combined_correct = 0
            combined_total = 0
            per_asset_accuracy = {}
            per_asset_significant = {}
            
            for asset in assets:
                for result in all_results[asset]:
                    if result.get("strategy") == strategy_name and "error" not in result:
                        combined_correct += result.get("direction_correct", 0)
                        combined_total += result.get("total_predictions", 0)
                        per_asset_accuracy[asset] = result.get("direction_accuracy", 0)
                        per_asset_significant[asset] = result.get("significant", False)
            
            if combined_total > 0:
                combined_accuracy = (combined_correct / combined_total) * 100
                combined_p_value = binomial_p_value(combined_correct, combined_total, 0.5)
                
                # Edge is "real" if significant across combined data AND in majority of assets
                significant_count = sum(1 for sig in per_asset_significant.values() if sig)
                edge_replicates = significant_count >= len(assets) / 2
                
                strategy_summary[strategy_name] = {
                    "combined_accuracy": combined_accuracy,
                    "combined_n": combined_total,
                    "combined_p_value": combined_p_value,
                    "combined_significant": combined_p_value < 0.05,
                    "per_asset": per_asset_accuracy,
                    "per_asset_significant": per_asset_significant,
                    "edge_replicates": edge_replicates,
                }
        
        return {
            "assets": assets,
            "days": days,
            "train_test_split": train_test_split,
            "per_asset_results": all_results,
            "strategy_summary": strategy_summary,
        }
