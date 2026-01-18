import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Sparkles,
  PiggyBank,
  Target,
  ChevronDown,
  ChevronUp,
  DollarSign,
  History,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function InvestableCash({ 
  cashBalance,
  cashTransactions = [],
  onAddCash,
  onWithdrawCash,
  portfolioStocks = [],
  watchlistStocks = [],
  undervaluedStocks = [],
  onBuyStock,
  compact = false
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [isDeposit, setIsDeposit] = useState(true);

  // Generate investment suggestions based on available cash
  const generateSuggestions = () => {
    const suggestions = [];
    
    // If we have a good amount of cash
    if (cashBalance >= 100) {
      // Suggest DCA into existing holdings
      const topHoldings = portfolioStocks
        .filter(s => s.monthlyContribution > 0)
        .slice(0, 2);
      
      topHoldings.forEach(stock => {
        suggestions.push({
          type: 'dca',
          symbol: stock.symbol,
          name: stock.name,
          reason: 'Continue DCA strategy',
          suggestedAmount: Math.min(stock.monthlyContribution, cashBalance),
          icon: PiggyBank,
          color: 'emerald',
        });
      });

      // Suggest watchlist stocks
      if (watchlistStocks.length > 0) {
        const watchItem = watchlistStocks[0];
        suggestions.push({
          type: 'watchlist',
          symbol: watchItem.symbol,
          name: watchItem.name,
          reason: "You've been watching this",
          suggestedAmount: Math.min(500, cashBalance),
          icon: Target,
          color: 'amber',
        });
      }

      // Suggest undervalued stocks
      if (undervaluedStocks.length > 0) {
        const undervalued = undervaluedStocks[0];
        suggestions.push({
          type: 'opportunity',
          symbol: undervalued.symbol,
          name: undervalued.name,
          reason: `${undervalued.discountFromHigh || '20'}% below 52-week high`,
          suggestedAmount: Math.min(1000, cashBalance),
          icon: Sparkles,
          color: 'violet',
        });
      }
    }

    // If low cash, suggest adding more
    if (cashBalance < 100) {
      suggestions.push({
        type: 'deposit',
        reason: 'Add funds to start investing',
        suggestedAmount: 500,
        icon: Plus,
        color: 'cyan',
      });
    }

    return suggestions.slice(0, 3);
  };

  const suggestions = generateSuggestions();

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;

    if (isDeposit) {
      onAddCash(amount, addNote || 'Deposit');
    } else {
      if (amount > cashBalance) {
        alert('Insufficient funds');
        return;
      }
      onWithdrawCash(amount, addNote || 'Withdrawal');
    }

    setAddAmount('');
    setAddNote('');
    setShowAddModal(false);
  };

  const recentTransactions = cashTransactions.slice(0, 5);

  // Compact view for sidebar
  if (compact) {
    return (
      <div className="glass-card p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-pearl">Cash</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-3xl font-bold text-white font-mono mb-3">
          ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        {/* Quick stats */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-steel">Deposited</span>
            <span className="text-emerald-400 font-mono">
              +${cashTransactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-steel">Invested</span>
            <span className="text-cyan-400 font-mono">
              -${cashTransactions.filter(t => t.type === 'buy').reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-steel">From Sales</span>
            <span className="text-violet-400 font-mono">
              +${cashTransactions.filter(t => t.type === 'sell').reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Top Suggestion */}
        {suggestions.length > 0 && suggestions[0].symbol && (
          <div className="mt-4 pt-3 border-t border-slate-light/20">
            <p className="text-xs text-steel mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              Suggestion
            </p>
            <button
              onClick={() => onBuyStock({ symbol: suggestions[0].symbol, name: suggestions[0].name })}
              className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
            >
              Buy {suggestions[0].symbol}
            </button>
          </div>
        )}

        {/* Add/Withdraw Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <div className="relative glass-card w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-pearl mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" />
                {isDeposit ? 'Add Funds' : 'Withdraw Funds'}
              </h3>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setIsDeposit(true)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isDeposit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-dark/50 text-steel'}`}>
                  <Plus className="w-4 h-4 inline mr-1" />Deposit
                </button>
                <button onClick={() => setIsDeposit(false)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!isDeposit ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-dark/50 text-steel'}`}>
                  <Minus className="w-4 h-4 inline mr-1" />Withdraw
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm text-steel mb-2">Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
                    <input type="number" step="0.01" placeholder="0.00" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="w-full bg-slate-dark/50 border border-slate-light/30 rounded-xl pl-10 pr-4 py-3 text-pearl text-lg font-mono focus:outline-none focus:border-cyan-500" required autoFocus />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm text-steel mb-2">Note (optional)</label>
                  <input type="text" placeholder="e.g., Monthly investment..." value={addNote} onChange={(e) => setAddNote(e.target.value)} className="w-full bg-slate-dark/50 border border-slate-light/30 rounded-xl px-4 py-3 text-pearl focus:outline-none focus:border-cyan-500" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-dark/50 text-steel rounded-xl font-medium hover:bg-slate-dark transition-colors">Cancel</button>
                  <button type="submit" className={`flex-1 py-3 rounded-xl font-medium transition-colors ${isDeposit ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'}`}>{isDeposit ? 'Add Funds' : 'Withdraw'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
            <Wallet className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-pearl">Investable Cash</h2>
            <p className="text-xs text-steel">Available for investing</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add/Withdraw
        </button>
      </div>

      {/* Cash Balance Card */}
      <div className="bg-gradient-to-br from-cyan-900/30 to-emerald-900/30 rounded-2xl p-6 border border-cyan-500/20 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300/70 mb-1">Available Balance</p>
            <p className="text-4xl font-bold text-white font-mono">
              ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <History className="w-4 h-4" />
              History
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-cyan-500/20">
          <div>
            <p className="text-xs text-steel">Total Deposited</p>
            <p className="text-lg font-semibold text-emerald-400 font-mono">
              ${cashTransactions
                .filter(t => t.type === 'deposit')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-steel">Total Invested</p>
            <p className="text-lg font-semibold text-cyan-400 font-mono">
              ${cashTransactions
                .filter(t => t.type === 'buy')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-steel">From Sales</p>
            <p className="text-lg font-semibold text-violet-400 font-mono">
              ${cashTransactions
                .filter(t => t.type === 'sell')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {showHistory && recentTransactions.length > 0 && (
        <div className="mb-6 bg-slate-dark/50 rounded-xl p-4 border border-slate-light/20">
          <h3 className="text-sm font-semibold text-silver mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {recentTransactions.map((tx, idx) => (
              <div 
                key={tx.id || idx}
                className="flex items-center justify-between py-2 border-b border-slate-light/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    tx.type === 'deposit' ? 'bg-emerald-500/20' :
                    tx.type === 'sell' ? 'bg-violet-500/20' :
                    tx.type === 'buy' ? 'bg-cyan-500/20' :
                    'bg-rose-500/20'
                  }`}>
                    {tx.type === 'deposit' ? <Plus className="w-3 h-3 text-emerald-400" /> :
                     tx.type === 'sell' ? <TrendingUp className="w-3 h-3 text-violet-400" /> :
                     tx.type === 'buy' ? <TrendingDown className="w-3 h-3 text-cyan-400" /> :
                     <Minus className="w-3 h-3 text-rose-400" />}
                  </div>
                  <div>
                    <p className="text-sm text-pearl">{tx.note || tx.type}</p>
                    <p className="text-xs text-steel">
                      {tx.date ? format(new Date(tx.date), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                </div>
                <p className={`font-mono font-medium ${
                  tx.type === 'deposit' || tx.type === 'sell' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {tx.type === 'deposit' || tx.type === 'sell' ? '+' : '-'}${tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Suggestions */}
      {cashBalance > 0 && suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-silver mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Smart Investment Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {suggestions.map((suggestion, idx) => {
              const Icon = suggestion.icon;
              return (
                <div 
                  key={idx}
                  className={`bg-${suggestion.color}-500/10 rounded-xl p-4 border border-${suggestion.color}-500/20 hover:border-${suggestion.color}-500/40 transition-colors`}
                  style={{
                    background: `linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)`,
                    ['--tw-gradient-from']: suggestion.color === 'emerald' ? 'rgba(16, 185, 129, 0.1)' :
                      suggestion.color === 'amber' ? 'rgba(245, 158, 11, 0.1)' :
                      suggestion.color === 'violet' ? 'rgba(139, 92, 246, 0.1)' :
                      'rgba(6, 182, 212, 0.1)',
                    ['--tw-gradient-to']: 'rgba(15, 23, 42, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${
                      suggestion.color === 'emerald' ? 'text-emerald-400' :
                      suggestion.color === 'amber' ? 'text-amber-400' :
                      suggestion.color === 'violet' ? 'text-violet-400' :
                      'text-cyan-400'
                    }`} />
                    <span className="text-xs text-steel uppercase tracking-wide">
                      {suggestion.type === 'dca' ? 'Continue DCA' :
                       suggestion.type === 'watchlist' ? 'From Watchlist' :
                       suggestion.type === 'opportunity' ? 'Opportunity' :
                       'Action Needed'}
                    </span>
                  </div>
                  
                  {suggestion.symbol ? (
                    <>
                      <p className="font-bold text-pearl">{suggestion.symbol}</p>
                      <p className="text-xs text-steel truncate mb-2">{suggestion.name}</p>
                      <p className="text-xs text-silver mb-3">{suggestion.reason}</p>
                      <button
                        onClick={() => onBuyStock({ symbol: suggestion.symbol, name: suggestion.name })}
                        className={`w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                          suggestion.color === 'emerald' ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400' :
                          suggestion.color === 'amber' ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400' :
                          'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400'
                        }`}
                      >
                        Invest ${suggestion.suggestedAmount}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-silver mb-3">{suggestion.reason}</p>
                      <button
                        onClick={() => {
                          setIsDeposit(true);
                          setAddAmount(suggestion.suggestedAmount.toString());
                          setShowAddModal(true);
                        }}
                        className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        Add ${suggestion.suggestedAmount}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {cashBalance === 0 && (
        <div className="text-center py-6">
          <PiggyBank className="w-10 h-10 mx-auto mb-3 text-steel opacity-50" />
          <p className="text-silver mb-2">No investable cash yet</p>
          <p className="text-xs text-steel mb-4">Add funds or sell stocks to build your cash reserve</p>
          <button
            onClick={() => {
              setIsDeposit(true);
              setShowAddModal(true);
            }}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Funds
          </button>
        </div>
      )}

      {/* Add/Withdraw Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative glass-card w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-pearl mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-400" />
              {isDeposit ? 'Add Funds' : 'Withdraw Funds'}
            </h3>

            {/* Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsDeposit(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDeposit 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-dark/50 text-steel'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Deposit
              </button>
              <button
                onClick={() => setIsDeposit(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !isDeposit 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                    : 'bg-slate-dark/50 text-steel'
                }`}
              >
                <Minus className="w-4 h-4 inline mr-1" />
                Withdraw
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm text-steel mb-2">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="w-full bg-slate-dark/50 border border-slate-light/30 rounded-xl pl-10 pr-4 py-3 text-pearl text-lg font-mono focus:outline-none focus:border-cyan-500"
                    required
                    autoFocus
                  />
                </div>
                {!isDeposit && (
                  <p className="text-xs text-steel mt-1">
                    Available: ${cashBalance.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm text-steel mb-2">Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly investment, Profit taking..."
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  className="w-full bg-slate-dark/50 border border-slate-light/30 rounded-xl px-4 py-3 text-pearl focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-dark/50 text-steel rounded-xl font-medium hover:bg-slate-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    isDeposit 
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400' 
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'
                  }`}
                >
                  {isDeposit ? 'Add Funds' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

