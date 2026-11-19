import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  EconomicBreakdown,
  marginalHealthCostOfOneCig,
  popeRelativeRisk,
} from '../lib/economics';
import { TrendingDown, Activity, BookOpen } from 'lucide-react';

interface EconomicsCurveChartProps {
  economics: EconomicBreakdown;
  cityName: string;
}

export const EconomicsCurveChart: React.FC<EconomicsCurveChartProps> = ({
  economics,
  cityName,
}) => {
  const [activeTab, setActiveTab] = useState<'pope_concave' | 'marginal_cost'>('pope_concave');

  // Lay the chart out in real pixels (1 SVG unit ≈ 1 CSS px) so text stays legible on phones,
  // instead of shrinking a fixed 640-wide drawing down to ~50%.
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(640);
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    setFrameWidth(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setFrameWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const width = Math.round(Math.min(1040, Math.max(300, frameWidth || 640)));
  const isNarrow = width < 480;
  const tickCount = isNarrow ? 4 : 7;

  const maxCigDomain = Math.max(12, Math.ceil(economics.effectiveCigsPerDay + 3));
  const height = isNarrow ? 240 : 270;
  const padLeft = isNarrow ? 46 : 54;
  const padRight = isNarrow ? 14 : 28;
  const padTop = 26;
  const padBottom = 42;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xForCig = (c: number) => padLeft + (Math.min(c, maxCigDomain) / maxCigDomain) * plotW;

  // Tab 1: Pope et al. (2009) Relative Risk RR(C) from 1.0 to RR(maxCigDomain)
  const minRR = 1.0;
  const maxRR = popeRelativeRisk(maxCigDomain) + 0.05;
  const yForRR = (rr: number) =>
    padTop + plotH - ((rr - minRR) / (maxRR - minRR)) * plotH;

  // Tab 2: Marginal Health Cost MC(C) normalized as % of pristine air MC(0)
  const mc0 = marginalHealthCostOfOneCig(0);
  const yForMcPct = (pct: number) => padTop + plotH - (pct / 105) * plotH;

  // Build SVG path points
  const steps = 60;
  const popePoints: string[] = [];
  const mcPoints: string[] = [];
  const propensityPoints: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const c = (i / steps) * maxCigDomain;
    const x = xForCig(c);

    const rr = popeRelativeRisk(c);
    popePoints.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yForRR(rr).toFixed(1)}`);

    const mcPct = (marginalHealthCostOfOneCig(c) / mc0) * 100;
    mcPoints.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yForMcPct(mcPct).toFixed(1)}`);

    // Propensity curve at current craving for comparison
    const salienceW = 1 / (1 + 0.45 * c);
    const deterrence = 0.65 * (mcPct / 100) + 0.35 * salienceW;
    const logitZ = 3.1 * (0.5 - 0.68 * deterrence + 0.08);
    const propPct = (1 / (1 + Math.exp(-logitZ))) * 100;
    propensityPoints.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yForMcPct(propPct).toFixed(1)}`);
  }

  const curC = Math.min(economics.effectiveCigsPerDay, maxCigDomain - 1);
  const nextC = Math.min(curC + 1, maxCigDomain);

  const curX = xForCig(curC);
  const nextX = xForCig(nextC);

  const curRR = popeRelativeRisk(curC);
  const nextRR = popeRelativeRisk(nextC);
  const curY_RR = yForRR(curRR);
  const nextY_RR = yForRR(nextRR);

  // Pristine reference step (0 -> 1 cig)
  const zeroX = xForCig(0);
  const oneX = xForCig(1);
  const zeroY_RR = yForRR(popeRelativeRisk(0));
  const oneY_RR = yForRR(popeRelativeRisk(1));

  // Current-city callout: narrower box and an ellipsised city name on small screens
  const calloutW = isNarrow ? 214 : 254;
  const maxCityChars = isNarrow ? 10 : 18;
  const calloutCity =
    cityName.length > maxCityChars ? `${cityName.slice(0, maxCityChars - 1).trimEnd()}…` : cityName;

  // Tab 2 current coordinates
  const curMcPct = (economics.marginalHealthCostCurrent / mc0) * 100;
  const curY_MC = yForMcPct(curMcPct);
  const curY_Prop = yForMcPct(economics.smokingPropensityPct);

  return (
    <div className="rounded-2xl border border-stone-800/90 bg-panel/95 p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Econometric & Epidemiological Proof Engine</span>
          </div>
          <h2 className="font-serif-editorial tracking-wide text-stone-100 mt-0.5">
            Why Higher AQI Lowers the Marginal Cost of Lighting Up
          </h2>
        </div>

        <div role="group" aria-label="Chart view" className="inline-flex flex-wrap rounded-xl bg-stone-950 p-1 border border-stone-800">
          <button
            type="button"
            aria-pressed={activeTab === 'pope_concave'}
            onClick={() => setActiveTab('pope_concave')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-colors cursor-pointer ${
              activeTab === 'pope_concave'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            1. Pope (2009) Concave Risk
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'marginal_cost'}
            onClick={() => setActiveTab('marginal_cost')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono-code transition-colors cursor-pointer ${
              activeTab === 'marginal_cost'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            2. Becker-Murphy Marginal Crossover
          </button>
        </div>
      </div>

      {/* Interactive SVG Graph */}
      <p className="text-xs sm:text-sm text-stone-300 mb-3">
        <strong>{cityName}:</strong> {economics.effectiveCigsPerDay.toFixed(2)} passive cigarettes/day · slope discount -{economics.marginalDamageDiscountPct.toFixed(0)}% · illustrative temptation index {economics.smokingPropensityPct}%.
      </p>
      <div ref={frameRef} className="w-full" role="region" aria-label="Economic model chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={activeTab === 'pope_concave' ? 'Concave dose-response curve' : 'Marginal cost crossover curve'}
          className="w-full h-auto select-none bg-stone-950/60 rounded-xl border border-stone-900"
        >
          <defs>
            <linearGradient id="amberArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
            const y = padTop + t * plotH;
            const label =
              activeTab === 'pope_concave'
                ? (maxRR - t * (maxRR - minRR)).toFixed(2) + 'x'
                : Math.round(100 - t * 100) + '%';
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-stone-400 text-xs font-mono-code"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X-Axis Ticks (Cigarettes per day) */}
          {Array.from({ length: tickCount }, (_, i) => {
            const val = Math.round((i / (tickCount - 1)) * maxCigDomain);
            const x = xForCig(val);
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + plotH}
                  stroke="rgba(255,255,255,0.04)"
                />
                <text
                  x={x}
                  y={height - 14}
                  textAnchor={i === tickCount - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
                  className="fill-stone-400 text-xs font-mono-code"
                >
                  {isNarrow ? val : `${val} cigs`}
                </text>
              </g>
            );
          })}

          {activeTab === 'pope_concave' ? (
            <>
              {/* Area under Pope curve */}
              <path
                d={`${popePoints.join(' ')} L${width - padRight},${padTop + plotH} L${padLeft},${
                  padTop + plotH
                } Z`}
                fill="url(#amberArea)"
              />

              {/* Pope Curve Line */}
              <path
                d={popePoints.join(' ')}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
              />

              {/* Pristine Air Reference Slope Triangle (0 -> 1 cig) */}
              <line
                x1={zeroX}
                y1={zeroY_RR}
                x2={oneX}
                y2={zeroY_RR}
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <line
                x1={oneX}
                y1={zeroY_RR}
                x2={oneX}
                y2={oneY_RR}
                stroke="#10B981"
                strokeWidth="2.5"
              />
              <text
                x={oneX + 6}
                y={(zeroY_RR + oneY_RR) / 2 + 3}
                className="fill-emerald-400 text-xs font-mono-code"
              >
                {isNarrow ? 'Clean air' : 'Clean Air ΔRisk'} (+{(economics.marginalHealthCostPristine * 100).toFixed(1)}%)
              </text>

              {/* Current City Marginal Step Triangle (C_env -> C_env + 1) */}
              <line
                x1={curX}
                y1={curY_RR}
                x2={nextX}
                y2={curY_RR}
                stroke="#F43F5E"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <line
                x1={nextX}
                y1={curY_RR}
                x2={nextX}
                y2={nextY_RR}
                stroke="#F43F5E"
                strokeWidth="3"
              />
              {/* Vertical guide for current city */}
              <line
                x1={curX}
                y1={curY_RR}
                x2={curX}
                y2={padTop + plotH}
                stroke="rgba(245, 158, 11, 0.4)"
                strokeDasharray="3 3"
              />

              <circle
                cx={curX}
                cy={curY_RR}
                r="5.5"
                className="fill-amber-400 stroke-stone-950 stroke-2"
              />
              <circle
                cx={nextX}
                cy={nextY_RR}
                r="4.5"
                className="fill-rose-400 stroke-stone-950 stroke-2"
              />

              <rect
                x={Math.min(width - padRight - calloutW - 4, Math.max(padLeft + 8, curX - 110))}
                y={Math.max(padTop + 4, curY_RR - 46)}
                width={calloutW}
                height="38"
                rx="6"
                fill="rgba(18, 16, 14, 0.94)"
                stroke="rgba(245, 158, 11, 0.45)"
              />
              <text
                x={Math.min(width - padRight - calloutW + 6, Math.max(padLeft + 18, curX - 100))}
                y={Math.max(padTop + 19, curY_RR - 31)}
                className="fill-amber-300 text-xs font-mono-code font-semibold"
              >
                {calloutCity}: {economics.effectiveCigsPerDay.toFixed(2)} cigs/day
              </text>
              <text
                x={Math.min(width - padRight - calloutW + 6, Math.max(padLeft + 18, curX - 100))}
                y={Math.max(padTop + 34, curY_RR - 16)}
                className="fill-rose-300 text-xs font-mono-code"
              >
                +1 cig: +{(economics.marginalHealthCostCurrent * 100).toFixed(2)}% (−
                {economics.marginalDamageDiscountPct.toFixed(0)}% slope)
              </text>
            </>
          ) : (
            <>
              {/* Tab 2: Marginal Health Cost (Green falling curve) vs Smoking Propensity (Rose rising curve) */}
              <path
                d={mcPoints.join(' ')}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
              />
              <path
                d={propensityPoints.join(' ')}
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />

              <line
                x1={curX}
                y1={padTop}
                x2={curX}
                y2={padTop + plotH}
                stroke="rgba(245, 158, 11, 0.45)"
                strokeDasharray="3 3"
              />

              <circle
                cx={curX}
                cy={curY_MC}
                r="5"
                className="fill-emerald-400 stroke-stone-950 stroke-2"
              />
              <circle
                cx={curX}
                cy={curY_Prop}
                r="5"
                className="fill-rose-400 stroke-stone-950 stroke-2"
              />

            </>
          )}
        </svg>
        {activeTab === 'marginal_cost' && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono-code">
            <li className="flex items-center gap-1.5 text-emerald-300">
              <span aria-hidden="true" className="inline-block w-3 h-0.5 bg-emerald-500" />
              Marginal Health Cost MC(C) [{curMcPct.toFixed(0)}% of clean air]
            </li>
            <li className="flex items-center gap-1.5 text-rose-300">
              <span aria-hidden="true" className="inline-block w-3 border-t-2 border-dashed border-rose-500" />
              Illustrative Temptation Index [{economics.smokingPropensityPct}%]
            </li>
          </ul>
        )}
        <p className="mt-1 text-xs font-mono-code text-stone-400">
          X-axis: passive cigarettes per day · Y-axis: {activeTab === 'pope_concave' ? 'relative mortality risk' : '% of clean-air value'}
        </p>
      </div>

      {/* Concise Mathematical Proof Box */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80">
          <div className="font-mono-code text-amber-400 uppercase text-xs mb-1">
            1. Curve Fitted to Pope (2009)
          </div>
          <p className="text-stone-300 leading-relaxed">
            Fitted to Pope et al. (2009, Fig. 2):{' '}
            <code className="text-amber-200 font-mono-code">RR(C) = 1 + 0.26·((C+0.15)^0.42 − 0.15^0.42)</code>.
            Because <code className="text-amber-200 font-mono-code">d²RR/dC² &lt; 0</code>,
            baseline pollution flattens the incremental slope for the next cigarette.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80">
          <div className="font-mono-code text-emerald-400 uppercase text-xs mb-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>2. Slope Flattening Discount</span>
          </div>
          <p className="text-stone-300 leading-relaxed">
            In pristine air, 1 cigarette raises relative risk by{' '}
            <strong className="text-stone-100">+{(economics.marginalHealthCostPristine * 100).toFixed(2)}%</strong>. In{' '}
            <strong className="text-amber-300">{cityName}</strong>, that same cigarette adds{' '}
            <strong className="text-stone-100">+{(economics.marginalHealthCostCurrent * 100).toFixed(2)}%</strong> — a{' '}
            <strong className="text-emerald-300">{economics.marginalDamageDiscountPct.toFixed(0)}% flatter slope</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80">
          <div className="font-mono-code text-rose-400 uppercase text-xs mb-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>3. Illustrative Temptation Index</span>
          </div>
          <p className="text-stone-300 leading-relaxed">
            A real cigarette is a{' '}
            <strong className="text-rose-300">
              +{economics.weberRelativeIncreasePct > 999 ? '>999' : economics.weberRelativeIncreasePct.toFixed(1)}%
            </strong>{' '}
            jump over today’s 24h ambient dose. The 1–99% Temptation Index is an illustrative behavioral composite, not a clinical metric.
          </p>
        </div>
      </div>

      <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-stone-950/60 border border-stone-800/70 text-xs text-stone-400 font-mono-code">
        <strong className="text-stone-200">Methodology Note:</strong> The 22 µg/m³ = 1 cig/day rule is from Berkeley Earth (2015) using 24-hour mean PM2.5. The dose-response curve is fitted to Pope et al. (2009) Table 1 anchors, while the Temptation Index is a satirical behavioral-economics score. Smoking harms health at any AQI.
      </div>
    </div>
  );
};
