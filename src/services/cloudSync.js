import { fetchWorkspace, isLoggedIn, saveWorkspace } from './authApi';
import {
  clearWorkspaceLocal,
  defaultInvestmentPlans,
  loadCashData,
  loadInvestmentPlans,
  loadPortfolio,
  loadSettings,
  loadWatchlist,
  normalizeCashData,
  normalizeInvestmentPlans,
} from './storage';

let saveTimer = null;

export function buildWorkspace({
  stocks,
  settings,
  watchlist,
  cashBalance,
  cashAccounts,
  cashTransactions,
  plans,
}) {
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

  const cash = normalizeCashData({
    balance: cashBalance || 0,
    accounts: cashAccounts || [],
    transactions: cashTransactions || [],
  });

  return {
    portfolio,
    settings: settings || { currency: 'USD', forecastYears: 5 },
    watchlist: watchlist || [],
    cash,
    plans: normalizeInvestmentPlans(plans || defaultInvestmentPlans()),
  };
}

function workspaceHasData(ws) {
  if (!ws) return false;
  const cash = normalizeCashData(ws.cash || {});
  const plans = normalizeInvestmentPlans(ws.plans || {});
  return (
    (ws.portfolio || []).length > 0 ||
    (ws.watchlist || []).length > 0 ||
    cash.balance > 0 ||
    (plans.funded || []).length > 0 ||
    (plans.customSleeves || []).some((s) => s.symbol)
  );
}

function localHasLegacyData() {
  return (
    loadPortfolio().length > 0 ||
    loadWatchlist().length > 0 ||
    (loadCashData().balance || 0) > 0 ||
    (loadInvestmentPlans().funded || []).length > 0
  );
}

/**
 * Load workspace from DB. One-time: if cloud is empty but legacy localStorage
 * has data, upload it, then always clear local workspace keys.
 */
export async function resolveWorkspaceOnLogin() {
  const cloud = await fetchWorkspace();

  if (!workspaceHasData(cloud) && localHasLegacyData()) {
    const payload = {
      portfolio: loadPortfolio(),
      settings: loadSettings(),
      watchlist: loadWatchlist(),
      cash: normalizeCashData(loadCashData()),
      plans: normalizeInvestmentPlans(loadInvestmentPlans()),
    };
    const uploaded = await saveWorkspace(payload);
    clearWorkspaceLocal();
    return uploaded;
  }

  clearWorkspaceLocal();
  return {
    portfolio: cloud?.portfolio || [],
    settings: cloud?.settings || { currency: 'USD', forecastYears: 5 },
    watchlist: cloud?.watchlist || [],
    cash: normalizeCashData(cloud?.cash || {}),
    plans: normalizeInvestmentPlans(cloud?.plans || {}),
  };
}

export async function loadUserWorkspace() {
  if (!isLoggedIn()) return null;
  return fetchWorkspace();
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
