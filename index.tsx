import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ClerkProvider } from '@clerk/react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/">
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ClerkProvider>
  </React.StrictMode>
);