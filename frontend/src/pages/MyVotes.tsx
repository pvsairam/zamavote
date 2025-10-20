import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';

interface MyVoteData {
  proposalId: string;
  vote: 'yes' | 'no' | 'unknown';
  proposal?: any;
}

export default function MyVotes() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [myVotes, setMyVotes] = useState<MyVoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: proposalCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'proposalCount',
  });

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const loadMyVotes = async () => {
      try {
        const votedProposals = new Set<string>();
        
        if (proposalCount && publicClient) {
          const count = Number(proposalCount);
          
          for (let i = 1; i <= count; i++) {
            try {
              const hasVoted = await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'checkIfVoted',
                args: [BigInt(i), address as `0x${string}`],
              });
              
              if (hasVoted) {
                votedProposals.add(i.toString());
              }
            } catch (err) {
              console.error(`Error checking vote for proposal ${i}:`, err);
            }
          }
        }

        const votes: MyVoteData[] = [];
        const prefix = 'proposal_';
        const suffix = `_vote_${address.toLowerCase()}`;

        votedProposals.forEach((proposalId) => {
          const key = `${prefix}${proposalId}${suffix}`;
          const savedVote = localStorage.getItem(key) as 'yes' | 'no' | null;
          
          votes.push({
            proposalId,
            vote: savedVote || 'unknown',
          });
        });

        votes.sort((a, b) => parseInt(b.proposalId) - parseInt(a.proposalId));
        setMyVotes(votes);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading votes:', error);
        setIsLoading(false);
      }
    };

    loadMyVotes();
  }, [address, proposalCount, publicClient]);

  if (!isConnected) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">🗳️ My Votes</h1>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-8 mt-8">
              <p className="text-amber-400">
                Please connect your wallet to view your voting history
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">🗳️ My Votes</h1>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 mt-8">
              <p className="text-slate-400">Loading your votes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (myVotes.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">🗳️ My Votes</h1>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 mt-8">
              <p className="text-slate-400 mb-4">
                You haven't voted on any proposals yet
              </p>
              <Link
                to="/"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-all font-semibold"
              >
                Browse Proposals
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">🗳️ My Votes</h1>
          <p className="text-slate-400">
            All proposals you've participated in ({myVotes.length} vote{myVotes.length !== 1 ? 's' : ''})
          </p>
        </div>

        <div className="space-y-4">
          {myVotes.map(({ proposalId, vote }) => (
            <VoteCard key={proposalId} proposalId={proposalId} vote={vote} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VoteCard({ proposalId, vote }: { proposalId: string; vote: 'yes' | 'no' | 'unknown' }) {
  const { data: proposal } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProposal',
    args: [BigInt(proposalId)],
  });

  if (!proposal) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  const [id, creator, title, description, deadline, , , createdAt, isActive] = proposal as any[];
  const now = Math.floor(Date.now() / 1000);
  const isExpired = Number(deadline) < now;

  return (
    <Link
      to={`/proposal/${proposalId}`}
      className="block bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-primary-500/50 hover:bg-slate-800/70 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors truncate">
              {title}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                isActive && !isExpired
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isActive && !isExpired ? 'Active' : 'Closed'}
            </span>
          </div>
          
          <p className="text-slate-400 text-sm line-clamp-2 mb-4">
            {description}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Proposal #{proposalId}</span>
            <span>•</span>
            <span>
              {isActive && !isExpired
                ? `Ends ${new Date(Number(deadline) * 1000).toLocaleDateString()}`
                : `Ended ${new Date(Number(deadline) * 1000).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-2 rounded-lg border-2 bg-primary-600/10 border-primary-500/30 text-primary-400">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">VOTED</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
