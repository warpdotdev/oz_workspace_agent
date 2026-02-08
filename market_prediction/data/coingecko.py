"""
CoinGecko API client for fetching cryptocurrency prices.

Uses the free tier (no API key needed for basic calls).
Rate limited to be respectful of the API.
"""

import time
import urllib.request
import urllib.error
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from .models import PriceHistory


class CoinGeckoClient:
    """
    Client for CoinGecko API.
    
    Free tier limits:
    - 10-30 calls/minute (we'll be conservative)
    - No API key needed
    """
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    # Supported assets (CoinGecko IDs)
    SUPPORTED_ASSETS = {
        "bitcoin": "bitcoin",
        "btc": "bitcoin",
        "ethereum": "ethereum",
        "eth": "ethereum",
    }
    
    def __init__(self, rate_limit_delay: float = 2.0):
        """
        Initialize the client.
        
        Args:
            rate_limit_delay: Seconds to wait between API calls
        """
        self.rate_limit_delay = rate_limit_delay
        self._last_call_time = 0.0
    
    def _rate_limit(self):
        """Ensure we don't exceed rate limits."""
        elapsed = time.time() - self._last_call_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self._last_call_time = time.time()
    
    def _make_request(self, endpoint: str, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Make a request to the CoinGecko API."""
        self._rate_limit()
        
        url = f"{self.BASE_URL}{endpoint}"
        if params:
            query_string = "&".join(f"{k}={v}" for k, v in params.items())
            url = f"{url}?{query_string}"
        
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.loads(response.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # Rate limited, wait and retry once
                time.sleep(60)
                with urllib.request.urlopen(req, timeout=30) as response:
                    return json.loads(response.read().decode())
            raise
    
    def _normalize_asset(self, asset: str) -> str:
        """Convert asset name to CoinGecko ID."""
        asset_lower = asset.lower()
        return self.SUPPORTED_ASSETS.get(asset_lower, asset_lower)
    
    def get_current_price(self, asset: str) -> Optional[PriceHistory]:
        """
        Get the current price for an asset.
        
        Args:
            asset: Asset name (e.g., "bitcoin", "ethereum", "btc", "eth")
            
        Returns:
            PriceHistory object with current price data
        """
        coin_id = self._normalize_asset(asset)
        
        try:
            data = self._make_request(
                f"/coins/{coin_id}",
                {"localization": "false", "tickers": "false", "community_data": "false", "developer_data": "false"}
            )
            
            market_data = data.get("market_data", {})
            
            return PriceHistory(
                asset=coin_id,
                timestamp=datetime.utcnow(),
                price_usd=market_data.get("current_price", {}).get("usd", 0.0),
                volume_24h=market_data.get("total_volume", {}).get("usd"),
                market_cap=market_data.get("market_cap", {}).get("usd"),
            )
        except Exception as e:
            print(f"Error fetching price for {asset}: {e}")
            return None
    
    def get_simple_price(self, assets: List[str]) -> Dict[str, float]:
        """
        Get simple price data for multiple assets (more efficient).
        
        Args:
            assets: List of asset names
            
        Returns:
            Dict mapping asset name to USD price
        """
        coin_ids = [self._normalize_asset(a) for a in assets]
        
        try:
            data = self._make_request(
                "/simple/price",
                {"ids": ",".join(coin_ids), "vs_currencies": "usd"}
            )
            
            return {
                coin_id: data.get(coin_id, {}).get("usd", 0.0)
                for coin_id in coin_ids
            }
        except Exception as e:
            print(f"Error fetching simple prices: {e}")
            return {}
    
    def get_historical_prices(self, asset: str, days: int = 30) -> List[PriceHistory]:
        """
        Get historical price data for an asset.
        
        Args:
            asset: Asset name
            days: Number of days of history (max 365 for free tier)
            
        Returns:
            List of PriceHistory objects
        """
        coin_id = self._normalize_asset(asset)
        
        try:
            data = self._make_request(
                f"/coins/{coin_id}/market_chart",
                {"vs_currency": "usd", "days": str(days)}
            )
            
            prices = data.get("prices", [])
            volumes = data.get("total_volumes", [])
            market_caps = data.get("market_caps", [])
            
            # Create volume and market cap lookup by timestamp
            volume_map = {int(v[0]): v[1] for v in volumes}
            market_cap_map = {int(m[0]): m[1] for m in market_caps}
            
            history = []
            for timestamp_ms, price in prices:
                timestamp = datetime.utcfromtimestamp(timestamp_ms / 1000)
                history.append(PriceHistory(
                    asset=coin_id,
                    timestamp=timestamp,
                    price_usd=price,
                    volume_24h=volume_map.get(int(timestamp_ms)),
                    market_cap=market_cap_map.get(int(timestamp_ms)),
                ))
            
            return history
        except Exception as e:
            print(f"Error fetching historical prices for {asset}: {e}")
            return []
    
    def get_price_at_date(self, asset: str, date: datetime) -> Optional[PriceHistory]:
        """
        Get price at a specific date.
        
        Args:
            asset: Asset name
            date: The date to get price for
            
        Returns:
            PriceHistory object or None
        """
        coin_id = self._normalize_asset(asset)
        date_str = date.strftime("%d-%m-%Y")
        
        try:
            data = self._make_request(
                f"/coins/{coin_id}/history",
                {"date": date_str, "localization": "false"}
            )
            
            market_data = data.get("market_data", {})
            if not market_data:
                return None
            
            return PriceHistory(
                asset=coin_id,
                timestamp=date,
                price_usd=market_data.get("current_price", {}).get("usd", 0.0),
                volume_24h=market_data.get("total_volume", {}).get("usd"),
                market_cap=market_data.get("market_cap", {}).get("usd"),
            )
        except Exception as e:
            print(f"Error fetching price at date for {asset}: {e}")
            return None
    
    def ping(self) -> bool:
        """Check if API is available."""
        try:
            data = self._make_request("/ping")
            return data.get("gecko_says") == "(V3) To the Moon!"
        except Exception:
            return False
