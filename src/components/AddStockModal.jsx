import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Loader2, TrendingUp, TrendingDown, DollarSign, Calendar, Hash, PiggyBank, Wallet } from 'lucide-react';
import { searchStocks, fetchStockQuote } from '../services/stockApi';
import {
  convertToUSD,
  describeFx,
  fetchExchangeRates,
  formatCurrency,
  formatUSD,
  getExchangeRate,
} from '../services/currencyApi';

const NO_DEDUCT = 'none';

export default function AddStockModal({
  isOpen,
  onClose,
  onAdd,
  prefillStock,
  availableCash = 0,
  cashAccounts = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [inputMode, setInputMode] = useState('shares'); // 'shares' or 'amount'
  const [shares, setShares] = useState('');
  const [avgPrice, setAvgPrice] = useState(''); // native market currency
  const [investedAmount, setInvestedAmount] = useState(''); // USD when amount mode
  const [purchaseDate, setPurchaseDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [fundingSource, setFundingSource] = useState(NO_DEDUCT);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteCurrency, setQuoteCurrency] = useState('USD');
  const [currentPriceNative, setCurrentPriceNative] = useState(0);
  const [currentPriceUSD, setCurrentPriceUSD] = useState(0);
  const [error, setError] = useState('');

  // Default funding source when modal opens / accounts change
  useEffect(() => {
    if (!isOpen) return;
    if (!cashAccounts.length) {
      setFundingSource(NO_DEDUCT);
      return;
    }
    const richest = [...cashAccounts].sort(
      (a, b) => (b.balance || 0) - (a.balance || 0)
    )[0];
    setFundingSource(richest?.id || NO_DEDUCT);
  }, [isOpen, cashAccounts]);

  // Handle prefilled stock from watchlist or discovery
  useEffect(() => {
    if (prefillStock && isOpen) {
      handleSelectStock({
        symbol: prefillStock.symbol,
        name: prefillStock.name,
      });
    }
  }, [prefillStock, isOpen]);

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
      await fetchExchangeRates();
      const quote = await fetchStockQuote(stock.symbol);
      const currency = quote.currency || 'USD';
      const native = quote.priceNative ?? quote.price ?? 0;
      const usd = quote.priceUSD ?? convertToUSD(native, currency);
      setQuoteCurrency(currency);
      setCurrentPriceNative(native);
      setCurrentPriceUSD(usd);
      setAvgPrice(native ? Number(native).toFixed(2) : '');
    } catch (err) {
      console.error('Quote error:', err);
    }
    setIsLoadingQuote(false);
  };

  // Calculate preview values in USD
  const sharesNum = parseFloat(shares) || 0;
  const avgPriceNative = parseFloat(avgPrice) || 0;
  const avgPriceUSD = convertToUSD(avgPriceNative, quoteCurrency);
  const investedUSD =
    inputMode === 'shares'
      ? sharesNum * avgPriceUSD
      : parseFloat(investedAmount) || 0;
  const calculatedShares =
    inputMode === 'amount' && avgPriceUSD > 0
      ? investedUSD / avgPriceUSD
      : sharesNum;
  const currentValue = calculatedShares * currentPriceUSD;
  const gainLoss = currentValue - investedUSD;
  const gainLossPercent = investedUSD > 0 ? (gainLoss / investedUSD) * 100 : 0;
  const isPositive = gainLoss >= 0;
  const fx = describeFx(avgPriceNative || currentPriceNative, quoteCurrency);
  const deductCash = fundingSource !== NO_DEDUCT;
  const selectedFundingAccount = cashAccounts.find((a) => a.id === fundingSource);
  const fundingBalance = selectedFundingAccount?.balance || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedStock) {
      setError('Please select a stock');
      return;
    }

    let finalShares;
    let purchasePriceNative;
    let purchasePriceUSD;
    let investedAmountUSD;

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
      purchasePriceNative = parseFloat(avgPrice);
      purchasePriceUSD = convertToUSD(purchasePriceNative, quoteCurrency);
      investedAmountUSD = finalShares * purchasePriceUSD;
    } else {
      if (!investedAmount || parseFloat(investedAmount) <= 0) {
        setError('Please enter a valid investment amount (USD)');
        return;
      }
      if (!avgPrice || parseFloat(avgPrice) <= 0) {
        setError('Please enter a valid purchase price');
        return;
      }
      investedAmountUSD = parseFloat(investedAmount);
      purchasePriceNative = parseFloat(avgPrice);
      purchasePriceUSD = convertToUSD(purchasePriceNative, quoteCurrency);
      if (purchasePriceUSD <= 0) {
        setError('Could not convert purchase price to USD');
        return;
      }
      finalShares = investedAmountUSD / purchasePriceUSD;
    }

    if (deductCash && investedAmountUSD > fundingBalance + 0.0001) {
      setError(
        `Not enough cash in ${selectedFundingAccount?.name || 'this bank'}. Choose another bank or "Don't deduct".`
      );
      return;
    }

    onAdd({
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      shares: finalShares,
      currency: quoteCurrency,
      exchangeRate: getExchangeRate(quoteCurrency),
      purchasePrice: purchasePriceNative,
      purchasePriceOriginal: purchasePriceNative,
      purchasePriceUSD,
      investedAmount: investedAmountUSD,
      investedAmountUSD,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      addedAt: new Date().toISOString(),
      deductCash,
      cashAccountId: deductCash ? fundingSource : null,
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
    setQuoteCurrency('USD');
    setCurrentPriceNative(0);
    setCurrentPriceUSD(0);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[32rem] sm:max-w-[calc(100vw-2rem)] max-h-[min(92dvh,92vh)] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden border border-slate-light/20 bg-gradient-to-br from-slate-dark/95 to-midnight/95 shadow-2xl">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-light/10 flex-shrink-0">
          <h2 className="text-base sm:text-xl font-bold text-pearl flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-glow/20 flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-bright" />
            </div>
            <span className="truncate">Add Stock</span>
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-light/50 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-steel" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {/* Stock Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-silver mb-2">
              Search stock
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-steel" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="AAPL, VUAA.DE, Apple…"
                className="glass-input w-full pl-10 pr-10"
                disabled={!!selectedStock}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-steel animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 glass-card p-2 max-h-48 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => handleSelectStock(stock)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-light/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-emerald-bright flex-shrink-0">{stock.symbol}</span>
                      {stock.type && stock.type !== 'EQUITY' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-sapphire/20 text-sapphire-bright flex-shrink-0">
                          {stock.type}
                        </span>
                      )}
                    </div>
                    <span className="text-silver text-sm block truncate">{stock.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Stock */}
          {selectedStock && (
            <div className="flex items-start justify-between gap-2 p-3 rounded-lg bg-emerald-glow/10 border border-emerald-glow/30">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-bold text-emerald-bright">{selectedStock.symbol}</span>
                  <span className="text-silver text-sm truncate">{selectedStock.name}</span>
                </div>
                {currentPriceNative > 0 && (
                  <p className="text-xs text-steel mt-1 break-words">
                    <span className="text-pearl font-mono">
                      {formatCurrency(currentPriceNative, quoteCurrency)}
                    </span>
                    {quoteCurrency !== 'USD' && (
                      <span className="text-amber-bright font-mono">
                        {' '}
                        → {formatUSD(currentPriceUSD)}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStock(null);
                  setAvgPrice('');
                  setQuoteCurrency('USD');
                  setCurrentPriceNative(0);
                  setCurrentPriceUSD(0);
                }}
                className="text-steel hover:text-pearl transition-colors flex-shrink-0 p-1"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedStock && fx.isNonUSD && (
            <div className="p-3 rounded-lg bg-amber/10 border border-amber/20 text-xs text-amber-bright leading-relaxed break-words">
              Quoted in {quoteCurrency}. Converted to USD for your portfolio.
              {fx.rateLabel ? ` ${fx.rateLabel}.` : ''}
            </div>
          )}

          {/* Input Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-dark/50">
            <button
              type="button"
              onClick={() => setInputMode('shares')}
              className={`flex items-center justify-center gap-1.5 min-h-[40px] px-2 py-2 rounded-lg text-xs sm:text-sm transition-all ${
                inputMode === 'shares'
                  ? 'bg-emerald-glow/20 text-emerald-bright border border-emerald-glow/30'
                  : 'text-steel hover:text-silver'
              }`}
            >
              <Hash className="w-4 h-4 flex-shrink-0" />
              Shares
            </button>
            <button
              type="button"
              onClick={() => setInputMode('amount')}
              className={`flex items-center justify-center gap-1.5 min-h-[40px] px-2 py-2 rounded-lg text-xs sm:text-sm transition-all ${
                inputMode === 'amount'
                  ? 'bg-emerald-glow/20 text-emerald-bright border border-emerald-glow/30'
                  : 'text-steel hover:text-silver'
              }`}
            >
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              Amount
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

              {/* Average Price (market currency) */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Average cost per share ({quoteCurrency})
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
                  Market currency
                  {avgPriceNative > 0 && quoteCurrency !== 'USD'
                    ? ` · ≈ ${formatUSD(avgPriceUSD)} USD`
                    : ''}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Investment Amount (USD cash) */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Total investment amount (USD)
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

              {/* Purchase Price (market currency) */}
              <div>
                <label className="block text-sm font-medium text-silver mb-2">
                  Purchase price per share ({quoteCurrency})
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

          {/* Pay from bank / historical purchase */}
          {selectedStock && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-silver">
                <Wallet className="inline w-4 h-4 mr-1" />
                Pay from
              </label>
              <select
                value={fundingSource}
                onChange={(e) => setFundingSource(e.target.value)}
                className="glass-input w-full appearance-none"
              >
                {cashAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (${(a.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                  </option>
                ))}
                <option value={NO_DEDUCT}>Don&apos;t deduct (past purchase)</option>
              </select>

              {deductCash ? (
                <div
                  className={`p-3 rounded-xl border ${
                    investedUSD <= fundingBalance
                      ? 'border-cyan-500/30 bg-cyan-500/10'
                      : 'border-amber-500/30 bg-amber-500/10'
                  }`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between min-w-0">
                    <p className="text-sm text-steel break-words">
                      {selectedFundingAccount?.name || 'Bank'}:{' '}
                      <span className="font-mono font-semibold text-pearl">
                        ${fundingBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </p>
                    {investedUSD > 0 && (
                      <p className="text-sm text-steel">
                        After:{' '}
                        <span
                          className={`font-mono font-semibold ${
                            investedUSD <= fundingBalance ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          $
                          {Math.max(0, fundingBalance - investedUSD).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                  {investedUSD > fundingBalance && investedUSD > 0 && (
                    <p className="text-xs text-amber-400 mt-2 break-words">
                      Not enough in this bank. Pick another account or “Don&apos;t deduct”.
                    </p>
                  )}
                  {availableCash > 0 && availableCash !== fundingBalance && (
                    <p className="text-xs text-steel mt-1">
                      Total cash across banks: $
                      {availableCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-steel leading-snug">
                  No cash will be deducted — use this for older buys you already paid for outside the app.
                </p>
              )}
            </div>
          )}

          {/* Live Preview (USD) */}
          {selectedStock && calculatedShares > 0 && avgPriceNative > 0 && currentPriceUSD > 0 && (
            <div className="p-4 rounded-xl border border-slate-light/30 bg-gradient-to-br from-slate-dark/50 to-obsidian/50">
              <h3 className="text-sm font-semibold text-silver mb-3 uppercase tracking-wide">Position Preview (USD)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-steel mb-1">Total Cost</p>
                  <p className="font-mono font-semibold text-pearl">
                    ${investedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
            <p className="text-ruby-bright text-sm break-words">{error}</p>
          )}
          </div>

          <div className="p-4 sm:p-5 border-t border-slate-light/10 grid grid-cols-2 gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary min-h-[44px] px-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary min-h-[44px] px-3 text-sm sm:text-base"
            >
              Add stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
