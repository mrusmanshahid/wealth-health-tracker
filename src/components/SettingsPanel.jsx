import { Calendar, Save, X, PiggyBank } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPanel({ isOpen, onClose, settings, onSave, totalMonthlyContribution }) {
  const [forecastYears, setForecastYears] = useState(settings.forecastYears || 5);

  useEffect(() => {
    setForecastYears(settings.forecastYears || 5);
  }, [settings]);

  const handleSave = () => {
    onSave({
      forecastYears: parseInt(forecastYears) || 5,
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
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-light/50 transition-colors"
        >
          <X className="w-5 h-5 text-steel" />
        </button>

        <h2 className="text-xl font-bold text-pearl mb-6">Portfolio Settings</h2>

        <div className="space-y-5">
          {/* Total Monthly Contribution (read-only, sum of individual stocks) */}
          <div className="p-4 rounded-xl bg-slate-dark/50 border border-slate-light/20">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-4 h-4 text-amber-bright" />
              <span className="text-sm font-medium text-silver">Total Monthly Contribution</span>
            </div>
            <p className="text-2xl font-bold font-mono text-amber-bright">
              ${(totalMonthlyContribution || 0).toLocaleString()}
            </p>
            <p className="text-xs text-steel mt-2">
              This is the sum of monthly contributions from all your stocks. 
              Edit individual stocks to change their contribution amounts.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Forecast Period (Years)
            </label>
            <select
              value={forecastYears}
              onChange={(e) => setForecastYears(e.target.value)}
              className="glass-input w-full"
            >
              <option value="1">1 Year</option>
              <option value="3">3 Years</option>
              <option value="5">5 Years</option>
              <option value="10">10 Years</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
