#!/usr/bin/env python3
"""
CoinGecko API Client

Fetches crypto prices and historical data from CoinGecko's free API.
No API key required for basic usage!
"""

import requests
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from dataclasses import dataclass


BASE_URL = "https://api.coingecko.com/api/v3"

# Rate limiting: CoinGecko free tier allows ~10-30 calls/minute
RATE_LIMIT_DELAY = 2.0  # seconds between calls


@dataclass
class PriceData:
    """Current price data for a coin."""
    symbol: str
    price_usd: float
    price_change_24h_pct: float
    market_cap: float
    volume_24h: float
    timestamp: datetime


@dataclass
class HistoricalPrice:
    """A single historical price point."""
    timestamp: datetime
    price: float


class CoinGeckoClient:
    """Client for interacting with CoinGecko API."""
    
    # Map of common symbols to CoinGecko IDs
    SYMBOL_MAP = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "SOL": "solana",
        "DOGE": "dogecoin",
        "ADA": "cardano",
        "XRP": "ripple",
        "DOT": "polkadot",
        "AVAX": "avalanche-2",
        "MATIC": "matic-network",
        "LINK": "chainlink",
    }
    
    # Default coins to track
    DEFAULT_COINS = ["bitcoin", "ethereum", "solana"]
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "MarketPredictionEngine/1.0"
        })
        self._last_request_time = 0
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits."""
        elapsed = time.time() - self._last_request_time
        if elapsed < RATE_LIMIT_DELAY:
            time.sleep(RATE_LIMIT_DELAY - elapsed)
        self._last_request_time = time.time()
    
    def _get(self, endpoint: str, params: dict = None) -> dict:
        """Make a GET request to the API."""
        self._rate_limit()
        url = f"{BASE_URL}/{endpoint}"
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_coin_id(self, symbol: str) -> str:
        """Convert a symbol (BTC) to CoinGecko ID (bitcoin)."""
        symbol_upper = symbol.upper()
        if symbol_upper in self.SYMBOL_MAP:
            return self.SYMBOL_MAP[symbol_upper]
        # If not in map, assume it's already a CoinGecko ID
        return symbol.lower()
    
    def get_current_price(self, coin_id: str) -> Optional[PriceData]:
        """Get current price data for a coin."""
        try:
            data = self._get("coins/markets", {
                "vs_currency": "usd",
                "ids": coin_id,
                "order": "market_cap_desc",
                "sparkline": "false",
                "price_change_percentage": "24h"
            })
            
            if not data:
                return None
            
            coin = data[0]
            return PriceData(
                symbol=coin_id,
                price_usd=coin["current_price"],
                price_change_24h_pct=coin.get("price_change_percentage_24h", 0) or 0,
                market_cap=coin.get("market_cap", 0) or 0,
                volume_24h=coin.get("total_volume", 0) or 0,
                timestamp=datetime.utcnow()
            )
        except Exception as e:
            print(f"Error fetching price for {coin_id}: {e}")
            return None
    
    def get_current_prices(self, coin_ids: List[str] = None) -> Dict[str, PriceData]:
        """Get current prices for multiple coins."""
        if coin_ids is None:
            coin_ids = self.DEFAULT_COINS
        
        prices = {}
        try:
            data = self._get("coins/markets", {
                "vs_currency": "usd",
                "ids": ",".join(coin_ids),
                "order": "market_cap_desc",
                "sparkline": "false",
                "price_change_percentage": "24h"
            })
            
            for coin in data:
                coin_id = coin["id"]
                prices[coin_id] = PriceData(
                    symbol=coin_id,
                    price_usd=coin["current_price"],
                    price_change_24h_pct=coin.get("price_change_percentage_24h", 0) or 0,
                    market_cap=coin.get("market_cap", 0) or 0,
                    volume_24h=coin.get("total_volume", 0) or 0,
                    timestamp=datetime.utcnow()
                )
        except Exception as e:
            print(f"Error fetching prices: {e}")
        
        return prices
    
    def get_historical_prices(self, coin_id: str, days: int = 30) -> List[HistoricalPrice]:
        """
        Get historical daily prices for a coin.
        
        Args:
            coin_id: CoinGecko coin ID (e.g., "bitcoin")
            days: Number of days of history (max 90 for free tier with daily granularity)
        
        Returns:
            List of HistoricalPrice objects, oldest first
        """
        try:
            data = self._get(f"coins/{coin_id}/market_chart", {
                "vs_currency": "usd",
                "days": days,
                "interval": "daily"
            })
            
            prices = []
            for point in data.get("prices", []):
                timestamp_ms, price = point
                prices.append(HistoricalPrice(
                    timestamp=datetime.utcfromtimestamp(timestamp_ms / 1000),
                    price=price
                ))
            
            return prices
        except Exception as e:
            print(f"Error fetching historical prices for {coin_id}: {e}")
            return []
    
    def get_price_at_time(self, coin_id: str, target_date: datetime) -> Optional[float]:
        """
        Get the price of a coin at a specific date.
        
        Args:
            coin_id: CoinGecko coin ID
            target_date: The date to get the price for
        
        Returns:
            Price in USD, or None if not available
        """
        try:
            date_str = target_date.strftime("%d-%m-%Y")
            data = self._get(f"coins/{coin_id}/history", {
                "date": date_str,
                "localization": "false"
            })
            
            market_data = data.get("market_data", {})
            if market_data:
                return market_data.get("current_price", {}).get("usd")
            return None
        except Exception as e:
            print(f"Error fetching price for {coin_id} at {target_date}: {e}")
            return None
    
    def calculate_price_change(
        self, 
        coin_id: str, 
        start_price: float, 
        end_time: datetime = None
    ) -> Optional[float]:
        """
        Calculate the percentage price change from a starting price.
        
        Args:
            coin_id: CoinGecko coin ID
            start_price: The price at the start of the period
            end_time: When to measure (default: now)
        
        Returns:
            Percentage change (e.g., 5.0 for 5% increase)
        """
        if end_time and end_time.date() < datetime.utcnow().date():
            end_price = self.get_price_at_time(coin_id, end_time)
        else:
            current = self.get_current_price(coin_id)
            end_price = current.price_usd if current else None
        
        if end_price is None or start_price == 0:
            return None
        
        return ((end_price - start_price) / start_price) * 100


# Singleton instance for easy access
_client = None

def get_client() -> CoinGeckoClient:
    """Get the singleton CoinGecko client instance."""
    global _client
    if _client is None:
        _client = CoinGeckoClient()
    return _client


if __name__ == "__main__":
    # Quick test
    client = get_client()
    
    print("Fetching current prices...")
    prices = client.get_current_prices()
    for coin_id, price_data in prices.items():
        print(f"  {coin_id}: ${price_data.price_usd:,.2f} ({price_data.price_change_24h_pct:+.2f}%)")
    
    print("\nFetching Bitcoin historical prices (last 7 days)...")
    history = client.get_historical_prices("bitcoin", days=7)
    for hp in history[-7:]:
        print(f"  {hp.timestamp.date()}: ${hp.price:,.2f}")
