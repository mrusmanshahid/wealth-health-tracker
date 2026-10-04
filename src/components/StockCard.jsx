import { TrendingUp, TrendingDown, Trash2, FileText, Edit3, PiggyBank, PieChart, Newspaper, ExternalLink, Users, Target } from 'lucide-react';
import ContributionGrowthChart from './ContributionGrowthChart';
import FundamentalsHealth from './FundamentalsHealth';
import { formatDistanceToNow } from 'date-fns';
import { normalizeAnalyst } from '../utils/forecasting';

function ratingStyles(rating, sentiment) {
  if (sentiment === 'bullish' || ['Strong Buy', 'Buy'].includes(rating)) {
    return 'bg-emerald-glow/20 text-emerald-bright';
  }
  if (sentiment === 'bearish' || ['Sell', 'Strong Sell', 'Underperform'].includes(rating)) {
    return 'bg-ruby/20 text-ruby-bright';
  }
  if (rating || sentiment === 'neutral') {
    return 'bg-amber/20 text-amber-bright';
  }
  return 'bg-slate-light/30 text-steel';
}

function money(n, digits = 0) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return `$${Number(n).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`;
}

export default function StockCard({ stock, totalPortfolioValue, onRemove, onViewChart, onEdit, latestNews }) {
  const purchasePrice = Number(stock.purchasePrice) || 0;
  const shares = Number(stock.shares) || (purchasePrice > 0 ? Number(stock.investedAmount) / purchasePrice : 0);
  const currentPrice = Number(stock.currentPrice) || purchasePrice;
  const currentValue = shares * currentPrice;
  
  // Calculate portfolio weight
  const portfolioWeight = totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0;
  const investedAmount = Number(stock.investedAmount) || shares * purchasePrice;
  const gain = currentValue - investedAmount;
  const gainPercent = investedAmount > 0 ? (gain / investedAmount) * 100 : 0;
  const isPositive = gain >= 0;

  const analyst = normalizeAnalyst(stock.analyst, currentPrice);
  const targetPrice = analyst.targetMean;
  const targetValue = targetPrice != null ? shares * targetPrice : null;
  const upside = analyst.upsidePercent;
  const upsidePositive = (upside ?? 0) >= 0;
  const breakdown = analyst.breakdown;
  const totalRecs = breakdown
    ? (breakdown.strongBuy || 0) + (breakdown.buy || 0) + (breakdown.hold || 0) + (breakdown.sell || 0) + (breakdown.strongSell || 0)
    : 0;

  // Price change from avg cost
  const priceChange = currentPrice - purchasePrice;
  const priceChangePercent = purchasePrice > 0 ? (priceChange / purchasePrice) * 100 : 0;

  // Check if non-USD currency
  const isNonUSD = stock.currency && stock.currency !== 'USD';
  const currencySymbols = {
    EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF', CAD: 'C$', AUD: 'A$',
    INR: '₹', CNY: '¥', HKD: 'HK$', SGD: 'S$', SEK: 'kr', NOK: 'kr',
  };
  const currencySymbol = currencySymbols[stock.currency] || stock.currency;

  return (
    <div className="glass-card p-4 sm:p-5 hover:border-emerald-glow/30 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
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
          <p className="text-sm text-steel mt-0.5 truncate">{stock.name}</p>
        </div>
        
        <div className="flex gap-0.5 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(stock)}
            className="p-2.5 rounded-lg hover:bg-slate-light/50 transition-colors text-steel hover:text-amber-bright touch-manipulation"
            title="Edit Position"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewChart(stock)}
            className="p-2.5 rounded-lg hover:bg-slate-light/50 transition-colors text-steel hover:text-cyan-400 touch-manipulation"
            title="View Details"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(stock.symbol)}
            className="p-2.5 rounded-lg hover:bg-ruby/20 transition-colors text-steel hover:text-ruby-bright touch-manipulation"
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
            {shares.toLocaleString(undefined, { maximumFractionDigits: shares < 1 ? 4 : 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-steel uppercase tracking-wide mb-1">Avg Cost (USD)</p>
          <p className="font-mono text-silver">{money(purchasePrice, 2)}</p>
        </div>
        <div>
          <p className="text-xs text-steel uppercase tracking-wide mb-1">Current Price</p>
          <div>
            {isNonUSD && stock.currentPriceOriginal && (
              <p className="font-mono text-amber-bright text-sm">
                {currencySymbol}{Number(stock.currentPriceOriginal).toFixed(2)}
              </p>
            )}
            <p className="font-mono text-pearl flex items-center gap-1 flex-wrap">
              {money(currentPrice, 2)}
              <span className={`text-xs ${priceChange >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-steel uppercase tracking-wide mb-1">Market Value</p>
          <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
            {money(currentValue)}
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
                {isPositive ? '+' : ''}{money(gain)}
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
        <span className="font-mono text-silver">{money(investedAmount)}</span>
      </div>

      {/* Analyst consensus */}
      <div className="pt-4 border-t border-slate-light/30">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs text-steel uppercase tracking-wide flex items-center gap-1">
            <Target className="w-3 h-3" /> Analyst view (12M)
          </p>
          {analyst.coverage ? (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ratingStyles(analyst.rating, analyst.sentiment)}`}>
              {analyst.rating || (analyst.sentiment === 'bullish' ? 'Bullish' : analyst.sentiment === 'bearish' ? 'Bearish' : 'Neutral')}
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-light/30 text-steel">
              No coverage
            </span>
          )}
        </div>

        {analyst.coverage && targetPrice != null ? (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] text-steel uppercase mb-0.5">Mean target</p>
                <p className="font-mono font-semibold text-sapphire-bright">
                  {money(targetPrice, 2)}
                </p>
                {targetValue != null && (
                  <p className="text-[11px] text-silver mt-0.5">
                    Position → {money(targetValue)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-steel uppercase mb-0.5">Upside</p>
                <p className={`font-mono font-semibold text-sm ${upsidePositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                  {upsidePositive ? '+' : ''}{Number(upside || 0).toFixed(1)}%
                </p>
                {(analyst.targetLow != null || analyst.targetHigh != null) && (
                  <p className="text-[10px] text-steel mt-0.5">
                    {money(analyst.targetLow ?? targetPrice, 0)}–{money(analyst.targetHigh ?? targetPrice, 0)}
                  </p>
                )}
              </div>
            </div>

            {analyst.analystCount != null && (
              <p className="text-[11px] text-steel mt-2 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {analyst.analystCount} analyst{analyst.analystCount === 1 ? '' : 's'}
              </p>
            )}

            {totalRecs > 0 && (
              <div className="mt-2">
                <div className="flex h-1.5 rounded-full overflow-hidden border border-slate-light/20">
                  {(breakdown.strongBuy || 0) + (breakdown.buy || 0) > 0 && (
                    <div
                      className="bg-emerald-bright"
                      style={{ width: `${(((breakdown.strongBuy || 0) + (breakdown.buy || 0)) / totalRecs) * 100}%` }}
                      title="Buy"
                    />
                  )}
                  {(breakdown.hold || 0) > 0 && (
                    <div
                      className="bg-amber-bright"
                      style={{ width: `${((breakdown.hold || 0) / totalRecs) * 100}%` }}
                      title="Hold"
                    />
                  )}
                  {(breakdown.sell || 0) + (breakdown.strongSell || 0) > 0 && (
                    <div
                      className="bg-ruby-bright"
                      style={{ width: `${(((breakdown.sell || 0) + (breakdown.strongSell || 0)) / totalRecs) * 100}%` }}
                      title="Sell"
                    />
                  )}
                </div>
                <div className="flex justify-between text-[10px] text-steel mt-1">
                  <span className="text-emerald-bright">
                    Buy {(breakdown.strongBuy || 0) + (breakdown.buy || 0)}
                  </span>
                  <span className="text-amber-bright">Hold {breakdown.hold || 0}</span>
                  <span className="text-ruby-bright">
                    Sell {(breakdown.sell || 0) + (breakdown.strongSell || 0)}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-steel">
            Street price targets aren’t available for this {stock.quoteType === 'ETF' ? 'ETF' : 'symbol'} yet.
          </p>
        )}
      </div>

      <FundamentalsHealth fundamentals={stock.fundamentals} compact />

      {/* Latest News */}
      {latestNews && (
        <div className="mt-4 pt-4 border-t border-slate-light/20">
          <a 
            href={latestNews.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group/news hover:bg-slate-light/10 rounded-lg p-2 -mx-2 transition-colors"
          >
            <div className="flex items-start gap-2">
              <Newspaper className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-silver line-clamp-2 group-hover/news:text-pearl transition-colors">
                  {latestNews.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-steel">{latestNews.publisher}</span>
                  {latestNews.publishedAt && (
                    <span className="text-[10px] text-steel">
                      • {formatDistanceToNow(latestNews.publishedAt, { addSuffix: true })}
                    </span>
                  )}
                  <ExternalLink className="w-3 h-3 text-steel opacity-0 group-hover/news:opacity-100 transition-opacity ml-auto" />
                </div>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Monthly contribution — always visible on mobile, hover-expand on desktop */}
      {stock.monthlyContribution > 0 && (
        <div className="mt-3 sm:mt-0 sm:overflow-hidden sm:transition-all sm:duration-500 sm:ease-out sm:max-h-0 sm:opacity-0 sm:group-hover:max-h-[300px] sm:group-hover:opacity-100">
          <ContributionGrowthChart 
            stock={stock} 
            monthlyContribution={stock.monthlyContribution} 
          />
        </div>
      )}

      {(!stock.monthlyContribution || stock.monthlyContribution === 0) && (
        <div className="mt-3 sm:mt-0 sm:overflow-hidden sm:transition-all sm:duration-300 sm:ease-out sm:max-h-0 sm:opacity-0 sm:group-hover:max-h-[60px] sm:group-hover:opacity-100">
          <div className="pt-3 border-t border-slate-light/20">
            <button
              onClick={() => onEdit(stock)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-steel hover:text-amber-bright transition-colors touch-manipulation"
            >
              <PiggyBank className="w-4 h-4" />
              Add monthly contribution
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
