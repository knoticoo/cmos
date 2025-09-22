import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              if (window.confirm('New version available! Click OK to update.')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Add PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button or banner
  const installBanner = document.createElement('div');
  installBanner.innerHTML = `
    <div style="
      position: fixed; 
      bottom: 20px; 
      left: 20px; 
      right: 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 1rem; 
      border-radius: 12px; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideUp 0.3s ease-out;
    ">
      <div>
        <strong>👑 Install Kings Choice MVP</strong><br>
        <small>Add to home screen for the best experience!</small>
      </div>
      <div>
        <button id="install-btn" style="
          background: rgba(255,255,255,0.2); 
          border: 2px solid rgba(255,255,255,0.3); 
          color: white; 
          padding: 0.5rem 1rem; 
          border-radius: 8px; 
          cursor: pointer;
          margin-right: 0.5rem;
        ">Install</button>
        <button id="dismiss-btn" style="
          background: transparent; 
          border: none; 
          color: white; 
          padding: 0.5rem; 
          cursor: pointer;
          opacity: 0.8;
        ">×</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(installBanner);
  
  // Handle install button click
  document.getElementById('install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      installBanner.remove();
    }
  });
  
  // Handle dismiss button click
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    installBanner.remove();
    deferredPrompt = null;
  });
});

// Track PWA installation
window.addEventListener('appinstalled', (evt) => {
  console.log('Kings Choice MVP was installed successfully');
});