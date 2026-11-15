import React from 'react';
import { Flame, Wind } from 'lucide-react';

interface CigaretteVisualizerProps {
  cigsPerDay: number;
  rawCigsPerDay: number;
  usAqi: number;
  pm25: number;
  showMarginalCigPreview: boolean;
  onToggleMarginalPreview: () => void;
  weberRelativeIncreasePct: number;
}

export const CigaretteVisualizer: React.FC<CigaretteVisualizerProps> = ({
  cigsPerDay,
  rawCigsPerDay,
  pm25,
  showMarginalCigPreview,
  onToggleMarginalPreview,
  weberRelativeIncreasePct,
}) => {
  // Cap visual rack at 20 cigarettes (1 full pack) and show pack badge if > 20
  const maxVisualCigs = 20;
  const clampedCigs = Math.min(maxVisualCigs, Math.max(0, cigsPerDay));
  const fullCigs = Math.floor(clampedCigs);
  const fractionalCig = Number((clampedCigs - fullCigs).toFixed(2));

  const items: Array<{ index: number; fillFraction: number; isMarginalPreview?: boolean }> = [];
  for (let i = 0; i < fullCigs; i++) {
    items.push({ index: i + 1, fillFraction: 1.0 });
  }
  if (fractionalCig > 0.02 || items.length === 0) {
    items.push({
      index: fullCigs + 1,
      fillFraction: Math.max(0.04, fractionalCig),
    });
  }
  if (showMarginalCigPreview) {
    items.push({
      index: items.length + 1,
      fillFraction: 1.0,
      isMarginalPreview: true,
    });
  }

  return (
    <div className="relative rounded-2xl border border-stone-800/90 bg-[#12100E]/90 p-5 sm:p-6 shadow-2xl overflow-hidden">
      {/* Subtle warning stripe header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Flame className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-mono-code uppercase tracking-widest text-stone-400">
              Physical Equivalence Rack // 24-Hour Alveolar Dose
            </h3>
            <p className="text-sm text-stone-300">
              Each stick = <span className="font-mono-code text-amber-300">22.0 µg/m³</span> of inhaled PM2.5 (Berkeley Earth Standard)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMarginalPreview}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-code uppercase tracking-wider transition-all border cursor-pointer ${
            showMarginalCigPreview
              ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold shadow-lg shadow-amber-500/20'
              : 'bg-stone-900/90 text-amber-300 border-amber-500/30 hover:border-amber-400/60'
          }`}
        >
          {showMarginalCigPreview ? '✓ Showing +1 Real Cigarette' : '+ Overlay 1 Real Cigarette (Weber Test)'}
        </button>
      </div>

      {/* Cigarette Rack Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
        {items.map((cig) => {
          const pct = Math.round(cig.fillFraction * 100);
          const isPartial = cig.fillFraction < 0.99 && !cig.isMarginalPreview;

          return (
            <div
              key={`${cig.index}-${cig.isMarginalPreview ? 'marginal' : 'env'}`}
              className={`group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                cig.isMarginalPreview
                  ? 'border-rose-500/60 bg-rose-950/25 shadow-lg shadow-rose-950/30'
                  : 'border-stone-800/70 bg-stone-950/60 hover:border-stone-700'
              }`}
            >
              {/* Index Badge */}
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono-code shrink-0 ${
                  cig.isMarginalPreview
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-stone-900 text-stone-400 border border-stone-800'
                }`}
              >
                {cig.isMarginalPreview ? '+1' : `#${cig.index}`}
              </div>

              {/* Physical Cigarette Stick Illustration */}
              <div className="flex-1 flex flex-col gap-1">
                <div className="relative h-6 w-full flex items-center rounded-sm overflow-visible">
                  {/* Cork Filter Tip (22% width) */}
                  <div
                    className="h-5 w-[22%] rounded-l-sm border-r border-amber-900/60 relative overflow-hidden shrink-0"
                    style={{
                      background: 'linear-gradient(180deg, #D99B52 0%, #B8762E 50%, #9A5E1F 100%)',
                    }}
                  >
                    {/* Cork speckles */}
                    <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#451a03_1px,transparent_1px)] [background-size:4px_4px]" />
                    <div className="absolute right-1 top-0 bottom-0 w-[2px] bg-amber-200/40" />
                  </div>

                  {/* White Paper Rod + Burned Portion (78% width) */}
                  <div className="relative h-5 flex-1 bg-stone-900/90 rounded-r-sm overflow-visible flex items-center">
                    {/* Active / Inhaled portion of this cigarette */}
                    <div
                      className="h-full relative flex items-center transition-all duration-500"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    >
                      {/* Paper body */}
                      <div
                        className="h-full flex-1 relative overflow-hidden"
                        style={{
                          background: cig.isMarginalPreview
                            ? 'linear-gradient(180deg, #FECDD3 0%, #FDA4AF 50%, #FB7185 100%)'
                            : 'linear-gradient(180deg, #F5F2EB 0%, #E6E0D4 55%, #CFC7B8 100%)',
                        }}
                      >
                        {/* Subtle paper ribs */}
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,#000_3px,#000_4px)]" />
                      </div>

                      {/* Glowing Ember & Ash Cone at tip */}
                      <div className="h-full w-3.5 shrink-0 flex items-center relative">
                        <div
                          className="h-full w-2 animate-ember"
                          style={{
                            background: 'linear-gradient(90deg, #EA580C 0%, #EF4444 60%, #7F1D1D 100%)',
                          }}
                        />
                        <div className="h-full w-1.5 bg-zinc-600 rounded-r-xs" />

                        {/* Animated Smoke Plume on the last/active stick */}
                        {(isPartial || cig.index === items.length || cig.isMarginalPreview) && (
                          <svg
                            className="absolute -top-7 -right-2 w-6 h-8 pointer-events-none overflow-visible"
                            viewBox="0 0 24 32"
                          >
                            <path
                              d="M12 30 Q6 20 14 12 T10 2"
                              fill="none"
                              stroke={cig.isMarginalPreview ? 'rgba(251,113,133,0.55)' : 'rgba(214,211,209,0.45)'}
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="animate-smoke-1"
                            />
                            <path
                              d="M15 28 Q20 18 11 10 T16 0"
                              fill="none"
                              stroke="rgba(168,162,158,0.3)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              className="animate-smoke-2"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Unsmoked ghost outline if fractional */}
                    {pct < 100 && (
                      <div className="h-full flex-1 border border-dashed border-stone-700/60 rounded-r-sm flex items-center justify-end pr-2">
                        <span className="text-[10px] font-mono-code text-stone-500">
                          {100 - pct}% unburned
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stick caption */}
                <div className="flex items-center justify-between text-[11px] font-mono-code">
                  <span className={cig.isMarginalPreview ? 'text-rose-300 font-medium' : 'text-stone-400'}>
                    {cig.isMarginalPreview
                      ? 'Active Marginal Cigarette (+1.00 cig)'
                      : isPartial
                      ? `Fractional Smog Stick (${cig.fillFraction.toFixed(2)} cig)`
                      : 'Full Passive Smog Cigarette (1.00 cig)'}
                  </span>
                  <span className={cig.isMarginalPreview ? 'text-rose-300' : 'text-amber-400/90'}>
                    {cig.isMarginalPreview
                      ? `+${weberRelativeIncreasePct > 999 ? '>999' : weberRelativeIncreasePct.toFixed(1)}% relative load`
                      : `${(cig.fillFraction * 22).toFixed(1)} µg/m³`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cigsPerDay > maxVisualCigs && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs font-mono-code text-rose-200 flex items-center justify-between">
          <span>
            ⚠️ Pack Overflow: Showing first 20 cigarettes (1 full pack). You are inhaling{' '}
            <strong>{cigsPerDay.toFixed(2)}</strong> cigarettes/day!
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-100">
            {(cigsPerDay / 20).toFixed(2)} Packs / Day
          </span>
        </div>
      )}

      {/* Bottom Micro-Telemetry Bar */}
      <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <Wind className="w-3.5 h-3.5 text-amber-400" />
          <span>
            24h Unadjusted Outdoor Equivalence:{' '}
            <strong className="font-mono-code text-stone-200">{rawCigsPerDay.toFixed(2)} cigs/day</strong> ({pm25.toFixed(1)} µg/m³ ÷ 22)
          </span>
        </div>
        <div className="font-mono-code text-stone-400">
          Adjusted Personal Intake:{' '}
          <strong className="text-amber-300">{cigsPerDay.toFixed(2)} cigs/day</strong>
        </div>
      </div>
    </div>
  );
};
