// Portfolio metrics + analyst-target projections (Yahoo consensus)

/**
 * Calculate Compound Annual Growth Rate (CAGR)
 */
export function calculateCAGR(startValue, endValue, years) {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

/**
 * Calculate average monthly return and volatility
 */
export function calculateMonthlyStats(history) {
  if (history.length < 2) {
    return { avgReturn: 0, volatility: 0 };
  }

  const returns = [];
  for (let i = 1; i < history.length; i++) {
    if (history[i - 1].price > 0) {
      const monthlyReturn = (history[i].price - history[i - 1].price) / history[i - 1].price;
      returns.push(monthlyReturn);
    }
  }

  if (returns.length === 0) {
    return { avgReturn: 0, volatility: 0 };
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  return { avgReturn, volatility, returns };
}

/**
 * Normalize analyst payload and compute upside vs current price (USD).
 */
export function normalizeAnalyst(analyst, currentPriceUSD) {
  if (!analyst) {
    return {
      coverage: false,
      sentiment: 'unknown',
      rating: null,
      targetMean: null,
      targetHigh: null,
      targetLow: null,
      targetMedian: null,
      analystCount: null,
      upsidePercent: null,
      breakdown: null,
      horizon: '12M',
    };
  }

  const price = currentPriceUSD || analyst.currentPrice || 0;
  const targetMean = analyst.targetMean ?? null;
  const upsidePercent =
    targetMean != null && price > 0
      ? ((targetMean - price) / price) * 100
      : analyst.upsidePercent ?? null;

  return {
    ...analyst,
    coverage: Boolean(
      analyst.coverage ||
        targetMean ||
        analyst.rating ||
        (analyst.breakdown && Object.values(analyst.breakdown).some((n) => n > 0))
    ),
    targetMean,
    upsidePercent: upsidePercent != null ? Number(upsidePercent.toFixed(2)) : null,
    currentPrice: price || analyst.currentPrice || null,
  };
}

/**
 * Build a 12-month path from current price → analyst mean target.
 * Low/high bands use targetLow / targetHigh when available.
 */
export function generateAnalystProjection(currentPrice, analyst, months = 12) {
  const normalized = normalizeAnalyst(analyst, currentPrice);
  if (!currentPrice || !normalized.targetMean) {
    return { forecast: [], confidence: { low: [], high: [] }, analyst: normalized };
  }

  const lastDate = new Date();
  const forecast = [];
  const confidence = { low: [], high: [] };
  const mean = normalized.targetMean;
  const low = normalized.targetLow ?? mean * 0.9;
  const high = normalized.targetHigh ?? mean * 1.1;

  for (let i = 1; i <= months; i++) {
    const t = i / months;
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i);
    const date = futureDate.toISOString().split('T')[0];

    const price = currentPrice + (mean - currentPrice) * t;
    const lowPrice = currentPrice + (low - currentPrice) * t;
    const highPrice = currentPrice + (high - currentPrice) * t;

    forecast.push({
      date,
      timestamp: futureDate.getTime(),
      price: Math.max(0, price),
      isForecast: true,
      source: 'analyst',
    });
    confidence.low.push({ date, price: Math.max(0, lowPrice) });
    confidence.high.push({ date, price: Math.max(0, highPrice) });
  }

  return { forecast, confidence, analyst: normalized };
}

/**
 * Historical portfolio wealth only (analyst forward path is drawn in WealthChart).
 */
export function calculateWealthGrowth(stocks) {
  if (stocks.length === 0) return [];

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonthKey = todayStr.substring(0, 7);
  const monthlyData = new Map();
  let currentPortfolioValue = 0;

  stocks.forEach((stock) => {
    if (!stock.history) return;

    const shares =
      stock.shares || stock.investedAmount / (stock.purchasePrice || stock.history[0]?.price || 1);
    const stockCurrentPrice =
      stock.currentPrice || stock.history[stock.history.length - 1]?.price || 0;
    currentPortfolioValue += shares * stockCurrentPrice;

    stock.history.forEach((h) => {
      const monthKey = h.date.substring(0, 7);
      const existing = monthlyData.get(monthKey) || { date: h.date, historical: 0 };
      existing.historical += shares * h.price;
      monthlyData.set(monthKey, existing);
    });
  });

  const currentMonthData = monthlyData.get(currentMonthKey) || { date: todayStr, historical: 0 };
  currentMonthData.date = todayStr;
  currentMonthData.historical = currentPortfolioValue;
  monthlyData.set(currentMonthKey, currentMonthData);

  const sortedData = Array.from(monthlyData.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const totalContributions = stocks.reduce((sum, s) => sum + (s.investedAmount || 0), 0);

  return sortedData.map((d) => ({
    date: d.date,
    value: d.historical || 0,
    contributions: totalContributions,
    isForecast: false,
  }));
}

/**
 * Portfolio metrics using analyst mean targets for forward value.
 */
export function calculatePortfolioMetrics(stocks) {
  if (stocks.length === 0) {
    return {
      totalInvested: 0,
      currentValue: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      analystTargetValue: 0,
      analystUpsidePercent: 0,
      analystUpsideValue: 0,
      coveredCount: 0,
      // legacy aliases used by older UI bits
      projectedValue5Y: 0,
      projectedReturn5Y: 0,
      projectedReturnPercent5Y: 0,
    };
  }

  let totalInvested = 0;
  let currentValue = 0;
  let analystTargetValue = 0;
  let coveredCount = 0;

  stocks.forEach((stock) => {
    const shares =
      stock.shares || stock.investedAmount / (stock.purchasePrice || stock.currentPrice || 1);
    const invested = stock.investedAmount || shares * stock.purchasePrice;
    const price = stock.currentPrice || stock.purchasePrice || 0;
    const analyst = normalizeAnalyst(stock.analyst, price);

    totalInvested += invested;
    currentValue += shares * price;

    if (analyst.targetMean) {
      analystTargetValue += shares * analyst.targetMean;
      coveredCount += 1;
    } else {
      analystTargetValue += shares * price;
    }
  });

  const totalReturn = currentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const analystUpsideValue = analystTargetValue - currentValue;
  const analystUpsidePercent = currentValue > 0 ? (analystUpsideValue / currentValue) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    totalReturn,
    totalReturnPercent,
    analystTargetValue,
    analystUpsidePercent,
    analystUpsideValue,
    coveredCount,
    projectedValue5Y: analystTargetValue,
    projectedReturn5Y: analystTargetValue - totalInvested,
    projectedReturnPercent5Y:
      totalInvested > 0 ? ((analystTargetValue - totalInvested) / totalInvested) * 100 : 0,
  };
}

/** @deprecated kept for any leftover imports — prefer generateAnalystProjection */
export function generateForecast(history, forecastMonths = 12) {
  if (!history || history.length < 2) {
    return { forecast: [], confidence: { low: [], high: [] } };
  }
  const last = history[history.length - 1];
  return generateAnalystProjection(last.price, { targetMean: last.price, coverage: false }, forecastMonths);
}
