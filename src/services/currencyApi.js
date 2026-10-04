// Currency conversion — rates from FastAPI; helpers stay client-side

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
  PKR: 0.0036,
  AED: 0.272,
  USD: 1,
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  GBp: 'p',
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
  PKR: '₨',
  AED: 'د.إ ',
};

let cachedRates = { ...FALLBACK_RATES };
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/** Normalize Yahoo quirks like GBp (pence). */
export function normalizeCurrency(code) {
  if (!code) return 'USD';
  const c = String(code).trim();
  if (c === 'GBp' || c === 'GBX' || c === 'gbp' || c === 'gbx') return 'GBp';
  return c.toUpperCase();
}

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
        cachedRates = { ...FALLBACK_RATES, ...data };
        if (cachedRates.GBP && !cachedRates.GBp) {
          cachedRates.GBp = cachedRates.GBP / 100;
        }
        lastFetchTime = now;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback:', error);
  }

  return cachedRates;
}

export function getExchangeRate(fromCurrency) {
  const code = normalizeCurrency(fromCurrency);
  if (code === 'USD') return 1;
  if (code === 'GBp') {
    const gbp = cachedRates.GBP || FALLBACK_RATES.GBP;
    return gbp / 100;
  }
  return cachedRates[code] || FALLBACK_RATES[code] || 1;
}

export function convertToUSD(amount, fromCurrency) {
  if (amount == null || Number.isNaN(Number(amount))) return 0;
  const code = normalizeCurrency(fromCurrency);
  if (code === 'USD') return Number(amount);

  let value = Number(amount);
  let rateCode = code;
  if (code === 'GBp') {
    value = value / 100;
    rateCode = 'GBP';
  }

  const rate = cachedRates[rateCode] || FALLBACK_RATES[rateCode];
  if (!rate) {
    console.warn(`Unknown currency: ${fromCurrency}, using 1:1 rate`);
    return value;
  }
  return value * rate;
}

export function formatCurrency(amount, currency = 'USD') {
  const code = normalizeCurrency(currency);
  const displayCode = code === 'GBp' ? 'GBp' : code;
  const symbol = CURRENCY_SYMBOLS[displayCode] || `${displayCode} `;
  const n = Number(amount) || 0;
  return `${symbol}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatUSD(amount) {
  return formatCurrency(amount, 'USD');
}

/** Native price + USD conversion summary for UI. */
export function describeFx(amountNative, currency) {
  const code = normalizeCurrency(currency);
  const native = Number(amountNative) || 0;
  const usd = convertToUSD(native, code);
  const rate = getExchangeRate(code);
  return {
    currency: code,
    native,
    usd,
    rate,
    isNonUSD: code !== 'USD',
    nativeLabel: formatCurrency(native, code),
    usdLabel: formatUSD(usd),
    rateLabel:
      code === 'USD'
        ? null
        : code === 'GBp'
          ? `100p = £1 · 1 GBP = $${(rate * 100).toFixed(4)} USD`
          : `1 ${code} = $${Number(rate).toFixed(4)} USD`,
  };
}

// Initialize rates on load
fetchExchangeRates();
