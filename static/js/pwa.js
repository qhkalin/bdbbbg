// Progressive Web App (PWA) functionality
let deferredPrompt;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Optionally, send analytics event that PWA install was available
    console.log('Install prompt available');
});

// Listen for custom event to show install prompt
document.addEventListener('show-install-prompt', () => {
    if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                // Could send analytics event
            } else {
                console.log('User dismissed the install prompt');
            }
            
            // Clear the saved prompt since it can't be used again
            deferredPrompt = null;
        });
    }
});

// Listen for app installed event
window.addEventListener('appinstalled', (evt) => {
    // Log install to analytics
    console.log('AmeriFund Loan was installed.');
    
    // Hide any install prompts
    const installPrompt = document.getElementById('pwa-install-prompt');
    if (installPrompt) {
        installPrompt.style.display = 'none';
    }
});

// Check if the app is launched in standalone mode (installed)
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is running in standalone mode');
    // Could adjust UI for installed app experience
}
