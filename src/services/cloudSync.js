import { fetchWorkspace, isLoggedIn, saveWorkspace } from './authApi';
import {
  loadCashData,
  loadPortfolio,
  loadSettings,
  loadWatchlist,
  normalizeCashData,
  saveCashData,
  savePortfolio,
  saveSettings,
  saveWatchlist,
} from './storage';

let saveTimer = null;

export function buildWorkspace({
  stocks,
  settings,
  watchlist,
  cashBalance,
  cashAccounts,
  cashTransactions,
}) {
  // Strip heavy/live fields before saving
  const portfolio = (stocks || []).map((stock) => ({
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
  }));

  return {
    portfolio,
    settings: settings || { currency: 'USD', forecastYears: 5 },
    watchlist: watchlist || [],
    cash: {
      balance: cashBalance || 0,
      accounts: cashAccounts || [],
      transactions: cashTransactions || [],
    },
  };
}

export async function loadUserWorkspace() {
  if (!isLoggedIn()) return null;
  return fetchWorkspace();
}

/** Merge strategy on login: prefer cloud if it has portfolio; else keep local and upload. */
export async function resolveWorkspaceOnLogin() {
  const cloud = await fetchWorkspace();
  const localPortfolio = loadPortfolio();
  const cloudPortfolio = cloud?.portfolio || [];

  if (cloudPortfolio.length > 0) {
    // Prefer cloud
    savePortfolio(cloudPortfolio);
    if (cloud.settings) saveSettings(cloud.settings);
    if (cloud.watchlist) saveWatchlist(cloud.watchlist);
    if (cloud.cash) saveCashData(normalizeCashData(cloud.cash));
    return cloud;
  }

  // Upload local if present
  if (localPortfolio.length > 0 || (loadCashData().balance || 0) > 0 || loadWatchlist().length > 0) {
    const payload = {
      portfolio: localPortfolio,
      settings: loadSettings(),
      watchlist: loadWatchlist(),
      cash: normalizeCashData(loadCashData()),
    };
    return saveWorkspace(payload);
  }

  return cloud;
}

export function scheduleCloudSave(workspace, delayMs = 800) {
  if (!isLoggedIn()) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await saveWorkspace(workspace);
    } catch (err) {
      console.error('Cloud save failed:', err);
    }
  }, delayMs);
}
