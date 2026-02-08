#!/usr/bin/env python3
"""
CoinGecko API Client

Free API for fetching crypto price data. No API key needed for basic calls.
Rate limit: 10-30 calls/minute on free tier.

Docs: https://www.coingecko.com/en/api/documentation
"""

import time
import requests
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from storage.models import PriceRecord, Database


BASE_URL = "https://api.coingecko.com/api/v3"

# Default coins to track
DEFAULT_COINS = ["bitcoin", "ethereum", "solana", "cardano", "dogecoin"]


@dataclass
class CoinInfo:
    """Basic coin information"""
    id: str
    symbol: str
    name: str
    current_price: float
    market_cap: float
    volume_24h: float
    price_change_24h_pct: float
    last_updated: datetime


class CoinGeckoClient:
    """Client for CoinGecko API"""
    
    def __init__(self, rate_limit_delay: float = 1.5):
        """
        Initialize CoinGecko client.
        
        Args:
            rate_limit_delay: Seconds to wait between API calls (free tier is limited)
        """
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'MarketPredictionEngine/1.0'
        })
        self.rate_limit_delay = rate_limit_delay
        self._last_call_time = 0
    
    def _rate_limit(self):
        """Enforce rate limiting between API calls"""
        elapsed = time.time() - self._last_call_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self._last_call_time = time.time()
    
    def _get(self, endpoint: str, params: dict = None) -> Optional[Dict[str, Any]]:
        """Make a GET request to CoinGecko API"""
        self._rate_limit()
        url = f"{BASE_URL}/{endpoint}"
        
        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API error: {e}")
            return None
    
    def get_coin_price(self, coin_id: str) -> Optional[CoinInfo]:
        """
        Get current price data for a single coin.
        
        Args:
            coin_id: CoinGecko coin ID (e.g., "bitcoin", "ethereum")
        
        Returns:
            CoinInfo with current market data
        """
        data = self._get("coins/markets", {
            "vs_currency": "usd",
            "ids": coin_id,
            "order": "market_cap_desc",
            "sparkline": "false"
        })
        
        if not data or len(data) == 0:
            return None
        
        coin = data[0]
        return CoinInfo(
            id=coin['id'],
            symbol=coin['symbol'],
            name=coin['name'],
            current_price=coin['current_price'],
            market_cap=coin.get('market_cap', 0),
            volume_24h=coin.get('total_volume', 0),
            price_change_24h_pct=coin.get('price_change_percentage_24h', 0),
            last_updated=datetime.fromisoformat(
                coin['last_updated'].replace('Z', '+00:00')
            ).replace(tzinfo=None)
        )
    
    def get_multiple_prices(self, coin_ids: List[str] = None) -> List[CoinInfo]:
        """
        Get current price data for multiple coins.
        
        Args:
            coin_ids: List of CoinGecko coin IDs. Defaults to DEFAULT_COINS.
        
        Returns:
            List of CoinInfo objects
        """
        if coin_ids is None:
            coin_ids = DEFAULT_COINS
        
        data = self._get("coins/markets", {
            "vs_currency": "usd",
            "ids": ",".join(coin_ids),
            "order": "market_cap_desc",
            "sparkline": "false"
        })
        
        if not data:
            return []
        
        return [
            CoinInfo(
                id=coin['id'],
                symbol=coin['symbol'],
                name=coin['name'],
                current_price=coin['current_price'],
                market_cap=coin.get('market_cap', 0),
                volume_24h=coin.get('total_volume', 0),
                price_change_24h_pct=coin.get('price_change_percentage_24h', 0),
                last_updated=datetime.fromisoformat(
                    coin['last_updated'].replace('Z', '+00:00')
                ).replace(tzinfo=None)
            )
            for coin in data
        ]
    
    def get_historical_prices(self, coin_id: str, days: int = 30) -> List[PriceRecord]:
        """
        Get historical daily price data for a coin.
        
        Args:
            coin_id: CoinGecko coin ID
            days: Number of days of history to fetch
        
        Returns:
            List of PriceRecord objects ordered by timestamp ascending
        """
        data = self._get(f"coins/{coin_id}/market_chart", {
            "vs_currency": "usd",
            "days": str(days),
            "interval": "daily"
        })
        
        if not data or 'prices' not in data:
            return []
        
        prices = data['prices']
        volumes = data.get('total_volumes', [])
        market_caps = data.get('market_caps', [])
        
        records = []
        for i, (timestamp_ms, price) in enumerate(prices):
            timestamp = datetime.utcfromtimestamp(timestamp_ms / 1000)
            
            # Match up volume and market cap if available
            volume = volumes[i][1] if i < len(volumes) else None
            market_cap = market_caps[i][1] if i < len(market_caps) else None
            
            records.append(PriceRecord(
                id=None,
                symbol=coin_id,
                timestamp=timestamp,
                price_usd=price,
                volume_24h=volume,
                market_cap=market_cap
            ))
        
        return records
    
    def get_ohlc(self, coin_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get OHLC (Open, High, Low, Close) candle data.
        
        Args:
            coin_id: CoinGecko coin ID
            days: Number of days (1, 7, 14, 30, 90, 180, 365, max)
        
        Returns:
            List of OHLC candles
        """
        data = self._get(f"coins/{coin_id}/ohlc", {
            "vs_currency": "usd",
            "days": str(days)
        })
        
        if not data:
            return []
        
        return [
            {
                'timestamp': datetime.utcfromtimestamp(candle[0] / 1000),
                'open': candle[1],
                'high': candle[2],
                'low': candle[3],
                'close': candle[4]
            }
            for candle in data
        ]


class DataIngestionService:
    """Service for fetching and storing market data"""
    
    def __init__(self, db: Database, client: CoinGeckoClient = None):
        self.db = db
        self.client = client or CoinGeckoClient()
    
    def fetch_and_store_current_prices(self, coin_ids: List[str] = None) -> List[PriceRecord]:
        """
        Fetch current prices and store them in the database.
        
        Args:
            coin_ids: Coins to fetch. Defaults to DEFAULT_COINS.
        
        Returns:
            List of stored PriceRecord objects
        """
        if coin_ids is None:
            coin_ids = DEFAULT_COINS
        
        coins = self.client.get_multiple_prices(coin_ids)
        records = []
        
        for coin in coins:
            record = PriceRecord(
                id=None,
                symbol=coin.id,
                timestamp=coin.last_updated,
                price_usd=coin.current_price,
                volume_24h=coin.volume_24h,
                market_cap=coin.market_cap
            )
            record.id = self.db.insert_price(record)
            records.append(record)
            print(f"  Stored {coin.id}: ${coin.current_price:,.2f}")
        
        return records
    
    def fetch_and_store_historical(self, coin_id: str, days: int = 30) -> List[PriceRecord]:
        """
        Fetch historical prices and store them in the database.
        
        Args:
            coin_id: Coin to fetch history for
            days: Number of days of history
        
        Returns:
            List of stored PriceRecord objects
        """
        records = self.client.get_historical_prices(coin_id, days)
        
        for record in records:
            record.id = self.db.insert_price(record)
        
        print(f"  Stored {len(records)} historical records for {coin_id}")
        return records
    
    def backfill_all_coins(self, coin_ids: List[str] = None, days: int = 90) -> Dict[str, int]:
        """
        Backfill historical data for all tracked coins.
        
        Args:
            coin_ids: Coins to backfill. Defaults to DEFAULT_COINS.
            days: Days of history to fetch
        
        Returns:
            Dict mapping coin_id to number of records stored
        """
        if coin_ids is None:
            coin_ids = DEFAULT_COINS
        
        results = {}
        for coin_id in coin_ids:
            print(f"Backfilling {coin_id}...")
            records = self.fetch_and_store_historical(coin_id, days)
            results[coin_id] = len(records)
        
        return results
    
    def get_price_on_date(self, symbol: str, target_date: datetime) -> Optional[float]:
        """
        Get the price for a symbol on a specific date.
        Uses the closest price record to the target date.
        """
        # Look for price within a day of target
        start = target_date - timedelta(hours=12)
        end = target_date + timedelta(hours=12)
        
        records = self.db.get_prices(symbol, start, end)
        
        if not records:
            # Try fetching from API
            historical = self.client.get_historical_prices(symbol, days=7)
            for record in historical:
                self.db.insert_price(record)
            records = self.db.get_prices(symbol, start, end)
        
        if not records:
            return None
        
        # Return price closest to target date
        closest = min(records, key=lambda r: abs((r.timestamp - target_date).total_seconds()))
        return closest.price_usd


if __name__ == "__main__":
    # Quick test
    print("Testing CoinGecko API...")
    client = CoinGeckoClient()
    
    # Get current prices
    print("\nCurrent prices:")
    coins = client.get_multiple_prices(["bitcoin", "ethereum"])
    for coin in coins:
        print(f"  {coin.name}: ${coin.current_price:,.2f} ({coin.price_change_24h_pct:+.2f}%)")
    
    # Get historical
    print("\nHistorical data (last 7 days for BTC):")
    history = client.get_historical_prices("bitcoin", days=7)
    for record in history[-5:]:
        print(f"  {record.timestamp.date()}: ${record.price_usd:,.2f}")
