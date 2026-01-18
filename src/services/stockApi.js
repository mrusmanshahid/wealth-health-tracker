// Stock API service using Yahoo Finance via cors proxy for demo
// In production, you'd want your own backend to proxy these requests

const CORS_PROXY = 'https://corsproxy.io/?';
const ALT_CORS_PROXY = 'https://api.allorigins.win/raw?url=';

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
    // Use the v6 quote endpoint which has more comprehensive data
    const quoteUrl = `${CORS_PROXY}${encodeURIComponent(
      `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${symbol}`
    )}`;
    
    const response = await fetch(quoteUrl);
    const data = await response.json();
    
    const quote = data.quoteResponse?.result?.[0];
    
    if (quote) {
      return {
        symbol: quote.symbol || symbol.toUpperCase(),
        name: quote.longName || quote.shortName || symbol,
        price: quote.regularMarketPrice || 0,
        previousClose: quote.regularMarketPreviousClose || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        currency: quote.currency || 'USD',
        // Day range
        dayHigh: quote.regularMarketDayHigh || 0,
        dayLow: quote.regularMarketDayLow || 0,
        // 52 week range
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
        // Volume
        volume: quote.regularMarketVolume || 0,
        avgVolume: quote.averageDailyVolume10Day || quote.averageDailyVolume3Month || 0,
        // Additional metrics
        marketCap: quote.marketCap || 0,
        peRatio: quote.trailingPE || quote.forwardPE || 0,
        // Extra info
        exchange: quote.exchange || '',
        quoteType: quote.quoteType || '',
      };
    }
    
    // Fallback to chart API if v6 quote fails
    const chartUrl = `${CORS_PROXY}${encodeURIComponent(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`
    )}`;
    
    const chartResponse = await fetch(chartUrl);
    const chartData = await chartResponse.json();
    
    const result = chartData.chart?.result?.[0];
    const meta = result?.meta || {};
    const quotes = result?.indicators?.quote?.[0] || {};
    
    const timestamps = result?.timestamp || [];
    const lastIndex = timestamps.length - 1;
    
    return {
      symbol: symbol.toUpperCase(),
      name: meta.longName || meta.shortName || symbol,
      price: meta.regularMarketPrice || 0,
      previousClose: meta.previousClose || meta.chartPreviousClose || 0,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
      changePercent: meta.previousClose ? 
        (((meta.regularMarketPrice || 0) - meta.previousClose) / meta.previousClose) * 100 : 0,
      currency: meta.currency || 'USD',
      dayHigh: quotes.high?.[lastIndex] || 0,
      dayLow: quotes.low?.[lastIndex] || 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
      volume: quotes.volume?.[lastIndex] || 0,
      avgVolume: meta.averageDailyVolume10Day || 0,
      marketCap: 0,
      peRatio: 0,
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
      .filter(q => ['EQUITY', 'ETF', 'MUTUALFUND'].includes(q.quoteType))
      .map(q => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchange,
        type: q.quoteType,
      }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function fetchQuarterlyEarnings(symbol) {
  try {
    // Use Yahoo Finance Insights API (works without authentication)
    const insightsUrl = `https://query1.finance.yahoo.com/ws/insights/v2/finance/insights?symbol=${symbol}`;
    
    console.log('Fetching insights for:', symbol);
    
    // Try different CORS proxies
    const proxies = [
      `${ALT_CORS_PROXY}${encodeURIComponent(insightsUrl)}`,
      `${CORS_PROXY}${encodeURIComponent(insightsUrl)}`,
    ];
    
    let data = null;
    let lastError = null;
    
    for (const proxyUrl of proxies) {
      try {
        console.log('Trying proxy:', proxyUrl.substring(0, 60) + '...');
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
          console.log('Proxy returned:', response.status);
          continue;
        }
        
        const responseData = await response.json();
        
        // Check if we got a proxy error
        if (responseData.error && !responseData.finance) {
          console.log('Proxy error:', responseData.error);
          continue;
        }
        
        // Check if we got Yahoo data
        if (responseData.finance?.result) {
          data = responseData.finance.result;
          console.log('Success with insights API!');
          break;
        }
      } catch (err) {
        console.log('Proxy failed:', err.message);
        lastError = err;
      }
    }
    
    if (!data) {
      throw lastError || new Error('Could not fetch financial data');
    }
    
    console.log('Insights data:', data);
    
    // Extract data from insights API
    const instrumentInfo = data.instrumentInfo || {};
    const companySnapshot = data.companySnapshot || {};
    const recommendation = data.recommendation || {};
    const technicals = instrumentInfo.technicalEvents || {};
    const keyTechnicals = instrumentInfo.keyTechnicals || {};
    const valuation = instrumentInfo.valuation || {};
    const company = companySnapshot.company || {};
    
    // Build metrics from available data
    const metrics = {
      // Valuation from insights
      valuation: valuation.description || 'N/A',
      discount: valuation.discount || 'N/A',
      
      // Analyst recommendation
      targetPrice: recommendation.targetPrice ? `$${recommendation.targetPrice}` : 'N/A',
      rating: recommendation.rating || 'N/A',
      provider: recommendation.provider || 'N/A',
      
      // Technical levels
      support: keyTechnicals.support ? `$${keyTechnicals.support.toFixed(2)}` : 'N/A',
      resistance: keyTechnicals.resistance ? `$${keyTechnicals.resistance.toFixed(2)}` : 'N/A',
      stopLoss: keyTechnicals.stopLoss ? `$${keyTechnicals.stopLoss.toFixed(2)}` : 'N/A',
      
      // Company scores (0-1 scale, convert to percentage)
      innovativeness: company.innovativeness ? `${(company.innovativeness * 100).toFixed(0)}%` : 'N/A',
      hiring: company.hiring ? `${(company.hiring * 100).toFixed(0)}%` : 'N/A',
      sustainability: company.sustainability ? `${(company.sustainability * 100).toFixed(0)}%` : 'N/A',
      insiderSentiment: company.insiderSentiments ? `${(company.insiderSentiments * 100).toFixed(0)}%` : 'N/A',
      earningsReports: company.earningsReports ? `${(company.earningsReports * 100).toFixed(0)}%` : 'N/A',
      dividends: company.dividends ? `${(company.dividends * 100).toFixed(0)}%` : 'N/A',
      
      // Sector
      sector: companySnapshot.sectorInfo || 'N/A',
    };

    // Technical outlook
    const shortTerm = technicals.shortTermOutlook || {};
    const midTerm = technicals.intermediateTermOutlook || {};
    const longTerm = technicals.longTermOutlook || {};
    
    const outlook = {
      shortTerm: {
        direction: shortTerm.direction || 'N/A',
        score: shortTerm.scoreDescription || 'N/A',
        description: shortTerm.stateDescription || 'N/A',
      },
      midTerm: {
        direction: midTerm.direction || 'N/A',
        score: midTerm.scoreDescription || 'N/A',
        description: midTerm.stateDescription || 'N/A',
      },
      longTerm: {
        direction: longTerm.direction || 'N/A',
        score: longTerm.scoreDescription || 'N/A',
        description: longTerm.stateDescription || 'N/A',
      },
    };

    return {
      symbol: symbol.toUpperCase(),
      metrics,
      outlook,
      recommendation: {
        targetPrice: recommendation.targetPrice,
        rating: recommendation.rating,
        provider: recommendation.provider,
      },
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching insights for ${symbol}:`, error);
    return null;
  }
}

export async function fetchTrendingStocks() {
  try {
    const url = `${ALT_CORS_PROXY}${encodeURIComponent(
      'https://query1.finance.yahoo.com/v1/finance/trending/US?count=20'
    )}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const symbols = data.finance?.result?.[0]?.quotes?.map(q => q.symbol) || [];
    
    // Filter out crypto (symbols ending in -USD or containing crypto patterns)
    const filteredSymbols = symbols.filter(s => 
      !s.includes('-USD') && 
      !s.includes('BTC') && 
      !s.includes('ETH') && 
      !s.includes('DOGE') &&
      !s.includes('SHIB') &&
      !s.includes('SOL-') &&
      !s.includes('XRP') &&
      !s.endsWith('USD') &&
      s.length <= 5
    );
    
    // Get details for each trending stock
    const stockDetails = await Promise.all(
      filteredSymbols.slice(0, 8).map(async (symbol) => {
        try {
          const quote = await fetchStockQuote(symbol);
          return quote;
        } catch (err) {
          return null;
        }
      })
    );
    
    return stockDetails.filter(s => s !== null);
  } catch (error) {
    console.error('Error fetching trending stocks:', error);
    return [];
  }
}

