// Local storage service for portfolio persistence

const STORAGE_KEY = 'stock_wealth_tracker_portfolio';
const SETTINGS_KEY = 'stock_wealth_tracker_settings';
const WATCHLIST_KEY = 'stock_wealth_tracker_watchlist';
const CASH_KEY = 'stock_wealth_tracker_cash';

export function savePortfolio(portfolio) {
  try {
    const data = {
      stocks: portfolio.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        shares: stock.shares,
        investedAmount: stock.investedAmount,
        purchasePrice: stock.purchasePrice,
        purchasePriceOriginal: stock.purchasePriceOriginal,
        purchaseDate: stock.purchaseDate,
        currency: stock.currency || 'USD',
        exchangeRate: stock.exchangeRate || 1,
        monthlyContribution: stock.monthlyContribution || 0,
        transactions: stock.transactions || [],
        addedAt: stock.addedAt,
      })),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving portfolio:', error);
    return false;
  }
}

export function loadPortfolio() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return parsed.stocks || [];
  } catch (error) {
    console.error('Error loading portfolio:', error);
    return [];
  }
}

export function clearPortfolio() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing portfolio:', error);
    return false;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      return {
        currency: 'USD',
        forecastYears: 5,
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      currency: 'USD',
      forecastYears: 5,
    };
  }
}

export function saveWatchlist(watchlist) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify({
      stocks: watchlist,
      lastUpdated: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error('Error saving watchlist:', error);
    return false;
  }
}

export function loadWatchlist() {
  try {
    const data = localStorage.getItem(WATCHLIST_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return parsed.stocks || [];
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
}

export function saveCashData(cashData) {
  try {
    localStorage.setItem(CASH_KEY, JSON.stringify({
      ...cashData,
      lastUpdated: new Date().toISOString(),
    }));
    return true;
  } catch (error) {
    console.error('Error saving cash data:', error);
    return false;
  }
}

export function loadCashData() {
  try {
    const data = localStorage.getItem(CASH_KEY);
    if (!data) {
      return {
        balance: 0,
        transactions: [],
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading cash data:', error);
    return {
      balance: 0,
      transactions: [],
    };
  }
}

