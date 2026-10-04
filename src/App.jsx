import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Settings, Loader2, RefreshCw } from 'lucide-react';

import Header from './components/Header';
import TabNav from './components/TabNav';
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
import WealthProjector from './components/WealthProjector';
import AuthModal from './components/AuthModal';

import { fetchStockHistory, fetchStockQuote, fetchUndervaluedStocks, fetchSingleStockNews } from './services/stockApi';
import {
  savePortfolio,
  loadPortfolio,
  saveSettings,
  loadSettings,
  saveWatchlist,
  loadWatchlist,
  saveCashData,
  loadCashData,
  createCashAccount,
  normalizeCashData,
} from './services/storage';
import {
  generateAnalystProjection,
  normalizeAnalyst,
  calculateWealthGrowth,
  calculatePortfolioMetrics,
} from './utils/forecasting';
import { generateDemoPortfolio } from './utils/demoData';
import { convertToUSD, getExchangeRate, fetchExchangeRates } from './services/currencyApi';
import {
  fetchMe,
  getStoredEmail,
  isLoggedIn,
  logout as authLogout,
} from './services/authApi';
import {
  buildWorkspace,
  resolveWorkspaceOnLogin,
  scheduleCloudSave,
} from './services/cloudSync';

function App() {
  const [stocks, setStocks] = useState([]);
  const [settings, setSettings] = useState({ forecastYears: 5 });
  const [wealthData, setWealthData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    analystTargetValue: 0,
    analystUpsidePercent: 0,
    coveredCount: 0,
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
  const [cashAccounts, setCashAccounts] = useState([]);
  const [cashTransactions, setCashTransactions] = useState([]);
  const [undervaluedStocks, setUndervaluedStocks] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [stockNews, setStockNews] = useState({}); // { symbol: latestNewsItem }
  const [userEmail, setUserEmail] = useState(getStoredEmail());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('portfolio');
  const skipNextCloudSave = useRef(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load saved data on mount (cloud if logged in, else local)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        let savedPortfolio = loadPortfolio();
        let savedSettings = loadSettings();
        let savedWatchlist = loadWatchlist();
        let savedCashData = loadCashData();

        if (isLoggedIn()) {
          try {
            const me = await fetchMe();
            setUserEmail(me.email);
            const workspace = await resolveWorkspaceOnLogin();
            if (workspace) {
              savedPortfolio = workspace.portfolio || [];
              savedSettings = workspace.settings || savedSettings;
              savedWatchlist = workspace.watchlist || [];
              savedCashData = workspace.cash || savedCashData;
              skipNextCloudSave.current = true;
            }
          } catch (err) {
            console.error('Session invalid, using local data:', err);
            authLogout();
            setUserEmail(null);
          }
        }
        
        setSettings(savedSettings);
        setWatchlist(savedWatchlist);
        {
          const cash = normalizeCashData(savedCashData);
          setCashAccounts(cash.accounts);
          setCashBalance(cash.balance);
          setCashTransactions(cash.transactions);
        }

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

  // Debounced cloud sync when logged in
  useEffect(() => {
    if (!userEmail || isLoading) return;
    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }
    scheduleCloudSave(
      buildWorkspace({
        stocks,
        settings,
        watchlist,
        cashBalance,
        cashAccounts,
        cashTransactions,
      })
    );
  }, [stocks, settings, watchlist, cashBalance, cashAccounts, cashTransactions, userEmail, isLoading]);

  const handleAuthSuccess = async (data) => {
    setUserEmail(data.email);
    setIsLoading(true);
    try {
      const workspace = await resolveWorkspaceOnLogin();
      skipNextCloudSave.current = true;
      const portfolio = workspace?.portfolio || [];
      const nextSettings = workspace?.settings || loadSettings();
      const nextWatchlist = workspace?.watchlist || [];
      const nextCash = normalizeCashData(workspace?.cash || {});

      setSettings(nextSettings);
      setWatchlist(nextWatchlist);
      setCashAccounts(nextCash.accounts);
      setCashBalance(nextCash.balance);
      setCashTransactions(nextCash.transactions);

      if (portfolio.length > 0) {
        await refreshStockData(portfolio);
      } else {
        setStocks([]);
        setWealthData([]);
      }
    } catch (err) {
      console.error('Failed to load cloud workspace:', err);
      setError('Signed in, but failed to load cloud data');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    authLogout();
    setUserEmail(null);
  };

  // Calculate total monthly contribution from individual stocks
  const totalMonthlyContribution = stocks.reduce((sum, stock) => sum + (stock.monthlyContribution || 0), 0);

  // Recalculate wealth when stocks or settings change
  useEffect(() => {
    if (stocks.length > 0) {
      const wealth = calculateWealthGrowth(stocks);
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
        analystTargetValue: 0,
        analystUpsidePercent: 0,
        coveredCount: 0,
      });
    }
  }, [stocks, settings]);

  // Fetch news for all portfolio stocks
  useEffect(() => {
    const fetchAllStockNews = async () => {
      if (stocks.length === 0) return;
      
      const newsMap = {};
      await Promise.all(
        stocks.map(async (stock) => {
          try {
            const newsItems = await fetchSingleStockNews(stock.symbol, 1);
            if (newsItems.length > 0) {
              newsMap[stock.symbol] = newsItems[0];
            }
          } catch (err) {
            console.error(`Failed to fetch news for ${stock.symbol}:`, err);
          }
        })
      );
      setStockNews(newsMap);
    };
    
    fetchAllStockNews();
  }, [stocks.length]); // Only refetch when number of stocks changes

  const refreshStockData = async (portfolioStocks) => {
    // Ensure we have fresh exchange rates
    await fetchExchangeRates();
    
    const updatedStocks = await Promise.all(
      portfolioStocks.map(async (stock) => {
        try {
          const data = await fetchStockHistory(stock.symbol, 10);
          
          const currency = data.currency || 'USD';
          const exchangeRate = getExchangeRate(currency);
          
          // Convert prices to USD for calculations
          const currentPriceUSD = convertToUSD(data.currentPrice, currency);
          const historyUSD = data.history.map(h => ({
            ...h,
            priceOriginal: h.price,
            price: convertToUSD(h.price, currency),
          }));

          const analystNative = data.analyst || null;
          const analystUSD = analystNative
            ? normalizeAnalyst(
                {
                  ...analystNative,
                  targetMean: analystNative.targetMean != null ? convertToUSD(analystNative.targetMean, currency) : null,
                  targetHigh: analystNative.targetHigh != null ? convertToUSD(analystNative.targetHigh, currency) : null,
                  targetLow: analystNative.targetLow != null ? convertToUSD(analystNative.targetLow, currency) : null,
                  targetMedian: analystNative.targetMedian != null ? convertToUSD(analystNative.targetMedian, currency) : null,
                  currentPrice: currentPriceUSD,
                },
                currentPriceUSD
              )
            : normalizeAnalyst(null, currentPriceUSD);

          const { forecast, confidence, analyst } = generateAnalystProjection(
            currentPriceUSD,
            analystUSD,
            12
          );
          
          return {
            ...stock,
            name: data.name || stock.name,
            currency,
            exchangeRate,
            quoteType: data.quoteType || stock.quoteType,
            currentPriceOriginal: data.currentPrice,
            currentPrice: currentPriceUSD,
            historyOriginal: data.history,
            history: historyUSD,
            analyst,
            fundamentals: data.fundamentals || null,
            forecast,
            confidence,
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
      
      const analystNative = data.analyst || null;
      const analystUSD = analystNative
        ? normalizeAnalyst(
            {
              ...analystNative,
              targetMean: analystNative.targetMean != null ? convertToUSD(analystNative.targetMean, currency) : null,
              targetHigh: analystNative.targetHigh != null ? convertToUSD(analystNative.targetHigh, currency) : null,
              targetLow: analystNative.targetLow != null ? convertToUSD(analystNative.targetLow, currency) : null,
              targetMedian: analystNative.targetMedian != null ? convertToUSD(analystNative.targetMedian, currency) : null,
              currentPrice: currentPriceUSD,
            },
            currentPriceUSD
          )
        : normalizeAnalyst(null, currentPriceUSD);

      const { forecast, confidence, analyst } = generateAnalystProjection(
        currentPriceUSD,
        analystUSD,
        12
      );
      
      // Convert user's purchase price to USD if needed
      const purchasePriceUSD = newStock.currency === currency 
        ? convertToUSD(newStock.purchasePrice, currency)
        : newStock.purchasePrice; // Assume user entered in USD if currency doesn't match
      
      const stockWithData = {
        ...newStock,
        name: data.name || newStock.name,
        currency,
        exchangeRate,
        quoteType: data.quoteType,
        currentPriceOriginal: data.currentPrice,
        currentPrice: currentPriceUSD,
        purchasePriceOriginal: newStock.purchasePrice,
        purchasePrice: purchasePriceUSD,
        historyOriginal: data.history,
        history: historyUSD,
        analyst,
        fundamentals: data.fundamentals || null,
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
        const price = stock.currentPrice || stock.history?.[stock.history.length - 1]?.price;
        const { forecast, confidence, analyst } = generateAnalystProjection(
          price,
          stock.analyst || {
            coverage: true,
            targetMean: price * 1.12,
            targetHigh: price * 1.25,
            targetLow: price * 0.95,
            rating: 'Buy',
            sentiment: 'bullish',
            analystCount: 18,
            upsidePercent: 12,
          },
          12
        );
        return {
          ...stock,
          analyst,
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

  const persistCashState = (accounts, transactions) => {
    const normalized = normalizeCashData({ accounts, transactions });
    setCashAccounts(normalized.accounts);
    setCashBalance(normalized.balance);
    setCashTransactions(normalized.transactions);
    saveCashData(normalized);
    return normalized;
  };

  /** Credit one bank (default: largest balance account). */
  const creditCashAccount = (accounts, amount, accountId) => {
    const list = accounts.length ? [...accounts] : [createCashAccount('Main account')];
    let idx = list.findIndex((a) => a.id === accountId);
    if (idx < 0) {
      idx = list.reduce(
        (best, a, i, arr) => ((a.balance || 0) > (arr[best].balance || 0) ? i : best),
        0
      );
    }
    list[idx] = { ...list[idx], balance: (list[idx].balance || 0) + amount };
    return { accounts: list, accountId: list[idx].id };
  };

  /** Deduct across banks (prefer accountId, then largest balances). */
  const debitCashAccounts = (accounts, amount, accountId) => {
    const list = accounts.map((a) => ({ ...a }));
    let remaining = amount;
    const touched = [];

    if (accountId) {
      const idx = list.findIndex((a) => a.id === accountId);
      if (idx >= 0) {
        const take = Math.min(list[idx].balance || 0, remaining);
        list[idx].balance = (list[idx].balance || 0) - take;
        remaining -= take;
        if (take > 0) touched.push({ accountId: list[idx].id, amount: take });
      }
    }

    const order = [...list.keys()].sort(
      (i, j) => (list[j].balance || 0) - (list[i].balance || 0)
    );
    for (const idx of order) {
      if (remaining <= 0) break;
      if (accountId && list[idx].id === accountId) continue;
      const take = Math.min(list[idx].balance || 0, remaining);
      if (take <= 0) continue;
      list[idx].balance -= take;
      remaining -= take;
      touched.push({ accountId: list[idx].id, amount: take });
    }

    return { accounts: list, remaining, touched };
  };

  const handleAddTransaction = (symbol, transaction) => {
    // If it's a sell transaction, add proceeds to cash
    if (transaction.type === 'sell') {
      const saleProceeds = transaction.shares * transaction.price;
      const { accounts: nextAccounts, accountId } = creditCashAccount(
        cashAccounts,
        saleProceeds
      );
      const newCashTransaction = {
        id: Date.now().toString(),
        type: 'sell',
        amount: saleProceeds,
        note: `Sold ${transaction.shares} shares of ${symbol}`,
        symbol,
        accountId,
        date: transaction.date || new Date().toISOString(),
      };
      persistCashState(nextAccounts, [newCashTransaction, ...cashTransactions]);
    }
    
    // If it's a buy transaction, deduct from cash if available
    if (transaction.type === 'buy') {
      const purchaseCost = transaction.shares * transaction.price;
      if (cashBalance >= purchaseCost) {
        const { accounts: nextAccounts, touched } = debitCashAccounts(
          cashAccounts,
          purchaseCost
        );
        const newCashTransactions = touched.map((t, i) => ({
          id: `${Date.now()}_${i}`,
          type: 'buy',
          amount: t.amount,
          note: `Bought ${transaction.shares} shares of ${symbol}`,
          symbol,
          accountId: t.accountId,
          date: transaction.date || new Date().toISOString(),
        }));
        persistCashState(nextAccounts, [...newCashTransactions, ...cashTransactions]);
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

  // Cash management functions (per bank account)
  const handleAddCash = (amount, note, accountId) => {
    const { accounts: nextAccounts, accountId: creditedId } = creditCashAccount(
      cashAccounts,
      amount,
      accountId
    );
    const newTransaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      note,
      accountId: creditedId,
      date: new Date().toISOString(),
    };
    persistCashState(nextAccounts, [newTransaction, ...cashTransactions]);
  };

  const handleWithdrawCash = (amount, note, accountId) => {
    if (amount > cashBalance) return;
    if (accountId) {
      const account = cashAccounts.find((a) => a.id === accountId);
      if (!account || amount > (account.balance || 0)) return;
    }
    const { accounts: nextAccounts, remaining, touched } = debitCashAccounts(
      cashAccounts,
      amount,
      accountId
    );
    if (remaining > 0.0001) return;
    const newTransactions = touched.map((t, i) => ({
      id: `${Date.now()}_${i}`,
      type: 'withdrawal',
      amount: t.amount,
      note,
      accountId: t.accountId,
      date: new Date().toISOString(),
    }));
    persistCashState(nextAccounts, [...newTransactions, ...cashTransactions]);
  };

  const handleAddCashAccount = (name) => {
    const account = createCashAccount(name);
    persistCashState([...cashAccounts, account], cashTransactions);
  };

  const handleRenameCashAccount = (accountId, name) => {
    const next = cashAccounts.map((a) =>
      a.id === accountId ? { ...a, name: name.trim() || a.name } : a
    );
    persistCashState(next, cashTransactions);
  };

  const handleRemoveCashAccount = (accountId) => {
    if (cashAccounts.length <= 1) return;
    const target = cashAccounts.find((a) => a.id === accountId);
    if (!target) return;
    if ((target.balance || 0) > 0) {
      // Move remaining balance into the first other account
      const others = cashAccounts.filter((a) => a.id !== accountId);
      others[0] = {
        ...others[0],
        balance: (others[0].balance || 0) + (target.balance || 0),
      };
      const moveTx = {
        id: Date.now().toString(),
        type: 'deposit',
        amount: target.balance || 0,
        note: `Moved from ${target.name}`,
        accountId: others[0].id,
        date: new Date().toISOString(),
      };
      persistCashState(others, [moveTx, ...cashTransactions]);
      return;
    }
    persistCashState(
      cashAccounts.filter((a) => a.id !== accountId),
      cashTransactions
    );
  };

  // Update handleAddStock to deduct from cash if available
  const handleAddStockWithCash = async (newStock) => {
    const investedAmount = newStock.investedAmount || (newStock.shares * newStock.purchasePrice);
    
    // Deduct from cash if we have enough
    if (cashBalance >= investedAmount) {
      const { accounts: nextAccounts, touched } = debitCashAccounts(
        cashAccounts,
        investedAmount
      );
      const newTransactions = touched.map((t, i) => ({
        id: `${Date.now()}_${i}`,
        type: 'buy',
        amount: t.amount,
        note: `Bought ${newStock.symbol}`,
        symbol: newStock.symbol,
        accountId: t.accountId,
        date: new Date().toISOString(),
      }));
      persistCashState(nextAccounts, [...newTransactions, ...cashTransactions]);
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
    <div className="min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-8">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-glow/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-sapphire/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 pt-1 sm:pt-4">
        <Header
          netWorth={metrics.currentValue + cashBalance}
          totalReturn={metrics.totalReturn}
          totalReturnPercent={metrics.totalReturnPercent}
          userEmail={userEmail}
          onLoginClick={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />

        <TabNav activeTab={activeTab} onChange={handleTabChange} />

        {error && (
          <div className="mb-4 p-3 sm:p-4 glass-card border-ruby/30 bg-ruby/10">
            <p className="text-ruby-bright text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-steel hover:text-pearl mt-2 touch-manipulation"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <>
            {stocks.length === 0 ? (
              <EmptyState
                onAddStock={() => setShowAddModal(true)}
                onLoadDemo={handleLoadDemo}
              />
            ) : (
              <>
                <div className="mb-4 space-y-2">
                  <StatsCards metrics={metrics} />
                  <WealthChart
                    wealthData={wealthData}
                    monthlyContribution={totalMonthlyContribution}
                    stocks={stocks}
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-pearl truncate">
                        Holdings ({stocks.length})
                      </h2>
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-2 rounded-lg hover:bg-slate-light/30 text-steel hover:text-emerald-bright transition-colors disabled:opacity-50 touch-manipulation"
                        title="Refresh prices"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                      {lastRefresh && (
                        <span className="text-[11px] text-steel hidden xs:inline sm:inline">
                          {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShowSettings(true)}
                        className="btn-secondary flex items-center gap-2 px-3 py-2 min-h-[40px]"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Settings</span>
                      </button>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2 px-3 py-2 min-h-[40px]"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {stocks.map((stock) => (
                      <StockCard
                        key={stock.symbol}
                        stock={stock}
                        totalPortfolioValue={metrics.currentValue}
                        onRemove={handleRemoveStock}
                        onViewChart={handleViewChart}
                        onEdit={handleEditStock}
                        latestNews={stockNews[stock.symbol]}
                      />
                    ))}
                  </div>
                </div>

                <NewsSection symbols={stocks.map((s) => s.symbol)} />
              </>
            )}
          </>
        )}

        {activeTab === 'cash' && (
          <InvestableCash
            cashBalance={cashBalance}
            cashAccounts={cashAccounts}
            cashTransactions={cashTransactions}
            onAddCash={handleAddCash}
            onWithdrawCash={handleWithdrawCash}
            onAddAccount={handleAddCashAccount}
            onRenameAccount={handleRenameCashAccount}
            onRemoveAccount={handleRemoveCashAccount}
            portfolioStocks={stocks}
            watchlistStocks={watchlist}
            undervaluedStocks={undervaluedStocks}
            onBuyStock={handleAddFromDiscovery}
            compact={false}
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist
            watchlist={watchlist}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onAddToPortfolio={handleAddFromWatchlist}
            compact={false}
          />
        )}

        {activeTab === 'discover' && (
          <StockDiscovery
            portfolioSymbols={stocks.map((s) => s.symbol)}
            watchlistSymbols={watchlist.map((w) => w.symbol)}
            onAddToWatchlist={handleAddToWatchlist}
            onAddToPortfolio={handleAddFromDiscovery}
          />
        )}

        {activeTab === 'project' && (
          <WealthProjector
            cashBalance={cashBalance}
            onAllocateCash={(amount, note) => handleWithdrawCash(amount, note)}
          />
        )}

        {/* Floating add on portfolio (mobile) */}
        {activeTab === 'portfolio' && stocks.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="sm:hidden fixed right-4 z-30 btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-emerald-glow/30 touch-manipulation"
            style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
            aria-label="Add stock"
          >
            <Plus className="w-6 h-6" />
          </button>
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

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />

        <footer className="mt-8 mb-4 text-center text-[11px] sm:text-sm text-steel px-2">
          <p>
            Yahoo Finance data · Forecasts are estimates
          </p>
          <p className="mt-1">Past performance does not guarantee future results</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
