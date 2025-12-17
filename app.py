from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, TextAreaField
from wtforms.validators import DataRequired, Email, Length
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import json
import logging
from functools import wraps
import redis
from rq import Queue
import razorpay
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import boto3
from botocore.exceptions import ClientError
import uuid

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///incomeplus.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# Redis Queue
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
conn = redis.from_url(redis_url)
queue = Queue(connection=conn)

# Razorpay
razorpay_client = razorpay.Client(
    auth=(os.environ.get('RAZORPAY_KEY_ID'), os.environ.get('RAZORPAY_KEY_SECRET'))
)

# AWS S3
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('AWS_REGION', 'ap-south-1')
)
S3_BUCKET = os.environ.get('S3_BUCKET', 'incomeplus-scans')

# SendGrid
sendgrid_client = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))

# Import models
from models import User, Scan, Subscription, Payment, AuditLog, Blacklist

# Create tables
@app.before_request
def create_tables():
    db.create_all()

# Age verification middleware
@app.before_request
def check_age_verification():
    if request.endpoint not in ['static', 'index', 'login', 'register', 'verify_age', 'legal_page']:
        if not session.get('age_verified'):
            return redirect(url_for('verify_age'))

# Admin required decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Admin access required', 'danger')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/verify-age', methods=['GET', 'POST'])
def verify_age():
    if request.method == 'POST':
        age_confirm = request.form.get('age_confirm')
        if age_confirm == 'on':
            session['age_verified'] = True
            return redirect(url_for('index'))
        else:
            flash('You must be 18 or older to use this service', 'danger')
    return render_template('verify.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            if user.is_verified:
                login_user(user)
                # Log login
                audit_log = AuditLog(
                    user_id=user.id,
                    action='login',
                    ip_address=request.remote_addr,
                    user_agent=request.user_agent.string
                )
                db.session.add(audit_log)
                db.session.commit()
                
                flash('Logged in successfully!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Please verify your email first', 'warning')
                return redirect(url_for('verify_email'))
        else:
            flash('Invalid credentials', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        accept_terms = request.form.get('accept_terms')
        
        if not accept_terms:
            flash('You must accept the Terms of Service', 'danger')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match', 'danger')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'danger')
            return render_template('register.html')
        
        # Check country restriction
        # In production, use GeoIP database
        country = request.headers.get('CF-IPCountry', 'IN')  # Cloudflare header
        
        restricted_countries = ['CN', 'RU', 'KP', 'IR', 'SY']
        if country in restricted_countries:
            flash('Service not available in your country', 'danger')
            return render_template('register.html')
        
        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            verification_token=str(uuid.uuid4()),
            registration_ip=request.remote_addr,
            country=country
        )
        db.session.add(user)
        db.session.commit()
        
        # Send verification email
        send_verification_email(user)
        
        flash('Registration successful! Please check your email for verification.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/verify-email/<token>')
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()
    if user:
        user.is_verified = True
        user.verification_token = None
        user.verified_at = datetime.utcnow()
        db.session.commit()
        
        # Send welcome email
        send_welcome_email(user)
        
        flash('Email verified successfully! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    flash('Invalid verification token', 'danger')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    scans = Scan.query.filter_by(user_id=current_user.id).order_by(Scan.created_at.desc()).limit(10).all()
    subscription = Subscription.query.filter_by(user_id=current_user.id, is_active=True).first()
    
    return render_template('dashboard.html', scans=scans, subscription=subscription)

@app.route('/scanner')
@login_required
def scanner():
    # Check scan quota
    scans_today = Scan.query.filter(
        Scan.user_id == current_user.id,
        Scan.created_at >= datetime.utcnow() - timedelta(days=1)
    ).count()
    
    subscription = Subscription.query.filter_by(user_id=current_user.id, is_active=True).first()
    
    if subscription and subscription.plan_type == 'free':
        if scans_today >= 3:  # Free tier limit
            flash('Daily scan limit reached. Upgrade to Pro for unlimited scans.', 'warning')
            return redirect(url_for('pricing'))
    
    return render_template('scanner.html', scans_today=scans_today)

@app.route('/api/scan', methods=['POST'])
@login_required
def api_scan():
    data = request.get_json()
    target = data.get('target')
    scan_type = data.get('scan_type')
    
    # Validate target
    if not target:
        return jsonify({'error': 'Target required'}), 400
    
    # Check blacklist
    if is_blacklisted(target):
        return jsonify({'error': 'Target not allowed per compliance policy'}), 403
    
    # Check scan permissions
    subscription = Subscription.query.filter_by(user_id=current_user.id, is_active=True).first()
    if not subscription:
        return jsonify({'error': 'No active subscription'}), 403
    
    # Enforce plan restrictions
    if subscription.plan_type == 'free':
        # Check daily limit
        scans_today = Scan.query.filter(
            Scan.user_id == current_user.id,
            Scan.created_at >= datetime.utcnow() - timedelta(days=1)
        ).count()
        
        if scans_today >= 3:
            return jsonify({'error': 'Daily scan limit reached'}), 429
        
        # Free tier restrictions
        if scan_type not in ['port', 'ssl', 'website']:
            return jsonify({'error': 'Scanner not available in free tier'}), 403
    
    # Create scan record
    scan = Scan(
        user_id=current_user.id,
        target=target,
        scan_type=scan_type,
        status='pending',
        ip_address=request.remote_addr
    )
    db.session.add(scan)
    db.session.commit()
    
    # Queue scan job
    job = queue.enqueue(
        'scanners.base_scanner.run_scan',
        scan.id,
        target,
        scan_type,
        current_user.id,
        subscription.plan_type,
        job_timeout=600  # 10 minutes max
    )
    
    scan.job_id = job.id
    db.session.commit()
    
    return jsonify({
        'scan_id': scan.id,
        'status': 'queued',
        'position': queue.get_job_ids().index(job.id) + 1 if job.id in queue.get_job_ids() else 1
    })

@app.route('/scan/<int:scan_id>')
@login_required
def scan_results(scan_id):
    scan = Scan.query.get_or_404(scan_id)
    
    # Verify ownership
    if scan.user_id != current_user.id and not current_user.is_admin:
        flash('Access denied', 'danger')
        return redirect(url_for('dashboard'))
    
    return render_template('results.html', scan=scan)

@app.route('/pricing')
def pricing():
    return render_template('pricing.html')

@app.route('/create-order', methods=['POST'])
@login_required
def create_order():
    data = request.get_json()
    plan = data.get('plan')
    
    plans = {
        'pro': {'amount': 49900, 'currency': 'INR', 'duration_days': 30},
        'enterprise': {'amount': 149900, 'currency': 'INR', 'duration_days': 30}
    }
    
    if plan not in plans:
        return jsonify({'error': 'Invalid plan'}), 400
    
    # Create Razorpay order
    order_data = {
        'amount': plans[plan]['amount'],
        'currency': plans[plan]['currency'],
        'payment_capture': 1,
        'notes': {
            'user_id': current_user.id,
            'plan': plan
        }
    }
    
    try:
        order = razorpay_client.order.create(data=order_data)
        return jsonify(order)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify-payment', methods=['POST'])
@login_required
def verify_payment():
    data = request.get_json()
    payment_id = data.get('razorpay_payment_id')
    order_id = data.get('razorpay_order_id')
    signature = data.get('razorpay_signature')
    
    try:
        # Verify payment
        params_dict = {
            'razorpay_payment_id': payment_id,
            'razorpay_order_id': order_id,
            'razorpay_signature': signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get order details
        order = razorpay_client.order.fetch(order_id)
        plan = order['notes']['plan']
        
        # Create subscription
        subscription = Subscription(
            user_id=current_user.id,
            plan_type=plan,
            is_active=True,
            starts_at=datetime.utcnow(),
            ends_at=datetime.utcnow() + timedelta(days=30),
            payment_amount=order['amount'] / 100  # Convert to rupees
        )
        db.session.add(subscription)
        
        # Record payment
        payment = Payment(
            user_id=current_user.id,
            subscription_id=subscription.id,
            razorpay_payment_id=payment_id,
            razorpay_order_id=order_id,
            amount=order['amount'] / 100,
            status='completed'
        )
        db.session.add(payment)
        
        db.session.commit()
        
        # Send confirmation email
        send_payment_confirmation(current_user, plan, order['amount'] / 100)
        
        return jsonify({'success': True, 'message': 'Payment verified successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/blog')
def blog():
    # Load blog posts from JSON file
    with open('data/blog_posts.json', 'r') as f:
        posts = json.load(f)
    
    return render_template('blog.html', posts=posts)

@app.route('/blog/<slug>')
def blog_post(slug):
    with open('data/blog_posts.json', 'r') as f:
        posts = json.load(f)
    
    post = next((p for p in posts if p['slug'] == slug), None)
    if not post:
        flash('Blog post not found', 'danger')
        return redirect(url_for('blog'))
    
    return render_template('blog_post.html', post=post)

@app.route('/terms')
def terms():
    return render_template('legal/terms.html')

@app.route('/privacy')
def privacy():
    return render_template('legal/privacy.html')

@app.route('/acceptable-use')
def acceptable_use():
    return render_template('legal/acceptable_use.html')

@app.route('/dmca')
def dmca():
    return render_template('legal/dmca.html')

@app.route('/sitemap.xml')
def sitemap():
    # Generate dynamic sitemap
    pages = []
    ten_days_ago = datetime.now() - timedelta(days=10)
    
    # Static pages
    static_pages = [
        {'url': url_for('index', _external=True), 'lastmod': ten_days_ago},
        {'url': url_for('pricing', _external=True), 'lastmod': ten_days_ago},
        {'url': url_for('blog', _external=True), 'lastmod': ten_days_ago},
        {'url': url_for('terms', _external=True), 'lastmod': ten_days_ago},
        {'url': url_for('privacy', _external=True), 'lastmod': ten_days_ago},
        {'url': url_for('acceptable_use', _external=True), 'lastmod': ten_days_ago},
        {'url': url_for('dmca', _external=True), 'lastmod': ten_days_ago},
    ]
    
    # Blog posts
    with open('data/blog_posts.json', 'r') as f:
        posts = json.load(f)
    
    for post in posts:
        pages.append({
            'url': url_for('blog_post', slug=post['slug'], _external=True),
            'lastmod': datetime.fromisoformat(post['date'])
        })
    
    sitemap_xml = render_template('sitemap.xml', pages=pages)
    response = app.make_response(sitemap_xml)
    response.headers['Content-Type'] = 'application/xml'
    return response

@app.route('/robots.txt')
def robots():
    return send_file('static/robots.txt')

# Admin routes
@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    stats = {
        'total_users': User.query.count(),
        'total_scans': Scan.query.count(),
        'active_subscriptions': Subscription.query.filter_by(is_active=True).count(),
        'today_scans': Scan.query.filter(
            Scan.created_at >= datetime.utcnow().date()
        ).count()
    }
    
    recent_scans = Scan.query.order_by(Scan.created_at.desc()).limit(10).all()
    recent_users = User.query.order_by(User.created_at.desc()).limit(10).all()
    
    return render_template('admin/dashboard.html', stats=stats, recent_scans=recent_scans, recent_users=recent_users)

@app.route('/admin/users')
@login_required
@admin_required
def admin_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=users)

@app.route('/admin/scans')
@login_required
@admin_required
def admin_scans():
    scans = Scan.query.order_by(Scan.created_at.desc()).all()
    return render_template('admin/scans.html', scans=scans)

@app.route('/admin/compliance')
@login_required
@admin_required
def admin_compliance():
    # Generate compliance report
    report = generate_compliance_report()
    return render_template('admin/compliance.html', report=report)

# Helper functions
def send_verification_email(user):
    verification_url = url_for('verify_email', token=user.verification_token, _external=True)
    
    message = Mail(
        from_email='noreply@incomeplus.in',
        to_emails=user.email,
        subject='Verify your IncomePlus account',
        html_content=f'''
        <h1>Verify Your Email</h1>
        <p>Click the link below to verify your email address:</p>
        <p><a href="{verification_url}">{verification_url}</a></p>
        <p>This link will expire in 24 hours.</p>
        '''
    )
    
    try:
        sendgrid_client.send(message)
    except Exception as e:
        logging.error(f"Failed to send verification email: {e}")

def send_welcome_email(user):
    message = Mail(
        from_email='welcome@incomeplus.in',
        to_emails=user.email,
        subject='Welcome to IncomePlus!',
        html_content=f'''
        <h1>Welcome to IncomePlus Security Scanner!</h1>
        <p>Your account has been successfully verified.</p>
        <p>Start scanning by visiting your dashboard:</p>
        <p><a href="{url_for('dashboard', _external=True)}">Go to Dashboard</a></p>
        <h3>Important Compliance Reminders:</h3>
        <ul>
            <li>Only scan targets you own or have permission to test</li>
            <li>Do not scan government or military domains</li>
            <li>Our service is for educational/ethical testing only</li>
            <li>Review our Terms of Service and Acceptable Use Policy</li>
        </ul>
        '''
    )
    
    try:
        sendgrid_client.send(message)
    except Exception as e:
        logging.error(f"Failed to send welcome email: {e}")

def send_payment_confirmation(user, plan, amount):
    message = Mail(
        from_email='payments@incomeplus.in',
        to_emails=user.email,
        subject=f'Payment Confirmation - {plan.capitalize()} Plan',
        html_content=f'''
        <h1>Payment Confirmed!</h1>
        <p>Thank you for upgrading to the {plan.capitalize()} plan.</p>
        <p><strong>Plan:</strong> {plan.capitalize()}</p>
        <p><strong>Amount:</strong> ₹{amount}</p>
        <p><strong>Next Billing Date:</strong> {(datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d")}</p>
        <p>You now have access to all premium features including unlimited scans.</p>
        <p><a href="{url_for('dashboard', _external=True)}">Start Scanning Now</a></p>
        '''
    )
    
    try:
        sendgrid_client.send(message)
    except Exception as e:
        logging.error(f"Failed to send payment confirmation: {e}")

def is_blacklisted(target):
    # Check against blacklisted domains
    blacklisted_domains = [
        '.gov.in', '.nic.in', '.mil.in', '.gov.', '.mil.', '.police.', '.judiciary.',
        'localhost', '127.0.0.1', '192.168.', '10.', '172.16.'
    ]
    
    target_lower = target.lower()
    return any(domain in target_lower for domain in blacklisted_domains)

def generate_compliance_report():
    # Generate monthly compliance report
    one_month_ago = datetime.utcnow() - timedelta(days=30)
    
    report = {
        'period': f"{one_month_ago.strftime('%Y-%m-%d')} to {datetime.utcnow().strftime('%Y-%m-%d')}",
        'total_scans': Scan.query.filter(Scan.created_at >= one_month_ago).count(),
        'blocked_scans': Scan.query.filter(
            Scan.created_at >= one_month_ago,
            Scan.status == 'blocked'
        ).count(),
        'new_users': User.query.filter(User.created_at >= one_month_ago).count(),
        'banned_users': User.query.filter(
            User.is_banned == True,
            User.updated_at >= one_month_ago
        ).count(),
        'dmca_requests': AuditLog.query.filter(
            AuditLog.action == 'dmca_request',
            AuditLog.created_at >= one_month_ago
        ).count(),
        'data_export_requests': AuditLog.query.filter(
            AuditLog.action == 'data_export',
            AuditLog.created_at >= one_month_ago
        ).count()
    }
    
    return report

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

if __name__ == '__main__':
    app.run(debug=True)
