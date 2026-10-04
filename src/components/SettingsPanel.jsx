import { Save, X, PiggyBank, Target } from 'lucide-react';

export default function SettingsPanel({ isOpen, onClose, settings, onSave, totalMonthlyContribution }) {
  const handleSave = () => {
    onSave({
      ...settings,
      currency: settings?.currency || 'USD',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative glass-card w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-light/50 transition-colors touch-manipulation"
        >
          <X className="w-5 h-5 text-steel" />
        </button>

        <h2 className="text-xl font-bold text-pearl mb-6">Portfolio Settings</h2>

        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-dark/50 border border-slate-light/20">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-amber-bright" />
              <span className="text-sm font-medium text-silver">Total Monthly Contribution</span>
            </div>
            <p className="text-2xl font-bold font-mono text-amber-bright">
              ${(totalMonthlyContribution || 0).toLocaleString()}
            </p>
            <p className="text-xs text-steel mt-2">
              Sum of monthly contributions across holdings. Edit a stock to change its amount.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sapphire/10 border border-sapphire/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-sapphire-bright" />
              <span className="text-sm font-medium text-silver">Growth outlook</span>
            </div>
            <p className="text-sm text-pearl">
              Portfolio growth uses Wall Street <span className="text-sapphire-bright">12-month analyst price targets</span> and consensus ratings — not a custom forecast horizon.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 min-h-[44px]">
              Close
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1 flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
