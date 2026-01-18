import { TrendingUp, TrendingDown, Trash2, FileText, Edit3, PiggyBank, PieChart } from 'lucide-react';
import ContributionGrowthChart from './ContributionGrowthChart';
import { formatCurrency } from '../services/currencyApi';

export default function StockCard({ stock, totalPortfolioValue, onRemove, onViewChart, onEdit }) {
  const shares = stock.shares || (stock.investedAmount / stock.purchasePrice);
  const currentPrice = stock.currentPrice || stock.purchasePrice;
  const currentValue = shares * currentPrice;
  
  // Calculate portfolio weight
  const portfolioWeight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
  const investedAmount = stock.investedAmount || (shares * stock.purchasePrice);
  const gain = currentValue - investedAmount;
  const gainPercent = (gain / investedAmount) * 100;
  const isPositive = gain >= 0;

  // Calculate projected value (5 year)
  const projectedPrice = stock.forecast?.[stock.forecast.length - 1]?.price || currentPrice;
  const projectedValue = shares * projectedPrice;
  const projectedGain = projectedValue - investedAmount;
  const projectedGainPercent = (projectedGain / investedAmount) * 100;

  // Price change from avg cost
  const priceChange = currentPrice - stock.purchasePrice;
  const priceChangePercent = (priceChange / stock.purchasePrice) * 100;

  // Check if non-USD currency
  const isNonUSD = stock.currency && stock.currency !== 'USD';
  const currencySymbols = {
    EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF', CAD: 'C$', AUD: 'A$',
    INR: '₹', CNY: '¥', HKD: 'HK$', SGD: 'S$', SEK: 'kr', NOK: 'kr',
  };
  const currencySymbol = currencySymbols[stock.currency] || stock.currency;

  return (
    <div className="glass-card p-5 hover:border-emerald-glow/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-emerald-bright">{stock.symbol}</span>
            {/* Portfolio Weight Tag */}
            <span className="text-xs px-1.5 py-0.5 rounded bg-sapphire/20 text-sapphire-bright flex items-center gap-1">
              <PieChart className="w-3 h-3" />
              {portfolioWeight.toFixed(1)}%
            </span>
            {isNonUSD && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber/20 text-amber-bright">
                {stock.currency}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isPositive ? 'bg-emerald-glow/20 text-emerald-bright' : 'bg-ruby/20 text-ruby-bright'
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
              {isPositive ? '+' : ''}{gainPercent.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-steel mt-0.5 truncate max-w-[180px]">{stock.name}</p>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(stock)}
            className="p-2 rounded-lg hover:bg-slate-light/50 transition-colors text-steel hover:text-amber-bright"
            title="Edit Position"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewChart(stock)}
            className="p-2 rounded-lg hover:bg-slate-light/50 transition-colors text-steel hover:text-cyan-400"
            title="View Details"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(stock.symbol)}
            className="p-2 rounded-lg hover:bg-ruby/20 transition-colors text-steel hover:text-ruby-bright"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-steel uppercase tracking-wide mb-1">Shares</p>
          <p className="font-mono font-semibold text-pearl">
            {shares.toFixed(shares < 1 ? 4 : 2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-steel uppercase tracking-wide mb-1">Avg Cost (USD)</p>
          <p className="font-mono text-silver">
            ${stock.purchasePrice.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-steel uppercase tracking-wide mb-1">Current Price</p>
          <div>
            {isNonUSD && stock.currentPriceOriginal && (
              <p className="font-mono text-amber-bright text-sm">
                {currencySymbol}{stock.currentPriceOriginal.toFixed(2)}
              </p>
            )}
            <p className="font-mono text-pearl flex items-center gap-1">
              ${currentPrice.toFixed(2)}
              <span className={`text-xs ${priceChange >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-steel uppercase tracking-wide mb-1">Market Value</p>
          <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
            ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Exchange Rate Info for non-USD */}
      {isNonUSD && stock.exchangeRate && (
        <div className="mb-4 p-2 rounded-lg bg-amber/10 border border-amber/20">
          <p className="text-xs text-amber-bright">
            Exchange rate: 1 {stock.currency} = ${stock.exchangeRate.toFixed(4)} USD
          </p>
        </div>
      )}

      {/* P&L Section */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-slate-dark/50 to-obsidian/50 border border-slate-light/10 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel uppercase tracking-wide mb-1">Unrealized P&L (USD)</p>
            <div className="flex items-center gap-2">
              <p className={`font-mono font-bold text-lg ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                {isPositive ? '+' : ''}${gain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className={`text-sm px-2 py-0.5 rounded ${
                isPositive ? 'bg-emerald-glow/10 text-emerald-pale' : 'bg-ruby/10 text-ruby-bright'
              }`}>
                {isPositive ? '↑' : '↓'} {Math.abs(gainPercent).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-glow/20' : 'bg-ruby/20'}`}>
            {isPositive ? (
              <TrendingUp className="w-6 h-6 text-emerald-bright" />
            ) : (
              <TrendingDown className="w-6 h-6 text-ruby-bright" />
            )}
          </div>
        </div>
      </div>

      {/* Cost Basis */}
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-steel">Cost Basis (USD)</span>
        <span className="font-mono text-silver">${investedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>

      {/* Forecast Section */}
      <div className="pt-4 border-t border-slate-light/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-steel uppercase tracking-wide mb-1">5Y Forecast (USD)</p>
            <p className={`font-mono font-semibold ${projectedGain >= 0 ? 'text-sapphire-bright' : 'text-ruby-bright'}`}>
              ${projectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-steel uppercase tracking-wide mb-1">Projected Return</p>
            <p className={`font-mono text-sm ${projectedGain >= 0 ? 'text-sapphire-bright' : 'text-ruby-bright'}`}>
              {projectedGain >= 0 ? '+' : ''}{projectedGainPercent.toFixed(0)}%
              <span className="text-steel ml-1">
                (${(projectedGain >= 0 ? '+' : '') + projectedGain.toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Contribution Growth Chart - Shows on Hover */}
      {stock.monthlyContribution > 0 && (
        <div className="overflow-hidden transition-all duration-500 ease-out max-h-0 opacity-0 group-hover:max-h-[300px] group-hover:opacity-100">
          <ContributionGrowthChart 
            stock={stock} 
            monthlyContribution={stock.monthlyContribution} 
          />
        </div>
      )}

      {/* Show prompt to add contribution if not set - also on hover */}
      {(!stock.monthlyContribution || stock.monthlyContribution === 0) && (
        <div className="overflow-hidden transition-all duration-300 ease-out max-h-0 opacity-0 group-hover:max-h-[60px] group-hover:opacity-100">
          <div className="mt-4 pt-4 border-t border-slate-light/20">
            <button
              onClick={() => onEdit(stock)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-steel hover:text-amber-bright transition-colors"
            >
              <PiggyBank className="w-4 h-4" />
              Add monthly contribution for growth projection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
