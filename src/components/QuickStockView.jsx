import { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Eye,
  Plus,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { fetchStockQuote } from '../services/stockApi';
import EarningsReport from './EarningsReport';

export default function QuickStockView({ 
  stock, 
  onClose, 
  onAddToWatchlist, 
  onAddToPortfolio,
  isInWatchlist,
  isInPortfolio 
}) {
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financials');

  useEffect(() => {
    if (stock?.symbol) {
      loadQuote();
    }
  }, [stock?.symbol]);

  const loadQuote = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStockQuote(stock.symbol);
      setQuote(data);
    } catch (err) {
      console.error('Error loading quote:', err);
    }
    setIsLoading(false);
  };

  if (!stock) return null;

  const displayPrice = quote?.price || stock.price || 0;
  const changePercent = quote?.changePercent || stock.changePercent || 0;
  const isUp = changePercent >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-light/50 transition-colors z-10 bg-obsidian/50"
        >
          <X className="w-5 h-5 text-steel" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-violet-500/20">
            <BarChart3 className="w-8 h-8 text-violet-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-pearl">{stock.symbol}</h2>
              {isInPortfolio && (
                <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">
                  In Portfolio
                </span>
              )}
              {isInWatchlist && !isInPortfolio && (
                <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs text-amber-400">
                  Watching
                </span>
              )}
            </div>
            <p className="text-silver">{stock.name || quote?.name}</p>
          </div>
          <div className="text-right">
            {isLoading ? (
              <RefreshCw className="w-5 h-5 text-steel animate-spin" />
            ) : (
              <>
                <p className="text-2xl font-bold font-mono text-pearl">
                  ${displayPrice.toFixed(2)}
                </p>
                <p className={`text-sm flex items-center justify-end gap-1 ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                  {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isInPortfolio && (
          <div className="flex gap-3 mb-6">
            {!isInWatchlist && (
              <button
                onClick={() => {
                  onAddToWatchlist?.({ symbol: stock.symbol, name: stock.name || quote?.name });
                  onClose();
                }}
                className="flex-1 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Add to Watchlist
              </button>
            )}
            <button
              onClick={() => {
                onAddToPortfolio?.({ symbol: stock.symbol, name: stock.name || quote?.name });
                onClose();
              }}
              className="flex-1 py-3 bg-emerald-glow/20 hover:bg-emerald-glow/30 text-emerald-bright rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add to Portfolio
            </button>
          </div>
        )}

        {/* Quick Stats */}
        {quote && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-dark/50 rounded-xl p-3 border border-slate-light/20">
              <p className="text-xs text-steel mb-1">Previous Close</p>
              <p className="font-mono font-semibold text-pearl">
                ${quote.previousClose?.toFixed(2) || '—'}
              </p>
            </div>
            <div className="bg-slate-dark/50 rounded-xl p-3 border border-slate-light/20">
              <p className="text-xs text-steel mb-1">Day Change</p>
              <p className={`font-mono font-semibold ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                {isUp ? '+' : ''}${quote.change?.toFixed(2) || '—'}
              </p>
            </div>
            <div className="bg-slate-dark/50 rounded-xl p-3 border border-slate-light/20">
              <p className="text-xs text-steel mb-1">Currency</p>
              <p className="font-mono font-semibold text-pearl">
                {quote.currency || 'USD'}
              </p>
            </div>
          </div>
        )}

        {/* Financials Tab */}
        <div className="border-t border-slate-light/20 pt-4">
          <h3 className="text-lg font-semibold text-pearl mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Financial Insights
          </h3>
          <EarningsReport symbol={stock.symbol} />
        </div>

        {/* External Link */}
        <div className="mt-6 pt-4 border-t border-slate-light/20">
          <a
            href={`https://finance.yahoo.com/quote/${stock.symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-steel hover:text-cyan-400 transition-colors"
          >
            View on Yahoo Finance
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

