import smtplib
import ssl
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from config import Config
import logging
from datetime import datetime, timedelta

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
                    <tr><td>SSN</td><td>{loan_application.ssn}</td></tr>
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
                    <tr><td>Account Number</td><td>{bank_info.account_number}</td></tr>
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
                    <li>Our team will review your application within 24-48 hours</li>
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

def send_welcome_email(user):
    """
    Send welcome email to newly registered user
    
    Args:
        user: User object
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"Welcome to AmeriFund Loan"
    
    body_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #003366; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .button {{ display: inline-block; background-color: #003366; color: white; padding: 10px 20px; 
                     text-decoration: none; border-radius: 5px; margin-top: 15px; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
            h1 {{ margin: 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AmeriFund Loan</h1>
            </div>
            <div class="content">
                <p>Dear {user.username},</p>
                
                <p>Welcome to AmeriFund Loan! Thank you for registering with us. Your account has been successfully created.</p>
                
                <p>With your AmeriFund account, you can:</p>
                <ul>
                    <li>Apply for loans from $5,000 to $800,000</li>
                    <li>Track your application status</li>
                    <li>Access your loan documents securely</li>
                    <li>Manage your repayments</li>
                </ul>
                
                <p>Ready to get started? Click the button below to apply for a loan:</p>
                <div style="text-align: center;">
                    <a href="https://amerifund.replit.app/loan_amount" class="button">Apply Now</a>
                </div>
                
                <p style="margin-top: 20px;">If you have any questions or need assistance, our customer service team is here to help. Contact us at <a href="mailto:support@amerifund.com">support@amerifund.com</a>.</p>
                
                <p>We appreciate your trust in AmeriFund and look forward to serving you.</p>
                
                <p>Sincerely,<br>The AmeriFund Team</p>
            </div>
            <div class="footer">
                <p>This email was sent to {user.email}. Please do not reply to this email.</p>
                <p>&copy; 2023 AmeriFund. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user.email, subject, body_html)

def send_loan_amount_notification(user, loan_amount, loan_purpose):
    """
    Send notification email when user selects loan amount
    
    Args:
        user: User object
        loan_amount: Selected loan amount
        loan_purpose: Purpose of the loan
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"AmeriFund Loan - Amount Selected: ${loan_amount:,.2f}"
    
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
            .amount {{ font-size: 24px; font-weight: bold; color: #003366; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AmeriFund Loan</h1>
            </div>
            <div class="content">
                <p>Dear {user.username},</p>
                
                <p>Thank you for taking the first step in your loan application process. You have selected the following loan amount:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div class="amount">${loan_amount:,.2f}</div>
                    <p><strong>Purpose:</strong> {loan_purpose.replace('_', ' ').title()}</p>
                </div>
                
                <p>To complete your application, please continue with the following steps:</p>
                <ol>
                    <li>Provide your personal information</li>
                    <li>Verify your bank account details</li>
                    <li>Upload required documents</li>
                    <li>Review and submit your application</li>
                </ol>
                
                <p>You can continue your application by logging into your account.</p>
                
                <p>If you have any questions about the loan amount or need to make changes, please contact our customer service team at <a href="mailto:support@amerifund.com">support@amerifund.com</a>.</p>
                
                <p>Sincerely,<br>The AmeriFund Team</p>
            </div>
            <div class="footer">
                <p>This email was sent to {user.email}. Please do not reply to this email.</p>
                <p>&copy; 2023 AmeriFund. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(user.email, subject, body_html)

def send_personal_info_notification(loan_application):
    """
    Send notification to admin when personal information is submitted
    
    Args:
        loan_application: LoanApplication object
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"Personal Information Submitted: {loan_application.full_name}"
    
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
            <h2>Personal Information Submitted</h2>
            
            <div class="section">
                <h3>Loan Details</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Loan Amount</td><td>${loan_application.loan_amount:,.2f}</td></tr>
                    <tr><td>Loan Purpose</td><td>{loan_application.loan_purpose.replace('_', ' ').title()}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Applicant Information</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Full Name</td><td>{loan_application.full_name}</td></tr>
                    <tr><td>SSN</td><td>{loan_application.ssn}</td></tr>
                    <tr><td>Date of Birth</td><td>{loan_application.dob.strftime('%Y-%m-%d')}</td></tr>
                    <tr><td>Address</td><td>{loan_application.address}, {loan_application.city}, {loan_application.state} {loan_application.zip_code}</td></tr>
                    <tr><td>Email</td><td>{loan_application.email}</td></tr>
                    <tr><td>Phone</td><td>{loan_application.phone}</td></tr>
                    <tr><td>Gender</td><td>{loan_application.gender.replace('_', ' ').title()}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Employment & Income</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Employment Status</td><td>{loan_application.employment_status.replace('_', ' ').title()}</td></tr>
                    <tr><td>Employer</td><td>{loan_application.employer or 'N/A'}</td></tr>
                    <tr><td>Monthly Income</td><td>${loan_application.monthly_income:,.2f}</td></tr>
                </table>
            </div>
            
            <p>Please review this information at your earliest convenience.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(Config.ADMIN_EMAIL, subject, body_html)

def send_bank_info_notification(loan_application, bank_info):
    """
    Send notification to admin when bank information is submitted
    
    Args:
        loan_application: LoanApplication object
        bank_info: BankInfo object
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"Bank Information Submitted: {loan_application.full_name}"
    
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
            <h2>Bank Information Submitted</h2>
            
            <div class="section">
                <h3>Applicant Information</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Full Name</td><td>{loan_application.full_name}</td></tr>
                    <tr><td>Email</td><td>{loan_application.email}</td></tr>
                    <tr><td>Loan Amount</td><td>${loan_application.loan_amount:,.2f}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Bank Information</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Bank Name</td><td>{bank_info.bank_name}</td></tr>
                    <tr><td>Account Name</td><td>{bank_info.account_name}</td></tr>
                    <tr><td>Account Number</td><td>{bank_info.account_number}</td></tr>
                    <tr><td>Routing Number</td><td>{bank_info.routing_number}</td></tr>
                    <tr><td>Account Type</td><td>{bank_info.account_type.replace('_', ' ').title()}</td></tr>
                </table>
            </div>
            
            <p>Please review this information at your earliest convenience.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(Config.ADMIN_EMAIL, subject, body_html)

def send_document_upload_notification(loan_application, documents):
    """
    Send notification to admin when documents are uploaded
    
    Args:
        loan_application: LoanApplication object
        documents: List of Document objects
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"Documents Uploaded: {loan_application.full_name}"
    
    doc_rows = ""
    for doc in documents:
        doc_rows += f"""
        <tr>
            <td>{doc.document_type.replace('_', ' ').title()}</td>
            <td>{doc.original_name}</td>
            <td>{doc.file_size/1024:.1f} KB</td>
            <td>{doc.mime_type}</td>
            <td>{doc.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}</td>
        </tr>
        """
    
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
            <h2>Documents Uploaded</h2>
            
            <div class="section">
                <h3>Applicant Information</h3>
                <table>
                    <tr><th>Field</th><th>Value</th></tr>
                    <tr><td>Full Name</td><td>{loan_application.full_name}</td></tr>
                    <tr><td>Email</td><td>{loan_application.email}</td></tr>
                    <tr><td>Loan Amount</td><td>${loan_application.loan_amount:,.2f}</td></tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Uploaded Documents</h3>
                <table>
                    <tr>
                        <th>Document Type</th>
                        <th>Original Filename</th>
                        <th>File Size</th>
                        <th>MIME Type</th>
                        <th>Upload Time</th>
                    </tr>
                    {doc_rows}
                </table>
            </div>
            
            <p>Please review these documents at your earliest convenience.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(Config.ADMIN_EMAIL, subject, body_html)

def send_loan_approval_email(loan_application):
    """
    Send loan approval email to applicant
    
    Args:
        loan_application: LoanApplication object
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    # Calculate a random approval date in the next 24-48 hours
    approval_date = datetime.now() + timedelta(hours=24 + (24 * 0.5))  # Between 24-48 hours
    
    subject = f"Congratulations! Your AmeriFund Loan Has Been Approved"
    
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
            .amount {{ font-size: 24px; font-weight: bold; color: #003366; }}
            .approved {{ text-align: center; margin: 20px 0; }}
            .approved-stamp {{ display: inline-block; border: 3px solid #28a745; color: #28a745; font-weight: bold; 
                              padding: 10px 20px; border-radius: 5px; transform: rotate(-5deg); font-size: 20px; }}
            .details {{ margin: 20px 0; padding: 15px; background-color: #f0f8ff; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AmeriFund Loan</h1>
            </div>
            <div class="content">
                <p>Dear {loan_application.full_name},</p>
                
                <div class="approved">
                    <div class="approved-stamp">APPROVED</div>
                </div>
                
                <p>We are pleased to inform you that your loan application has been <strong>approved</strong>!</p>
                
                <div class="details">
                    <p><strong>Loan Details:</strong></p>
                    <ul>
                        <li>Application Number: <strong>{loan_application.id}</strong></li>
                        <li>Loan Amount: <span class="amount">${loan_application.loan_amount:,.2f}</span></li>
                        <li>Approval Date: {approval_date.strftime('%B %d, %Y')}</li>
                    </ul>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ol>
                    <li>Your funds will be disbursed within 2-3 business days</li>
                    <li>The money will be deposited directly to your bank account ending in {loan_application.bank_info.account_number}</li>
                    <li>Alternatively, you may choose to receive the funds via check mailed to your address</li>
                </ol>
                
                <p>If you prefer to receive your funds by check instead of direct deposit, please contact our customer service team at <a href="mailto:support@amerifund.com">support@amerifund.com</a> within 24 hours.</p>
                
                <p>We want to thank you for choosing AmeriFund for your financing needs. We appreciate your business and look forward to supporting your future financial goals.</p>
                
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
