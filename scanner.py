"""
Complete Incomeplus Scanner with Web Integration
"""

import yfinance as yf
import pandas as pd
import numpy as np
import json
import warnings
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import time
import hashlib

warnings.filterwarnings('ignore')

class VolumePatternScanner:
    """Advanced Incomeplus Scanner for Indian stocks"""
    
    def __init__(self, config_file: str = None):
        self.stocks = self.load_indian_stocks()
        self.results = []
        self.config = self.load_config(config_file)
        
    def load_config(self, config_file: str = None) -> Dict:
        """Load configuration from file or use defaults"""
        default_config = {
            'api_timeout': 10,
            'max_retries': 3,
            'cache_duration': 300,  # 5 minutes
            'min_volume_threshold': 100000,
            'max_stocks_per_scan': 100,
            'confidence_threshold': 50,
            'patterns_to_detect': ['v_pattern', 'u_pattern'],
            'timeframes': ['5m', '15m', '1h', '1d']
        }
        
        if config_file and os.path.exists(config_file):
            with open(config_file, 'r') as f:
                return {**default_config, **json.load(f)}
        return default_config
    
    def load_indian_stocks(self) -> List[str]:
        """Load list of Indian stocks to scan"""
        # Top 100 Indian stocks by market cap
        stocks = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
            "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LT.NS",
            "AXISBANK.NS", "BAJFINANCE.NS", "WIPRO.NS", "ONGC.NS", "NTPC.NS",
            "MARUTI.NS", "TITAN.NS", "ULTRACEMCO.NS", "SUNPHARMA.NS", "TATAMOTORS.NS",
            "BAJAJFINSV.NS", "ASIANPAINT.NS", "POWERGRID.NS", "HINDUNILVR.NS", "BRITANNIA.NS",
            "HCLTECH.NS", "TECHM.NS", "INDUSINDBK.NS", "GRASIM.NS", "ADANIPORTS.NS",
            "SHREECEM.NS", "DRREDDY.NS", "HDFC.NS", "DIVISLAB.NS", "EICHERMOT.NS",
            "HEROMOTOCO.NS", "BAJAJ-AUTO.NS", "COALINDIA.NS", "IOC.NS", "BPCL.NS",
            "GAIL.NS", "HINDALCO.NS", "JSWSTEEL.NS", "TATASTEEL.NS", "VEDL.NS",
            "M&M.NS", "TATACONSUM.NS", "NESTLEIND.NS", "DABUR.NS", "PIDILITIND.NS",
            "CIPLA.NS", "SBILIFE.NS", "HDFCLIFE.NS", "ICICIPRULI.NS", "CHOLAFIN.NS",
            "BERGEPAINT.NS", "HAVELLS.NS", "AMBUJACEM.NS", "ACC.NS", "UPL.NS",
            "BHARATFORG.NS", "TATAPOWER.NS", "SIEMENS.NS", "BAJAJHLDNG.NS", "DMART.NS",
            "ADANIENT.NS", "ADANIGREEN.NS", "ADANITRANS.NS", "ADANIPOWER.NS", "ALKEM.NS",
            "AUROPHARMA.NS", "BANDHANBNK.NS", "BHEL.NS", "BIOCON.NS", "BOSCHLTD.NS",
            "CADILAHC.NS", "COLPAL.NS", "DLF.NS", "GODREJCP.NS", "GODREJPROP.NS",
            "HINDPETRO.NS", "IDEA.NS", "IGL.NS", "INFRATEL.NS", "JINDALSTEL.NS",
            "LUPIN.NS", "MANAPPURAM.NS", "MFSL.NS", "MRF.NS", "PEL.NS",
            "PFC.NS", "RECLTD.NS", "SAIL.NS", "SRF.NS", "TORNTPHARM.NS",
            "TORNTPOWER.NS", "TRENT.NS", "TVSMOTOR.NS", "YESBANK.NS", "ZEEL.NS"
        ]
        return stocks[:self.config.get('max_stocks_per_scan', 100)]
    
    def fetch_stock_data(self, symbol: str, period: str = "5d", interval: str = "5m") -> Optional[pd.DataFrame]:
        """Fetch stock data from Yahoo Finance with retry logic"""
        for attempt in range(self.config['max_retries']):
            try:
                stock = yf.download(
                    symbol,
                    period=period,
                    interval=interval,
                    progress=False,
                    timeout=self.config['api_timeout']
                )
                
                if len(stock) >= 6:  # Need at least 6 candles for patterns
                    return stock
                    
            except Exception as e:
                print(f"Attempt {attempt + 1} failed for {symbol}: {e}")
                if attempt < self.config['max_retries'] - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                continue
        
        return None
    
    def detect_v_pattern(self, volumes: np.ndarray) -> Tuple[bool, float]:
        """Detect 5-candle V volume pattern with confidence score"""
        if len(volumes) < 5:
            return False, 0
        
        last_5 = volumes[-5:]
        
        # Calculate statistics
        mean_volume = np.mean(last_5)
        std_volume = np.std(last_5)
        
        # Pattern conditions with weights
        conditions = [
            (last_5[2] == np.min(last_5), 0.25),  # Candle 3 is lowest
            (last_5[2] < last_5[0] * 0.7, 0.20),  # Significant drop (>30%)
            (last_5[3] > last_5[2], 0.15),        # Candle 4 > Candle 3
            (last_5[4] > last_5[3], 0.15),        # Candle 5 > Candle 4
            (last_5[4] > last_5[2] * 1.3, 0.25)   # Significant recovery (>30%)
        ]
        
        # Calculate weighted confidence
        confidence = sum(weight for condition, weight in conditions if condition) * 100
        
        # Check if all essential conditions are met
        essential_conditions = [conditions[0][0], conditions[1][0], conditions[4][0]]
        if not all(essential_conditions):
            confidence *= 0.5  # Reduce confidence if essential conditions not met
        
        return confidence >= 60, confidence
    
    def detect_u_pattern(self, volumes: np.ndarray) -> Tuple[bool, float]:
        """Detect 6-candle U volume pattern with confidence score"""
        if len(volumes) < 6:
            return False, 0
        
        last_6 = volumes[-6:]
        
        # Calculate statistics
        mean_volume = np.mean(last_6)
        std_volume = np.std(last_6)
        
        # Pattern conditions with weights
        conditions = [
            (last_6[2] < last_6[1], 0.15),          # Decreasing
            (last_6[3] < last_6[2], 0.15),          # Still decreasing
            (last_6[4] > last_6[3], 0.15),          # Start increasing
            (last_6[5] > last_6[4], 0.15),          # Continue increasing
            (abs(last_6[0] - last_6[5]) < mean_volume * 0.3, 0.20),  # Similar start/end
            (last_6[3] < last_6[0] * 0.6, 0.20)     # Significant dip (>40%)
        ]
        
        # Calculate weighted confidence
        confidence = sum(weight for condition, weight in conditions if condition) * 100
        
        # Check U-shaped symmetry
        if confidence >= 60:
            # Calculate symmetry score
            left_slope = (last_6[3] - last_6[0]) / 3
            right_slope = (last_6[5] - last_6[3]) / 3
            
            symmetry_ratio = min(abs(left_slope), abs(right_slope)) / max(abs(left_slope), abs(right_slope), 1)
            confidence *= symmetry_ratio
        
        return confidence >= 60, confidence
    
    def detect_volume_spike(self, volumes: np.ndarray) -> Tuple[bool, float]:
        """Detect abnormal volume spikes"""
        if len(volumes) < 10:
            return False, 0
        
        recent_volume = volumes[-1]
        avg_volume = np.mean(volumes[:-1])
        std_volume = np.std(volumes[:-1])
        
        # Calculate z-score
        z_score = (recent_volume - avg_volume) / std_volume if std_volume > 0 else 0
        
        # Volume spike detected if z-score > 2
        has_spike = z_score > 2
        confidence = min(z_score * 10, 100)  # Convert to percentage
        
        return has_spike, confidence
    
    def analyze_stock(self, symbol: str, params: Dict) -> Optional[Dict]:
        """Analyze a single stock for volume patterns"""
        try:
            print(f"  Analyzing {symbol}...")
            
            # Fetch data
            stock_data = self.fetch_stock_data(
                symbol,
                period=params.get('period', '5d'),
                interval=params.get('interval', '5m')
            )
            
            if stock_data is None or len(stock_data) < 6:
                return None
            
            # Extract volumes and prices
            volumes = stock_data['Volume'].values
            closes = stock_data['Close'].values
            highs = stock_data['High'].values
            lows = stock_data['Low'].values
            
            # Current values
            current_price = closes[-1]
            prev_price = closes[-2] if len(closes) > 1 else current_price
            price_change_pct = ((current_price - prev_price) / prev_price) * 100
            
            current_volume = volumes[-1]
            avg_volume = np.mean(volumes[-20:]) if len(volumes) >= 20 else np.mean(volumes)
            volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1
            
            # Apply filters
            if params.get('min_volume') and current_volume < params['min_volume']:
                return None
            
            if params.get('min_price') and current_price < params['min_price']:
                return None
            
            if params.get('max_price') and current_price > params['max_price']:
                return None
            
            if params.get('min_price_change') and abs(price_change_pct) < params['min_price_change']:
                return None
            
            if params.get('price_change') == 'positive' and price_change_pct <= 0:
                return None
            
            if params.get('price_change') == 'negative' and price_change_pct >= 0:
                return None
            
            # Detect patterns
            patterns_detected = []
            confidence_scores = []
            
            if 'v_pattern' in params.get('patterns', ['v_pattern', 'u_pattern']):
                v_detected, v_confidence = self.detect_v_pattern(volumes)
                if v_detected:
                    patterns_detected.append('V')
                    confidence_scores.append(v_confidence)
            
            if 'u_pattern' in params.get('patterns', ['v_pattern', 'u_pattern']):
                u_detected, u_confidence = self.detect_u_pattern(volumes)
                if u_detected:
                    patterns_detected.append('U')
                    confidence_scores.append(u_confidence)
            
            if 'volume_spike' in params.get('patterns', []):
                spike_detected, spike_confidence = self.detect_volume_spike(volumes)
                if spike_detected:
                    patterns_detected.append('Spike')
                    confidence_scores.append(spike_confidence)
            
            if not patterns_detected:
                return None
            
            # Calculate overall confidence
            overall_confidence = np.mean(confidence_scores) if confidence_scores else 0
            
            # Check minimum confidence threshold
            if overall_confidence < params.get('min_confidence', self.config['confidence_threshold']):
                return None
            
            # Calculate volume statistics
            volume_change_pct = self.calculate_volume_change(volumes[-6:])
            avg_volume_20 = np.mean(volumes[-20:]) if len(volumes) >= 20 else np.mean(volumes)
            
            # Calculate RSI (simplified)
            rsi = self.calculate_rsi(closes[-15:]) if len(closes) >= 15 else 50
            
            # Prepare result
            result = {
                'symbol': symbol.replace('.NS', ''),
                'company': self.get_company_name(symbol),
                'patterns': patterns_detected,
                'confidence': round(overall_confidence, 1),
                'price': round(current_price, 2),
                'price_change': round(price_change_pct, 2),
                'volume': int(current_volume),
                'avg_volume': int(avg_volume),
                'volume_ratio': round(volume_ratio, 2),
                'volume_change': round(volume_change_pct, 2),
                'rsi': round(rsi, 1),
                'high': round(highs[-1], 2),
                'low': round(lows[-1], 2),
                'timestamp': datetime.now().isoformat(),
                'timeframe': params.get('interval', '5m'),
                'period': params.get('period', '5d'),
                'patterns_detail': {
                    'V_pattern_confidence': v_confidence if 'v_pattern' in locals() else 0,
                    'U_pattern_confidence': u_confidence if 'u_pattern' in locals() else 0
                }
            }
            
            return result
            
        except Exception as e:
            print(f"Error analyzing {symbol}: {e}")
            return None
    
    def calculate_volume_change(self, volumes: np.ndarray) -> float:
        """Calculate volume percentage change"""
        if len(volumes) < 2:
            return 0
        
        changes = []
        for i in range(1, len(volumes)):
            if volumes[i-1] > 0:
                change = ((volumes[i] - volumes[i-1]) / volumes[i-1]) * 100
                changes.append(change)
        
        return np.mean(changes) if changes else 0
    
    def calculate_rsi(self, prices: np.ndarray, period: int = 14) -> float:
        """Calculate Relative Strength Index"""
        if len(prices) < period + 1:
            return 50
        
        deltas = np.diff(prices)
        seed = deltas[:period]
        up = seed[seed >= 0].sum() / period
        down = -seed[seed < 0].sum() / period
        
        for i in range(period, len(deltas)):
            delta = deltas[i]
            if delta > 0:
                upval = delta
                downval = 0
            else:
                upval = 0
                downval = -delta
            
            up = (up * (period - 1) + upval) / period
            down = (down * (period - 1) + downval) / period
        
        if down == 0:
            return 100
        elif up == 0:
            return 0
        
        rs = up / down
        rsi = 100 - (100 / (1 + rs))
        
        return rsi
    
    def get_company_name(self, symbol: str) -> str:
        """Get company name from symbol"""
        company_names = {
            'RELIANCE.NS': 'Reliance Industries',
            'TCS.NS': 'Tata Consultancy Services',
            'HDFCBANK.NS': 'HDFC Bank',
            'INFY.NS': 'Infosys',
            'ICICIBANK.NS': 'ICICI Bank',
            # Add more mappings as needed
        }
        return company_names.get(symbol, symbol.replace('.NS', ''))
    
    def scan_all(self, params: Dict) -> List[Dict]:
        """Scan all stocks with given parameters"""
        print(f"🔍 Starting volume pattern scan...")
        print(f"📊 Parameters: {json.dumps(params, indent=2)}")
        print(f"📈 Scanning {len(self.stocks)} stocks")
        print("=" * 60)
        
        self.results = []
        start_time = time.time()
        
        for i, symbol in enumerate(self.stocks, 1):
            result = self.analyze_stock(symbol, params)
            
            if result:
                self.results.append(result)
                print(f"✅ [{i}/{len(self.stocks)}] Pattern found in {result['symbol']}: {result['patterns']} ({result['confidence']}%)")
            else:
                print(f"❌ [{i}/{len(self.stocks)}] No pattern in {symbol.replace('.NS', '')}")
            
            # Rate limiting
            time.sleep(0.5)
        
        elapsed_time = time.time() - start_time
        
        print(f"\n✅ Scan completed in {elapsed_time:.1f} seconds")
        print(f"📊 Found {len(self.results)} patterns")
        
        return self.results
    
    def export_to_excel(self, filename: str = None) -> str:
        """Export results to Excel file"""
        if not self.results:
            print("❌ No results to export")
            return None
        
        df = pd.DataFrame(self.results)
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"volume_patterns_{timestamp}.xlsx"
        
        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Main results sheet
            df.to_excel(writer, sheet_name='Pattern_Stocks', index=False)
            
            # Summary sheet
            summary_data = {
                'Metric': [
                    'Total Stocks Scanned',
                    'Patterns Found',
                    'Success Rate',
                    'V Patterns Found',
                    'U Patterns Found',
                    'Average Confidence',
                    'Average Price Change',
                    'Average Volume Ratio',
                    'Scan Start Time',
                    'Scan Duration'
                ],
                'Value': [
                    len(self.stocks),
                    len(self.results),
                    f"{(len(self.results)/len(self.stocks))*100:.1f}%",
                    len([r for r in self.results if 'V' in r['patterns']]),
                    len([r for r in self.results if 'U' in r['patterns']]),
                    f"{np.mean([r['confidence'] for r in self.results]):.1f}%",
                    f"{np.mean([r['price_change'] for r in self.results]):.2f}%",
                    f"{np.mean([r['volume_ratio'] for r in self.results]):.2f}",
                    datetime.fromtimestamp(time.time() - (time.time() - start_time)).strftime('%Y-%m-%d %H:%M:%S'),
                    f"{(time.time() - start_time):.1f} seconds"
                ]
            }
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Patterns distribution sheet
            pattern_counts = {}
            for result in self.results:
                for pattern in result['patterns']:
                    pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
            
            pattern_df = pd.DataFrame({
                'Pattern': list(pattern_counts.keys()),
                'Count': list(pattern_counts.values())
            })
            pattern_df.to_excel(writer, sheet_name='Pattern_Distribution', index=False)
        
        print(f"📊 Excel report saved: {filename}")
        return filename
    
    def export_to_json(self, filename: str = None) -> str:
        """Export results to JSON file"""
        if not self.results:
            print("❌ No results to export")
            return None
        
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"volume_patterns_{timestamp}.json"
        
        export_data = {
            'scan_summary': {
                'total_scanned': len(self.stocks),
                'patterns_found': len(self.results),
                'success_rate': f"{(len(self.results)/len(self.stocks))*100:.1f}%",
                'scan_timestamp': datetime.now().isoformat()
            },
            'results': self.results
        }
        
        with open(filename, 'w') as f:
            json.dump(export_data, f, indent=2)
        
        print(f"📊 JSON report saved: {filename}")
        return filename
    
    def get_results_json(self) -> Dict:
        """Get results as JSON for web API"""
        if not self.results:
            return {
                'success': False,
                'error': 'No results available'
            }
        
        return {
            'success': True,
            'count': len(self.results),
            'results': self.results,
            'summary': {
                'total_scanned': len(self.stocks),
                'patterns_found': len(self.results),
                'success_rate': f"{(len(self.results)/len(self.stocks))*100:.1f}%",
                'v_patterns': len([r for r in self.results if 'V' in r['patterns']]),
                'u_patterns': len([r for r in self.results if 'U' in r['patterns']]),
                'avg_confidence': f"{np.mean([r['confidence'] for r in self.results]):.1f}%",
                'avg_price_change': f"{np.mean([r['price_change'] for r in self.results]):.2f}%"
            }
        }


