import React, { useEffect, useState } from 'react';
import {
  BenchmarkCitySeed,
  CityAirQualityData,
  detectUserLocation,
  fetchAirQualityForCoords,
  fetchGlobalBenchmarksLive,
  GeocodingResult,
  GLOBAL_BENCHMARK_CITIES,
  searchCitiesWorldwide,
} from './lib/aqiService';
import {
  ACTIVITY_LEVELS,
  ActivityLevel,
  calculateCigaretteEconomics,
  getAqiSeverity,
  pm25ToUsAqi,
} from './lib/economics';
import { AnimatedCigarettePack } from './components/AnimatedCigarettePack';
import { ShouldYouSmokeCard } from './components/ShouldYouSmokeCard';
import { ExposureBottomSheet } from './components/ExposureBottomSheet';
import { EconomicsCurveChart } from './components/EconomicsCurveChart';
import { CityDuelComparison } from './components/CityDuelComparison';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { TimelineAndFinancials } from './components/TimelineAndFinancials';
import { WarningReceiptModal } from './components/WarningReceiptModal';
import { AcademicCitationsSection } from './components/AcademicCitationsSection';
import {
  BookOpen,
  Calendar,
  Compass,
  Flame,
  KeyRound,
  Loader2,
  MapPin,
  Receipt,
  RotateCcw,
  Search,
  Sliders,
  Swords,
  X,
} from 'lucide-react';

