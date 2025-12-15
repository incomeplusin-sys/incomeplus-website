#!/usr/bin/env python3
"""
Volume Pattern Scanner for IncomePlus Website
Expected output format:
{
    "scanner": "volume",
    "parameters": {...},
    "signals": [
        {
            "symbol": "RELIANCE",
            "type": "V Pattern Detected",
            "confidence": 85.5,
            "price": 2478.50,
            "price_change": 2.5,
            "volume": 15000000,
            "volume_change": 45.2,
            "details": {...}
        }
    ],
    "metadata": {...}
}
"""

import json
import sys
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def get_indian_stocks():
    """Get popular Indian stocks with .NS suffix"""
    stocks = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
        "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS", "AXISBANK.NS",
        "LT.NS", "HCLTECH.NS", "BAJFINANCE.NS", "WIPRO.NS", "ONGC.NS",
        "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS", "ULTRACEMCO.NS", "NTPC.NS"
    ]
    return stocks[:50]  # Limit to 50 for performance

def detect_v_pattern(volumes):
    """Detect 5-candle V pattern in volume"""
    if len(volumes) < 5:
        return False
    
    last_5 = volumes[-5:]
    
    conditions = [
        last_5[2] == min(last_5),  # Candle 3 is lowest
        last_5[3] > last_5[2],     # Candle 4 > Candle 3
        last_5[4] > last_5[3],     # Candle 5 > Candle 4
        last_5[2] < last_5[0],     # Candle 3 < Candle 1
        last_5[2] < last_5[1],     # Candle 3 < Candle 2
        last_5[4] > last_5[0] * 1.2  # Volume recovery > 20%
    ]
    
    return all(conditions)

def detect_u_pattern(volumes):
    """Detect 6-candle U pattern in volume"""
    if len(volumes) < 6:
        return False
    
    last_6 = volumes[-6:]
    
    conditions = [
        last_6[2] < last_6[1],     # Candle 3 < Candle 2
        last_6[3] < last_6[2],     # Candle 4 < Candle 3 (lowest)
        last_6[4] > last_6[3],     # Candle 5 > Candle 4
        last_6[5] > last_6[4],     # Candle 6 > Candle 5
        last_6[3] < last_6[0] * 0.8,  # Lowest < 80% of first
        last_6[5] > last_6[0] * 1.1   # Recovery > 110% of first
    ]
    
    return all(conditions)

def detect_volume_surge(volumes):
    """Detect volume surge (current volume > 2x average)"""
    if len(volumes) < 10:
        return False
    
    avg_volume = sum(volumes[-10:-1]) / 9
    current_volume = volumes[-1]
    
    return current_volume > avg_volume * 2

def get_stock_data(symbol, period="1mo", interval="15m"):
    """Get stock data from Yahoo Finance"""
    try:
        stock = yf.download(symbol, period=period, interval=interval, progress=False)
        if len(stock) >= 6:  # Need at least 6 candles for patterns
            return stock
        return None
    except Exception as e:
        return None

def calculate_confidence(pattern_type, volume_change, price_change):
    """Calculate signal confidence score"""
    base_score = 70
    
    if pattern_type == "V Pattern":
        base_score += 10
    elif pattern_type == "U Pattern":
        base_score += 8
    elif pattern_type == "Volume Surge":
        base_score += 5
    
    # Volume change bonus
    if volume_change > 100:
        base_score += 10
    elif volume_change > 50:
        base_score += 5
    
    # Price change alignment
    if price_change > 0:  # Price going up with volume
        base_score += 5
    
    return min(95, base_score)

