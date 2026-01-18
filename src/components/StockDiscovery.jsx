import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Flame,
  Zap,
  Target,
  RefreshCw,
  ChevronRight,
  Plus,
  Eye,
  BarChart3,
  Star,
  Layers,
  BadgePercent,
  Rocket,
  FileText
} from 'lucide-react';
import { 
  fetchTrendingStocks, 
  fetchMarketMovers, 
  fetchStockRecommendations,
  fetchSectorStocks,
  fetchUndervaluedStocks,
  fetchGrowthStocks
} from '../services/stockApi';
import QuickStockView from './QuickStockView';

export default function StockDiscovery({ 
  portfolioSymbols = [],
  watchlistSymbols = [],
  onAddToWatchlist,
  onAddToPortfolio
}) {
  const [activeTab, setActiveTab] = useState('sectors');
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [mostActive, setMostActive] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sectorStocks, setSectorStocks] = useState([]);
  const [undervaluedStocks, setUndervaluedStocks] = useState([]);
  const [growthStocks, setGrowthStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  // Load recommendations based on portfolio
  useEffect(() => {
    if (portfolioSymbols.length > 0 && activeTab === 'foryou') {
      loadRecommendations();
    }
  }, [portfolioSymbols, activeTab]);

  const loadDiscoveryData = async () => {
    setIsLoading(true);
    try {
      const [trending, movers, sectors, undervalued, growth] = await Promise.all([
        fetchTrendingStocks(),
        fetchMarketMovers(),
        fetchSectorStocks(),
        fetchUndervaluedStocks(),
        fetchGrowthStocks(),
      ]);
      
      setTrendingStocks(trending);
      setGainers(movers.gainers);
      setMostActive(movers.active);
      setSectorStocks(sectors);
      setUndervaluedStocks(undervalued);
      setGrowthStocks(growth);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading discovery data:', err);
    }
    setIsLoading(false);
  };

  const loadRecommendations = async () => {
    if (portfolioSymbols.length === 0) return;
    
    try {
      // Get recommendations based on top portfolio stock
      const recs = await fetchStockRecommendations(portfolioSymbols[0]);
      setRecommendations(recs);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const isInPortfolio = (symbol) => portfolioSymbols.includes(symbol);
  const isInWatchlist = (symbol) => watchlistSymbols.includes(symbol);

  const tabs = [
    { id: 'sectors', label: 'By Sector', icon: Layers },
    { id: 'undervalued', label: 'Discounted', icon: BadgePercent },
    { id: 'growth', label: 'Growth', icon: Rocket },
    { id: 'gainers', label: 'Top Gainers', icon: TrendingUp },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'foryou', label: 'For You', icon: Target },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'sectors': return sectorStocks;
      case 'undervalued': return undervaluedStocks;
      case 'growth': return growthStocks;
      case 'trending': return trendingStocks;
      case 'gainers': return gainers;
      case 'active': return mostActive;
      case 'foryou': return recommendations;
      default: return [];
    }
  };

  const formatVolume = (volume) => {
    if (!volume) return 'N/A';
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  const formatMarketCap = (cap) => {
    if (!cap) return 'N/A';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
    return `$${cap}`;
  };

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-pearl">Discover Stocks</h2>
            <p className="text-xs text-steel">Find your next investment opportunity</p>
          </div>
        </div>
        <button
          onClick={loadDiscoveryData}
          disabled={isLoading}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-500/30 to-cyan-500/30 text-white border border-violet-500/30'
                  : 'text-steel hover:text-silver hover:bg-slate-light/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
          <span className="ml-3 text-silver">Loading market data...</span>
        </div>
      ) : (
        <>
          {activeTab === 'foryou' && portfolioSymbols.length === 0 ? (
            <div className="text-center py-12 text-steel">
              <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Add stocks to your portfolio to get personalized recommendations</p>
            </div>
          ) : activeTab === 'sectors' ? (
            /* Sectors Grid - Special Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorStocks.map((stock, idx) => {
                const isUp = (stock.changePercent || 0) >= 0;
                const inPortfolio = isInPortfolio(stock.symbol);
                const inWatchlist = isInWatchlist(stock.symbol);
                
                return (
                  <div
                    key={stock.sector}
                    className="bg-gradient-to-br from-slate-dark/80 to-slate-dark/40 rounded-xl p-4 border border-slate-light/20 hover:border-violet-500/30 transition-all"
                  >
                    {/* Sector Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-semibold text-violet-300">{stock.sector}</span>
                    </div>
                    
                    {/* Top Stock */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-pearl text-lg">{stock.symbol}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded">
                            #1
                          </span>
                        </div>
                        <p className="text-xs text-steel truncate max-w-[160px]">{stock.name}</p>
                      </div>
                      {inPortfolio && (
                        <div className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">
                          Owned
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="text-xl font-bold text-pearl font-mono">
                        ${stock.price?.toFixed(2) || '—'}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{stock.changePercent?.toFixed(2) || 0}% today
                      </div>
                    </div>

                    {/* Other sector stocks */}
                    <div className="mb-3 pt-2 border-t border-slate-light/10">
                      <p className="text-xs text-steel mb-1">Also in {stock.sector}:</p>
                      <div className="flex flex-wrap gap-1">
                        {stock.allSymbols?.slice(1).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 bg-slate-light/10 rounded text-silver">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStock(stock)}
                        className="py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                      {!inPortfolio && !inWatchlist && (
                        <button
                          onClick={() => onAddToWatchlist({ symbol: stock.symbol, name: stock.name })}
                          className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Watch
                        </button>
                      )}
                      {!inPortfolio && (
                        <button
                          onClick={() => onAddToPortfolio({ symbol: stock.symbol, name: stock.name })}
                          className="flex-1 py-2 bg-emerald-glow/20 hover:bg-emerald-glow/30 text-emerald-bright rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'undervalued' ? (
            /* Undervalued Stocks - Special Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {undervaluedStocks.map((stock, idx) => {
                const isUp = (stock.changePercent || 0) >= 0;
                const inPortfolio = isInPortfolio(stock.symbol);
                const inWatchlist = isInWatchlist(stock.symbol);
                
                return (
                  <div
                    key={stock.symbol}
                    className="bg-gradient-to-br from-emerald-900/20 to-slate-dark/40 rounded-xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                  >
                    {/* Discount Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BadgePercent className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-300">
                          {stock.discountFromHigh}% off high
                        </span>
                      </div>
                      {inPortfolio && (
                        <div className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">
                          Owned
                        </div>
                      )}
                    </div>
                    
                    {/* Stock Info */}
                    <div className="mb-2">
                      <span className="font-bold text-pearl text-lg">{stock.symbol}</span>
                      <p className="text-xs text-steel truncate">{stock.name}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="text-xl font-bold text-pearl font-mono">
                        ${stock.price?.toFixed(2) || '—'}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{stock.changePercent?.toFixed(2) || 0}% today
                      </div>
                    </div>

                    {/* 52-Week Range */}
                    <div className="mb-3 p-2 bg-slate-dark/50 rounded-lg">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-steel">52W Low</span>
                        <span className="text-steel">52W High</span>
                      </div>
                      <div className="flex justify-between text-sm font-mono">
                        <span className="text-emerald-400">${stock.fiftyTwoWeekLow?.toFixed(2)}</span>
                        <span className="text-rose-400">${stock.fiftyTwoWeekHigh?.toFixed(2)}</span>
                      </div>
                      {/* Price position indicator */}
                      <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                          style={{ 
                            width: `${((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* P/E Ratio */}
                    {stock.peRatio && (
                      <div className="mb-3 text-xs">
                        <span className="text-steel">P/E Ratio: </span>
                        <span className="text-silver font-medium">{stock.peRatio?.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStock(stock)}
                        className="py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        title="View Financials"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                      {!inPortfolio && !inWatchlist && (
                        <button
                          onClick={() => onAddToWatchlist({ symbol: stock.symbol, name: stock.name })}
                          className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Watch
                        </button>
                      )}
                      {!inPortfolio && (
                        <button
                          onClick={() => onAddToPortfolio({ symbol: stock.symbol, name: stock.name })}
                          className="flex-1 py-2 bg-emerald-glow/20 hover:bg-emerald-glow/30 text-emerald-bright rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Default Grid for other tabs */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {getCurrentData().map((stock, idx) => {
                const isUp = (stock.changePercent || 0) >= 0;
                const inPortfolio = isInPortfolio(stock.symbol);
                const inWatchlist = isInWatchlist(stock.symbol);
                
                return (
                  <div
                    key={stock.symbol || idx}
                    className="bg-slate-dark/50 rounded-xl p-4 border border-slate-light/20 hover:border-violet-500/30 transition-all group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-pearl">{stock.symbol}</span>
                          {activeTab === 'trending' && (
                            <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                              #{idx + 1}
                            </span>
                          )}
                          {activeTab === 'gainers' && (
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                          )}
                          {activeTab === 'growth' && (
                            <Rocket className="w-3 h-3 text-cyan-400" />
                          )}
                          {stock.score && (
                            <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                              {Math.round(stock.score * 100)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-steel truncate max-w-[140px]">{stock.name}</p>
                      </div>
                      
                      {inPortfolio && (
                        <div className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">
                          Owned
                        </div>
                      )}
                      {inWatchlist && !inPortfolio && (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <div className="text-xl font-bold text-pearl font-mono">
                        ${stock.price?.toFixed(2) || '—'}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{stock.changePercent?.toFixed(2) || 0}%
                        <span className="text-steel ml-1">
                          ({isUp ? '+' : ''}${stock.change?.toFixed(2) || 0})
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="bg-slate-light/10 rounded-lg px-2 py-1.5">
                        <span className="text-steel">Vol: </span>
                        <span className="text-silver font-medium">{formatVolume(stock.volume)}</span>
                      </div>
                      <div className="bg-slate-light/10 rounded-lg px-2 py-1.5">
                        <span className="text-steel">Cap: </span>
                        <span className="text-silver font-medium">{formatMarketCap(stock.marketCap)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStock(stock)}
                        className="py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        title="View Financials"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                      {!inPortfolio && !inWatchlist && (
                        <button
                          onClick={() => onAddToWatchlist({ symbol: stock.symbol, name: stock.name })}
                          className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Watch
                        </button>
                      )}
                      {!inPortfolio && (
                        <button
                          onClick={() => onAddToPortfolio({ symbol: stock.symbol, name: stock.name })}
                          className="flex-1 py-2 bg-emerald-glow/20 hover:bg-emerald-glow/30 text-emerald-bright rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {getCurrentData().length === 0 && activeTab !== 'foryou' && (
            <div className="text-center py-12 text-steel">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No data available. Try refreshing.</p>
            </div>
          )}
        </>
      )}

      {/* Last Updated */}
      {lastRefresh && (
        <div className="mt-4 text-xs text-steel text-center">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}

      {/* Quick Stock View Modal */}
      {selectedStock && (
        <QuickStockView
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onAddToWatchlist={onAddToWatchlist}
          onAddToPortfolio={onAddToPortfolio}
          isInWatchlist={isInWatchlist(selectedStock.symbol)}
          isInPortfolio={isInPortfolio(selectedStock.symbol)}
        />
      )}
    </div>
  );
}

