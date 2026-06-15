import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App';
import InstallPrompt from './src/components/InstallPrompt';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <InstallPrompt />
  </StrictMode>
);
