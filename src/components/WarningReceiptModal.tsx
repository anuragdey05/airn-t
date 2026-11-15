import React, { useState } from 'react';
import { CityAirQualityData } from '../lib/aqiService';
import { EconomicBreakdown } from '../lib/economics';
import { X, Copy, Check, AlertTriangle, Printer } from 'lucide-react';

interface WarningReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityData: CityAirQualityData;
  economics: EconomicBreakdown;
  hoursOutdoors: number;
  packPriceUsd: number;
}

export const WarningReceiptModal: React.FC<WarningReceiptModalProps> = ({
  isOpen,
  onClose,
  cityData,
  economics,
  hoursOutdoors,
  packPriceUsd,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `🚬 airn't RECEIPT — ${cityData.city.toUpperCase()}
• Live US AQI: ${economics.usAqi} (${cityData.pm25.toFixed(1)} µg/m³ PM2.5)
• Daily Passive Intake: ${economics.effectiveCigsPerDay.toFixed(2)} cigarettes/day (${economics.packsPerYear.toFixed(1)} packs/yr)
• Pope (2009) Marginal Damage Discount: -${economics.marginalDamageDiscountPct.toFixed(0)}% vs clean air
• Weber-Fechner +1 Cig Load: +${economics.weberRelativeIncreasePct.toFixed(1)}%
• Becker-Murphy Smoking Propensity: ${economics.smokingPropensityPct}% (${economics.verdictTitle})`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl bg-[#F4EFE6] text-stone-950 p-6 shadow-2xl border-4 border-stone-900 font-mono-code">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Surgeon General / Economist Black-Bordered Warning Box */}
        <div className="border-2 border-stone-950 p-3 mb-4 bg-amber-400/20">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider border-b border-stone-950 pb-1.5 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-stone-950 shrink-0" />
            <span>SURGEON GENERAL &amp; ECONOMIST WARNING</span>
          </div>
          <p className="text-[11px] leading-snug font-sans font-semibold text-stone-900">
            Breathing ambient air in <span className="underline">{cityData.city}</span> forces your
            lungs to inhale the equivalent of{' '}
            <span>{economics.effectiveCigsPerDay.toFixed(2)} cigarettes per day</span>. Due to Pope
            et al. (2009) concave dose-response saturation, the marginal health cost of lighting an
            actual cigarette is discounted by{' '}
            <span>{economics.marginalDamageDiscountPct.toFixed(0)}%</span>.
          </p>
        </div>

        {/* Receipt Header */}
        <div className="text-center border-b border-dashed border-stone-400 pb-3 mb-3">
          <div className="text-sm font-bold tracking-widest uppercase">
            airn&apos;t // TAR TAX RECEIPT
          </div>
          <div className="text-[11px] text-stone-600">
            LOC: {cityData.city.toUpperCase()} ({cityData.latitude.toFixed(2)}°,{' '}
            {cityData.longitude.toFixed(2)}°)
          </div>
          <div className="text-[10px] text-stone-500">
            SOURCE: {cityData.source} • {cityData.updatedAt}
          </div>
        </div>

        {/* Itemized Line Items */}
        <div className="space-y-2 text-xs border-b border-dashed border-stone-400 pb-3 mb-3">
          <div className="flex justify-between">
            <span>AMBIENT PM2.5 CONCENTRATION</span>
            <span className="font-bold">{cityData.pm25.toFixed(1)} µg/m³</span>
          </div>
          <div className="flex justify-between">
            <span>US EPA AIR QUALITY INDEX</span>
            <span className="font-bold">AQI {economics.usAqi}</span>
          </div>
          <div className="flex justify-between">
            <span>EXPOSURE PROFILE ({hoursOutdoors}H OUTDOOR)</span>
            <span className="font-bold">{economics.effectivePm25.toFixed(1)} µg/m³ EFF</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-1 border-t border-stone-300">
            <span>PASSIVE CIGARETTES / DAY</span>
            <span>{economics.effectiveCigsPerDay.toFixed(2)} CIGS</span>
          </div>
          <div className="flex justify-between">
            <span>ANNUALIZED PACK HABIT</span>
            <span className="font-bold">{economics.packsPerYear.toFixed(1)} PACKS/YR</span>
          </div>
          <div className="flex justify-between">
            <span>UNPAID TAR STREET VALUE</span>
            <span className="font-bold">
              ${(economics.packsPerYear * packPriceUsd).toFixed(0)} / YR
            </span>
          </div>
        </div>

        {/* Marginal Utility Audit */}
        <div className="space-y-1.5 text-xs border-b border-dashed border-stone-400 pb-3 mb-4">
          <div className="font-bold uppercase text-[11px] text-stone-700">
            BEHAVIORAL ECONOMICS AUDIT (+1 REAL CIG)
          </div>
          <div className="flex justify-between">
            <span>POPE (2009) MARGINAL HARM DISCOUNT</span>
            <span className="font-bold">-{economics.marginalDamageDiscountPct.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span>WEBER-FECHNER RELATIVE LOAD</span>
            <span className="font-bold">
              +{economics.weberRelativeIncreasePct > 999 ? '>999' : economics.weberRelativeIncreasePct.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>PERCEPTUAL MASKING SCORE</span>
            <span className="font-bold">{economics.perceptualMaskingScore}/100</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-1 text-rose-800">
            <span>MARGINAL SMOKING PROPENSITY</span>
            <span>{economics.smokingPropensityPct}%</span>
          </div>
          <div className="text-[10px] text-stone-600 italic">
            Persona: {economics.economicPersona}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 rounded-xl bg-stone-950 text-amber-300 hover:bg-stone-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied Receipt Text!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Atmospheric Receipt</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border-2 border-stone-900 hover:bg-stone-900/10 text-stone-900 cursor-pointer"
            title="Print / Save as PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
