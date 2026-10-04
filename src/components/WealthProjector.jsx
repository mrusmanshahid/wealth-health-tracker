import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  Calculator,
  Globe2,
  Landmark,
  Loader2,
  PiggyBank,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  fetchProjectorCountries,
  fetchProjectorProfiles,
  projectWealth,
} from '../services/stockApi';

function AccessBadge({ status }) {
  if (status === 'available') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-bright">
        Available
      </span>
    );
  }
  if (status === 'limited') {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber/15 text-amber-bright">
        Limited
      </span>
    );
  }
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ruby/15 text-ruby-bright">
      Unavailable
    </span>
  );
}

const PROFILE_ICONS = {
  safe: Shield,
  balanced: PiggyBank,
  growth: TrendingUp,
  aggressive: Zap,
};

const PROFILE_COLORS = {
  safe: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-bright',
  balanced: 'border-sapphire/40 bg-sapphire/10 text-sapphire-bright',
  growth: 'border-amber/40 bg-amber/10 text-amber-bright',
  aggressive: 'border-ruby/40 bg-ruby/10 text-ruby-bright',
};

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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const base = payload.find((p) => p.dataKey === 'value');
  const worst = payload.find((p) => p.dataKey === 'worstValue');
  return (
    <div className="rounded-lg border border-slate-light/30 bg-obsidian/95 px-3 py-2 text-xs shadow-xl">
      <p className="text-steel mb-1">{label}</p>
      {base?.value != null && (
        <p className="font-semibold text-emerald-bright">
          Base {formatMoney(base.value)}
        </p>
      )}
      {worst?.value != null && (
        <p className="font-semibold text-ruby-bright mt-0.5">
          Worst {formatMoney(worst.value)}
        </p>
      )}
      {point?.isForecast && <p className="text-amber-bright mt-0.5">Projected</p>}
    </div>
  );
}

