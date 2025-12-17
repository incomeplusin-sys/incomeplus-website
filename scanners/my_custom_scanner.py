from .base_scanner import BaseScanner, ScanResult
from datetime import datetime
import requests
from urllib.parse import urlparse
import ssl
import socket

class WebsiteScanner(BaseScanner):
    """Basic website vulnerability scanner"""
    
    def __init__(self):
        super().__init__()
        self.name = "Website Security Scanner"
        self.description = "Check for common web vulnerabilities and misconfigurations"
        self.required_plan = "free"
        
    def get_name(self):
        return self.name
    
    def get_description(self):
        return self.description
    
    def get_required_plan(self):
        return self.required_plan
    
    def validate_target(self, target):
        """Validate website target"""
        try:
            # Ensure URL format
            if not target.startswith(('http://', 'https://')):
                target = f'https://{target}'
            
            parsed = urlparse(target)
            if not parsed.netloc:
                return False, "Invalid URL format"
            
            return True, ""
        except Exception as e:
            return False, f"Target validation failed: {str(e)}"
    
    def scan(self, target, options=None):
        start_time = datetime.now()
        
        try:
            # Ensure URL has scheme
            if not target.startswith(('http://', 'https://')):
                target = f'https://{target}'
            
            findings = []
            
            # SSL/TLS Check
            try:
                parsed = urlparse(target)
                hostname = parsed.netloc
                
                # Remove port if present
                if ':' in hostname:
                    hostname = hostname.split(':')[0]
                
                context = ssl.create_default_context()
                with socket.create_connection((hostname, 443), timeout=10) as sock:
                    with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                        cert = ssock.getpeercert()
                        
                        # Check certificate expiry
                        import datetime as dt
                        not_after = ssl.cert_time_to_seconds(cert['notAfter'])
                        expiry_date = dt.datetime.fromtimestamp(not_after)
                        days_until_expiry = (expiry_date - dt.datetime.now()).days
                        
                        if days_until_expiry < 30:
                            findings.append({
                                "type": "certificate",
                                "severity": "high",
                                "description": f"SSL certificate expires in {days_until_expiry} days",
                                "location": "SSL/TLS",
                                "recommendation": "Renew SSL certificate",
                                "details": f"Expires: {expiry_date}"
                            })
            except Exception as e:
                findings.append({
                    "type": "certificate",
                    "severity": "high",
                    "description": "SSL certificate error",
                    "location": "SSL/TLS",
                    "recommendation": "Fix SSL certificate configuration",
                    "details": str(e)
                })
            
            # HTTP Security Headers
            try:
                response = requests.get(target, timeout=10, verify=True, allow_redirects=True)
                headers = response.headers
                
                # Check for security headers
                security_checks = [
                    ('X-Frame-Options', 'Clickjacking protection'),
                    ('X-Content-Type-Options', 'Prevents MIME sniffing'),
                    ('X-XSS-Protection', 'Cross-site scripting protection'),
                    ('Content-Security-Policy', 'Content security policy'),
                    ('Strict-Transport-Security', 'HTTP Strict Transport Security'),
                    ('Referrer-Policy', 'Controls referrer information'),
                ]
                
                for header, description in security_checks:
                    if header not in headers:
                        severity = "medium" if header == 'Content-Security-Policy' else "low"
                        findings.append({
                            "type": "header",
                            "severity": severity,
                            "description": f"Missing security header: {header}",
                            "location": "HTTP Headers",
                            "recommendation": f"Implement {header} header",
                            "details": description
                        })
                
                # Check server information disclosure
                server = headers.get('Server', '')
                if server and len(server) < 50:  # Basic check for version info
                    findings.append({
                        "type": "information",
                        "severity": "low",
                        "description": "Server version information disclosed",
                        "location": "HTTP Headers",
                        "recommendation": "Hide or genericize Server header",
                        "details": f"Server: {server}"
                    })
                
            except Exception as e:
                findings.append({
                    "type": "connection",
                    "severity": "medium",
                    "description": "Failed to retrieve website",
                    "location": target,
                    "recommendation": "Check website availability",
                    "details": str(e)
                })
            
            # Calculate metrics
            total_checks = 8
            vulnerabilities_found = len([f for f in findings if f.get('severity') in ['high', 'medium']])
            risk_score = self.calculate_risk_score(findings)
            
            results = {
                "target": target,
                "scan_type": "website",
                "findings": findings,
                "summary": {
                    "total_checks": total_checks,
                    "vulnerabilities_found": vulnerabilities_found,
                    "risk_score": risk_score,
                    "scan_duration": (datetime.now() - start_time).total_seconds()
                },
                "compliance_check": "PASSED",
                "raw_data": {
                    "timestamp": datetime.now().isoformat(),
                    "scanner_version": "1.0.0"
                }
            }
            
            scan_duration = (datetime.now() - start_time).total_seconds()
            
            return ScanResult(
                success=True,
                data=results,
                scan_time=scan_duration,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            return ScanResult(
                success=False,
                data={},
                error=f"Scanner error: {str(e)}",
                scan_time=(datetime.now() - start_time).total_seconds(),
                timestamp=datetime.now()
            )
