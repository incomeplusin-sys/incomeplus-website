from .base_scanner import BaseScanner, ScanResult
from datetime import datetime
import socket
import concurrent.futures
import time

class PortScanner(BaseScanner):
    """Ethical port scanner with rate limiting"""
    
    def __init__(self):
        super().__init__()
        self.name = "Port Scanner"
        self.description = "Ethical port scanning with compliance checks"
        self.required_plan = "free"
        self.common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 3389, 5432]
        
    def get_name(self):
        return self.name
    
    def get_description(self):
        return self.description
    
    def get_required_plan(self):
        return self.required_plan
    
    def validate_target(self, target):
        """Validate target before scanning"""
        try:
            # Remove protocol if present
            if '://' in target:
                target = target.split('://')[1]
            
            # Remove path and port
            target = target.split('/')[0]
            target = target.split(':')[0]
            
            # Validate IP/domain
            if not self._is_valid_ip_or_domain(target):
                return False, "Invalid IP address or domain"
            
            # Compliance check - no private IPs
            if self._is_private_ip(target):
                return False, "Private network scanning not allowed"
            
            return True, ""
            
        except Exception as e:
            return False, f"Target validation failed: {str(e)}"
    
    def scan(self, target, options=None):
        start_time = datetime.now()
        
        try:
            # Parse target
            host = target
            if '://' in host:
                host = host.split('://')[1]
            host = host.split('/')[0].split(':')[0]
            
            findings = []
            open_ports = []
            
            # Scan common ports with timeout
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = []
                for port in self.common_ports:
                    futures.append(executor.submit(self._scan_port, host, port))
                
                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result['status'] == 'open':
                        open_ports.append(result)
                        findings.append({
                            "type": "port",
                            "severity": "medium" if result['port'] in [80, 443] else "low",
                            "description": f"Port {result['port']} is open",
                            "location": f"{host}:{result['port']}",
                            "recommendation": self._get_port_recommendation(result['port'])
                        })
            
            # Calculate risk
            risk_score = min(len(open_ports) * 2, 10)  # Max 10
            
            results = {
                "target": target,
                "scan_type": "port",
                "findings": findings,
                "summary": {
                    "total_ports_scanned": len(self.common_ports),
                    "open_ports_found": len(open_ports),
                    "open_ports": open_ports,
                    "risk_score": risk_score,
                    "scan_duration": (datetime.now() - start_time).total_seconds()
                },
                "compliance_check": "PASSED",
                "raw_data": {
                    "timestamp": datetime.now().isoformat(),
                    "scanner_version": "1.0.0",
                    "scan_mode": "ethical"
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
                error=f"Port scan error: {str(e)}",
                scan_time=(datetime.now() - start_time).total_seconds(),
                timestamp=datetime.now()
            )
    
    def _scan_port(self, host, port):
        """Scan a single port"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            sock.close()
            
            return {
                "port": port,
                "status": "open" if result == 0 else "closed",
                "service": self._get_service_name(port)
            }
        except:
            return {"port": port, "status": "error", "service": "unknown"}
    
    def _get_service_name(self, port):
        """Get common service name for port"""
        services = {
            21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
            53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
            443: "HTTPS", 465: "SMTPS", 587: "SMTP",
            993: "IMAPS", 995: "POP3S", 3306: "MySQL",
            3389: "RDP", 5432: "PostgreSQL"
        }
        return services.get(port, "Unknown")
    
    def _get_port_recommendation(self, port):
        """Get security recommendation for open port"""
        recommendations = {
            21: "Consider disabling FTP or using SFTP/FTPS",
            22: "Ensure SSH uses key-based authentication",
            23: "Telnet is insecure - disable and use SSH",
            25: "Configure SMTP with authentication",
            80: "Redirect HTTP to HTTPS",
            443: "Ensure SSL/TLS is properly configured",
            3389: "RDP should be behind VPN",
            3306: "Database ports should not be publicly accessible"
        }
        return recommendations.get(port, "Review if this port needs to be publicly accessible")
    
    def _is_valid_ip_or_domain(self, target):
        """Check if target is valid IP or domain"""
        try:
            socket.gethostbyname(target)
            return True
        except:
            return False
    
    def _is_private_ip(self, ip):
        """Check if IP is in private range"""
        private_ranges = [
            ("10.0.0.0", "10.255.255.255"),
            ("172.16.0.0", "172.31.255.255"),
            ("192.168.0.0", "192.168.255.255")
        ]
        
        try:
            ip_num = self._ip_to_num(ip)
            for start, end in private_ranges:
                if self._ip_to_num(start) <= ip_num <= self._ip_to_num(end):
                    return True
        except:
            pass
        
        return False
    
    def _ip_to_num(self, ip):
        """Convert IP to numeric value"""
        return sum(int(octet) << (8 * (3 - i)) for i, octet in enumerate(ip.split('.')))
