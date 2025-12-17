"""
Utility functions for IncomePlus
"""

import hashlib
import random
import string
import json
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def generate_api_key(length=32):
    """Generate secure API key"""
    characters = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(random.choice(characters) for _ in range(length))

def hash_password(password):
    """Hash password using SHA-256 with salt"""
    salt = generate_api_key(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{hashed}:{salt}"

def verify_password(password, hashed_password):
    """Verify password against hash"""
    try:
        stored_hash, salt = hashed_password.split(':')
        new_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return new_hash == stored_hash
    except:
        return False

def validate_target(target):
    """Validate target URL/domain"""
    import re
    
    # Basic URL validation
    url_pattern = re.compile(
        r'^(https?://)?'  # http:// or https://
        r'(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)'  # domain
        r'(:\d+)?'  # optional port
        r'(/.*)?$', re.IGNORECASE)
    
    # IP address pattern
    ip_pattern = re.compile(
        r'^(\d{1,3}\.){3}\d{1,3}$'
    )
    
    return bool(url_pattern.match(target) or ip_pattern.match(target))

def is_blacklisted(target):
    """Check if target is blacklisted"""
    blacklisted = [
        '.gov.in', '.nic.in', '.mil.in', '.gov.', '.mil.',
        'localhost', '127.0.0.1', '192.168.', '10.', '172.16.'
    ]
    
    target_lower = target.lower()
    for blacklisted_item in blacklisted:
        if blacklisted_item in target_lower:
            return True
    return False

def format_scan_results(results):
    """Format scan results for display"""
    if not isinstance(results, dict):
        return {}
    
    formatted = {
        'summary': results.get('summary', {}),
        'findings': results.get('findings', []),
        'compliance_check': results.get('compliance_check', 'PASSED')
    }
    
    # Add risk level
    risk_score = formatted['summary'].get('risk_score', 0)
    if risk_score >= 8:
        formatted['risk_level'] = 'CRITICAL'
    elif risk_score >= 6:
        formatted['risk_level'] = 'HIGH'
    elif risk_score >= 4:
        formatted['risk_level'] = 'MEDIUM'
    elif risk_score >= 2:
        formatted['risk_level'] = 'LOW'
    else:
        formatted['risk_level'] = 'INFO'
    
    return formatted

def generate_report_id():
    """Generate unique report ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"REP-{timestamp}-{random_str}"

def calculate_risk_score(findings):
    """Calculate overall risk score from findings"""
    severity_weights = {
        'critical': 10,
        'high': 7,
        'medium': 4,
        'low': 2,
        'info': 1
    }
    
    total_score = 0
    for finding in findings:
        severity = finding.get('severity', 'info').lower()
        weight = severity_weights.get(severity, 1)
        total_score += weight
    
    # Normalize to 0-10 scale
    max_possible = len(findings) * 10
    if max_possible > 0:
        normalized_score = (total_score / max_possible) * 10
        return round(normalized_score, 1)
    
    return 0

def sanitize_input(data):
    """Sanitize user input to prevent XSS"""
    if isinstance(data, str):
        # Basic HTML escaping
        data = data.replace('&', '&amp;')
        data = data.replace('<', '&lt;')
        data = data.replace('>', '&gt;')
        data = data.replace('"', '&quot;')
        data = data.replace("'", '&#x27;')
    return data

def log_activity(user_id, action, details=None, ip_address=None):
    """Log user activity for audit trail"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'user_id': user_id,
        'action': action,
        'details': details,
        'ip_address': ip_address
    }
    
    logger.info(f"Activity: {json.dumps(log_entry)}")
    return log_entry

def format_file_size(bytes_size):
    """Format file size in human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} TB"

def get_plan_limits(plan_type):
    """Get scan limits for each plan"""
    limits = {
        'free': {
            'daily_scans': 3,
            'max_scan_time': 300,
            'data_retention_days': 7,
            'scanners': ['website', 'ssl', 'port']
        },
        'pro': {
            'daily_scans': 100,
            'max_scan_time': 600,
            'data_retention_days': 365,
            'scanners': ['website', 'ssl', 'port', 'custom']
        },
        'enterprise': {
            'daily_scans': 1000,
            'max_scan_time': 1800,
            'data_retention_days': 365,
            'scanners': ['website', 'ssl', 'port', 'custom', 'api']
        }
    }
    
    return limits.get(plan_type, limits['free'])
