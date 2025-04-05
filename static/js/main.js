// Global variables
let loadingOverlay;
let loadingMessage;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create loading overlay
    createLoadingOverlay();
    
    // Initialize masked inputs
    initializeMaskedInputs();
    
    // Initialize loan amount slider if present
    initializeLoanAmountSlider();
    
    // Initialize file upload previews
    initializeFileUploads();
    
    // Register service worker for PWA
    registerServiceWorker();
    
    // Show PWA install prompt if conditions are met
    checkAndShowInstallPrompt();
    
    // Handle flash messages auto-hide
    autoHideAlerts();
});

// Create loading overlay for async operations
function createLoadingOverlay() {
    loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.style.display = 'none';
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    loadingMessage = document.createElement('div');
    loadingMessage.className = 'loading-message';
    loadingMessage.innerText = 'Processing...';
    
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'd-flex flex-column align-items-center';
    loadingContainer.appendChild(spinner);
    loadingContainer.appendChild(loadingMessage);
    
    loadingOverlay.appendChild(loadingContainer);
    document.body.appendChild(loadingOverlay);
}

// Show loading overlay with custom message
function showLoading(message = 'Processing...') {
    loadingMessage.innerText = message;
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Initialize masked inputs (SSN, phone, etc.)
function initializeMaskedInputs() {
    // SSN Mask (XXX-XX-XXXX)
    const ssnInput = document.getElementById('ssn');
    if (ssnInput) {
        ssnInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 9) {
                value = value.substr(0, 9);
            }
            
            // Format with hyphens as user types
            if (value.length > 5) {
                e.target.value = `${value.substr(0, 3)}-${value.substr(3, 2)}-${value.substr(5)}`;
            } else if (value.length > 3) {
                e.target.value = `${value.substr(0, 3)}-${value.substr(3)}`;
            } else {
                e.target.value = value;
            }
        });
    }
    
    // Phone Number Mask (XXX-XXX-XXXX)
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.substr(0, 10);
            }
            
            // Format with hyphens as user types
            if (value.length > 6) {
                e.target.value = `${value.substr(0, 3)}-${value.substr(3, 3)}-${value.substr(6)}`;
            } else if (value.length > 3) {
                e.target.value = `${value.substr(0, 3)}-${value.substr(3)}`;
            } else {
                e.target.value = value;
            }
        });
    }
    
    // ZIP Code validation
    const zipInput = document.getElementById('zip_code');
    if (zipInput) {
        zipInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d-]/g, '');
            if (value.length > 10) {
                value = value.substr(0, 10);
            }
            e.target.value = value;
        });
    }
    
    // Currency format for loan amount and income
    const currencyInputs = document.querySelectorAll('.currency-input');
    currencyInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d.]/g, '');
            
            // Ensure only one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Limit to two decimal places
            if (parts.length > 1 && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            e.target.value = value;
        });
    });
}

// Initialize loan amount slider if present
function initializeLoanAmountSlider() {
    const loanSlider = document.getElementById('loan-amount-slider');
    const loanAmountInput = document.getElementById('loan_amount');
    const loanAmountDisplay = document.getElementById('loan-amount-display');
    
    if (loanSlider && loanAmountInput && loanAmountDisplay) {
        // Set initial value
        loanSlider.value = loanAmountInput.value || 5000;
        updateLoanAmountDisplay(loanSlider.value);
        
        // Update amount on slider change
        loanSlider.addEventListener('input', function() {
            const amount = parseInt(this.value);
            loanAmountInput.value = amount;
            updateLoanAmountDisplay(amount);
        });
        
        // Update slider on direct input change
        loanAmountInput.addEventListener('change', function() {
            let amount = parseInt(this.value) || 5000;
            
            // Enforce min/max limits
            if (amount < 5000) amount = 5000;
            if (amount > 800000) amount = 800000;
            
            this.value = amount;
            loanSlider.value = amount;
            updateLoanAmountDisplay(amount);
        });
    }
}

