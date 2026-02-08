# Market Prediction Engine

A testable and verifiable market prediction system for cryptocurrency prices.

## Features

- **Multiple Prediction Strategies**: Random baseline, Momentum, Mean Reversion, SMA Crossover
- **Historical Backtesting**: Test strategies against past data before going live
- **Live Predictions**: Generate 24-hour price predictions with confidence scores
- **Verification System**: Automatically verify predictions against actual outcomes
- **Strategy Leaderboard**: Track which strategies are beating the random baseline

## Quick Start

```bash
# 1. Fetch historical price data (60 days)
python -m market_prediction.cli.main fetch --days 60

# 2. Run backtests to see how strategies performed historically
python -m market_prediction.cli.main backtest --days 30

# 3. Generate live predictions
python -m market_prediction.cli.main predict

# 4. Check prediction status and leaderboard
python -m market_prediction.cli.main status

# 5. After 24 hours, verify predictions
python -m market_prediction.cli.main verify
```

## Prediction Contract

Each prediction contains:
- **Asset**: e.g., "bitcoin", "ethereum"
- **Direction**: UP or DOWN
- **Magnitude**: SMALL (0-2%), MEDIUM (2-5%), LARGE (5%+)
- **Confidence**: 0.0 - 1.0
- **24-hour window**: Prediction made at time T, verified at T+24h

## Strategies

### 1. Random Baseline
Pure coin flip. If we can't beat this, our other strategies are worthless.
- Expected accuracy: ~50% directional, ~33% magnitude

### 2. Momentum
Trend following - if price went up recently, predict it will continue up.
- Uses 24-hour lookback period

### 3. Mean Reversion
Contrarian approach - predict reversal after significant moves.
- Triggers on >2% moves

### 4. SMA Crossover
Technical analysis using 7-day and 21-day moving averages.
- Bullish when price is above both MAs
- Bearish when price is below both MAs

## Success Metrics

1. **Directional Accuracy**: % of correct UP/DOWN calls (baseline: 50%)
2. **Magnitude Accuracy**: % of correct bucket predictions
3. **Brier Score**: Measures confidence calibration (0 = perfect, 1 = worst)

## CLI Commands

### `fetch` - Fetch Historical Data
```bash
python -m market_prediction.cli.main fetch --assets bitcoin,ethereum --days 60
```

### `predict` - Generate Predictions
```bash
python -m market_prediction.cli.main predict
python -m market_prediction.cli.main predict --strategy momentum
```

### `backtest` - Test on Historical Data
```bash
python -m market_prediction.cli.main backtest --asset bitcoin --days 30
python -m market_prediction.cli.main backtest --json  # Output as JSON
```

### `verify` - Verify Past Predictions
```bash
python -m market_prediction.cli.main verify
```

### `status` - View Leaderboard
```bash
python -m market_prediction.cli.main status
```

### `prices` - View Recent Prices
```bash
python -m market_prediction.cli.main prices --asset bitcoin --hours 48
```

## Database

All data is stored in SQLite (`market_predictions.db` by default):
- `prices` table: Historical price data
- `predictions` table: All predictions with verification results

To use a different database:
```bash
python -m market_prediction.cli.main --db my_predictions.db fetch
```

## Architecture

```
market_prediction/
├── models.py           # Data models and SQLite schema
├── data/
│   └── coingecko.py    # CoinGecko API client
├── strategies/
│   └── base.py         # Prediction strategies
├── backtesting/
│   └── backtest.py     # Historical backtesting
├── verification/
│   └── verifier.py     # Prediction verification
└── cli/
    └── main.py         # Command line interface
```

## Adding New Strategies

1. Create a new class inheriting from `BaseStrategy` in `strategies/base.py`
2. Implement the `predict` method
3. Add to the `STRATEGIES` dict

```python
class MyStrategy(BaseStrategy):
    name = "my_strategy"
    description = "My custom strategy"
    
    def predict(self, asset, current_price, price_history, prediction_time):
        # Your logic here
        return self._create_prediction(
            asset=asset,
            current_price=current_price,
            prediction_time=prediction_time,
            direction=Direction.UP,
            magnitude=Magnitude.SMALL,
            confidence=0.6
        )
```

## The Cold Start Principle

As recommended by Naz: We should observe predictions without acting on them first. Build the track record. When we have signal, we'll know it's real.

1. Run predictions daily for 30+ days
2. Verify each prediction after 24 hours
3. Only trust strategies that consistently beat the random baseline
4. Watch for regime changes - what works in bull markets may fail in bear markets
