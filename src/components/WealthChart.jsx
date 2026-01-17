import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';
import { format } from 'date-fns';

export default function WealthChart({ wealthData, monthlyContribution }) {
  const chartData = useMemo(() => {
    if (!wealthData || wealthData.length === 0) return [];
    return wealthData;
  }, [wealthData]);

  const todayIndex = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return chartData.findIndex(d => d.date > today) - 1;
  }, [chartData]);

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value.toFixed(0)}`;
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
    const gain = data?.value - data?.contributions;
    const gainPercent = data?.contributions > 0 ? (gain / data.contributions) * 100 : 0;

    return (
      <div className="glass-card p-4 text-sm border-emerald-glow/30 min-w-[180px]">
        <p className="text-steel mb-3 font-medium">{formatDate(label)}</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-silver">Portfolio Value:</span>
            <span className={`font-mono font-semibold ${data?.isForecast ? 'text-sapphire-bright' : 'text-emerald-bright'}`}>
              ${data?.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-silver">Contributions:</span>
            <span className="font-mono text-pearl">
              ${data?.contributions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-light/30">
            <span className="text-silver">Total Gain:</span>
            <span className={`font-mono ${gain >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
              {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
            </span>
          </div>
        </div>
        {data?.isForecast && (
          <p className="text-xs text-amber mt-2 italic">Projected value</p>
        )}
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

  // Split data for different styling
  const historicalData = chartData.filter(d => !d.isForecast);
  const forecastData = chartData.filter(d => d.isForecast);
  
  // Add connecting point
  if (historicalData.length > 0 && forecastData.length > 0) {
    forecastData.unshift(historicalData[historicalData.length - 1]);
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-pearl">Wealth Growth</h3>
          <p className="text-sm text-steel mt-1">
            Historical performance & 5-year forecast
            {monthlyContribution > 0 && ` • $${monthlyContribution.toLocaleString()}/mo contribution`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-bright"></div>
            <span className="text-steel">Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sapphire-bright"></div>
            <span className="text-steel">Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-violet-bright"></div>
            <span className="text-steel">Contributions</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wealthHistoricalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="wealthForecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
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
            dataKey={(d) => !d.isForecast ? d.value : null}
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#wealthHistoricalGradient)"
            connectNulls={false}
            name="Historical"
          />
          
          {/* Forecast wealth area */}
          <Area
            type="monotone"
            dataKey={(d) => d.isForecast ? d.value : null}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#wealthForecastGradient)"
            connectNulls={false}
            name="Forecast"
          />
          
          {/* Contributions line */}
          <Line
            type="stepAfter"
            dataKey="contributions"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="3 3"
            name="Contributions"
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

