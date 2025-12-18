#!/usr/bin/env python3
"""
Database initialization script for IncomePlus
Run this after deploying to create database tables
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db
from models import User, Scan, Subscription, Payment, AuditLog, Blacklist
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

def init_database():
    """Initialize database with required tables and data"""
    
    print("Initializing IncomePlus database...")
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("✓ Tables created successfully")
        
        # Create admin user if not exists
        admin = User.query.filter_by(email='admin@incomeplus.in').first()
        if not admin:
            admin = User(
                email='admin@incomeplus.in',
                password_hash=generate_password_hash('Admin@123'),
                name='System Administrator',
                is_verified=True,
                is_admin=True,
                phone_verified=True,
                accepted_terms=True,
                terms_accepted_at=datetime.utcnow(),
                verified_at=datetime.utcnow(),
                registration_ip='127.0.0.1',
                country='IN'
            )
            db.session.add(admin)
            print("✓ Admin user created")
        
        # Add default blacklist entries
        blacklisted_domains = [
            '.gov.in', '.nic.in', '.mil.in', 
            '.gov.', '.mil.', '.police.', '.judiciary.',
            'localhost', '127.0.0.1', '0.0.0.0',
            '192.168.', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
            '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
            '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.'
        ]
        
        for domain in blacklisted_domains:
            if not Blacklist.query.filter_by(target=domain).first():
                blacklist = Blacklist(
                    target=domain,
                    target_type='domain_pattern',
                    reason='Government/military or private network - Compliance policy',
                    source='system',
                    is_permanent=True
                )
                db.session.add(blacklist)
        print("✓ Blacklist entries added")
        
        # Create test user for demonstration
        test_user = User.query.filter_by(email='test@example.com').first()
        if not test_user:
            test_user = User(
                email='test@example.com',
                password_hash=generate_password_hash('Test@123'),
                name='Test User',
               