// Filter out crypto symbols
const isCrypto = (symbol) => 
  symbol.includes('-USD') || 
  symbol.includes('BTC') || 
  symbol.includes('ETH') || 
  symbol.includes('DOGE') ||
  symbol.includes('SHIB') ||
  symbol.includes('XRP') ||
  symbol.endsWith('USD') ||
  symbol.length > 5;

export async function fetchMarketMovers() {
  try {
    // Fetch gainers
    const gainersUrl = `${ALT_CORS_PROXY}${encodeURIComponent(
      'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=15'
    )}`;
    
    // Fetch most active
    const activeUrl = `${ALT_CORS_PROXY}${encodeURIComponent(
      'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=most_actives&count=15'
    )}`;
    
    const [gainersRes, activeRes] = await Promise.all([
      fetch(gainersUrl),
      fetch(activeUrl),
    ]);
    
    const gainersData = await gainersRes.json();
    const activeData = await activeRes.json();
    
    const gainers = (gainersData.finance?.result?.[0]?.quotes || [])
      .filter(q => !isCrypto(q.symbol) && q.quoteType === 'EQUITY')
      .slice(0, 5)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0,
        category: 'gainer',
      }));
    
    const active = (activeData.finance?.result?.[0]?.quotes || [])
      .filter(q => !isCrypto(q.symbol) && q.quoteType === 'EQUITY')
      .slice(0, 5)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0,
        category: 'active',
      }));
    
    return { gainers, active };
  } catch (error) {
    console.error('Error fetching market movers:', error);
    return { gainers: [], active: [] };
  }
}

