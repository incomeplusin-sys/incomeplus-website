#!/usr/bin/env python3
import json
import sys
import os

def main():
    result = {
        "success": True,
        "message": "Python connection test successful",
        "python_version": sys.version,
        "platform": sys.platform,
        "current_directory": os.getcwd(),
        "test": "OK",
        "scanners_available": [
            "breakout_scanner.py",
            "momentum_scanner.py", 
            "volume_scanner.py",
            "ma_crossover_scanner.py",
            "support_resistance_scanner.py",
            "gap_scanner.py",
            "new_highs_scanner.py",
            "bollinger_scanner.py",
            "earnings_scanner.py",
            "unusual_volume_scanner.py"
        ]
    }
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
