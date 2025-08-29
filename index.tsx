import './firebase';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Nuke service workers and caches for debugging. Remove after fix is confirmed.
(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        console.log('Service workers unregistered.');
      } catch (error) {
        console.error('Error unregistering service workers:', error);
      }
    }
    if (window.caches) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        console.log('Caches cleared.');
      } catch (error) {
        console.error('Error clearing caches:', error);
      }
    }
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);