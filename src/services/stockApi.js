// Stock API client — calls the FastAPI backend (no CORS proxies)

async function apiGet(path) {
  const response = await fetch(path);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }
  return response.json();
}

export async function fetchStockHistory(symbol, years = 10) {
  return apiGet(`/api/stocks/history/${encodeURIComponent(symbol)}?years=${years}`);
}

export async function fetchStockQuote(symbol) {
  return apiGet(`/api/stocks/quote/${encodeURIComponent(symbol)}`);
}

export async function searchStocks(query) {
  try {
    return await apiGet(`/api/stocks/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function fetchQuarterlyEarnings(symbol) {
  try {
    return await apiGet(`/api/stocks/insights/${encodeURIComponent(symbol)}`);
  } catch (error) {
    console.error(`Error fetching insights for ${symbol}:`, error);
    return null;
  }
}

export async function fetchTrendingStocks() {
  try {
    return await apiGet('/api/stocks/trending');
  } catch (error) {
    console.error('Error fetching trending stocks:', error);
    return [];
  }
}

export async function fetchMarketMovers() {
  try {
    return await apiGet('/api/stocks/movers');
  } catch (error) {
    console.error('Error fetching market movers:', error);
    return { gainers: [], active: [] };
  }
}

export async function fetchSectorStocks() {
  try {
    return await apiGet('/api/stocks/sectors');
  } catch (error) {
    console.error('Error fetching sector stocks:', error);
    return [];
  }
}

export async function fetchUndervaluedStocks() {
  try {
    return await apiGet('/api/stocks/undervalued');
  } catch (error) {
    console.error('Error fetching undervalued stocks:', error);
    return [];
  }
}

export async function fetchGrowthStocks() {
  try {
    return await apiGet('/api/stocks/growth');
  } catch (error) {
    console.error('Error fetching growth stocks:', error);
    return [];
  }
}

export async function fetchStockRecommendations(symbol) {
  try {
    return await apiGet(`/api/stocks/recommendations/${encodeURIComponent(symbol)}`);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

export async function fetchStockNews(symbols) {
  try {
    const joined = symbols.slice(0, 5).join(',');
    return await apiGet(`/api/stocks/news?symbols=${encodeURIComponent(joined)}`);
  } catch (error) {
    console.error('News fetch error:', error);
    return [];
  }
}

export async function fetchSingleStockNews(symbol, count = 5) {
  try {
    return await apiGet(
      `/api/stocks/news/${encodeURIComponent(symbol)}?count=${count}`
    );
  } catch (err) {
    console.error(`News fetch error for ${symbol}:`, err);
    return [];
  }
}

export async function fetchHighPerformingEtfs() {
  try {
    return await apiGet('/api/stocks/etfs/high-performing');
  } catch (error) {
    console.error('Error fetching high-performing ETFs:', error);
    return [];
  }
}

export async function fetchProjectorProfiles() {
  try {
    return await apiGet('/api/projector/profiles');
  } catch (error) {
    console.error('Error fetching projector profiles:', error);
    return [];
  }
}

export async function fetchProjectorCountries() {
  try {
    return await apiGet('/api/projector/countries');
  } catch (error) {
    console.error('Error fetching projector countries:', error);
    return [];
  }
}

export async function projectWealth(capital, profile = 'balanced', country = 'US') {
  const response = await fetch('/api/projector/project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      capital: Number(capital),
      profile,
      country,
    }),
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return response.json();
}
