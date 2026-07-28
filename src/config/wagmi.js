import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base } from 'wagmi/chains';

// Robinhood Chain — ETH native currency
const robinhoodChain = {
  id: 70000,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://robin-rpc.alt.technology'] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://explorer.robinhoodchain.io' } },
};

export const config = getDefaultConfig({
  appName: 'Hood Relief Bot',
  // Set VITE_WALLETCONNECT_PROJECT_ID in .env.local — free ID at cloud.walletconnect.com.
  // Injected wallets (MetaMask etc.) work without it.
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000',
  chains: [robinhoodChain, base, mainnet],
  ssr: false,
});
