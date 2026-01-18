import { Heart, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export default function Header({ 
  netWorth = 0, 
  totalReturn = 0, 
  totalReturnPercent = 0,
  projections = null // { sixMonth, oneYear, fiveYear, tenYear }
}) {
  const isPositive = totalReturn >= 0;
  
  const formatValue = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`;
  };
  
  return (
    <header className="glass-card mb-6 px-6 py-4">
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
        
        {/* Net Worth Display */}
        {netWorth > 0 && (
          <div className="hidden md:flex flex-col items-center px-6 border-x border-slate-light/20">
            <span className="text-xs text-steel uppercase tracking-wider mb-1">Total Net Worth</span>
            <span className="text-3xl font-bold font-mono bg-gradient-to-r from-emerald-bright to-cyan-400 bg-clip-text text-transparent">
              ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="font-mono">
                {isPositive ? '+' : ''}{totalReturnPercent.toFixed(1)}%
              </span>
              <span className="text-steel ml-1">
                ({isPositive ? '+' : ''}${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </span>
            </div>
          </div>
        )}
        
        {/* 5-Year Projections */}
        {projections && netWorth > 0 && (
          <div className="hidden lg:flex flex-col items-start pl-6">
            <div className="flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-steel uppercase tracking-wider">5-Year Forecast</span>
            </div>
            <div className="flex flex-col gap-0.5 text-sm font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-steel text-xs w-8">6M:</span>
                <span className="text-amber-400 font-semibold">{formatValue(projections.sixMonth)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-bright"></div>
                <span className="text-steel text-xs w-8">1Y:</span>
                <span className="text-emerald-bright font-semibold">{formatValue(projections.oneYear)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sapphire-bright"></div>
                <span className="text-steel text-xs w-8">5Y:</span>
                <span className="text-sapphire-bright font-semibold">{formatValue(projections.fiveYear)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-bright"></div>
                <span className="text-steel text-xs w-8">10Y:</span>
                <span className="text-violet-bright font-semibold">{formatValue(projections.tenYear)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Net Worth */}
        {netWorth > 0 && (
          <div className="md:hidden text-right">
            <span className="text-xs text-steel block">Net Worth</span>
            <span className="text-lg font-bold font-mono text-emerald-bright">
              ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

