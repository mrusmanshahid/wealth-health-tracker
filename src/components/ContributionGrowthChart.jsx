import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, addMonths } from 'date-fns';

export default function ContributionGrowthChart({ stock, monthlyContribution, fullWidth = false }) {
  const chartData = useMemo(() => {
    if (!monthlyContribution || monthlyContribution <= 0 || !stock.history || stock.history.length < 12) {
      return null;
    }

    const history = stock.history;
    const currentPrice = stock.currentPrice || history[history.length - 1]?.price || 0;
    
    const MIN_RATE = -0.15; // -15% annual floor
    const MAX_RATE = 0.35;  // 35% annual cap
    
    // Helper to calculate bounded CAGR
    const calcBoundedCAGR = (startPrice, endPrice, months) => {
      if (startPrice <= 0 || endPrice <= 0 || months <= 0) return 0.08;
      const rate = Math.pow(endPrice / startPrice, 12 / months) - 1;
      return Math.max(MIN_RATE, Math.min(MAX_RATE, rate));
    };
    
    // Helper to calculate median monthly returns
    const calcMedianGrowth = (data) => {
      if (data.length < 2) return 0.08;
      
      const monthlyReturns = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i - 1].price > 0) {
          const ret = (data[i].price - data[i - 1].price) / data[i - 1].price;
          if (ret > -0.20 && ret < 0.20) monthlyReturns.push(ret);
        }
      }
      
      if (monthlyReturns.length === 0) return 0.08;
      monthlyReturns.sort((a, b) => a - b);
      const mid = Math.floor(monthlyReturns.length / 2);
      const median = monthlyReturns.length % 2 === 0
        ? (monthlyReturns[mid - 1] + monthlyReturns[mid]) / 2
        : monthlyReturns[mid];
      
      return Math.max(MIN_RATE, Math.min(MAX_RATE, median * 12));
    };
    
    // Calculate different growth rates with outlier protection
    // 1. Recent growth (last 12 months)
    const recent12 = history.slice(-12);
    const recentGrowthRate = calcMedianGrowth(recent12);
    
    // 2. 5-year average growth (blend CAGR and median)
    const recent60 = history.slice(-60);
    const fiveYearCAGR = recent60.length >= 12
      ? calcBoundedCAGR(recent60[0].price, recent60[recent60.length - 1].price, recent60.length)
      : recentGrowthRate;
    const fiveYearMedian = calcMedianGrowth(recent60);
    const fiveYearGrowthRate = Math.max(MIN_RATE, Math.min(MAX_RATE, fiveYearCAGR * 0.4 + fiveYearMedian * 0.6));
    
    // 3. 10-year average growth (blend CAGR and median)
    const tenYearCAGR = history.length >= 12
      ? calcBoundedCAGR(history[0].price, history[history.length - 1].price, history.length)
      : fiveYearGrowthRate;
    const tenYearMedian = calcMedianGrowth(history);
    const tenYearGrowthRate = Math.max(MIN_RATE, Math.min(MAX_RATE, tenYearCAGR * 0.4 + tenYearMedian * 0.6));

    // Project 5 years (60 months)
    const projectionMonths = 60;
    const data = [];
    const startDate = new Date();
    
    let lastPriceValue = 0;
    let fiveYearValue = 0;
    let tenYearValue = 0;
    
    // Monthly growth rates
    const lastPriceMonthlyRate = recentGrowthRate;
    const fiveYearMonthlyRate = fiveYearGrowthRate;
    const tenYearMonthlyRate = tenYearGrowthRate;

    for (let i = 0; i <= projectionMonths; i++) {
      const date = addMonths(startDate, i);
      
      // Each month: add contribution and apply growth
      if (i === 0) {
        lastPriceValue = monthlyContribution;
        fiveYearValue = monthlyContribution;
        tenYearValue = monthlyContribution;
      } else {
        // Apply monthly growth to existing value, then add new contribution
        lastPriceValue = lastPriceValue * (1 + lastPriceMonthlyRate / 12) + monthlyContribution;
        fiveYearValue = fiveYearValue * (1 + fiveYearMonthlyRate / 12) + monthlyContribution;
        tenYearValue = tenYearValue * (1 + tenYearMonthlyRate / 12) + monthlyContribution;
      }
      
      data.push({
        date: format(date, 'MMM yyyy'),
        month: i,
        lastPrice: Math.round(lastPriceValue),
        fiveYear: Math.round(fiveYearValue),
        tenYear: Math.round(tenYearValue),
        contributions: monthlyContribution * (i + 1),
      });
    }

    return {
      data,
      rates: {
        lastPrice: (recentGrowthRate * 100).toFixed(1),
        fiveYear: (fiveYearGrowthRate * 100).toFixed(1),
        tenYear: (tenYearGrowthRate * 100).toFixed(1),
      },
      finalValues: {
        lastPrice: data[data.length - 1].lastPrice,
        fiveYear: data[data.length - 1].fiveYear,
        tenYear: data[data.length - 1].tenYear,
        contributions: data[data.length - 1].contributions,
      }
    };
  }, [stock, monthlyContribution]);

  if (!chartData) {
    return null;
  }

  const formatValue = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="glass-card p-3 text-xs border-slate-light/30">
        <p className="text-silver font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono">{formatValue(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={fullWidth ? '' : 'mt-4 pt-4 border-t border-slate-light/20'}>
      {!fullWidth && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-steel uppercase tracking-wide">
            5Y Growth Projection (${monthlyContribution}/mo)
          </p>
        </div>
      )}
      
      {/* Chart */}
      <div className={fullWidth ? 'h-64' : 'h-32 -mx-2'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData.data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis 
              dataKey="month" 
              tick={false}
              axisLine={{ stroke: 'rgba(100, 116, 139, 0.2)' }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Contributions baseline */}
            <Line
              type="monotone"
              dataKey="contributions"
              name="Contributions"
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
            />
            
            {/* 10-year avg */}
            <Line
              type="monotone"
              dataKey="tenYear"
              name={`10Y Avg (${chartData.rates.tenYear}%)`}
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
            />
            
            {/* 5-year avg */}
            <Line
              type="monotone"
              dataKey="fiveYear"
              name={`5Y Avg (${chartData.rates.fiveYear}%)`}
              stroke="#3b82f6"
              strokeWidth={1.5}
              dot={false}
            />
            
            {/* Recent/Last price */}
            <Line
              type="monotone"
              dataKey="lastPrice"
              name={`Recent (${chartData.rates.lastPrice}%)`}
              stroke="#10b981"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with values */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-bright"></div>
            <span className="text-steel">Recent</span>
          </div>
          <p className="font-mono text-emerald-bright">{formatValue(chartData.finalValues.lastPrice)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-sapphire"></div>
            <span className="text-steel">5Y Avg</span>
          </div>
          <p className="font-mono text-sapphire-bright">{formatValue(chartData.finalValues.fiveYear)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-violet"></div>
            <span className="text-steel">10Y Avg</span>
          </div>
          <p className="font-mono text-violet-bright">{formatValue(chartData.finalValues.tenYear)}</p>
        </div>
      </div>
      
      <p className="text-center text-xs text-steel mt-2">
        Total contributions: {formatValue(chartData.finalValues.contributions)}
      </p>
    </div>
  );
}

