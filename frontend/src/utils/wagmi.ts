import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'zVote',
  projectId: '9a16289bc3c40be7c13d0ef277a838c8',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/015ce770e4f24900b2ad8c0e8aa975a0'),
  },
  ssr: false,
});
