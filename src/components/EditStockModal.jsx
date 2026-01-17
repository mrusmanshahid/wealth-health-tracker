import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Hash, Calendar, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

export default function EditStockModal({ stock, onClose, onSave }) {
  const [shares, setShares] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (stock) {
      const calculatedShares = stock.shares || (stock.investedAmount / stock.purchasePrice);
      setShares(calculatedShares.toFixed(4));
      setAvgPrice(stock.purchasePrice?.toFixed(2) || '');
      setPurchaseDate(stock.purchaseDate || '');
      setMonthlyContribution(stock.monthlyContribution?.toString() || '');
    }
  }, [stock]);

  if (!stock) return null;

  const currentPrice = stock.currentPrice || stock.purchasePrice || 0;
  const sharesNum = parseFloat(shares) || 0;
  const avgPriceNum = parseFloat(avgPrice) || 0;
  const investedAmount = sharesNum * avgPriceNum;
  const currentValue = sharesNum * currentPrice;
  const gainLoss = currentValue - investedAmount;
  const gainLossPercent = investedAmount > 0 ? (gainLoss / investedAmount) * 100 : 0;
  const isPositive = gainLoss >= 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!shares || parseFloat(shares) <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    if (!avgPrice || parseFloat(avgPrice) <= 0) {
      setError('Please enter a valid average price');
      return;
    }

    onSave({
      ...stock,
      shares: parseFloat(shares),
      purchasePrice: parseFloat(avgPrice),
      investedAmount: parseFloat(shares) * parseFloat(avgPrice),
      purchaseDate: purchaseDate || stock.purchaseDate,
      monthlyContribution: parseFloat(monthlyContribution) || 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-light/50 transition-colors z-10 bg-obsidian/50"
        >
          <X className="w-5 h-5 text-steel" />
        </button>

        <h2 className="text-xl font-bold text-pearl mb-2">Edit Position</h2>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg font-bold text-emerald-bright">{stock.symbol}</span>
          <span className="text-silver">{stock.name}</span>
        </div>

        {/* Current Price Info */}
        <div className="p-4 rounded-xl bg-slate-dark/50 border border-slate-light/20 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-steel">Current Market Price</span>
            <span className="font-mono font-semibold text-pearl">${currentPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-steel">Last Updated</span>
            <span className="text-sm text-silver">Live</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Number of Shares */}
          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <Hash className="inline w-4 h-4 mr-1" />
              Number of Shares
            </label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              min="0"
              step="0.0001"
              className="glass-input w-full"
            />
          </div>

          {/* Average Price */}
          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Average Cost per Share ($)
            </label>
            <input
              type="number"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              placeholder="150.00"
              min="0"
              step="0.01"
              className="glass-input w-full"
            />
            <p className="text-xs text-steel mt-1">
              Your average purchase price across all buys
            </p>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              First Purchase Date
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="glass-input w-full"
            />
          </div>

          {/* Monthly Contribution */}
          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <PiggyBank className="inline w-4 h-4 mr-1" />
              Monthly Contribution ($)
            </label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              placeholder="500"
              min="0"
              step="50"
              className="glass-input w-full"
            />
            <p className="text-xs text-steel mt-1">
              Amount you plan to invest monthly in this stock. Used for growth projections.
            </p>
          </div>

          {/* Live Calculation Preview */}
          {sharesNum > 0 && avgPriceNum > 0 && (
            <div className="p-4 rounded-xl border border-slate-light/30 bg-gradient-to-br from-slate-dark/50 to-obsidian/50">
              <h3 className="text-sm font-semibold text-silver mb-3 uppercase tracking-wide">Position Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-steel mb-1">Total Invested</p>
                  <p className="font-mono font-semibold text-pearl">
                    ${investedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Current Value</p>
                  <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Unrealized P&L</p>
                  <p className={`font-mono font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? '+' : ''}${gainLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-steel mb-1">Return</p>
                  <p className={`font-mono font-semibold ${isPositive ? 'text-emerald-bright' : 'text-ruby-bright'}`}>
                    {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-ruby-bright text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

