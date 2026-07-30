import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Analytics } from '@vercel/analytics/react';
import '@rainbow-me/rainbowkit/styles.css';

import App from './App';
import { config } from './config/wagmi';
import { hoodReliefTheme } from './theme/rainbowkit';
import './index.css';

const queryClient = new QueryClient();

// Catches any unexpected render crash and shows a friendly reload screen
// instead of a blank white page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('App crash:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#F7F4E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 380 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💛</div>
            <h1 style={{ fontSize: 22, color: '#1C1C14', marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: 'rgba(28,28,20,0.64)', marginBottom: 20 }}>The hood hit a snag. Reload the page and you'll be right back.</p>
            <button onClick={() => window.location.reload()} style={{ background: '#C4E538', color: '#1C1C14', border: 'none', borderRadius: 100, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={hoodReliefTheme} modalSize="compact">
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
      <Analytics />
    </ErrorBoundary>
  </React.StrictMode>
);
