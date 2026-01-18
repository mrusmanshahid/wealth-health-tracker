import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Eye,
  Plus,
  ExternalLink,
  RefreshCw,
  FileText,
  Receipt,
  Calendar,
  DollarSign
} from 'lucide-react';
import { fetchStockQuote, fetchStockHistory } from '../services/stockApi';
import { generateForecast } from '../utils/forecasting';
import EarningsReport from './EarningsReport';
import UnifiedStockChart from './UnifiedStockChart';

export default function QuickStockView({ 
  stock, 
  onClose, 
  onAddToWatchlist, 
  onAddToPortfolio,
  isInWatchlist,
  isInPortfolio 
}) {
  const [quote, setQuote] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (stock?.symbol) {
      loadData();
    }
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [stock?.symbol]);

  const loadData = async () => {
    setIsLoading(true);
    setIsLoadingHistory(true);
    
    try {
      // Fetch quote and history in parallel
      const [quoteData, historyData] = await Promise.all([
        fetchStockQuote(stock.symbol),
        fetchStockHistory(stock.symbol)
      ]);
      
      setQuote(quoteData);
      
      // Build stock object with history for the chart
      if (historyData && historyData.length > 0) {
        const currentPrice = quoteData?.price || historyData[historyData.length - 1]?.price || stock.price;
        const forecast = generateForecast(historyData, 60);
        
        setStockData({
          symbol: stock.symbol,
          name: stock.name || quoteData?.name,
          history: historyData,
          forecast,
          currentPrice,
          purchasePrice: currentPrice, // For non-portfolio stocks, use current as "purchase"
          shares: 1, // Default to 1 share for visualization
          investedAmount: currentPrice,
          currency: quoteData?.currency || 'USD',
        });
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
    
    setIsLoading(false);
    setIsLoadingHistory(false);
  };

  if (!stock) return null;

  const displayPrice = quote?.price || stock.price || 0;
  const changePercent = quote?.changePercent || stock.changePercent || 0;
  const change = quote?.change || stock.change || 0;
  const isUp = changePercent >= 0;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
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
                  <span className="text-steel ml-1">
                    ({isUp ? '+' : ''}${change.toFixed(2)})
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isInPortfolio && (
          <div className="flex gap-3 mb-6">
            {!isInWatchlist && onAddToWatchlist && (
              <button
                onClick={() => {
                  onAddToWatchlist({ symbol: stock.symbol, name: stock.name || quote?.name });
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-light/30 pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-glow/20 text-emerald-bright'
                : 'text-steel hover:text-silver hover:bg-slate-light/30'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'financials'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-steel hover:text-silver hover:bg-slate-light/30'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Financials
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            {quote && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="stat-card">
                  <p className="text-xs text-steel uppercase tracking-wide mb-1">Previous Close</p>
                  <p className="font-mono font-semibold text-pearl">
                    ${quote.previousClose?.toFixed(2) || '—'}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-steel uppercase tracking-wide mb-1">Day Range</p>
                  <p className="font-mono text-pearl text-sm">
                    ${quote.dayLow?.toFixed(2) || '—'} - ${quote.dayHigh?.toFixed(2) || '—'}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-steel uppercase tracking-wide mb-1">52W Range</p>
                  <p className="font-mono text-pearl text-sm">
                    ${quote.fiftyTwoWeekLow?.toFixed(0) || '—'} - ${quote.fiftyTwoWeekHigh?.toFixed(0) || '—'}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs text-steel uppercase tracking-wide mb-1">Market Cap</p>
                  <p className="font-mono font-semibold text-pearl">
                    {quote.marketCap ? formatMarketCap(quote.marketCap) : '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Chart */}
            {isLoadingHistory ? (
              <div className="chart-container h-64 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-emerald-bright animate-spin" />
                <span className="ml-2 text-steel">Loading chart data...</span>
              </div>
            ) : stockData?.history ? (
              <div className="mb-6">
                <UnifiedStockChart stock={stockData} monthlyContribution={0} />
              </div>
            ) : (
              <div className="chart-container h-64 flex items-center justify-center mb-6">
                <p className="text-steel">Chart data unavailable</p>
              </div>
            )}

            {/* Additional Info */}
            {quote && (
              <div className="glass-card p-4 bg-slate-dark/30">
                <h3 className="text-sm font-semibold text-silver mb-3 uppercase tracking-wide">Additional Info</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-steel mb-1">Volume</p>
                    <p className="font-mono text-pearl">{formatVolume(quote.volume)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-steel mb-1">Avg Volume</p>
                    <p className="font-mono text-pearl">{formatVolume(quote.avgVolume)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-steel mb-1">P/E Ratio</p>
                    <p className="font-mono text-pearl">{quote.peRatio?.toFixed(2) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-steel mb-1">Currency</p>
                    <p className="font-mono text-pearl">{quote.currency || 'USD'}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <EarningsReport symbol={stock.symbol} />
        )}

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

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}

// Helper functions
function formatMarketCap(cap) {
  if (!cap) return '—';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVolume(vol) {
  if (!vol) return '—';
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
  return vol.toLocaleString();
}
