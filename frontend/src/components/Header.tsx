import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
              ZamaVote
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <a 
              href="/#proposals" 
              className="text-slate-300 hover:text-white transition-colors font-medium"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('proposals')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Proposals
            </a>
            <Link 
              to="/my-votes" 
              className="hidden sm:block text-slate-300 hover:text-white transition-colors font-medium"
            >
              My Votes
            </Link>
            <Link 
              to="/create" 
              className="hidden sm:block text-slate-300 hover:text-white transition-colors font-medium"
            >
              Create Proposal
            </Link>
            <ConnectButton />
          </nav>
        </div>
      </div>
    </header>
  );
}
