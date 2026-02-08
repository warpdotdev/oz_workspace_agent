# 📊 Market Prediction Engine

A crypto price prediction system with multiple competing strategies, verification tracking, and a dashboard to visualize performance.

## 🎯 Features

- **Multiple Prediction Strategies**: SMA Crossover, Momentum, and Random Baseline (control)
- **Strategy Competition**: Each strategy's predictions are tracked and verified
- **Rigorous Verification**: Compares predictions vs actual outcomes
- **Cold Start Mode**: Build track record before trusting any signals
- **CLI + Web Dashboard**: View predictions and accuracy via CLI or browser

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd prediction_engine
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
python cli.py init
```

### 3. Make Predictions

```bash
# Predict for default coins (bitcoin, ethereum, solana)
python cli.py predict

# Predict for specific coins
python cli.py predict -s bitcoin,dogecoin
```

### 4. Verify Predictions (after 24 hours)

```bash
python cli.py verify
```

### 5. View Strategy Leaderboard

```bash
python cli.py status
```

### 6. Start Web Dashboard

```bash
python cli.py run
# Visit http://localhost:5000
```

## 📁 Project Structure

```
prediction_engine/
├── cli.py                 # Command-line interface
├── orchestrator.py        # Coordinates prediction cycle
├── data/
│   ├── models.py          # Database models (SQLite)
│   └── coingecko_client.py # CoinGecko API client
├── strategies/
│   ├── base.py            # Strategy base class
│   ├── sma_crossover.py   # SMA Crossover strategy
│   ├── momentum.py        # Momentum strategy
│   └── random_baseline.py # Random baseline (control)
├── verification/
│   └── verifier.py        # Prediction verifier
└── dashboard/
    ├── app.py             # Flask web app
    └── templates/
        └── index.html     # Dashboard UI
```

## 🔮 Prediction Format

Each prediction includes:

- **Direction**: `UP` or `DOWN`
- **Magnitude**: 
  - `SMALL`: 0-2% change
  - `MEDIUM`: 2-5% change
  - `LARGE`: 5%+ change
- **Confidence**: 0.0 - 1.0 (how confident the strategy is)

## 📈 Strategies

### 1. SMA Crossover (`sma_crossover`)
Uses Simple Moving Average crossover signals:
- Bullish when 7-day SMA > 21-day SMA
- Confidence increases when SMAs are diverging or just crossed

### 2. Momentum (`momentum`)
Trend-following based on recent price momentum:
- Uses 3-day and 10-day momentum
- Higher confidence when both timeframes agree

### 3. Random Baseline (`random_baseline`)
Control group making random predictions:
- Expected 50% direction accuracy, 33% magnitude accuracy
- Any good strategy should beat this!

## 🗓️ Cold Start Plan

1. **First 2 weeks**: Make predictions only (observation mode)
2. Track all strategies' accuracy
3. After cold start: Weight predictions by historical accuracy

## 📊 Database

SQLite database stores:
- `predictions`: All predictions with timestamps
- `outcomes`: Verified results
- `strategy_stats`: Aggregated strategy performance

## 🔧 CLI Commands

```bash
# Make new predictions
python cli.py predict [-s SYMBOLS]

# Verify past predictions  
python cli.py verify

# Show strategy leaderboard
python cli.py status

# Show prediction history
python cli.py history [--symbol SYMBOL] [--strategy STRATEGY] [-n LIMIT]

# Start web dashboard
python cli.py run [-p PORT] [--debug]

# Initialize database
python cli.py init

# Run backtest with train/test split
python cli.py backtest -s bitcoin -d 90 --train-ratio 0.6

# Run multi-asset backtest
python cli.py backtest --multi-asset -d 90
```

## 🔬 Backtesting (Statistical Rigor)

The backtest module provides **rigorous statistical validation**:

### Train/Test Split
- Data is split into train (60%) and test (40%) periods
- Train performance may be overfitting
- **TEST performance is what matters** - validates out-of-sample

### Statistical Significance
- P-values calculated using binomial test
- Significance levels: `***` p<0.001, `**` p<0.01, `*` p<0.05, `.` p<0.1
- An edge is only "real" if p-value < 0.05 on the TEST set

### Example Output
```
🧪 TEST SET (out-of-sample) ← THIS IS WHAT MATTERS
──────────────────────────────────────────────────────────────────────
Strategy                  N   Accuracy    P-value   Sig
──────────────────────────────────────────────────────────────────────
momentum                 35     54.3%     0.3677
sma_crossover            35     57.1%     0.2495
random_baseline          35     57.1%     0.2495
```

### Key Insight
With n~35 test predictions, you need ~60%+ accuracy to achieve p<0.05.
Small sample sizes = high variance. Don't celebrate until it's significant!

## 🌐 API Endpoints

The dashboard exposes these JSON APIs:

- `GET /api/predictions` - Recent predictions
- `GET /api/strategies` - Strategy performance
- `GET /api/summary` - Overall statistics
- `GET /api/history/<symbol>` - Symbol prediction history

## ⚠️ Disclaimer

This is for educational and experimental purposes only. Cryptocurrency markets are highly volatile. Never make financial decisions based solely on these predictions.

## 🤝 Contributing

Built by the team! Areas for future work:
- Add more strategies (sentiment analysis, on-chain metrics)
- Implement ensemble predictions (weighted by accuracy)
- Add alerting for high-confidence predictions
- Backtest strategies on historical data

---

_Predictions with receipts! 📊_
