#!/usr/bin/env python3
"""
Market Prediction Engine - Web Dashboard

A simple Flask app that displays:
- Current predictions
- Strategy leaderboard
- Historical accuracy charts
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from flask import Flask, render_template, jsonify

sys.path.insert(0, str(Path(__file__).parent.parent))

from data.models import get_session, Prediction, Outcome, StrategyStats
from verification import PredictionVerifier


def create_app():
    """Create and configure the Flask app."""
    app = Flask(__name__)
    
    @app.route("/")
    def index():
        """Main dashboard page."""
        return render_template("index.html")
    
    @app.route("/api/predictions")
    def api_predictions():
        """Get recent predictions."""
        session = get_session()
        try:
            predictions = session.query(Prediction)\
                .order_by(Prediction.prediction_time.desc())\
                .limit(50)\
                .all()
            
            return jsonify([
                {
                    "id": p.id,
                    "symbol": p.symbol,
                    "strategy": p.strategy_name,
                    "direction": p.predicted_direction.value,
                    "magnitude": p.predicted_magnitude.value,
                    "confidence": p.confidence,
                    "price_at_prediction": p.price_at_prediction,
                    "prediction_time": p.prediction_time.isoformat(),
                    "target_time": p.target_time.isoformat(),
                    "outcome": {
                        "actual_direction": p.outcome.actual_direction.value,
                        "actual_magnitude": p.outcome.actual_magnitude.value,
                        "actual_change_pct": p.outcome.actual_price_change_pct,
                        "direction_correct": bool(p.outcome.direction_correct),
                        "magnitude_correct": bool(p.outcome.magnitude_correct)
                    } if p.outcome else None
                }
                for p in predictions
            ])
        finally:
            session.close()
    
    @app.route("/api/strategies")
    def api_strategies():
        """Get strategy performance data."""
        verifier = PredictionVerifier()
        strategies = verifier.get_strategy_performance()
        return jsonify(strategies)
    
    @app.route("/api/summary")
    def api_summary():
        """Get overall summary statistics."""
        verifier = PredictionVerifier()
        summary = verifier.get_verification_summary()
        return jsonify(summary)
    
    @app.route("/api/history/<symbol>")
    def api_history(symbol):
        """Get prediction history for a specific symbol."""
        session = get_session()
        try:
            predictions = session.query(Prediction)\
                .filter(Prediction.symbol == symbol)\
                .filter(Prediction.outcome != None)\
                .order_by(Prediction.prediction_time.asc())\
                .limit(100)\
                .all()
            
            return jsonify([
                {
                    "date": p.prediction_time.isoformat(),
                    "predicted_direction": p.predicted_direction.value,
                    "actual_direction": p.outcome.actual_direction.value,
                    "actual_change_pct": p.outcome.actual_price_change_pct,
                    "direction_correct": bool(p.outcome.direction_correct),
                    "strategy": p.strategy_name
                }
                for p in predictions
            ])
        finally:
            session.close()
    
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
