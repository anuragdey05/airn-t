import { Dialog } from './Dialog';
import React, { useState, useRef, useEffect } from 'react';
import { CityAirQualityData } from '../lib/aqiService';
import { EconomicBreakdown } from '../lib/economics';
import {
  buildCityShareUrl,
  drawShareCardToCanvas,
  ShareCardFormat,
  shareOrDownloadCard,
} from '../lib/shareCard';
import { triggerHaptic } from '../lib/haptics';
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  Printer,
  Share2,
  Download,
  Smartphone,
  Monitor,
} from 'lucide-react';

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
  const [statusMessage, setStatusMessage] = useState('');
  const [cardFormat, setCardFormat] = useState<ShareCardFormat>('story');
  const [viewMode, setViewMode] = useState<'card' | 'receipt'>('card');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!isOpen || viewMode !== 'card' || !canvasRef.current) return;
    drawShareCardToCanvas(canvasRef.current, {
      cityData,
      economics,
      hoursOutdoors,
      packPriceUsd,
      format: cardFormat,
    });
  }, [isOpen, viewMode, cardFormat, cityData, economics, hoursOutdoors, packPriceUsd]);

  const shareUrl = buildCityShareUrl(cityData.city);

  const shareText = `🚬 airn't — My air in ${cityData.city} already smokes ${economics.effectiveCigsPerDay.toFixed(
    1
  )} cigarettes a day!
• 24h Mean PM2.5: ${cityData.pm25.toFixed(1)} µg/m³ (US AQI ${economics.usAqi})
• Annual Habit: ${economics.packsPerYear.toFixed(1)} packs/yr ($${(
    economics.packsPerYear * packPriceUsd
  ).toFixed(0)}/yr)
• Pope (2009) Slope Discount: -${economics.marginalDamageDiscountPct.toFixed(0)}% vs clean air
Check your city: ${shareUrl}`;

  const showTempStatus = (msg: string) => {
    setStatusMessage(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatusMessage('');
      setCopied(false);
    }, 2600);
  };

  const handleCopy = async () => {
    triggerHaptic(10);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      showTempStatus('Receipt & city link copied to clipboard.');
    } catch {
      showTempStatus('Could not copy. Try Share Image or Print.');
    }
  };

  const handleShareImage = async () => {
    triggerHaptic(15);
    const result = await shareOrDownloadCard({
      cityData,
      economics,
      hoursOutdoors,
      packPriceUsd,
      format: cardFormat,
    });
    if (result === 'shared') {
      showTempStatus('Shared image card!');
    } else if (result === 'downloaded') {
      showTempStatus('Downloaded PNG share card & copied link!');
    } else {
      showTempStatus('Copied share text & city link!');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} label="Atmospheric receipt">
      <div className="receipt relative w-full max-w-md rounded-2xl bg-[#F4EFE6] text-stone-950 p-5 sm:p-6 pt-14 shadow-2xl border-4 border-stone-900 font-mono-code">
        {/* Top Mode Switcher + Close button */}
        <div className="absolute top-3 left-4 right-3 flex items-center justify-between">
          <div className="inline-flex rounded-lg bg-stone-900/10 p-0.5 border border-stone-900/20 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-stone-950 text-amber-300'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Share Image Card
            </button>
            <button
              type="button"
              onClick={() => setViewMode('receipt')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                viewMode === 'receipt'
                  ? 'bg-stone-950 text-amber-300'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              Paper Receipt
            </button>
          </div>

          <button
            type="button"
            aria-label="Close receipt"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-900/10 hover:bg-stone-900/20 text-stone-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {viewMode === 'card' ? (
          <div className="space-y-3">
            {/* Story (9:16) vs Post (16:9) Format Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold uppercase text-stone-700">
                Card Format:
              </span>
              <div className="inline-flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCardFormat('story')}
                  className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 cursor-pointer ${
                    cardFormat === 'story'
                      ? 'bg-stone-950 text-amber-300 border-stone-950 font-bold'
                      : 'bg-white/60 text-stone-800 border-stone-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Story (9:16)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardFormat('landscape')}
                  className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 cursor-pointer ${
                    cardFormat === 'landscape'
                      ? 'bg-stone-950 text-amber-300 border-stone-950 font-bold'
                      : 'bg-white/60 text-stone-800 border-stone-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Post (16:9)</span>
                </button>
              </div>
            </div>

            {/* Live Canvas Preview */}
            <div className="rounded-xl overflow-hidden border-2 border-stone-900 bg-[#0B0A09] flex items-center justify-center max-h-[340px]">
              <canvas
                ref={canvasRef}
                aria-label={`Share card preview: My air already smokes ${economics.effectiveCigsPerDay.toFixed(
                  1
                )} cigarettes a day in ${cityData.city}`}
                className={
                  cardFormat === 'story'
                    ? 'h-[330px] w-auto object-contain'
                    : 'w-full h-auto object-contain'
                }
              />
            </div>

            <div className="p-2.5 rounded-lg bg-stone-900/10 border border-stone-900/20 text-xs flex items-center justify-between gap-2">
              <span className="truncate text-stone-700">{shareUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 rounded bg-stone-900 text-amber-300 font-bold shrink-0 cursor-pointer"
              >
                Copy Link
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Surgeon General / Economist Black-Bordered Warning Box */}
            <div className="border-2 border-stone-950 p-3 mb-4 bg-amber-400/20">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider border-b border-stone-950 pb-1.5 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-stone-950 shrink-0" />
                <span>ATMOSPHERIC EXPOSURE WARNING</span>
              </div>
              <p className="text-xs leading-snug font-sans font-semibold text-stone-900">
                My air in <span className="underline">{cityData.city}</span> already smokes{' '}
                <span>{economics.effectiveCigsPerDay.toFixed(2)} cigarettes per day</span> (24h mean
                PM2.5). Under a curve fitted to Pope et al. (2009), the incremental risk slope of 1
                additional cigarette is flatter by{' '}
                <span>{economics.marginalDamageDiscountPct.toFixed(0)}%</span>.
              </p>
            </div>

            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-stone-400 pb-3 mb-3">
              <div className="text-sm font-bold tracking-widest uppercase">
                airn&apos;t // TAR TAX RECEIPT
              </div>
              <div className="text-xs text-stone-600">
                LOC: {cityData.city.toUpperCase()} ({cityData.latitude.toFixed(2)}°,{' '}
                {cityData.longitude.toFixed(2)}°)
              </div>
              <div className="text-xs text-stone-500">
                24H MEAN • {cityData.source} • {cityData.updatedAt}
              </div>
            </div>

            {/* Itemized Line Items */}
            <div className="space-y-2 text-xs border-b border-dashed border-stone-400 pb-3 mb-3">
              <div className="flex justify-between">
                <span>24-HOUR MEAN PM2.5</span>
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
            <div className="space-y-1.5 text-xs border-b border-dashed border-stone-400 pb-3 mb-3">
              <div className="font-bold uppercase text-xs text-stone-700">
                BEHAVIORAL ECONOMICS AUDIT (+1 REAL CIG)
              </div>
              <div className="flex justify-between">
                <span>POPE (2009 FIT) SLOPE DISCOUNT</span>
                <span className="font-bold">-{economics.marginalDamageDiscountPct.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>RELATIVE LOAD JUMP</span>
                <span className="font-bold">
                  +{economics.weberRelativeIncreasePct > 999 ? '>999' : economics.weberRelativeIncreasePct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 text-rose-800">
                <span>ILLUSTRATIVE TEMPTATION INDEX</span>
                <span>{economics.smokingPropensityPct}%</span>
              </div>
            </div>
          </div>
        )}

        <p role="status" className="copy-status text-xs font-bold text-emerald-800 min-h-[18px] mb-2">
          {statusMessage || (copied ? 'Receipt copied.' : '')}
        </p>

        {/* Primary Share & Copy Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareImage}
            className="flex-1 py-2.5 px-3 rounded-xl bg-stone-950 text-amber-300 hover:bg-stone-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share / Save PNG</span>
            <Download className="w-3.5 h-3.5 opacity-75" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl border-2 border-stone-900 hover:bg-stone-900/10 text-stone-900 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
            title="Copy text & deep link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-700" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>Copy</span>
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
    </Dialog>
  );
};
