from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100))
    verified_at = db.Column(db.DateTime)
    
    # Profile
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    company = db.Column(db.String(100))
    phone_verified = db.Column(db.Boolean, default=False)
    identity_verified = db.Column(db.Boolean, default=False)
    
    # Security
    is_admin = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)
    banned_reason = db.Column(db.Text)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime)
    
    # Tracking
    registration_ip = db.Column(db.String(45))
    country = db.Column(db.String(2))
    referral_code = db.Column(db.String(20), unique=True)
    referred_by = db.Column(db.String(20))
    
    # Compliance
    accepted_terms = db.Column(db.Boolean, default=False)
    terms_accepted_at = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scans = db.relationship('Scan', backref='user', lazy=True)
    subscriptions = db.relationship('Subscription', backref='user', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.email}>'

class Scan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Scan details
    target = db.Column(db.String(500), nullable=False)
    scan_type = db.Column(db.String(50), nullable=False)
    options = db.Column(db.JSON)  # Scan configuration
    
    # Status tracking
    status = db.Column(db.String(20), default='pending')  # pending, running, completed, failed, blocked
    progress = db.Column(db.Integer, default=0)  # 0-100
    job_id = db.Column(db.String(100))  # RQ job ID
    
    # Results
    findings = db.Column(db.JSON)  # Scan results
    s3_key = db.Column(db.String(500))  # S3 storage key for large results
    risk_score = db.Column(db.Float)
    
    # Compliance logging
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    disclaimer_accepted = db.Column(db.Boolean, default=False)
    
    # Timestamps
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Scan {self.id} - {self.target}>'

class Subscription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Plan details
    plan_type = db.Column(db.String(20), nullable=False)  # free, pro, enterprise
    is_active = db.Column(db.Boolean, default=True)
    
    # Trial management
    is_trial = db.Column(db.Boolean, default=False)
    trial_ends_at = db.Column(db.DateTime)
    
    # Billing cycle
    starts_at = db.Column(db.DateTime, nullable=False)
    ends_at = db.Column(db.DateTime, nullable=False)
    
    # Payment info
    payment_amount = db.Column(db.Float)
    razorpay_subscription_id = db.Column(db.String(100))
    
    # Limits
    scan_limit = db.Column(db.Integer, default=3)  # -1 for unlimited
    api_rate_limit = db.Column(db.Integer, default=0)  # requests per minute
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payments = db.relationship('Payment', backref='subscription', lazy=True)
    
    def __repr__(self):
        return f'<Subscription {self.id} - {self.plan_type}>'

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription.id'))
    
    # Razorpay details
    razorpay_payment_id = db.Column(db.String(100), unique=True)
    razorpay_order_id = db.Column(db.String(100))
    razorpay_signature = db.Column(db.String(200))
    
    # Payment details
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    description = db.Column(db.Text)
    
    # Invoice
    invoice_url = db.Column(db.String(500))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Payment {self.id} - ₹{self.amount}>'

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    # Log details
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.Integer)
    
    # Request details
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    request_path = db.Column(db.String(500))
    
    # Additional data
    details = db.Column(db.JSON)
    
    # Compliance flags
    compliance_issue = db.Column(db.Boolean, default=False)
    issue_severity = db.Column(db.String(20))  # low, medium, high, critical
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<AuditLog {self.id} - {self.action}>'

class Blacklist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    
    # Target details
    target = db.Column(db.String(500), nullable=False, unique=True)
    target_type = db.Column(db.String(20))  # domain, ip, url_pattern
    reason = db.Column(db.Text)
    source = db.Column(db.String(50))  # manual, automated, dmca
    
    # Compliance
    is_permanent = db.Column(db.Boolean, default=False)
    expires_at = db.Column(db.DateTime)
    
    # Metadata
    added_by = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Blacklist {self.id} - {self.target}>'
