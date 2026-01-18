import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, PiggyBank, FileText, Receipt } from 'lucide-react';
import UnifiedStockChart from './UnifiedStockChart';
import EarningsReport from './EarningsReport';
import TransactionHistory from './TransactionHistory';
import { calculateCAGR, calculateMonthlyStats } from '../utils/forecasting';

export default function StockDetailModal({ stock, onClose, onAddTransaction, onDeleteTransaction }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!stock) return null;

  const shares = stock.shares || (stock.investedAmount / stock.purchasePrice);
  const currentValue = shares * (stock.currentPrice || stock.purchasePrice);
  const investedAmount = stock.investedAmount || (shares * stock.purchasePrice);
  const gain = currentValue - investedAmount;
  const gainPercent = (gain / investedAmount) * 100;
  const isPositive = gain >= 0;

  // Calculate metrics
  const { avgReturn, volatility } = stock.history ? calculateMonthlyStats(stock.history) : { avgReturn: 0, volatility: 0 };
  const annualizedReturn = avgReturn * 12 * 100;
  const annualizedVolatility = volatility * Math.sqrt(12) * 100;

  // CAGR
  const firstPrice = stock.history?.[0]?.price || stock.purchasePrice;
  const lastPrice = stock.currentPrice || stock.purchasePrice;
  const years = stock.history ? stock.history.length / 12 : 1;
  const cagr = calculateCAGR(firstPrice, lastPrice, years);

  // Calculate growth rates for display
  const history = stock.history || [];
  const recent12 = history.slice(-12);
  const recent60 = history.slice(-60);
  
  const recentGrowthRate = recent12.length >= 2 
    ? (Math.pow(recent12[recent12.length - 1]?.price / recent12[0]?.price, 1 / (recent12.length / 12)) - 1) * 100
    : 0;
  
  const fiveYearGrowthRate = recent60.length >= 12
    ? (Math.pow(recent60[recent60.length - 1]?.price / recent60[0]?.price, 1 / (recent60.length / 12)) - 1) * 100
    : recentGrowthRate;
  
  const tenYearGrowthRate = history.length >= 12
    ? (Math.pow(history[history.length - 1]?.price / history[0]?.price, 1 / (history.length / 12)) - 1) * 100
    : fiveYearGrowthRate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-light/50 transition-colors z-10 bg-obsidian/50"
        >
          <X className="w-5 h-5 text-steel" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-emerald-glow/20">
            <BarChart3 className="w-8 h-8 text-emerald-bright" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-pearl">{stock.symbol}</h2>
            <p className="text-silver">{stock.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-pearl">
              ${(stock.currentPrice || stock.purchasePrice).toFixed(2)}
            </p>
            <p className={`text-sm ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
              {isPositive ? '+' : ''}{gainPercent.toFixed(2)}% since purchase
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-light/30 pb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-glow/20 text-emerald-bright'
                : 'text-steel hover:text-silver hover:bg-slate-light/30'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'transactions'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-steel hover:text-silver hover:bg-slate-light/30'
            }`}
          >
            <Receipt className="w-4 h-4 inline mr-2" />
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'earnings'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-steel hover:text-silver hover:bg-slate-light/30'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Financials
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="stat-card">
                <p className="text-xs text-steel uppercase tracking-wide mb-1">
                  <DollarSign className="inline w-3 h-3" /> Invested
                </p>
                <p className="font-mono font-semibold text-pearl">
                  ${investedAmount.toLocaleString()}
                </p>
              </div>
              
              <div className="stat-card">
                <p className="text-xs text-steel uppercase tracking-wide mb-1">Current Value</p>
                <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                  ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              
              <div className="stat-card">
                <p className="text-xs text-steel uppercase tracking-wide mb-1">Shares Owned</p>
                <p className="font-mono font-semibold text-pearl">
                  {shares.toFixed(4)}
                </p>
              </div>
              
              <div className="stat-card">
                <p className="text-xs text-steel uppercase tracking-wide mb-1">
                  {isPositive ? 'Gain' : 'Loss'}
                </p>
                <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                  {isPositive ? '+' : ''}${gain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="glass-card p-4 mb-6 bg-slate-dark/30">
              <h3 className="text-sm font-semibold text-silver mb-3 uppercase tracking-wide">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-steel mb-1">CAGR (10Y)</p>
                  <p className={`font-mono text-lg ${cagr >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Avg Annual Return</p>
                  <p className={`font-mono text-lg ${annualizedReturn >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    {annualizedReturn >= 0 ? '+' : ''}{annualizedReturn.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Volatility (Annual)</p>
                  <p className="font-mono text-lg text-amber-bright">
                    {annualizedVolatility.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {/* Growth Rate Comparison */}
              <div className="pt-4 border-t border-slate-light/20">
                <h4 className="text-xs text-steel mb-3 uppercase tracking-wide">Annual Growth Rates</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-glow/10">
                    <p className="text-xs text-steel mb-1">Recent (1Y)</p>
                    <p className={`font-mono text-lg ${recentGrowthRate >= 0 ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                      {recentGrowthRate >= 0 ? '+' : ''}{recentGrowthRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-sapphire/10">
                    <p className="text-xs text-steel mb-1">5Y Average</p>
                    <p className={`font-mono text-lg ${fiveYearGrowthRate >= 0 ? 'text-sapphire-bright' : 'text-ruby-bright'}`}>
                      {fiveYearGrowthRate >= 0 ? '+' : ''}{fiveYearGrowthRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-violet/10">
                    <p className="text-xs text-steel mb-1">10Y Average</p>
                    <p className={`font-mono text-lg ${tenYearGrowthRate >= 0 ? 'text-violet-bright' : 'text-ruby-bright'}`}>
                      {tenYearGrowthRate >= 0 ? '+' : ''}{tenYearGrowthRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unified Chart - Historical + Projections */}
            <div className="mb-6">
              <UnifiedStockChart 
                stock={stock} 
                monthlyContribution={stock.monthlyContribution || 0}
              />
            </div>

            {/* Purchase Info */}
            <div className="pt-4 border-t border-slate-light/30 flex flex-wrap items-center gap-4 text-sm text-steel">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Purchased: {stock.purchaseDate || 'Not specified'}
              </div>
              <div>
                @ ${stock.purchasePrice.toFixed(2)}/share
              </div>
              {stock.monthlyContribution > 0 && (
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4" />
                  ${stock.monthlyContribution}/mo contribution
                </div>
              )}
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <TransactionHistory
            transactions={stock.transactions || []}
            currentPrice={stock.currentPrice || stock.purchasePrice}
            onAddTransaction={(transaction) => onAddTransaction?.(stock.symbol, transaction)}
            onDeleteTransaction={(transactionId) => onDeleteTransaction?.(stock.symbol, transactionId)}
          />
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <EarningsReport symbol={stock.symbol} />
        )}
      </div>
    </div>
  );
}
