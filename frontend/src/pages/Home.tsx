import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import ProposalCard from '../components/ProposalCard';

const PROPOSALS_PER_PAGE = 12;

export default function Home() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [activeProposals, setActiveProposals] = useState<any[]>([]);
  const [closedProposals, setClosedProposals] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showClosed, setShowClosed] = useState(false);

  const { data: proposalIds } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getAllProposals',
  });

  useEffect(() => {
    if (proposalIds && Array.isArray(proposalIds)) {
      const allProposals = proposalIds.map((id) => ({ id: id.toString() })).reverse();
      setProposals(allProposals);
    }
  }, [proposalIds]);
  
  const checkProposalStatus = async (proposalId: string) => {
    try {
      const { readContract } = await import('wagmi/actions');
      const { config: wagmiConfig } = await import('../utils/wagmi');
      
      const proposal = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'getProposal',
        args: [BigInt(proposalId)],
      }) as any[];
      
      const isActive = proposal[6];
      return { id: proposalId, isActive };
    } catch {
      return { id: proposalId, isActive: false };
    }
  };
  
  useEffect(() => {
    const filterProposals = async () => {
      if (proposals.length === 0) return;
      
      const statusChecks = await Promise.all(
        proposals.map(p => checkProposalStatus(p.id))
      );
      
      const active = statusChecks.filter(p => p.isActive);
      const closed = statusChecks.filter(p => !p.isActive);
      
      setActiveProposals(active);
      setClosedProposals(closed);
    };
    
    filterProposals();
  }, [proposals]);

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-primary-400">Powered by Zama FHEVM</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Privacy-Preserving
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
                Decentralized Voting
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed">
              Cast encrypted votes using Fully Homomorphic Encryption. Your vote remains completely private on-chain while enabling transparent result counting.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/create"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-all font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Proposal
              </Link>
              
              <a
                href="https://docs.zama.ai/fhevm"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 text-slate-300 px-8 py-3 rounded-lg hover:bg-slate-700 transition-all font-semibold border border-slate-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>

      <div id="proposals" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {showClosed ? 'Closed Proposals' : 'Active Proposals'}
            </h2>
            <p className="text-slate-400">Vote on proposals or create your own</p>
          </div>
          
          <div className="flex items-center gap-3">
            {(activeProposals.length > 0 || closedProposals.length > 0) && (
              <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">{activeProposals.length} Active</span>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm text-slate-300">{closedProposals.length} Closed</span>
              </div>
            )}
            
            {closedProposals.length > 0 && (
              <button
                onClick={() => setShowClosed(!showClosed)}
                className="px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 transition-all"
              >
                Show {showClosed ? 'Active' : 'Closed'}
              </button>
            )}
          </div>
        </div>

        {proposals.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No proposals yet</h3>
            <p className="text-slate-400 mb-6">Be the first to create a proposal and start voting!</p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-all font-semibold"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Proposal
            </Link>
          </div>
        ) : (() => {
          const displayProposals = showClosed ? closedProposals : activeProposals;
          const totalPages = Math.ceil(displayProposals.length / PROPOSALS_PER_PAGE);
          const startIndex = (currentPage - 1) * PROPOSALS_PER_PAGE;
          const paginatedProposals = displayProposals.slice(startIndex, startIndex + PROPOSALS_PER_PAGE);
          
          return (
            <>
              {displayProposals.length === 0 ? (
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No {showClosed ? 'closed' : 'active'} proposals
                  </h3>
                  <p className="text-slate-400">
                    {showClosed ? 'All proposals are still active' : 'Create a new proposal to get started!'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedProposals.map((proposal) => (
                      <ProposalCard
                        key={proposal.id}
                        id={proposal.id}
                      />
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-all ${
                              currentPage === page
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
