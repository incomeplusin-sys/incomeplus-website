#!/usr/bin/env python3
"""
Breakout Scanner - Real-time breakout detection
Expected output format:
{
    "scanner": "breakout",
    "parameters": {...},
    "signals": [
        {
            "symbol": "RELIANCE",
            "type": "Bullish Breakout",
            "confidence": 85.5,
            "price": 2478.50,
            "price_change": 2.5,
            "volume": 15000000,
            "volume_change": 45.2,
            "details": {
                "breakout_level": 2450,
                "volume_multiplier": 2.3,
                "pattern": "Rectangle",
                "timeframe": "1H"
            }
        }
    ],
    "metadata": {
        "stocks_scanned": 50,
        "scan_time": "0.8s",
        "success_rate": "82%"
    }
}
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime
import yfinance as yf  # For real data - install: pip install yfinance

def fetch_real_time_data(symbols, period="1d", interval="15m"):
    """Fetch real-time data from Yahoo Finance"""
    data = {}
    for symbol in symbols:
        try:
            ticker = yf.Ticker(f"{symbol}.NS")
            hist = ticker.history(period=period, interval=interval)
            if not hist.empty:
                data[symbol] = {
                    'current_price': hist['Close'].iloc[-1],
                    'open': hist['Open'].iloc[-1],
                    'high': hist['High'].iloc[-1],
                    'low': hist['Low'].iloc[-1],
                    'volume': hist['Volume'].iloc[-1],
                    'change': hist['Close'].iloc[-1] - hist['Open'].iloc[-1],
                    'change_percent': ((hist['Close'].iloc[-1] - hist['Open'].iloc[-1]) / hist['Open'].iloc[-1]) * 100
                }
        except Exception as e:
            print(f"Error fetching {symbol}: {e}", file=sys.stderr)
    return data

def detect_breakouts(stock_data, params):
    """YOUR ACTUAL BREAKOUT DETECTION LOGIC"""
    signals = []
    
    for symbol, data in stock_data.items():
        # YOUR BREAKOUT ALGORITHM HERE
        # Example simple breakout detection:
        current_price = data['current_price']
        high = data['high']
        
        # Check if price is near recent high (breakout condition)
        if current_price >= high * 0.99:  # Within 1% of high
            volume_multiplier = data['volume'] / 1000000  # Simple volume calc
            
            signal = {
                'symbol': symbol,
                'type': 'Bullish Breakout',
                'confidence': min(95, 70 + (volume_multiplier * 5)),
                'price': round(current_price, 2),
                'price_change': round(data['change_percent'], 2),
                'volume': int(data['volume']),
                'volume_change': 0,  # You'd calculate this
                'details': {
                    'breakout_level': round(high, 2),
                    'volume_multiplier': round(volume_multiplier, 1),
                    'pattern': 'Price at High',
                    'timeframe': params.get('timeframe', '15m')
                }
            }
            
            if signal['confidence'] > 75:
                signals.append(signal)
    
    return signals

def run_breakout_scan(params):
    """Main scanner function"""
    # Get parameters from frontend
    symbols = params.get('symbols', ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'])
    timeframe = params.get('timeframe', '15m')
    consolidation_days = params.get('consolidation_days', 5)
    volume_threshold = params.get('volume_threshold', 1.5)
    
    # Fetch real-time data
    print(f"Fetching real-time data for {len(symbols)} stocks...", file=sys.stderr)
    stock_data = fetch_real_time_data(symbols, interval=timeframe)
    
    if not stock_data:
        return {
            'scanner': 'breakout',
            'parameters': params,
            'signals': [],
            'metadata': {
                'error': 'No data fetched',
                'stocks_scanned': len(symbols),
                'scan_time': '0s'
            }
        }
    
    # Run your breakout detection
    signals = detect_breakouts(stock_data, params)
    
    return {
        'scanner': 'breakout',
        'parameters': params,
        'signals': signals,
        'metadata': {
            'stocks_scanned': len(symbols),
            'signals_found': len(signals),
            'scan_time': 'real-time',
            'data_source': 'Yahoo Finance',
            'timestamp': datetime.now().isoformat()
        }
    }

if __name__ == "__main__":
    try:
        # Read parameters from command line
        if len(sys.argv) > 1:
            params = json.loads(sys.argv[1])
        else:
            params = {}
        
        # Run scanner
        results = run_breakout_scan(params)
        
        # Output JSON for PHP
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        error_result = {
            'scanner': 'breakout',
            'error': str(e),
            'signals': [],
            'metadata': {'error': str(e)}
        }
        print(json.dumps(error_result))
