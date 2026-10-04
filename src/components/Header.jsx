import { Heart, LogIn, LogOut, TrendingUp, TrendingDown, User } from 'lucide-react';

export default function Header({
  netWorth = 0,
  totalReturn = 0,
  totalReturnPercent = 0,
  userEmail = null,
  onLoginClick,
  onLogout,
}) {
  const isPositive = totalReturn >= 0;

  return (
    <header className="sticky top-0 z-30 -mx-3 px-3 sm:-mx-4 sm:px-4 pt-2 pb-3 mb-3 bg-gradient-to-b from-midnight via-midnight/95 to-transparent">
      <div className="glass-card px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-glow/40 to-cyan-400/30 blur-lg rounded-full" />
              <div className="relative bg-gradient-to-br from-emerald-glow via-emerald-bright to-cyan-500 p-2 sm:p-2.5 rounded-xl">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white/30" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-none">
                <span className="bg-gradient-to-r from-emerald-bright via-cyan-400 to-emerald-glow bg-clip-text text-transparent">
                  W
                </span>
                <span className="bg-gradient-to-r from-pearl to-silver bg-clip-text text-transparent">
                  HEALTH
                </span>
              </h1>
              {netWorth > 0 ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm sm:text-base font-bold font-mono text-emerald-bright">
                    ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-mono ${
                      isPositive ? 'text-emerald-pale' : 'text-ruby-bright'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? '+' : ''}
                    {totalReturnPercent.toFixed(1)}%
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-steel mt-0.5 truncate">Financial health companion</p>
              )}
            </div>
          </div>

          {userEmail ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-silver max-w-[140px]">
                <User className="w-3.5 h-3.5 text-emerald-bright flex-shrink-0" />
                <span className="truncate" title={userEmail}>
                  {userEmail}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="btn-secondary flex items-center gap-1.5 text-xs px-2.5 py-2 min-h-[40px]"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 min-h-[40px] flex-shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
