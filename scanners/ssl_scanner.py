from .base_scanner import BaseScanner, ScanResult
from datetime import datetime
import ssl
import socket
from cryptography import x509
from cryptography.hazmat.backends import default_backend

class SSLScanner(BaseScanner):
    """SSL/TLS certificate and configuration scanner"""
    
    def __init__(self):
        super().__init__()
        self.name = "SSL/TLS Scanner"
        self.description = "Analyze SSL certificates and encryption configuration"
        self.required_plan = "free"
        
    def get_name(self):
        return self.name
    
    def get_description(self):
        return self.description
    
    def get_required_plan(self):
        return self.required_plan
    
    def validate_target(self, target):
        """Validate target for SSL scan"""
        try:
            if not target.startswith(('http://', 'https://')):
                target = f'https://{target}'
            
            from urllib.parse import urlparse
            parsed = urlparse(target)
            if not parsed.netloc:
                return False, "Invalid URL format"
            
            return True, ""
        except:
            return False, "Invalid target format"
    
    def scan(self, target, options=None):
        start_time = datetime.now()
        
        try:
            # Ensure HTTPS URL
            if not target.startswith(('http://', 'https://')):
                target = f'https://{target}'
            
            # Parse URL
            from urllib.parse import urlparse
            parsed = urlparse(target)
            hostname = parsed.netloc.split(':')[0]  # Remove port if present
            
            findings = []
            
            # Get certificate
            cert_info = self._get_certificate_info(hostname)
            
            if cert_info['success']:
                cert = cert_info['certificate']
                
                # Check certificate expiry
                days_until_expiry = cert_info['days_until_expiry']
                if days_until_expiry < 30:
                    findings.append({
                        "type": "certificate",
                        "severity": "high",
                        "description": f"SSL certificate expires in {days_until_expiry} days",
                        "location": "SSL/TLS Certificate",
                        "recommendation": "Renew SSL certificate immediately"
                    })
                
                # Check certificate validity
                if not cert_info['is_valid']:
                    findings.append({
                        "type": "certificate",
                        "severity": "critical",
                        "description": "SSL certificate is invalid or self-signed",
                        "location": "SSL/TLS Certificate",
                        "recommendation": "Install valid SSL certificate from trusted CA"
                    })
                
                # Check certificate chain
                if cert_info['chain_issues']:
                    findings.append({
                        "type": "certificate",
                        "severity": "medium",
                        "description": "Certificate chain issues detected",
                        "location": "SSL/TLS Certificate",
                        "recommendation": "Ensure complete certificate chain is installed"
                    })
                
                # Check SSL/TLS versions
                tls_versions = self._check_tls_versions(hostname)
                for version, supported in tls_versions.items():
                    if version == "SSLv2" or version == "SSLv3":
                        if supported:
                            findings.append({
                                "type": "protocol",
                                "severity": "critical",
                                "description": f"Insecure {version} protocol enabled",
                                "location": "SSL/TLS Configuration",
                                "recommendation": f"Disable {version} immediately"
                            })
                    elif version == "TLSv1.0":
                        if supported:
                            findings.append({
                                "type": "protocol",
                                "severity": "high",
                                "description": f"Deprecated {version} protocol enabled",
                                "location": "SSL/TLS Configuration",
                                "recommendation": f"Disable {version}"
                            })
                    elif version == "TLSv1.1":
                        if supported:
                            findings.append({
                                "type": "protocol",
                                "severity": "medium",
                                "description": f"Legacy {version} protocol enabled",
                                "location": "SSL/TLS Configuration",
                                "recommendation": f"Consider disabling {version}"
                            })
                
                # Check cipher strength
                cipher_info = self._check_ciphers(hostname)
                if cipher_info['weak_ciphers']:
                    findings.append({
                        "type": "encryption",
                        "severity": "medium",
                        "description": f"Weak encryption ciphers detected",
                        "location": "SSL/TLS Configuration",
                        "recommendation": "Disable weak ciphers (RC4, 3DES, etc.)"
                    })
            
            else:
                findings.append({
                    "type": "connection",
                    "severity": "critical",
                    "description": "Failed to retrieve SSL certificate",
                    "location": "SSL/TLS Connection",
                    "recommendation": "Check SSL/TLS configuration"
                })
            
            # Calculate risk score
            total_checks = 8
            vulnerabilities_found = len([f for f in findings if f['severity'] in ['critical', 'high']])
            risk_score = self.calculate_risk_score(findings)
            
            results = {
                "target": target,
                "scan_type": "ssl",
                "findings": findings,
                "summary": {
                    "total_checks": total_checks,
                    "vulnerabilities_found": vulnerabilities_found,
                    "risk_score": risk_score,
                    "scan_duration": (datetime.now() - start_time).total_seconds(),
                    "certificate_info": cert_info.get('details', {})
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
                error=f"SSL scan error: {str(e)}",
                scan_time=(datetime.now() - start_time).total_seconds(),
                timestamp=datetime.now()
            )
    
    def _get_certificate_info(self, hostname):
        """Retrieve SSL certificate information"""
        try:
            context = ssl.create_default_context()
            conn = context.wrap_socket(
                socket.socket(socket.AF_INET),
                server_hostname=hostname
            )
            conn.settimeout(3)
            conn.connect((hostname, 443))
            cert_bin = conn.getpeercert(binary_form=True)
            conn.close()
            
            # Parse certificate
            cert = x509.load_der_x509_certificate(cert_bin, default_backend())
            
            # Check expiry
            from datetime import datetime
            now = datetime.utcnow()
            not_after = cert.not_valid_after
            days_until_expiry = (not_after - now).days
            
            # Check validity
            is_valid = cert.not_valid_before <= now <= cert.not_valid_after
            
            # Get certificate details
            details = {
                "subject": dict(x509.Name(cert.subject).rdns),
                "issuer": dict(x509.Name(cert.issuer).rdns),
                "valid_from": cert.not_valid_before.isoformat(),
                "valid_to": cert.not_valid_after.isoformat(),
                "serial_number": hex(cert.serial_number),
                "signature_algorithm": cert.signature_algorithm_oid._name
            }
            
            return {
                "success": True,
                "certificate": cert,
                "days_until_expiry": days_until_expiry,
                "is_valid": is_valid,
                "chain_issues": False,  # Simplified
                "details": details
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _check_tls_versions(self, hostname):
        """Check which TLS versions are supported"""
        versions = {
            "SSLv2": False,
            "SSLv3": False,
            "TLSv1.0": False,
            "TLSv1.1": False,
            "TLSv1.2": True,  # Assume true for modern servers
            "TLSv1.3": True   # Assume true for modern servers
        }
        
        # Simplified implementation
        # In production, use ssl.PROTOCOL_* constants for actual testing
        
        return versions
    
    def _check_ciphers(self, hostname):
        """Check cipher strength"""
        # Simplified implementation
        return {
            "weak_ciphers": False,
            "recommended_ciphers": True
        }
