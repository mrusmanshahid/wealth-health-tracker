import { useState, useEffect } from 'react';
import { 
  Eye, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Search,
  Star,
  ArrowRight,
  X,
  RefreshCw
} from 'lucide-react';
import { searchStocks, fetchStockQuote } from '../services/stockApi';

export default function Watchlist({ 
  watchlist = [], 
  onAddToWatchlist, 
  onRemoveFromWatchlist,
  onAddToPortfolio 
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchlistData, setWatchlistData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch quotes for watchlist stocks
  useEffect(() => {
    if (watchlist.length > 0) {
      refreshWatchlist();
    } else {
      setWatchlistData([]);
    }
  }, [watchlist]);

  const refreshWatchlist = async () => {
    setIsRefreshing(true);
    try {
      const quotes = await Promise.all(
        watchlist.map(async (item) => {
          try {
            const quote = await fetchStockQuote(item.symbol);
            return {
              ...item,
              ...quote,
              addedPrice: item.addedPrice,
              addedDate: item.addedDate,
            };
          } catch (err) {
            return { ...item, error: true };
          }
        })
      );
      setWatchlistData(quotes);
    } catch (err) {
      console.error('Error refreshing watchlist:', err);
    }
    setIsRefreshing(false);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchStocks(query);
      setSearchResults(results.slice(0, 6));
    } catch (err) {
      console.error('Search error:', err);
    }
    setIsSearching(false);
  };

  const handleAddToWatchlist = async (stock) => {
    try {
      const quote = await fetchStockQuote(stock.symbol);
      onAddToWatchlist({
        symbol: stock.symbol,
        name: stock.name,
        addedPrice: quote.price,
        addedDate: new Date().toISOString(),
      });
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    }
  };

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Eye className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-pearl">Watchlist</h2>
            <p className="text-xs text-steel">Stocks you're interested in</p>
          </div>
        </div>
        <div className="flex gap-2">
          {watchlist.length > 0 && (
            <button
              onClick={refreshWatchlist}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-slate-light/30 text-steel hover:text-pearl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {showSearch ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showSearch ? 'Cancel' : 'Add Stock'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
            <input
              type="text"
              placeholder="Search stocks to watch..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-slate-dark/50 border border-slate-light/30 rounded-xl pl-10 pr-4 py-3 text-pearl placeholder-steel focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-slate-dark border border-slate-light/30 rounded-xl overflow-hidden shadow-xl">
              {searchResults.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleAddToWatchlist(result)}
                  disabled={watchlist.some(w => w.symbol === result.symbol)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-light/20 transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-medium text-pearl">{result.symbol}</div>
                    <div className="text-sm text-steel truncate max-w-[200px]">{result.name}</div>
                  </div>
                  {watchlist.some(w => w.symbol === result.symbol) ? (
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <Plus className="w-4 h-4 text-steel" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Grid */}
      {watchlistData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {watchlistData.map((stock) => {
            const priceChange = stock.addedPrice ? 
              ((stock.price - stock.addedPrice) / stock.addedPrice) * 100 : 0;
            const isUp = stock.changePercent >= 0;
            
            return (
              <div 
                key={stock.symbol}
                className="bg-slate-dark/50 rounded-xl p-4 border border-slate-light/20 hover:border-amber-500/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-pearl">{stock.symbol}</span>
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </div>
                    <p className="text-xs text-steel truncate max-w-[120px]">{stock.name}</p>
                  </div>
                  <button
                    onClick={() => onRemoveFromWatchlist(stock.symbol)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-steel hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold text-pearl font-mono">
                      ${stock.price?.toFixed(2) || '—'}
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${isUp ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? '+' : ''}{stock.changePercent?.toFixed(2)}% today
                    </div>
                  </div>
                  
                  {stock.addedPrice && (
                    <div className="text-right">
                      <div className="text-xs text-steel">Since added</div>
                      <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => onAddToPortfolio(stock)}
                  className="mt-3 w-full py-2 bg-emerald-glow/20 hover:bg-emerald-glow/30 text-emerald-bright rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Add to Portfolio
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-steel">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No stocks in your watchlist</p>
          <p className="text-xs mt-1">Add stocks you want to keep an eye on</p>
        </div>
      )}
    </div>
  );
}

