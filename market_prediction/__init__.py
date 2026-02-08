"""
Market Prediction Engine

A verifiable, testable market prediction system that tracks predictions
against reality over time. Starts with crypto (BTC, ETH) using CoinGecko API.

Prediction Contract:
- Asset: cryptocurrency (bitcoin, ethereum)
- Direction: UP or DOWN
- Magnitude: SMALL (0-2%), MEDIUM (2-5%), LARGE (5%+)
- Timeframe: 24 hours
- Confidence: 0.0 - 1.0
"""

__version__ = "0.1.0"
