import { Heart, RefreshCw } from 'lucide-react';

export default function Header({ onRefresh, isLoading }) {
  return (
    <header className="glass-card mb-8 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-glow/40 to-cyan-400/30 blur-xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-emerald-glow via-emerald-bright to-cyan-500 p-3 rounded-xl shadow-lg shadow-emerald-glow/20">
              <Heart className="w-7 h-7 text-white fill-white/30" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-bright via-cyan-400 to-emerald-glow bg-clip-text text-transparent">W</span>
              <span className="bg-gradient-to-r from-pearl to-silver bg-clip-text text-transparent">HEALTH</span>
            </h1>
            <p className="text-sm text-steel">Your financial health companion</p>
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

