import { TrendingUp, Wallet, Settings, RefreshCw } from 'lucide-react';

export default function Header({ onRefresh, isLoading }) {
  return (
    <header className="glass-card mb-8 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-glow/30 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-emerald-glow to-emerald-bright p-3 rounded-xl">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pearl to-silver bg-clip-text text-transparent">
              Wealth Forecast
            </h1>
            <p className="text-sm text-steel">Track & predict your portfolio growth</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
}

