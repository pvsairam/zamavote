import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';

export default function CreateProposal() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('7');
  const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours' | 'days'>('days');
  
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Convert duration to seconds based on selected unit
      let durationInSeconds: bigint;
      const durationValue = parseFloat(duration);
      
      switch (timeUnit) {
        case 'minutes':
          durationInSeconds = BigInt(Math.floor(durationValue * 60));
          break;
        case 'hours':
          durationInSeconds = BigInt(Math.floor(durationValue * 60 * 60));
          break;
        case 'days':
          durationInSeconds = BigInt(Math.floor(durationValue * 24 * 60 * 60));
          break;
      }
      
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createProposal',
        args: [title, description, durationInSeconds],
        gas: BigInt(5000000),
      });
    } catch (err) {
      console.error('Error creating proposal:', err);
      alert('Failed to create proposal: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (isSuccess) {
    setTimeout(() => navigate('/'), 10000);
  }

  const loading = isPending || isConfirming;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Create New Proposal</h1>
          <p className="text-slate-400">Start a new encrypted voting proposal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Proposal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter a clear, concise title"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  rows={6}
                  placeholder="Provide details about what you're proposing and why voters should consider it"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Voting Duration
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    min="1"
                    step="1"
                    required
                    disabled={loading}
                    placeholder="Enter duration"
                  />
                  <select
                    value={timeUnit}
                    onChange={(e) => setTimeUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                    className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    disabled={loading}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Choose duration and time unit for voting period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-300 mb-1">Privacy Protection</h3>
                <p className="text-sm text-primary-200/80">
                  All votes will be encrypted using Zama's Fully Homomorphic Encryption. Only you (as the proposal creator) will be able to decrypt the results after the voting period ends.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">
                Error: {error.message}
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-green-400 mb-2">
                ✅ Proposal created successfully! Redirecting in 10 seconds...
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
          )}

          {hash && !isSuccess && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                Transaction submitted. Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isConnected}
            className="w-full bg-primary-600 text-white px-8 py-4 rounded-lg hover:bg-primary-700 transition-all font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isPending ? 'Confirm in wallet...' : 'Creating Proposal...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Proposal
              </>
            )}
          </button>

          {!isConnected && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-sm text-red-400">
                Please connect your wallet to create a proposal
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