def run_volume_scan(params):
    """Main scanner function"""
    # Get parameters
    timeframe = params.get('timeframe', '15m')
    min_confidence = params.get('min_confidence', 70)
    max_stocks = params.get('max_stocks', 20)
    
    # Map timeframe to Yahoo Finance intervals
    interval_map = {
        '5m': '5m', '15m': '15m', '30m': '30m', 
        '1H': '60m', '4H': '60m', '1D': '1d'
    }
    interval = interval_map.get(timeframe, '15m')
    
    # Get stocks to scan
    stocks_to_scan = get_indian_stocks()[:max_stocks]
    
    signals = []
    stocks_scanned = 0
    
    for symbol in stocks_to_scan:
        try:
            # Fetch data
            stock_data = get_stock_data(symbol, period="5d", interval=interval)
            
            if stock_data is None or len(stock_data) < 6:
                continue
            
            stocks_scanned += 1
            
            # Get volumes and prices
            volumes = stock_data['Volume'].values
            closes = stock_data['Close'].values
            
            # Detect patterns
            v_detected = detect_v_pattern(volumes)
            u_detected = detect_u_pattern(volumes)
            surge_detected = detect_volume_surge(volumes)
            
            if not (v_detected or u_detected or surge_detected):
                continue
            
            # Calculate metrics
            current_price = closes[-1]
            prev_price = closes[-2] if len(closes) > 1 else closes[-1]
            price_change_pct = ((current_price - prev_price) / prev_price * 100) if prev_price > 0 else 0
            
            current_volume = volumes[-1]
            avg_volume_10 = sum(volumes[-11:-1]) / 10 if len(volumes) > 10 else current_volume
            volume_change_pct = ((current_volume - avg_volume_10) / avg_volume_10 * 100) if avg_volume_10 > 0 else 0
            
            # Determine pattern type
            if v_detected:
                pattern_type = "V Pattern"
                pattern_desc = "5-candle V formation in volume"
            elif u_detected:
                pattern_type = "U Pattern"
                pattern_desc = "6-candle U formation in volume"
            else:
                pattern_type = "Volume Surge"
                pattern_desc = "Current volume > 2x 10-period average"
            
            # Calculate confidence
            confidence = calculate_confidence(pattern_type, volume_change_pct, price_change_pct)
            
            if confidence < min_confidence:
                continue
            
            # Create signal
            signal = {
                'symbol': symbol.replace('.NS', ''),
                'type': pattern_type,
                'confidence': round(confidence, 1),
                'price': round(current_price, 2),
                'price_change': round(price_change_pct, 2),
                'volume': int(current_volume),
                'volume_change': round(volume_change_pct, 2),
                'details': {
                    'pattern_description': pattern_desc,
                    'timeframe': timeframe,
                    'volume_multiplier': round(current_volume / avg_volume_10, 2),
                    'price_trend': 'Bullish' if price_change_pct > 0 else 'Bearish',
                    'avg_volume_10': int(avg_volume_10),
                    'pattern_candles': '5-candle' if v_detected else '6-candle' if u_detected else 'Surge'
                }
            }
            
            signals.append(signal)
            
        except Exception as e:
            continue
    
    return {
        'scanner': 'volume',
        'parameters': params,
        'signals': signals,
        'metadata': {
            'stocks_scanned': stocks_scanned,
            'signals_found': len(signals),
            'success_rate': f"{round((len(signals) / stocks_scanned * 100), 1)}%" if stocks_scanned > 0 else "0%",
            'scan_time': datetime.now().isoformat(),
            'data_source': 'Yahoo Finance',
            'patterns_detected': {
                'v_patterns': len([s for s in signals if s['type'] == 'V Pattern']),
                'u_patterns': len([s for s in signals if s['type'] == 'U Pattern']),
                'volume_surges': len([s for s in signals if s['type'] == 'Volume Surge'])
            }
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
        results = run_volume_scan(params)
        
        # Output JSON for PHP
        print(json.dumps(results, indent=2))
        
    except Exception as e:
        error_result = {
            'scanner': 'volume',
            'error': str(e),
            'signals': [],
            'metadata': {'error': str(e)}
        }
        print(json.dumps(error_result))
