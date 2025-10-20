import { Link } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';

interface ProposalCardProps {
  id: string;
}

export default function ProposalCard({ id }: ProposalCardProps) {
  const [cachedResults, setCachedResults] = useState<{ yesVotes: number; noVotes: number } | null>(null);
  
  const { data: proposalData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProposal',
    args: [BigInt(id)],
  });
  
  // Load cached results from localStorage
  useEffect(() => {
    const storageKey = `proposal_${id}_results`;
    const results = localStorage.getItem(storageKey);
    console.log(`🏠 ProposalCard #${id}: Checking localStorage for "${storageKey}"`, results);
    if (results) {
      try {
        const parsed = JSON.parse(results);
        setCachedResults(parsed);
        console.log(`✅ ProposalCard #${id}: Loaded cached results:`, parsed);
      } catch (e) {
        console.error(`❌ ProposalCard #${id}: Failed to parse cached results:`, e);
      }
    } else {
      console.log(`ℹ️ ProposalCard #${id}: No cached results found`);
    }
  }, [id]);

  if (!proposalData) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
      </div>
    );
  }

  const [, , title, description, deadline, , isActive] = proposalData as [
    bigint,
    string,
    string,
    string,
    bigint,
    bigint,
    boolean
  ];

  const deadlineTimestamp = Number(deadline);
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = Math.max(0, deadlineTimestamp - now);
  const hoursLeft = Math.floor(timeRemaining / 3600);
  const daysLeft = Math.floor(timeRemaining / 86400);

  // Determine proposal status
  const status = isActive ? 'active' : 'closed';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  
  // Determine voting result if decrypted
  let votingResult: 'passed' | 'failed' | null = null;
  if (!isActive && cachedResults) {
    const totalVotes = cachedResults.yesVotes + cachedResults.noVotes;
    if (totalVotes > 0) {
      votingResult = cachedResults.yesVotes > cachedResults.noVotes ? 'passed' : 'failed';
    }
  }

  const statusColors = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    closed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  
  const resultColors = {
    passed: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <Link to={`/proposal/${id}`}>
      <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors truncate">
              {title}
            </h3>
            <p className="text-slate-400 text-sm line-clamp-2">{description}</p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${statusColors[status]}`}>
              {statusLabel}
            </span>
            {votingResult && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${resultColors[votingResult]}`}>
                {votingResult === 'passed' && '✅ Passed'}
                {votingResult === 'failed' && '❌ Failed'}
              </span>
            )}
          </div>
        </div>

        {isActive && (
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 
               hoursLeft > 0 ? `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} remaining` : 
               'Ending soon'}
            </span>
          </div>
        )}

        <div className="flex items-center text-primary-400 text-sm font-medium group-hover:gap-2 transition-all">
          <span>View Details</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
