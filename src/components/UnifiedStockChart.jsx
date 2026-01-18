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

export default function UnifiedStockChart({ stock, monthlyContribution = 0 }) {
  // Calculate growth rates from historical data
  const growthRates = useMemo(() => {
    const DEFAULT = { sixMonth: 0.08, oneYear: 0.08, fiveYear: 0.10, tenYear: 0.10 };
    const MIN_RATE = -0.15;
    const MAX_RATE = 0.35;
    
    if (!stock?.history || stock.history.length < 6) return DEFAULT;

    const history = stock.history;
    
    const calcBoundedCAGR = (startPrice, endPrice, months) => {
      if (startPrice <= 0 || endPrice <= 0 || months <= 0) return 0.08;
      const rate = Math.pow(endPrice / startPrice, 12 / months) - 1;
      return Math.max(MIN_RATE, Math.min(MAX_RATE, rate));
    };
    
    const calcMedianGrowth = (data) => {
      if (data.length < 2) return 0.08;
      const returns = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i - 1].price > 0) {
          const ret = (data[i].price - data[i - 1].price) / data[i - 1].price;
          if (ret > -0.20 && ret < 0.20) returns.push(ret);
        }
      }
      if (returns.length === 0) return 0.08;
      returns.sort((a, b) => a - b);
      const mid = Math.floor(returns.length / 2);
      const median = returns.length % 2 === 0 ? (returns[mid - 1] + returns[mid]) / 2 : returns[mid];
      return Math.max(MIN_RATE, Math.min(MAX_RATE, median * 12));
    };

    const recent6 = history.slice(-6);
    const recent12 = history.slice(-12);
    const recent60 = history.slice(-60);

    const sixMonth = calcMedianGrowth(recent6);
    const oneYear = calcMedianGrowth(recent12);
    
    const fiveYearCAGR = recent60.length >= 12 
      ? calcBoundedCAGR(recent60[0].price, recent60[recent60.length - 1].price, recent60.length)
      : oneYear;
    const fiveYear = Math.max(MIN_RATE, Math.min(MAX_RATE, fiveYearCAGR * 0.4 + calcMedianGrowth(recent60) * 0.6));
    
    const tenYearCAGR = history.length >= 12
      ? calcBoundedCAGR(history[0].price, history[history.length - 1].price, history.length)
      : fiveYear;
    const tenYear = Math.max(MIN_RATE, Math.min(MAX_RATE, tenYearCAGR * 0.4 + calcMedianGrowth(history) * 0.6));

    return { sixMonth, oneYear, fiveYear, tenYear };
  }, [stock?.history]);

  // Build unified chart data
  const { chartData, todayIndex, finalValues } = useMemo(() => {
    if (!stock?.history) return { chartData: [], todayIndex: -1, finalValues: null };

    const shares = stock.shares || (stock.investedAmount / stock.purchasePrice);
    const result = [];

    // Historical data - convert to portfolio value
    stock.history.forEach((h, i) => {
      result.push({
        date: h.date,
        value: h.price * shares,
        price: h.price,
        isHistorical: true,
      });
    });

    const lastHistorical = result[result.length - 1];
    const lastDate = new Date(lastHistorical.date);
    const lastValue = lastHistorical.value;
    const todayIdx = result.length - 1;

    // Initialize projections from last historical value
    let sixMonthValue = lastValue;
    let oneYearValue = lastValue;
    let fiveYearValue = lastValue;
    let tenYearValue = lastValue;

    // Bridge point - all projections start from current value
    result[todayIdx] = {
      ...result[todayIdx],
      sixMonthProj: lastValue,
      oneYearProj: lastValue,
      fiveYearProj: lastValue,
      tenYearProj: lastValue,
    };

    // Monthly rates
    const sixMonthRate = growthRates.sixMonth / 12;
    const oneYearRate = growthRates.oneYear / 12;
    const fiveYearRate = growthRates.fiveYear / 12;
    const tenYearRate = growthRates.tenYear / 12;

    // Project 5 years (60 months)
    for (let i = 1; i <= 60; i++) {
      const futureDate = addMonths(lastDate, i);
      
      // Apply growth
      sixMonthValue = sixMonthValue * (1 + sixMonthRate) + (monthlyContribution * shares / lastValue || 0);
      oneYearValue = oneYearValue * (1 + oneYearRate) + (monthlyContribution * shares / lastValue || 0);
      fiveYearValue = fiveYearValue * (1 + fiveYearRate) + (monthlyContribution * shares / lastValue || 0);
      tenYearValue = tenYearValue * (1 + tenYearRate) + (monthlyContribution * shares / lastValue || 0);

      // If monthly contribution exists, add it
      if (monthlyContribution > 0) {
        const addShares = monthlyContribution / (result[todayIdx].price * Math.pow(1 + tenYearRate, i));
        sixMonthValue += monthlyContribution;
        oneYearValue += monthlyContribution;
        fiveYearValue += monthlyContribution;
        tenYearValue += monthlyContribution;
      }

      result.push({
        date: format(futureDate, 'yyyy-MM-dd'),
        value: null,
        isForecast: true,
        sixMonthProj: Math.round(sixMonthValue),
        oneYearProj: Math.round(oneYearValue),
        fiveYearProj: Math.round(fiveYearValue),
        tenYearProj: Math.round(tenYearValue),
      });
    }

    return {
      chartData: result,
      todayIndex: todayIdx,
      finalValues: {
        sixMonth: result[result.length - 1].sixMonthProj,
        oneYear: result[result.length - 1].oneYearProj,
        fiveYear: result[result.length - 1].fiveYearProj,
        tenYear: result[result.length - 1].tenYearProj,
      }
    };
  }, [stock, monthlyContribution, growthRates]);

  const formatValue = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value?.toFixed(0) || 0}`;
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM yy');
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    const isHistorical = data?.isHistorical;

    return (
      <div className="glass-card p-3 text-xs border-emerald-glow/30 min-w-[180px]">
        <p className="text-steel mb-2 font-medium">{formatDate(label)}</p>
        {isHistorical && data?.value && (
          <div className="flex justify-between mb-1">
            <span className="text-pearl">Value:</span>
            <span className="font-mono text-pearl">{formatValue(data.value)}</span>
          </div>
        )}
        {data?.sixMonthProj && (
          <div className="flex justify-between">
            <span className="text-amber-400">6M ({(growthRates.sixMonth * 100).toFixed(0)}%):</span>
            <span className="font-mono text-amber-400">{formatValue(data.sixMonthProj)}</span>
          </div>
        )}
        {data?.oneYearProj && (
          <div className="flex justify-between">
            <span className="text-emerald-bright">1Y ({(growthRates.oneYear * 100).toFixed(0)}%):</span>
            <span className="font-mono text-emerald-bright">{formatValue(data.oneYearProj)}</span>
          </div>
        )}
        {data?.fiveYearProj && (
          <div className="flex justify-between">
            <span className="text-sapphire-bright">5Y ({(growthRates.fiveYear * 100).toFixed(0)}%):</span>
            <span className="font-mono text-sapphire-bright">{formatValue(data.fiveYearProj)}</span>
          </div>
        )}
        {data?.tenYearProj && (
          <div className="flex justify-between">
            <span className="text-violet-bright">10Y ({(growthRates.tenYear * 100).toFixed(0)}%):</span>
            <span className="font-mono text-violet-bright">{formatValue(data.tenYearProj)}</span>
          </div>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="chart-container h-64 flex items-center justify-center">
        <p className="text-steel">No data available</p>
      </div>
    );
  }

  const todayDate = chartData[todayIndex]?.date;

  return (
    <div className="chart-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-pearl">{stock.symbol} Performance</h3>
          <p className="text-xs text-steel">
            Historical & 5-year projections
            {monthlyContribution > 0 && ` • $${monthlyContribution}/mo`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-pearl"></div>
            <span className="text-steel">History</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-amber-400"></div>
            <span className="text-steel">6M</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-emerald-bright"></div>
            <span className="text-steel">1Y</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-sapphire-bright"></div>
            <span className="text-steel">5Y</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-violet-bright"></div>
            <span className="text-steel">10Y</span>
          </div>
        </div>
      </div>

      {/* Projection Summary Cards */}
      {finalValues && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-[10px] text-steel">6M Trend</p>
            <p className="font-mono font-semibold text-amber-400 text-sm">{formatValue(finalValues.sixMonth)}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-[10px] text-steel">1Y Trend</p>
            <p className="font-mono font-semibold text-emerald-bright text-sm">{formatValue(finalValues.oneYear)}</p>
          </div>
          <div className="p-2 rounded-lg bg-sapphire/10 border border-sapphire/20 text-center">
            <p className="text-[10px] text-steel">5Y Avg</p>
            <p className="font-mono font-semibold text-sapphire-bright text-sm">{formatValue(finalValues.fiveYear)}</p>
          </div>
          <div className="p-2 rounded-lg bg-violet/10 border border-violet/20 text-center">
            <p className="text-[10px] text-steel">10Y Avg</p>
            <p className="font-mono font-semibold text-violet-bright text-sm">{formatValue(finalValues.tenYear)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="stockHistGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f8fafc" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f8fafc" stopOpacity={0} />
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
            tickFormatter={formatValue}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          
          <Tooltip content={<CustomTooltip />} />

          {/* Historical area */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#f8fafc"
            strokeWidth={2}
            fill="url(#stockHistGradient)"
            connectNulls={false}
          />

          {/* Projection lines */}
          <Line type="monotone" dataKey="sixMonthProj" stroke="#f59e0b" strokeWidth={1.5} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="oneYearProj" stroke="#10b981" strokeWidth={1.5} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="fiveYearProj" stroke="#3b82f6" strokeWidth={1.5} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="tenYearProj" stroke="#8b5cf6" strokeWidth={1.5} dot={false} connectNulls={false} />

          {/* Today marker */}
          {todayDate && (
            <ReferenceLine x={todayDate} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

