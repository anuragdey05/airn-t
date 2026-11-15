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
  usAqiToPm25,
} from './lib/economics';
import { CigaretteVisualizer } from './components/CigaretteVisualizer';
import { EconomicsCurveChart } from './components/EconomicsCurveChart';
import { CityDuelComparison } from './components/CityDuelComparison';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { TimelineAndFinancials } from './components/TimelineAndFinancials';
import { WarningReceiptModal } from './components/WarningReceiptModal';
import { AcademicCitationsSection } from './components/AcademicCitationsSection';
import {
  AlertTriangle,
  Compass,
  Flame,
  Gauge,
  KeyRound,
  Loader2,
  MapPin,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Wind,
} from 'lucide-react';

export function App() {
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

  // Challenger City for Side-by-Side Duel (Defaults to Zurich for stark contrast)
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
  const [hoursOutdoors, setHoursOutdoors] = useState<number>(6);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light_walk');
  const [indoorPurifier, setIndoorPurifier] = useState<boolean>(false);
  const [baselineCravingUtility, setBaselineCravingUtility] = useState<number>(55);
  const [packPriceUsd, setPackPriceUsd] = useState<number>(10.5);

  // Manual Simulator Override
  const [manualPm25Override, setManualPm25Override] = useState<number | null>(null);
  const [showMarginalCigPreview, setShowMarginalCigPreview] = useState<boolean>(false);

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

  // Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

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
  };

  const handleSwapPrimaryWithChallenger = () => {
    const temp = cityData;
    setCityData(challengerCity);
    setChallengerCity(temp);
    setManualPm25Override(null);
  };

  return (
    <div className="min-h-screen relative bg-[#0B0A09] text-[#F2EDE4] pb-20">
      {/* Dynamic Atmospheric Smog Haze Layer that reacts to current AQI */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 z-0 animate-smog"
        style={{
          background: `radial-gradient(circle at 20% 15%, ${severity.glowColor}, transparent 55%), radial-gradient(circle at 80% 75%, ${severity.glowColor}, transparent 60%)`,
          opacity: Math.min(1, severity.smogOpacity + 0.25),
        }}
      />

      {/* Top Editorial Navigation & Global Location Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0B0A09]/85 border-b border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-code font-bold tracking-widest text-base text-stone-100">
                  airn&apos;t
                </span>
                <span className="text-[10px] font-mono-code uppercase px-2 py-0.5 rounded bg-stone-900 text-amber-400 border border-stone-800">
                  Econometric Edition
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                AQI-to-Cigarette Equivalence &amp; Marginal Smoking Utility Engine
              </p>
            </div>
          </div>

          {/* Worldwide City Search + GPS Button + Receipt Button */}
          <div className="flex items-center gap-2 flex-1 max-w-xl justify-end">
            <div className="relative flex-1 max-w-xs sm:max-w-sm">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => handleHeaderSearchChange(e.target.value)}
                placeholder="Search any city worldwide..."
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
                      <span className="font-mono-code text-[10px] text-amber-400">Select →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDetectMyLocation}
              disabled={isDetectingLoc}
              className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-mono-code text-amber-300 border border-stone-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Detect My Current Location"
            >
              {isDetectingLoc ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Compass className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">Locate Me</span>
            </button>

            {/* Hybrid WAQI API Token Popover Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTokenPopover(!showTokenPopover)}
                className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                  waqiToken
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title="Configure Hybrid WAQI Ground-Station API Token"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>

              {showTokenPopover && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-stone-950 border border-stone-700 p-4 shadow-2xl z-50 text-xs">
                  <div className="font-mono-code font-bold text-amber-300 uppercase mb-1">
                    Hybrid Data Source Settings
                  </div>
                  <p className="text-stone-400 leading-relaxed mb-2.5">
                    By default, the app uses <strong>Open-Meteo CAMS Global</strong> (zero key required, 100% global coverage). Optionally paste a free{' '}
                    <a
                      href="https://aqicn.org/data-platform/token/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline"
                    >
                      WAQI (aqicn.org) token
                    </a>{' '}
                    to fuse physical ground-station telemetry.
                  </p>
                  <input
                    type="text"
                    defaultValue={waqiToken}
                    placeholder="Optional WAQI API token (or 'demo')..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveWaqiToken((e.target as HTMLInputElement).value);
                      }
                    }}
                    id="waqi-token-input"
                    className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 font-mono-code text-xs mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTokenPopover(false)}
                      className="px-2.5 py-1 rounded-lg text-stone-400 hover:text-stone-200 cursor-pointer"
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
                      Save &amp; Sync
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono-code font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-lg shadow-amber-500/15"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Warning Receipt</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* Surgeon General Style Atmospheric Banner */}
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-[#17130F] via-[#14110E] to-[#17130F] p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono-code uppercase tracking-widest text-amber-400 font-bold">
                  LIVE ATMOSPHERIC ADVISORY // {cityData.city.toUpperCase()}
                </span>
                <span
                  className={`text-[10px] font-mono-code px-2 py-0.5 rounded border ${severity.badgeClass}`}
                >
                  {severity.tier}
                </span>
                {manualPm25Override !== null && (
                  <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    SIMULATOR OVERRIDE ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-300 mt-0.5">{severity.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono-code text-stone-400 shrink-0">
            <span>Source: {manualPm25Override !== null ? 'Manual Simulator' : cityData.source}</span>
            {manualPm25Override !== null && (
              <button
                type="button"
                onClick={() => setManualPm25Override(null)}
                className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Live</span>
              </button>
            )}
          </div>
        </div>

        {/* HERO GRID: Left = Location Telemetry & Exposure Controls | Right = Marginal Utility Verdict & Cigarette Rack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): City AQI Telemetry + Exposure & Craving Sliders */}
          <div className="lg:col-span-5 space-y-6">
            {/* Primary Telemetry Card */}
            <div className="rounded-2xl border border-stone-800/90 bg-[#12100E]/95 p-5 sm:p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono-code uppercase tracking-wider text-stone-400">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {cityData.region ? `${cityData.region}, ` : ''}
                      {cityData.country || 'Coordinates'}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-serif-editorial text-stone-100 mt-1">
                    {cityData.city}
                  </h1>
                  {cityData.stationName && (
                    <p className="text-[11px] font-mono-code text-emerald-400 mt-0.5">
                      Station: {cityData.stationName}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono-code uppercase tracking-widest text-stone-400 block">
                    US EPA AQI
                  </span>
                  <span
                    className="text-3xl sm:text-4xl font-mono-code font-bold"
                    style={{ color: severity.colorHex }}
                  >
                    {economics.usAqi}
                  </span>
                </div>
              </div>

              {/* Big Cigarette Conversion Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900/90 to-stone-950 border border-stone-800 my-4">
                <div className="text-[11px] font-mono-code uppercase tracking-widest text-amber-400/90 mb-1">
                  Your Personal Daily Passive Intake
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl sm:text-6xl font-mono-code font-bold text-stone-100 tracking-tight">
                    {economics.effectiveCigsPerDay.toFixed(2)}
                  </span>
                  <div>
                    <span className="text-base font-semibold text-amber-300 block">
                      Cigarettes / Day
                    </span>
                    <span className="text-xs font-mono-code text-stone-400">
                      ≈ 1 cig every{' '}
                      {economics.effectiveCigsPerDay > 0.05
                        ? (24 / economics.effectiveCigsPerDay).toFixed(1)
                        : '∞'}{' '}
                      hours
                    </span>
                  </div>
                </div>

                {/* Sub-pollutant pills */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-stone-800/80 text-center font-mono-code">
                  <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800/70">
                    <span className="text-[9px] text-stone-500 block">PM2.5</span>
                    <span className="text-xs font-bold text-amber-300">
                      {activePm25.toFixed(1)}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800/70">
                    <span className="text-[9px] text-stone-500 block">EFF PM2.5</span>
                    <span className="text-xs font-bold text-stone-200">
                      {economics.effectivePm25.toFixed(1)}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800/70">
                    <span className="text-[9px] text-stone-500 block">PM10</span>
                    <span className="text-xs font-bold text-stone-300">
                      {cityData.pm10.toFixed(0)}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-stone-950/80 border border-stone-800/70">
                    <span className="text-[9px] text-stone-500 block">NO₂ / O₃</span>
                    <span className="text-xs font-bold text-stone-300">
                      {cityData.no2.toFixed(0)}/{cityData.o3.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Hypothetical AQI / PM2.5 Simulator Slider */}
              <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800/90">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono-code text-stone-300 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hypothetical PM2.5 / AQI Simulator:</span>
                  </span>
                  <span className="font-mono-code text-amber-300 font-bold">
                    {activePm25.toFixed(1)} µg/m³ (AQI {economics.usAqi})
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="350"
                  step="1"
                  value={activePm25}
                  onChange={(e) => setManualPm25Override(parseFloat(e.target.value))}
                  className="w-full noir-slider"
                />
                <div className="flex justify-between text-[10px] font-mono-code text-stone-500 mt-1">
                  <span>Zurich (6 µg/m³)</span>
                  <span>1 Cig (22 µg/m³)</span>
                  <span>5 Cigs (110 µg/m³)</span>
                  <span>15+ Cigs (350 µg/m³)</span>
                </div>
              </div>
            </div>

            {/* Interactive Exposure & Behavioral Sliders Card */}
            <div className="rounded-2xl border border-stone-800/90 bg-[#12100E]/95 p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Dose &amp; Utility Parameters</span>
                </div>
                <span className="text-[11px] font-mono-code text-stone-400">
                  Real-Time Recalculation
                </span>
              </div>

              {/* Slider 1: Hours Outdoors */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-stone-300 font-medium">
                    Daily Outdoor Exposure Duration
                  </span>
                  <span className="font-mono-code text-amber-300 font-bold">
                    {hoursOutdoors} hrs outdoors / {24 - hoursOutdoors} hrs indoors
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="0.5"
                  value={hoursOutdoors}
                  onChange={(e) => setHoursOutdoors(parseFloat(e.target.value))}
                  className="w-full noir-slider"
                />
              </div>

              {/* Selector 2: Activity Level (Minute Ventilation Multiplier) */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-stone-300 font-medium">
                    Outdoor Exertion / Minute Ventilation Rate
                  </span>
                  <span className="font-mono-code text-amber-300">
                    {ACTIVITY_LEVELS[activityLevel].ventilationMultiplier}x tidal intake
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((lvl) => {
                    const meta = ACTIVITY_LEVELS[lvl];
                    const active = activityLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setActivityLevel(lvl)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                            : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div className="text-xs font-semibold flex items-center justify-between">
                          <span>{meta.label}</span>
                          <span className="font-mono-code text-[10px] text-amber-400">
                            {meta.ventilationMultiplier}x
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle 3: Indoor HEPA Purifier */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/80 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      indoorPurifier ? 'text-emerald-400' : 'text-stone-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-medium text-stone-200">
                      Indoor HEPA Filtration Active
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Cuts indoor PM2.5 infiltration from 55% to 15%
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIndoorPurifier(!indoorPurifier)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono-code font-semibold border transition-all cursor-pointer ${
                    indoorPurifier
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-stone-900 text-stone-400 border-stone-700'
                  }`}
                >
                  {indoorPurifier ? 'ON (-73% Indoor)' : 'OFF'}
                </button>
              </div>

              {/* Slider 4: Subjective Nicotine Craving / Hedonic Utility */}
              <div className="pt-2 border-t border-stone-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-stone-300 font-medium">
                    Baseline Craving / Hedonic Utility of 1 Cigarette
                  </span>
                  <span className="font-mono-code text-rose-300 font-bold">
                    {baselineCravingUtility} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  step="5"
                  value={baselineCravingUtility}
                  onChange={(e) => setBaselineCravingUtility(parseInt(e.target.value, 10))}
                  className="w-full noir-slider"
                />
                <div className="flex justify-between text-[10px] font-mono-code text-stone-500 mt-1">
                  <span>Non-Smoker (Low Utility)</span>
                  <span>Social / Curious (50)</span>
                  <span>Heavy Craving (95)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Marginal Utility Verdict Card + Cigarette Rack Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            {/* Marginal Utility & Smoking Propensity Hero Card */}
            <div className="rounded-2xl border border-stone-800/90 bg-[#12100E]/95 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-stone-800/80">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-rose-400">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Becker-Murphy &amp; Pope (2009) Marginal Utility Audit</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif-editorial text-stone-100 mt-0.5">
                    How Likely Are You to Smoke a Real Cigarette Based on {cityData.city}&apos;s AQI?
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono-code text-xs">
                  {economics.economicPersona}
                </span>
              </div>

              {/* Propensity Score + 3 Core Economic Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Big Propensity Gauge */}
                <div className="md:col-span-5 p-5 rounded-2xl bg-gradient-to-b from-stone-950 to-stone-900/90 border border-stone-800 text-center relative">
                  <span className="text-[10px] font-mono-code uppercase tracking-widest text-stone-400 block">
                    Marginal Smoking Propensity
                  </span>
                  <div className="text-5xl sm:text-6xl font-mono-code font-bold text-rose-400 my-2">
                    {economics.smokingPropensityPct}%
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden my-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
                      style={{ width: `${economics.smokingPropensityPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono-code text-stone-300 block mt-1">
                    Net Marginal Utility Index:{' '}
                    <strong
                      className={
                        economics.netMarginalUtilityIndex >= 0
                          ? 'text-rose-300'
                          : 'text-emerald-300'
                      }
                    >
                      {economics.netMarginalUtilityIndex >= 0 ? '+' : ''}
                      {economics.netMarginalUtilityIndex}
                    </strong>
                  </span>
                </div>

                {/* 3 Econometric Sub-Metrics */}
                <div className="md:col-span-7 space-y-3">
                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-stone-100">
                        Pope (2009) Marginal Health Cost Discount
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Incremental risk ΔRR of +1 cig here (+
                        {(economics.marginalHealthCostCurrent * 100).toFixed(2)}%) vs pristine air (+
                        {(economics.marginalHealthCostPristine * 100).toFixed(2)}%)
                      </div>
                    </div>
                    <span className="text-lg font-mono-code font-bold text-emerald-400 shrink-0">
                      -{economics.marginalDamageDiscountPct.toFixed(0)}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-stone-100">
                        Weber-Fechner Fractional Jump (ΔC / C_env)
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Relative increase in today&apos;s particulate load from lighting 1 cigarette
                      </div>
                    </div>
                    <span className="text-lg font-mono-code font-bold text-amber-300 shrink-0">
                      +
                      {economics.weberRelativeIncreasePct > 999
                        ? '>999'
                        : economics.weberRelativeIncreasePct.toFixed(1)}
                      %
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-stone-100">
                        Kahneman-Tversky Perceptual Masking Score
                      </div>
                      <div className="text-[11px] text-stone-400">
                        How strongly ambient smog psychologically camouflages 1 extra cigarette
                      </div>
                    </div>
                    <span className="text-lg font-mono-code font-bold text-rose-300 shrink-0">
                      {economics.perceptualMaskingScore} / 100
                    </span>
                  </div>
                </div>
              </div>

              {/* Behavioral Economist Verdict Box */}
              <div className="mt-4 p-4 rounded-xl bg-stone-950/90 border border-amber-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-mono-code uppercase tracking-wider text-amber-300 font-bold">
                    {economics.verdictTitle}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mt-1">
                    {economics.verdictExplanation}
                  </p>
                </div>
              </div>
            </div>

            {/* Physical Cigarette Equivalence Rack */}
            <CigaretteVisualizer
              cigsPerDay={economics.effectiveCigsPerDay}
              rawCigsPerDay={economics.rawBerkeleyCigsPerDay}
              usAqi={economics.usAqi}
              pm25={activePm25}
              showMarginalCigPreview={showMarginalCigPreview}
              onToggleMarginalPreview={() =>
                setShowMarginalCigPreview(!showMarginalCigPreview)
              }
              weberRelativeIncreasePct={economics.weberRelativeIncreasePct}
            />
          </div>
        </div>

        {/* SECTION 2: Interactive Dose-Response & Marginal Cost Curves */}
        <EconomicsCurveChart economics={economics} cityName={cityData.city} />

        {/* SECTION 3: Side-by-Side City Duel / Relocation Calculator */}
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

        {/* SECTION 4: 7-Day Historical/Forecast Timeline & Cumulative Pack Street Value */}
        <TimelineAndFinancials
          economics={economics}
          dailyTimeline={cityData.dailyTimeline}
          exposureRatio={exposureRatio}
          packPriceUsd={packPriceUsd}
          onChangePackPrice={setPackPriceUsd}
          cityName={cityData.city}
        />

        {/* SECTION 5: Global "Smokers' Lounge" Leaderboard */}
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

        {/* SECTION 6: Expandable Peer-Reviewed Literature & Citations */}
        <AcademicCitationsSection />
      </main>

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
