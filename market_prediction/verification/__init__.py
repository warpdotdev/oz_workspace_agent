"""Verification engine - compare predictions against reality."""
from .verifier import Verifier
from .backtest import Backtester

__all__ = ["Verifier", "Backtester"]
