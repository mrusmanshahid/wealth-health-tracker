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
  Zap,
  Shield,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { fetchQuarterlyEarnings } from '../services/stockApi';

export default function EarningsReport({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    recommendation: true,
    outlook: true,
    metrics: true,
    company: true,
  });

  useEffect(() => {
    loadData();
  }, [symbol]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchQuarterlyEarnings(symbol);
      if (result) {
        setData(result);
      } else {
        setError('No financial data available for this symbol');
      }
    } catch (err) {
      setError('Failed to load financial data');
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

  const getDirectionIcon = (direction) => {
    if (direction === 'Bullish') return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    if (direction === 'Bearish') return <ArrowDownRight className="w-4 h-4 text-rose-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getDirectionColor = (direction) => {
    if (direction === 'Bullish') return 'text-emerald-400';
    if (direction === 'Bearish') return 'text-rose-400';
    return 'text-slate-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-slate-300">Loading financial insights...</span>
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
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center max-w-sm">
            Note: ETFs and some international stocks may not have insights available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analyst Recommendation */}
      {data?.recommendation?.rating && (
        <div className="bg-gradient-to-r from-violet-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-violet-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-violet-500/30">
              <Target className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Analyst Recommendation</h3>
              <p className="text-xs text-slate-400">Source: {data.recommendation.provider}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Rating</div>
              <div className={`text-2xl font-bold ${
                data.recommendation.rating === 'BUY' ? 'text-emerald-400' :
                data.recommendation.rating === 'SELL' ? 'text-rose-400' :
                'text-amber-400'
              }`}>
                {data.recommendation.rating}
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <div className="text-xs text-slate-400 mb-1">Target Price</div>
              <div className="text-2xl font-bold text-cyan-400">
                ${data.recommendation.targetPrice}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technical Outlook */}
      {data?.outlook && (
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <button
            onClick={() => toggleSection('outlook')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="font-semibold text-white">Technical Outlook</span>
            </div>
            {expandedSections.outlook ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          {expandedSections.outlook && (
            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Short Term */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Short Term</span>
                  {getDirectionIcon(data.outlook.shortTerm.direction)}
                </div>
                <div className={`text-lg font-semibold ${getDirectionColor(data.outlook.shortTerm.direction)}`}>
                  {data.outlook.shortTerm.direction}
                </div>
                <div className="text-xs text-slate-500 mt-1">{data.outlook.shortTerm.score}</div>
                <p className="text-xs text-slate-400 mt-2">{data.outlook.shortTerm.description}</p>
              </div>
              
              {/* Mid Term */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Mid Term</span>
                  {getDirectionIcon(data.outlook.midTerm.direction)}
                </div>
                <div className={`text-lg font-semibold ${getDirectionColor(data.outlook.midTerm.direction)}`}>
                  {data.outlook.midTerm.direction}
                </div>
                <div className="text-xs text-slate-500 mt-1">{data.outlook.midTerm.score}</div>
                <p className="text-xs text-slate-400 mt-2">{data.outlook.midTerm.description}</p>
              </div>
              
              {/* Long Term */}
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Long Term</span>
                  {getDirectionIcon(data.outlook.longTerm.direction)}
                </div>
                <div className={`text-lg font-semibold ${getDirectionColor(data.outlook.longTerm.direction)}`}>
                  {data.outlook.longTerm.direction}
                </div>
                <div className="text-xs text-slate-500 mt-1">{data.outlook.longTerm.score}</div>
                <p className="text-xs text-slate-400 mt-2">{data.outlook.longTerm.description}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Technicals & Valuation */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => toggleSection('metrics')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-semibold text-white">Key Levels & Valuation</span>
          </div>
          {expandedSections.metrics ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {expandedSections.metrics && data?.metrics && (
          <div className="px-4 pb-4 space-y-4">
            {/* Technical Levels */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Technical Levels</div>
              <div className="grid grid-cols-3 gap-2">
                <MetricCard label="Support" value={data.metrics.support} highlight={true} />
                <MetricCard label="Resistance" value={data.metrics.resistance} />
                <MetricCard label="Stop Loss" value={data.metrics.stopLoss} negative={true} />
              </div>
            </div>

            {/* Valuation */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Valuation</div>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard label="Fair Value Assessment" value={data.metrics.valuation} />
                <MetricCard 
                  label="Discount/Premium" 
                  value={data.metrics.discount} 
                  highlight={data.metrics.discount?.includes('-')}
                />
              </div>
            </div>

            {/* Sector */}
            {data.metrics.sector !== 'N/A' && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Sector</div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {data.metrics.sector}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Company Scores */}
      <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <button
          onClick={() => toggleSection('company')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-semibold text-white">Company Scores</span>
          </div>
          {expandedSections.company ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {expandedSections.company && data?.metrics && (
          <div className="px-4 pb-4">
            <p className="text-xs text-slate-500 mb-3">Percentile rank vs sector peers</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <ScoreCard label="Innovativeness" value={data.metrics.innovativeness} />
              <ScoreCard label="Hiring Activity" value={data.metrics.hiring} />
              <ScoreCard label="Sustainability" value={data.metrics.sustainability} />
              <ScoreCard label="Insider Sentiment" value={data.metrics.insiderSentiment} />
              <ScoreCard label="Earnings Reports" value={data.metrics.earningsReports} />
              <ScoreCard label="Dividends" value={data.metrics.dividends} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight, negative }) {
  const isNA = value === 'N/A' || !value;
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-sm font-medium ${
        isNA ? 'text-slate-500' : 
        negative ? 'text-rose-400' :
        highlight ? 'text-emerald-400' : 
        'text-white'
      }`}>
        {value || 'N/A'}
      </div>
    </div>
  );
}

function ScoreCard({ label, value }) {
  const isNA = value === 'N/A' || !value;
  const numValue = parseInt(value) || 0;
  
  // Color based on percentile
  const getColor = () => {
    if (isNA) return 'text-slate-500';
    if (numValue >= 80) return 'text-emerald-400';
    if (numValue >= 60) return 'text-cyan-400';
    if (numValue >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };
  
  const getBgColor = () => {
    if (isNA) return 'bg-slate-700/30';
    if (numValue >= 80) return 'bg-emerald-500/20';
    if (numValue >= 60) return 'bg-cyan-500/20';
    if (numValue >= 40) return 'bg-amber-500/20';
    return 'bg-rose-500/20';
  };
  
  return (
    <div className={`rounded-lg p-3 border border-slate-700/30 ${getBgColor()}`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-lg font-bold ${getColor()}`}>
        {value || 'N/A'}
      </div>
      {!isNA && (
        <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
          <div 
            className={`h-1.5 rounded-full ${
              numValue >= 80 ? 'bg-emerald-400' :
              numValue >= 60 ? 'bg-cyan-400' :
              numValue >= 40 ? 'bg-amber-400' :
              'bg-rose-400'
            }`}
            style={{ width: `${numValue}%` }}
          />
        </div>
      )}
    </div>
  );
}
