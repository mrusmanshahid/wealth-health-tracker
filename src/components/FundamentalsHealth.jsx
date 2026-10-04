import { Activity, CheckCircle2, AlertTriangle, MinusCircle, HelpCircle } from 'lucide-react';

function signalStyles(signal) {
  if (signal === 'good') return 'text-emerald-bright bg-emerald-glow/15 border-emerald-glow/25';
  if (signal === 'bad') return 'text-ruby-bright bg-ruby/15 border-ruby/25';
  if (signal === 'ok') return 'text-amber-bright bg-amber/15 border-amber/25';
  return 'text-steel bg-slate-light/20 border-slate-light/20';
}

function SignalIcon({ signal }) {
  if (signal === 'good') return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (signal === 'bad') return <AlertTriangle className="w-3.5 h-3.5" />;
  if (signal === 'ok') return <MinusCircle className="w-3.5 h-3.5" />;
  return <HelpCircle className="w-3.5 h-3.5" />;
}

function formatIndicator(ind) {
  if (ind.value == null) return '—';
  const n = Number(ind.value);
  if (ind.unit === '%') return `${n.toFixed(1)}%`;
  if (ind.unit === 'x') return `${n.toFixed(2)}x`;
  if (ind.unit === 'B' || ind.unit === 'M') {
    const sign = n < 0 ? '-' : '';
    return `${sign}${Math.abs(n).toFixed(1)}${ind.unit}`;
  }
  return n.toFixed(1);
}

function healthLabel(health) {
  if (health === 'good') return 'Healthy';
  if (health === 'mixed') return 'Mixed';
  if (health === 'weak') return 'Weak';
  return 'Limited data';
}

export default function FundamentalsHealth({ fundamentals, compact = false }) {
  if (!fundamentals?.available) {
    if (compact) return null;
    return (
      <div className="rounded-xl border border-slate-light/20 bg-slate-dark/40 p-3 text-xs text-steel">
        No annual / key-ratio fundamentals available for this symbol.
      </div>
    );
  }

  const { score, health, counts, indicators, note, sector } = fundamentals;
  const top = compact ? indicators.slice(0, 6) : indicators;

  return (
    <div className={compact ? 'mt-3 pt-3 border-t border-slate-light/20' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-steel uppercase tracking-wide flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" />
          Fundamentals
        </p>
        <div className="flex items-center gap-1.5">
          {score != null && (
            <span className="text-[11px] font-mono text-silver">{score}/100</span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${signalStyles(
            health === 'good' ? 'good' : health === 'weak' ? 'bad' : health === 'mixed' ? 'ok' : 'unknown'
          )}`}>
            {healthLabel(health)}
          </span>
        </div>
      </div>

      {!compact && sector && (
        <p className="text-[11px] text-steel">{sector}</p>
      )}

      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-1.5`}>
        {top.map((ind) => (
          <div
            key={ind.key}
            className={`rounded-lg border px-2 py-1.5 ${signalStyles(ind.signal)}`}
            title={ind.tip}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <SignalIcon signal={ind.signal} />
              <span className="text-[10px] uppercase tracking-wide opacity-80 truncate">
                {ind.label}
              </span>
            </div>
            <p className="font-mono text-sm font-semibold text-pearl">
              {formatIndicator(ind)}
            </p>
          </div>
        ))}
      </div>

      {counts && (
        <p className="text-[10px] text-steel">
          <span className="text-emerald-bright">{counts.good} good</span>
          {' · '}
          <span className="text-amber-bright">{counts.ok} ok</span>
          {' · '}
          <span className="text-ruby-bright">{counts.bad} caution</span>
          {compact && indicators.length > top.length ? ` · +${indicators.length - top.length} more in details` : ''}
        </p>
      )}

      {!compact && note && (
        <p className="text-[10px] text-steel leading-snug">{note}</p>
      )}
    </div>
  );
}
