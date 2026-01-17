// Stock API service using Yahoo Finance via cors proxy for demo
// In production, you'd want your own backend to proxy these requests

const CORS_PROXY = 'https://corsproxy.io/?';

export async function fetchStockHistory(symbol, years = 10) {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (years * 365 * 24 * 60 * 60);
  
  try {
    // Try Yahoo Finance API
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1mo&includePrePost=false`
    )}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
    
    const data = await response.json();
    
    if (data.chart?.error) {
      throw new Error(data.chart.error.description || `Invalid symbol: ${symbol}`);
    }
    
    const result = data.chart?.result?.[0];
    if (!result) {
      throw new Error(`No data found for ${symbol}`);
    }
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quotes.close || [];
    
    const meta = result.meta || {};
    
    // Build historical data array
    const history = timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      timestamp: timestamp * 1000,
      price: adjClose[index] || quotes.close?.[index] || 0,
      open: quotes.open?.[index] || 0,
      high: quotes.high?.[index] || 0,
      low: quotes.low?.[index] || 0,
      volume: quotes.volume?.[index] || 0,
    })).filter(item => item.price > 0);
    
    return {
      symbol: symbol.toUpperCase(),
      name: meta.longName || meta.shortName || symbol.toUpperCase(),
      currency: meta.currency || 'USD',
      currentPrice: meta.regularMarketPrice || adjClose[adjClose.length - 1] || 0,
      history,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    throw error;
  }
}

export async function fetchStockQuote(symbol) {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`
    )}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const result = data.chart?.result?.[0];
    const meta = result?.meta || {};
    
    return {
      symbol: symbol.toUpperCase(),
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice || 0,
      previousClose: meta.previousClose || 0,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
      changePercent: meta.previousClose ? 
        (((meta.regularMarketPrice || 0) - meta.previousClose) / meta.previousClose) * 100 : 0,
      currency: meta.currency || 'USD',
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
}

export async function searchStocks(query) {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10&newsCount=0`
    )}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return (data.quotes || [])
      .filter(q => q.quoteType === 'EQUITY')
      .map(q => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchange,
      }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

