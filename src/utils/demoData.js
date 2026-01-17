// Demo data for testing when API is unavailable

export const demoStocks = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    investedAmount: 10000,
    purchasePrice: 150.00,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    investedAmount: 8000,
    purchasePrice: 300.00,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    investedAmount: 5000,
    purchasePrice: 140.00,
  },
];

// Generate realistic demo historical data
function generateHistoricalData(symbol, years = 10, basePrice = 100, annualGrowth = 0.12, volatility = 0.03) {
  const history = [];
  const months = years * 12;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  let price = basePrice;
  const monthlyGrowth = annualGrowth / 12;
  
  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    // Add some realistic randomness
    const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
    const trendFactor = 1 + monthlyGrowth;
    
    // Occasional market dips
    const dipFactor = Math.random() < 0.05 ? 0.92 : 1;
    
    price = price * trendFactor * randomFactor * dipFactor;
    price = Math.max(price, basePrice * 0.3); // Floor price
    
    history.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      price: Math.round(price * 100) / 100,
    });
  }
  
  return history;
}

export function generateDemoPortfolio() {
  const stockConfigs = {
    AAPL: { basePrice: 45, annualGrowth: 0.25, volatility: 0.04, currentMultiplier: 4.2 },
    MSFT: { basePrice: 85, annualGrowth: 0.22, volatility: 0.035, currentMultiplier: 4.5 },
    GOOGL: { basePrice: 60, annualGrowth: 0.18, volatility: 0.045, currentMultiplier: 2.8 },
    NVDA: { basePrice: 15, annualGrowth: 0.45, volatility: 0.08, currentMultiplier: 9.0 },
    AMZN: { basePrice: 85, annualGrowth: 0.20, volatility: 0.05, currentMultiplier: 2.2 },
    TSLA: { basePrice: 30, annualGrowth: 0.35, volatility: 0.10, currentMultiplier: 8.3 },
  };

  return demoStocks.map(stock => {
    const config = stockConfigs[stock.symbol] || { 
      basePrice: 100, 
      annualGrowth: 0.12, 
      volatility: 0.04,
      currentMultiplier: 2.0 
    };
    
    const history = generateHistoricalData(
      stock.symbol,
      10,
      config.basePrice,
      config.annualGrowth,
      config.volatility
    );
    
    const currentPrice = history[history.length - 1].price;
    
    return {
      ...stock,
      purchasePrice: currentPrice * 0.7, // Assume bought at 30% lower
      currentPrice,
      history,
    };
  });
}

