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

export default function WealthChart({ wealthData, monthlyContribution, stocks }) {
  // Calculate growth rates from historical data with outlier protection
  const growthRates = useMemo(() => {
    const DEFAULT_RATES = { recent: 0.08, fiveYear: 0.10, tenYear: 0.10 };
    const MIN_RATE = -0.15; // Cap at -15% annual
    const MAX_RATE = 0.35;  // Cap at 35% annual (very high but possible for growth stocks)
    
    if (!wealthData || wealthData.length < 12) {
      return DEFAULT_RATES;
    }

    const historicalData = wealthData.filter(d => !d.isForecast && d.value > 0);
    if (historicalData.length < 12) {
      return DEFAULT_RATES;
    }

    // Helper to calculate CAGR with bounds
    const calcBoundedCAGR = (startValue, endValue, periods) => {
      if (startValue <= 0 || endValue <= 0 || periods <= 0) return 0.08;
      const rate = Math.pow(endValue / startValue, 12 / periods) - 1;
      return Math.max(MIN_RATE, Math.min(MAX_RATE, rate));
    };

    // Helper to calculate median monthly returns (more robust to outliers)
    const calcMedianGrowth = (data) => {
      if (data.length < 2) return 0.08;
      
      const monthlyReturns = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i - 1].value > 0) {
          const monthlyReturn = (data[i].value - data[i - 1].value) / data[i - 1].value;
          // Filter extreme monthly moves (> 20% monthly is likely an outlier or contribution)
          if (monthlyReturn > -0.20 && monthlyReturn < 0.20) {
            monthlyReturns.push(monthlyReturn);
          }
        }
      }
      
      if (monthlyReturns.length === 0) return 0.08;
      
      // Get median
      monthlyReturns.sort((a, b) => a - b);
      const mid = Math.floor(monthlyReturns.length / 2);
      const medianMonthly = monthlyReturns.length % 2 === 0
        ? (monthlyReturns[mid - 1] + monthlyReturns[mid]) / 2
        : monthlyReturns[mid];
      
      // Annualize and bound
      const annualRate = medianMonthly * 12;
      return Math.max(MIN_RATE, Math.min(MAX_RATE, annualRate));
    };

    // Recent (last 12 months) - use median for stability
    const recent12 = historicalData.slice(-12);
    const recentRate = calcMedianGrowth(recent12);

    // 5-year (last 60 months) - blend CAGR and median
    const recent60 = historicalData.slice(-60);
    const fiveYearCAGR = recent60.length >= 12 
      ? calcBoundedCAGR(recent60[0].value, recent60[recent60.length - 1].value, recent60.length)
      : recentRate;
    const fiveYearMedian = calcMedianGrowth(recent60);
    const fiveYearRate = (fiveYearCAGR * 0.4 + fiveYearMedian * 0.6); // Weight median more

    // 10-year (full history) - blend CAGR and median
    const tenYearCAGR = historicalData.length >= 12
      ? calcBoundedCAGR(historicalData[0].value, historicalData[historicalData.length - 1].value, historicalData.length)
      : fiveYearRate;
    const tenYearMedian = calcMedianGrowth(historicalData);
    const tenYearRate = (tenYearCAGR * 0.4 + tenYearMedian * 0.6);

    // Apply weighted blend for final rates (recent gets less weight for long-term projection)
    return {
      recent: Math.max(MIN_RATE, Math.min(MAX_RATE, recentRate)),
      fiveYear: Math.max(MIN_RATE, Math.min(MAX_RATE, fiveYearRate)),
      tenYear: Math.max(MIN_RATE, Math.min(MAX_RATE, tenYearRate)),
    };
  }, [wealthData]);

  const chartData = useMemo(() => {
    if (!wealthData || wealthData.length === 0) return [];

    const historicalData = wealthData.filter(d => !d.isForecast);
    if (historicalData.length === 0) return wealthData;

    const lastHistorical = historicalData[historicalData.length - 1];
    const lastValue = lastHistorical.value;
    const lastContributions = lastHistorical.contributions;
    const lastDate = new Date(lastHistorical.date);

    // Build chart data with 3 projection lines
    const result = historicalData.map(d => ({
      ...d,
      recentProjection: null,
      fiveYearProjection: null,
      tenYearProjection: null,
    }));

    // Add connecting point for projections
    result[result.length - 1] = {
      ...result[result.length - 1],
      recentProjection: lastValue,
      fiveYearProjection: lastValue,
      tenYearProjection: lastValue,
    };

    // Project 5 years (60 months)
    let recentValue = lastValue;
    let fiveYearValue = lastValue;
    let tenYearValue = lastValue;
    let contributions = lastContributions;

    const monthlyRecentRate = growthRates.recent / 12;
    const monthlyFiveYearRate = growthRates.fiveYear / 12;
    const monthlyTenYearRate = growthRates.tenYear / 12;

    for (let i = 1; i <= 60; i++) {
      const futureDate = addMonths(lastDate, i);
      
      // Apply growth and add monthly contribution
      recentValue = recentValue * (1 + monthlyRecentRate) + monthlyContribution;
      fiveYearValue = fiveYearValue * (1 + monthlyFiveYearRate) + monthlyContribution;
      tenYearValue = tenYearValue * (1 + monthlyTenYearRate) + monthlyContribution;
      contributions += monthlyContribution;

      result.push({
        date: format(futureDate, 'yyyy-MM-dd'),
        value: null,
        contributions: contributions,
        isForecast: true,
        recentProjection: Math.round(recentValue),
        fiveYearProjection: Math.round(fiveYearValue),
        tenYearProjection: Math.round(tenYearValue),
      });
    }

    return result;
  }, [wealthData, monthlyContribution, growthRates]);

  const todayIndex = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return chartData.findIndex(d => d.date > today) - 1;
  }, [chartData]);

  // Get final projected values
  const finalProjections = useMemo(() => {
    if (chartData.length === 0) return null;
    const last = chartData[chartData.length - 1];
    return {
      recent: last.recentProjection,
      fiveYear: last.fiveYearProjection,
      tenYear: last.tenYearProjection,
      contributions: last.contributions,
    };
  }, [chartData]);

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value?.toFixed(0) || 0}`;
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    const isHistorical = !data?.isForecast && data?.value;

    return (
      <div className="glass-card p-4 text-sm border-emerald-glow/30 min-w-[200px]">
        <p className="text-steel mb-3 font-medium">{formatDate(label)}</p>
        <div className="space-y-2">
          {isHistorical && data?.value && (
            <div className="flex justify-between">
              <span className="text-silver">Portfolio Value:</span>
              <span className="font-mono font-semibold text-emerald-bright">
                {formatValue(data.value)}
              </span>
            </div>
          )}
          {data?.recentProjection && (
            <div className="flex justify-between">
              <span className="text-emerald-pale">Recent ({(growthRates.recent * 100).toFixed(0)}%):</span>
              <span className="font-mono text-emerald-bright">
                {formatValue(data.recentProjection)}
              </span>
            </div>
          )}
          {data?.fiveYearProjection && (
            <div className="flex justify-between">
              <span className="text-sapphire-bright">5Y Avg ({(growthRates.fiveYear * 100).toFixed(0)}%):</span>
              <span className="font-mono text-sapphire-bright">
                {formatValue(data.fiveYearProjection)}
              </span>
            </div>
          )}
          {data?.tenYearProjection && (
            <div className="flex justify-between">
              <span className="text-violet-bright">10Y Avg ({(growthRates.tenYear * 100).toFixed(0)}%):</span>
              <span className="font-mono text-violet-bright">
                {formatValue(data.tenYearProjection)}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-slate-light/30">
            <span className="text-silver">Contributions:</span>
            <span className="font-mono text-pearl">
              {formatValue(data?.contributions)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-container h-96 flex items-center justify-center">
        <p className="text-steel">Add stocks to see wealth projection</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-pearl">Wealth Growth</h3>
          <p className="text-sm text-steel mt-1">
            Historical performance & 5-year projections
            {monthlyContribution > 0 && ` • $${monthlyContribution.toLocaleString()}/mo contribution`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-bright"></div>
            <span className="text-steel">Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-emerald-bright"></div>
            <span className="text-steel">Recent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-sapphire-bright"></div>
            <span className="text-steel">5Y Avg</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-violet-bright"></div>
            <span className="text-steel">10Y Avg</span>
          </div>
        </div>
      </div>

      {/* Final Projections Summary */}
      {finalProjections && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg bg-slate-dark/50 border border-slate-light/10 text-center">
            <p className="text-xs text-steel mb-1">Contributions</p>
            <p className="font-mono font-semibold text-pearl">{formatValue(finalProjections.contributions)}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-glow/10 border border-emerald-glow/20 text-center">
            <p className="text-xs text-emerald-pale mb-1">Recent ({(growthRates.recent * 100).toFixed(0)}%)</p>
            <p className="font-mono font-semibold text-emerald-bright">{formatValue(finalProjections.recent)}</p>
          </div>
          <div className="p-3 rounded-lg bg-sapphire/10 border border-sapphire/20 text-center">
            <p className="text-xs text-sapphire-bright mb-1">5Y Avg ({(growthRates.fiveYear * 100).toFixed(0)}%)</p>
            <p className="font-mono font-semibold text-sapphire-bright">{formatValue(finalProjections.fiveYear)}</p>
          </div>
          <div className="p-3 rounded-lg bg-violet/10 border border-violet/20 text-center">
            <p className="text-xs text-violet-bright mb-1">10Y Avg ({(growthRates.tenYear * 100).toFixed(0)}%)</p>
            <p className="font-mono font-semibold text-violet-bright">{formatValue(finalProjections.tenYear)}</p>
          </div>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wealthHistoricalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(100, 116, 139, 0.15)"
            vertical={false}
          />
          
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
            tickFormatter={formatValue}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Historical wealth area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#wealthHistoricalGradient)"
            connectNulls={false}
            name="Historical"
          />

          {/* Contributions line */}
          <Line
            type="stepAfter"
            dataKey="contributions"
            stroke="#64748b"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
            name="Contributions"
          />
          
          {/* Recent projection line */}
          <Line
            type="monotone"
            dataKey="recentProjection"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="Recent"
          />
          
          {/* 5-Year projection line */}
          <Line
            type="monotone"
            dataKey="fiveYearProjection"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="5Y Avg"
          />
          
          {/* 10-Year projection line */}
          <Line
            type="monotone"
            dataKey="tenYearProjection"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="10Y Avg"
          />

          {/* Today marker */}
          {todayIndex >= 0 && chartData[todayIndex] && (
            <ReferenceLine 
              x={chartData[todayIndex].date} 
              stroke="#f59e0b" 
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ 
                value: 'Today', 
                position: 'top',
                fill: '#f59e0b',
                fontSize: 11,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
