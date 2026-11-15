import React, { useState } from 'react';
import {
  CityAirQualityData,
  fetchAirQualityForCoords,
  GeocodingResult,
  GLOBAL_BENCHMARK_CITIES,
  searchCitiesWorldwide,
} from '../lib/aqiService';
import {
  ActivityLevel,
  calculateCigaretteEconomics,
  getAqiSeverity,
} from '../lib/economics';
import { ArrowLeftRight, Search, MapPin, Sparkles, Loader2 } from 'lucide-react';

interface CityDuelComparisonProps {
  primaryCity: CityAirQualityData;
  challengerCity: CityAirQualityData;
  onSelectChallenger: (city: CityAirQualityData) => void;
  onSwapPrimaryWithChallenger: () => void;
  hoursOutdoors: number;
  activityLevel: ActivityLevel;
  indoorPurifier: boolean;
  baselineCravingUtility: number;
  packPriceUsd: number;
  waqiToken?: string;
}

export const CityDuelComparison: React.FC<CityDuelComparisonProps> = ({
  primaryCity,
  challengerCity,
  onSelectChallenger,
  onSwapPrimaryWithChallenger,
  hoursOutdoors,
  activityLevel,
  indoorPurifier,
  baselineCravingUtility,
  packPriceUsd,
  waqiToken,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingChallenger, setIsLoadingChallenger] = useState(false);

  const primaryEcon = calculateCigaretteEconomics({
    pm25: primaryCity.pm25,
    hoursOutdoors,
    activityLevel,
    indoorPurifier,
    baselineCravingUtility,
  });

  const challengerEcon = calculateCigaretteEconomics({
    pm25: challengerCity.pm25,
    hoursOutdoors,
    activityLevel,
    indoorPurifier,
    baselineCravingUtility,
  });

  const dailyDeltaCigs = challengerEcon.effectiveCigsPerDay - primaryEcon.effectiveCigsPerDay;
  const annualDeltaPacks = challengerEcon.packsPerYear - primaryEcon.packsPerYear;
  const annualDeltaDollars = annualDeltaPacks * packPriceUsd;
  const propensityDelta = challengerEcon.smokingPropensityPct - primaryEcon.smokingPropensityPct;

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const res = await searchCitiesWorldwide(val);
    setSearchResults(res);
    setIsSearching(false);
  };

  const handlePickGeoResult = async (geo: GeocodingResult) => {
    setSearchResults([]);
    setSearchQuery('');
    setIsLoadingChallenger(true);
    const data = await fetchAirQualityForCoords({
      city: geo.name,
      region: geo.admin1 || '',
      country: geo.country || '',
      countryCode: geo.country_code || '',
      latitude: geo.latitude,
      longitude: geo.longitude,
      waqiToken,
    });
    onSelectChallenger(data);
    setIsLoadingChallenger(false);
  };

  const handleQuickBenchmark = async (seedId: string) => {
    const seed = GLOBAL_BENCHMARK_CITIES.find((c) => c.id === seedId);
    if (!seed) return;
    setIsLoadingChallenger(true);
    const data = await fetchAirQualityForCoords({
      city: seed.city,
      region: seed.region,
      country: seed.country,
      countryCode: seed.countryCode,
      latitude: seed.latitude,
      longitude: seed.longitude,
      fallbackPm25: seed.fallbackPm25,
      waqiToken,
    });
    onSelectChallenger(data);
    setIsLoadingChallenger(false);
  };

  const primarySev = getAqiSeverity(primaryEcon.usAqi);
  const challengerSev = getAqiSeverity(challengerEcon.usAqi);

  return (
    <div className="rounded-2xl border border-stone-800/90 bg-[#12100E]/95 p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-5 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Atmospheric Arbitrage // City-to-City Duel</span>
          </div>
          <h3 className="text-xl font-serif-editorial text-stone-100 mt-0.5">
            Relocation &amp; Travel Cigarette Delta Calculator
          </h3>
        </div>

        {/* Search any challenger city worldwide */}
        <div className="relative w-full lg:w-96">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Compare with any city on Earth (e.g., Tokyo, Cairo, Austin)..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60"
            />
            {(isSearching || isLoadingChallenger) && (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3" />
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl bg-stone-950 border border-stone-700 shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handlePickGeoResult(r)}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-stone-900 flex items-center justify-between border-b border-stone-900 last:border-0 cursor-pointer"
                >
                  <div>
                    <span className="font-medium text-stone-100">{r.name}</span>
                    {r.admin1 && <span className="text-stone-400">, {r.admin1}</span>}
                    <span className="text-stone-500"> — {r.country}</span>
                  </div>
                  <span className="font-mono-code text-[10px] text-amber-400 uppercase">
                    Compare →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick preset pills */}
      <div className="flex items-center gap-1.5 flex-wrap mb-5">
        <span className="text-[11px] font-mono-code uppercase text-stone-500 mr-1">
          Quick Duel:
        </span>
        {GLOBAL_BENCHMARK_CITIES.slice(0, 8).map((c) => {
          const isSelected =
            challengerCity.city.toLowerCase() === c.city.toLowerCase();
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleQuickBenchmark(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-code transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'
              }`}
            >
              {c.city}
            </button>
          );
        })}
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
        {/* Primary City Card */}
        <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-stone-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono-code uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Origin // Your Baseline
              </span>
              <span className={`text-[11px] font-mono-code px-2 py-0.5 rounded border ${primarySev.badgeClass}`}>
                US AQI {primaryEcon.usAqi}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-lg font-semibold text-stone-100">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{primaryCity.city}</span>
              {primaryCity.country && (
                <span className="text-xs font-normal text-stone-400">
                  ({primaryCity.country})
                </span>
              )}
            </div>
            <p className="text-xs font-mono-code text-stone-400 mt-0.5">
              Ambient PM2.5: <strong className="text-stone-200">{primaryCity.pm25.toFixed(1)} µg/m³</strong>
            </p>
          </div>

          <div className="my-4 py-3 px-3.5 rounded-xl bg-stone-900/70 border border-stone-800/80 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-mono-code uppercase text-stone-400">
                Passive Cigs / Day
              </div>
              <div className="text-2xl font-mono-code font-bold text-amber-300 mt-0.5">
                {primaryEcon.effectiveCigsPerDay.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-400">
                {primaryEcon.packsPerYear.toFixed(1)} packs / yr
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono-code uppercase text-stone-400">
                Smoking Propensity
              </div>
              <div className="text-2xl font-mono-code font-bold text-rose-300 mt-0.5">
                {primaryEcon.smokingPropensityPct}%
              </div>
              <div className="text-[11px] text-stone-400">
                -{primaryEcon.marginalDamageDiscountPct.toFixed(0)}% marginal harm
              </div>
            </div>
          </div>
        </div>

        {/* Center Swap / Arbitrage Pillar */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center py-2">
          <button
            type="button"
            onClick={onSwapPrimaryWithChallenger}
            title="Swap Primary & Challenger Cities"
            className="p-2.5 rounded-full bg-stone-900 border border-stone-700 hover:border-amber-400 text-amber-300 hover:scale-105 transition-all cursor-pointer shadow-lg"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono-code text-stone-500 mt-1 uppercase">
            Swap
          </span>
        </div>

        {/* Challenger City Card */}
        <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-stone-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono-code uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                Destination // Challenger
              </span>
              <span className={`text-[11px] font-mono-code px-2 py-0.5 rounded border ${challengerSev.badgeClass}`}>
                US AQI {challengerEcon.usAqi}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-lg font-semibold text-stone-100">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{challengerCity.city}</span>
              {challengerCity.country && (
                <span className="text-xs font-normal text-stone-400">
                  ({challengerCity.country})
                </span>
              )}
            </div>
            <p className="text-xs font-mono-code text-stone-400 mt-0.5">
              Ambient PM2.5: <strong className="text-stone-200">{challengerCity.pm25.toFixed(1)} µg/m³</strong>
            </p>
          </div>

          <div className="my-4 py-3 px-3.5 rounded-xl bg-stone-900/70 border border-stone-800/80 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-mono-code uppercase text-stone-400">
                Passive Cigs / Day
              </div>
              <div className="text-2xl font-mono-code font-bold text-sky-300 mt-0.5">
                {challengerEcon.effectiveCigsPerDay.toFixed(2)}
              </div>
              <div className="text-[11px] text-stone-400">
                {challengerEcon.packsPerYear.toFixed(1)} packs / yr
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono-code uppercase text-stone-400">
                Smoking Propensity
              </div>
              <div className="text-2xl font-mono-code font-bold text-rose-300 mt-0.5">
                {challengerEcon.smokingPropensityPct}%
              </div>
              <div className="text-[11px] text-stone-400">
                -{challengerEcon.marginalDamageDiscountPct.toFixed(0)}% marginal harm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verdict Summary Banner */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-stone-950 via-stone-900/90 to-stone-950 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            {Math.abs(dailyDeltaCigs) < 0.03 ? (
              <span>
                <strong>{challengerCity.city}</strong> and <strong>{primaryCity.city}</strong> have
                virtually identical particulate loads today.
              </span>
            ) : dailyDeltaCigs < 0 ? (
              <span>
                Relocating from <strong>{primaryCity.city}</strong> to{' '}
                <strong className="text-emerald-300">{challengerCity.city}</strong> saves your lungs{' '}
                <strong className="font-mono-code text-emerald-300">
                  {Math.abs(dailyDeltaCigs).toFixed(2)} passive cigarettes/day
                </strong>{' '}
                (<strong className="font-mono-code">{Math.abs(annualDeltaPacks).toFixed(1)} packs/year</strong>, worth{' '}
                <strong className="font-mono-code">${Math.abs(annualDeltaDollars).toFixed(0)}/yr</strong>), while{' '}
                <strong>reducing</strong> your marginal justification to light a real cigarette by{' '}
                <strong className="font-mono-code text-emerald-300">
                  {Math.abs(propensityDelta)}%
                </strong>.
              </span>
            ) : (
              <span>
                Travelling from <strong>{primaryCity.city}</strong> to{' '}
                <strong className="text-rose-300">{challengerCity.city}</strong> forces you to inhale{' '}
                <strong className="font-mono-code text-rose-300">
                  +{dailyDeltaCigs.toFixed(2)} extra passive cigarettes/day
                </strong>{' '}
                (<strong className="font-mono-code">+{annualDeltaPacks.toFixed(1)} packs/year</strong>, equivalent to{' '}
                <strong className="font-mono-code">${annualDeltaDollars.toFixed(0)}/yr</strong> in street value) and{' '}
                <strong>increases</strong> your marginal propensity to smoke by{' '}
                <strong className="font-mono-code text-rose-300">+{propensityDelta}%</strong>.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
