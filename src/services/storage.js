// Workspace helpers. App data persists via the cloud DB API when signed in.
// localStorage is only used for one-time migration of legacy data, then cleared.

const STORAGE_KEY = 'stock_wealth_tracker_portfolio';
const SETTINGS_KEY = 'stock_wealth_tracker_settings';
const WATCHLIST_KEY = 'stock_wealth_tracker_watchlist';
const CASH_KEY = 'stock_wealth_tracker_cash';
const PLANS_KEY = 'stock_wealth_tracker_plans';

const WORKSPACE_KEYS = [
  STORAGE_KEY,
  SETTINGS_KEY,
  WATCHLIST_KEY,
  CASH_KEY,
  PLANS_KEY,
];

/** Strip legacy workspace blobs from the browser (DB is source of truth). */
export function clearWorkspaceLocal() {
  try {
    WORKSPACE_KEYS.forEach((key) => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Error clearing workspace localStorage:', error);
    return false;
  }
}

/** @deprecated No-op — portfolio persists via cloud workspace API. */
export function savePortfolio() {
  return false;
}

/** Legacy local read (migration only). */
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

/** @deprecated No-op — settings persist via cloud workspace API. */
export function saveSettings() {
  return false;
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) {
      return {
        currency: 'USD',
        forecastYears: 5,
        riskTolerance: 'moderate',
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      currency: 'USD',
      forecastYears: 5,
      riskTolerance: 'moderate',
    };
  }
}

/** @deprecated No-op — watchlist persists via cloud workspace API. */
export function saveWatchlist() {
  return false;
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

/** @deprecated No-op — cash persists via cloud workspace API. */
export function saveCashData() {
  return false;
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

export function defaultInvestmentPlans() {
  return {
    countryCode: 'US',
    monthlyContribution: 0,
    selectedProfileId: 'balanced',
    customSleeves: [
      { id: 's1', kind: 'overnight', symbol: '', name: '', percent: 40 },
      { id: 's2', kind: 'ticker', symbol: '', name: '', percent: 60 },
    ],
    portfolios: [],
    funded: [],
  };
}

export function normalizeInvestmentPlans(raw = {}) {
  const defaults = defaultInvestmentPlans();
  return {
    ...defaults,
    ...raw,
    customSleeves: raw.customSleeves?.length
      ? raw.customSleeves
      : defaults.customSleeves,
    funded: raw.funded || [],
    selectedProfileId: raw.selectedProfileId || defaults.selectedProfileId,
    countryCode: raw.countryCode || defaults.countryCode,
    monthlyContribution: Number(raw.monthlyContribution) || 0,
  };
}

/** @deprecated No-op — plans persist via cloud workspace API. */
export function saveInvestmentPlans() {
  return false;
}

export function loadInvestmentPlans() {
  try {
    const data = localStorage.getItem(PLANS_KEY);
    if (!data) return defaultInvestmentPlans();
    return normalizeInvestmentPlans(JSON.parse(data));
  } catch (error) {
    console.error('Error loading investment plans:', error);
    return defaultInvestmentPlans();
  }
}