export async function fetchSectorStocks() {
  try {
    // Define top stocks for each major sector
    const sectorLeaders = {
      'Technology': ['AAPL', 'MSFT', 'NVDA', 'GOOGL'],
      'Healthcare': ['UNH', 'JNJ', 'LLY', 'PFE'],
      'Financial': ['JPM', 'BAC', 'V', 'MA'],
      'Consumer': ['AMZN', 'TSLA', 'HD', 'MCD'],
      'Energy': ['XOM', 'CVX', 'COP', 'SLB'],
      'Industrial': ['CAT', 'BA', 'HON', 'UPS'],
    };
    
    const sectors = [];
    
    for (const [sector, symbols] of Object.entries(sectorLeaders)) {
      try {
        // Get quote for the first (top) stock in each sector
        const quote = await fetchStockQuote(symbols[0]);
        sectors.push({
          sector,
          ...quote,
          allSymbols: symbols,
        });
      } catch (err) {
        console.error(`Error fetching ${sector} leader:`, err);
      }
    }
    
    return sectors;
  } catch (error) {
    console.error('Error fetching sector stocks:', error);
    return [];
  }
}

export async function fetchUndervaluedStocks() {
  try {
    // Fetch undervalued large caps
    const url = `${ALT_CORS_PROXY}${encodeURIComponent(
      'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=undervalued_large_caps&count=10'
    )}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const stocks = (data.finance?.result?.[0]?.quotes || [])
      .filter(q => !isCrypto(q.symbol) && q.quoteType === 'EQUITY')
      .slice(0, 6)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0,
        peRatio: q.trailingPE || q.forwardPE || null,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow || 0,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || 0,
        category: 'undervalued',
      }));
    
    // Calculate discount from 52-week high
    return stocks.map(s => ({
      ...s,
      discountFromHigh: s.fiftyTwoWeekHigh > 0 
        ? ((s.fiftyTwoWeekHigh - s.price) / s.fiftyTwoWeekHigh * 100).toFixed(1)
        : 0,
    }));
  } catch (error) {
    console.error('Error fetching undervalued stocks:', error);
    return [];
  }
}

export async function fetchGrowthStocks() {
  try {
    // Fetch growth stocks
    const url = `${ALT_CORS_PROXY}${encodeURIComponent(
      'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=growth_technology_stocks&count=10'
    )}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const stocks = (data.finance?.result?.[0]?.quotes || [])
      .filter(q => !isCrypto(q.symbol) && q.quoteType === 'EQUITY')
      .slice(0, 6)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || 0,
        category: 'growth',
      }));
    
    return stocks;
  } catch (error) {
    console.error('Error fetching growth stocks:', error);
    return [];
  }
}

export async function fetchStockRecommendations(symbol) {
  try {
    const url = `${ALT_CORS_PROXY}${encodeURIComponent(
      `https://query1.finance.yahoo.com/v6/finance/recommendationsbysymbol/${symbol}`
    )}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    const recommendations = data.finance?.result?.[0]?.recommendedSymbols || [];
    
    // Get quotes for recommended stocks
    const stockDetails = await Promise.all(
      recommendations.slice(0, 5).map(async (rec) => {
        try {
          const quote = await fetchStockQuote(rec.symbol);
          return {
            ...quote,
            score: rec.score,
          };
        } catch (err) {
          return null;
        }
      })
    );
    
    return stockDetails.filter(s => s !== null);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

export async function fetchStockNews(symbols) {
  try {
    // Fetch news for multiple symbols
    const newsPromises = symbols.slice(0, 5).map(async (symbol) => {
      try {
        const url = `${CORS_PROXY}${encodeURIComponent(
          `https://query1.finance.yahoo.com/v1/finance/search?q=${symbol}&quotesCount=0&newsCount=5`
        )}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        return (data.news || []).map(article => ({
          ...article,
          relatedSymbol: symbol,
        }));
      } catch (err) {
        console.error(`News fetch error for ${symbol}:`, err);
        return [];
      }
    });
    
    const allNews = await Promise.all(newsPromises);
    const flatNews = allNews.flat();
    
    // Remove duplicates by title and sort by publish time
    const uniqueNews = [];
    const seenTitles = new Set();
    
    for (const article of flatNews) {
      if (!seenTitles.has(article.title)) {
        seenTitles.add(article.title);
        uniqueNews.push(article);
      }
    }
    
    // Sort by publish time (newest first)
    uniqueNews.sort((a, b) => (b.providerPublishTime || 0) - (a.providerPublishTime || 0));
    
    return uniqueNews.slice(0, 10);
  } catch (error) {
    console.error('News fetch error:', error);
    return [];
  }
}

