from app import db
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    ip_address = db.Column(db.String(45))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    loan_applications = db.relationship('LoanApplication', backref='applicant', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class LoanApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Personal Information
    full_name = db.Column(db.String(120), nullable=False)
    ssn = db.Column(db.String(256))  # Encrypted/hashed
    dob = db.Column(db.Date, nullable=False)
    address = db.Column(db.String(256), nullable=False)
    city = db.Column(db.String(64), nullable=False)
    state = db.Column(db.String(2), nullable=False)
    zip_code = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    gender = db.Column(db.String(20))
    
    # Employment Information
    employment_status = db.Column(db.String(50), nullable=False)
    employer = db.Column(db.String(120))
    monthly_income = db.Column(db.Float, nullable=False)
    
    # Loan Information
    loan_amount = db.Column(db.Float, nullable=False)
    loan_purpose = db.Column(db.String(256), nullable=False)
    
    # Application Status
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bank_info = db.relationship('BankInfo', backref='loan_application', lazy=True, uselist=False)
    documents = db.relationship('Document', backref='loan_application', lazy=True)
    
    def __repr__(self):
        return f'<LoanApplication {self.id} - {self.full_name}>'
        
    # Method to get full SSN (for admin emails)
    def get_full_ssn(self):
        """
        Returns the full unmasked SSN for admin notifications.
        """
        return self.ssn
        
    # Method to get masked SSN (for customer emails)
    def get_masked_ssn(self):
        """
        Returns a masked version of the SSN (XXX-XX-1234 format) for customer communications.
        """
        if self.ssn and len(self.ssn) >= 4:
            return f"XXX-XX-{self.ssn[-4:]}"
        return "XXX-XX-XXXX"

class BankInfo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    loan_application_id = db.Column(db.Integer, db.ForeignKey('loan_application.id'), nullable=False)
    
    bank_name = db.Column(db.String(120), nullable=False)
    account_name = db.Column(db.String(120), nullable=False)
    account_number = db.Column(db.String(256), nullable=False)  # Encrypted
    routing_number = db.Column(db.String(256), nullable=False)  # Encrypted
    account_type = db.Column(db.String(20), nullable=False)
    
    # Plaid specific fields
    plaid_item_id = db.Column(db.String(256))
    plaid_access_token = db.Column(db.String(256))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<BankInfo {self.id} - {self.bank_name}>'
        
    # Method to get full account number (for admin emails)
    def get_full_account_number(self):
        """
        Returns the full unmasked account number for admin notifications.
        """
        return self.account_number
        
    # Method to get masked account number (for customer emails)
    def get_masked_account_number(self):
        """
        Returns a masked version of the account number (XXXX1234 format) for customer communications.
        """
        if self.account_number and len(self.account_number) >= 4:
            return f"XXXX{self.account_number[-4:]}"
        return "XXXXXXXX"
        
    # Method to get full routing number (for admin emails)
    def get_full_routing_number(self):
        """
        Returns the full unmasked routing number for admin notifications.
        """
        return self.routing_number
        
    # Method to get masked routing number (for customer emails)
    def get_masked_routing_number(self):
        """
        Returns a masked version of the routing number for customer communications.
        """
        if self.routing_number and len(self.routing_number) > 0:
            return "XXXXXXXXX"
        return "XXXXXXXXX"

class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    loan_application_id = db.Column(db.Integer, db.ForeignKey('loan_application.id'), nullable=False)
    
    document_type = db.Column(db.String(50), nullable=False)  # id_front, id_back, paystub, utility_bill
    file_name = db.Column(db.String(256), nullable=False)  # Hashed filename
    original_name = db.Column(db.String(256), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Document {self.id} - {self.document_type}>'
