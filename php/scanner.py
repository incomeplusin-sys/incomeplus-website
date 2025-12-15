"""
Volume Pattern Scanner with Web Integration
"""

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import warnings
warnings.filterwarnings('ignore')

class WebVolumeScanner:
    def __init__(self):
        self.stocks = self.get_indian_stocks()
        self.results = []
        
    def get_indian_stocks(self):
        """Get popular Indian stocks"""
        stocks = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
            "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LT.NS",
            "AXISBANK.NS", "BAJFINANCE.NS", "WIPRO.NS", "ONGC.NS", "NTPC.NS",
            "MARUTI.NS", "TITAN.NS", "ULTRACEMCO.NS", "SUNPHARMA.NS", "TATAMOTORS.NS"
        ]
        return stocks[:50]  # Limit for demo
    
    def fetch_stock_data(self, symbol, period="5d", interval="5m"):
        """Fetch stock data from Yahoo Finance"""
        try:
            stock = yf.download(
                symbol, 
                period=period, 
                interval=interval,
                progress=False
            )
            return stock if len(stock) >= 11 else None
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return None
    
    def detect_v_pattern(self, volumes):
        """Detect 5-candle V volume pattern"""
        if len(volumes) < 5:
            return False, 0
        
        last_5 = volumes[-5:]
        
        # Conditions for V pattern
        conditions = [
            last_5[2] == min(last_5),        # Candle 3 is lowest
            last_5[3] > last_5[2],           # Candle 4 > Candle 3
            last_5[4] > last_5[3],           # Candle 5 > Candle 4
            last_5[2] < last_5[0] * 0.8,     # Significant drop
            last_5[4] > last_5[2] * 1.5      # Significant recovery
        ]
        
        confidence = sum(conditions) * 20  # 20% per condition
        return all(conditions), confidence
    
    def detect_u_pattern(self, volumes):
        """Detect 6-candle U volume pattern"""
        if len(volumes) < 6:
            return False, 0
        
        last_6 = volumes[-6:]
        
        # Conditions for U pattern
        conditions = [
            last_6[2] < last_6[1],           # Decreasing
            last_6[3] < last_6[2],           # Still decreasing
            last_6[4] > last_6[3],           # Start increasing
            last_6[5] > last_6[4],           # Continue increasing
            abs(last_6[0] - last_6[5]) < last_6[0] * 0.2,  # Similar start/end
            last_6[3] < last_6[0] * 0.7      # Significant dip
        ]
        
        confidence = sum(conditions) * (100/6)  # Equal weight per condition
        return all(conditions), confidence
    
    def calculate_volume_change(self, volumes):
        """Calculate volume percentage changes"""
        if len(volumes) < 2:
            return 0
        
        changes = []
        for i in range(1, len(volumes)):
            if volumes[i-1] > 0:
                change = ((volumes[i] - volumes[i-1]) / volumes[i-1]) * 100
                changes.append(change)
        
        return np.mean(changes) if changes else 0
    
    def scan_stock(self, symbol, params):
        """Scan a single stock for volume patterns"""
        try:
            # Fetch data
            stock_data = self.fetch_stock_data(
                symbol, 
                period=params.get('period', '5d'),
                interval=params.get('interval', '5m')
            )
            
            if stock_data is None or len(stock_data) < 11:
                return None
            
            # Get volumes and prices
            volumes = stock_data['Volume'].values
            closes = stock_data['Close'].values
            
            # Current values
            current_price = closes[-1]
            prev_price = closes[-2] if len(closes) > 1 else current_price
            price_change = ((current_price - prev_price) / prev_price) * 100
            
            current_volume = volumes[-1]
            avg_volume = np.mean(volumes[-20:]) if len(volumes) >= 20 else current_volume
            volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
            
            # Apply filters
            if params.get('min_volume') and current_volume < params['min_volume']:
                return None
            
            if params.get('min_price') and current_price < params['min_price']:
                return None
            
            if params.get('max_price') and current_price > params['max_price']:
                return None
            
            if params.get('price_change') == 'positive' and price_change <= 0:
                return None
            
            if params.get('price_change') == 'negative' and price_change >= 0:
                return None
            
            if params.get('price_change') == 'strong' and abs(price_change) < 5:
                return None
            
            # Detect patterns
            v_detected, v_confidence = self.detect_v_pattern(volumes)
            u_detected, u_confidence = self.detect_u_pattern(volumes)
            
            pattern_type = None
            confidence = 0
            
            if params.get('pattern_type') == 'both':
                if v_detected and v_confidence > u_confidence:
                    pattern_type = 'V'
                    confidence = v_confidence
                elif u_detected:
                    pattern_type = 'U'
                    confidence = u_confidence
            elif params.get('pattern_type') == 'v' and v_detected:
                pattern_type = 'V'
                confidence = v_confidence
            elif params.get('pattern_type') == 'u' and u_detected:
                pattern_type = 'U'
                confidence = u_confidence
            
            # Check minimum confidence
            if not pattern_type or confidence < params.get('min_confidence', 50):
                return None
            
            # Calculate volume change percentage
            volume_change = self.calculate_volume_change(volumes[-6:])
            
            # Prepare result
            result = {
                'symbol': symbol.replace('.NS', ''),
                'pattern': pattern_type,
                'confidence': round(confidence, 1),
                'price': round(current_price, 2),
                'price_change': round(price_change, 2),
                'volume': int(current_volume),
                'avg_volume': int(avg_volume),
                'volume_ratio': round(volume_ratio, 2),
                'volume_change': round(volume_change, 2),
                'timestamp': datetime.now().isoformat(),
                'timeframe': params.get('interval', '5m')
            }
            
            return result
            
        except Exception as e:
            print(f"Error scanning {symbol}: {e}")
            return None
    
    def scan_all(self, params):
        """Scan all stocks with given parameters"""
        self.results = []
        
        print(f"🔍 Scanning {len(self.stocks)} stocks...")
        print(f"📊 Parameters: {json.dumps(params, indent=2)}")
        
        for i, symbol in enumerate(self.stocks, 1):
            print(f"  [{i}/{len(self.stocks)}] Scanning {symbol}...", end='\r')
            
            result = self.scan_stock(symbol, params)
            if result:
                self.results.append(result)
                print(f"  [{i}/{len(self.stocks)}] ✅ Pattern found in {result['symbol']}")
            else:
                print(f"  [{i}/{len(self.stocks)}] ❌ No pattern in {symbol.replace('.NS', '')}")
        
        print(f"\n✅ Scan complete. Found {len(self.results)} patterns.")
        return self.results
    
    def export_to_excel(self, filename=None):
        """Export results to Excel"""
        if not self.results:
            print("❌ No results to export")
            return None
        
        df = pd.DataFrame(self.results)
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"volume_patterns_{timestamp}.xlsx"
        
        # Add summary sheet
        summary = {
            'Total Scanned': [len(self.stocks)],
            'Patterns Found': [len(self.results)],
            'Success Rate': [f"{(len(self.results)/len(self.stocks))*100:.1f}%"],
            'V Patterns': [len([r for r in self.results if r['pattern'] == 'V'])],
            'U Patterns': [len([r for r in self.results if r['pattern'] == 'U'])],
            'Avg Confidence': [f"{np.mean([r['confidence'] for r in self.results]):.1f}%"],
            'Scan Time': [datetime.now().strftime("%Y-%m-%d %H:%M:%S")]
        }
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Pattern_Stocks', index=False)
            pd.DataFrame(summary).to_excel(writer, sheet_name='Summary', index=False)
        
        print(f"📊 Excel report saved: {filename}")
        return filename
    
    def get_json_results(self):
        """Get results as JSON for web API"""
        return {
            'success': True,
            'count': len(self.results),
            'results': self.results,
            'summary': {
                'total_scanned': len(self.stocks),
                'patterns_found': len(self.results),
                'success_rate': f"{(len(self.results)/len(self.stocks))*100:.1f}%",
                'v_patterns': len([r for r in self.results if r['pattern'] == 'V']),
                'u_patterns': len([r for r in self.results if r['pattern'] == 'U']),
                'avg_confidence': f"{np.mean([r['confidence'] for r in self.results]):.1f}%"
            }
        }

# Web API Handler (Flask example)
from flask import Flask, request, jsonify, render_template
import os

app = Flask(__name__)
scanner = WebVolumeScanner()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def api_scan():
    try:
        params = request.json
        
        # Default parameters
        scan_params = {
            'pattern_type': params.get('patternType', 'both'),
            'min_confidence': params.get('minConfidence', 50),
            'interval': params.get('timeFrame', '5m'),
            'period': '5d',
            'min_volume': params.get('minVolume'),
            'min_price': params.get('minPrice'),
            'max_price': params.get('maxPrice'),
            'price_change': params.get('priceChange')
        }
        
        # Run scan
        results = scanner.scan_all(scan_params)
        
        # Return JSON response
        return jsonify(scanner.get_json_results())
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/export', methods=['POST'])
def api_export():
    try:
        filename = scanner.export_to_excel()
        
        if filename:
            return jsonify({
                'success': True,
                'filename': filename,
                'download_url': f'/download/{filename}'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No results to export'
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(filename, as_attachment=True)

if __name__ == '__main__':
    # For development
    app.run(debug=True, port=5000)
