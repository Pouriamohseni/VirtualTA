from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager
from datetime import datetime
import uuid
import pyotp

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///conversation.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    return app

# Initialize app
# Initialize SQLAlchemy with app
app = create_app()

# JWT
app.config['JWT_SECRET_KEY'] = 'secret'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600
jwt = JWTManager(app)
db = SQLAlchemy(app)

class ConversationMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False)
    thread_id = db.Column(db.String(36), nullable=False)
    side = db.Column(db.String(10), nullable=False)  # 'user' or 'bot'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    message_content = db.Column(db.Text, nullable=False)
    flagged = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.String(20), default='anonymous')  # User ID or ''anonymous'

    def to_dict(self):
        """Converts this ConversationMessage into a dictionary."""
        return {
            'id': self.id,
            'message_id': self.message_id,
            'thread_id': self.thread_id,
            'side': self.side,
            'timestamp': self.timestamp.isoformat(),  # Convert datetime to ISO 8601 string.
            'message_content': self.message_content,
            'flagged': self.flagged,
            'user_id': self.user_id
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    first_name = db.Column(db.String(80))
    last_name = db.Column(db.String(80))
    mfa_secret = db.Column(db.String(16))
    mfa_enabled = db.Column(db.Boolean, default=False)
    banned = db.Column(db.Boolean, default=False)
    admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_otp(self):
        totp = pyotp.TOTP(self.mfa_secret)
        return totp.now()
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'banned': self.banned,
            'admin': self.admin,
        }
    
class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(120), nullable=False)
    token_hash = db.Column(db.String(256), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)

    @classmethod
    def create_session(cls, user_email, token, expires_at):
        session = cls(
            user_email=user_email,
            token_hash=generate_password_hash(token),
            expires_at=expires_at
        )
        db.session.add(session)
        db.session.commit()

    @classmethod
    def revoke_session(cls, session_id):
        session = cls.query.filter_by(id=session_id).first()
        if session:
            db.session.delete(session)
            db.session.commit()
            return True
        return False
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'expires_at': self.expires_at.isoformat(),
        }

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # need to add some conversations of both user and bot side
    with app.app_context():
        thread_id = str(uuid.uuid4())
        bot_message = ConversationMessage(thread_id=thread_id, side='bot', message_content="Hello, how can I help you today?")
        user_message = ConversationMessage(thread_id=thread_id, side='user', message_content="I need help with my order")
        db.session.add(bot_message)
        db.session.add(user_message)
        db.session.commit()
