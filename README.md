# zVote - Privacy-Preserving Decentralized Voting dApp

## Overview
zVote is a fully decentralized voting application built with Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine). Its primary purpose is to enable private, encrypted on-chain voting where individual votes remain confidential while allowing for aggregate vote counting. The dApp features permissionless proposal creation, encrypted vote casting, and client-side decryption of results by proposal creators. This project aims to deliver a production-ready solution for truly private blockchain-based voting.

## Key Features
- ✅ **Fully Private Voting**: Individual votes encrypted on-chain using FHEVM
- ✅ **Permissionless**: Anyone can create proposals - no admin approval needed
- ✅ **Client-Side Decryption**: Only proposal creators can view results
- ✅ **Real-Time Updates**: Live countdown timers and vote notifications
- ✅ **Pass/Fail Badges**: Visual voting outcomes on completed proposals
- ✅ **Persistent Results**: Decrypted results cached in localStorage

## System Architecture

### UI/UX
The frontend utilizes React 19 with TypeScript, styled with Tailwind CSS for a modern dark navy gradient theme featuring glassmorphism cards. Key components include a Header, ProposalCard, and dedicated pages for Home, CreateProposal, and Proposal details. Live countdown timers and real-time blockchain event updates ensure a dynamic and responsive user experience.

### Technical Implementation
The dApp is built on a robust tech stack:
- **Smart Contracts**: Developed in Solidity ^0.8.24, leveraging the `@fhevm/solidity` library (v0.5.0) for encrypted types (euint32) to store votes. Hardhat is used for development and deployment, with `@fhevm/hardhat-plugin` for testing.
- **Frontend**: React 19 + TypeScript, powered by Vite 7.1. Wallet integration is handled by Wagmi 2.12 and RainbowKit 2.2, with ethers.js v6 for blockchain interactions and React Router v7 for navigation.
- **Zama Relayer SDK Integration**: The Zama Relayer SDK is integrated via ESM CDN for client-side encryption and decryption of votes, ensuring privacy without WASM bundling issues.

### Feature Specifications
- **Permissionless Proposal Creation**: Any user can create a voting proposal.
- **Encrypted Voting**: Votes are cast using FHEVM's encrypted types, making individual votes confidential on-chain.
- **Client-Side Decryption**: Proposal creators can decrypt the aggregated vote results using the Zama Relayer SDK, ensuring only they can view the outcome of their proposals.
- **Live Updates**: Real-time countdown timers for active proposals and live notifications for new votes via blockchain event listening keep the UI synchronized with the blockchain state.
- **Wallet Connectivity**: Seamless integration with MetaMask/WalletConnect via Wagmi and RainbowKit.

### System Design Choices
- **Privacy-Centric Voting**: The core design revolves around Fully Homomorphic Encryption (FHE) to ensure vote privacy. On-chain decryption was intentionally removed in favor of client-side decryption by the proposal creator to enhance privacy and simplify the smart contract.
- **Decentralization**: The system is designed to be permissionless, with no central authority for proposal creation or vote management.
- **Scalability**: Deployed on the Sepolia testnet, leveraging Zama's FHEVM coprocessor infrastructure for efficient FHE operations.

## External Dependencies
- **Blockchain Network**: Sepolia Testnet (Ethereum compatible)
- **FHEVM Infrastructure**: Zama's FHEVM Coprocessor (ACL and KMS contracts)
- **Wallet Connectors**: MetaMask, WalletConnect (via Wagmi and RainbowKit)
- **Zama SDKs**:
    - `@fhevm/solidity`: For FHEVM-compatible smart contract development.
    - `@zama-fhe/relayer-sdk`: For client-side FHE operations (encryption, decryption).
- **Etherscan**: For transaction verification and block explorer functionalities on Sepolia.

## Smart Contract Deployment

**Network:** Sepolia Testnet  
**Contract Address:** `0x7fD451c9256c5128bedA7Ca623B36a8a508Fad35`  
**Etherscan:** [View Contract](https://sepolia.etherscan.io/address/0x7fD451c9256c5128bedA7Ca623B36a8a508Fad35)

## Getting Started

### Prerequisites
- Node.js v18+
- MetaMask or WalletConnect wallet
- Sepolia testnet ETH

### Installation

```bash
# Install dependencies
npm install
cd frontend && npm install

# Run frontend development server
cd frontend
npm run dev
```

### Deploy Smart Contract (Optional)

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

## How It Works

1. **Create Proposal**: Any user can create a voting proposal with title, description, and duration
2. **Cast Vote**: Users vote Yes/No - votes are encrypted client-side and stored on-chain as `euint32`
3. **Decrypt Results**: Proposal creators can decrypt aggregated results using the Zama Relayer SDK
4. **View Outcomes**: Pass/Fail badges appear after decryption, persisted in localStorage

## Built With

- **Zama FHEVM** - Fully Homomorphic Encryption for privacy
- **React 19** - Modern UI framework
- **Solidity ^0.8.24** - Smart contract development
- **Wagmi + RainbowKit** - Wallet connectivity
- **Tailwind CSS** - Styling

## License

MIT
