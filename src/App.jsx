import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Settings, Loader2, RefreshCw } from 'lucide-react';

import Header from './components/Header';
import StatsCards from './components/StatsCards';
import StockCard from './components/StockCard';
import WealthChart from './components/WealthChart';
import NewsSection from './components/NewsSection';
import AddStockModal from './components/AddStockModal';
import EditStockModal from './components/EditStockModal';
import SettingsPanel from './components/SettingsPanel';
import StockDetailModal from './components/StockDetailModal';
import EmptyState from './components/EmptyState';
import Watchlist from './components/Watchlist';
import StockDiscovery from './components/StockDiscovery';
import InvestableCash from './components/InvestableCash';

import { fetchStockHistory, fetchStockQuote, fetchUndervaluedStocks } from './services/stockApi';
import { savePortfolio, loadPortfolio, saveSettings, loadSettings, saveWatchlist, loadWatchlist, saveCashData, loadCashData } from './services/storage';
import { generateForecast, calculateWealthGrowth, calculatePortfolioMetrics } from './utils/forecasting';
import { generateDemoPortfolio } from './utils/demoData';
import { convertToUSD, getExchangeRate, fetchExchangeRates } from './services/currencyApi';

function App() {
  const [stocks, setStocks] = useState([]);
  const [settings, setSettings] = useState({ forecastYears: 5 });
  const [wealthData, setWealthData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    projectedValue5Y: 0,
    projectedReturn5Y: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [editingStock, setEditingStock] = useState(null);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [prefillStock, setPrefillStock] = useState(null);
  const [cashBalance, setCashBalance] = useState(0);
  const [cashTransactions, setCashTransactions] = useState([]);
  const [undervaluedStocks, setUndervaluedStocks] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Load saved data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const savedPortfolio = loadPortfolio();
        const savedSettings = loadSettings();
        const savedWatchlist = loadWatchlist();
        const savedCashData = loadCashData();
        
        setSettings(savedSettings);
        setWatchlist(savedWatchlist);
        setCashBalance(savedCashData.balance || 0);
        setCashTransactions(savedCashData.transactions || []);

        if (savedPortfolio.length > 0) {
          await refreshStockData(savedPortfolio);
        }

        // Load undervalued stocks for suggestions
        try {
          const undervalued = await fetchUndervaluedStocks();
          setUndervaluedStocks(undervalued);
        } catch (err) {
          console.error('Error loading undervalued stocks:', err);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load portfolio data');
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Calculate total monthly contribution from individual stocks
  const totalMonthlyContribution = stocks.reduce((sum, stock) => sum + (stock.monthlyContribution || 0), 0);

  // Recalculate wealth when stocks or settings change
  useEffect(() => {
    if (stocks.length > 0) {
      const totalContribution = stocks.reduce((sum, stock) => sum + (stock.monthlyContribution || 0), 0);
      const wealth = calculateWealthGrowth(stocks, totalContribution, settings.forecastYears);
      setWealthData(wealth);
      
      const portfolioMetrics = calculatePortfolioMetrics(stocks);
      setMetrics(portfolioMetrics);
    } else {
      setWealthData([]);
      setMetrics({
        totalInvested: 0,
        currentValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        projectedValue5Y: 0,
        projectedReturn5Y: 0,
      });
    }
  }, [stocks, settings]);

  const refreshStockData = async (portfolioStocks) => {
    // Ensure we have fresh exchange rates
    await fetchExchangeRates();
    
    const updatedStocks = await Promise.all(
      portfolioStocks.map(async (stock) => {
        try {
          const data = await fetchStockHistory(stock.symbol, 10);
          const { forecast, confidence } = generateForecast(data.history, 60);
          
          const currency = data.currency || 'USD';
          const exchangeRate = getExchangeRate(currency);
          
          // Convert prices to USD for calculations
          const currentPriceUSD = convertToUSD(data.currentPrice, currency);
          const historyUSD = data.history.map(h => ({
            ...h,
            priceOriginal: h.price,
            price: convertToUSD(h.price, currency),
          }));
          
          // Regenerate forecast with USD prices
          const { forecast: forecastUSD, confidence: confidenceUSD } = generateForecast(historyUSD, 60);
          
          return {
            ...stock,
            name: data.name || stock.name,
            currency,
            exchangeRate,
            currentPriceOriginal: data.currentPrice,
            currentPrice: currentPriceUSD,
            historyOriginal: data.history,
            history: historyUSD,
            forecast: forecastUSD,
            confidence: confidenceUSD,
          };
        } catch (err) {
          console.error(`Failed to fetch ${stock.symbol}:`, err);
          return {
            ...stock,
            error: true,
          };
        }
      })
    );

    setStocks(updatedStocks);
    return updatedStocks;
  };

  const handleRefresh = async () => {
    if (stocks.length === 0) return;
    
    setIsRefreshing(true);
    setError(null);
    try {
      await refreshStockData(stocks);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Failed to refresh data');
    }
    setIsRefreshing(false);
  };

  // Auto-refresh portfolio every 5 minutes
  useEffect(() => {
    if (stocks.length === 0) return;
    
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [stocks.length]);

  const handleAddStock = async (newStock) => {
    setIsRefreshing(true);
    try {
      await fetchExchangeRates();
      const data = await fetchStockHistory(newStock.symbol, 10);
      
      const currency = data.currency || 'USD';
      const exchangeRate = getExchangeRate(currency);
      
      // Convert prices to USD
      const currentPriceUSD = convertToUSD(data.currentPrice, currency);
      const historyUSD = data.history.map(h => ({
        ...h,
        priceOriginal: h.price,
        price: convertToUSD(h.price, currency),
      }));
      
      const { forecast, confidence } = generateForecast(historyUSD, 60);
      
      // Convert user's purchase price to USD if needed
      const purchasePriceUSD = newStock.currency === currency 
        ? convertToUSD(newStock.purchasePrice, currency)
        : newStock.purchasePrice; // Assume user entered in USD if currency doesn't match
      
      const stockWithData = {
        ...newStock,
        name: data.name || newStock.name,
        currency,
        exchangeRate,
        currentPriceOriginal: data.currentPrice,
        currentPrice: currentPriceUSD,
        purchasePriceOriginal: newStock.purchasePrice,
        purchasePrice: purchasePriceUSD,
        historyOriginal: data.history,
        history: historyUSD,
        forecast,
        confidence,
      };

      const updatedStocks = [...stocks, stockWithData];
      setStocks(updatedStocks);
      savePortfolio(updatedStocks);
    } catch (err) {
      console.error('Failed to add stock:', err);
      setError(`Failed to add ${newStock.symbol}. Please check the symbol and try again.`);
    }
    setIsRefreshing(false);
  };

  const handleRemoveStock = (symbol) => {
    const updatedStocks = stocks.filter(s => s.symbol !== symbol);
    setStocks(updatedStocks);
    savePortfolio(updatedStocks);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleViewChart = (stock) => {
    setSelectedStock(stock);
  };

  const handleLoadDemo = () => {
    setIsRefreshing(true);
    try {
      const demoPortfolio = generateDemoPortfolio();
      const stocksWithForecast = demoPortfolio.map(stock => {
        const { forecast, confidence } = generateForecast(stock.history, 60);
        return {
          ...stock,
          forecast,
          confidence,
          addedAt: new Date().toISOString(),
        };
      });
      
      setStocks(stocksWithForecast);
      savePortfolio(stocksWithForecast);
    } catch (err) {
      console.error('Failed to load demo:', err);
      setError('Failed to load demo data');
    }
    setIsRefreshing(false);
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
  };

  const handleSaveEdit = (updatedStock) => {
    const updatedStocks = stocks.map(s => 
      s.symbol === updatedStock.symbol 
        ? { ...s, ...updatedStock }
        : s
    );
    setStocks(updatedStocks);
    savePortfolio(updatedStocks);
    setEditingStock(null);
  };

  const handleAddTransaction = (symbol, transaction) => {
    // If it's a sell transaction, add proceeds to cash
    if (transaction.type === 'sell') {
      const saleProceeds = transaction.shares * transaction.price;
      const newCashTransaction = {
        id: Date.now().toString(),
        type: 'sell',
        amount: saleProceeds,
        note: `Sold ${transaction.shares} shares of ${symbol}`,
        symbol,
        date: transaction.date || new Date().toISOString(),
      };
      
      const newBalance = cashBalance + saleProceeds;
      const newCashTransactions = [newCashTransaction, ...cashTransactions];
      
      setCashBalance(newBalance);
      setCashTransactions(newCashTransactions);
      saveCashData({ balance: newBalance, transactions: newCashTransactions });
    }
    
    // If it's a buy transaction, deduct from cash if available
    if (transaction.type === 'buy') {
      const purchaseCost = transaction.shares * transaction.price;
      if (cashBalance >= purchaseCost) {
        const newCashTransaction = {
          id: Date.now().toString(),
          type: 'buy',
          amount: purchaseCost,
          note: `Bought ${transaction.shares} shares of ${symbol}`,
          symbol,
          date: transaction.date || new Date().toISOString(),
        };
        
        const newBalance = cashBalance - purchaseCost;
        const newCashTransactions = [newCashTransaction, ...cashTransactions];
        
        setCashBalance(newBalance);
        setCashTransactions(newCashTransactions);
        saveCashData({ balance: newBalance, transactions: newCashTransactions });
      }
    }

    const updatedStocks = stocks.map(s => {
      if (s.symbol === symbol) {
        const transactions = [...(s.transactions || []), transaction];
        
        // Recalculate shares and invested amount from transactions
        const totals = transactions.reduce((acc, t) => {
          if (t.type === 'buy') {
            acc.totalShares += t.shares;
            acc.totalInvested += t.shares * t.price;
          } else {
            acc.totalShares -= t.shares;
          }
          return acc;
        }, { totalShares: 0, totalInvested: 0 });
        
        const avgPrice = totals.totalShares > 0 
          ? totals.totalInvested / (totals.totalShares + transactions.filter(t => t.type === 'sell').reduce((acc, t) => acc + t.shares, 0))
          : s.purchasePrice;
        
        return {
          ...s,
          transactions,
          shares: totals.totalShares,
          investedAmount: totals.totalInvested,
          purchasePrice: avgPrice,
        };
      }
      return s;
    });
    
    setStocks(updatedStocks);
    savePortfolio(updatedStocks);
    
    // Update selected stock if viewing it
    if (selectedStock?.symbol === symbol) {
      setSelectedStock(updatedStocks.find(s => s.symbol === symbol));
    }
  };

  const handleDeleteTransaction = (symbol, transactionId) => {
    const updatedStocks = stocks.map(s => {
      if (s.symbol === symbol) {
        const transactions = (s.transactions || []).filter(t => t.id !== transactionId);
        
        // Recalculate shares and invested amount from remaining transactions
        const totals = transactions.reduce((acc, t) => {
          if (t.type === 'buy') {
            acc.totalShares += t.shares;
            acc.totalInvested += t.shares * t.price;
          } else {
            acc.totalShares -= t.shares;
          }
          return acc;
        }, { totalShares: 0, totalInvested: 0 });
        
        // If no transactions left, keep original values
        if (transactions.length === 0) {
          return {
            ...s,
            transactions,
          };
        }
        
        const avgPrice = totals.totalShares > 0 
          ? totals.totalInvested / (totals.totalShares + transactions.filter(t => t.type === 'sell').reduce((acc, t) => acc + t.shares, 0))
          : s.purchasePrice;
        
        return {
          ...s,
          transactions,
          shares: totals.totalShares,
          investedAmount: totals.totalInvested,
          purchasePrice: avgPrice,
        };
      }
      return s;
    });
    
    setStocks(updatedStocks);
    savePortfolio(updatedStocks);
    
    // Update selected stock if viewing it
    if (selectedStock?.symbol === symbol) {
      setSelectedStock(updatedStocks.find(s => s.symbol === symbol));
    }
  };

  const handleAddToWatchlist = async (stock) => {
    // Check if already in watchlist
    if (watchlist.some(w => w.symbol === stock.symbol)) return;
    
    try {
      const quote = await fetchStockQuote(stock.symbol);
      const newWatchlistItem = {
        symbol: stock.symbol,
        name: stock.name || quote.name,
        addedPrice: quote.price,
        addedDate: new Date().toISOString(),
      };
      
      const updatedWatchlist = [...watchlist, newWatchlistItem];
      setWatchlist(updatedWatchlist);
      saveWatchlist(updatedWatchlist);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    }
  };

  const handleRemoveFromWatchlist = (symbol) => {
    const updatedWatchlist = watchlist.filter(w => w.symbol !== symbol);
    setWatchlist(updatedWatchlist);
    saveWatchlist(updatedWatchlist);
  };

  const handleAddFromWatchlist = (stock) => {
    // Remove from watchlist and open add modal with prefilled data
    handleRemoveFromWatchlist(stock.symbol);
    setPrefillStock(stock);
    setShowAddModal(true);
  };

  const handleAddFromDiscovery = (stock) => {
    setPrefillStock(stock);
    setShowAddModal(true);
  };

  // Cash management functions
  const handleAddCash = (amount, note) => {
    const newTransaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      note,
      date: new Date().toISOString(),
    };
    
    const newBalance = cashBalance + amount;
    const newTransactions = [newTransaction, ...cashTransactions];
    
    setCashBalance(newBalance);
    setCashTransactions(newTransactions);
    saveCashData({ balance: newBalance, transactions: newTransactions });
  };

  const handleWithdrawCash = (amount, note) => {
    if (amount > cashBalance) return;
    
    const newTransaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      note,
      date: new Date().toISOString(),
    };
    
    const newBalance = cashBalance - amount;
    const newTransactions = [newTransaction, ...cashTransactions];
    
    setCashBalance(newBalance);
    setCashTransactions(newTransactions);
    saveCashData({ balance: newBalance, transactions: newTransactions });
  };

  // Update handleAddStock to deduct from cash if available
  const originalHandleAddStock = handleAddStock;
  const handleAddStockWithCash = async (newStock) => {
    const investedAmount = newStock.investedAmount || (newStock.shares * newStock.purchasePrice);
    
    // Deduct from cash if we have enough
    if (cashBalance >= investedAmount) {
      const newTransaction = {
        id: Date.now().toString(),
        type: 'buy',
        amount: investedAmount,
        note: `Bought ${newStock.symbol}`,
        symbol: newStock.symbol,
        date: new Date().toISOString(),
      };
      
      const newBalance = cashBalance - investedAmount;
      const newTransactions = [newTransaction, ...cashTransactions];
      
      setCashBalance(newBalance);
      setCashTransactions(newTransactions);
      saveCashData({ balance: newBalance, transactions: newTransactions });
    }
    
    // Continue with original add stock logic
    await handleAddStock(newStock);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-bright animate-spin mx-auto mb-4" />
          <p className="text-silver">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-glow/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sapphire/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-violet/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <Header 
          netWorth={metrics.currentValue + cashBalance}
          totalReturn={metrics.totalReturn}
          totalReturnPercent={metrics.totalReturnPercent}
        />

        {error && (
          <div className="mb-6 p-4 glass-card border-ruby/30 bg-ruby/10">
            <p className="text-ruby-bright">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-sm text-steel hover:text-pearl mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {stocks.length === 0 ? (
          <EmptyState 
            onAddStock={() => setShowAddModal(true)} 
            onLoadDemo={handleLoadDemo}
          />
        ) : (
          <>
            {/* Unified Dashboard Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {/* Left: Stats + Chart stacked */}
              <div className="lg:col-span-3 space-y-0">
                {/* Stats Cards - no bottom margin, connected to chart */}
                <StatsCards metrics={metrics} />
                {/* Wealth Chart - connected below stats */}
                <div className="mt-2">
                  <WealthChart 
                    wealthData={wealthData} 
                    monthlyContribution={totalMonthlyContribution}
                  />
                </div>
              </div>
              
              {/* Right Sidebar: Cash + Watchlist stacked */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <InvestableCash
                  cashBalance={cashBalance}
                  cashTransactions={cashTransactions}
                  onAddCash={handleAddCash}
                  onWithdrawCash={handleWithdrawCash}
                  portfolioStocks={stocks}
                  watchlistStocks={watchlist}
                  undervaluedStocks={undervaluedStocks}
                  onBuyStock={handleAddFromDiscovery}
                  compact={true}
                />
                <div className="flex-1">
                  <Watchlist
                    watchlist={watchlist}
                    onAddToWatchlist={handleAddToWatchlist}
                    onRemoveFromWatchlist={handleRemoveFromWatchlist}
                    onAddToPortfolio={handleAddFromWatchlist}
                    compact={true}
                  />
                </div>
              </div>
            </div>

            {/* Holdings Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-pearl">Your Holdings ({stocks.length})</h2>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-1.5 rounded-lg hover:bg-slate-light/30 text-steel hover:text-emerald-bright transition-colors disabled:opacity-50"
                    title="Refresh prices"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  {lastRefresh && (
                    <span className="text-xs text-steel">
                      Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Stock</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {stocks.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    totalPortfolioValue={metrics.currentValue}
                    onRemove={handleRemoveStock}
                    onViewChart={handleViewChart}
                    onEdit={handleEditStock}
                  />
                ))}
              </div>
            </div>

            {/* Stock Discovery - Full Width */}
            <StockDiscovery
              portfolioSymbols={stocks.map(s => s.symbol)}
              watchlistSymbols={watchlist.map(w => w.symbol)}
              onAddToWatchlist={handleAddToWatchlist}
              onAddToPortfolio={handleAddFromDiscovery}
            />

            {/* News Section */}
            <NewsSection symbols={stocks.map(s => s.symbol)} />
          </>
        )}

        {/* Modals */}
        <AddStockModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setPrefillStock(null);
          }}
          onAdd={handleAddStockWithCash}
          prefillStock={prefillStock}
          availableCash={cashBalance}
        />

        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSave={handleSaveSettings}
          totalMonthlyContribution={totalMonthlyContribution}
        />

        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />

        <EditStockModal
          stock={editingStock}
          onClose={() => setEditingStock(null)}
          onSave={handleSaveEdit}
        />

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-steel">
          <p>
            Stock data provided by Yahoo Finance • Forecasts are estimates based on historical performance
          </p>
          <p className="mt-1">
            Past performance does not guarantee future results
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
