import { Heart, Plus, Sparkles, Play, TrendingUp } from 'lucide-react';

export default function EmptyState({ onAddStock, onLoadDemo }) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-glow/30 to-cyan-400/20 blur-2xl rounded-full"></div>
        <div className="relative bg-gradient-to-br from-slate-dark to-obsidian p-6 rounded-2xl border border-emerald-glow/20">
          <Heart className="w-16 h-16 text-emerald-bright mx-auto fill-emerald-glow/20" />
        </div>
      </div>
      
      <h2 className="text-3xl font-extrabold mb-3">
        <span className="bg-gradient-to-r from-emerald-bright via-cyan-400 to-emerald-glow bg-clip-text text-transparent">W</span>
        <span className="text-pearl">HEALTH</span>
      </h2>
      <p className="text-lg text-silver mb-2">Your Financial Health Companion</p>
      <p className="text-silver max-w-md mx-auto mb-8">
        Add your first stock to track your portfolio performance and see AI-powered forecasts 
        for the next 5 years.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onAddStock}
          className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
        >
          <Plus className="w-5 h-5" />
          Add Your First Stock
        </button>
        
        <button
          onClick={onLoadDemo}
          className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
        >
          <Play className="w-5 h-5" />
          Load Demo Portfolio
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="p-4 rounded-xl bg-slate-dark/30 border border-slate-light/10">
          <div className="w-10 h-10 rounded-lg bg-emerald-glow/20 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-bright" />
          </div>
          <h3 className="font-semibold text-pearl mb-1">10 Years of Data</h3>
          <p className="text-sm text-steel">
            Fetch historical stock performance from the last decade to analyze trends.
          </p>
        </div>
        
        <div className="p-4 rounded-xl bg-slate-dark/30 border border-slate-light/10">
          <div className="w-10 h-10 rounded-lg bg-sapphire/20 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-sapphire-bright" />
          </div>
          <h3 className="font-semibold text-pearl mb-1">Smart Forecasting</h3>
          <p className="text-sm text-steel">
            AI-powered predictions combining multiple algorithms for 5-year outlook.
          </p>
        </div>
        
        <div className="p-4 rounded-xl bg-slate-dark/30 border border-slate-light/10">
          <div className="w-10 h-10 rounded-lg bg-violet/20 flex items-center justify-center mb-3">
            <Plus className="w-5 h-5 text-violet-bright" />
          </div>
          <h3 className="font-semibold text-pearl mb-1">Track Contributions</h3>
          <p className="text-sm text-steel">
            See how monthly contributions compound your wealth over time.
          </p>
        </div>
      </div>
    </div>
  );
}

