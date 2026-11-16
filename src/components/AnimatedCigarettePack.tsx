import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { AqiSeverity } from '../lib/economics';

interface AnimatedCigarettePackProps {
  cityName: string;
  countryName?: string;
  cigsPerDay: number;
  usAqi: number;
  pm25: number;
  severity: AqiSeverity;
  showMarginalCigPreview: boolean;
  onToggleMarginalPreview: () => void;
  weberRelativeIncreasePct: number;
}

export const AnimatedCigarettePack: React.FC<AnimatedCigarettePackProps> = ({
  cityName,
  cigsPerDay,
  usAqi,
  pm25,
  severity,
  showMarginalCigPreview,
  onToggleMarginalPreview,
  weberRelativeIncreasePct,
}) => {
  const totalPackSlots = 20;
  const clampedCigs = Math.min(totalPackSlots, Math.max(0, cigsPerDay));
  const fullCount = Math.floor(clampedCigs);
  const fraction = Number((clampedCigs - fullCount).toFixed(2));

  // Build 20 slots (0..9 back row, 10..19 front row)
  // We map the active cigarettes across the pack so that as cigsPerDay increases from 0 -> 20,
  // sticks progressively pop up from left to right across the front & back rows.
  const slots = Array.from({ length: totalPackSlots }, (_, i) => {
    const stickNumber = i + 1;
    let activeFraction = 0;
    if (stickNumber <= fullCount) {
      activeFraction = 1;
    } else if (stickNumber === fullCount + 1 && fraction > 0.02) {
      activeFraction = Math.max(0.18, fraction);
    } else if (fullCount === 0 && stickNumber === 1 && cigsPerDay > 0) {
      activeFraction = Math.max(0.15, cigsPerDay);
    }
    return {
      stickNumber,
      activeFraction,
      isActive: activeFraction > 0,
      isFractional: activeFraction > 0 && activeFraction < 1,
      isTopSmoker:
        stickNumber === fullCount ||
        (stickNumber === fullCount + 1 && fraction > 0.02) ||
        (fullCount === 0 && stickNumber === 1),
    };
  });

  const backRow = slots.slice(10, 20); // sticks 11..20 in back row
  const frontRow = slots.slice(0, 10); // sticks 1..10 in front row

  const hoursPerCig =
    cigsPerDay >= 0.05 ? (24 / cigsPerDay).toFixed(1) : '∞';

  return (
    <div className="relative flex flex-col items-center select-none pt-2">
      {/* Ambient Smoke Plumes Rising Above the Pack */}
      <div className="relative w-full max-w-[330px] sm:max-w-[360px] h-14 flex items-end justify-center pointer-events-none overflow-visible z-10">
        {cigsPerDay > 0.05 && (
          <svg
            className="w-64 h-24 overflow-visible"
            viewBox="0 0 240 90"
          >
            <path
              d="M65 85 Q45 55 75 35 T60 4"
              fill="none"
              stroke="rgba(231, 229, 228, 0.35)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-smoke-1"
            />
            <path
              d="M120 88 Q145 52 110 28 T130 2"
              fill="none"
              stroke="rgba(245, 158, 11, 0.28)"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-smoke-2"
            />
            {cigsPerDay > 2 && (
              <path
                d="M175 85 Q155 55 185 30 T170 5"
                fill="none"
                stroke="rgba(231, 229, 228, 0.25)"
                strokeWidth="2"
                strokeLinecap="round"
                className="animate-smoke-1"
              />
            )}
            {showMarginalCigPreview && (
              <path
                d="M198 82 Q215 48 190 22 T205 0"
                fill="none"
                stroke="rgba(251, 113, 133, 0.65)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-smoke-2"
              />
            )}
          </svg>
        )}
      </div>

      {/* THE CIGARETTE PACK CONTAINER */}
      <div className="relative w-full max-w-[330px] sm:max-w-[360px] animate-float-pack">
        {/* 1. OPEN FLIP-TOP LID BACKING */}
        <div
          className="mx-auto w-[92%] h-10 rounded-t-2xl border-t-2 border-x-2 border-stone-700/80 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #1C1917 0%, #0F0D0C 100%)',
            boxShadow: `0 -10px 30px ${severity.glowColor}`,
          }}
        >
          <div className="absolute inset-x-4 top-1.5 h-0.5 bg-amber-500/20 rounded-full" />
          <div className="text-center text-[9px] font-mono-code uppercase tracking-[0.25em] text-stone-500 pt-2.5">
            20 CLASS A PARTICULATE EQUIVALENTS
          </div>
        </div>

        {/* 2. CIGARETTE STICKS TRAY (POPPING OUT OF THE PACK) */}
        <div className="relative mx-auto w-[92%] h-28 bg-gradient-to-b from-[#171412] to-[#0E0C0A] border-x-2 border-stone-700/80 px-3 pt-2 overflow-visible flex flex-col justify-end">
          {/* Metallic Gold/Silver Foil Collar Rim */}
          <div
            className="absolute inset-x-2 bottom-0 h-12 rounded-t-lg opacity-30 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, #F59E0B 0%, #78716C 50%, #F59E0B 100%)',
            }}
          />

          {/* BACK ROW (Sticks 11–20) */}
          <div className="relative z-10 grid grid-cols-10 gap-1.5 px-1 items-end h-20 -mb-6">
            {backRow.map((slot) => {
              const pullUpPx = slot.isActive
                ? Math.round(14 + slot.activeFraction * 34)
                : 0;
              return (
                <div
                  key={slot.stickNumber}
                  className="flex flex-col items-center justify-end h-full"
                >
                  <div
                    className="w-full rounded-t-xs transition-all duration-700 ease-out relative overflow-hidden"
                    style={{
                      height: `${18 + pullUpPx}px`,
                      opacity: slot.isActive ? 0.92 : 0.2,
                      transform: slot.isActive ? 'translateY(-6px)' : 'translateY(0px)',
                    }}
                  >
                    {/* Glowing Ember Tip if active */}
                    {slot.isActive && (
                      <div className="w-full h-2 bg-gradient-to-b from-orange-400 via-red-500 to-stone-800 animate-ember" />
                    )}
                    {/* Cork Filter */}
                    <div
                      className="w-full h-4 border-b border-amber-900/60"
                      style={{
                        background:
                          'linear-gradient(90deg, #C2813A 0%, #D99B52 50%, #A36624 100%)',
                      }}
                    />
                    {/* Paper Body */}
                    <div className="w-full flex-1 bg-stone-300" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* FRONT ROW (Sticks 1–10) */}
          <div className="relative z-20 grid grid-cols-10 gap-1.5 items-end h-24">
            {frontRow.map((slot) => {
              // Active sticks pop dramatically out of the pack!
              const pullUpPx = slot.isActive
                ? Math.round(20 + slot.activeFraction * 48)
                : 0;
              return (
                <div
                  key={slot.stickNumber}
                  className="flex flex-col items-center justify-end h-full relative group"
                >
                  {/* Fractional Stick Label Badge */}
                  {slot.isFractional && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded bg-amber-500 text-stone-950 font-mono-code font-bold text-[9px] shadow z-30 whitespace-nowrap">
                      {slot.activeFraction.toFixed(1)}
                    </span>
                  )}

                  <div
                    className={`w-full rounded-t-xs transition-all duration-700 ease-out relative overflow-hidden flex flex-col ${
                      slot.isActive
                        ? 'shadow-[0_-4px_12px_rgba(245,158,11,0.3)]'
                        : ''
                    }`}
                    style={{
                      height: `${24 + pullUpPx}px`,
                      opacity: slot.isActive ? 1 : 0.28,
                    }}
                  >
                    {/* Glowing Ember & Ash Cone at Tip */}
                    {slot.isActive ? (
                      <div className="w-full h-2.5 shrink-0 flex flex-col">
                        <div className="w-full h-1 bg-zinc-400" />
                        <div className="w-full h-1.5 bg-gradient-to-r from-amber-400 via-red-500 to-orange-600 animate-ember" />
                      </div>
                    ) : (
                      <div className="w-full h-1 bg-amber-900/40 shrink-0" />
                    )}

                    {/* Cork Filter Tip */}
                    <div
                      className="w-full h-5 shrink-0 border-b border-amber-900/50 relative"
                      style={{
                        background:
                          'linear-gradient(90deg, #B8762E 0%, #DF9F57 50%, #9A5E1F 100%)',
                      }}
                    >
                      <div className="absolute inset-x-0 bottom-0.5 h-[1.5px] bg-amber-200/50" />
                    </div>

                    {/* White Paper Shaft */}
                    <div
                      className="w-full flex-1 relative"
                      style={{
                        background:
                          'linear-gradient(90deg, #E7E2D8 0%, #FAF8F5 50%, #CFC8B8 100%)',
                      }}
                    >
                      {/* Stick Number */}
                      {slot.isActive && (
                        <span className="absolute bottom-1 inset-x-0 text-center text-[8px] font-mono-code font-bold text-stone-600">
                          {slot.stickNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* +1 REAL CIGARETTE INTERACTIVE OVERLAY STICK */}
          {showMarginalCigPreview && (
            <div
              onClick={onToggleMarginalPreview}
              className="absolute -right-2 bottom-0 z-30 flex flex-col items-center cursor-pointer transition-all duration-500 animate-bounce"
              title="Tap to remove +1 Real Cigarette"
            >
              <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono-code font-bold text-[9px] uppercase tracking-wider shadow-lg mb-1 whitespace-nowrap">
                +1 Real (+{weberRelativeIncreasePct > 999 ? '>999' : weberRelativeIncreasePct.toFixed(0)}%)
              </span>
              <div className="w-5 h-24 rounded-t-xs overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.7)] border border-rose-400 flex flex-col">
                <div className="w-full h-3 bg-gradient-to-b from-yellow-300 via-rose-500 to-red-700 animate-ember" />
                <div className="w-full h-6 bg-gradient-to-r from-rose-700 via-rose-500 to-rose-700 border-b border-rose-300" />
                <div className="w-full flex-1 bg-rose-100 flex items-center justify-center">
                  <span className="text-[8px] font-mono-code font-bold text-rose-900 -rotate-90">
                    REAL
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. FRONT BODY OF THE CIGARETTE PACK BOX */}
        <div
          className="relative z-30 rounded-b-3xl border-2 border-stone-700/90 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, #1C1815 0%, #13100E 65%, #0D0B09 100%)',
          }}
        >
          {/* Classic Flip-Top V-Cutout Collar Line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-5 border-b-2 border-x-2 border-amber-500/40 rounded-b-xl bg-[#0D0B09]/90 flex items-center justify-center"
          >
            <span className="text-[9px] font-mono-code uppercase tracking-[0.2em] text-amber-400/90">
              airn&apos;t // {cityName.slice(0, 14)}
            </span>
          </div>

          {/* Subtle Diagonal Gold/Crimson Pack Crest */}
          <div
            className="mt-4 pt-3 pb-4 px-4 rounded-2xl border border-stone-800/90 bg-gradient-to-br from-stone-950/95 via-stone-900/80 to-stone-950/95 text-center relative overflow-hidden"
          >
            {/* Top Mini Pill Row: Live AQI & PM2.5 */}
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono-code mb-2">
              <span
                className="px-2 py-0.5 rounded font-semibold border"
                style={{
                  borderColor: `${severity.colorHex}55`,
                  backgroundColor: `${severity.colorHex}18`,
                  color: severity.colorHex,
                }}
              >
                AQI {usAqi}
              </span>
              <span className="text-stone-400">
                PM2.5: <strong className="text-stone-200">{pm25.toFixed(1)} µg/m³</strong>
              </span>
            </div>

            {/* GIANT CIGARETTE COUNTER */}
            <div className="my-1 flex items-baseline justify-center gap-2">
              <span
                className="text-6xl sm:text-7xl font-mono-code font-extrabold tracking-tighter leading-none"
                style={{
                  color: '#F5F2EB',
                  textShadow: `0 0 28px ${severity.glowColor}`,
                }}
              >
                {cigsPerDay.toFixed(1)}
              </span>
              {showMarginalCigPreview && (
                <span className="text-2xl font-mono-code font-bold text-rose-400">
                  +1
                </span>
              )}
            </div>

            <div className="text-xs font-mono-code uppercase tracking-[0.18em] text-amber-400 font-bold mt-1">
              Passive Cigarettes Today
            </div>

            <div className="text-[11px] font-mono-code text-stone-400 mt-1">
              {cigsPerDay >= 0.05 ? (
                <>
                  Inhaling <strong>1 cigarette</strong> every{' '}
                  <strong className="text-stone-200">{hoursPerCig} hours</strong> in {cityName}
                </>
              ) : (
                <>Virtually zero passive cigarettes today in {cityName}</>
              )}
            </div>

            {cigsPerDay > 20 && (
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-mono-code font-bold">
                <Flame className="w-3 h-3" />
                <span>{(cigsPerDay / 20).toFixed(2)} FULL PACKS / DAY</span>
              </div>
            )}
          </div>

          {/* SURGEON GENERAL / ECONOMIST PACK WARNING STAMP */}
          <div className="mt-3.5 border-2 border-[#E7E2D8] bg-[#F4EFE6] text-stone-950 p-2.5 rounded-lg font-mono-code">
            <div className="text-[9px] font-extrabold uppercase tracking-wider border-b border-stone-900 pb-0.5 mb-1 flex items-center justify-between">
              <span>ATMOSPHERIC TAX WARNING</span>
              <span>22 µg/m³ = 1 CIG</span>
            </div>
            <p className="text-[10px] font-sans font-semibold leading-tight text-stone-900">
              Breathing {cityName}&apos;s air forces your lungs to smoke{' '}
              <span className="underline">{(cigsPerDay * 7).toFixed(1)} cigarettes/week</span> (
              {((cigsPerDay * 365) / 20).toFixed(1)} packs/yr) with zero nicotine payoff.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
