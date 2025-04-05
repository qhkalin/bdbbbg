import os
import hashlib
import logging
from werkzeug.utils import secure_filename
from datetime import datetime
from flask import current_app

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}

def allowed_file(filename):
    """
    Check if a file has an allowed extension
    
    Args:
        filename (str): The filename to check
        
    Returns:
        bool: True if the file has an allowed extension, False otherwise
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_secure_filename(file, loan_application_id, document_type):
    """
    Generate a secure, hashed filename for an uploaded file
    
    Args:
        file: The uploaded file object
        loan_application_id: The ID of the loan application
        document_type: The type of document being uploaded
        
    Returns:
        str: A secure filename with the original extension
    """
    # Get file content and metadata
    file_content = file.read()
    original_filename = secure_filename(file.filename)
    file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    
    # Create a hash of the file content and metadata
    timestamp = datetime.utcnow().isoformat()
    hash_content = f"{file_content}{loan_application_id}{document_type}{timestamp}".encode('utf-8')
    filename_hash = hashlib.sha256(hash_content).hexdigest()
    
    # Reset file pointer to beginning for later use
    file.seek(0)
    
    # Return hashed filename with original extension
    if file_extension:
        return f"{filename_hash}.{file_extension}"
    return filename_hash

def save_file(file, loan_application_id, document_type):
    """
    Save an uploaded file to the uploads directory
    
    Args:
        file: The uploaded file object
        loan_application_id: The ID of the loan application
        document_type: The type of document being uploaded
        
    Returns:
        tuple: (filename, filepath, file_size, mime_type) or (None, None, None, None) on error
    """
    if not file:
        logger.error("No file provided")
        return None, None, None, None
        
    if not file.filename:
        logger.error("No filename provided")
        return None, None, None, None
        
    if not allowed_file(file.filename):
        logger.error(f"File type not allowed: {file.filename}")
        return None, None, None, None
        
    # Check file size (16MB limit)
    if file.content_length and file.content_length > 16 * 1024 * 1024:
        logger.error(f"File too large: {file.content_length} bytes")
        return None, None, None, None
        
    try:
            # Generate secure filename
            filename = generate_secure_filename(file, loan_application_id, document_type)
            
            # Create application-specific directory
            app_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(loan_application_id))
            os.makedirs(app_dir, exist_ok=True)
            
            # Save file to disk
            filepath = os.path.join(app_dir, filename)
            file.save(filepath)
            
            # Get file size and MIME type
            file_size = os.path.getsize(filepath)
            mime_type = file.content_type or 'application/octet-stream'
            
            logger.info(f"Saved file {file.filename} as {filename} for loan application {loan_application_id}")
            return filename, filepath, file_size, mime_type
        
        except Exception as e:
            logger.error(f"Error saving file {file.filename}: {str(e)}")
            return None, None, None, None
    
    return None, None, None, None
