import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './utils/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import Home from './pages/Home';
import Proposal from './pages/Proposal';
import CreateProposal from './pages/CreateProposal';
import MyVotes from './pages/MyVotes';
import Header from './components/Header';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="container mx-auto px-4 py-8 flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/proposal/:id" element={<Proposal />} />
                  <Route path="/create" element={<CreateProposal />} />
                  <Route path="/my-votes" element={<MyVotes />} />
                </Routes>
              </main>
              <footer className="border-t border-white/10 py-6 mt-auto">
                <div className="container mx-auto px-4 text-center text-sm text-white/60">
                  Built with <span className="text-red-500">❤️</span> by{' '}
                  <a
                    href="https://x.com/xtestnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    xtestnet
                  </a>
                </div>
              </footer>
            </div>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
