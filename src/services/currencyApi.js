// Currency conversion service

const CORS_PROXY = 'https://corsproxy.io/?';

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES = {
  EUR: 1.08,  // 1 EUR = 1.08 USD
  GBP: 1.27,  // 1 GBP = 1.27 USD
  JPY: 0.0067, // 1 JPY = 0.0067 USD
  CHF: 1.13,  // 1 CHF = 1.13 USD
  CAD: 0.74,  // 1 CAD = 0.74 USD
  AUD: 0.65,  // 1 AUD = 0.65 USD
  INR: 0.012, // 1 INR = 0.012 USD
  CNY: 0.14,  // 1 CNY = 0.14 USD
  HKD: 0.13,  // 1 HKD = 0.13 USD
  SGD: 0.74,  // 1 SGD = 0.74 USD
  SEK: 0.095, // 1 SEK = 0.095 USD
  NOK: 0.091, // 1 NOK = 0.091 USD
  DKK: 0.145, // 1 DKK = 0.145 USD
  KRW: 0.00075, // 1 KRW = 0.00075 USD
  USD: 1,
};

let cachedRates = { ...FALLBACK_RATES };
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function fetchExchangeRates() {
  const now = Date.now();
  
  // Return cached rates if still fresh
  if (now - lastFetchTime < CACHE_DURATION && Object.keys(cachedRates).length > 1) {
    return cachedRates;
  }

  try {
    // Try to fetch live rates from a free API
    const response = await fetch(
      `${CORS_PROXY}${encodeURIComponent('https://api.exchangerate-api.com/v4/latest/USD')}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        // Convert to USD base (API gives rates as 1 USD = X currency, we need 1 X = Y USD)
        cachedRates = { USD: 1 };
        for (const [currency, rate] of Object.entries(data.rates)) {
          cachedRates[currency] = 1 / rate;
        }
        lastFetchTime = now;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback:', error);
  }

  return cachedRates;
}

export function convertToUSD(amount, fromCurrency) {
  if (!fromCurrency || fromCurrency === 'USD') return amount;
  
  const rate = cachedRates[fromCurrency] || FALLBACK_RATES[fromCurrency];
  if (!rate) {
    console.warn(`Unknown currency: ${fromCurrency}, using 1:1 rate`);
    return amount;
  }
  
  return amount * rate;
}

export function getExchangeRate(fromCurrency) {
  if (!fromCurrency || fromCurrency === 'USD') return 1;
  return cachedRates[fromCurrency] || FALLBACK_RATES[fromCurrency] || 1;
}

export function formatCurrency(amount, currency = 'USD') {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CHF: 'CHF ',
    CAD: 'C$',
    AUD: 'A$',
    INR: '₹',
    CNY: '¥',
    HKD: 'HK$',
    SGD: 'S$',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    KRW: '₩',
  };
  
  const symbol = symbols[currency] || currency + ' ';
  return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// Initialize rates on load
fetchExchangeRates();

