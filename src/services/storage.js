// Local storage service for portfolio persistence

const STORAGE_KEY = 'stock_wealth_tracker_portfolio';
const SETTINGS_KEY = 'stock_wealth_tracker_settings';
const WATCHLIST_KEY = 'stock_wealth_tracker_watchlist';
const CASH_KEY = 'stock_wealth_tracker_cash';
const PLANS_KEY = 'stock_wealth_tracker_plans';

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

function cashAccountId() {
  return `bank_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Normalize legacy { balance, transactions } into multi-bank accounts. */
export function normalizeCashData(raw = {}) {
  const transactions = Array.isArray(raw.transactions) ? raw.transactions : [];
  let accounts = Array.isArray(raw.accounts) ? raw.accounts.filter((a) => a && a.id) : [];

  if (accounts.length === 0) {
    const legacyBalance = Number(raw.balance) || 0;
    const defaultId = 'bank_main';
    accounts = [
      {
        id: defaultId,
        name: 'Main account',
        balance: legacyBalance,
      },
    ];
    // Attach legacy txs to the default bank when missing accountId
    for (const tx of transactions) {
      if (!tx.accountId) tx.accountId = defaultId;
    }
  }

  accounts = accounts.map((a) => ({
    id: a.id,
    name: (a.name || 'Account').trim() || 'Account',
    balance: Math.max(0, Number(a.balance) || 0),
  }));

  const balance = accounts.reduce((s, a) => s + a.balance, 0);
  return { accounts, transactions, balance };
}

export function createCashAccount(name = 'New bank') {
  return {
    id: cashAccountId(),
    name: (name || 'New bank').trim() || 'New bank',
    balance: 0,
  };
}

export function saveCashData(cashData) {
  try {
    const normalized = normalizeCashData(cashData);
    localStorage.setItem(
      CASH_KEY,
      JSON.stringify({
        ...normalized,
        lastUpdated: new Date().toISOString(),
      })
    );
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
      return normalizeCashData({ balance: 0, transactions: [], accounts: [] });
    }
    return normalizeCashData(JSON.parse(data));
  } catch (error) {
    console.error('Error loading cash data:', error);
    return normalizeCashData({ balance: 0, transactions: [], accounts: [] });
  }
}

/** Multi-portfolio investment plans (Project tab) */
export function defaultInvestmentPlans() {
  return {
    countryCode: 'US',
    monthlyContribution: 0,
    selectedProfileId: 'balanced',
    customSleeves: [
      { id: 's1', kind: 'overnight', symbol: '', name: '', percent: 40 },
      { id: 's2', kind: 'ticker', symbol: '', name: '', percent: 60 },
    ],
    // legacy field kept empty — old multi-profile portfolios ignored in new UX
    portfolios: [],
    funded: [],
  };
}

export function saveInvestmentPlans(plans) {
  try {
    localStorage.setItem(
      PLANS_KEY,
      JSON.stringify({ ...plans, lastUpdated: new Date().toISOString() })
    );
    return true;
  } catch (error) {
    console.error('Error saving investment plans:', error);
    return false;
  }
}

export function loadInvestmentPlans() {
  try {
    const data = localStorage.getItem(PLANS_KEY);
    if (!data) return defaultInvestmentPlans();
    const parsed = JSON.parse(data);
    const defaults = defaultInvestmentPlans();
    return {
      ...defaults,
      ...parsed,
      customSleeves: parsed.customSleeves?.length
        ? parsed.customSleeves
        : defaults.customSleeves,
      funded: parsed.funded || [],
      selectedProfileId: parsed.selectedProfileId || defaults.selectedProfileId,
    };
  } catch (error) {
    console.error('Error loading investment plans:', error);
    return defaultInvestmentPlans();
  }
}

