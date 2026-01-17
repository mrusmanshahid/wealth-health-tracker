import { useState, useEffect } from 'react';
import { X, Search, Loader2, TrendingUp, TrendingDown, DollarSign, Calendar, Hash, PiggyBank } from 'lucide-react';
import { searchStocks, fetchStockQuote } from '../services/stockApi';

export default function AddStockModal({ isOpen, onClose, onAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [inputMode, setInputMode] = useState('shares'); // 'shares' or 'amount'
  const [shares, setShares] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [error, setError] = useState('');

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStocks(searchQuery);
        setSearchResults(results.slice(0, 8));
      } catch (err) {
        console.error('Search error:', err);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStock = async (stock) => {
    setSelectedStock(stock);
    setSearchQuery('');
    setSearchResults([]);
    setIsLoadingQuote(true);
    
    try {
      const quote = await fetchStockQuote(stock.symbol);
      setCurrentPrice(quote.price);
      setAvgPrice(quote.price.toFixed(2));
    } catch (err) {
      console.error('Quote error:', err);
    }
    setIsLoadingQuote(false);
  };

  // Calculate preview values
  const sharesNum = parseFloat(shares) || 0;
  const avgPriceNum = parseFloat(avgPrice) || 0;
  const investedNum = inputMode === 'shares' 
    ? sharesNum * avgPriceNum 
    : parseFloat(investedAmount) || 0;
  const calculatedShares = inputMode === 'amount' && avgPriceNum > 0 
    ? investedNum / avgPriceNum 
    : sharesNum;
  const currentValue = calculatedShares * currentPrice;
  const gainLoss = currentValue - investedNum;
  const gainLossPercent = investedNum > 0 ? (gainLoss / investedNum) * 100 : 0;
  const isPositive = gainLoss >= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedStock) {
      setError('Please select a stock');
      return;
    }

    let finalShares, finalInvested, finalAvgPrice;

    if (inputMode === 'shares') {
      if (!shares || parseFloat(shares) <= 0) {
        setError('Please enter a valid number of shares');
        return;
      }
      if (!avgPrice || parseFloat(avgPrice) <= 0) {
        setError('Please enter a valid average price');
        return;
      }
      finalShares = parseFloat(shares);
      finalAvgPrice = parseFloat(avgPrice);
      finalInvested = finalShares * finalAvgPrice;
    } else {
      if (!investedAmount || parseFloat(investedAmount) <= 0) {
        setError('Please enter a valid investment amount');
        return;
      }
      if (!avgPrice || parseFloat(avgPrice) <= 0) {
        setError('Please enter a valid purchase price');
        return;
      }
      finalInvested = parseFloat(investedAmount);
      finalAvgPrice = parseFloat(avgPrice);
      finalShares = finalInvested / finalAvgPrice;
    }

    onAdd({
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      shares: finalShares,
      investedAmount: finalInvested,
      purchasePrice: finalAvgPrice,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      addedAt: new Date().toISOString(),
    });

    // Reset form
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedStock(null);
    setShares('');
    setAvgPrice('');
    setInvestedAmount('');
    setPurchaseDate('');
    setMonthlyContribution('');
    setSearchQuery('');
    setCurrentPrice(0);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-light/50 transition-colors"
        >
          <X className="w-5 h-5 text-steel" />
        </button>

        <h2 className="text-xl font-bold text-pearl mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-glow/20">
            <TrendingUp className="w-5 h-5 text-emerald-bright" />
          </div>
          Add Stock to Portfolio
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stock Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-silver mb-2">
              Search Stock
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-steel" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by symbol or name (e.g., AAPL, Apple)..."
                className="glass-input w-full pl-10"
                disabled={!!selectedStock}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-steel animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 glass-card p-2 max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => handleSelectStock(stock)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-light/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-bright">{stock.symbol}</span>
                      {stock.type && stock.type !== 'EQUITY' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-sapphire/20 text-sapphire-bright">
                          {stock.type}
                        </span>
                      )}
                    </div>
                    <span className="text-silver text-sm">{stock.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Stock */}
          {selectedStock && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-glow/10 border border-emerald-glow/30">
              <div>
                <span className="font-bold text-emerald-bright">{selectedStock.symbol}</span>
                <span className="text-silver ml-2 text-sm">{selectedStock.name}</span>
                {currentPrice > 0 && (
                  <p className="text-xs text-steel mt-1">
                    Current price: <span className="text-pearl font-mono">${currentPrice.toFixed(2)}</span>
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStock(null);
                  setAvgPrice('');
                  setCurrentPrice(0);
                }}
                className="text-steel hover:text-pearl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="flex items-center justify-center gap-4 p-3 rounded-lg bg-slate-dark/50">
            <button
              type="button"
              onClick={() => setInputMode('shares')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                inputMode === 'shares' 
                  ? 'bg-emerald-glow/20 text-emerald-bright border border-emerald-glow/30' 
                  : 'text-steel hover:text-silver'
              }`}
            >
              <Hash className="w-4 h-4" />
              Enter Shares
            </button>
            <button
              type="button"
              onClick={() => setInputMode('amount')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                inputMode === 'amount' 
                  ? 'bg-emerald-glow/20 text-emerald-bright border border-emerald-glow/30' 
                  : 'text-steel hover:text-silver'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Enter Amount
            </button>
          </div>

          {inputMode === 'shares' ? (
            <>
              {/* Number of Shares */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  <Hash className="inline w-4 h-4 mr-1" />
                  Number of Shares
                </label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  placeholder="100"
                  min="0"
                  step="0.0001"
                  className="glass-input w-full"
                />
              </div>

              {/* Average Price */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Average Cost per Share ($)
                </label>
                <input
                  type="number"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                  placeholder={isLoadingQuote ? 'Loading...' : '150.00'}
                  min="0"
                  step="0.01"
                  className="glass-input w-full"
                  disabled={isLoadingQuote}
                />
                <p className="text-xs text-steel mt-1">
                  Your average purchase price across all buys
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Investment Amount */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Total Investment Amount ($)
                </label>
                <input
                  type="number"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  className="glass-input w-full"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  Purchase Price per Share ($)
                </label>
                <input
                  type="number"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                  placeholder={isLoadingQuote ? 'Loading...' : '150.00'}
                  min="0"
                  step="0.01"
                  className="glass-input w-full"
                  disabled={isLoadingQuote}
                />
                {calculatedShares > 0 && (
                  <p className="text-xs text-emerald-bright mt-1">
                    = {calculatedShares.toFixed(4)} shares
                  </p>
                )}
              </div>
            </>
          )}

          {/* Monthly Contribution */}
          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <PiggyBank className="inline w-4 h-4 mr-1" />
              Monthly Contribution ($)
            </label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="500"
              min="0"
              step="50"
              className="glass-input w-full"
            />
            <p className="text-xs text-steel mt-1">
              Planned monthly investment for growth projections
            </p>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Purchase Date (Optional)
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="glass-input w-full"
            />
          </div>

          {/* Live Preview */}
          {selectedStock && calculatedShares > 0 && avgPriceNum > 0 && currentPrice > 0 && (
            <div className="p-4 rounded-xl border border-slate-light/30 bg-gradient-to-br from-slate-dark/50 to-obsidian/50">
              <h3 className="text-sm font-semibold text-silver mb-3 uppercase tracking-wide">Position Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-steel mb-1">Total Cost</p>
                  <p className="font-mono font-semibold text-pearl">
                    ${investedNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Current Value</p>
                  <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Unrealized P&L</p>
                  <p className={`font-mono font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}${gainLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Return</p>
                  <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-ruby-bright text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Add to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
