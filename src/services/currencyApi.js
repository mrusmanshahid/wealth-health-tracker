// Currency conversion — rates loaded from FastAPI, helpers stay client-side

const FALLBACK_RATES = {
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  CHF: 1.13,
  CAD: 0.74,
  AUD: 0.65,
  INR: 0.012,
  CNY: 0.14,
  HKD: 0.13,
  SGD: 0.74,
  SEK: 0.095,
  NOK: 0.091,
  DKK: 0.145,
  KRW: 0.00075,
  USD: 1,
};

let cachedRates = { ...FALLBACK_RATES };
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function fetchExchangeRates() {
  const now = Date.now();

  if (now - lastFetchTime < CACHE_DURATION && Object.keys(cachedRates).length > 1) {
    return cachedRates;
  }

  try {
    const response = await fetch('/api/currency/rates');
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data === 'object') {
        cachedRates = data;
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
