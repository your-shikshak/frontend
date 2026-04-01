import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppThemeProvider from './theme/ThemeProvider';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/global.css';
import { Analytics } from "@vercel/analytics/react"
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AppThemeProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <App />
            <Analytics />
          </ErrorBoundary>
        </BrowserRouter>
      </AppThemeProvider>
    </Provider>
  </React.StrictMode>
);

