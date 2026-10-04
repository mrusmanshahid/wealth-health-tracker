import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Landmark,
  Trash2,
  Pencil,
} from 'lucide-react';
import { format } from 'date-fns';

export default function InvestableCash({
  cashBalance,
  cashAccounts = [],
  cashTransactions = [],
  onAddCash,
  onWithdrawCash,
  onAddAccount,
  onRenameAccount,
  onRemoveAccount,
  portfolioStocks = [],
  watchlistStocks = [],
  undervaluedStocks = [],
  onBuyStock,
  compact = false,
}) {
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [isDeposit, setIsDeposit] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(cashAccounts[0]?.id || '');
  const [newBankName, setNewBankName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  const accountMap = useMemo(
    () => Object.fromEntries(cashAccounts.map((a) => [a.id, a])),
    [cashAccounts]
  );

  const selectedAccount = accountMap[selectedAccountId] || cashAccounts[0];
  const selectedBalance = selectedAccount?.balance || 0;

  const generateSuggestions = () => {
    const suggestions = [];
    if (cashBalance >= 100) {
      portfolioStocks
        .filter((s) => s.monthlyContribution > 0)
        .slice(0, 2)
        .forEach((stock) => {
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

    if (cashBalance < 100) {
      suggestions.push({
        type: 'deposit',
        reason: 'Add funds to a bank account to start investing',
        suggestedAmount: 500,
        icon: Plus,
        color: 'cyan',
      });
    }

    return suggestions.slice(0, 3);
  };

  const suggestions = generateSuggestions();

  const openModal = (deposit, accountId) => {
    setIsDeposit(deposit);
    setSelectedAccountId(accountId || cashAccounts[0]?.id || '');
    setAddAmount('');
    setAddNote('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    const accountId = selectedAccountId || cashAccounts[0]?.id;
    if (!accountId) return;

    if (isDeposit) {
      onAddCash(amount, addNote || 'Deposit', accountId);
    } else {
      const bal = accountMap[accountId]?.balance || 0;
      if (amount > bal) {
        alert('Insufficient funds in this account');
        return;
      }
      onWithdrawCash(amount, addNote || 'Withdrawal', accountId);
    }

    setAddAmount('');
    setAddNote('');
    setShowModal(false);
  };

  const handleAddBank = (e) => {
    e.preventDefault();
    const name = newBankName.trim();
    if (!name || typeof onAddAccount !== 'function') return;
    onAddAccount(name);
    setNewBankName('');
    setShowAddBank(false);
  };

  const filteredTransactions = cashTransactions.filter(
    (t) => historyFilter === 'all' || t.accountId === historyFilter
  );
  const recentTransactions = filteredTransactions.slice(0, 12);

  const fundsModal = showModal ? (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={() => setShowModal(false)}
      />
      <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[28rem] sm:max-w-[calc(100vw-2rem)] max-h-[min(90dvh,90vh)] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden border border-slate-light/20 bg-gradient-to-br from-slate-dark/95 to-midnight/95 shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-slate-light/10 flex-shrink-0">
          <h3 className="text-lg font-bold text-pearl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            {isDeposit ? 'Add funds' : 'Withdraw funds'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsDeposit(true)}
                className={`min-h-[40px] py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isDeposit
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-dark/50 text-steel'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setIsDeposit(false)}
                className={`min-h-[40px] py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  !isDeposit
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-dark/50 text-steel'
                }`}
              >
                <Minus className="w-4 h-4 inline mr-1" />
                Withdraw
              </button>
            </div>

            <div>
              <label className="block text-sm text-steel mb-2">Bank account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="glass-input w-full appearance-none"
              >
                {cashAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (${(a.balance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-steel mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="glass-input w-full pl-10 font-mono text-lg"
                  required
                  autoFocus
                />
              </div>
              {!isDeposit && (
                <p className="text-xs text-steel mt-1 break-words">
                  Available in {selectedAccount?.name || 'account'}: $
                  {selectedBalance.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-steel mb-2">Note (optional)</label>
              <input
                type="text"
                placeholder="Salary, rent transfer…"
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
                className="glass-input w-full"
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-slate-light/10 grid grid-cols-2 gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="min-h-[44px] py-3 bg-slate-dark/50 text-steel rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`min-h-[44px] py-3 rounded-xl font-medium ${
                isDeposit
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isDeposit ? 'Add funds' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const addBankModal = showAddBank ? (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={() => setShowAddBank(false)}
      />
      <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[28rem] sm:max-w-[calc(100vw-2rem)] p-4 sm:p-6 rounded-t-2xl sm:rounded-2xl border border-slate-light/20 bg-gradient-to-br from-slate-dark/95 to-midnight/95 shadow-2xl">
        <h3 className="text-lg font-bold text-pearl mb-4 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          Add bank account
        </h3>
        <form onSubmit={handleAddBank}>
          <label className="block text-sm text-steel mb-2">Bank name</label>
          <input
            className="glass-input w-full mb-4"
            placeholder="Chase, Revolut, Sparkasse…"
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            autoFocus
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowAddBank(false)}
              className="min-h-[44px] py-3 bg-slate-dark/50 text-steel rounded-xl"
            >
              Cancel
            </button>
            <button type="submit" className="min-h-[44px] btn-primary py-3 rounded-xl px-3">
              Add bank
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const portals =
    typeof document !== 'undefined'
      ? createPortal(
          <>
            {fundsModal}
            {addBankModal}
          </>,
          document.body
        )
      : null;

  if (compact) {
    return (
      <div className="glass-card p-3 h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20">
              <Wallet className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs text-steel uppercase tracking-wide">Cash</span>
          </div>
          <button
            type="button"
            onClick={() => openModal(true)}
            className="p-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="text-xl font-bold text-cyan-400 font-mono mb-2">
          $
          {cashBalance.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className="space-y-1 text-[11px] max-h-24 overflow-y-auto">
          {cashAccounts.map((a) => (
            <div key={a.id} className="flex justify-between gap-2">
              <span className="text-steel truncate">{a.name}</span>
              <span className="font-mono text-silver">
                ${(a.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
        {portals}
      </div>
    );
  }

  return (
    <div className="glass-card p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex-shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-pearl">Investable Cash</h2>
            <p className="text-xs text-steel leading-snug">
              Track each bank · add &amp; withdraw per account
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowAddBank(true)}
            className="btn-secondary text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[40px] px-2 sm:px-4"
          >
            <Landmark className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Add bank</span>
          </button>
          <button
            type="button"
            onClick={() => openModal(true)}
            className="btn-primary text-xs sm:text-sm flex items-center justify-center gap-1.5 min-h-[40px] px-2 sm:px-4"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Add / Withdraw</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-cyan-900/30 to-emerald-900/30 rounded-2xl p-4 sm:p-6 border border-cyan-500/20 mb-5 overflow-hidden">
        <p className="text-sm text-cyan-300/70 mb-1">Total across banks</p>
        <p className="text-2xl sm:text-4xl font-bold text-white font-mono break-all">
          $
          {cashBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-cyan-500/20">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-steel">Banks</p>
            <p className="text-base sm:text-lg font-semibold text-pearl font-mono">
              {cashAccounts.length}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-steel">Deposited</p>
            <p className="text-sm sm:text-lg font-semibold text-emerald-400 font-mono truncate">
              $
              {cashTransactions
                .filter((t) => t.type === 'deposit')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-steel">Withdrawn</p>
            <p className="text-sm sm:text-lg font-semibold text-rose-400 font-mono truncate">
              $
              {cashTransactions
                .filter((t) => t.type === 'withdrawal')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Bank accounts */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-silver mb-3 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          Bank accounts
        </h3>
        <div className="space-y-2">
          {cashAccounts.map((account) => (
            <div
              key={account.id}
              className="rounded-xl border border-slate-light/20 bg-slate-dark/40 p-3 sm:p-4 overflow-hidden"
            >
              <div className="flex flex-col gap-3">
                <div className="min-w-0 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {editingId === account.id ? (
                      <form
                        className="flex gap-2 min-w-0"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editName.trim() && onRenameAccount) {
                            onRenameAccount(account.id, editName.trim());
                          }
                          setEditingId(null);
                        }}
                      >
                        <input
                          className="glass-input flex-1 min-w-0 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className="btn-primary text-xs px-3 flex-shrink-0">
                          Save
                        </button>
                      </form>
                    ) : (
                      <>
                        <p className="font-semibold text-pearl truncate">{account.name}</p>
                        <p className="text-xl sm:text-2xl font-mono text-cyan-400 mt-1 break-all">
                          $
                          {(account.balance || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(account.id);
                        setEditName(account.name);
                      }}
                      className="p-2 rounded-lg text-steel hover:text-pearl"
                      title="Rename"
                      aria-label="Rename"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveAccount?.(account.id)}
                      className="p-2 rounded-lg text-steel hover:text-rose-400"
                      title="Remove bank"
                      aria-label="Remove bank"
                      disabled={cashAccounts.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openModal(true, account.id)}
                    className="min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal(false, account.id)}
                    className="min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 flex items-center justify-center gap-1.5 disabled:opacity-40"
                    disabled={(account.balance || 0) <= 0}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-3"
        >
          <History className="w-4 h-4" />
          Transaction history
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="bg-slate-dark/50 rounded-xl p-4 border border-slate-light/20">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs ${
                  historyFilter === 'all'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-slate-dark text-steel'
                }`}
              >
                All
              </button>
              {cashAccounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setHistoryFilter(a.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs truncate max-w-[140px] ${
                    historyFilter === a.id
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-dark text-steel'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>

            {recentTransactions.length === 0 ? (
              <p className="text-sm text-steel">No transactions yet for this filter.</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx, idx) => (
                  <div
                    key={tx.id || idx}
                    className="flex items-center justify-between py-2 border-b border-slate-light/10 last:border-0 gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg flex-shrink-0 ${
                          tx.type === 'deposit'
                            ? 'bg-emerald-500/20'
                            : tx.type === 'sell'
                              ? 'bg-violet-500/20'
                              : tx.type === 'buy'
                                ? 'bg-cyan-500/20'
                                : 'bg-rose-500/20'
                        }`}
                      >
                        {tx.type === 'deposit' ? (
                          <Plus className="w-3 h-3 text-emerald-400" />
                        ) : tx.type === 'sell' ? (
                          <TrendingUp className="w-3 h-3 text-violet-400" />
                        ) : tx.type === 'buy' ? (
                          <TrendingDown className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Minus className="w-3 h-3 text-rose-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-pearl truncate">{tx.note || tx.type}</p>
                        <p className="text-xs text-steel">
                          {accountMap[tx.accountId]?.name || 'Account'}
                          {tx.date ? ` · ${format(new Date(tx.date), 'MMM d, yyyy')}` : ''}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-mono font-medium flex-shrink-0 ${
                        tx.type === 'deposit' || tx.type === 'sell'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'deposit' || tx.type === 'sell' ? '+' : '-'}$
                      {tx.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {cashBalance > 0 && suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-silver mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            Smart investment suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {suggestions.map((suggestion, idx) => {
              const Icon = suggestion.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl p-4 border border-slate-light/20 bg-slate-dark/40"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-steel uppercase tracking-wide">
                      {suggestion.type === 'dca'
                        ? 'Continue DCA'
                        : suggestion.type === 'watchlist'
                          ? 'From Watchlist'
                          : suggestion.type === 'opportunity'
                            ? 'Opportunity'
                            : 'Action needed'}
                    </span>
                  </div>
                  {suggestion.symbol ? (
                    <>
                      <p className="font-bold text-pearl">{suggestion.symbol}</p>
                      <p className="text-xs text-steel truncate mb-2">{suggestion.name}</p>
                      <p className="text-xs text-silver mb-3">{suggestion.reason}</p>
                      <button
                        type="button"
                        onClick={() =>
                          onBuyStock({ symbol: suggestion.symbol, name: suggestion.name })
                        }
                        className="w-full py-2 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2"
                      >
                        Invest ${suggestion.suggestedAmount}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-silver mb-3">{suggestion.reason}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setAddAmount(String(suggestion.suggestedAmount));
                          openModal(true);
                        }}
                        className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
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

      {cashBalance === 0 && cashAccounts.every((a) => (a.balance || 0) === 0) && (
        <div className="text-center py-6">
          <PiggyBank className="w-10 h-10 mx-auto mb-3 text-steel opacity-50" />
          <p className="text-silver mb-2">No cash in your bank accounts yet</p>
          <p className="text-xs text-steel mb-4">
            Add a bank, then deposit funds to track investable cash
          </p>
          <button type="button" onClick={() => openModal(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4 inline mr-2" />
            Add funds
          </button>
        </div>
      )}

      {portals}
    </div>
  );
}