type ActiveTab = 'pack' | 'compare' | 'trends' | 'science';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pack');

  // Primary City Air Quality State
  const [cityData, setCityData] = useState<CityAirQualityData>(() => ({
    id: 'delhi-in',
    city: 'New Delhi',
    region: 'Delhi NCR',
    country: 'India',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    pm25: 158.4,
    pm10: 242.0,
    no2: 38.5,
    o3: 51.0,
    usAqi: pm25ToUsAqi(158.4),
    source: 'Open-Meteo CAMS Global',
    updatedAt: 'Live',
    dailyTimeline: [
      { date: '2026-11-09', label: 'Mon', pm25Avg: 142.0, usAqiAvg: pm25ToUsAqi(142.0), cigsPerDay: 6.45, isForecast: false },
      { date: '2026-11-10', label: 'Tue', pm25Avg: 165.0, usAqiAvg: pm25ToUsAqi(165.0), cigsPerDay: 7.5, isForecast: false },
      { date: '2026-11-11', label: 'Wed', pm25Avg: 179.0, usAqiAvg: pm25ToUsAqi(179.0), cigsPerDay: 8.14, isForecast: false },
      { date: '2026-11-12', label: 'Thu', pm25Avg: 151.0, usAqiAvg: pm25ToUsAqi(151.0), cigsPerDay: 6.86, isForecast: false },
      { date: '2026-11-13', label: 'Fri', pm25Avg: 138.0, usAqiAvg: pm25ToUsAqi(138.0), cigsPerDay: 6.27, isForecast: false },
      { date: '2026-11-14', label: 'Sat', pm25Avg: 149.0, usAqiAvg: pm25ToUsAqi(149.0), cigsPerDay: 6.77, isForecast: false },
      { date: '2026-11-15', label: 'Today', pm25Avg: 158.4, usAqiAvg: pm25ToUsAqi(158.4), cigsPerDay: 7.2, isForecast: false },
      { date: '2026-11-16', label: 'Mon', pm25Avg: 164.0, usAqiAvg: pm25ToUsAqi(164.0), cigsPerDay: 7.45, isForecast: true },
      { date: '2026-11-17', label: 'Tue', pm25Avg: 146.0, usAqiAvg: pm25ToUsAqi(146.0), cigsPerDay: 6.64, isForecast: true },
      { date: '2026-11-18', label: 'Wed', pm25Avg: 134.0, usAqiAvg: pm25ToUsAqi(134.0), cigsPerDay: 6.09, isForecast: true },
    ],
  }));

  // Challenger City for Side-by-Side Duel (Defaults to Zurich)
  const [challengerCity, setChallengerCity] = useState<CityAirQualityData>(() => ({
    id: 'zurich-ch',
    city: 'Zurich',
    region: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    latitude: 47.3769,
    longitude: 8.5417,
    pm25: 6.2,
    pm10: 11.4,
    no2: 12.1,
    o3: 46.0,
    usAqi: pm25ToUsAqi(6.2),
    source: 'Open-Meteo CAMS Global',
    updatedAt: 'Live',
    dailyTimeline: [],
  }));

  // Exposure & Behavioral Economics Parameters
  const [hoursOutdoors, setHoursOutdoors] = useState<number>(8);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light_walk');
  const [indoorPurifier, setIndoorPurifier] = useState<boolean>(false);
  const [baselineCravingUtility, setBaselineCravingUtility] = useState<number>(55);
  const [packPriceUsd, setPackPriceUsd] = useState<number>(10.5);

  // Manual Simulator Override & Interactive +1 Cigarette Preview
  const [manualPm25Override, setManualPm25Override] = useState<number | null>(null);
  const [showMarginalCigPreview, setShowMarginalCigPreview] = useState<boolean>(false);

  // Modals & Drawers
  const [isExposureSheetOpen, setIsExposureSheetOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState<boolean>(false);

  // Search & Geolocation UI State
  const [headerSearch, setHeaderSearch] = useState<string>('');
  const [headerResults, setHeaderResults] = useState<GeocodingResult[]>([]);
  const [isHeaderSearching, setIsHeaderSearching] = useState<boolean>(false);
  const [isDetectingLoc, setIsDetectingLoc] = useState<boolean>(false);

  // Hybrid WAQI Token State
  const [waqiToken, setWaqiToken] = useState<string>(
    () => localStorage.getItem('aqi_to_cig_waqi_token') || ''
  );
  const [showTokenPopover, setShowTokenPopover] = useState<boolean>(false);

  // Global Benchmarks State
  const [benchmarks, setBenchmarks] = useState<
    Array<BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }>
  >(() =>
    GLOBAL_BENCHMARK_CITIES.map((seed) => ({
      ...seed,
      livePm25: seed.fallbackPm25,
      liveUsAqi: pm25ToUsAqi(seed.fallbackPm25),
    }))
  );

  // On mount: detect user's real location & load live global benchmarks
  useEffect(() => {
    let cancelled = false;
    setIsDetectingLoc(true);
    detectUserLocation(waqiToken)
      .then((detected) => {
        if (!cancelled) {
          setCityData(detected);
          setManualPm25Override(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsDetectingLoc(false);
      });

    fetchGlobalBenchmarksLive().then((liveList) => {
      if (!cancelled) {
        setBenchmarks(liveList);
        const zurich = liveList.find((c) => c.id === 'zurich-ch');
        if (zurich) {
          setChallengerCity((prev) => ({
            ...prev,
            pm25: zurich.livePm25,
            usAqi: zurich.liveUsAqi,
          }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activePm25 = manualPm25Override !== null ? manualPm25Override : cityData.pm25;

  const economics = calculateCigaretteEconomics({
    pm25: activePm25,
    hoursOutdoors,
    activityLevel,
    indoorPurifier,
    baselineCravingUtility,
  });

  const severity = getAqiSeverity(economics.usAqi);
  const exposureRatio =
    economics.rawBerkeleyCigsPerDay > 0
      ? economics.effectiveCigsPerDay / economics.rawBerkeleyCigsPerDay
      : 1;

  const handleHeaderSearchChange = async (q: string) => {
    setHeaderSearch(q);
    if (q.trim().length < 2) {
      setHeaderResults([]);
      return;
    }
    setIsHeaderSearching(true);
    const results = await searchCitiesWorldwide(q);
    setHeaderResults(results);
    setIsHeaderSearching(false);
  };

  const handleSelectHeaderCity = async (geo: GeocodingResult) => {
    setHeaderResults([]);
    setHeaderSearch('');
    setIsSearchOpenMobile(false);
    setIsDetectingLoc(true);
    const fresh = await fetchAirQualityForCoords({
      city: geo.name,
      region: geo.admin1 || '',
      country: geo.country || '',
      countryCode: geo.country_code || '',
      latitude: geo.latitude,
      longitude: geo.longitude,
      waqiToken,
    });
    setCityData(fresh);
    setManualPm25Override(null);
    setIsDetectingLoc(false);
  };

  const handleDetectMyLocation = async () => {
    setIsDetectingLoc(true);
    const detected = await detectUserLocation(waqiToken);
    setCityData(detected);
    setManualPm25Override(null);
    setIsDetectingLoc(false);
  };

  const handleSaveWaqiToken = async (newToken: string) => {
    setWaqiToken(newToken);
    localStorage.setItem('aqi_to_cig_waqi_token', newToken);
    setShowTokenPopover(false);
    setIsDetectingLoc(true);
    const refreshed = await fetchAirQualityForCoords({
      city: cityData.city,
      region: cityData.region,
      country: cityData.country,
      countryCode: cityData.countryCode,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      waqiToken: newToken,
      fallbackPm25: cityData.pm25,
    });
    setCityData(refreshed);
    setIsDetectingLoc(false);
  };

  const handleSelectBenchmarkAsPrimary = async (
    seed: BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }
  ) => {
    setIsDetectingLoc(true);
    setPackPriceUsd(seed.localPackPriceUsd);
    const fresh = await fetchAirQualityForCoords({
      city: seed.city,
      region: seed.region,
      country: seed.country,
      countryCode: seed.countryCode,
      latitude: seed.latitude,
      longitude: seed.longitude,
      fallbackPm25: seed.livePm25,
      waqiToken,
    });
    setCityData(fresh);
    setManualPm25Override(null);
    setIsDetectingLoc(false);
    setActiveTab('pack');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBenchmarkAsChallenger = async (
    seed: BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }
  ) => {
    const fresh = await fetchAirQualityForCoords({
      city: seed.city,
      region: seed.region,
      country: seed.country,
      countryCode: seed.countryCode,
      latitude: seed.latitude,
      longitude: seed.longitude,
      fallbackPm25: seed.livePm25,
      waqiToken,
    });
    setChallengerCity(fresh);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwapPrimaryWithChallenger = () => {
    const temp = cityData;
    setCityData(challengerCity);
    setChallengerCity(temp);
    setManualPm25Override(null);
  };

  return (
    <div className="min-h-screen relative bg-[#0B0A09] text-[#F2EDE4] pb-24">
      {/* Dynamic Atmospheric Smog Haze Layer */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 z-0 animate-smog"
        style={{
          background: `radial-gradient(circle at 50% 18%, ${severity.glowColor}, transparent 60%), radial-gradient(circle at 80% 80%, ${severity.glowColor}, transparent 65%)`,
          opacity: Math.min(1, severity.smogOpacity + 0.25),
        }}
      />

      {/* COMPACT MOBILE-FIRST TOP BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0B0A09]/85 border-b border-stone-800/80">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => setActiveTab('pack')}
            className="flex items-center gap-2 text-left cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <span className="font-mono-code font-bold tracking-widest text-base text-stone-100">
              airn&apos;t
            </span>
          </button>

          {/* Center / Right Location Pill + Search + Receipt */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Inline Search */}
            <div className="hidden sm:block relative w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => handleHeaderSearchChange(e.target.value)}
                placeholder="Check any city worldwide..."
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-stone-950/90 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60"
              />
              {isHeaderSearching && (
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
              {headerResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-stone-950 border border-stone-700 shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {headerResults.map((geo) => (
                    <button
                      key={geo.id}
                      type="button"
                      onClick={() => handleSelectHeaderCity(geo)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-stone-900 flex items-center justify-between border-b border-stone-900 last:border-0 cursor-pointer"
                    >
                      <div>
                        <span className="font-medium text-stone-100">{geo.name}</span>
                        {geo.admin1 && <span className="text-stone-400">, {geo.admin1}</span>}
                        <span className="text-stone-500"> — {geo.country}</span>
                      </div>
                      <span className="font-mono-code text-[10px] text-amber-400">Load →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile City Pill Trigger (Opens Search Bar Overlay) */}
            <button
              type="button"
              onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
              className="sm:hidden px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono-code text-stone-200 flex items-center gap-1.5 max-w-[165px] truncate cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{cityData.city}</span>
              <Search className="w-3 h-3 text-stone-400 shrink-0 ml-0.5" />
            </button>

            {/* GPS Locate Button */}
            <button
              type="button"
              onClick={handleDetectMyLocation}
              disabled={isDetectingLoc}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 transition-all cursor-pointer"
              title="Detect My Current Location"
            >
              {isDetectingLoc ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Compass className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Hybrid WAQI API Key Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTokenPopover(!showTokenPopover)}
                className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                  waqiToken
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title="Hybrid WAQI Ground-Station API Token"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>

              {showTokenPopover && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-stone-950 border border-stone-700 p-4 shadow-2xl z-50 text-xs">
                  <div className="font-mono-code font-bold text-amber-300 uppercase mb-1">
                    Hybrid AQI Station Token
                  </div>
                  <p className="text-stone-400 leading-relaxed mb-2.5">
                    Uses <strong>Open-Meteo CAMS Global</strong> by default. Paste an optional{' '}
                    <a
                      href="https://aqicn.org/data-platform/token/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline"
                    >
                      WAQI token
                    </a>{' '}
                    to fuse local ground-station sensors.
                  </p>
                  <input
                    type="text"
                    defaultValue={waqiToken}
                    placeholder="Optional WAQI token..."
                    id="waqi-token-input"
                    className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 font-mono-code text-xs mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTokenPopover(false)}
                      className="px-2.5 py-1 rounded-lg text-stone-400 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(
                          'waqi-token-input'
                        ) as HTMLInputElement | null;
                        handleSaveWaqiToken(el?.value || '');
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-500 text-stone-950 font-mono-code font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shareable Warning Receipt Button */}
            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono-code font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-amber-500/15"
              title="Generate Atmospheric Receipt"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Receipt</span>
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Drawer */}
        {isSearchOpenMobile && (
          <div className="sm:hidden px-3.5 pb-3 pt-1 border-t border-stone-800/80 bg-stone-950/95">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={headerSearch}
                onChange={(e) => handleHeaderSearchChange(e.target.value)}
                placeholder="Type any city (e.g. Tokyo, London, Mumbai)..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpenMobile(false);
                  setHeaderResults([]);
                }}
                className="absolute right-2.5 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {headerResults.length > 0 && (
              <div className="mt-1.5 rounded-xl bg-stone-900 border border-stone-800 divide-y divide-stone-800 max-h-56 overflow-y-auto">
                {headerResults.map((geo) => (
                  <button
                    key={geo.id}
                    type="button"
                    onClick={() => handleSelectHeaderCity(geo)}
                    className="w-full text-left px-3 py-2.5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-stone-100">{geo.name}</span>
                      {geo.admin1 && <span className="text-stone-400">, {geo.admin1}</span>}
                      <span className="text-stone-500"> — {geo.country}</span>
                    </div>
                    <span className="font-mono-code text-[10px] text-amber-400">Load →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-5">
        {/* TAB 1: PACK & VERDICT (PUNCHY MOBILE HERO) */}
        {activeTab === 'pack' && (
          <div className="flex flex-col items-center space-y-5">
            {/* Compact Top Status + "Tune Exposure" Trigger Pill */}
            <div className="w-full max-w-md flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-sm font-semibold text-stone-100">
                  {cityData.city}
                </span>
                <span
                  className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border ${severity.badgeClass}`}
                >
                  AQI {economics.usAqi}
                </span>
                {manualPm25Override !== null && (
                  <button
                    type="button"
                    onClick={() => setManualPm25Override(null)}
                    className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-0.5 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Sim</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsExposureSheetOpen(true)}
                className="px-2.5 py-1 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/90 text-[11px] font-mono-code text-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <Sliders className="w-3 h-3" />
                <span>
                  {hoursOutdoors}h • {ACTIVITY_LEVELS[activityLevel].label.split(' ')[0]}
                </span>
              </button>
            </div>

            {/* 1. CENTERPIECE ANIMATED 20-CIGARETTE PACK */}
            <AnimatedCigarettePack
              cityName={cityData.city}
              countryName={cityData.country}
              cigsPerDay={economics.effectiveCigsPerDay}
              usAqi={economics.usAqi}
              pm25={activePm25}
              severity={severity}
              showMarginalCigPreview={showMarginalCigPreview}
              onToggleMarginalPreview={() =>
                setShowMarginalCigPreview(!showMarginalCigPreview)
              }
              weberRelativeIncreasePct={economics.weberRelativeIncreasePct}
            />

            {/* 2. BOLD BINARY VERDICT: "SHOULD YOU GO SMOKE A CIGARETTE?" */}
            <ShouldYouSmokeCard
              economics={economics}
              cityName={cityData.city}
              showMarginalCigPreview={showMarginalCigPreview}
              onToggleMarginalPreview={() =>
                setShowMarginalCigPreview(!showMarginalCigPreview)
              }
              onOpenScienceTab={() => {
                setActiveTab('science');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Quick City Hot-Swap Pills right below the Verdict for instant exploration */}
            <div className="w-full max-w-md pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono-code uppercase tracking-wider text-stone-500 mb-2 px-1">
                <span>Instant City Teleport:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('compare')}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  Compare All Cities →
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {benchmarks.slice(0, 7).map((b) => {
                  const isCurrent =
                    cityData.city.toLowerCase() === b.city.toLowerCase() &&
                    manualPm25Override === null;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBenchmarkAsPrimary(b)}
                      className={`px-3 py-1.5 rounded-xl font-mono-code text-xs shrink-0 border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                          : 'bg-stone-950/90 text-stone-300 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {b.city}{' '}
                      <span className={isCurrent ? 'text-stone-900' : 'text-amber-400'}>
                        ({(b.livePm25 / 22).toFixed(1)})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPARE CITIES (DUEL + LEADERBOARD) */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <CityDuelComparison
              primaryCity={{
                ...cityData,
                pm25: activePm25,
                usAqi: economics.usAqi,
              }}
              challengerCity={challengerCity}
              onSelectChallenger={setChallengerCity}
              onSwapPrimaryWithChallenger={handleSwapPrimaryWithChallenger}
              hoursOutdoors={hoursOutdoors}
              activityLevel={activityLevel}
              indoorPurifier={indoorPurifier}
              baselineCravingUtility={baselineCravingUtility}
              packPriceUsd={packPriceUsd}
              waqiToken={waqiToken}
            />

            <GlobalLeaderboard
              benchmarks={benchmarks}
              hoursOutdoors={hoursOutdoors}
              activityLevel={activityLevel}
              indoorPurifier={indoorPurifier}
              baselineCravingUtility={baselineCravingUtility}
              currentCityName={cityData.city}
              onSelectAsPrimary={handleSelectBenchmarkAsPrimary}
              onSelectAsChallenger={handleSelectBenchmarkAsChallenger}
            />
          </div>
        )}

        {/* TAB 3: TRENDS & PACK COST (7-DAY TIMELINE + STREET VALUE) */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <TimelineAndFinancials
              economics={economics}
              dailyTimeline={cityData.dailyTimeline}
              exposureRatio={exposureRatio}
              packPriceUsd={packPriceUsd}
              onChangePackPrice={setPackPriceUsd}
              cityName={cityData.city}
            />
          </div>
        )}

        {/* TAB 4: THE SCIENCE (POPE 2009 / BECKER-MURPHY CURVES + PAPERS) */}
        {activeTab === 'science' && (
          <div className="space-y-6">
            <EconomicsCurveChart economics={economics} cityName={cityData.city} />
            <AcademicCitationsSection />
          </div>
        )}
      </main>

      {/* STICKY MOBILE-FIRST 4-TAB BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-2xl bg-[#0B0A09]/92 border-t border-stone-800/90">
        <div className="max-w-lg mx-auto px-2 py-1.5 grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pack');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'pack'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="text-[10px] font-mono-code font-semibold tracking-tight">
              Pack &amp; Verdict
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('compare');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span className="text-[10px] font-mono-code font-semibold tracking-tight">
              Compare Cities
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('trends');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-mono-code font-semibold tracking-tight">
              Trends &amp; Cost
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('science');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'science'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[10px] font-mono-code font-semibold tracking-tight">
              The Science
            </span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Exposure & AQI Simulator Bottom Sheet */}
      <ExposureBottomSheet
        isOpen={isExposureSheetOpen}
        onClose={() => setIsExposureSheetOpen(false)}
        activePm25={activePm25}
        isManualOverride={manualPm25Override !== null}
        onChangeManualPm25={setManualPm25Override}
        hoursOutdoors={hoursOutdoors}
        onChangeHoursOutdoors={setHoursOutdoors}
        activityLevel={activityLevel}
        onChangeActivityLevel={setActivityLevel}
        indoorPurifier={indoorPurifier}
        onTogglePurifier={() => setIndoorPurifier(!indoorPurifier)}
        baselineCravingUtility={baselineCravingUtility}
        onChangeCravingUtility={setBaselineCravingUtility}
        economics={economics}
      />

      {/* Shareable Warning Receipt Modal */}
      <WarningReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        cityData={{
          ...cityData,
          pm25: activePm25,
          usAqi: economics.usAqi,
        }}
        economics={economics}
        hoursOutdoors={hoursOutdoors}
        packPriceUsd={packPriceUsd}
      />
    </div>
  );
}

export default App;
