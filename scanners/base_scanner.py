from abc import ABC, abstractmethod
from datetime import datetime
import json
import hashlib
import logging
from models import db, Scan

logger = logging.getLogger(__name__)

class ScanResult:
    def __init__(self, success=False, data=None, error=None, scan_time=0, timestamp=None):
        self.success = success
        self.data = data or {}
        self.error = error
        self.scan_time = scan_time
        self.timestamp = timestamp or datetime.utcnow()
    
    def to_dict(self):
        return {
            'success': self.success,
            'data': self.data,
            'error': self.error,
            'scan_time': self.scan_time,
            'timestamp': self.timestamp.isoformat()
        }

class BaseScanner(ABC):
    """Base class for all scanners"""
    
    def __init__(self):
        self.scan_id = None
        self.target = None
        self.user_id = None
        self.plan_type = None
        self.start_time = None
        
    @abstractmethod
    def get_name(self):
        """Return scanner name"""
        pass
    
    @abstractmethod
    def get_description(self):
        """Return scanner description"""
        pass
    
    @abstractmethod
    def get_required_plan(self):
        """Return required plan type"""
        pass
    
    @abstractmethod
    def validate_target(self, target):
        """Validate target before scanning"""
        pass
    
    @abstractmethod
    def scan(self, target, options=None):
        """Perform the actual scan"""
        pass
    
    def run(self, scan_id, target, user_id, plan_type, options=None):
        """Main method to run scanner"""
        self.scan_id = scan_id
        self.target = target
        self.user_id = user_id
        self.plan_type = plan_type
        self.start_time = datetime.utcnow()
        
        try:
            # Update scan status
            scan = Scan.query.get(scan_id)
            if not scan:
                logger.error(f"Scan {scan_id} not found")
                return
            
            scan.status = 'running'
            scan.started_at = self.start_time
            db.session.commit()
            
            # Validate plan
            required_plan = self.get_required_plan()
            if required_plan != 'free' and plan_type == 'free':
                scan.status = 'failed'
                scan.findings = {'error': f'Scanner requires {required_plan} plan'}
                db.session.commit()
                return
            
            # Validate target
            is_valid, message = self.validate_target(target)
            if not is_valid:
                scan.status = 'blocked'
                scan.findings = {'error': message}
                db.session.commit()
                return
            
            # Perform scan
            logger.info(f"Starting scan {scan_id} on {target}")
            result = self.scan(target, options)
            
            # Process result
            scan_duration = (datetime.utcnow() - self.start_time).total_seconds()
            
            if result.success:
                scan.status = 'completed'
                scan.completed_at = datetime.utcnow()
                scan.findings = result.data
                scan.risk_score = result.data.get('summary', {}).get('risk_score', 0)
                scan.progress = 100
                
                # Store in S3 for large results
                result_json = json.dumps(result.data, default=str)
                if len(result_json) > 10000:  # 10KB threshold
                    s3_key = self.store_in_s3(result_json)
                    scan.s3_key = s3_key
                else:
                    scan.findings = result.data
            else:
                scan.status = 'failed'
                scan.findings = {'error': result.error}
            
            db.session.commit()
            logger.info(f"Completed scan {scan_id} in {scan_duration:.2f}s")
            
        except Exception as e:
            logger.error(f"Error running scan {scan_id}: {str(e)}")
            
            scan = Scan.query.get(scan_id)
            if scan:
                scan.status = 'failed'
                scan.findings = {'error': f'Scanner error: {str(e)}'}
                db.session.commit()
    
    def store_in_s3(self, data):
        """Store large scan results in S3"""
        try:
            from app import s3_client, S3_BUCKET
            
            # Create unique key
            key = f"scans/{self.user_id}/{self.scan_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
            
            # Upload to S3
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=key,
                Body=data,
                ContentType='application/json',
                Metadata={
                    'user_id': str(self.user_id),
                    'scan_id': str(self.scan_id),
                    'target': self.target
                }
            )
            
            return key
        except Exception as e:
            logger.error(f"Failed to store in S3: {str(e)}")
            return None
    
    def get_from_s3(self, key):
        """Retrieve scan results from S3"""
        try:
            from app import s3_client, S3_BUCKET
            
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
            data = response['Body'].read().decode('utf-8')
            return json.loads(data)
        except Exception as e:
            logger.error(f"Failed to retrieve from S3: {str(e)}")
            return None
    
    def calculate_risk_score(self, findings):
        """Calculate overall risk score based on findings"""
        if not findings:
            return 0
        
        severity_weights = {
            'critical': 10,
            'high': 7.5,
            'medium': 5,
            'low': 2.5,
            'info': 1
        }
        
        total_score = 0
        max_score = len(findings) * 10
        
        for finding in findings:
            severity = finding.get('severity', 'info').lower()
            weight = severity_weights.get(severity, 1)
            total_score += weight
        
        # Normalize to 0-10 scale
        if max_score > 0:
            return (total_score / max_score) * 10
        return 0

# Factory function to create scanner instances
def create_scanner(scan_type):
    scanners = {
        'port': 'PortScanner',
        'ssl': 'SSLScanner',
        'website': 'WebsiteScanner',
        'custom': 'MyCustomScanner'
    }
    
    scanner_class = scanners.get(scan_type)
    if not scanner_class:
        return None
    
    # Import and create scanner
    if scanner_class == 'PortScanner':
        from .port_scanner import PortScanner
        return PortScanner()
    elif scanner_class == 'SSLScanner':
        from .ssl_scanner import SSLScanner
        return SSLScanner()
    elif scanner_class == 'WebsiteScanner':
        from .website_scanner import WebsiteScanner
        return WebsiteScanner()
    elif scanner_class == 'MyCustomScanner':
        from .my_custom_scanner import MyCustomScanner
        return MyCustomScanner()
    
    return None

def run_scan(scan_id, target, scan_type, user_id, plan_type, options=None):
    """Entry point for RQ jobs"""
    scanner = create_scanner(scan_type)
    if scanner:
        scanner.run(scan_id, target, user_id, plan_type, options)
    else:
        logger.error(f"Unknown scanner type: {scan_type}")
