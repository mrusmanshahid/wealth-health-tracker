import { DollarSign, Calendar, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPanel({ isOpen, onClose, settings, onSave }) {
  const [monthlyContribution, setMonthlyContribution] = useState(settings.monthlyContribution || 0);
  const [forecastYears, setForecastYears] = useState(settings.forecastYears || 5);

  useEffect(() => {
    setMonthlyContribution(settings.monthlyContribution || 0);
    setForecastYears(settings.forecastYears || 5);
  }, [settings]);

  const handleSave = () => {
    onSave({
      monthlyContribution: parseFloat(monthlyContribution) || 0,
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
          <div>
            <label className="block text-sm font-medium text-silver mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
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
              Amount you plan to invest monthly. Used in forecast calculations.
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

