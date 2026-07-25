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
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // get free ID at cloud.walletconnect.com
  chains: [robinhoodChain, base, mainnet],
  ssr: false,
});
