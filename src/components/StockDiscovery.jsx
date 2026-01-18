import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Flame,
  Target,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Star,
  Layers,
  BadgePercent,
  Rocket,
  FileText,
  Zap,
  Crown
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

// Horizontal scroll carousel component
function StockCarousel({ title, icon: Icon, stocks, color, onWatch, onBuy, onViewDetails, isInPortfolio, isInWatchlist }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 220;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [stocks]);

  if (!stocks || stocks.length === 0) return null;

  const colorClasses = {
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
  };

  return (
    <div className="mb-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-pearl">{title}</h3>
          <span className="text-xs text-steel">({stocks.length})</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-1 rounded-md bg-slate-dark/50 text-steel hover:text-pearl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-1 rounded-md bg-slate-dark/50 text-steel hover:text-pearl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Cards */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {stocks.map((stock, idx) => {
          const isUp = (stock.changePercent || 0) >= 0;
          const inPortfolio = isInPortfolio(stock.symbol);
          const inWatchlist = isInWatchlist(stock.symbol);

          return (
            <div
              key={stock.symbol || idx}
              className="flex-shrink-0 w-[200px] bg-gradient-to-br from-slate-dark/80 to-slate-dark/40 rounded-lg p-3 border border-slate-light/20 hover:border-violet-500/40 transition-all group"
            >
              {/* Top Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-pearl text-sm">{stock.symbol}</span>
                    {idx < 3 && (
                      <span className={`text-[10px] px-1 py-0.5 rounded ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-400' : 
                        idx === 1 ? 'bg-slate-light/30 text-silver' : 
                        'bg-orange-900/30 text-orange-400'
                      }`}>
                        #{idx + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-steel truncate">{stock.name}</p>
                </div>
                {inPortfolio && (
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded text-[10px] text-emerald-400 flex-shrink-0">
                    Owned
                  </span>
                )}
                {inWatchlist && !inPortfolio && (
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                )}
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="text-lg font-bold text-pearl font-mono">
                  ${stock.price?.toFixed(2) || '—'}
                </div>
                <div className={`text-xs flex items-center gap-1 ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isUp ? '+' : ''}{stock.changePercent?.toFixed(1) || 0}%
                </div>
              </div>

              {/* Extra Info */}
              {stock.discountFromHigh && (
                <div className="mb-2 px-1.5 py-1 bg-emerald-500/10 rounded">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <BadgePercent className="w-2.5 h-2.5" />
                    {stock.discountFromHigh}% off high
                  </span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-1.5 mt-auto">
                <button
                  onClick={() => onViewDetails(stock)}
                  className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded transition-colors"
                  title="View Details"
                >
                  <FileText className="w-3 h-3" />
                </button>
                {!inPortfolio && !inWatchlist && (
                  <button
                    onClick={() => onWatch(stock)}
                    className="flex-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
                {!inPortfolio && (
                  <button
                    onClick={() => onBuy(stock)}
                    className="flex-1 py-1.5 bg-emerald-glow/20 hover:bg-emerald-glow/30 text-emerald-bright rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Featured stock card (compact)
function FeaturedStock({ stock, label, color, onWatch, onBuy, onViewDetails, isInPortfolio, isInWatchlist }) {
  if (!stock) return null;
  
  const isUp = (stock.changePercent || 0) >= 0;
  const inPortfolio = isInPortfolio(stock.symbol);
  const inWatchlist = isInWatchlist(stock.symbol);

  const colorStyles = {
    gold: 'from-amber-500/20 via-yellow-500/10 to-orange-500/10 border-amber-500/30',
    emerald: 'from-emerald-500/20 via-cyan-500/10 to-teal-500/10 border-emerald-500/30',
    violet: 'from-violet-500/20 via-purple-500/10 to-indigo-500/10 border-violet-500/30',
  };

  return (
    <div className={`relative bg-gradient-to-br ${colorStyles[color]} rounded-xl p-3 border overflow-hidden`}>
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-2">
        <Crown className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">{label}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg font-bold text-pearl">{stock.symbol}</span>
            {inPortfolio && (
              <span className="px-1.5 py-0.5 bg-emerald-500/30 rounded text-[10px] text-emerald-400">Owned</span>
            )}
          </div>
          <p className="text-xs text-silver truncate mb-2">{stock.name}</p>
          
          <div className="flex items-end gap-2">
            <div>
              <p className="text-xl font-bold text-pearl font-mono">${stock.price?.toFixed(2)}</p>
              <div className={`flex items-center gap-1 text-xs ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="font-medium">{isUp ? '+' : ''}{stock.changePercent?.toFixed(1)}%</span>
              </div>
            </div>
            
            {stock.discountFromHigh && (
              <div className="px-2 py-1 bg-emerald-500/20 rounded">
                <span className="text-[10px] text-emerald-400 font-medium">{stock.discountFromHigh}% off</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => onViewDetails(stock)}
            className="p-1.5 bg-slate-dark/50 hover:bg-slate-dark/70 text-pearl rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
          {!inWatchlist && !inPortfolio && (
            <button
              onClick={() => onWatch(stock)}
              className="p-1.5 bg-amber-500/30 hover:bg-amber-500/40 text-amber-400 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {!inPortfolio && (
            <button
              onClick={() => onBuy(stock)}
              className="p-1.5 bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StockDiscovery({ 
  portfolioSymbols = [],
  watchlistSymbols = [],
  onAddToWatchlist,
  onAddToPortfolio,
  compact = false
}) {
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [sectorStocks, setSectorStocks] = useState([]);
  const [undervaluedStocks, setUndervaluedStocks] = useState([]);
  const [growthStocks, setGrowthStocks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  useEffect(() => {
    loadDiscoveryData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDiscoveryData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (portfolioSymbols.length > 0) {
      loadRecommendations();
    }
  }, [portfolioSymbols]);

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
      
      setTrendingStocks(trending || []);
      setGainers(movers?.gainers || []);
      setSectorStocks(sectors || []);
      setUndervaluedStocks(undervalued || []);
      setGrowthStocks(growth || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error loading discovery data:', err);
    }
    setIsLoading(false);
  };

  const loadRecommendations = async () => {
    if (portfolioSymbols.length === 0) return;
    try {
      const recs = await fetchStockRecommendations(portfolioSymbols[0]);
      setRecommendations(recs || []);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const isInPortfolio = (symbol) => portfolioSymbols.includes(symbol);
  const isInWatchlist = (symbol) => watchlistSymbols.includes(symbol);

  const handleWatch = (stock) => onAddToWatchlist({ symbol: stock.symbol, name: stock.name });
  const handleBuy = (stock) => onAddToPortfolio({ symbol: stock.symbol, name: stock.name });
  const handleViewDetails = (stock) => setSelectedStock(stock);

  // Get top picks for featured section
  const topGainer = gainers[0];
  const topDiscount = undervaluedStocks[0];
  const topTrending = trendingStocks[0];

  if (compact) {
    // Simplified compact view
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="font-semibold text-pearl">Discover</span>
          </div>
          <button
            onClick={loadDiscoveryData}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="space-y-2">
          {[...trendingStocks.slice(0, 2), ...undervaluedStocks.slice(0, 2)].map((stock, idx) => {
            const isUp = (stock?.changePercent || 0) >= 0;
            if (!stock) return null;
            return (
              <div key={stock.symbol} className="flex items-center justify-between p-2 rounded-lg bg-slate-dark/30 hover:bg-slate-dark/50 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-pearl text-sm">{stock.symbol}</span>
                    {stock.discountFromHigh && (
                      <span className="text-xs text-emerald-400">-{stock.discountFromHigh}%</span>
                    )}
                  </div>
                  <span className={`text-xs ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${stock.price?.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent?.toFixed(1)}%)
                  </span>
                </div>
                <button
                  onClick={() => handleBuy(stock)}
                  className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

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

  return (
    <div className="glass-card p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-pearl">Discover Stocks</h2>
            <p className="text-xs text-steel">Find your next opportunity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-[10px] text-steel">
              {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={loadDiscoveryData}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
          <span className="ml-2 text-silver text-sm">Discovering...</span>
        </div>
      ) : (
        <>
          {/* Featured Picks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <FeaturedStock
              stock={topGainer}
              label="Top Gainer Today"
              color="gold"
              onWatch={handleWatch}
              onBuy={handleBuy}
              onViewDetails={handleViewDetails}
              isInPortfolio={isInPortfolio}
              isInWatchlist={isInWatchlist}
            />
            <FeaturedStock
              stock={topDiscount}
              label="Best Discount"
              color="emerald"
              onWatch={handleWatch}
              onBuy={handleBuy}
              onViewDetails={handleViewDetails}
              isInPortfolio={isInPortfolio}
              isInWatchlist={isInWatchlist}
            />
            <FeaturedStock
              stock={topTrending}
              label="Trending Now"
              color="violet"
              onWatch={handleWatch}
              onBuy={handleBuy}
              onViewDetails={handleViewDetails}
              isInPortfolio={isInPortfolio}
              isInWatchlist={isInWatchlist}
            />
          </div>

          {/* Carousels */}
          <StockCarousel
            title="Discounted Stocks"
            icon={BadgePercent}
            stocks={undervaluedStocks.slice(1)}
            color="emerald"
            onWatch={handleWatch}
            onBuy={handleBuy}
            onViewDetails={handleViewDetails}
            isInPortfolio={isInPortfolio}
            isInWatchlist={isInWatchlist}
          />

          <StockCarousel
            title="Top Gainers"
            icon={TrendingUp}
            stocks={gainers.slice(1)}
            color="amber"
            onWatch={handleWatch}
            onBuy={handleBuy}
            onViewDetails={handleViewDetails}
            isInPortfolio={isInPortfolio}
            isInWatchlist={isInWatchlist}
          />

          <StockCarousel
            title="Growth Stocks"
            icon={Rocket}
            stocks={growthStocks}
            color="cyan"
            onWatch={handleWatch}
            onBuy={handleBuy}
            onViewDetails={handleViewDetails}
            isInPortfolio={isInPortfolio}
            isInWatchlist={isInWatchlist}
          />

          <StockCarousel
            title="Trending"
            icon={Flame}
            stocks={trendingStocks.slice(1)}
            color="rose"
            onWatch={handleWatch}
            onBuy={handleBuy}
            onViewDetails={handleViewDetails}
            isInPortfolio={isInPortfolio}
            isInWatchlist={isInWatchlist}
          />

          {recommendations.length > 0 && (
            <StockCarousel
              title="Recommended For You"
              icon={Target}
              stocks={recommendations}
              color="violet"
              onWatch={handleWatch}
              onBuy={handleBuy}
              onViewDetails={handleViewDetails}
              isInPortfolio={isInPortfolio}
              isInWatchlist={isInWatchlist}
            />
          )}

          {/* Sector Leaders */}
          {sectorStocks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-light/20">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-pearl">Sector Leaders</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {sectorStocks.slice(0, 6).map((stock) => {
                  const isUp = (stock.changePercent || 0) >= 0;
                  const inPortfolio = isInPortfolio(stock.symbol);
                  
                  return (
                    <div
                      key={stock.sector}
                      onClick={() => handleViewDetails(stock)}
                      className="p-2 rounded-lg bg-slate-dark/50 border border-slate-light/20 hover:border-violet-500/40 cursor-pointer transition-all"
                    >
                      <p className="text-[10px] text-violet-400 truncate">{stock.sector}</p>
                      <p className="font-bold text-pearl text-sm">{stock.symbol}</p>
                      <p className={`text-xs font-mono ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                        {isUp ? '+' : ''}{stock.changePercent?.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
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
