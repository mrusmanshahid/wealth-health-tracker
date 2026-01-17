import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { fetchQuarterlyEarnings } from '../services/stockApi';

export default function EarningsReport({ symbol, onClose }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    quarterly: true,
    metrics: true,
    estimates: true,
  });

  useEffect(() => {
    loadEarnings();
  }, [symbol]);

  async function loadEarnings() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuarterlyEarnings(symbol);
      if (data) {
        setEarnings(data);
      } else {
        setError('No earnings data available for this symbol');
      }
    } catch (err) {
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-slate-300">Loading earnings data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-400">
          <AlertCircle className="w-8 h-8 text-amber-400" />
          <span>{error}</span>
          <button 
            onClick={loadEarnings}
            className="mt-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center max-w-sm">
            Note: ETFs and some international stocks may not have earnings data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quarterly Earnings Section */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => toggleSection('quarterly')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="font-semibold text-white">Quarterly Earnings</span>
          </div>
          {expandedSections.quarterly ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {expandedSections.quarterly && earnings?.quarterlyEarnings?.length > 0 && (
          <div className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                    <th className="text-left py-2 font-medium">Quarter</th>
                    <th className="text-right py-2 font-medium">Actual EPS</th>
                    <th className="text-right py-2 font-medium">Estimate</th>
                    <th className="text-right py-2 font-medium">Surprise</th>
                    <th className="text-center py-2 font-medium">Beat</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.quarterlyEarnings.map((q, idx) => (
                    <tr 
                      key={idx} 
                      className="border-b border-slate-700/30 last:border-0"
                    >
                      <td className="py-3 text-sm font-medium text-white">{q.quarter}</td>
                      <td className="py-3 text-sm text-right text-white">
                        ${q.actual?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="py-3 text-sm text-right text-slate-400">
                        ${q.estimate?.toFixed(2) || 'N/A'}
                      </td>
                      <td className={`py-3 text-sm text-right ${
                        q.surprise > 0 ? 'text-emerald-400' : q.surprise < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {q.surprise > 0 ? '+' : ''}{q.surprise}%
                      </td>
                      <td className="py-3 text-center">
                        {q.beat ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {expandedSections.quarterly && (!earnings?.quarterlyEarnings || earnings.quarterlyEarnings.length === 0) && (
          <div className="px-4 pb-4 text-sm text-slate-400 text-center">
            No quarterly earnings data available
          </div>
        )}
      </div>

      {/* Estimates Section */}
      {(earnings?.estimates?.currentQuarter || earnings?.estimates?.nextQuarter) && (
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <button
            onClick={() => toggleSection('estimates')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/20">
                <Target className="w-5 h-5 text-violet-400" />
              </div>
              <span className="font-semibold text-white">Upcoming Estimates</span>
            </div>
            {expandedSections.estimates ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {expandedSections.estimates && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {earnings.estimates.currentQuarter && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-2">Current Quarter</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">EPS Est.</span>
                      <span className="text-sm text-white font-medium">
                        {earnings.estimates.currentQuarter.epsEstimate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Revenue Est.</span>
                      <span className="text-sm text-white font-medium">
                        {earnings.estimates.currentQuarter.revenueEstimate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Growth</span>
                      <span className={`text-sm font-medium ${
                        earnings.estimates.currentQuarter.growth?.includes('-') 
                          ? 'text-rose-400' 
                          : 'text-emerald-400'
                      }`}>
                        {earnings.estimates.currentQuarter.growth}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {earnings.estimates.nextQuarter && (
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                  <div className="text-xs text-slate-400 mb-2">Next Quarter</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">EPS Est.</span>
                      <span className="text-sm text-white font-medium">
                        {earnings.estimates.nextQuarter.epsEstimate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Revenue Est.</span>
                      <span className="text-sm text-white font-medium">
                        {earnings.estimates.nextQuarter.revenueEstimate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">Growth</span>
                      <span className={`text-sm font-medium ${
                        earnings.estimates.nextQuarter.growth?.includes('-') 
                          ? 'text-rose-400' 
                          : 'text-emerald-400'
                      }`}>
                        {earnings.estimates.nextQuarter.growth}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Financial Metrics Section */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => toggleSection('metrics')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-semibold text-white">Financial Metrics</span>
          </div>
          {expandedSections.metrics ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {expandedSections.metrics && earnings?.metrics && (
          <div className="px-4 pb-4 space-y-4">
            {/* Revenue & Profitability */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Revenue & Profitability</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MetricCard label="Revenue" value={earnings.metrics.revenue} />
                <MetricCard label="Gross Margin" value={earnings.metrics.grossMargins} />
                <MetricCard label="Operating Margin" value={earnings.metrics.operatingMargins} />
                <MetricCard label="Profit Margin" value={earnings.metrics.profitMargins} />
              </div>
            </div>

            {/* Per Share */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Per Share</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <MetricCard label="EPS" value={earnings.metrics.earningsPerShare} />
                <MetricCard label="Revenue/Share" value={earnings.metrics.revenuePerShare} />
                <MetricCard label="Book Value" value={earnings.metrics.bookValue} />
              </div>
            </div>

            {/* Valuation */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Valuation</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <MetricCard label="P/E Ratio" value={earnings.metrics.peRatio} />
                <MetricCard label="PEG Ratio" value={earnings.metrics.pegRatio} />
                <MetricCard label="Price/Book" value={earnings.metrics.priceToBook} />
              </div>
            </div>

            {/* Growth */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Growth</div>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard 
                  label="Earnings Growth" 
                  value={earnings.metrics.earningsGrowth} 
                  highlight={!earnings.metrics.earningsGrowth?.includes('-')}
                />
                <MetricCard 
                  label="Revenue Growth" 
                  value={earnings.metrics.revenueGrowth}
                  highlight={!earnings.metrics.revenueGrowth?.includes('-')}
                />
              </div>
            </div>

            {/* Balance Sheet */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Balance Sheet</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <MetricCard label="Total Cash" value={earnings.metrics.totalCash} />
                <MetricCard label="Total Debt" value={earnings.metrics.totalDebt} />
                <MetricCard label="Debt/Equity" value={earnings.metrics.debtToEquity} />
              </div>
            </div>

            {/* Returns & Dividend */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Returns & Dividend</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MetricCard label="ROE" value={earnings.metrics.returnOnEquity} />
                <MetricCard label="ROA" value={earnings.metrics.returnOnAssets} />
                <MetricCard label="Dividend Yield" value={earnings.metrics.dividendYield} />
                <MetricCard label="Dividend Rate" value={earnings.metrics.dividendRate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight }) {
  const isNA = value === 'N/A' || !value;
  const isNegative = typeof value === 'string' && value.includes('-');
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-sm font-medium ${
        isNA ? 'text-slate-500' : 
        highlight ? 'text-emerald-400' :
        isNegative ? 'text-rose-400' : 
        'text-white'
      }`}>
        {value || 'N/A'}
      </div>
    </div>
  );
}