# Web API Handler using Flask
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

scanner = VolumePatternScanner()

@app.route('/')
def index():
    return jsonify({
        'status': 'online',
        'service': 'Incomeplus Scanner API',
        'version': '1.0.0',
        'endpoints': {
            '/api/scan': 'POST - Run volume pattern scan',
            '/api/export/excel': 'GET - Export results to Excel',
            '/api/export/json': 'GET - Export results to JSON',
            '/api/stats': 'GET - Get scanner statistics'
        }
    })

@app.route('/api/scan', methods=['POST'])
def api_scan():
    """API endpoint for running scans"""
    try:
        params = request.json or {}
        
        # Default parameters
        scan_params = {
            'patterns': params.get('patterns', ['v_pattern', 'u_pattern']),
            'min_confidence': params.get('min_confidence', 60),
            'interval': params.get('timeframe', '5m'),
            'period': params.get('period', '5d'),
            'min_volume': params.get('min_volume'),
            'min_price': params.get('min_price'),
            'max_price': params.get('max_price'),
            'min_price_change': params.get('min_price_change'),
            'price_change': params.get('price_change')
        }
        
        # Run scan
        results = scanner.scan_all(scan_params)
        
        return jsonify(scanner.get_results_json())
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/export/excel', methods=['GET'])
def api_export_excel():
    """Export results to Excel"""
    try:
        filename = scanner.export_to_excel()
        
        if filename and os.path.exists(filename):
            return send_file(
                filename,
                as_attachment=True,
                download_name=os.path.basename(filename),
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:
            return jsonify({
                'success': False,
                'error': 'No results to export'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/export/json', methods=['GET'])
def api_export_json():
    """Export results to JSON"""
    try:
        filename = scanner.export_to_json()
        
        if filename and os.path.exists(filename):
            return send_file(
                filename,
                as_attachment=True,
                download_name=os.path.basename(filename),
                mimetype='application/json'
            )
        else:
            return jsonify({
                'success': False,
                'error': 'No results to export'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def api_stats():
    """Get scanner statistics"""
    return jsonify({
        'success': True,
        'stats': {
            'total_stocks': len(scanner.stocks),
            'config': scanner.config,
            'last_scan_count': len(scanner.results),
            'supported_patterns': ['V Pattern', 'U Pattern', 'Volume Spike'],
            'supported_timeframes': scanner.config['timeframes']
        }
    })

def main():
    """Main function for command line usage"""
    print("🎯 Incomeplus Scanner")
    print("=" * 50)
    print("📊 Professional volume analysis tool for Indian stocks")
    print("=" * 50)
    
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description='Incomeplus Scanner')
    parser.add_argument('--scan', action='store_true', help='Run scan')
    parser.add_argument('--export', choices=['excel', 'json'], help='Export format')
    parser.add_argument('--config', help='Configuration file')
    parser.add_argument('--params', help='Scan parameters as JSON string')
    
    args = parser.parse_args()
    
    # Load configuration
    if args.config:
        scanner.load_config(args.config)
    
    if args.scan:
        # Parse parameters
        params = {}
        if args.params:
            try:
                params = json.loads(args.params)
            except json.JSONDecodeError:
                print("❌ Invalid JSON parameters")
                return
        
        # Run scan
        scanner.scan_all(params)
        
        # Auto-export if specified
        if args.export == 'excel':
            scanner.export_to_excel()
        elif args.export == 'json':
            scanner.export_to_json()
            
    elif args.export and scanner.results:
        # Export existing results
        if args.export == 'excel':
            scanner.export_to_excel()
        elif args.export == 'json':
            scanner.export_to_json()
    else:
        # Interactive mode
        while True:
            print("\nOptions:")
            print("1. Run scan")
            print("2. Export to Excel")
            print("3. Export to JSON")
            print("4. Show results")
            print("5. Exit")
            
            choice = input("\nEnter choice (1-5): ").strip()
            
            if choice == '1':
                # Get scan parameters
                print("\nScan Parameters:")
                patterns = input("Patterns to detect (comma-separated: v_pattern,u_pattern,volume_spike): ").strip()
                min_confidence = input("Minimum confidence (default 60): ").strip()
                timeframe = input("Timeframe (5m,15m,1h,1d - default 5m): ").strip()
                period = input("Period (1d,5d,1mo,3mo - default 5d): ").strip()
                
                params = {
                    'patterns': [p.strip() for p in patterns.split(',')] if patterns else ['v_pattern', 'u_pattern'],
                    'min_confidence': int(min_confidence) if min_confidence else 60,
                    'interval': timeframe if timeframe else '5m',
                    'period': period if period else '5d'
                }
                
                scanner.scan_all(params)
                
            elif choice == '2':
                if scanner.results:
                    filename = scanner.export_to_excel()
                    if filename:
                        print(f"✅ Exported to: {filename}")
                else:
                    print("❌ No results to export")
                    
            elif choice == '3':
                if scanner.results:
                    filename = scanner.export_to_json()
                    if filename:
                        print(f"✅ Exported to: {filename}")
                else:
                    print("❌ No results to export")
                    
            elif choice == '4':
                if scanner.results:
                    print(f"\n📊 Found {len(scanner.results)} patterns:")
                    for result in scanner.results[:10]:  # Show first 10
                        print(f"  {result['symbol']}: {result['patterns']} ({result['confidence']}%)")
                    
                    if len(scanner.results) > 10:
                        print(f"  ... and {len(scanner.results) - 10} more")
                else:
                    print("❌ No results available")
                    
            elif choice == '5':
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice")

if __name__ == '__main__':
    # Run as web server if FLASK_APP is set, otherwise run in CLI mode
    if os.environ.get('FLASK_APP') == __file__:
        print("🚀 Starting Incomeplus Scanner API...")
        print(f"📡 API running at: http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        main()
