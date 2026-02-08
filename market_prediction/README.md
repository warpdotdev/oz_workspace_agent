# Market Prediction Engine

A verifiable, testable market prediction system that tracks predictions against reality over time.

## Overview

This system makes **24-hour price predictions** for cryptocurrencies and tracks how accurate those predictions are. Multiple prediction strategies compete, and you can see which ones actually work.

### Prediction Contract

Each prediction includes:
- **Asset**: The cryptocurrency (bitcoin, ethereum)
- **Direction**: UP or DOWN
- **Magnitude**: SMALL (0-2%), MEDIUM (2-5%), LARGE (5%+)
- **Confidence**: 0.0 - 1.0
- **Timestamp**: When prediction was made and when it targets

### Strategies

1. **Random Baseline** - Pure coin flip. If we can't beat this, we go home.
2. **Momentum** - Trend following. If it's going up, predict up.
3. **Mean Reversion** - Contrarian. If it moved big, predict the opposite.
4. **SMA Crossover** - Classic 7-day vs 21-day moving average crossover.

## Quick Start

```bash
# From the oz_desktop_agent directory

# 1. Fetch historical data (needed for backtesting)
python -m market_prediction.cli.main fetch

# 2. Backtest strategies to see which work
python -m market_prediction.cli.main backtest

# 3. Generate live predictions
python -m market_prediction.cli.main predict

# 4. Check status of predictions
python -m market_prediction.cli.main status

# 5. Verify predictions (run after 24h)
python -m market_prediction.cli.main verify

# 6. View strategy leaderboard
python -m market_prediction.cli.main leaderboard
```

## CLI Commands

### `fetch` - Fetch Historical Data
```bash
python -m market_prediction.cli.main fetch --assets bitcoin,ethereum --days 90
```

### `backtest` - Test Strategies on Historical Data
```bash
# Backtest all strategies on bitcoin
python -m market_prediction.cli.main backtest --asset bitcoin --days 30

# Backtest specific strategy
python -m market_prediction.cli.main backtest --strategy momentum --days 60
```

### `predict` - Generate Live Predictions
```bash
# Predict for default assets (BTC, ETH) with all strategies
python -m market_prediction.cli.main predict

# Predict with specific strategy
python -m market_prediction.cli.main predict --strategy sma_crossover
```

### `status` - View Predictions
```bash
python -m market_prediction.cli.main status --limit 50
```

### `verify` - Check Predictions Against Reality
```bash
python -m market_prediction.cli.main verify
```

### `leaderboard` - Strategy Performance
```bash
python -m market_prediction.cli.main leaderboard
```

## Database

All data is stored in SQLite (`market_predictions.db` by default).

You can inspect it directly:
```bash
sqlite3 market_predictions.db

# See all predictions
SELECT * FROM predictions ORDER BY prediction_time DESC LIMIT 10;

# Strategy performance
SELECT strategy, 
       COUNT(*) as total,
       SUM(direction_correct) as correct,
       ROUND(100.0 * SUM(direction_correct) / COUNT(*), 1) as accuracy
FROM predictions 
WHERE verified_at IS NOT NULL
GROUP BY strategy
ORDER BY accuracy DESC;
```

## Architecture

```
market_prediction/
├── data/
│   ├── models.py       # Core data models (Prediction, PriceHistory)
│   ├── database.py     # SQLite persistence layer
│   └── coingecko.py    # Market data API client
├── strategies/
│   ├── base.py         # Strategy interface
│   ├── random_strategy.py
│   ├── momentum.py
│   ├── mean_reversion.py
│   └── sma_crossover.py
├── verification/
│   ├── verifier.py     # Verify predictions against outcomes
│   └── backtest.py     # Test strategies on historical data
└── cli/
    └── main.py         # Command-line interface
```

## Success Metrics

- **Directional Accuracy**: % of correct UP/DOWN predictions
  - Baseline (random): ~50%
  - Target: >55% consistently
  
- **Magnitude Accuracy**: % of correct magnitude bucket predictions
  - Baseline (random): ~33%
  
- **Brier Score**: Calibration of confidence scores (coming soon)

## Adding New Strategies

1. Create a new file in `strategies/`
2. Inherit from `Strategy` base class
3. Implement the `predict()` method
4. Add to `strategies/__init__.py`

Example:
```python
from .base import Strategy
from ..data.models import Direction, Magnitude

class MyStrategy(Strategy):
    def __init__(self):
        super().__init__(
            name="my_strategy",
            description="My custom strategy"
        )
    
    def predict(self, asset, price_history, current_price):
        # Your logic here
        return Direction.UP, Magnitude.SMALL, 0.6
```

## Workflow

1. **Cold Start**: Run backtests to validate strategies have signal
2. **Deploy**: Generate predictions daily
3. **Verify**: Check predictions after 24h
4. **Analyze**: Review leaderboard to see what's working
5. **Iterate**: Add new strategies, retire losers

## Notes

- Uses CoinGecko free tier (no API key needed)
- Rate limited to be respectful of API
- SQLite for easy inspection and portability
- All timestamps in UTC
