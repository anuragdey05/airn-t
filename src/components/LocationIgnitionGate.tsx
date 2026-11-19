import React, { useEffect, useState } from 'react';
import {
  BenchmarkCitySeed,
  CityAirQualityData,
  GLOBAL_BENCHMARK_CITIES,
} from '../lib/aqiService';
import { AqiSeverity } from '../lib/economics';
import { triggerHaptic } from '../lib/haptics';
import { Flame, MapPin, ShieldAlert, Sparkles } from 'lucide-react';

export type IgnitionPhase = 'idle' | 'igniting' | 'revealing' | 'done';

interface LocationIgnitionGateProps {
  phase: IgnitionPhase;
  resolvedCity: CityAirQualityData | null;
  cigsPerDay: number;
  usAqi: number;
  severity: AqiSeverity;
  onSparkLocation: () => void;
  onSparkPresetCity: (seed: BenchmarkCitySeed) => void;
  onCompleteReveal: () => void;
}

export const LocationIgnitionGate: React.FC<LocationIgnitionGateProps> = ({
  phase,
  resolvedCity,
  cigsPerDay,
  usAqi,
  severity,
  onSparkLocation,
  onSparkPresetCity,
  onCompleteReveal,
}) => {
  const [showFlame, setShowFlame] = useState(false);
  const [burnPct, setBurnPct] = useState(0);
  const [statusStep, setStatusStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Drive the lighter flame -> cherry catch -> progressive inhale burn during 'igniting'
  useEffect(() => {
    if (phase === 'idle') {
      setShowFlame(false);
      setBurnPct(0);
      setStatusStep(0);
      setIsExiting(false);
      return;
    }

    if (phase === 'igniting') {
      setShowFlame(true);
      setBurnPct(5);
      setStatusStep(0);

      const t1 = window.setTimeout(() => {
        setBurnPct(12);
        setStatusStep(1);
      }, 550);

      const t2 = window.setTimeout(() => {
        setShowFlame(false);
        setBurnPct(18);
        setStatusStep(2);
      }, 950);

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }

    if (phase === 'revealing') {
      setShowFlame(false);
      setBurnPct(28); // Deep inhale drag on lock-in
      triggerHaptic([15, 40, 20]);

      const holdMs = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? 900
        : 1850;

      const exitTimer = window.setTimeout(() => {
        setIsExiting(true);
      }, holdMs);

      const doneTimer = window.setTimeout(() => {
        onCompleteReveal();
      }, holdMs + 320);

      return () => {
        window.clearTimeout(exitTimer);
        window.clearTimeout(doneTimer);
      };
    }
  }, [phase, onCompleteReveal]);

  if (phase === 'done') return null;

  const isLit = phase === 'igniting' || phase === 'revealing';
  const isRevealing = phase === 'revealing' && resolvedCity !== null;

  const statusMessages = [
    'Striking flint & awaiting browser location permission…',
    'Locking GPS coordinates & querying Copernicus CAMS…',
    'Inhaling trailing 24-hour local PM2.5 concentration…',
  ];

  const coordStamp = resolvedCity
    ? `${Math.abs(resolvedCity.latitude).toFixed(2)}°${
        resolvedCity.latitude >= 0 ? 'N' : 'S'
      }, ${Math.abs(resolvedCity.longitude).toFixed(2)}°${
        resolvedCity.longitude >= 0 ? 'E' : 'W'
      } · 24H PM2.5 ${resolvedCity.pm25.toFixed(1)} µg/m³`
    : '22.0 µg/m³ PM2.5 = 1 CIGARETTE / DAY';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Location permission and air quality ignition screen"
      onClick={() => {
        if (isRevealing) {
          triggerHaptic(10);
          onCompleteReveal();
        }
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between px-4 py-7 sm:py-10 bg-[#0B0A09] text-[#F2EDE4] select-none overflow-hidden transition-opacity duration-300 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${isRevealing ? 'cursor-pointer' : ''}`}
    >
      {/* Dynamic Ambient Ember Glow in Background */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: isRevealing
            ? `radial-gradient(circle at 50% 38%, ${severity.glowColor}, rgba(249,115,22,0.16) 40%, transparent 72%)`
            : isLit
            ? 'radial-gradient(circle at 38% 52%, rgba(249, 115, 22, 0.24), rgba(239, 68, 68, 0.08) 45%, transparent 70%)'
            : 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08), transparent 65%)',
        }}
      />

      {/* TOP HEADER BRAND MARK */}
      <div className="relative z-10 flex items-center gap-2.5">
        <img
          src="/favicon-32.png"
          alt=""
          width={28}
          height={28}
          className="w-7 h-7 rounded-lg border border-stone-800"
        />
        <span className="font-serif-editorial italic text-2xl tracking-wide text-stone-100">
          airn&apos;t
        </span>
        <span className="text-[10px] font-mono-code uppercase tracking-widest px-2 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-800">
          Atmospheric Telemetry
        </span>
      </div>

      {/* CENTER STAGE: SMOKE REVEAL + HORIZONTAL CIGARETTE + LIGHTER FLAME */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center my-auto py-4">
        {/* UPPER ZONE: Either Location Disclaimer (Idle) OR Rising Smoke & City Reveal (Igniting / Revealing) */}
        <div className="w-full min-h-[210px] flex flex-col items-center justify-end pb-6 text-center relative">
          {phase === 'idle' && (
            <div className="space-y-3.5 max-w-sm mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-mono-code">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location Required Before Entry</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif-editorial text-stone-100 leading-tight">
                Let&apos;s light up the air where you are.
              </h1>

              {/* Location Permission Disclaimer Box */}
              <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800 text-left flex items-start gap-2.5 shadow-xl">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-stone-300 leading-relaxed">
                  <strong className="text-stone-100">Enable Location Permission:</strong>{' '}
                  airn&apos;t needs your location to sample local 24-hour PM2.5 and calculate how
                  many passive cigarettes you&apos;re breathing today. Please tap{' '}
                  <span className="text-amber-300 font-semibold">&ldquo;Allow&rdquo;</span> when
                  your browser prompts you.
                </p>
              </div>
            </div>
          )}

          {isLit && (
            <div className="relative w-full flex flex-col items-center justify-end">
              {/* Rising Sculptural Smoke Plumes SVG */}
              <svg
                className="w-64 h-28 overflow-visible pointer-events-none -mb-3"
                viewBox="0 0 260 110"
                aria-hidden="true"
              >
                <path
                  d="M42 105 C 18 78, 68 52, 48 24 C 34 6, 85 -4, 125 -8"
                  fill="none"
                  stroke="rgba(242, 237, 228, 0.42)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-smoke-curl-1"
                />
                <path
                  d="M52 102 C 74 74, 28 48, 65 20 C 92 2, 140 -6, 175 -10"
                  fill="none"
                  stroke="rgba(245, 158, 11, 0.32)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="animate-smoke-curl-2"
                />
              </svg>

              {/* SMOKE-FORMED CITY & CIGARETTE COUNT REVEAL */}
              {isRevealing && resolvedCity ? (
                <div className="animate-smoke-reveal space-y-1.5 px-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-mono-code uppercase tracking-widest bg-stone-950/90 border-amber-500/40 text-amber-300 shadow-lg">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>
                      Location Locked · 24h AQI {usAqi}
                    </span>
                  </div>

                  <h2
                    className="text-4xl sm:text-5xl font-serif-editorial tracking-wide text-stone-100 leading-none pt-1"
                    style={{
                      textShadow: `0 0 32px ${severity.glowColor}, 0 2px 10px rgba(0,0,0,0.9)`,
                    }}
                  >
                    {resolvedCity.city}
                  </h2>

                  {resolvedCity.country && (
                    <div className="text-xs font-mono-code uppercase tracking-widest text-stone-400">
                      {resolvedCity.region ? `${resolvedCity.region}, ` : ''}
                      {resolvedCity.country}
                    </div>
                  )}

                  <div className="pt-2 flex items-baseline justify-center gap-2">
                    <span
                      className="text-4xl sm:text-5xl font-mono-code font-extrabold"
                      style={{ color: severity.colorHex }}
                    >
                      {cigsPerDay.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono-code uppercase tracking-wider text-stone-200 font-bold">
                      Passive Cigarettes / Day
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 py-4">
                  <div className="text-xs font-mono-code uppercase tracking-widest text-amber-400">
                    Igniting Atmospheric Telemetry…
                  </div>
                  <p
                    role="status"
                    className="text-xs sm:text-sm font-mono-code text-stone-300"
                  >
                    {statusMessages[statusStep]}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* THE HORIZONTAL CIGARETTE ON STAGE */}
        <div className="relative w-full max-w-[340px] sm:max-w-[370px] h-16 flex items-center justify-center my-2">
          {/* Flickering Lighter Flame under the tip during ignition */}
          {showFlame && (
            <div
              className="absolute -left-3 -bottom-5 z-30 pointer-events-none animate-flame"
              aria-hidden="true"
            >
              <svg width="46" height="64" viewBox="0 0 46 64">
                <defs>
                  <radialGradient id="flameOuter" cx="50%" cy="65%" r="55%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="45%" stopColor="#F97316" />
                    <stop offset="85%" stopColor="#DC2626" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path
                  d="M23 4 C 33 20, 40 34, 35 48 C 32 56, 27 60, 23 60 C 19 60, 14 56, 11 48 C 6 34, 13 20, 23 4 Z"
                  fill="url(#flameOuter)"
                />
                <path
                  d="M23 22 C 28 32, 30 42, 27 52 C 25 56, 21 56, 19 52 C 16 42, 18 32, 23 22 Z"
                  fill="#FEF9C3"
                />
              </svg>
            </div>
          )}

          {/* Cigarette Cylinder Body */}
          <div className="relative w-full h-9 rounded-md shadow-[0_14px_35px_rgba(0,0,0,0.85)] flex items-center overflow-visible">
            {/* 1. Ash + Glowing Cherry Tip on Left */}
            <div
              className="h-full shrink-0 flex items-center transition-all duration-700 ease-out relative"
              style={{
                width: isLit ? `${Math.max(14, burnPct)}%` : '10px',
              }}
            >
              {isLit ? (
                <>
                  {/* Gray Textured Ash Cone */}
                  <div
                    className="h-[88%] flex-1 rounded-l-sm relative overflow-hidden"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, #57534E 0px, #78716C 3px, #44403C 6px)',
                    }}
                  />
                  {/* Glowing Orange-Red Cherry Ember */}
                  <div
                    className="h-full w-3.5 shrink-0 animate-cherry relative z-20"
                    style={{
                      background:
                        'linear-gradient(90deg, #FEF08A 0%, #F97316 40%, #DC2626 80%, #450A0A 100%)',
                    }}
                  />
                </>
              ) : (
                /* Unlit Raw Tobacco Tip */
                <div
                  className="h-full w-full rounded-l-sm border-r border-stone-400"
                  style={{
                    background:
                      'linear-gradient(180deg, #92400E 0%, #78350F 50%, #451A03 100%)',
                  }}
                />
              )}
            </div>

            {/* 2. White Ribbed Rolling Paper Shaft (with Gold Coordinate Hot-Stamp on Reveal) */}
            <div
              className="h-full flex-1 relative flex items-center justify-center px-2 overflow-hidden transition-all duration-700"
              style={{
                background:
                  'linear-gradient(180deg, #FAF8F5 0%, #EAE4D7 55%, #C7C0B0 100%)',
              }}
            >
              {/* Subtle vertical paper ribs */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, transparent, transparent 4px, #000 4px, #000 5px)',
                }}
              />

              {/* Charred paper edge next to ember when lit */}
              {isLit && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, #1C1917 0%, #78350F 50%, transparent 100%)',
                  }}
                />
              )}

              {/* Hot-Stamped Gold Coordinates / Brand Text on the Paper */}
              <span
                key={isRevealing ? 'revealed-stamp' : 'idle-stamp'}
                className={`relative z-10 text-[9px] sm:text-[10px] font-mono-code font-bold uppercase truncate ${
                  isRevealing
                    ? 'text-amber-900 animate-hot-stamp'
                    : 'text-stone-500 tracking-[0.18em]'
                }`}
              >
                {coordStamp}
              </span>
            </div>

            {/* 3. Metallic Gold Collar Band */}
            <div
              className="h-full w-2 shrink-0"
              style={{
                background:
                  'linear-gradient(180deg, #FDE68A 0%, #D97706 50%, #92400E 100%)',
              }}
            />

            {/* 4. Cork Filter Tip on Right (26% width) */}
            <div
              className="h-full w-[25%] shrink-0 rounded-r-sm relative overflow-hidden flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(180deg, #DDA15E 0%, #BC6C25 55%, #8D4E17 100%)',
              }}
            >
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#451a03_1px,transparent_1px)] [background-size:5px_5px]" />
              <span className="relative z-10 font-serif-editorial italic text-xs text-amber-100/80">
                airn&apos;t
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION ZONE: Spark CTA + Manual City Fallback (or Skip Hint during reveal) */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-4">
        {phase === 'idle' && (
          <>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(18);
                onSparkLocation();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-stone-950 font-mono-code font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.35)] cursor-pointer transition-all"
            >
              <Flame className="w-4 h-4 fill-stone-950" />
              <span>Light Up &amp; Allow Location</span>
            </button>

            {/* Manual City Fallback Quick-Picks */}
            <div className="w-full text-center pt-1">
              <span className="text-[11px] font-mono-code text-stone-400 block mb-2">
                Don&apos;t want to share GPS? Spark a city manually:
              </span>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {GLOBAL_BENCHMARK_CITIES.slice(0, 6).map((seed) => (
                  <button
                    key={seed.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(12);
                      onSparkPresetCity(seed);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-stone-950 hover:bg-stone-900 text-stone-300 hover:text-amber-300 border border-stone-800 text-xs font-mono-code cursor-pointer transition-colors !min-h-[34px]"
                  >
                    {seed.city}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {phase === 'igniting' && (
          <p className="text-xs font-mono-code text-stone-400 text-center">
            Tip: Click <strong className="text-amber-300">&ldquo;Allow&rdquo;</strong> on your
            browser&apos;s location prompt if shown.
          </p>
        )}

        {isRevealing && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(10);
              onCompleteReveal();
            }}
            className="px-4 py-2 rounded-full bg-stone-900/90 border border-stone-700 text-xs font-mono-code text-amber-300 hover:bg-stone-800 cursor-pointer"
          >
            Opening your pack… (Tap to enter now →)
          </button>
        )}
      </div>
    </div>
  );
};