// Format and display loan amount with commas and dollar sign
function updateLoanAmountDisplay(amount) {
    const loanAmountDisplay = document.getElementById('loan-amount-display');
    if (loanAmountDisplay) {
        loanAmountDisplay.textContent = '$' + amount.toLocaleString('en-US');
    }
}

// Initialize file upload previews
function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        const container = input.closest('.file-upload-container');
        const fileNameDisplay = container?.querySelector('.file-name');
        
        if (container && fileNameDisplay) {
            input.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const fileName = this.files[0].name;
                    const fileSize = (this.files[0].size / 1024).toFixed(1); // KB
                    
                    fileNameDisplay.textContent = `${fileName} (${fileSize} KB)`;
                    container.classList.add('has-file');
                    
                    // Check file size (16MB max)
                    if (this.files[0].size > 16 * 1024 * 1024) {
                        alert('File size exceeds 16MB. Please choose a smaller file.');
                        this.value = '';
                        fileNameDisplay.textContent = '';
                        container.classList.remove('has-file');
                        return;
                    }
                    
                    // Check file type
                    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
                    if (!allowedTypes.includes(this.files[0].type)) {
                        alert('Invalid file type. Please upload JPG, PNG or PDF files only.');
                        this.value = '';
                        fileNameDisplay.textContent = '';
                        container.classList.remove('has-file');
                        return;
                    }
                } else {
                    fileNameDisplay.textContent = '';
                    container.classList.remove('has-file');
                }
            });
        }
    });
}

// Register service worker for PWA functionality
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

// Check and show PWA install prompt if conditions are met
function checkAndShowInstallPrompt() {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return; // Already installed, no need for prompt
    }
    
    // Check if user has been shown the prompt before
    const promptShown = localStorage.getItem('pwaInstallPromptShown');
    if (promptShown) {
        return; // Already shown before
    }
    
    // Get the install prompt element
    const installPrompt = document.getElementById('pwa-install-prompt');
    if (!installPrompt) {
        return; // No prompt element found
    }
    
    // Show after a short delay
    setTimeout(() => {
        installPrompt.style.display = 'block';
        
        // Handle close button
        const closeBtn = installPrompt.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                installPrompt.style.display = 'none';
                localStorage.setItem('pwaInstallPromptShown', 'true');
            });
        }
        
        // Handle install button
        const installBtn = installPrompt.querySelector('.btn-install');
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                // The actual install prompt is handled in pwa.js
                document.dispatchEvent(new CustomEvent('show-install-prompt'));
                installPrompt.style.display = 'none';
                localStorage.setItem('pwaInstallPromptShown', 'true');
            });
        }
    }, 5000); // Show after 5 seconds
}

// Auto-hide alerts after 5 seconds
function autoHideAlerts() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 1s';
            
            setTimeout(() => {
                alert.remove();
            }, 1000);
        }, 5000);
    });
}

// Validate form fields on submit
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    let isValid = true;
    
    // Get all required inputs
    const requiredInputs = form.querySelectorAll('[required]');
    
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('is-invalid');
            
            // Create feedback message if not exists
            let feedback = input.nextElementSibling;
            if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = 'This field is required.';
                input.parentNode.insertBefore(feedback, input.nextSibling);
            }
        } else {
            input.classList.remove('is-invalid');
            
            // Remove feedback message if exists
            const feedback = input.nextElementSibling;
            if (feedback && feedback.classList.contains('invalid-feedback')) {
                feedback.remove();
            }
        }
    });
    
    return isValid;
}

// Format currency for display
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Prevent double submission of forms
function preventDoubleSubmission(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', function() {
        const submitButton = this.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            
            // If there's no loading overlay shown, create one
            if (loadingOverlay.style.display !== 'flex') {
                showLoading('Submitting...');
            }
        }
    });
}
