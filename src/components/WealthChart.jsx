import { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
  Area,
} from 'recharts';
import { format, addMonths } from 'date-fns';
import { Target } from 'lucide-react';
import { normalizeAnalyst } from '../utils/forecasting';

function formatCompact(value) {
  if (value == null || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 10000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

export default function WealthChart({ wealthData, monthlyContribution = 0, stocks = [] }) {
  const analystSummary = useMemo(() => {
    let currentValue = 0;
    let meanTarget = 0;
    let lowTarget = 0;
    let highTarget = 0;
    let covered = 0;
    let bullish = 0;
    let bearish = 0;
    let hold = 0;

    stocks.forEach((stock) => {
      const shares =
        stock.shares ||
        stock.investedAmount / (stock.purchasePrice || stock.currentPrice || 1);
      const price = stock.currentPrice || 0;
      const analyst = normalizeAnalyst(stock.analyst, price);
      currentValue += shares * price;

      if (analyst.targetMean != null && analyst.targetMean > 0) {
        const mean = analyst.targetMean;
        // Keep range anchored around mean; ignore inverted / junk extremes
        let low = analyst.targetLow;
        let high = analyst.targetHigh;
        if (low == null || low <= 0 || low > mean) low = mean * 0.92;
        if (high == null || high < mean) high = mean * 1.08;
        // Cap absurd spreads (>40% from mean) so the chart stays readable
        low = Math.max(low, mean * 0.6);
        high = Math.min(high, mean * 1.4);

        meanTarget += shares * mean;
        lowTarget += shares * low;
        highTarget += shares * high;
        covered += 1;
      } else {
        meanTarget += shares * price;
        lowTarget += shares * price;
        highTarget += shares * price;
      }

      if (analyst.sentiment === 'bullish') bullish += 1;
      else if (analyst.sentiment === 'bearish') bearish += 1;
      else if (analyst.coverage) hold += 1;
    });

    // Ensure portfolio-level ordering
    if (lowTarget > meanTarget) lowTarget = meanTarget;
    if (highTarget < meanTarget) highTarget = meanTarget;

    const upside = currentValue > 0 ? ((meanTarget - currentValue) / currentValue) * 100 : 0;
    return {
      currentValue,
      meanTarget,
      lowTarget,
      highTarget,
      upside,
      covered,
      bullish,
      bearish,
      hold,
      total: stocks.length,
    };
  }, [stocks]);

  const chartData = useMemo(() => {
    if (!wealthData || wealthData.length === 0) return [];

    const historicalData = wealthData.filter((d) => !d.isForecast);
    if (historicalData.length === 0) return [];

    const lastHistorical = historicalData[historicalData.length - 1];
    // Prefer live portfolio value from analyst summary when available
    const startValue =
      analystSummary.currentValue > 0 ? analystSummary.currentValue : lastHistorical.value;
    const lastDate = new Date(lastHistorical.date);

    const result = historicalData.map((d) => ({
      ...d,
      analystMean: null,
      analystLow: null,
      analystHigh: null,
      bandBase: null,
      bandSize: null,
    }));

    // Bridge point: history ends, projection starts
    result[result.length - 1] = {
      ...result[result.length - 1],
      value: startValue,
      analystMean: startValue,
      analystLow: startValue,
      analystHigh: startValue,
      bandBase: startValue,
      bandSize: 0,
    };

    const months = 12;
    const endMean = analystSummary.meanTarget || startValue;
    const endLow = Math.min(analystSummary.lowTarget || endMean, endMean);
    const endHigh = Math.max(analystSummary.highTarget || endMean, endMean);

    for (let i = 1; i <= months; i++) {
      const t = i / months;
      const futureDate = addMonths(lastDate, i);
      const contribBoost = monthlyContribution * i;

      const mean = startValue + (endMean - startValue) * t + contribBoost;
      const low = startValue + (endLow - startValue) * t + contribBoost;
      const high = startValue + (endHigh - startValue) * t + contribBoost;
      const lo = Math.min(low, mean);
      const hi = Math.max(high, mean);

      result.push({
        date: format(futureDate, 'yyyy-MM-dd'),
        value: null,
        contributions: (lastHistorical.contributions || 0) + contribBoost,
        isForecast: true,
        analystMean: Math.round(mean),
        analystLow: Math.round(lo),
        analystHigh: Math.round(hi),
        // Stacked band: transparent base up to low, then tinted size to high
        bandBase: Math.round(lo),
        bandSize: Math.round(hi - lo),
      });
    }

    return result;
  }, [wealthData, monthlyContribution, analystSummary]);

  const todayIndex = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const idx = chartData.findIndex((d) => d.date > today);
    if (idx < 0) return chartData.findIndex((d) => d.analystMean != null && d.value != null);
    return Math.max(0, idx - 1);
  }, [chartData]);

  const formatAxis = (value) => {
    if (value == null) return '';
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    const isHistorical = !data?.isForecast && data?.value != null;

    return (
      <div className="glass-card p-3 text-sm border-emerald-glow/30 min-w-[200px]">
        <p className="text-steel mb-2 font-medium">{formatDate(label)}</p>
        {isHistorical && (
          <div className="flex justify-between gap-4">
            <span className="text-silver">Portfolio</span>
            <span className="font-mono font-semibold text-pearl">{formatCompact(data.value)}</span>
          </div>
        )}
        {data?.analystMean != null && data?.isForecast && (
          <>
            <div className="flex justify-between gap-4 mt-1">
              <span className="text-sapphire-bright">Mean target</span>
              <span className="font-mono text-sapphire-bright">{formatCompact(data.analystMean)}</span>
            </div>
            <div className="flex justify-between gap-4 mt-1 text-xs">
              <span className="text-steel">Low / High</span>
              <span className="font-mono text-silver">
                {formatCompact(data.analystLow)} – {formatCompact(data.analystHigh)}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-container h-72 flex items-center justify-center">
        <p className="text-steel">Add stocks to see wealth & analyst targets</p>
      </div>
    );
  }

  const upsidePositive = analystSummary.upside >= 0;

  return (
    <div className="chart-container">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
        <div>
          <h3 className="text-lg font-bold text-pearl flex items-center gap-2">
            <Target className="w-4 h-4 text-sapphire-bright" />
            Growth vs Analyst Targets
          </h3>
          <p className="text-xs text-steel mt-0.5">
            History + 12-month street consensus
            {monthlyContribution > 0 && ` · $${monthlyContribution.toLocaleString()}/mo`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-steel">
            <span className="w-2 h-2 rounded-full bg-emerald-bright" /> Hist
          </span>
          <span className="flex items-center gap-1 text-steel">
            <span className="w-3 h-0.5 bg-sapphire-bright inline-block" /> Mean
          </span>
          <span className="flex items-center gap-1 text-steel">
            <span className="w-3 h-2 rounded-sm bg-sapphire/30 inline-block" /> Low–High range
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="p-2.5 rounded-lg bg-slate-dark/50 border border-slate-light/10">
          <p className="text-[10px] text-steel uppercase mb-0.5">Now</p>
          <p className="font-mono font-semibold text-pearl text-sm">
            {formatCompact(analystSummary.currentValue)}
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-sapphire/10 border border-sapphire/20">
          <p className="text-[10px] text-sapphire-bright uppercase mb-0.5">12M target</p>
          <p className="font-mono font-semibold text-sapphire-bright text-sm">
            {formatCompact(analystSummary.meanTarget)}
          </p>
        </div>
        <div
          className={`p-2.5 rounded-lg border ${
            upsidePositive
              ? 'bg-emerald-glow/10 border-emerald-glow/20'
              : 'bg-ruby/10 border-ruby/20'
          }`}
        >
          <p className={`text-[10px] uppercase mb-0.5 ${upsidePositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
            Upside
          </p>
          <p
            className={`font-mono font-semibold text-sm ${
              upsidePositive ? 'text-emerald-bright' : 'text-ruby-bright'
            }`}
          >
            {upsidePositive ? '+' : ''}
            {analystSummary.upside.toFixed(1)}%
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-dark/50 border border-slate-light/10">
          <p className="text-[10px] text-steel uppercase mb-0.5">Street view</p>
          <p className="text-xs text-silver">
            <span className="text-emerald-bright">{analystSummary.bullish}↑</span>
            {' · '}
            <span className="text-amber-bright">{analystSummary.hold}→</span>
            {' · '}
            <span className="text-ruby-bright">{analystSummary.bearish}↓</span>
          </p>
          <p className="text-[10px] text-steel mt-0.5">
            {analystSummary.covered}/{analystSummary.total} covered
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wealthHistoricalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="analystBandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.08} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatAxis}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={55}
            domain={[
              (dataMin) => Math.max(0, dataMin * 0.92),
              (dataMax) => dataMax * 1.08,
            ]}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#wealthHistoricalGradient)"
            connectNulls={false}
            name="Historical"
          />

          {/* Range band between low and high (stacked, not filled from $0) */}
          <Area
            type="monotone"
            dataKey="bandBase"
            stackId="analystBand"
            stroke="none"
            fill="transparent"
            connectNulls
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="bandSize"
            stackId="analystBand"
            stroke="none"
            fill="url(#analystBandFill)"
            connectNulls
            activeDot={false}
            name="Analyst range"
          />

          <Line
            type="monotone"
            dataKey="analystMean"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={false}
            connectNulls
            name="Mean target"
          />

          {todayIndex >= 0 && chartData[todayIndex] && (
            <ReferenceLine
              x={chartData[todayIndex].date}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Today', position: 'top', fill: '#f59e0b', fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
