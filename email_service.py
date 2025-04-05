import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from config import Config
import logging

logger = logging.getLogger(__name__)

def send_email(to_email, subject, body_html, attachments=None):
    """
    Send an email with optional attachments
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        body_html (str): HTML body content
        attachments (list, optional): List of file paths to attach
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = Config.SMTP_USERNAME
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Attach HTML body
        msg.attach(MIMEText(body_html, 'html'))
        
        # Attach files if provided
        if attachments:
            for file_path in attachments:
                with open(file_path, 'rb') as file:
                    part = MIMEApplication(file.read(), Name=file_path.split('/')[-1])
                
                part['Content-Disposition'] = f'attachment; filename="{file_path.split("/")[-1]}"'
                msg.attach(part)
        
        # Create secure SSL context
        context = ssl.create_default_context()
        
        # Send email
        with smtplib.SMTP_SSL(Config.SMTP_SERVER, Config.SMTP_PORT, context=context) as server:
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_admin_notification(loan_application, bank_info, documents):
    """
    Send notification to admin about new loan application
    
    Args:
        loan_application: LoanApplication object
        bank_info: BankInfo object
        documents: List of Document objects
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"New Loan Application: {loan_application.full_name} - ${loan_application.loan_amount:,.2f}"
    
    # Construct admin email body with all application details
    body_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .container {{ padding: 20px; }}
            h2 {{ color: #003366; }}
            .section {{ margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: #003366; color: white; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>New Loan Application Received</h2>
            
            <div class="section">
                <h3>Loan Details</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Loan Amount</td><td>${loan_application.loan_amount:,.2f}</td></tr>
                    <tr><td>Loan Purpose</td><td>{loan_application.loan_purpose}</td></tr>
                    <tr><td>Application Date</td><td>{loan_application.created_at.strftime('%Y-%m-%d %H:%M:%S')}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Applicant Information</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Full Name</td><td>{loan_application.full_name}</td></tr>
                    <tr><td>SSN</td><td>{loan_application.ssn[-4:].rjust(9, '*')}</td></tr>
                    <tr><td>Date of Birth</td><td>{loan_application.dob.strftime('%Y-%m-%d')}</td></tr>
                    <tr><td>Address</td><td>{loan_application.address}, {loan_application.city}, {loan_application.state} {loan_application.zip_code}</td></tr>
                    <tr><td>Email</td><td>{loan_application.email}</td></tr>
                    <tr><td>Phone</td><td>{loan_application.phone}</td></tr>
                    <tr><td>Gender</td><td>{loan_application.gender}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Employment & Income</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Employment Status</td><td>{loan_application.employment_status}</td></tr>
                    <tr><td>Employer</td><td>{loan_application.employer or 'N/A'}</td></tr>
                    <tr><td>Monthly Income</td><td>${loan_application.monthly_income:,.2f}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Bank Information</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Bank Name</td><td>{bank_info.bank_name}</td></tr>
                    <tr><td>Account Name</td><td>{bank_info.account_name}</td></tr>
                    <tr><td>Account Number</td><td>****{bank_info.account_number[-4:]}</td></tr>
                    <tr><td>Routing Number</td><td>{bank_info.routing_number}</td></tr>
                    <tr><td>Account Type</td><td>{bank_info.account_type}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Uploaded Documents</h3>
                <table>
                    <tr><th>Document Type</th><th>Original Filename</th><th>File Size</th></tr>
                    {
                    ''.join([f'<tr><td>{doc.document_type.replace("_", " ").title()}</td><td>{doc.original_name}</td><td>{doc.file_size/1024:.1f} KB</td></tr>' for doc in documents])
                    }
                </table>
            </div>
            
            <p>Please review this application at your earliest convenience.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(Config.ADMIN_EMAIL, subject, body_html)

def send_confirmation_to_applicant(loan_application):
    """
    Send confirmation email to loan applicant
    
    Args:
        loan_application: LoanApplication object
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"Your AmeriFund Loan Application - Confirmation #{loan_application.id}"
    
    body_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #003366; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
            h1 {{ margin: 0; }}
            .amount {{ font-size: 22px; font-weight: bold; color: #003366; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AmeriFund Loan</h1>
            </div>
            <div class="content">
                <p>Dear {loan_application.full_name},</p>
                
                <p>Thank you for applying for a loan with AmeriFund. Your application has been received and is currently under review.</p>
                
                <p>Application Details:</p>
                <ul>
                    <li>Application Number: <strong>{loan_application.id}</strong></li>
                    <li>Loan Amount: <span class="amount">${loan_application.loan_amount:,.2f}</span></li>
                    <li>Submission Date: {loan_application.created_at.strftime('%B %d, %Y')}</li>
                </ul>
                
                <p>What happens next?</p>
                <ol>
                    <li>Our team will review your application within 24 hours</li>
                    <li>We may contact you for additional information</li>
                    <li>You will receive an email with our decision</li>
                </ol>
                
                <p>If you have any questions about your application, please don't hesitate to contact our customer service team at <a href="mailto:support@amerifund.com">support@amerifund.com</a> or call us at (555) 123-4567.</p>
                
                <p>We appreciate your interest in AmeriFund and look forward to helping you achieve your financial goals.</p>
                
                <p>Sincerely,<br>The AmeriFund Team</p>
            </div>
            <div class="footer">
                <p>This email was sent to {loan_application.email}. Please do not reply to this email.</p>
                <p>&copy; 2023 AmeriFund. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(loan_application.email, subject, body_html)
