import React from 'react';
import { EconomicBreakdown } from '../lib/economics';
import { Flame, ShieldAlert, Scale, ArrowRight, PlusCircle, CheckCircle2 } from 'lucide-react';

interface ShouldYouSmokeCardProps {
  economics: EconomicBreakdown;
  cityName: string;
  showMarginalCigPreview: boolean;
  onToggleMarginalPreview: () => void;
  onOpenScienceTab: () => void;
}

export const ShouldYouSmokeCard: React.FC<ShouldYouSmokeCardProps> = ({
  economics,
  cityName,
  showMarginalCigPreview,
  onToggleMarginalPreview,
  onOpenScienceTab,
}) => {
  const {
    effectiveCigsPerDay,
    smokingPropensityPct,
    marginalDamageDiscountPct,
    weberRelativeIncreasePct,
    economicPersona,
  } = economics;

  const isGo = smokingPropensityPct >= 60;
  const isBorderline = smokingPropensityPct >= 35 && smokingPropensityPct < 60;

  let verdictHeadline = "HOLD OFF — AIR IS TOO CLEAN";
  let verdictOneLiner = `In ${cityName}'s clean air (${effectiveCigsPerDay.toFixed(
    1
  )} cigs/day), you sit on the steepest slope of Pope et al.'s risk curve. 1 real cigarette inflicts near-100% marginal guilt.`;
  let accentBorder = 'border-emerald-500/40';
  let accentBg = 'from-emerald-950/35 via-[#14110E] to-[#12100E]';
  let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  let IconComponent = ShieldAlert;

  if (isGo) {
    verdictHeadline = "MIGHT AS WELL LIGHT UP*";
    verdictOneLiner = `You've already inhaled ${effectiveCigsPerDay.toFixed(
      1
    )} cigarettes of tar today with zero nicotine buzz. Because smog flattens the dose-response curve, 1 real cigarette does ${marginalDamageDiscountPct.toFixed(
      0
    )}% less marginal harm here than in clean air.`;
    accentBorder = 'border-rose-500/50';
    accentBg = 'from-rose-950/40 via-[#16110F] to-[#12100E]';
    badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    IconComponent = Flame;
  } else if (isBorderline) {
    verdictHeadline = "BORDERLINE // HEDONIC TOSS-UP";
    verdictOneLiner = `${cityName}'s haze (${effectiveCigsPerDay.toFixed(
      1
    )} cigs/day) discounts the marginal health cost of a cigarette by ${marginalDamageDiscountPct.toFixed(
      0
    )}%, but lighting up still adds +${weberRelativeIncreasePct.toFixed(
      0
    )}% to today's particulate load.`;
    accentBorder = 'border-amber-500/45';
    accentBg = 'from-amber-950/35 via-[#15120E] to-[#12100E]';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    IconComponent = Scale;
  }

  return (
    <div
      className={`w-full max-w-md mx-auto rounded-3xl border-2 ${accentBorder} bg-gradient-to-b ${accentBg} p-5 shadow-2xl transition-all`}
    >
      {/* Question Header & Persona Pill */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-[10px] font-mono-code uppercase tracking-widest text-stone-400">
          Should you go smoke a cigarette?
        </span>
        <span
          className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border ${badgeClass}`}
        >
          {economicPersona}
        </span>
      </div>

      {/* Big Verdict Headline */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${badgeClass}`}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif-editorial tracking-wide text-stone-100 leading-tight">
          {verdictHeadline}
        </h2>
      </div>

      {/* Concise 1-Paragraph Economic Explanation */}
      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-4">
        {verdictOneLiner}
      </p>

      {/* 3-Pill Metric Strip */}
      <div className="grid grid-cols-3 gap-2 mb-4 font-mono-code text-center">
        <div className="p-2.5 rounded-2xl bg-stone-950/85 border border-stone-800/90">
          <span className="text-[9px] uppercase text-stone-400 block">
            Smoke Likelihood
          </span>
          <span className="text-lg sm:text-xl font-bold text-rose-400">
            {smokingPropensityPct}%
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-stone-950/85 border border-stone-800/90">
          <span className="text-[9px] uppercase text-stone-400 block">
            Harm Discount
          </span>
          <span className="text-lg sm:text-xl font-bold text-emerald-400">
            -{marginalDamageDiscountPct.toFixed(0)}%
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-stone-950/85 border border-stone-800/90">
          <span className="text-[9px] uppercase text-stone-400 block">
            +1 Cig Load
          </span>
          <span className="text-lg sm:text-xl font-bold text-amber-300">
            +{weberRelativeIncreasePct > 999 ? '>999' : weberRelativeIncreasePct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Interactive Action Row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMarginalPreview}
          className={`flex-1 py-2.5 px-3.5 rounded-2xl text-xs font-mono-code font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
            showMarginalCigPreview
              ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/25'
              : 'bg-stone-900/95 hover:bg-stone-800 text-amber-300 border-amber-500/40'
          }`}
        >
          {showMarginalCigPreview ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>+1 Real Cig Pulled</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Pull +1 Real Cig</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenScienceTab}
          className="py-2.5 px-3.5 rounded-2xl bg-stone-950 hover:bg-stone-900 text-stone-300 hover:text-amber-300 border border-stone-800 text-xs font-mono-code flex items-center gap-1 transition-all cursor-pointer shrink-0"
        >
          <span>Proof</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isGo && (
        <p className="text-[10px] text-stone-500 italic mt-2.5 text-center">
          *Satirical behavioral-economics evaluation (Pope 2009 &amp; Becker-Murphy 1988), not medical advice.
        </p>
      )}
    </div>
  );
};
