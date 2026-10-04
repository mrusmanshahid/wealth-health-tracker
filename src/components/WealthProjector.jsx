import { useEffect, useState } from 'react';
import {
  Calculator,
  Globe2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  fetchProjectorCountries,
  fetchProjectorProfiles,
  fetchStockQuote,
  projectWealth,
  searchStocks,
} from '../services/stockApi';
import { convertToUSD, fetchExchangeRates } from '../services/currencyApi';
import { defaultInvestmentPlans } from '../services/storage';

function formatMoney(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${Number(n).toFixed(digits)}%`;
}

function uid(prefix = 's') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function pctTotal(items, key = 'percent') {
  return items.reduce((s, i) => s + (Number(i[key]) || 0), 0);
}

function riskDots(level) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Risk ${level} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? 'bg-emerald-bright' : 'bg-slate-light/30'
          }`}
        />
      ))}
    </span>
  );
}

function incomeLabel(row) {
  const type = row.incomeType;
  const yld = row.expectedYieldPercent;
  if (type === 'interest') return `${yld ?? 0}% · interest`;
  if (type === 'accumulating') return 'Accumulating · no cash dividend';
  if (type === 'none' || !(yld > 0)) return 'No cash yield';
  return `${yld}% · dividend`;
}

function HoldingList({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="rounded-xl border border-slate-light/20 overflow-hidden">
      <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-steel bg-slate-dark/60 border-b border-slate-light/10">
        <div className="col-span-4">Buy</div>
        <div className="col-span-2 text-right">Amount (USD)</div>
        <div className="col-span-1 text-right">Mix</div>
        <div className="col-span-3 text-right">Est. income</div>
        <div className="col-span-2 text-right">Brokers</div>
      </div>
      <div className="divide-y divide-slate-light/10">
        {rows.map((row) => {
          const currency = row.currency || 'USD';
          const priceUsd = row.priceUSD ?? row.price;
          const priceNative = row.priceNative;
          const showFx = currency !== 'USD' && priceNative > 0;
          return (
            <div
              key={`${row.kind}-${row.symbol}-${row.role || row.percent}`}
              className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-3 py-2.5 bg-slate-dark/40"
            >
              <div className="sm:col-span-4 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-pearl text-sm">{row.symbol}</span>
                  <span className="text-[10px] text-steel uppercase tracking-wide">
                    {row.kind === 'savings' || row.kind === 'overnight'
                      ? 'Overnight'
                      : row.kind}
                  </span>
                  {currency !== 'USD' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/15 text-amber-bright">
                      {currency}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-steel truncate">{row.name}</p>
                {row.role && (
                  <p className="text-[10px] text-silver truncate">{row.role}</p>
                )}
              </div>
              <div className="sm:col-span-2 sm:text-right">
                <p className="font-mono text-pearl text-sm">{formatMoney(row.amount)}</p>
                {priceUsd > 0 && (
                  <p className="text-[10px] text-steel">
                    {showFx ? (
                      <>
                        {Number(priceNative).toFixed(2)} {currency}
                        {' → '}${Number(priceUsd).toFixed(2)}
                      </>
                    ) : (
                      <>${Number(priceUsd).toFixed(2)}</>
                    )}
                    {row.shares != null ? ` · ~${Number(row.shares).toFixed(2)} sh` : ''}
                  </p>
                )}
                {showFx && row.exchangeRate > 0 && (
                  <p className="text-[10px] text-amber-bright">
                    1 {currency} = ${Number(row.exchangeRate).toFixed(4)}
                  </p>
                )}
              </div>
              <div className="sm:col-span-1 sm:text-right font-mono text-sm text-silver">
                {row.percent}%
              </div>
              <div className="sm:col-span-3 sm:text-right">
                <p className="font-mono text-sm text-emerald-bright">
                  {formatMoney(row.expectedAnnualIncome || 0)}
                </p>
                <p className="text-[10px] text-steel">{incomeLabel(row)}</p>
              </div>
              <div className="sm:col-span-2 sm:text-right text-[10px] text-silver">
                {row.access?.brokers?.length > 0
                  ? row.access.brokers.map((b) => b.name).join(', ')
                  : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WealthProjector({
  cashBalance = 0,
  onAllocateCash,
  plans: plansProp,
  onPlansChange,
}) {
  const [tab, setTab] = useState('suggested'); // suggested | custom | dashboard
  const [profiles, setProfiles] = useState([]);
  const [countries, setCountries] = useState([]);
  const plans = plansProp || defaultInvestmentPlans();
  const [cashInput, setCashInput] = useState(String(cashBalance || 10000));
  const [suggestedResult, setSuggestedResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [funding, setFunding] = useState(false);
  const [dashBusy, setDashBusy] = useState(false);
  const [dashRows, setDashRows] = useState([]);
  const [error, setError] = useState(null);
  const [searchFor, setSearchFor] = useState(null); // sleeve id
  const [searchQ, setSearchQ] = useState('');
  const [searchHits, setSearchHits] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);

  useEffect(() => {
    if (cashBalance > 0) setCashInput(String(Math.round(cashBalance)));
  }, [cashBalance]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [profileData, countryData] = await Promise.all([
        fetchProjectorProfiles(),
        fetchProjectorCountries(),
      ]);
      if (!cancelled) {
        setProfiles(profileData || []);
        setCountries(countryData || []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cash = Number(String(cashInput).replace(/,/g, '')) || 0;
  const monthly = Number(plans.monthlyContribution) || 0;
  const country = countries.find((c) => c.code === plans.countryCode);
  const overnight = country?.overnight || {
    symbol: 'HYSA',
    name: country?.savingsNote || 'Overnight savings',
  };
  const selectedProfile =
    profiles.find((p) => p.id === plans.selectedProfileId) || profiles[0];

  const customTotal = pctTotal(plans.customSleeves || []);

  const patchPlans = (patch) => {
    if (typeof onPlansChange !== 'function') return;
    onPlansChange((prev) => ({
      ...(prev || defaultInvestmentPlans()),
      ...patch,
    }));
  };

  const updateSleeve = (id, patch) => {
    patchPlans({
      customSleeves: (plans.customSleeves || []).map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  const addSleeve = (kind = 'ticker') => {
    patchPlans({
      customSleeves: [
        ...(plans.customSleeves || []),
        {
          id: uid(),
          kind,
          symbol: kind === 'overnight' ? overnight.symbol : '',
          name: kind === 'overnight' ? overnight.name : '',
          percent: 0,
        },
      ],
    });
  };

  const removeSleeve = (id) => {
    const next = (plans.customSleeves || []).filter((s) => s.id !== id);
    if (next.length === 0) return;
    patchPlans({ customSleeves: next });
  };

  const normalizeCustom = () => {
    const sleeves = plans.customSleeves || [];
    const total = pctTotal(sleeves);
    if (total <= 0) return sleeves;
    return sleeves.map((s) => ({
      ...s,
      percent: Math.round(((Number(s.percent) || 0) / total) * 1000) / 10,
    }));
  };

  // --- Suggested country plan ---
  const buildSuggested = async () => {
    if (cash <= 0) {
      setError('Enter how much cash you want to invest');
      return;
    }
    if (!plans.selectedProfileId && !selectedProfile) {
      setError('Pick a risk profile');
      return;
    }
    setError(null);
    setBusy(true);
    setSuggestedResult(null);
    try {
      const data = await projectWealth(
        cash,
        plans.selectedProfileId || selectedProfile.id,
        plans.countryCode
      );
      setSuggestedResult(data);
    } catch (err) {
      setError(err.message || 'Could not build plan');
    }
    setBusy(false);
  };

  const fundSuggested = async () => {
    if (!suggestedResult) return;
    setFunding(true);
    setError(null);
    try {
      const fundedAt = new Date().toISOString();
      const holdings = (suggestedResult.allocationPlan || []).map((row) => {
        const priceUsd = row.priceUSD ?? row.price ?? 0;
        return {
          symbol: row.symbol,
          name: row.name,
          kind: row.kind === 'savings' ? 'overnight' : row.kind,
          weightPercent: row.percent,
          amount: row.amount,
          currency: row.currency || 'USD',
          exchangeRate: row.exchangeRate || 1,
          priceNative: row.priceNative,
          shares: row.shares || (priceUsd > 0 ? row.amount / priceUsd : 0),
          purchasePrice: priceUsd,
        };
      });
      const snapshot = {
        id: uid('fund'),
        source: 'suggested',
        name: `${suggestedResult.profile?.name || 'Plan'} · ${country?.name || plans.countryCode}`,
        profileId: suggestedResult.profile?.id,
        countryCode: plans.countryCode,
        investedAmount: cash,
        monthlyShare: monthly,
        fundedAt,
        holdings,
      };
      patchPlans({ funded: [snapshot, ...(plans.funded || [])].slice(0, 30) });
      if (typeof onAllocateCash === 'function' && cash > 0) {
        onAllocateCash(cash, `Funded suggested plan: ${snapshot.name}`);
      }
      setTab('dashboard');
    } catch (err) {
      setError(err.message || 'Could not fund plan');
    }
    setFunding(false);
  };

  // --- Custom plan ---
  const runSearch = async (q) => {
    setSearchQ(q);
    if (!q || q.length < 1) {
      setSearchHits([]);
      return;
    }
    setSearchBusy(true);
    const hits = await searchStocks(q);
    setSearchHits((hits || []).slice(0, 8));
    setSearchBusy(false);
  };

  const fundCustom = async () => {
    const sleeves = normalizeCustom();
    if (cash <= 0) {
      setError('Enter how much cash you want to invest');
      return;
    }
    if (Math.abs(pctTotal(sleeves) - 100) > 0.6) {
      setError('Allocation must total 100%. Use Normalize or adjust percentages.');
      return;
    }
    for (const s of sleeves) {
      if (s.kind === 'ticker' && !s.symbol?.trim()) {
        setError('Every stock/ETF line needs a symbol');
        return;
      }
    }

    setFunding(true);
    setError(null);
    try {
      const holdings = [];
      for (const s of sleeves) {
        const amount = (cash * (Number(s.percent) || 0)) / 100;
        if (s.kind === 'overnight') {
          holdings.push({
            symbol: overnight.symbol || s.symbol || 'Cash',
            name: overnight.name || s.name || 'Overnight account',
            kind: 'overnight',
            weightPercent: s.percent,
            amount,
            shares: 0,
            purchasePrice: 0,
          });
          continue;
        }
        const symbol = s.symbol.trim().toUpperCase();
        let priceUsd = 0;
        let priceNative = 0;
        let currency = 'USD';
        let exchangeRate = 1;
        let name = s.name || symbol;
        try {
          await fetchExchangeRates();
          const q = await fetchStockQuote(symbol);
          currency = q?.currency || 'USD';
          priceNative = q?.priceNative ?? q?.price ?? 0;
          priceUsd = q?.priceUSD ?? convertToUSD(priceNative, currency);
          exchangeRate = q?.exchangeRate || 1;
          name = q?.name || name;
        } catch {
          // keep symbol even if quote fails
        }
        holdings.push({
          symbol,
          name,
          kind: 'ticker',
          weightPercent: s.percent,
          amount,
          currency,
          exchangeRate,
          priceNative,
          shares: priceUsd > 0 ? amount / priceUsd : 0,
          purchasePrice: priceUsd,
        });
      }

      const snapshot = {
        id: uid('fund'),
        source: 'custom',
        name: `Custom · ${country?.name || plans.countryCode}`,
        countryCode: plans.countryCode,
        investedAmount: cash,
        monthlyShare: monthly,
        fundedAt: new Date().toISOString(),
        holdings,
      };
      patchPlans({
        customSleeves: sleeves,
        funded: [snapshot, ...(plans.funded || [])].slice(0, 30),
      });
      if (typeof onAllocateCash === 'function' && cash > 0) {
        onAllocateCash(cash, `Funded custom plan (${holdings.length} sleeves)`);
      }
      setTab('dashboard');
    } catch (err) {
      setError(err.message || 'Could not fund custom plan');
    }
    setFunding(false);
  };

  // --- Dashboard ---
  const refreshDashboard = async () => {
    const funded = plans.funded || [];
    if (!funded.length) {
      setDashRows([]);
      return;
    }
    setDashBusy(true);
    try {
      const rows = await Promise.all(
        funded.map(async (fp) => {
          let currentValue = 0;
          const holdingValues = [];
          for (const h of fp.holdings || []) {
            if (
              h.kind === 'overnight' ||
              h.kind === 'savings' ||
              !h.symbol ||
              h.symbol === 'HYSA' ||
              h.symbol === 'Tagesgeld' ||
              h.symbol === 'Cash' ||
              !(h.shares > 0)
            ) {
              const v = h.amount || 0;
              currentValue += v;
              holdingValues.push({ ...h, currentValue: v });
              continue;
            }
            try {
              await fetchExchangeRates();
              const q = await fetchStockQuote(h.symbol);
              const currency = q?.currency || h.currency || 'USD';
              const native = q?.priceNative ?? q?.price ?? 0;
              const price =
                q?.priceUSD ??
                convertToUSD(native, currency) ??
                h.purchasePrice ??
                0;
              const value = (h.shares || 0) * price;
              currentValue += value;
              holdingValues.push({
                ...h,
                currency,
                currentPriceNative: native,
                currentPrice: price,
                currentValue: value,
              });
            } catch {
              const v = h.amount || 0;
              currentValue += v;
              holdingValues.push({ ...h, currentValue: v });
            }
          }
          const invested = fp.investedAmount || 0;
          const pnl = currentValue - invested;
          const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
          return { ...fp, currentValue, pnl, pnlPct, holdingValues };
        })
      );
      rows.sort((a, b) => b.pnlPct - a.pnlPct);
      setDashRows(rows);
    } catch (err) {
      setError(err.message || 'Dashboard refresh failed');
    }
    setDashBusy(false);
  };

  useEffect(() => {
    if (tab === 'dashboard') refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, plans.funded]);

  const applyMonthly = () => {
    if (monthly <= 0) {
      setError('Set a monthly extra amount first');
      return;
    }
    if (cashBalance > 0 && monthly > cashBalance) {
      setError(`Not enough cash (need ${formatMoney(monthly)})`);
      return;
    }
    const funded = plans.funded || [];
    if (!funded.length) {
      setError('Fund a plan before applying monthly contributions');
      return;
    }
    setError(null);
    // Apply to most recent funded plan (or all equally — prefer latest)
    const latest = funded[0];
    const weightSum =
      (latest.holdings || []).reduce((s, h) => s + (Number(h.weightPercent) || 0), 0) ||
      100;
    const holdings = (latest.holdings || []).map((h) => {
      const add = (monthly * (Number(h.weightPercent) || 0)) / weightSum;
      const price = h.purchasePrice || 0;
      const isCash =
        h.kind === 'overnight' || h.kind === 'savings' || !(price > 0);
      return {
        ...h,
        amount: (h.amount || 0) + add,
        shares: isCash ? h.shares || 0 : (h.shares || 0) + add / price,
      };
    });
    const updated = {
      ...latest,
      holdings,
      investedAmount: (latest.investedAmount || 0) + monthly,
      monthlyApplied: [
        ...(latest.monthlyApplied || []),
        { amount: monthly, at: new Date().toISOString() },
      ],
    };
    patchPlans({
      funded: [updated, ...funded.slice(1)],
    });
    if (typeof onAllocateCash === 'function') {
      onAllocateCash(monthly, `Monthly extra into ${updated.name}`);
    }
  };

  const tabs = [
    { id: 'suggested', label: 'Country plan' },
    { id: 'custom', label: 'Custom' },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  const sharedControls = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      <div>
        <label className="block text-xs uppercase tracking-wide text-steel mb-1">
          Country
        </label>
        <div className="relative">
          <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
          <select
            value={plans.countryCode}
            onChange={(e) => {
              patchPlans({ countryCode: e.target.value });
              setSuggestedResult(null);
            }}
            className="glass-input w-full pl-9 appearance-none"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-steel mb-1">
          Cash to invest
        </label>
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
          <input
            type="number"
            min="0"
            value={cashInput}
            onChange={(e) => {
              setCashInput(e.target.value);
              setSuggestedResult(null);
            }}
            className="glass-input w-full pl-9"
          />
        </div>
        {cashBalance > 0 && (
          <button
            type="button"
            className="text-[11px] text-emerald-bright mt-1"
            onClick={() => setCashInput(String(Math.round(cashBalance)))}
          >
            Use available cash ({formatMoney(cashBalance)})
          </button>
        )}
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-steel mb-1">
          Monthly extra
        </label>
        <input
          type="number"
          min="0"
          value={plans.monthlyContribution || ''}
          onChange={(e) =>
            patchPlans({ monthlyContribution: Number(e.target.value) || 0 })
          }
          className="glass-input w-full"
          placeholder="0"
        />
        <p className="text-[11px] text-steel mt-1">
          Added later with the same mix
        </p>
      </div>
    </div>
  );

  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/30 to-sapphire/20 flex-shrink-0">
            <Calculator className="w-5 h-5 text-emerald-bright" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-pearl">Project</h2>
            <p className="text-sm text-steel max-w-lg">
              Suggested country plans, or build your own mix of overnight cash and stocks/ETFs.
            </p>
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-dark/50 border border-slate-light/20 self-start">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                tab === t.id
                  ? 'bg-emerald-glow/20 text-emerald-bright'
                  : 'text-steel hover:text-pearl'
              }`}
            >
              {t.label}
              {t.id === 'dashboard' && (plans.funded?.length || 0) > 0
                ? ` (${plans.funded.length})`
                : ''}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl border border-ruby/30 bg-ruby/10 text-sm text-ruby-bright">
          {error}
        </div>
      )}

      {/* ========== SUGGESTED ========== */}
      {tab === 'suggested' && (
        <>
          <p className="text-sm text-silver mb-4">
            We suggest a full allocation for your country based on a risk profile — local overnight products and ETFs where we have them.
          </p>
          {sharedControls}

          <h3 className="text-sm font-semibold text-pearl mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-bright" />
            Pick a profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {profiles.map((p) => {
              const active = plans.selectedProfileId === p.id;
              const a = p.allocations || {};
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    patchPlans({ selectedProfileId: p.id });
                    setSuggestedResult(null);
                  }}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    active
                      ? 'border-emerald-bright/50 bg-emerald-500/10'
                      : 'border-slate-light/20 bg-slate-dark/30 hover:border-slate-light/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-pearl">{p.name}</span>
                    {riskDots(p.riskLevel)}
                  </div>
                  <p className="text-[11px] text-steel mb-2">{p.tagline}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-silver">
                    <span>Cash {Math.round((a.savings || 0) * 100)}%</span>
                    <span>ETFs {Math.round((a.etfs || 0) * 100)}%</span>
                    <span>Stocks {Math.round((a.stocks || 0) * 100)}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <button
              type="button"
              onClick={buildSuggested}
              disabled={busy}
              className="btn-primary flex items-center gap-2 min-h-[44px]"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Build country plan
            </button>
            {suggestedResult && (
              <button
                type="button"
                onClick={fundSuggested}
                disabled={funding}
                className="btn-secondary flex items-center gap-2 min-h-[44px]"
              >
                {funding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                Fund & track
              </button>
            )}
          </div>

          {suggestedResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-pearl">
                    {suggestedResult.profile?.name} plan · {country?.flag}{' '}
                    {country?.name}
                  </h4>
                  <p className="text-xs text-steel">
                    {formatMoney(cash)}
                    {monthly > 0 ? ` · +${formatMoney(monthly)}/mo` : ''}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-emerald-bright font-mono">
                    Est. {formatMoney(suggestedResult.summary?.expectedAnnualIncome)}
                    /yr income
                  </p>
                  <p className="text-steel">
                    Outlook {formatPct(suggestedResult.summary?.expectedTotalReturnPercent)}
                  </p>
                </div>
              </div>
              {country?.savingsNote && (
                <p className="text-[11px] text-steel">
                  Overnight sleeve: {overnight.name || country.savingsNote}
                </p>
              )}
              <HoldingList rows={suggestedResult.allocationPlan} />
            </div>
          )}
        </>
      )}

      {/* ========== CUSTOM ========== */}
      {tab === 'custom' && (
        <>
          <p className="text-sm text-silver mb-4">
            Define your own split: overnight account (e.g. Tagesgeld) and/or stocks &amp; ETFs, each with a percentage. Monthly extras use the same mix.
          </p>
          {sharedControls}

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-pearl">Your allocation</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => patchPlans({ customSleeves: normalizeCustom() })}
                className="btn-secondary text-xs px-2.5 py-1.5"
              >
                Normalize to 100%
              </button>
              <span
                className={`text-xs font-mono self-center ${
                  Math.abs(customTotal - 100) < 0.6
                    ? 'text-emerald-bright'
                    : 'text-amber-bright'
                }`}
              >
                {customTotal.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            {(plans.customSleeves || []).map((sleeve) => (
              <div
                key={sleeve.id}
                className="rounded-xl border border-slate-light/20 bg-slate-dark/30 p-3 space-y-2"
              >
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex gap-1 p-0.5 rounded-lg bg-slate-dark border border-slate-light/20">
                    <button
                      type="button"
                      onClick={() =>
                        updateSleeve(sleeve.id, {
                          kind: 'overnight',
                          symbol: overnight.symbol,
                          name: overnight.name,
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs ${
                        sleeve.kind === 'overnight'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-steel'
                      }`}
                    >
                      Overnight
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSleeve(sleeve.id, {
                          kind: 'ticker',
                          symbol: sleeve.kind === 'ticker' ? sleeve.symbol : '',
                          name: sleeve.kind === 'ticker' ? sleeve.name : '',
                        })
                      }
                      className={`px-2.5 py-1 rounded-md text-xs ${
                        sleeve.kind === 'ticker'
                          ? 'bg-emerald-500/20 text-emerald-bright'
                          : 'text-steel'
                      }`}
                    >
                      Stock / ETF
                    </button>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={sleeve.percent}
                      onChange={(e) =>
                        updateSleeve(sleeve.id, {
                          percent: Number(e.target.value) || 0,
                        })
                      }
                      className="glass-input w-20 text-center font-mono text-sm"
                    />
                    <span className="text-xs text-steel">%</span>
                    <button
                      type="button"
                      onClick={() => removeSleeve(sleeve.id)}
                      className="p-2 text-steel hover:text-ruby-bright"
                      disabled={(plans.customSleeves || []).length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {sleeve.kind === 'overnight' ? (
                  <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2">
                    <p className="text-sm text-pearl font-medium">
                      {overnight.name || 'Overnight / savings'}
                    </p>
                    <p className="text-[11px] text-steel">
                      {country?.savingsNote ||
                        'Local cash / overnight deposit for your country'}
                    </p>
                    <p className="text-xs font-mono text-cyan-300 mt-1">
                      {formatMoney((cash * (Number(sleeve.percent) || 0)) / 100)}
                      {monthly > 0 &&
                        ` · +${formatMoney((monthly * (Number(sleeve.percent) || 0)) / 100)}/mo`}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
                        <input
                          className="glass-input w-full pl-9"
                          placeholder="Search ticker e.g. VUAA.DE, AAPL"
                          value={
                            searchFor === sleeve.id
                              ? searchQ
                              : sleeve.symbol
                                ? `${sleeve.symbol}${sleeve.name ? ` — ${sleeve.name}` : ''}`
                                : ''
                          }
                          onFocus={() => {
                            setSearchFor(sleeve.id);
                            setSearchQ(sleeve.symbol || '');
                            setSearchHits([]);
                          }}
                          onChange={(e) => {
                            setSearchFor(sleeve.id);
                            runSearch(e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    {searchFor === sleeve.id && (searchHits.length > 0 || searchBusy) && (
                      <div className="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-slate-light/20 bg-slate-dark shadow-xl max-h-48 overflow-y-auto">
                        {searchBusy && (
                          <p className="px-3 py-2 text-xs text-steel">Searching…</p>
                        )}
                        {searchHits.map((hit) => (
                          <button
                            key={hit.symbol}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-light/10 border-b border-slate-light/10 last:border-0"
                            onClick={() => {
                              updateSleeve(sleeve.id, {
                                symbol: hit.symbol,
                                name: hit.name || hit.symbol,
                              });
                              setSearchFor(null);
                              setSearchHits([]);
                              setSearchQ('');
                            }}
                          >
                            <span className="font-semibold text-pearl text-sm">
                              {hit.symbol}
                            </span>
                            <span className="text-xs text-steel ml-2">{hit.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs font-mono text-silver mt-1">
                      {formatMoney((cash * (Number(sleeve.percent) || 0)) / 100)}
                      {monthly > 0 &&
                        ` · +${formatMoney((monthly * (Number(sleeve.percent) || 0)) / 100)}/mo`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => addSleeve('overnight')}
              className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Overnight
            </button>
            <button
              type="button"
              onClick={() => addSleeve('ticker')}
              className="btn-secondary text-xs px-3 py-2 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Stock / ETF
            </button>
          </div>

          <button
            type="button"
            onClick={fundCustom}
            disabled={funding}
            className="btn-primary flex items-center gap-2 min-h-[44px]"
          >
            {funding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            Fund custom plan & track
          </button>
        </>
      )}

      {/* ========== DASHBOARD ========== */}
      {tab === 'dashboard' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-pearl flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-bright" />
                Performance
              </h3>
              <p className="text-xs text-steel">
                Ranked by return · monthly extra {formatMoney(monthly)} into latest plan
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyMonthly}
                disabled={!monthly || !plans.funded?.length}
                className="btn-primary text-xs px-3 py-2"
              >
                Invest this month
              </button>
              <button
                type="button"
                onClick={refreshDashboard}
                disabled={dashBusy}
                className="btn-secondary text-xs px-3 py-2"
              >
                {dashBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>

          {!plans.funded?.length && (
            <div className="rounded-xl border border-slate-light/20 p-8 text-center">
              <p className="text-sm text-steel mb-3">No funded plans yet.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab('suggested')}
                  className="btn-primary text-xs px-3 py-2"
                >
                  Build country plan
                </button>
                <button
                  type="button"
                  onClick={() => setTab('custom')}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  Build custom
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {dashRows.map((row, idx) => (
              <div
                key={`${row.id}-${row.fundedAt}`}
                className="rounded-xl border border-slate-light/20 bg-slate-dark/30 p-3 sm:p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-light/20 text-steel">
                        #{idx + 1}
                      </span>
                      <h4 className="font-semibold text-pearl">{row.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sapphire/15 text-sapphire-bright capitalize">
                        {row.source || 'plan'}
                      </span>
                    </div>
                    <p className="text-[11px] text-steel mt-0.5">
                      {row.countryCode} · {row.fundedAt?.slice(0, 10)}
                      {row.monthlyShare > 0 &&
                        ` · ${formatMoney(row.monthlyShare)}/mo plan`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-pearl">
                      {formatMoney(row.currentValue)}
                    </p>
                    <p
                      className={`text-sm font-mono ${
                        row.pnl >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'
                      }`}
                    >
                      {formatPct(row.pnlPct)} ({row.pnl >= 0 ? '+' : ''}
                      {formatMoney(row.pnl)})
                    </p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-dark overflow-hidden border border-slate-light/20 mb-3">
                  <div
                    className={`h-full ${
                      row.pnlPct >= 0 ? 'bg-emerald-bright' : 'bg-ruby-bright'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(4, Math.abs(row.pnlPct) * 4))}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {(row.holdingValues || row.holdings || []).slice(0, 4).map((h) => (
                    <div key={`${h.symbol}-${h.kind}`}>
                      <p className="text-steel truncate">{h.symbol}</p>
                      <p className="font-mono text-silver">
                        {formatMoney(h.currentValue ?? h.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
