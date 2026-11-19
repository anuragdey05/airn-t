import React from 'react';
import { BenchmarkCitySeed } from '../lib/aqiService';
import {
  ActivityLevel,
  calculateCigaretteEconomics,
  getAqiSeverity,
} from '../lib/economics';
import { Globe, Flame, ArrowUpRight, Swords } from 'lucide-react';

interface GlobalLeaderboardProps {
  benchmarks: Array<BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }>;
  hoursOutdoors: number;
  activityLevel: ActivityLevel;
  indoorPurifier: boolean;
  baselineCravingUtility: number;
  currentCityName: string;
  onSelectAsPrimary: (seed: BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }) => void;
  onSelectAsChallenger: (seed: BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }) => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  benchmarks,
  hoursOutdoors,
  activityLevel,
  indoorPurifier,
  baselineCravingUtility,
  currentCityName,
  onSelectAsPrimary,
  onSelectAsChallenger,
}) => {
  const ranked = [...benchmarks].sort((a, b) => b.livePm25 - a.livePm25);

  return (
    <div className="rounded-2xl border border-stone-800/90 bg-panel/95 p-4 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Global Smokers’ Lounge // Live World Index</span>
          </div>
          <h2 className="font-serif-editorial text-stone-100 mt-0.5">
            Cities Ranked by Passive Cigarettes &amp; Temptation Index
          </h2>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="space-y-2.5 md:hidden">
        {ranked.map((item, idx) => {
          const econ = calculateCigaretteEconomics({
            pm25: item.livePm25,
            hoursOutdoors,
            activityLevel,
            indoorPurifier,
            baselineCravingUtility,
          });
          const sev = getAqiSeverity(econ.usAqi);
          const isCurrent =
            currentCityName.toLowerCase() === item.city.toLowerCase();

          return (
            <div
              key={item.id}
              aria-current={isCurrent ? 'true' : undefined}
              className={`p-3.5 rounded-2xl border transition-colors ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-stone-950/80 border-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-code text-stone-400 font-bold">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-stone-100 flex items-center gap-1.5">
                      <span>{item.city}</span>
                      {isCurrent && (
                        <span className="text-xs font-mono-code px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-400">{item.country}</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono-code border ${sev.badgeClass}`}
                >
                  AQI {econ.usAqi}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-xl bg-stone-900/70 font-mono-code text-center mb-2.5">
                <div>
                  <span className="text-xs text-stone-400 block uppercase">Cigs/Day</span>
                  <span className="text-sm font-bold text-amber-300">
                    {econ.effectiveCigsPerDay.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 block uppercase">Harm Disc.</span>
                  <span className="text-sm font-bold text-emerald-400">
                    -{econ.marginalDamageDiscountPct.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 block uppercase">Temptation</span>
                  <span className="text-sm font-bold text-rose-300">
                    {econ.smokingPropensityPct}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectAsPrimary(item)}
                  aria-label={`Load ${item.city} pack`}
                  className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-amber-500/20 text-stone-200 border border-stone-800 font-mono-code text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Load Pack</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectAsChallenger(item)}
                  aria-label={`Duel ${item.city} against your city`}
                  className="flex-1 py-1.5 rounded-xl bg-stone-900 hover:bg-sky-500/20 text-sky-300 border border-stone-800 font-mono-code text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Swords className="w-3 h-3" />
                  <span>Duel Above</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-800 text-xs font-mono-code uppercase text-stone-400">
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">City</th>
              <th className="py-2.5 px-3">Live US AQI</th>
              <th className="py-2.5 px-3">PM2.5 (µg/m³)</th>
              <th className="py-2.5 px-3">Passive Cigs / Day</th>
              <th className="py-2.5 px-3">Marginal Harm Discount</th>
              <th className="py-2.5 px-3">Temptation Index</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-900 text-xs">
            {ranked.map((item, idx) => {
              const econ = calculateCigaretteEconomics({
                pm25: item.livePm25,
                hoursOutdoors,
                activityLevel,
                indoorPurifier,
                baselineCravingUtility,
              });
              const sev = getAqiSeverity(econ.usAqi);
              const isCurrent =
                currentCityName.toLowerCase() === item.city.toLowerCase();

              return (
                <tr
                  key={item.id}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`transition-colors ${
                    isCurrent
                      ? 'bg-amber-500/10 hover:bg-amber-500/15'
                      : 'hover:bg-stone-900/60'
                  }`}
                >
                  <td className="py-3 px-3 font-mono-code text-stone-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-stone-100 flex items-center gap-1.5">
                      <span>{item.city}</span>
                      {isCurrent && (
                        <span className="text-xs font-mono-code px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-400">{item.country}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono-code border ${sev.badgeClass}`}
                    >
                      {econ.usAqi}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono-code text-stone-300">
                    {item.livePm25.toFixed(1)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="inline-flex items-center gap-1.5 font-mono-code font-bold text-amber-300">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{econ.effectiveCigsPerDay.toFixed(2)}</span>
                    </div>
                    <span className="block text-xs font-mono-code text-stone-400">
                      {econ.packsPerYear.toFixed(1)} packs/yr
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono-code text-emerald-300">
                    -{econ.marginalDamageDiscountPct.toFixed(0)}% cost
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-stone-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                          style={{ width: `${econ.smokingPropensityPct}%` }}
                        />
                      </div>
                      <span className="font-mono-code text-rose-300 font-semibold">
                        {econ.smokingPropensityPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectAsPrimary(item)}
                        aria-label={`Load ${item.city} pack`}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-amber-500/20 text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/40 font-mono-code text-xs inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
                      >
                        <span>Load Pack</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectAsChallenger(item)}
                        aria-label={`Duel ${item.city} against your city`}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-sky-500/20 text-stone-300 hover:text-sky-300 border border-stone-800 hover:border-sky-500/40 font-mono-code text-xs inline-flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer"
                      >
                        <Swords className="w-3 h-3" />
                        <span>Duel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
