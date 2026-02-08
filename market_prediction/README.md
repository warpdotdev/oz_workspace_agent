# 🔮 Market Prediction Engine

A testable, verifiable crypto market prediction system with competing strategies and full receipts.

## Philosophy

> "We need a 'cold start' period where we make predictions but DON'T act on them. Just observe. Build the track record first. Then when we have signal, we'll know it's real."

This engine is built on one principle: **predictions without verification are worthless**. Every prediction is:
- Timestamped and stored BEFORE the target date
- Compared against actual outcomes AFTER the target date
- Tracked by strategy so we know what actually works

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run your first prediction
cd market_prediction
python runner.py

# Or use the CLI
python -m cli.main predict
python -m cli.main leaderboard
```

## Features

### 🏟️ Strategy Competition
Multiple prediction strategies compete against each other:

| Strategy | Description |
|----------|-------------|
| `random_baseline` | Random predictions - the bar everyone must beat |
| `sma_crossover` | 7/21 day moving average crossover |
| `momentum` | 14-day price momentum extrapolation |
| `mean_reversion` | Bet on prices returning to average |

Each strategy predicts:
- **Direction**: Up, Down, or Neutral
- **Magnitude**: Small (0-2%), Medium (2-5%), Large (5%+)
- **Confidence**: How sure the strategy is (0-100%)

### 📊 Full Verification
Every prediction gets verified against reality:
- Automatic verification once target date passes
- Tracks direction accuracy and magnitude accuracy
- Rolling leaderboard shows which strategies actually work

### 📈 Dashboard
Simple web dashboard showing:
- Current predictions
- Strategy leaderboard
- Accuracy over time chart
- Prediction vs reality comparison

```bash
python -m api.dashboard
# Open http://localhost:5000
```

### 🖥️ CLI
Power user interface for all operations:

```bash
# Generate predictions for tomorrow
python -m cli.main predict

# Generate predictions for 7 days ahead
python -m cli.main predict --days-ahead 7

# Verify pending predictions  
python -m cli.main verify

# Show strategy rankings
python -m cli.main leaderboard

# Show prediction history
python -m cli.main history --limit 20

# Backfill historical data
python -m cli.main backfill --days 90

# Show current prices
python -m cli.main prices
```

## Architecture

```
market_prediction/
├── storage/
│   └── models.py       # SQLite database, Prediction/Price models
├── data/
│   └── coingecko.py    # CoinGecko API client, data ingestion
├── strategies/
│   └── base.py         # Strategy base class + implementations
├── verification/
│   └── engine.py       # Compare predictions vs reality
├── cli/
│   └── main.py         # Command-line interface
├── api/
│   └── dashboard.py    # Flask web dashboard
└── runner.py           # Main orchestrator + scheduler
```

## Running Daily

For continuous operation:

```bash
# Run once
python runner.py

# Run on a schedule (daily at midnight)
python runner.py --schedule --time 00:00

# Backfill historical predictions to build track record
python runner.py --backfill 30
```

## Data Storage

All data stored in SQLite (`market_predictions.db`):
- **price_history**: Raw price data from CoinGecko
- **predictions**: All predictions with timestamp, strategy, confidence
- **verification_results**: Outcomes and accuracy for each prediction

You can inspect the database directly:
```bash
sqlite3 market_predictions.db
> SELECT * FROM predictions ORDER BY created_at DESC LIMIT 10;
> SELECT strategy_name, AVG(direction_correct) FROM verification_results v
  JOIN predictions p ON v.prediction_id = p.id GROUP BY strategy_name;
```

## Adding New Strategies

1. Create a new class inheriting from `BaseStrategy`:

```python
from strategies.base import BaseStrategy, PredictionOutput, Direction, MagnitudeBucket

class MyStrategy(BaseStrategy):
    def __init__(self):
        super().__init__(
            name="my_strategy",
            description="My custom strategy"
        )
    
    def predict(self, symbol, current_price, price_history, target_date):
        # Your logic here
        return PredictionOutput(
            direction=Direction.UP,
            magnitude=MagnitudeBucket.MEDIUM,
            confidence=0.65,
            reasoning="Why I made this prediction"
        )
```

2. Add it to `ALL_STRATEGIES` in `strategies/base.py`

3. Run predictions and watch it compete!

## API Endpoints

The dashboard exposes these endpoints:

- `GET /` - Dashboard page
- `GET /api/dashboard-data` - All dashboard data (JSON)
- `GET /api/prices` - Fetch and return current prices
- `POST /api/run-predictions` - Trigger prediction run

## Testing

The random baseline strategy exists specifically to keep everyone honest. If your fancy new strategy can't beat random, it's not adding value.

Target metrics:
- Direction accuracy > 55% (beating random ~50%)
- Consistent over 30+ predictions

## License

MIT
