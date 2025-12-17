from app import app, db
from models import User, Scan, Subscription, Payment, AuditLog, Blacklist
from werkzeug.security import generate_password_hash

def init_database():
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Create admin user
        if not User.query.filter_by(email='admin@incomeplus.in').first():
            admin = User(
                email='admin@incomeplus.in',
                password_hash=generate_password_hash('Admin@123'),
                is_verified=True,
                is_admin=True,
                name='System Administrator',
                phone_verified=True,
                accepted_terms=True,
                terms_accepted_at=datetime.utcnow()
            )
            db.session.add(admin)
            
            # Create sample subscription for admin
            subscription = Subscription(
                user=admin,
                plan_type='enterprise',
                is_active=True,
                starts_at=datetime.utcnow(),
                ends_at=datetime.utcnow() + timedelta(days=365),
                scan_limit=-1  # Unlimited
            )
            db.session.add(subscription)
        
        # Add default blacklist entries
        blacklisted_domains = [
            '.gov.in', '.nic.in', '.mil.in', 
            'localhost', '127.0.0.1',
            '192.168.', '10.', '172.16.'
        ]
        
        for domain in blacklisted_domains:
            if not Blacklist.query.filter_by(target=domain).first():
                blacklist = Blacklist(
                    target=domain,
                    target_type='domain_pattern',
                    reason='Government/military or private network',
                    source='system',
                    is_permanent=True
                )
                db.session.add(blacklist)
        
        db.session.commit()
        print("Database initialized successfully!")

if __name__ == '__main__':
    from datetime import datetime, timedelta
    init_database()
