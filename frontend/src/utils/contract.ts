import { ethers } from 'ethers';
import ABI from './ZamaVoteABI.json';

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

export const CONTRACT_ABI = ABI;

export function getContract(provider: ethers.BrowserProvider | ethers.JsonRpcProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}
