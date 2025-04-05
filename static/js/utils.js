// Utility functions for AmeriFund Loan application

// Prevent double form submission
function preventDoubleSubmission(formId) {
    const form = document.getElementById(formId);
    
    if (form) {
        form.addEventListener('submit', function(e) {
            // If the form has already been submitted, prevent resubmission
            if (this.classList.contains('submitting')) {
                e.preventDefault();
                return false;
            }
            
            // Add submitting class to prevent multiple submissions
            this.classList.add('submitting');
            
            // Disable submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...';
            }
            
            // Return true to allow the form to be submitted
            return true;
        });
    }
}

// Form validation function
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    
    if (!form) return false;
    
    let isValid = true;
    
    // Clear previous error messages
    const errorMessages = form.querySelectorAll('.invalid-feedback');
    errorMessages.forEach(element => {
        element.remove();
    });
    
    // Clear previous invalid states
    const invalidInputs = form.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
    
    // Apply validation rules
    for (const fieldId in rules) {
        const field = document.getElementById(fieldId);
        const validations = rules[fieldId];
        
        if (!field) continue;
        
        for (const validation of validations) {
            const [rule, message] = validation;
            
            if (rule === 'required' && !field.value.trim()) {
                addError(field, message || 'This field is required');
                isValid = false;
                break;
            } else if (rule === 'min' && field.value.length < validation[2]) {
                addError(field, message || `Minimum ${validation[2]} characters required`);
                isValid = false;
                break;
            } else if (rule === 'max' && field.value.length > validation[2]) {
                addError(field, message || `Maximum ${validation[2]} characters allowed`);
                isValid = false;
                break;
            } else if (rule === 'email' && !validateEmail(field.value)) {
                addError(field, message || 'Please enter a valid email address');
                isValid = false;
                break;
            } else if (rule === 'match' && field.value !== document.getElementById(validation[2]).value) {
                addError(field, message || 'Fields do not match');
                isValid = false;
                break;
            }
        }
    }
    
    return isValid;
}

// Helper function to validate email format
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Helper function to add error message to form field
function addError(field, message) {
    // Add invalid class to the field
    field.classList.add('is-invalid');
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.innerText = message;
    
    // Add error message after the field
    field.parentNode.appendChild(errorDiv);
}

// Show loading spinner
function showLoading(message = 'Loading...') {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('loading-overlay');
    
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p id="loading-message" class="mt-3">${message}</p>
            </div>
        `;
        
        document.body.appendChild(loadingOverlay);
    } else {
        // Update message if overlay already exists
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.innerText = message;
        }
        
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading spinner
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}