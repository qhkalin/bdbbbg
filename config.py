import os

class Config:
    # SMTP Configuration
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 465
    SMTP_USERNAME = "amerifundloan@gmail.com"
    SMTP_PASSWORD = "rljl uvyu zlcf wbgp"

    # Admin Email
    ADMIN_EMAIL = "denzelbennie@outlook.com"

    # Plaid API Configuration
    PLAID_CLIENT_ID = os.environ.get("PLAID_CLIENT_ID", "")
    PLAID_SECRET = os.environ.get("PLAID_SECRET", "")
    PLAID_ENV = "sandbox"  # sandbox, development, or production

    # Application settings
    APP_NAME = "AmeriFund Loan"
    MIN_LOAN_AMOUNT = 5000.0
    MAX_LOAN_AMOUNT = 800000.0

    # Security settings
    PASSWORD_MIN_LENGTH = 8

    # Clearbit API for bank logos
    CLEARBIT_LOGO_API = "https://logo.clearbit.com/"