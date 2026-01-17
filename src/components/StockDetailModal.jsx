import { X, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import PortfolioChart from './PortfolioChart';
import { calculateCAGR, calculateMonthlyStats } from '../utils/forecasting';

export default function StockDetailModal({ stock, onClose }) {
  if (!stock) return null;

  const shares = stock.investedAmount / stock.purchasePrice;
  const currentValue = shares * (stock.currentPrice || stock.purchasePrice);
  const gain = currentValue - stock.investedAmount;
  const gainPercent = (gain / stock.investedAmount) * 100;
  const isPositive = gain >= 0;

  // Calculate metrics
  const { avgReturn, volatility } = stock.history ? calculateMonthlyStats(stock.history) : { avgReturn: 0, volatility: 0 };
  const annualizedReturn = avgReturn * 12 * 100;
  const annualizedVolatility = volatility * Math.sqrt(12) * 100;

  // CAGR
  const firstPrice = stock.history?.[0]?.price || stock.purchasePrice;
  const lastPrice = stock.currentPrice || stock.purchasePrice;
  const years = stock.history ? stock.history.length / 12 : 1;
  const cagr = calculateCAGR(firstPrice, lastPrice, years);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-light/50 transition-colors z-10"
        >
          <X className="w-5 h-5 text-steel" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-emerald-glow/20">
            <BarChart3 className="w-8 h-8 text-emerald-bright" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-pearl">{stock.symbol}</h2>
            <p className="text-silver">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-pearl">
              ${(stock.currentPrice || stock.purchasePrice).toFixed(2)}
            </p>
            <p className={`text-sm ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
              {isPositive ? '+' : ''}{gainPercent.toFixed(2)}% since purchase
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-xs text-steel uppercase tracking-wide mb-1">
              <DollarSign className="inline w-3 h-3" /> Invested
            </p>
            <p className="font-mono font-semibold text-pearl">
              ${stock.investedAmount.toLocaleString()}
            </p>
          </div>
          
          <div className="stat-card">
            <p className="text-xs text-steel uppercase tracking-wide mb-1">Current Value</p>
            <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
              ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <div className="stat-card">
            <p className="text-xs text-steel uppercase tracking-wide mb-1">Shares Owned</p>
            <p className="font-mono font-semibold text-pearl">
              {shares.toFixed(4)}
            </p>
          </div>
          
          <div className="stat-card">
            <p className="text-xs text-steel uppercase tracking-wide mb-1">
              {isPositive ? 'Gain' : 'Loss'}
            </p>
            <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
              {isPositive ? '+' : ''}${gain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="glass-card p-4 mb-6 bg-slate-dark/30">
          <h3 className="text-sm font-semibold text-silver mb-3 uppercase tracking-wide">Performance Metrics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-steel mb-1">CAGR (10Y)</p>
              <p className={`font-mono text-lg ${cagr >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-steel mb-1">Avg Annual Return</p>
              <p className={`font-mono text-lg ${annualizedReturn >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                {annualizedReturn >= 0 ? '+' : ''}{annualizedReturn.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-steel mb-1">Volatility (Annual)</p>
              <p className="font-mono text-lg text-amber-bright">
                {annualizedVolatility.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <PortfolioChart stock={stock} showForecast={true} />

        {/* Purchase Info */}
        <div className="mt-6 pt-4 border-t border-slate-light/30 flex items-center gap-4 text-sm text-steel">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Purchased: {stock.purchaseDate || 'Not specified'}
          </div>
          <div>
            @ ${stock.purchasePrice.toFixed(2)}/share
          </div>
        </div>
      </div>
    </div>
  );
}