export default function WealthProjector() {
  const [profiles, setProfiles] = useState([]);
  const [countries, setCountries] = useState([]);
  const [capitalInput, setCapitalInput] = useState('100000');
  const [profileId, setProfileId] = useState('balanced');
  const [countryCode, setCountryCode] = useState('US');
  const [result, setResult] = useState(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isProjecting, setIsProjecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingProfiles(true);
      const [profileData, countryData] = await Promise.all([
        fetchProjectorProfiles(),
        fetchProjectorCountries(),
      ]);
      if (!cancelled) {
        setProfiles(profileData || []);
        setCountries(countryData || []);
        setIsLoadingProfiles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (profiles.length === 0) return;
    runProjection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, profileId, countryCode]);

  const runProjection = async () => {
    const capital = Number(String(capitalInput).replace(/,/g, ''));
    if (!capital || capital <= 0) {
      setError('Enter a capital amount greater than 0');
      return;
    }
    setError(null);
    setIsProjecting(true);
    try {
      const data = await projectWealth(capital, profileId, countryCode);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not run projection');
    }
    setIsProjecting(false);
  };

  const selectedCountry = countries.find((c) => c.code === countryCode);

  const chartData = useMemo(() => {
    if (!result) return [];
    const back = (result.backtest?.points || []).map((p) => ({
      ...p,
      label: p.date?.slice(0, 7),
      series: 'backtest',
    }));
    const fore = (result.forecast?.points || []).map((p) => ({
      ...p,
      label: p.date?.slice(0, 7),
      series: 'forecast',
    }));
    // Show backtest and forecast as separate visual segments in one list
    return [...back, ...fore];
  }, [result]);

  const riskDots = (level) =>
    Array.from({ length: 4 }, (_, i) => (
      <span
        key={i}
        className={`inline-block w-1.5 h-1.5 rounded-full ${
          i < level ? 'bg-current' : 'bg-slate-light/40'
        }`}
      />
    ));

  return (
    <div className="glass-card p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/30 to-sapphire/20">
            <Calculator className="w-5 h-5 text-emerald-bright" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-pearl">Wealth Projector</h2>
            <p className="text-sm text-steel max-w-xl">
              Enter your capital, pick a country and risk profile, and see what to buy,
              which brokers offer it, income, backtest, and outlook.
            </p>
          </div>
        </div>
      </div>

      {/* Capital + profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-1 space-y-3">
          <label className="block text-xs uppercase tracking-wide text-steel">
            Country
          </label>
          <div className="relative">
            <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="glass-input w-full pl-9 appearance-none cursor-pointer"
              disabled={isLoadingProfiles || countries.length === 0}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
          {selectedCountry && (
            <p className="text-[11px] text-steel leading-snug">
              Brokers: {selectedCountry.brokers.map((b) => b.name).join(' · ')}
            </p>
          )}

          <label className="block text-xs uppercase tracking-wide text-steel pt-1">
            Total capital
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-steel">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={capitalInput}
              onChange={(e) => setCapitalInput(e.target.value)}
              className="glass-input w-full pl-7 text-lg font-semibold"
              placeholder="100000"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[25000, 50000, 100000, 250000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCapitalInput(String(preset))}
                className="px-2.5 py-1 rounded-md text-xs bg-slate-dark/60 text-silver hover:text-pearl border border-slate-light/20"
              >
                {formatMoney(preset)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={runProjection}
            disabled={isProjecting || isLoadingProfiles}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {isProjecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Calculating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Project my wealth
              </>
            )}
          </button>
          {error && <p className="text-sm text-ruby-bright">{error}</p>}
        </div>

        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wide text-steel mb-2">Risk profile</p>
          {isLoadingProfiles ? (
            <div className="flex items-center gap-2 text-silver py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading profiles…
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {profiles.map((p) => {
                const Icon = PROFILE_ICONS[p.id] || Landmark;
                const active = profileId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfileId(p.id)}
                    className={`text-left rounded-xl border p-3 transition-all ${
                      active
                        ? PROFILE_COLORS[p.id]
                        : 'border-slate-light/20 bg-slate-dark/40 text-silver hover:border-slate-light/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-4 h-4" />
                      <div className="flex gap-0.5">{riskDots(p.riskLevel)}</div>
                    </div>
                    <p className="font-semibold text-pearl text-sm">{p.name}</p>
                    <p className="text-[11px] text-steel mt-1 leading-snug">{p.tagline}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {result && (
        <>
          {/* Plain-language summary */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-5">
            <p className="text-sm text-pearl leading-relaxed">{result.summary.plainLanguage}</p>
            <p className="text-[11px] text-steel mt-2">{result.disclaimer}</p>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl bg-slate-dark/50 border border-slate-light/20 p-3">
              <p className="text-[11px] text-steel uppercase">Yearly cash income</p>
              <p className="text-xl font-bold text-emerald-bright mt-1">
                {formatMoney(result.summary.expectedAnnualIncome)}
              </p>
              <p className="text-xs text-silver mb-2">
                {result.summary.expectedIncomePercent}% of capital (cash paid out)
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-light/15">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-steel">Dividends</span>
                  <span className="text-pearl font-mono">
                    {formatMoney(result.summary.dividendIncome)}
                    <span className="text-steel ml-1">
                      ({result.summary.dividendIncomePercent ?? 0}%)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-steel">Interest (savings)</span>
                  <span className="text-pearl font-mono">
                    {formatMoney(result.summary.interestIncome)}
                    <span className="text-steel ml-1">
                      ({result.summary.interestIncomePercent ?? 0}%)
                    </span>
                  </span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden mt-1 border border-slate-light/20">
                  {(() => {
                    const div = result.summary.dividendIncome || 0;
                    const int = result.summary.interestIncome || 0;
                    const total = div + int || 1;
                    return (
                      <>
                        <div
                          className="bg-emerald-bright"
                          style={{ width: `${(div / total) * 100}%` }}
                          title="Dividends"
                        />
                        <div
                          className="bg-sapphire-bright"
                          style={{ width: `${(int / total) * 100}%` }}
                          title="Interest"
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-dark/50 border border-slate-light/20 p-3">
              <p className="text-[11px] text-steel uppercase">Expected total return</p>
              <p className="text-xl font-bold text-sapphire-bright mt-1">
                {formatPct(result.summary.expectedTotalReturnPercent)}
              </p>
              <p className="text-xs text-silver mb-2">
                ~{formatMoney(result.summary.expectedAnnualGrowthDollars)} / year combined
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-light/15">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-steel">Cash income</span>
                  <span className="text-emerald-bright font-mono">
                    {formatMoney(result.summary.expectedAnnualIncome)}
                    <span className="text-steel ml-1">
                      ({result.summary.expectedIncomePercent}%)
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-steel">Price appreciation</span>
                  <span className="text-amber-bright font-mono">
                    {formatMoney(result.summary.appreciationDollars)}
                    <span className="text-steel ml-1">
                      ({result.summary.appreciationPercent ?? 0}%)
                    </span>
                  </span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden mt-1 border border-slate-light/20">
                  {(() => {
                    const income = result.summary.expectedIncomePercent || 0;
                    const appr = result.summary.appreciationPercent || 0;
                    const total = income + appr || 1;
                    return (
                      <>
                        <div
                          className="bg-emerald-bright"
                          style={{ width: `${(income / total) * 100}%` }}
                          title="Income"
                        />
                        <div
                          className="bg-amber-bright"
                          style={{ width: `${(appr / total) * 100}%` }}
                          title="Appreciation"
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-dark/50 border border-slate-light/20 p-3">
              <p className="text-[11px] text-steel uppercase">10y backtest CAGR</p>
              <p className="text-xl font-bold text-amber-bright mt-1">
                {formatPct(result.backtest?.cagr)}
              </p>
              <p className="text-xs text-silver">
                Max dip {result.backtest?.maxDrawdownPercent ?? '—'}%
              </p>
            </div>
            <div className="rounded-xl bg-slate-dark/50 border border-slate-light/20 p-3">
              <p className="text-[11px] text-steel uppercase">5-year outlook</p>
              <p className="text-xl font-bold text-violet-bright mt-1">
                {formatMoney(result.summary.projectedValue5Y)}
              </p>
              <p className="text-xs text-silver mb-2">Base case (history-like)</p>
              {result.worstCase && (
                <div className="pt-2 border-t border-slate-light/15 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-steel">Worst case 5Y</span>
                    <span className="text-ruby-bright font-mono font-semibold">
                      {formatMoney(result.worstCase.projectedValue5Y)}
                    </span>
                  </div>
                  <p className="text-[10px] text-steel">
                    At {formatPct(result.worstCase.annualReturnPercent)} / year
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Base vs Worst case */}
          {result.worstCase && (
            <div className="rounded-xl border border-ruby/25 bg-ruby/5 p-4 mb-5">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-ruby-bright mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-pearl">
                    Worst case — {result.profile.name}
                  </p>
                  <p className="text-xs text-steel mt-0.5">
                    {result.worstCase.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-slate-dark/40 border border-slate-light/15 p-3">
                  <p className="text-[11px] uppercase text-steel mb-2">Base case</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-steel">Total return</span>
                      <span className="text-sapphire-bright font-mono">
                        {formatPct(result.summary.expectedTotalReturnPercent)} ·{' '}
                        {formatMoney(result.summary.expectedAnnualGrowthDollars)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-steel">Cash income</span>
                      <span className="text-emerald-bright font-mono">
                        {formatMoney(result.summary.expectedAnnualIncome)} (
                        {result.summary.expectedIncomePercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-steel">Appreciation</span>
                      <span className="text-amber-bright font-mono">
                        {formatMoney(result.summary.appreciationDollars)} (
                        {result.summary.appreciationPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-steel">5Y value</span>
                      <span className="text-pearl font-mono">
                        {formatMoney(result.summary.projectedValue5Y)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-dark/40 border border-ruby/20 p-3">
                  <p className="text-[11px] uppercase text-ruby-bright mb-2">Worst case</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-steel">Total return</span>
                      <span className="text-ruby-bright font-mono">
                        {formatPct(result.worstCase.annualReturnPercent)} ·{' '}
                        {formatMoney(result.worstCase.annualReturnDollars)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-steel">Cash income (stressed)</span>
                      <span className="text-pearl font-mono">
                        {formatMoney(result.worstCase.annualIncome)} (
                        {result.worstCase.annualIncomePercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between pl-2 text-[11px]">
                      <span className="text-steel">↳ Dividends</span>
                      <span className="text-silver font-mono">
                        {formatMoney(result.worstCase.dividendIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between pl-2 text-[11px]">
                      <span className="text-steel">↳ Interest</span>
                      <span className="text-silver font-mono">
                        {formatMoney(result.worstCase.interestIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-steel">Appreciation</span>
                      <span className="text-ruby-bright font-mono">
                        {formatMoney(result.worstCase.appreciationDollars)} (
                        {result.worstCase.appreciationPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-steel">5Y value</span>
                      <span className="text-pearl font-mono">
                        {formatMoney(result.worstCase.projectedValue5Y)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-obsidian/40 px-2.5 py-2 border border-slate-light/10">
                  <p className="text-steel text-[10px] uppercase">Max drawdown</p>
                  <p className="text-ruby-bright font-semibold font-mono mt-0.5">
                    {result.worstCase.maxDrawdownPercent != null
                      ? `-${result.worstCase.maxDrawdownPercent}%`
                      : '—'}
                  </p>
                  <p className="text-[10px] text-steel mt-0.5">
                    Peak → trough in backtest
                  </p>
                </div>
                <div className="rounded-lg bg-obsidian/40 px-2.5 py-2 border border-slate-light/10">
                  <p className="text-steel text-[10px] uppercase">After that dip</p>
                  <p className="text-pearl font-semibold font-mono mt-0.5">
                    {formatMoney(result.worstCase.crashPortfolioValue)}
                  </p>
                  <p className="text-[10px] text-steel mt-0.5">
                    On {formatMoney(result.capital)} today
                  </p>
                </div>
                <div className="rounded-lg bg-obsidian/40 px-2.5 py-2 border border-slate-light/10">
                  <p className="text-steel text-[10px] uppercase">Worst 1-year</p>
                  <p className="text-ruby-bright font-semibold font-mono mt-0.5">
                    {formatPct(result.worstCase.worstRolling1YPercent)}
                  </p>
                  <p className="text-[10px] text-steel mt-0.5">Rolling 12 months</p>
                </div>
                <div className="rounded-lg bg-obsidian/40 px-2.5 py-2 border border-slate-light/10">
                  <p className="text-steel text-[10px] uppercase">Worst 5-year CAGR</p>
                  <p className="text-ruby-bright font-semibold font-mono mt-0.5">
                    {formatPct(result.worstCase.worstRolling5YCagrPercent)}
                  </p>
                  <p className="text-[10px] text-steel mt-0.5">From history</p>
                </div>
              </div>
            </div>
          )}

          {/* Mix bars */}
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wide text-steel mb-2">
              Portfolio mix — {result.profile.name}
            </p>
            <div className="flex h-3 rounded-full overflow-hidden border border-slate-light/20 mb-2">
              <div
                className="bg-violet-500"
                style={{ width: `${result.profile.allocations.stocks}%` }}
                title="Stocks"
              />
              <div
                className="bg-sapphire"
                style={{ width: `${result.profile.allocations.etfs}%` }}
                title="ETFs"
              />
              <div
                className="bg-emerald-glow"
                style={{ width: `${result.profile.allocations.savings}%` }}
                title="Savings"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-silver">
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-1" />
                Stocks {result.profile.allocations.stocks}%
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-sapphire mr-1" />
                ETFs {result.profile.allocations.etfs}%
              </span>
              <span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-glow mr-1" />
                Savings {result.profile.allocations.savings}%
              </span>
            </div>
          </div>

          {/* Country access summary */}
          {result.country && (
            <div className="rounded-xl border border-sapphire/20 bg-sapphire/5 p-3 mb-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-pearl">
                    {result.country.flag} Buying from {result.country.name}
                  </p>
                  <p className="text-xs text-steel mt-1 max-w-2xl">
                    {result.accessSummary?.hint}
                  </p>
                  {result.accessSummary?.savingsNote && (
                    <p className="text-[11px] text-silver mt-1">
                      Cash sleeve: {result.accessSummary.savingsNote}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 text-[11px]">
                  {(result.accessSummary?.unavailableCount || 0) > 0 && (
                    <span className="px-2 py-1 rounded bg-ruby/15 text-ruby-bright">
                      {result.accessSummary.unavailableCount} unavailable
                    </span>
                  )}
                  {(result.accessSummary?.limitedCount || 0) > 0 && (
                    <span className="px-2 py-1 rounded bg-amber/15 text-amber-bright">
                      {result.accessSummary.limitedCount} limited
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Allocation table */}
          <div className="mb-5 overflow-x-auto">
            <p className="text-xs uppercase tracking-wide text-steel mb-2">
              Suggested investments
              {result.country?.name ? ` · ${result.country.name}` : ''}
            </p>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase text-steel border-b border-slate-light/20">
                  <th className="py-2 pr-2">Buy</th>
                  <th className="py-2 pr-2">Role</th>
                  <th className="py-2 pr-2 text-right">Price</th>
                  <th className="py-2 pr-2 text-right">Amount</th>
                  <th className="py-2 pr-2 text-right">Mix</th>
                  <th className="py-2 pr-2 text-right">Est. income</th>
                  <th className="py-2">Brokers</th>
                </tr>
              </thead>
              <tbody>
                {result.allocationPlan.map((row) => {
                  const usingAlt = Boolean(row.usingAlternate && row.access?.alternative);
                  const buySymbol = usingAlt
                    ? row.displaySymbol || row.access.alternative.symbol
                    : row.symbol;
                  const buyName = usingAlt
                    ? row.displayName || row.access.alternative.name
                    : row.name;
                  const price = usingAlt ? row.displayPrice : row.price;
                  const shares = usingAlt ? row.displayShares : row.shares;
                  const income = usingAlt
                    ? row.displayAnnualIncome ?? row.expectedAnnualIncome
                    : row.expectedAnnualIncome;
                  const yieldPct = usingAlt
                    ? row.displayYieldPercent ?? row.expectedYieldPercent
                    : row.expectedYieldPercent;
                  const showPrice =
                    row.kind !== 'savings' && price != null && Number(price) > 0;

                  return (
                    <tr
                      key={`${row.kind}-${row.symbol}`}
                      className="border-b border-slate-light/10 align-top"
                    >
                      <td className="py-2.5 pr-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-pearl">{buySymbol}</span>
                          {row.access && <AccessBadge status={row.access.status} />}
                        </div>
                        <div className="text-[11px] text-steel truncate max-w-[200px]">
                          {buyName}
                        </div>
                        {usingAlt && (
                          <div className="text-[10px] text-amber-bright mt-0.5">
                            Alternate for {row.originalSymbol || row.symbol}
                            {row.access.alternative.reason
                              ? ` · ${row.access.alternative.reason}`
                              : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-silver text-xs">{row.role}</td>
                      <td className="py-2.5 pr-2 text-right font-mono text-pearl">
                        {!showPrice ? (
                          <span className="text-steel">—</span>
                        ) : (
                          <>
                            ${Number(price).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {shares != null && (
                              <span className="block text-[10px] text-steel">
                                ~{Number(shares).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}{' '}
                                sh
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-right font-mono text-pearl">
                        {formatMoney(row.amount)}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-silver">{row.percent}%</td>
                      <td className="py-2.5 pr-2 text-right text-emerald-bright font-mono">
                        {formatMoney(income)}
                        <span className="block text-[10px] text-steel">
                          {yieldPct}% ·{' '}
                          {row.incomeType === 'interest' ? 'interest' : 'dividend'}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-silver max-w-[160px]">
                        {row.access?.brokers?.length > 0
                          ? row.access.brokers.map((b) => b.name).join(', ')
                          : usingAlt
                            ? 'Use local / UCITS listing'
                            : 'Check your broker'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-steel">
                Backtest (~{result.backtest?.years || 10}y) + 5y prospects
              </p>
              <div className="flex gap-3 text-[11px] text-steel">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-emerald-bright inline-block" /> Historical
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-amber-bright inline-block" /> Base projected
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-ruby-bright inline-block" /> Worst projected
                </span>
              </div>
            </div>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="projFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      minTickGap={40}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                      }
                      width={48}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="none"
                      fill="url(#projFill)"
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                      name="Base"
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="worstValue"
                      stroke="#f87171"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Worst"
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-steel text-sm">
                  Not enough history to chart this mix
                </div>
              )}
            </div>
            {result.backtest?.endValue != null && (
              <p className="text-xs text-silver mt-2">
                If you had invested {formatMoney(result.capital)} in this mix{' '}
                {result.backtest.years} years ago, it would be worth about{' '}
                <span className="text-pearl font-semibold">
                  {formatMoney(result.backtest.endValue)}
                </span>{' '}
                today ({formatPct(result.backtest.totalReturnPercent)} total).
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
