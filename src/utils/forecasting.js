// Forecasting utilities using various methods

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
 * Simple moving average forecast
 */
export function movingAverageForecast(history, periods = 12) {
  if (history.length < periods) {
    return history[history.length - 1]?.price || 0;
  }
  
  const recentPrices = history.slice(-periods).map(h => h.price);
  return recentPrices.reduce((a, b) => a + b, 0) / periods;
}

/**
 * Exponential smoothing forecast
 */
export function exponentialSmoothing(history, alpha = 0.3) {
  if (history.length === 0) return 0;
  
  let forecast = history[0].price;
  for (let i = 1; i < history.length; i++) {
    forecast = alpha * history[i].price + (1 - alpha) * forecast;
  }
  return forecast;
}

/**
 * Linear regression trend line
 */
export function linearRegression(history) {
  const n = history.length;
  if (n < 2) return { slope: 0, intercept: history[0]?.price || 0 };
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += history[i].price;
    sumXY += i * history[i].price;
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Generate forecast for future periods using multiple methods and averaging
 */
export function generateForecast(history, forecastMonths = 60) {
  if (!history || history.length < 12) {
    return { forecast: [], confidence: { low: [], high: [] } };
  }
  
  const { avgReturn, volatility } = calculateMonthlyStats(history);
  const { slope, intercept } = linearRegression(history);
  const n = history.length;
  
  const lastPrice = history[history.length - 1].price;
  const lastDate = new Date(history[history.length - 1].date);
  
  const forecast = [];
  const confidence = { low: [], high: [] };
  
  // Use geometric brownian motion with trend adjustment
  let currentPrice = lastPrice;
  
  for (let i = 1; i <= forecastMonths; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i);
    
    // Method 1: CAGR-based projection
    const cagrProjection = lastPrice * Math.pow(1 + avgReturn, i);
    
    // Method 2: Linear regression projection
    const linearProjection = Math.max(0, intercept + slope * (n + i - 1));
    
    // Method 3: Momentum-adjusted projection
    // Give more weight to recent performance
    const recentMonths = Math.min(24, history.length);
    const recentHistory = history.slice(-recentMonths);
    const { avgReturn: recentReturn } = calculateMonthlyStats(recentHistory);
    const momentumProjection = lastPrice * Math.pow(1 + recentReturn, i);
    
    // Weighted average of methods (favor CAGR and momentum)
    const weightedForecast = (cagrProjection * 0.4 + linearProjection * 0.2 + momentumProjection * 0.4);
    
    // Confidence intervals widen over time
    const confidenceMultiplier = 1 + (volatility * Math.sqrt(i) * 1.96);
    const lowBound = weightedForecast / confidenceMultiplier;
    const highBound = weightedForecast * confidenceMultiplier;
    
    forecast.push({
      date: futureDate.toISOString().split('T')[0],
      timestamp: futureDate.getTime(),
      price: Math.max(0, weightedForecast),
      isForecast: true,
    });
    
    confidence.low.push({
      date: futureDate.toISOString().split('T')[0],
      price: Math.max(0, lowBound),
    });
    
    confidence.high.push({
      date: futureDate.toISOString().split('T')[0],
      price: highBound,
    });
  }
  
  return { forecast, confidence };
}

/**
 * Calculate portfolio wealth over time with contributions
 */
export function calculateWealthGrowth(stocks, monthlyContribution = 0, years = 5) {
  if (stocks.length === 0) return [];
  
  const months = years * 12;
  const wealth = [];
  
  // Get the earliest common start date
  let startTimestamp = 0;
  stocks.forEach(stock => {
    if (stock.history && stock.history.length > 0) {
      const firstDate = new Date(stock.history[0].date).getTime();
      if (firstDate > startTimestamp) {
        startTimestamp = firstDate;
      }
    }
  });
  
  // Build monthly wealth trajectory
  const today = new Date();
  const allData = [];
  
  // Combine historical data
  const monthlyData = new Map();
  
  stocks.forEach(stock => {
    if (!stock.history) return;
    
    const shares = stock.investedAmount / (stock.purchasePrice || stock.history[0]?.price || 1);
    
    stock.history.forEach(h => {
      const monthKey = h.date.substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(monthKey) || { date: h.date, historical: 0 };
      existing.historical += shares * h.price;
      monthlyData.set(monthKey, existing);
    });
    
    // Add forecast data
    if (stock.forecast) {
      stock.forecast.forEach(f => {
        const monthKey = f.date.substring(0, 7);
        const existing = monthlyData.get(monthKey) || { date: f.date, forecast: 0 };
        existing.forecast = (existing.forecast || 0) + shares * f.price;
        existing.isForecast = true;
        monthlyData.set(monthKey, existing);
      });
    }
  });
  
  // Sort and add contributions
  const sortedData = Array.from(monthlyData.values()).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  let totalContributions = stocks.reduce((sum, s) => sum + (s.investedAmount || 0), 0);
  const todayStr = today.toISOString().split('T')[0];
  
  return sortedData.map((d, index) => {
    const isPast = d.date <= todayStr;
    
    // Add monthly contribution for forecast period
    if (!isPast && monthlyContribution > 0) {
      totalContributions += monthlyContribution;
    }
    
    return {
      date: d.date,
      value: d.historical || d.forecast || 0,
      contributions: totalContributions,
      isForecast: !isPast,
    };
  });
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(stocks) {
  if (stocks.length === 0) {
    return {
      totalInvested: 0,
      currentValue: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      projectedValue5Y: 0,
      projectedReturn5Y: 0,
    };
  }
  
  let totalInvested = 0;
  let currentValue = 0;
  let projectedValue5Y = 0;
  
  stocks.forEach(stock => {
    // Support both shares-based and amount-based entries
    const shares = stock.shares || (stock.investedAmount / (stock.purchasePrice || stock.currentPrice || 1));
    const invested = stock.investedAmount || (shares * stock.purchasePrice);
    
    totalInvested += invested;
    currentValue += shares * (stock.currentPrice || stock.purchasePrice || 0);
    
    if (stock.forecast && stock.forecast.length > 0) {
      const lastForecast = stock.forecast[stock.forecast.length - 1];
      projectedValue5Y += shares * (lastForecast?.price || stock.currentPrice || 0);
    } else {
      projectedValue5Y += shares * (stock.currentPrice || 0);
    }
  });
  
  const totalReturn = currentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const projectedReturn5Y = projectedValue5Y - totalInvested;
  const projectedReturnPercent5Y = totalInvested > 0 ? (projectedReturn5Y / totalInvested) * 100 : 0;
  
  return {
    totalInvested,
    currentValue,
    totalReturn,
    totalReturnPercent,
    projectedValue5Y,
    projectedReturn5Y,
    projectedReturnPercent5Y,
  };
}

