import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, addMonths } from 'date-fns';
import { normalizeAnalyst } from '../utils/forecasting';

function formatMoney(value) {
  if (value == null || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 10000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString()}`;
}

/**
 * 12-month path of new monthly contributions, grown at the analyst implied return.
 */
export default function ContributionGrowthChart({ stock, monthlyContribution, fullWidth = false }) {
  const chartData = useMemo(() => {
    if (!monthlyContribution || monthlyContribution <= 0) return null;

    const price = stock?.currentPrice || stock?.history?.[stock.history.length - 1]?.price || 0;
    const analyst = normalizeAnalyst(stock?.analyst, price);
    // Implied annual return from mean target; fall back to modest 8% if no coverage
    const annualRate =
      analyst.targetMean && price > 0
        ? (analyst.targetMean - price) / price
        : 0.08;
    const monthlyRate = annualRate / 12;

    const data = [];
    let value = 0;
    let contributions = 0;
    const start = new Date();

    for (let i = 0; i <= 12; i++) {
      if (i === 0) {
        value = monthlyContribution;
        contributions = monthlyContribution;
      } else {
        value = value * (1 + monthlyRate) + monthlyContribution;
        contributions += monthlyContribution;
      }
      data.push({
        month: i,
        date: format(addMonths(start, i), 'MMM yy'),
        value: Math.round(value),
        contributions: Math.round(contributions),
      });
    }

    return {
      data,
      annualRatePct: annualRate * 100,
      finalValue: data[data.length - 1].value,
      contributions: data[data.length - 1].contributions,
      usedAnalyst: Boolean(analyst.targetMean),
    };
  }, [stock, monthlyContribution]);

  if (!chartData) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="glass-card p-3 text-xs border-slate-light/30 min-w-[150px]">
        <p className="text-silver font-medium mb-2">{d?.date || label}</p>
        <div className="flex justify-between gap-4">
          <span className="text-sapphire-bright">Grown value</span>
          <span className="font-mono">{formatMoney(d?.value)}</span>
        </div>
        <div className="flex justify-between gap-4 mt-1">
          <span className="text-steel">Contributed</span>
          <span className="font-mono">{formatMoney(d?.contributions)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={fullWidth ? '' : 'mt-4 pt-4 border-t border-slate-light/20'}>
      {!fullWidth && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-steel uppercase tracking-wide">
            12M contribution path (${monthlyContribution}/mo)
          </p>
          <p className="text-[10px] text-steel">
            {chartData.usedAnalyst ? 'Analyst-implied' : 'Default'}{' '}
            {chartData.annualRatePct >= 0 ? '+' : ''}
            {chartData.annualRatePct.toFixed(1)}%/yr
          </p>
        </div>
      )}

      <div className={fullWidth ? 'h-64' : 'h-32 -mx-2'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData.data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="month"
              tick={false}
              axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
              tickLine={false}
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="contributions"
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
        <div className="text-center p-2 rounded-lg bg-slate-dark/40">
          <p className="text-steel mb-0.5">Contributed</p>
          <p className="font-mono text-pearl">{formatMoney(chartData.contributions)}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-sapphire/10">
          <p className="text-sapphire-bright mb-0.5">At 12M</p>
          <p className="font-mono text-sapphire-bright">{formatMoney(chartData.finalValue)}</p>
        </div>
      </div>
    </div>
  );
}
