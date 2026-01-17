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
import { format } from 'date-fns';

export default function PortfolioChart({ stock, showForecast = true }) {
  const chartData = useMemo(() => {
    if (!stock?.history) return [];
    
    const historical = stock.history.map(h => ({
      date: h.date,
      price: h.price,
      type: 'historical',
    }));
    
    if (showForecast && stock.forecast) {
      // Add bridge point
      const lastHistorical = historical[historical.length - 1];
      if (lastHistorical) {
        historical[historical.length - 1] = {
          ...lastHistorical,
          forecastPrice: lastHistorical.price,
          forecastLow: lastHistorical.price,
          forecastHigh: lastHistorical.price,
        };
      }
      
      const forecast = stock.forecast.map((f, i) => ({
        date: f.date,
        forecastPrice: f.price,
        forecastLow: stock.confidence?.low?.[i]?.price,
        forecastHigh: stock.confidence?.high?.[i]?.price,
        type: 'forecast',
      }));
      
      return [...historical, ...forecast];
    }
    
    return historical;
  }, [stock, showForecast]);

  const todayLine = useMemo(() => {
    if (!stock?.history) return null;
    const lastHistorical = stock.history[stock.history.length - 1];
    return lastHistorical?.date;
  }, [stock]);

  const formatPrice = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
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
    const isForecast = data?.type === 'forecast';

    return (
      <div className="glass-card p-3 text-sm border-emerald-glow/30">
        <p className="text-steel mb-2">{formatDate(label)}</p>
        {data?.price && (
          <p className="text-emerald-bright font-mono">
            Price: ${data.price.toFixed(2)}
          </p>
        )}
        {data?.forecastPrice && (
          <p className="text-sapphire-bright font-mono">
            Forecast: ${data.forecastPrice.toFixed(2)}
          </p>
        )}
        {isForecast && data?.forecastLow && data?.forecastHigh && (
          <p className="text-steel text-xs mt-1">
            Range: ${data.forecastLow.toFixed(0)} - ${data.forecastHigh.toFixed(0)}
          </p>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-container h-80 flex items-center justify-center">
        <p className="text-steel">No data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-pearl">{stock.symbol}</h3>
          <p className="text-sm text-steel">{stock.name}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-emerald-bright rounded"></div>
            <span className="text-steel">Historical</span>
          </div>
          {showForecast && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-sapphire-bright rounded" style={{ borderStyle: 'dashed' }}></div>
              <span className="text-steel">Forecast</span>
            </div>
          )}
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
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
            tickFormatter={formatPrice}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Confidence band */}
          {showForecast && (
            <Area
              type="monotone"
              dataKey="forecastHigh"
              stroke="none"
              fill="url(#confidenceGradient)"
              connectNulls={false}
            />
          )}
          
          {/* Historical area */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#historicalGradient)"
            connectNulls={false}
          />
          
          {/* Forecast line */}
          {showForecast && (
            <Line
              type="monotone"
              dataKey="forecastPrice"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
            />
          )}

          {/* Today marker */}
          {todayLine && (
            <ReferenceLine 
              x={todayLine} 
              stroke="#f59e0b" 
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

