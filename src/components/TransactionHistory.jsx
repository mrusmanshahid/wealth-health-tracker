import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Hash,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionHistory({ 
  transactions = [], 
  currentPrice,
  onAddTransaction, 
  onDeleteTransaction 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [newTransaction, setNewTransaction] = useState({
    type: 'buy',
    shares: '',
    price: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTransaction.shares || !newTransaction.price) return;
    
    onAddTransaction({
      ...newTransaction,
      id: Date.now().toString(),
      shares: parseFloat(newTransaction.shares),
      price: parseFloat(newTransaction.price),
    });
    
    setNewTransaction({
      type: 'buy',
      shares: '',
      price: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setShowAddForm(false);
  };

  // Calculate totals
  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'buy') {
      acc.totalBought += t.shares;
      acc.totalInvested += t.shares * t.price;
    } else {
      acc.totalSold += t.shares;
      acc.totalRealized += t.shares * t.price;
    }
    return acc;
  }, { totalBought: 0, totalSold: 0, totalInvested: 0, totalRealized: 0 });

  const currentShares = totals.totalBought - totals.totalSold;
  const avgCost = totals.totalBought > 0 ? totals.totalInvested / totals.totalBought : 0;
  const realizedGain = totals.totalRealized - (totals.totalSold * avgCost);

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20">
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-white block">Transaction History</span>
            <span className="text-xs text-slate-400">{transactions.length} transactions</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400">Current Shares</div>
              <div className="text-lg font-bold text-white">{currentShares.toFixed(4)}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400">Avg Cost Basis</div>
              <div className="text-lg font-bold text-white">${avgCost.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400">Total Invested</div>
              <div className="text-lg font-bold text-cyan-400">${totals.totalInvested.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400">Realized P&L</div>
              <div className={`text-lg font-bold ${realizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {realizedGain >= 0 ? '+' : ''}${realizedGain.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          {transactions.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Date</th>
                    <th className="text-right py-2 font-medium">Shares</th>
                    <th className="text-right py-2 font-medium">Price</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">P&L</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const total = t.shares * t.price;
                    const pl = t.type === 'sell' ? (t.price - avgCost) * t.shares : null;
                    
                    return (
                      <tr 
                        key={t.id} 
                        className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20"
                      >
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            t.type === 'buy' 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {t.type === 'buy' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-slate-300">
                          {t.date ? format(new Date(t.date), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="py-3 text-sm text-right text-white font-mono">
                          {t.shares.toFixed(4)}
                        </td>
                        <td className="py-3 text-sm text-right text-white font-mono">
                          ${t.price.toFixed(2)}
                        </td>
                        <td className="py-3 text-sm text-right text-white font-mono">
                          ${total.toLocaleString()}
                        </td>
                        <td className="py-3 text-sm text-right font-mono">
                          {pl !== null ? (
                            <span className={pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {transactions.length === 0 && !showAddForm && (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm">No transactions recorded yet</p>
            </div>
          )}

          {/* Add Transaction Form */}
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {/* Type */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Shares */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Shares</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={newTransaction.shares}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, shares: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Price per Share</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newTransaction.price}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                {/* Total Display */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Total</label>
                  <div className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-cyan-400 text-sm font-mono">
                    ${((parseFloat(newTransaction.shares) || 0) * (parseFloat(newTransaction.price) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., DCA purchase, profit taking..."
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>
          )}
        </div>
      )}
    </div>
  );
}

