import { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, addMonths } from 'date-fns';
import { normalizeAnalyst } from '../utils/forecasting';

function formatMoney(value) {
  if (value == null || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 10000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

export default function UnifiedStockChart({ stock, monthlyContribution = 0 }) {
  const analyst = useMemo(
    () => normalizeAnalyst(stock?.analyst, stock?.currentPrice),
    [stock?.analyst, stock?.currentPrice]
  );

  const { chartData, todayDate, summary } = useMemo(() => {
    if (!stock?.history?.length) {
      return { chartData: [], todayDate: null, summary: null };
    }

    const shares =
      stock.shares || stock.investedAmount / (stock.purchasePrice || stock.currentPrice || 1);
    const currentPrice =
      stock.currentPrice || stock.history[stock.history.length - 1]?.price || 0;
    const today = new Date().toISOString().split('T')[0];

    const result = stock.history.map((h) => ({
      date: h.date,
      value: h.price * shares,
      price: h.price,
      isHistorical: true,
      analystMean: null,
      analystLow: null,
      analystHigh: null,
      bandBase: null,
      bandSize: null,
    }));

    const last = result[result.length - 1];
    if (last && last.date < today) {
      result.push({
        date: today,
        value: currentPrice * shares,
        price: currentPrice,
        isHistorical: true,
        analystMean: currentPrice * shares,
        analystLow: currentPrice * shares,
        analystHigh: currentPrice * shares,
        bandBase: currentPrice * shares,
        bandSize: 0,
      });
    } else if (last) {
      last.value = currentPrice * shares;
      last.price = currentPrice;
      last.analystMean = currentPrice * shares;
      last.analystLow = currentPrice * shares;
      last.analystHigh = currentPrice * shares;
      last.bandBase = currentPrice * shares;
      last.bandSize = 0;
    }

    const startValue = currentPrice * shares;
    const meanPx = analyst.targetMean ?? currentPrice;
    const lowPx =
      analyst.targetLow != null && analyst.targetLow > 0 && analyst.targetLow <= meanPx
        ? analyst.targetLow
        : meanPx * 0.92;
    const highPx =
      analyst.targetHigh != null && analyst.targetHigh >= meanPx
        ? analyst.targetHigh
        : meanPx * 1.08;

    const endMean = meanPx * shares;
    const endLow = Math.min(lowPx, meanPx) * shares;
    const endHigh = Math.max(highPx, meanPx) * shares;
    const lastDate = new Date(result[result.length - 1].date);

    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      const contrib = monthlyContribution * i;
      const mean = startValue + (endMean - startValue) * t + contrib;
      const low = startValue + (endLow - startValue) * t + contrib;
      const high = startValue + (endHigh - startValue) * t + contrib;
      const lo = Math.min(low, mean);
      const hi = Math.max(high, mean);

      result.push({
        date: format(addMonths(lastDate, i), 'yyyy-MM-dd'),
        value: null,
        price: null,
        isForecast: true,
        analystMean: Math.round(mean),
        analystLow: Math.round(lo),
        analystHigh: Math.round(hi),
        bandBase: Math.round(lo),
        bandSize: Math.round(hi - lo),
      });
    }

    const upside =
      startValue > 0 ? ((endMean - startValue) / startValue) * 100 : 0;

    return {
      chartData: result,
      todayDate: today,
      summary: {
        now: startValue,
        target: endMean,
        low: endLow,
        high: endHigh,
        upside,
        covered: Boolean(analyst.targetMean),
        rating: analyst.rating,
      },
    };
  }, [stock, monthlyContribution, analyst]);

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM yy');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload;
    return (
      <div className="glass-card p-3 text-xs border-emerald-glow/30 min-w-[180px]">
        <p className="text-steel mb-2 font-medium">{formatDate(label)}</p>
        {data?.isHistorical && data?.value != null && (
          <div className="flex justify-between mb-1">
            <span className="text-pearl">Position</span>
            <span className="font-mono text-pearl">{formatMoney(data.value)}</span>
          </div>
        )}
        {data?.isForecast && data?.analystMean != null && (
          <>
            <div className="flex justify-between">
              <span className="text-sapphire-bright">Mean target</span>
              <span className="font-mono text-sapphire-bright">{formatMoney(data.analystMean)}</span>
            </div>
            <div className="flex justify-between mt-1 text-[11px]">
              <span className="text-steel">Low / High</span>
              <span className="font-mono text-silver">
                {formatMoney(data.analystLow)} – {formatMoney(data.analystHigh)}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <div className="chart-container h-64 flex items-center justify-center">
        <p className="text-steel">No data available</p>
      </div>
    );
  }

  const upsidePositive = (summary?.upside || 0) >= 0;

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-pearl">{stock.symbol} Performance</h3>
          <p className="text-xs text-steel">
            History + 12M analyst target
            {monthlyContribution > 0 && ` · $${monthlyContribution}/mo`}
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-slate-dark/50 border border-slate-light/10 text-center">
            <p className="text-[10px] text-steel">Now</p>
            <p className="font-mono font-semibold text-pearl text-sm">{formatMoney(summary.now)}</p>
          </div>
          <div className="p-2 rounded-lg bg-sapphire/10 border border-sapphire/20 text-center">
            <p className="text-[10px] text-sapphire-bright">12M target</p>
            <p className="font-mono font-semibold text-sapphire-bright text-sm">
              {summary.covered ? formatMoney(summary.target) : '—'}
            </p>
          </div>
          <div
            className={`p-2 rounded-lg border text-center ${
              upsidePositive
                ? 'bg-emerald-glow/10 border-emerald-glow/20'
                : 'bg-ruby/10 border-ruby/20'
            }`}
          >
            <p className={`text-[10px] ${upsidePositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
              Upside
            </p>
            <p
              className={`font-mono font-semibold text-sm ${
                upsidePositive ? 'text-emerald-bright' : 'text-ruby-bright'
              }`}
            >
              {summary.covered
                ? `${upsidePositive ? '+' : ''}${summary.upside.toFixed(1)}%`
                : '—'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-slate-dark/50 border border-slate-light/10 text-center">
            <p className="text-[10px] text-steel">Rating</p>
            <p className="font-semibold text-silver text-sm">{summary.rating || 'N/A'}</p>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="stockHistGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="stockBandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.08} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.15)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tickFormatter={formatMoney}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={50}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#stockHistGradient)"
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="bandBase"
            stackId="band"
            stroke="none"
            fill="transparent"
            connectNulls
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="bandSize"
            stackId="band"
            stroke="none"
            fill="url(#stockBandFill)"
            connectNulls
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="analystMean"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
          {todayDate && (
            <ReferenceLine x={todayDate} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
