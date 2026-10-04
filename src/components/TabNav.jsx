import {
  Calculator,
  Compass,
  LayoutDashboard,
  ListChecks,
  Wallet,
} from 'lucide-react';

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: LayoutDashboard },
  { id: 'cash', label: 'Cash', icon: Wallet },
  { id: 'watchlist', label: 'Watch', icon: ListChecks },
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'project', label: 'Project', icon: Calculator },
];

export default function TabNav({ activeTab, onChange }) {
  return (
    <>
      {/* Desktop / tablet top tabs */}
      <nav className="hidden sm:block mb-5">
        <div className="glass-card p-1.5 flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={`flex-1 min-w-[7.5rem] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-glow/20 text-emerald-bright'
                    : 'text-steel hover:text-pearl hover:bg-slate-light/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom tabs */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-light/20 bg-obsidian/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] touch-manipulation ${
                  active ? 'text-emerald-bright' : 'text-steel'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export { TABS };
