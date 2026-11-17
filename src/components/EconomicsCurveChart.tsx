import React, { useState } from 'react';
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

  const maxCigDomain = Math.max(12, Math.ceil(economics.effectiveCigsPerDay + 3));
  const width = 640;
  const height = 270;
  const padLeft = 54;
  const padRight = 28;
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

  // Tab 2 current coordinates
  const curMcPct = (economics.marginalHealthCostCurrent / mc0) * 100;
  const curY_MC = yForMcPct(curMcPct);
  const curY_Prop = yForMcPct(economics.smokingPropensityPct);

  return (
    <div className="rounded-2xl border border-stone-800/90 bg-[#12100E]/95 p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
            <Activity className="w-3.5 h-3.5" />
            <span>Econometric & Epidemiological Proof Engine</span>
          </div>
          <h3 className="text-lg font-serif-editorial tracking-wide text-stone-100 mt-0.5">
            Why Higher AQI Lowers the Marginal Cost of Lighting Up
          </h3>
        </div>

        <div className="inline-flex rounded-xl bg-stone-950 p-1 border border-stone-800">
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
      <p className="text-sm text-stone-300 mb-4">{cityName}: {economics.effectiveCigsPerDay.toFixed(2)} passive cigarettes/day; marginal harm discount {economics.marginalDamageDiscountPct.toFixed(0)}%; smoking propensity {economics.smokingPropensityPct}%. Scroll the chart horizontally on smaller screens.</p>
      <div className="chart-scroll" tabIndex={0} role="region" aria-label="Economic model chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img" aria-label={activeTab === 'pope_concave' ? 'Concave dose-response curve' : 'Marginal cost crossover curve'}
          className="science-chart w-full h-auto select-none bg-stone-950/60 rounded-xl border border-stone-900"
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
                  className="fill-stone-500 text-xs font-mono-code"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* X-Axis Ticks (Cigarettes per day) */}
          {Array.from({ length: 7 }, (_, i) => {
            const val = Math.round((i / 6) * maxCigDomain);
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
                  textAnchor="middle"
                  className="fill-stone-400 text-xs font-mono-code"
                >
                  {val} cigs
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
                Clean Air ΔRisk (+{(economics.marginalHealthCostPristine * 100).toFixed(1)}%)
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
                x={Math.min(width - 215, Math.max(padLeft + 10, curX - 80))}
                y={Math.max(padTop + 4, curY_RR - 44)}
                width="195"
                height="34"
                rx="6"
                fill="rgba(18, 16, 14, 0.92)"
                stroke="rgba(245, 158, 11, 0.45)"
              />
              <text
                x={Math.min(width - 207, Math.max(padLeft + 18, curX - 72))}
                y={Math.max(padTop + 18, curY_RR - 30)}
                className="fill-amber-300 text-xs font-mono-code font-semibold"
              >
                {cityName}: {economics.effectiveCigsPerDay.toFixed(2)} cigs/day
              </text>
              <text
                x={Math.min(width - 207, Math.max(padLeft + 18, curX - 72))}
                y={Math.max(padTop + 31, curY_RR - 17)}
                className="fill-rose-300 text-xs font-mono-code"
              >
                +1 Cig ΔRisk: +{(economics.marginalHealthCostCurrent * 100).toFixed(2)}% (-
                {economics.marginalDamageDiscountPct.toFixed(0)}% cost)
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

              {/* Legend */}
              <g transform={`translate(${padLeft + 14}, ${padTop + 10})`}>
                <rect
                  x="0"
                  y="0"
                  width="265"
                  height="44"
                  rx="6"
                  fill="rgba(12, 10, 9, 0.88)"
                  stroke="rgba(255,255,255,0.08)"
                />
                <circle cx="14" cy="14" r="4" fill="#10B981" />
                <text x="24" y="18" className="fill-emerald-300 text-xs font-mono-code">
                  Marginal Health Cost MC(C) [{curMcPct.toFixed(0)}% of clean air]
                </text>
                <circle cx="14" cy="31" r="4" fill="#F43F5E" />
                <text x="24" y="35" className="fill-rose-300 text-xs font-mono-code">
                  Marginal Smoking Propensity P(Smoke) [{economics.smokingPropensityPct}%]
                </text>
              </g>
            </>
          )}
        </svg>
      </div>

      {/* Concise Mathematical Proof Box */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80">
          <div className="font-mono-code text-amber-400 uppercase text-xs mb-1">
            1. Concave Dose-Response
          </div>
          <p className="text-stone-300 leading-relaxed">
            Pope et al. (2009) show cardiovascular risk scales as{' '}
            <code className="text-amber-200 font-mono-code">RR(C) = 1 + α·C^0.42</code>. Because the
            second derivative <code className="text-amber-200 font-mono-code">d²RR/dC² &lt; 0</code>,
            every passive smog cigarette flattens the slope for the next real cigarette.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80">
          <div className="font-mono-code text-emerald-400 uppercase text-xs mb-1 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>2. Marginal Damage Discount</span>
          </div>
          <p className="text-stone-300 leading-relaxed">
            In pristine air, 1 cigarette raises relative risk by{' '}
            <strong className="text-stone-100">+{(economics.marginalHealthCostPristine * 100).toFixed(2)}%</strong>. In{' '}
            <strong className="text-amber-300">{cityName}</strong>, that same cigarette adds{' '}
            <strong className="text-stone-100">+{(economics.marginalHealthCostCurrent * 100).toFixed(2)}%</strong> — a{' '}
            <strong className="text-emerald-300">{economics.marginalDamageDiscountPct.toFixed(0)}% marginal discount</strong>.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80">
          <div className="font-mono-code text-rose-400 uppercase text-xs mb-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>3. Weber-Fechner & Competing Risk</span>
          </div>
          <p className="text-stone-300 leading-relaxed">
            By Kahneman &amp; Tversky’s reference-dependence, 1 active cigarette represents a{' '}
            <strong className="text-rose-300">
              +{economics.weberRelativeIncreasePct > 999 ? '>999' : economics.weberRelativeIncreasePct.toFixed(1)}%
            </strong>{' '}
            shift over your ambient reference point ({economics.perceptualMaskingScore}% perceptual masking).
          </p>
        </div>
      </div>
    </div>
  );
};
