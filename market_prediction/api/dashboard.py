#!/usr/bin/env python3
"""
Market Prediction Web Dashboard

Dead simple dashboard showing:
- Current predictions
- Historical accuracy
- Strategy leaderboard
- Prediction vs reality chart

Run: python -m api.dashboard
Open: http://localhost:5000
"""

from flask import Flask, render_template_string, jsonify
from datetime import datetime, date, timedelta
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from storage.models import Database, Direction, MagnitudeBucket
from verification.engine import VerificationEngine
from data.coingecko import DataIngestionService


app = Flask(__name__)
DB_PATH = "market_predictions.db"


# HTML Template - keeping it simple and self-contained
DASHBOARD_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Market Prediction Engine</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f; 
            color: #e0e0e0;
            padding: 20px;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { 
            font-size: 2rem; 
            margin-bottom: 10px;
            color: #fff;
        }
        .subtitle { color: #888; margin-bottom: 30px; }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #333;
        }
        .card h2 {
            font-size: 1.1rem;
            color: #888;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stat {
            font-size: 2.5rem;
            font-weight: bold;
            color: #4ade80;
        }
        .stat.warning { color: #fbbf24; }
        .stat.danger { color: #f87171; }
        .stat-label { color: #666; font-size: 0.9rem; }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #333;
        }
        th { 
            color: #888; 
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 1px;
        }
        .up { color: #4ade80; }
        .down { color: #f87171; }
        .neutral { color: #888; }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .badge.correct { background: #166534; color: #4ade80; }
        .badge.incorrect { background: #7f1d1d; color: #f87171; }
        .badge.pending { background: #333; color: #888; }
        
        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #333;
        }
        .leaderboard-item:last-child { border-bottom: none; }
        .strategy-name { font-weight: 500; }
        .accuracy { 
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .medal { font-size: 1.2rem; margin-right: 8px; }
        
        .chart-container {
            position: relative;
            height: 300px;
        }
        
        .refresh-btn {
            background: #333;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .refresh-btn:hover { background: #444; }
        
        .timestamp { 
            color: #666; 
            font-size: 0.8rem;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔮 Market Prediction Engine</h1>
        <p class="subtitle">Tracking predictions vs reality with cold, hard receipts</p>
        
        <div class="grid">
            <!-- Overall Stats -->
            <div class="card">
                <h2>Overall Accuracy (30 days)</h2>
                <div class="stat" id="overall-accuracy">--</div>
                <div class="stat-label">direction accuracy</div>
            </div>
            
            <div class="card">
                <h2>Predictions Verified</h2>
                <div class="stat" style="color: #60a5fa;" id="total-verified">--</div>
                <div class="stat-label">total predictions tracked</div>
            </div>
            
            <div class="card">
                <h2>Best Strategy</h2>
                <div class="stat" id="best-strategy">--</div>
                <div class="stat-label" id="best-strategy-accuracy">--</div>
            </div>
        </div>
        
        <div class="grid">
            <!-- Strategy Leaderboard -->
            <div class="card">
                <h2>Strategy Leaderboard</h2>
                <div id="leaderboard">Loading...</div>
            </div>
            
            <!-- Recent Predictions -->
            <div class="card">
                <h2>Recent Predictions</h2>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Symbol</th>
                                <th>Strategy</th>
                                <th>Prediction</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody id="predictions-table">
                            <tr><td colspan="5">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Accuracy Chart -->
        <div class="card">
            <h2>Strategy Performance Over Time</h2>
            <div class="chart-container">
                <canvas id="accuracy-chart"></canvas>
            </div>
        </div>
        
        <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <button class="refresh-btn" onclick="loadData()">↻ Refresh Data</button>
            <div class="timestamp" id="last-updated"></div>
        </div>
    </div>
    
    <script>
        let chart = null;
        
        async function loadData() {
            try {
                const response = await fetch('/api/dashboard-data');
                const data = await response.json();
                
                // Update stats
                const accuracy = data.summary.direction_accuracy * 100;
                const accEl = document.getElementById('overall-accuracy');
                accEl.textContent = accuracy.toFixed(1) + '%';
                accEl.className = 'stat ' + (accuracy >= 55 ? '' : accuracy >= 50 ? 'warning' : 'danger');
                
                document.getElementById('total-verified').textContent = data.summary.total_verified;
                
                // Best strategy
                if (data.leaderboard.length > 0) {
                    const best = data.leaderboard[0];
                    document.getElementById('best-strategy').textContent = best.name;
                    document.getElementById('best-strategy-accuracy').textContent = 
                        (best.direction_accuracy * 100).toFixed(1) + '% accuracy';
                }
                
                // Leaderboard
                const leaderboardEl = document.getElementById('leaderboard');
                if (data.leaderboard.length === 0) {
                    leaderboardEl.innerHTML = '<p style="color:#666">No verified predictions yet</p>';
                } else {
                    leaderboardEl.innerHTML = data.leaderboard.map((s, i) => {
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                        const acc = (s.direction_accuracy * 100).toFixed(1);
                        const accClass = s.direction_accuracy >= 0.55 ? 'up' : s.direction_accuracy >= 0.5 ? 'neutral' : 'down';
                        return `
                            <div class="leaderboard-item">
                                <span>
                                    <span class="medal">${medal}</span>
                                    <span class="strategy-name">${s.name}</span>
                                </span>
                                <span class="accuracy ${accClass}">${acc}%</span>
                            </div>
                        `;
                    }).join('');
                }
                
                // Predictions table
                const tableEl = document.getElementById('predictions-table');
                if (data.predictions.length === 0) {
                    tableEl.innerHTML = '<tr><td colspan="5" style="color:#666">No predictions yet</td></tr>';
                } else {
                    tableEl.innerHTML = data.predictions.slice(0, 15).map(p => {
                        const dirClass = p.direction === 'up' ? 'up' : p.direction === 'down' ? 'down' : 'neutral';
                        const arrow = p.direction === 'up' ? '↑' : p.direction === 'down' ? '↓' : '→';
                        
                        let resultBadge;
                        if (!p.verified) {
                            resultBadge = '<span class="badge pending">Pending</span>';
                        } else if (p.direction_correct) {
                            resultBadge = '<span class="badge correct">✓ Correct</span>';
                        } else {
                            resultBadge = '<span class="badge incorrect">✗ Wrong</span>';
                        }
                        
                        return `
                            <tr>
                                <td>${p.target_date}</td>
                                <td>${p.symbol}</td>
                                <td>${p.strategy}</td>
                                <td class="${dirClass}">${arrow} ${p.direction} ${p.magnitude}</td>
                                <td>${resultBadge}</td>
                            </tr>
                        `;
                    }).join('');
                }
                
                // Update chart
                updateChart(data.chart_data);
                
                document.getElementById('last-updated').textContent = 
                    'Last updated: ' + new Date().toLocaleTimeString();
                    
            } catch (err) {
                console.error('Failed to load data:', err);
            }
        }
        
        function updateChart(chartData) {
            const ctx = document.getElementById('accuracy-chart').getContext('2d');
            
            if (chart) {
                chart.destroy();
            }
            
            if (!chartData || chartData.labels.length === 0) {
                return;
            }
            
            const colors = [
                '#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa'
            ];
            
            const datasets = chartData.strategies.map((strategy, i) => ({
                label: strategy,
                data: chartData.data[strategy] || [],
                borderColor: colors[i % colors.length],
                backgroundColor: 'transparent',
                tension: 0.3,
                borderWidth: 2
            }));
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#888' }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: '#333' },
                            ticks: { color: '#888' }
                        },
                        y: {
                            grid: { color: '#333' },
                            ticks: { 
                                color: '#888',
                                callback: v => v + '%'
                            },
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
        }
        
        // Load data on page load
        loadData();
        
        // Auto-refresh every 5 minutes
        setInterval(loadData, 5 * 60 * 1000);
    </script>
</body>
</html>
"""


@app.route('/')
def dashboard():
    """Serve the dashboard page"""
    return render_template_string(DASHBOARD_HTML)


@app.route('/api/dashboard-data')
def dashboard_data():
    """API endpoint for dashboard data"""
    db = Database(DB_PATH)
    engine = VerificationEngine(db)
    
    # Get summary
    summary = engine.get_verification_summary(days=30)
    
    # Get leaderboard data
    leaderboard = []
    for name, metrics in sorted(
        summary.by_strategy.items(),
        key=lambda x: x[1].get('direction_accuracy', 0),
        reverse=True
    ):
        leaderboard.append({
            'name': name,
            'direction_accuracy': metrics.get('direction_accuracy', 0),
            'magnitude_accuracy': metrics.get('magnitude_accuracy', 0),
            'total': metrics.get('total', 0)
        })
    
    # Get recent predictions
    recent = db.get_recent_predictions_with_results(limit=50)
    predictions = []
    for r in recent:
        pred = r['prediction']
        predictions.append({
            'target_date': pred.target_date.isoformat(),
            'symbol': pred.symbol,
            'strategy': pred.strategy_name,
            'direction': pred.direction.value,
            'magnitude': pred.magnitude.value,
            'confidence': pred.confidence,
            'verified': r['verified'],
            'direction_correct': r.get('direction_correct'),
            'actual_direction': r['actual_direction'].value if r['actual_direction'] else None,
            'price_change_pct': r.get('price_change_pct')
        })
    
    # Build chart data - rolling accuracy by strategy
    chart_data = build_chart_data(db)
    
    db.close()
    
    return jsonify({
        'summary': {
            'total_verified': summary.total_verified,
            'direction_accuracy': summary.direction_accuracy,
            'magnitude_accuracy': summary.magnitude_accuracy,
            'combined_accuracy': summary.combined_accuracy
        },
        'leaderboard': leaderboard,
        'predictions': predictions,
        'chart_data': chart_data
    })


def build_chart_data(db):
    """Build data for accuracy chart"""
    results = db.get_recent_predictions_with_results(limit=200)
    
    # Group by date and strategy
    by_date_strategy = {}
    for r in results:
        if not r['verified']:
            continue
        
        pred = r['prediction']
        date_str = pred.target_date.isoformat()
        strategy = pred.strategy_name
        
        key = (date_str, strategy)
        if key not in by_date_strategy:
            by_date_strategy[key] = {'correct': 0, 'total': 0}
        
        by_date_strategy[key]['total'] += 1
        if r['direction_correct']:
            by_date_strategy[key]['correct'] += 1
    
    # Get unique dates and strategies
    dates = sorted(set(k[0] for k in by_date_strategy.keys()))
    strategies = sorted(set(k[1] for k in by_date_strategy.keys()))
    
    # Build rolling accuracy (last 5 predictions per strategy)
    chart_data = {
        'labels': dates[-20:],  # Last 20 dates
        'strategies': strategies,
        'data': {}
    }
    
    for strategy in strategies:
        accuracies = []
        for date_str in chart_data['labels']:
            key = (date_str, strategy)
            if key in by_date_strategy and by_date_strategy[key]['total'] > 0:
                acc = by_date_strategy[key]['correct'] / by_date_strategy[key]['total'] * 100
                accuracies.append(round(acc, 1))
            else:
                accuracies.append(None)
        chart_data['data'][strategy] = accuracies
    
    return chart_data


@app.route('/api/prices')
def get_prices():
    """Get current prices"""
    db = Database(DB_PATH)
    data_service = DataIngestionService(db)
    
    # Fetch fresh prices
    records = data_service.fetch_and_store_current_prices()
    
    prices = [
        {
            'symbol': r.symbol,
            'price': r.price_usd,
            'timestamp': r.timestamp.isoformat()
        }
        for r in records
    ]
    
    db.close()
    return jsonify(prices)


@app.route('/api/run-predictions', methods=['POST'])
def run_predictions():
    """Trigger prediction run (for automation)"""
    from datetime import date, timedelta
    from strategies.base import ALL_STRATEGIES
    from data.coingecko import DEFAULT_COINS
    
    db = Database(DB_PATH)
    data_service = DataIngestionService(db)
    
    target_date = date.today() + timedelta(days=1)
    symbols = DEFAULT_COINS[:3]
    
    # Fetch data
    data_service.fetch_and_store_current_prices(symbols)
    for symbol in symbols:
        data_service.fetch_and_store_historical(symbol, days=30)
    
    # Run predictions
    predictions_made = 0
    for symbol in symbols:
        latest = db.get_latest_price(symbol)
        if not latest:
            continue
        
        start = datetime.now() - timedelta(days=60)
        end = datetime.now()
        history = db.get_prices(symbol, start, end)
        
        for strategy in ALL_STRATEGIES:
            output = strategy.predict(symbol, latest.price_usd, history, target_date)
            prediction = strategy.to_prediction_record(
                symbol, latest.price_usd, output, target_date
            )
            db.insert_prediction(prediction)
            predictions_made += 1
    
    db.close()
    
    return jsonify({
        'success': True,
        'predictions_made': predictions_made,
        'target_date': target_date.isoformat()
    })


if __name__ == '__main__':
    print("\n🔮 Market Prediction Dashboard")
    print("   http://localhost:5000")
    print("\n   Press Ctrl+C to stop\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
