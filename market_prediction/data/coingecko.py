#!/usr/bin/env python3
"""
CoinGecko API Client

Fetches cryptocurrency price data from CoinGecko's free API.
No API key required for basic usage.

Rate limits: ~10-50 requests/minute on free tier
"""

import time
import urllib.request
import urllib.error
import json
from datetime import datetime, timedelta
from typing import Optional
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import PricePoint, Database


class CoinGeckoClient:
    """
    Client for CoinGecko API.
    
    Uses only urllib to avoid external dependencies.
    """
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    # Map of common names to CoinGecko IDs
    ASSET_MAP = {
        "btc": "bitcoin",
        "bitcoin": "bitcoin",
        "eth": "ethereum",
        "ethereum": "ethereum",
        "sol": "solana",
        "solana": "solana",
        "doge": "dogecoin",
        "dogecoin": "dogecoin",
    }
    
    def __init__(self, db: Optional[Database] = None):
        self.db = db
        self._last_request_time = 0
        self._min_request_interval = 1.5  # seconds between requests
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self._min_request_interval:
            time.sleep(self._min_request_interval - elapsed)
        self._last_request_time = time.time()
    
    def _request(self, endpoint: str, params: dict = None) -> dict:
        """Make a request to the CoinGecko API."""
        self._rate_limit()
        
        url = f"{self.BASE_URL}/{endpoint}"
        if params:
            query = "&".join(f"{k}={v}" for k, v in params.items())
            url = f"{url}?{query}"
        
        try:
            req = urllib.request.Request(
                url,
                headers={"Accept": "application/json", "User-Agent": "MarketPredictionEngine/1.0"}
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # Rate limited - wait and retry
                print(f"Rate limited, waiting 60 seconds...")
                time.sleep(60)
                return self._request(endpoint, params)
            raise
    
    def _normalize_asset(self, asset: str) -> str:
        """Convert asset name to CoinGecko ID."""
        return self.ASSET_MAP.get(asset.lower(), asset.lower())
    
    def get_current_price(self, asset: str) -> Optional[PricePoint]:
        """
        Get the current price of an asset.
        
        Args:
            asset: Asset name (e.g., "bitcoin", "btc", "ethereum")
            
        Returns:
            PricePoint with current price, or None if not found
        """
        asset_id = self._normalize_asset(asset)
        
        try:
            data = self._request("simple/price", {
                "ids": asset_id,
                "vs_currencies": "usd",
                "include_last_updated_at": "true"
            })
            
            if asset_id not in data:
                return None
            
            price_data = data[asset_id]
            timestamp = datetime.utcfromtimestamp(price_data.get("last_updated_at", time.time()))
            
            price_point = PricePoint(
                asset=asset_id,
                timestamp=timestamp,
                price_usd=price_data["usd"]
            )
            
            # Save to database if available
            if self.db:
                self.db.save_price(price_point)
            
            return price_point
            
        except Exception as e:
            print(f"Error fetching current price for {asset}: {e}")
            return None
    
    def get_historical_prices(
        self,
        asset: str,
        days: int = 30,
        save_to_db: bool = True
    ) -> list[PricePoint]:
        """
        Get historical daily prices for an asset.
        
        Args:
            asset: Asset name
            days: Number of days of history (max 365 for free tier)
            save_to_db: Whether to save prices to database
            
        Returns:
            List of PricePoints ordered by timestamp
        """
        asset_id = self._normalize_asset(asset)
        
        try:
            data = self._request(f"coins/{asset_id}/market_chart", {
                "vs_currency": "usd",
                "days": str(days),
                "interval": "daily"
            })
            
            prices = []
            for timestamp_ms, price in data.get("prices", []):
                timestamp = datetime.utcfromtimestamp(timestamp_ms / 1000)
                prices.append(PricePoint(
                    asset=asset_id,
                    timestamp=timestamp,
                    price_usd=price
                ))
            
            # Save to database if available and requested
            if self.db and save_to_db and prices:
                self.db.save_prices(prices)
                print(f"Saved {len(prices)} price points for {asset_id}")
            
            return prices
            
        except Exception as e:
            print(f"Error fetching historical prices for {asset}: {e}")
            return []
    
    def get_hourly_prices(
        self,
        asset: str,
        days: int = 7,
        save_to_db: bool = True
    ) -> list[PricePoint]:
        """
        Get hourly prices for an asset (last 7-90 days).
        
        Note: CoinGecko returns hourly data for 1-90 day ranges.
        
        Args:
            asset: Asset name
            days: Number of days (1-90 for hourly data)
            save_to_db: Whether to save prices to database
            
        Returns:
            List of PricePoints ordered by timestamp
        """
        asset_id = self._normalize_asset(asset)
        
        # Hourly data is returned for 1-90 day ranges
        days = min(max(days, 1), 90)
        
        try:
            data = self._request(f"coins/{asset_id}/market_chart", {
                "vs_currency": "usd",
                "days": str(days)
            })
            
            prices = []
            for timestamp_ms, price in data.get("prices", []):
                timestamp = datetime.utcfromtimestamp(timestamp_ms / 1000)
                prices.append(PricePoint(
                    asset=asset_id,
                    timestamp=timestamp,
                    price_usd=price
                ))
            
            # Save to database if available and requested
            if self.db and save_to_db and prices:
                self.db.save_prices(prices)
                print(f"Saved {len(prices)} hourly price points for {asset_id}")
            
            return prices
            
        except Exception as e:
            print(f"Error fetching hourly prices for {asset}: {e}")
            return []
    
    def fetch_and_store(self, assets: list[str], days: int = 90) -> dict[str, int]:
        """
        Fetch and store historical data for multiple assets.
        
        Args:
            assets: List of asset names
            days: Days of history to fetch
            
        Returns:
            Dict mapping asset to number of prices stored
        """
        results = {}
        
        for asset in assets:
            asset_id = self._normalize_asset(asset)
            prices = self.get_hourly_prices(asset, days=days, save_to_db=True)
            results[asset_id] = len(prices)
            print(f"Fetched {len(prices)} prices for {asset_id}")
        
        return results


def main():
    """Test the CoinGecko client."""
    # Create database and client
    db = Database("test_prices.db")
    client = CoinGeckoClient(db)
    
    # Fetch current prices
    print("=== Current Prices ===")
    for asset in ["bitcoin", "ethereum"]:
        price = client.get_current_price(asset)
        if price:
            print(f"{asset}: ${price.price_usd:,.2f} at {price.timestamp}")
    
    # Fetch historical prices
    print("\n=== Historical Prices (7 days hourly) ===")
    prices = client.get_hourly_prices("bitcoin", days=7)
    print(f"Got {len(prices)} hourly prices for Bitcoin")
    if prices:
        print(f"  First: ${prices[0].price_usd:,.2f} at {prices[0].timestamp}")
        print(f"  Last:  ${prices[-1].price_usd:,.2f} at {prices[-1].timestamp}")
    
    db.close()
    print("\nDone!")


if __name__ == "__main__":
    main()
