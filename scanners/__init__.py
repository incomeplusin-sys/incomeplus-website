"""
IncomePlus Security Scanner Platform
Version: 1.0.0
Author: IncomePlus Security Solutions
Description: Ethical security scanning platform compliant with Indian regulations
"""

__version__ = '1.0.0'
__author__ = 'IncomePlus Security Solutions'
__license__ = 'MIT'
__copyright__ = 'Copyright 2024 IncomePlus Security Solutions'

# Core imports
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
limiter = Limiter(key_func=get_remote_address)

def create_app(config_class='config.Config'):
    """
    Application factory pattern for creating Flask app
    """
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    limiter.init_app(app)
    
    # Configure login manager
    login_manager.login_view = 'login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'warning'
    
    # Register blueprints (if any)
    from .routes import main, admin, api
    app.register_blueprint(main)
    app.register_blueprint(admin, url_prefix='/admin')
    app.register_blueprint(api, url_prefix='/api')
    
    # Import and register error handlers
    from .errors import register_error_handlers
    register_error_handlers(app)
    
    # Import models
    from .models import User, Scan, Subscription, Payment, AuditLog, Blacklist
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

# Package exports
__all__ = [
    'create_app',
    'db',
    'login_manager',
    'limiter',
    '__version__',
    '__author__',
    '__license__'
]
