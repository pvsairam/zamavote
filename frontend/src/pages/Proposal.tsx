import { useParams } from 'react-router-dom';
import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { encryptVote, decryptVotes, getFhevmInstance } from '../utils/fhevm';
import { useState, useEffect } from 'react';

export default function Proposal() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedResults, setDecryptedResults] = useState<{ yesVotes: number; noVotes: number } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [voteCount, setVoteCount] = useState(0);
  const [myVote, setMyVote] = useState<'yes' | 'no' | null>(null);
  
  // Pre-initialize FHEVM SDK on page load for faster voting
  useEffect(() => {
    getFhevmInstance().then(() => {
      console.log('✅ FHEVM SDK pre-loaded for faster voting');
    }).catch((err) => {
      console.error('⚠️ Failed to pre-load FHEVM SDK:', err);
    });
  }, []);
  
  // Load cached results and my vote from localStorage on mount
  useEffect(() => {
    if (!id || !address) return;
    
    // Load decrypted results
    const cachedResults = localStorage.getItem(`proposal_${id}_results`);
    if (cachedResults) {
      try {
        const parsed = JSON.parse(cachedResults);
        setDecryptedResults(parsed);
        console.log('📦 Loaded cached results from localStorage:', parsed);
      } catch (e) {
        console.error('Failed to parse cached results:', e);
      }
    }
    
    // Load my vote
    const myVoteKey = `proposal_${id}_vote_${address.toLowerCase()}`;
    const savedVote = localStorage.getItem(myVoteKey);
    if (savedVote) {
      setMyVote(savedVote as 'yes' | 'no');
      console.log('🗳️ Loaded my vote from localStorage:', savedVote);
    }
  }, [id, address]);
  
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: proposal, refetch: refetchProposal } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProposal',
    args: [BigInt(id || '0')],
  });

  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'checkIfVoted',
    args: [BigInt(id || '0'), address as `0x${string}`],
    query: {
      enabled: !!address,
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    eventName: 'VoteCast',
    onLogs: (logs) => {
      const relevantLogs = logs.filter((log: any) => {
        return log.args.proposalId === BigInt(id || '0');
      });
      
      if (relevantLogs.length > 0) {
        console.log('🔔 New votes cast!', relevantLogs);
        setVoteCount(prev => prev + relevantLogs.length);
        refetchProposal();
        refetchHasVoted();
      }
    },
  });

  useEffect(() => {
    if (!proposal) return;
    
    const [, , , , deadline] = proposal as [bigint, string, string, string, bigint, bigint, boolean];
    
    const updateTimer = () => {
      const remaining = Math.max(0, Number(deadline) - Date.now() / 1000);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [proposal]);

  const handleDecryptResults = async () => {
    if (!address || !isConnected) {
      alert('Please connect your wallet');
      return;
    }

    if (!isCreator) {
      alert('Only the proposal creator can decrypt results');
      return;
    }

    // Store address in a const to ensure it doesn't change during async operations
    const userAddress = address;
    console.log('👤 Decrypting as:', userAddress);
    console.log('👤 Address type:', typeof userAddress);
    console.log('👤 Address length:', userAddress?.length);
    console.log('👤 Full address:', JSON.stringify(userAddress));

    try {
      setIsDecrypting(true);
      console.log('🔓 Starting decryption for proposal', id);
      
      const { readContract } = await import('wagmi/actions');
      const { config: wagmiConfig } = await import('../utils/wagmi');
      
      const encryptedVotes = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'getEncryptedVotes',
        args: [BigInt(id || '0')],
        account: userAddress as `0x${string}`,
      }) as [bigint, bigint];

      console.log('📦 Got encrypted vote handles:', encryptedVotes);
      
      const [yesHandle, noHandle] = encryptedVotes;

      // Create ethers signer from window.ethereum
      const { BrowserProvider } = await import('ethers');
      
      if (!window.ethereum) {
        throw new Error('No ethereum provider found');
      }
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log('✅ Got ethers signer for address:', await signer.getAddress());

      const { yesVotes, noVotes } = await decryptVotes(
        yesHandle,
        noHandle,
        CONTRACT_ADDRESS,
        userAddress,
        signer
      );

      const results = { yesVotes, noVotes };
      setDecryptedResults(results);
      
      // Save to localStorage so it persists across page refreshes
      localStorage.setItem(`proposal_${id}_results`, JSON.stringify(results));
      
      console.log('✅ Results decrypted successfully:', results);
    } catch (err) {
      console.error('❌ Error decrypting results:', err);
      alert(`Failed to decrypt results: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  if (!proposal) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin h-8 w-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-slate-400">Loading proposal details...</p>
          </div>
        </div>
      </div>
    );
  }

  const [, creator, title, description, deadline, createdAt, isActive] = proposal as [
    bigint,
    string,
    string,
    string,
    bigint,
    bigint,
    boolean
  ];

  const deadlineDate = new Date(Number(deadline) * 1000);
  const createdDate = new Date(Number(createdAt) * 1000);
  
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const isCreator = address?.toLowerCase() === creator.toLowerCase();

  const statusConfig = isActive
    ? { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
    : { label: 'Closed', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };

  const handleVote = async (voteValue: 0 | 1) => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to vote');
      return;
    }
    if (hasVoted) {
      alert('You have already voted on this proposal');
      return;
    }
    
    try {
      setIsEncrypting(true);
      
      const { encryptedData, inputProof } = await encryptVote(
        voteValue,
        CONTRACT_ADDRESS,
        address
      );

      // Save vote to localStorage so user can see what they voted
      const myVoteKey = `proposal_${id}_vote_${address.toLowerCase()}`;
      const voteChoice = voteValue === 1 ? 'yes' : 'no';
      localStorage.setItem(myVoteKey, voteChoice);
      setMyVote(voteChoice);

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'castVote',
        args: [BigInt(id || '0'), encryptedData, inputProof as `0x${string}`],
        gas: BigInt(5000000),
      });
    } catch (err) {
      console.error('Error voting:', err);
      alert(`Failed to cast vote: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 sm:p-10 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {voteCount > 0 && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse">
                    🔔 {voteCount} new {voteCount === 1 ? 'vote' : 'votes'}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{title}</h1>
              <p className="text-lg text-slate-300 leading-relaxed">{description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created</span>
              </div>
              <p className="font-semibold text-white">{createdDate.toLocaleDateString()}</p>
              <p className="text-xs text-slate-400 mt-1">{createdDate.toLocaleTimeString()}</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Deadline</span>
              </div>
              <p className="font-semibold text-white">{deadlineDate.toLocaleDateString()}</p>
              <p className="text-xs text-slate-400 mt-1">{deadlineDate.toLocaleTimeString()}</p>
            </div>

            <div className={`bg-slate-900/50 border border-slate-700/30 rounded-lg p-4 ${!isActive && timeRemaining === 0 ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{isActive ? 'Time Remaining' : 'Status'}</span>
              </div>
              <p className={`font-semibold ${isActive && timeRemaining < 3600 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTimeRemaining(timeRemaining)}
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Creator</span>
              </div>
              <p className="font-mono text-sm text-white truncate">
                {creator.slice(0, 6)}...{creator.slice(-4)}
              </p>
              {isCreator && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  You
                </span>
              )}
            </div>
          </div>
        </div>

        {isActive && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Cast Your Vote</h2>
            <p className="text-slate-400 mb-6">
              Your vote will be encrypted using Fully Homomorphic Encryption and remain private on-chain
            </p>
            
            {isSuccess ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <p className="text-sm text-green-400 mb-2">
                  ✅ Vote successfully cast! Transaction confirmed on-chain.
                </p>
                {hash && (
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-green-300 hover:text-green-200 underline transition-colors"
                  >
                    <span>View transaction on Sepolia Etherscan</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            ) : hasVoted ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-400">
                  ✅ You have already voted on this proposal
                </p>
              </div>
            ) : (
              <>
                {isEncrypting && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-purple-400">
                        Encrypting your vote with FHE...
                      </p>
                    </div>
                  </div>
                )}
                {(isPending || isConfirming) && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm text-blue-400">
                        {isPending ? 'Confirm transaction in wallet...' : 'Waiting for confirmation...'}
                      </p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center mb-4">
                    <p className="text-sm text-red-400">
                      ❌ Error: {error.message}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleVote(1)}
                    disabled={!isConnected || isEncrypting || isPending || isConfirming}
                    className="group relative overflow-hidden bg-green-600/10 border-2 border-green-500/30 text-green-400 px-8 py-4 rounded-xl hover:bg-green-600 hover:text-white hover:border-green-500 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Vote Yes
                  </button>
                  <button
                    onClick={() => handleVote(0)}
                    disabled={!isConnected || isEncrypting || isPending || isConfirming}
                    className="group relative overflow-hidden bg-red-600/10 border-2 border-red-500/30 text-red-400 px-8 py-4 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-500 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Vote No
                  </button>
                </div>
                {!isConnected && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center mt-4">
                    <p className="text-sm text-amber-400">
                      Please connect your wallet to vote
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {hasVoted && myVote && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">🗳️ My Vote</h2>
            <p className="text-slate-400 mb-6">
              You voted on this proposal. Here's what you chose:
            </p>
            
            <div className={`border-2 rounded-xl p-6 text-center ${
              myVote === 'yes' 
                ? 'bg-green-600/10 border-green-500/30' 
                : 'bg-red-600/10 border-red-500/30'
            }`}>
              <div className="flex items-center justify-center gap-3">
                {myVote === 'yes' ? (
                  <>
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-2xl font-bold text-green-400">You Voted YES</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-2xl font-bold text-red-400">You Voted NO</span>
                  </>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-3">
                Your vote is encrypted on-chain and remains private
              </p>
            </div>
          </div>
        )}

        {!isActive && isCreator && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Decrypt Results (Creator Only)</h2>
            <p className="text-slate-400 mb-6">
              As the proposal creator, you can decrypt and view the final vote counts using client-side FHE decryption.
            </p>
            
            {decryptedResults ? (
              <div className="space-y-4">
                {/* Pass/Fail Status */}
                {(() => {
                  const totalVotes = decryptedResults.yesVotes + decryptedResults.noVotes;
                  const passed = decryptedResults.yesVotes > decryptedResults.noVotes;
                  
                  if (totalVotes === 0) {
                    return (
                      <div className="bg-slate-600/10 border-2 border-slate-500/30 rounded-xl p-6 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h3 className="text-2xl font-bold text-slate-300">No Votes Cast</h3>
                        </div>
                        <p className="text-sm text-slate-400">This proposal did not receive any votes</p>
                      </div>
                    );
                  }
                  
                  return passed ? (
                    <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6 text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-green-400">✅ Proposal Passed</h3>
                      </div>
                      <p className="text-sm text-green-300">More voters chose "Yes" than "No"</p>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-red-400">❌ Proposal Failed</h3>
                      </div>
                      <p className="text-sm text-red-300">More voters chose "No" than "Yes"</p>
                    </div>
                  );
                })()}
                
                {/* Vote Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-400 mb-1">Yes Votes</p>
                        <p className="text-3xl font-bold text-white">{decryptedResults.yesVotes}</p>
                      </div>
                      <svg className="w-12 h-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-400 mb-1">No Votes</p>
                        <p className="text-3xl font-bold text-white">{decryptedResults.noVotes}</p>
                      </div>
                      <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-sm text-purple-400 text-center">
                    🔓 Results decrypted successfully using FHE
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDecryptResults}
                disabled={isDecrypting}
                className="w-full bg-purple-600/10 border-2 border-purple-500/30 text-purple-400 px-8 py-4 rounded-xl hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDecrypting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Decrypting Results...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Decrypt Results
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {!isActive && !isCreator && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Voting Ended</h3>
                <p className="text-slate-400 text-sm">
                  This proposal is closed. Only the proposal creator can decrypt and view results using the Zama relayer SDK.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
