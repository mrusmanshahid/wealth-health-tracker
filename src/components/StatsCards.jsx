import { TrendingUp, TrendingDown, Wallet, Target, PiggyBank, Sparkles, DollarSign } from 'lucide-react';

export default function StatsCards({ metrics }) {
  const {
    totalInvested,
    currentValue,
    totalReturn,
    totalReturnPercent,
    projectedValue5Y,
    projectedReturn5Y,
    projectedReturnPercent5Y,
  } = metrics;

  const isPositiveReturn = totalReturn >= 0;
  const isPositiveForecast = projectedReturn5Y >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {/* Total Invested */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-violet/20">
            <Wallet className="w-4 h-4 text-violet-bright" />
          </div>
          <span className="text-xs text-steel uppercase tracking-wide">Cost Basis</span>
        </div>
        <p className="text-xl font-bold font-mono text-pearl">
          ${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Current Value & P/L */}
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${isPositiveReturn ? 'bg-emerald-glow/20' : 'bg-ruby/20'}`}>
            <DollarSign className={`w-4 h-4 ${isPositiveReturn ? 'text-emerald-bright' : 'text-ruby-bright'}`} />
          </div>
          <span className="text-xs text-steel uppercase tracking-wide">Value</span>
        </div>
        <p className={`text-xl font-bold font-mono ${isPositiveReturn ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
          ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {isPositiveReturn ? (
            <TrendingUp className="w-3 h-3 text-emerald-pale" />
          ) : (
            <TrendingDown className="w-3 h-3 text-ruby-bright" />
          )}
          <p className={`text-xs font-mono ${isPositiveReturn ? 'text-emerald-pale' : 'text-ruby-bright'}`}>
            {isPositiveReturn ? '+' : ''}{totalReturnPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Unrealized P&L */}
      <div className={`stat-card relative overflow-hidden`}>
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${isPositiveReturn ? 'bg-emerald-glow' : 'bg-ruby'}`}></div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${isPositiveReturn ? 'bg-emerald-glow/20' : 'bg-ruby/20'}`}>
            {isPositiveReturn ? (
              <TrendingUp className="w-4 h-4 text-emerald-bright" />
            ) : (
              <TrendingDown className="w-4 h-4 text-ruby-bright" />
            )}
          </div>
          <span className="text-xs text-steel uppercase tracking-wide">P&L</span>
        </div>
        <p className={`text-xl font-bold font-mono ${isPositiveReturn ? 'text-emerald-bright glow-text' : 'text-ruby-bright'}`}>
          {isPositiveReturn ? '+' : ''}${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* 5 Year Projection */}
      <div className="stat-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-sapphire/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-sapphire/20">
              <Target className="w-4 h-4 text-sapphire-bright" />
            </div>
            <span className="text-xs text-steel uppercase tracking-wide">5Y</span>
          </div>
          <p className={`text-xl font-bold font-mono text-sapphire-bright`}>
            ${projectedValue5Y.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className={`text-xs mt-0.5 ${isPositiveForecast ? 'text-sapphire-bright' : 'text-ruby-bright'}`}>
            {isPositiveForecast ? '+' : ''}{projectedReturnPercent5Y?.toFixed(0) || 0}%
          </p>
        </div>
      </div>
    </div>
  );
}
