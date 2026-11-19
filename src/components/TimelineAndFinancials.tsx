import React, { useId } from 'react';
import { formatUsd } from '../lib/format';
import { DailyExposurePoint } from '../lib/aqiService';
import { EconomicBreakdown, getAqiSeverity } from '../lib/economics';
import { Calendar, DollarSign, Package } from 'lucide-react';

interface TimelineAndFinancialsProps {
  economics: EconomicBreakdown;
  dailyTimeline: DailyExposurePoint[];
  exposureRatio: number; // effectiveCigsPerDay / rawBerkeleyCigsPerDay
  packPriceUsd: number;
  onChangePackPrice: (price: number) => void;
  cityName: string;
  countryName?: string;
}

export const TimelineAndFinancials: React.FC<TimelineAndFinancialsProps> = ({
  economics,
  dailyTimeline,
  exposureRatio,
  packPriceUsd,
  onChangePackPrice,
  cityName,
  countryName,
}) => {
  const priceId = useId();
  const timeline = dailyTimeline.slice(0, 10);
  const maxDailyCigs = Math.max(
    1.5,
    ...dailyTimeline.map((d) => d.cigsPerDay * exposureRatio)
  );

  const weeklyPacks = economics.cigsPerWeek / 20;
  const monthlyPacks = economics.cigsPerMonth / 20;
  const yearlyPacks = economics.packsPerYear;
  const decadePacks = yearlyPacks * 10;

  const yearlyStreetValue = yearlyPacks * packPriceUsd;
  const decadeStreetValue = decadePacks * packPriceUsd;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Feature 4: 7-Day Historical + Forecast Exposure Timeline */}
      <div className="lg:col-span-7 rounded-2xl border border-stone-800/90 bg-panel/95 p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>7-Day History + 3-Day Forecast</span>
              </div>
              <h2 className="font-serif-editorial text-stone-100 mt-0.5 break-words">
                Daily Passive Cigarette Trajectory in {cityName}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono-code">
              <span className="inline-flex items-center gap-1.5 text-stone-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                Observed
              </span>
              <span className="inline-flex items-center gap-1.5 text-stone-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-500/70 border border-dashed border-sky-300 inline-block" />
                CAMS Forecast
              </span>
            </div>
          </div>

          {/* Bar Chart — fits all 10 days on mobile without horizontal clipping */}
          {timeline.length > 0 ? (
          <figure>
            <figcaption className="sr-only">
              Daily passive cigarettes and US AQI for {cityName}; forecast days are marked.
            </figcaption>
            {/* Screen-reader version of the bar chart */}
            <table className="sr-only">
              <thead>
                <tr><th scope="col">Day</th><th scope="col">Passive cigarettes</th><th scope="col">US AQI</th><th scope="col">Type</th></tr>
              </thead>
              <tbody>
                {timeline.map((pt) => (
                  <tr key={pt.date}>
                    <th scope="row">{pt.label}</th>
                    <td>{(pt.cigsPerDay * exposureRatio).toFixed(1)}</td>
                    <td>{pt.usAqiAvg}</td>
                    <td>{pt.isForecast ? 'Forecast' : 'Observed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div aria-hidden="true" className="grid grid-cols-10 gap-1 sm:gap-2.5 pt-4 pb-2 items-end h-56 sm:h-64">
              {timeline.map((pt) => {
                const adjCigs = pt.cigsPerDay * exposureRatio;
                const heightPct = Math.max(8, Math.min(100, (adjCigs / maxDailyCigs) * 100));
                const isToday = pt.label === 'Today';
                const sev = getAqiSeverity(pt.usAqiAvg);

                return (
                  <div
                    key={pt.date}
                    className="flex flex-col items-center justify-end h-full group relative min-w-0"
                  >
                    <span className="text-xs font-mono-code text-stone-300 mb-1">
                      {adjCigs.toFixed(1)}
                    </span>
                    <div className="w-full flex-1 flex items-end justify-center">
                      <div
                        className={`w-full max-w-[30px] rounded-t-md sm:rounded-t-lg transition-colors duration-300 ${
                          isToday
                            ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/20'
                            : ''
                        } ${
                          pt.isForecast
                            ? 'bg-sky-500/35 border border-dashed border-sky-400/70'
                            : ''
                        }`}
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: pt.isForecast ? undefined : sev.colorHex,
                          opacity: pt.isForecast ? 0.85 : isToday ? 1 : 0.78,
                        }}
                      />
                    </div>
                    <span
                      className={`mt-1.5 text-xs font-mono-code truncate max-w-full ${
                        isToday ? 'text-amber-300 font-bold' : 'text-stone-300'
                      }`}
                    >
                      {isToday ? 'Now' : pt.label}
                    </span>
                    <span className="text-xs font-mono-code text-stone-400" title="US AQI">
                      {pt.usAqiAvg}
                    </span>
                  </div>
                );
              })}
            </div>
            <p aria-hidden="true" className="text-xs font-mono-code text-stone-400 text-right">
              Top: cigarettes/day · Bottom: US AQI
            </p>
          </figure>
          ) : (
            <p role="status" className="text-sm py-4 text-stone-300">
              No timeline is available for this location.
            </p>
          )}
        </div>

        <div className="timeline-footer mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
          <span>
            10-Day Cumulative Passive Dose:{' '}
            <strong className="font-mono-code text-amber-300">
              {timeline
                .reduce((acc, d) => acc + d.cigsPerDay * exposureRatio, 0)
                .toFixed(1)}{' '}
              cigarettes
            </strong>
          </span>
          <span className="font-mono-code text-xs text-stone-400">
            Source: Open-Meteo Hourly CAMS
          </span>
        </div>
      </div>

      {/* Feature 3: Cumulative Pack & Financial Equivalence */}
      <div className="lg:col-span-5 rounded-2xl border border-stone-800/90 bg-panel/95 p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
                <Package className="w-3.5 h-3.5" />
                <span>Cumulative Pack &amp; Street Value</span>
              </div>
              <h2 className="font-serif-editorial text-stone-100 mt-0.5">
                Unpaid Tar Tax // Pack Equivalence
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
              <span className="text-xs font-mono-code uppercase text-stone-400">
                Weekly Intake
              </span>
              <div className="text-xl font-mono-code font-bold text-stone-100 mt-0.5">
                {economics.cigsPerWeek.toFixed(1)} <span className="text-xs font-normal text-stone-400">cigs</span>
              </div>
              <div className="text-xs font-mono-code text-amber-400 mt-0.5">
                {weeklyPacks.toFixed(2)} packs / wk
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
              <span className="text-xs font-mono-code uppercase text-stone-400">
                Monthly Intake
              </span>
              <div className="text-xl font-mono-code font-bold text-stone-100 mt-0.5">
                {economics.cigsPerMonth.toFixed(1)} <span className="text-xs font-normal text-stone-400">cigs</span>
              </div>
              <div className="text-xs font-mono-code text-amber-400 mt-0.5">
                {monthlyPacks.toFixed(2)} packs / mo
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
              <span className="text-xs font-mono-code uppercase text-stone-400">
                Annual Habit
              </span>
              <div className="text-xl font-mono-code font-bold text-amber-300 mt-0.5">
                {yearlyPacks.toFixed(1)} <span className="text-xs font-normal text-stone-400">packs</span>
              </div>
              <div className="text-xs font-mono-code text-stone-400 mt-0.5">
                {Math.round(economics.cigsPerYear).toLocaleString()} cigs / yr
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800">
              <span className="text-xs font-mono-code uppercase text-stone-400">
                10-Year Lung Load
              </span>
              <div className="text-xl font-mono-code font-bold text-rose-300 mt-0.5">
                {decadePacks.toFixed(0)} <span className="text-xs font-normal text-stone-400">packs</span>
              </div>
              <div className="text-xs font-mono-code text-stone-400 mt-0.5">
                {(decadePacks / 10).toFixed(1)} cartons
              </div>
            </div>
          </div>

          {/* Adjustable Local Cigarette Pack Price Slider */}
          <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800/90">
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor={priceId} className="font-mono-code text-stone-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Local Pack Price (20 Cigs):</span>
              </label>
              <span className="font-mono-code font-bold text-emerald-300">
                {formatUsd(packPriceUsd, 2)} / pack
              </span>
            </div>
            <input
              type="range"
              min="1.5"
              max="30"
              step="0.5"
              id={priceId}
              aria-valuetext={`${formatUsd(packPriceUsd, 2)} per pack`}
              value={packPriceUsd}
              onChange={(e) => onChangePackPrice(parseFloat(e.target.value))}
              className="w-full noir-slider"
            />
            <p className="text-xs font-mono-code text-stone-400 mt-1">
              Auto-set for {countryName || cityName} from WHO Global Tobacco Report &amp; Numbeo 20-pack retail averages (USD). Drag slider to customize.
            </p>
            <div className="mt-3 pt-2.5 border-t border-stone-900 flex items-center justify-between text-xs">
              <span className="text-stone-400">Implied Annual Tar Value:</span>
              <span className="font-mono-code font-bold text-emerald-300">
                {formatUsd(yearlyStreetValue)}/yr ({formatUsd(decadeStreetValue)} / 10yr)
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-stone-400 italic mt-3">
          *Your alveoli absorb the equivalent of{' '}
          <strong className="text-stone-200">{formatUsd(yearlyStreetValue)}</strong> worth of
          commercial tobacco particulates every year in {cityName}—with zero nicotine dividend.
        </p>
      </div>
    </div>
  );
};
