// Local storage service for portfolio persistence

const STORAGE_KEY = 'stock_wealth_tracker_portfolio';
const SETTINGS_KEY = 'stock_wealth_tracker_settings';

export function savePortfolio(portfolio) {
  try {
    const data = {
      stocks: portfolio.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        shares: stock.shares,
        investedAmount: stock.investedAmount,
        purchasePrice: stock.purchasePrice,
        purchaseDate: stock.purchaseDate,
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
        monthlyContribution: 0,
        currency: 'USD',
        forecastYears: 5,
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      monthlyContribution: 0,
      currency: 'USD',
      forecastYears: 5,
    };
  }
}

