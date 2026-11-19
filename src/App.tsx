import { useCitySearch } from './hooks/useCitySearch';
import { useAmbientMotion } from './hooks/useAmbientMotion';
import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import {
  BenchmarkCitySeed,
  CityAirQualityData,
  detectUserLocation,
  fetchAirQualityByCityName,
  fetchAirQualityForCoords,
  fetchGlobalBenchmarksLive,
  GeocodingResult,
  getPackPriceForCountry,
  GLOBAL_BENCHMARK_CITIES,
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
import { WarningReceiptModal } from './components/WarningReceiptModal';
import { scrollToTop, triggerHaptic } from './lib/haptics';
import { safeStorage } from './lib/safeStorage';
import { CitySearchResults, onCitySearchKeyDown } from './components/CitySearchResults';
import {
  BookOpen,
  Calendar,
  Compass,
  Flame,
  KeyRound,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Share2,
  Sliders,
  Swords,
  X,
} from 'lucide-react';

// Lazy-load secondary tabs to keep the initial Home bundle fast
const CityDuelComparison = lazy(() =>
  import('./components/CityDuelComparison').then((m) => ({ default: m.CityDuelComparison }))
);
const GlobalLeaderboard = lazy(() =>
  import('./components/GlobalLeaderboard').then((m) => ({ default: m.GlobalLeaderboard }))
);
const TimelineAndFinancials = lazy(() =>
  import('./components/TimelineAndFinancials').then((m) => ({ default: m.TimelineAndFinancials }))
);
const EconomicsCurveChart = lazy(() =>
  import('./components/EconomicsCurveChart').then((m) => ({ default: m.EconomicsCurveChart }))
);
const AcademicCitationsSection = lazy(() =>
  import('./components/AcademicCitationsSection').then((m) => ({
    default: m.AcademicCitationsSection,
  }))
);

type ActiveTab = 'pack' | 'compare' | 'trends' | 'science';

const NAV_ITEMS: Array<{ id: ActiveTab; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'pack', label: 'Pack & Verdict', Icon: Flame },
  { id: 'compare', label: 'Compare Cities', Icon: Swords },
  { id: 'trends', label: 'Trends & Cost', Icon: Calendar },
  { id: 'science', label: 'The Science', Icon: BookOpen },
];

function parseInitialTab(): ActiveTab {
  if (typeof window === 'undefined') return 'pack';
  const t = new URLSearchParams(window.location.search).get('tab');
  if (t === 'compare' || t === 'trends' || t === 'science' || t === 'pack') {
    return t;
  }
  return 'pack';
}

const WAQI_TOKEN_KEY = 'aqi_to_cig_waqi_token';

/** Plain left-clicks navigate in-app; modified clicks (new tab/window) fall through to the href. */
const isPlainClick = (event: React.MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(parseInitialTab);
  const [isInitialResolving, setIsInitialResolving] = useState<boolean>(true);

  // Primary City Air Quality State
  const [cityData, setCityData] = useState<CityAirQualityData>(() => ({
    id: 'resolving',
    city: 'Locating your air…',
    region: '',
    country: '',
    countryCode: 'US',
    latitude: 28.6139,
    longitude: 77.209,
    pm25: 22.0,
    currentPm25: 22.0,
    currentUsAqi: pm25ToUsAqi(22.0),
    pm10: 34.0,
    no2: 14.0,
    o3: 42.0,
    usAqi: pm25ToUsAqi(22.0),
    source: 'Open-Meteo CAMS Global',
    updatedAt: 'Syncing…',
    dailyTimeline: [],
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
  const header = useCitySearch();
  const { query: headerSearch, results: headerResults, loading: isHeaderSearching } = header;
  const handleHeaderSearchChange = header.change;
  const primaryRequest = useRef(0);
  const challengerRequest = useRef(0);
  const [locationError, setLocationError] = useState('');
  const ambientRef = useAmbientMotion<HTMLDivElement>();
  const [isDetectingLoc, setIsDetectingLoc] = useState<boolean>(false);

  // Hybrid WAQI Token State
  const [waqiToken, setWaqiToken] = useState<string>(() => safeStorage.get(WAQI_TOKEN_KEY) || '');
  const [showTokenPopover, setShowTokenPopover] = useState<boolean>(false);
  const tokenTriggerRef = useRef<HTMLButtonElement>(null);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const tokenPopoverRef = useRef<HTMLFormElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

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

  const applyPrimaryCity = (fresh: CityAirQualityData) => {
    setCityData(fresh);
    setManualPm25Override(null);
    setPackPriceUsd(getPackPriceForCountry(fresh.countryCode));
    setIsInitialResolving(false);
  };

  const hrefForTab = (tab: ActiveTab) => {
    if (typeof window === 'undefined') return '/';
    const params = new URLSearchParams(window.location.search);
    if (cityData.id !== 'resolving') params.set('city', cityData.city);
    if (tab === 'pack') params.delete('tab');
    else params.set('tab', tab);
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ''}`;
  };

  const switchTab = (tab: ActiveTab) => {
    triggerHaptic(8);
    if (tab !== activeTab) window.history.pushState(null, '', hrefForTab(tab));
    setActiveTab(tab);
    scrollToTop();
  };

  const tabLinkHandler = (tab: ActiveTab) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    switchTab(tab);
  };

  // Browser Back/Forward moves between tabs
  useEffect(() => {
    const onPop = () => setActiveTab(parseInitialTab());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // WAQI token popover: focus the field on open; close on Escape or an outside click
  const closeTokenPopover = (returnFocus = true) => {
    setShowTokenPopover(false);
    if (returnFocus) tokenTriggerRef.current?.focus();
  };
  useEffect(() => {
    if (!showTokenPopover) return;
    tokenInputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTokenPopover();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (tokenPopoverRef.current?.contains(target) || tokenTriggerRef.current?.contains(target)) return;
      closeTokenPopover(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [showTokenPopover]);

  // On mount: check ?city= deep link first; otherwise detect user's real location
  useEffect(() => {
    let cancelled = false;
    const request = ++primaryRequest.current;
    setIsDetectingLoc(true);

    const urlParams = new URLSearchParams(window.location.search);
    const deepLinkCity = urlParams.get('city')?.trim();

    const initialPromise = deepLinkCity
      ? fetchAirQualityByCityName(deepLinkCity, waqiToken).then(
          (res) => res ?? detectUserLocation(waqiToken)
        )
      : detectUserLocation(waqiToken);

    initialPromise
      .then((detected) => {
        if (!cancelled && request === primaryRequest.current) {
          applyPrimaryCity(detected);
        }
      })
      .catch(() => {
        if (!cancelled && request === primaryRequest.current) {
          setLocationError('Could not detect your location. Pick a city below or search above.');
          setIsInitialResolving(false);
        }
      })
      .finally(() => {
        if (!cancelled && request === primaryRequest.current) {
          setIsDetectingLoc(false);
        }
      });

    fetchGlobalBenchmarksLive()
      .then((liveList) => {
        if (!cancelled) {
          setBenchmarks(liveList);
          const zurich = liveList.find((c) => c.id === 'zurich-ch');
          if (zurich && challengerRequest.current === 0) {
            setChallengerCity((prev) => ({
              ...prev,
              pm25: zurich.livePm25,
              usAqi: zurich.liveUsAqi,
            }));
          }
        }
      })
      .catch(() => {
        /* Keep benchmark fallback list */
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

  // Keep URL query params (?city=...&tab=...) and document.title in sync once resolved
  useEffect(() => {
    if (isInitialResolving || cityData.id === 'resolving') return;
    const params = new URLSearchParams(window.location.search);
    params.set('city', cityData.city);
    if (activeTab !== 'pack') {
      params.set('tab', activeTab);
    } else {
      params.delete('tab');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
    document.title = `airn’t — ${economics.effectiveCigsPerDay.toFixed(1)} cigarettes/day in ${
      cityData.city
    } (AQI ${economics.usAqi})`;
  }, [cityData.city, cityData.id, activeTab, economics.effectiveCigsPerDay, economics.usAqi, isInitialResolving]);

  const handleSelectHeaderCity = async (geo: GeocodingResult) => {
    header.change('');
    setIsSearchOpenMobile(false);
    const request = ++primaryRequest.current;
    setLocationError('');
    setIsDetectingLoc(true);
    try {
      const fresh = await fetchAirQualityForCoords({
        city: geo.name,
        region: geo.admin1 || '',
        country: geo.country || '',
        countryCode: geo.country_code || '',
        latitude: geo.latitude,
        longitude: geo.longitude,
        waqiToken,
      });
      if (request !== primaryRequest.current) return;
      applyPrimaryCity(fresh);
    } catch {
      if (request === primaryRequest.current)
        setLocationError('Could not load this location. Please try again.');
    } finally {
      if (request === primaryRequest.current) setIsDetectingLoc(false);
    }
  };

  const handleDetectMyLocation = async () => {
    triggerHaptic(10);
    const request = ++primaryRequest.current;
    setLocationError('');
    setIsDetectingLoc(true);
    try {
      const detected = await detectUserLocation(waqiToken);
      if (request !== primaryRequest.current) return;
      applyPrimaryCity(detected);
    } catch {
      if (request === primaryRequest.current)
        setLocationError('Could not load your location. Please search for a city.');
    } finally {
      if (request === primaryRequest.current) setIsDetectingLoc(false);
    }
  };

  const handleSaveWaqiToken = async (newToken: string) => {
    setWaqiToken(newToken);
    safeStorage.set(WAQI_TOKEN_KEY, newToken);
    closeTokenPopover();
    const request = ++primaryRequest.current;
    setLocationError('');
    setIsDetectingLoc(true);
    try {
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
      if (request !== primaryRequest.current) return;
      applyPrimaryCity(refreshed);
    } catch {
      if (request === primaryRequest.current)
        setLocationError(
          'Could not refresh ground-station data with this token. Check the token and try again, or clear it to use Open-Meteo only.'
        );
    } finally {
      if (request === primaryRequest.current) setIsDetectingLoc(false);
    }
  };

  const handleSelectBenchmarkAsPrimary = async (
    seed: BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }
  ) => {
    triggerHaptic(10);
    const request = ++primaryRequest.current;
    setLocationError('');
    setIsDetectingLoc(true);
    try {
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
      if (request !== primaryRequest.current) return;
      applyPrimaryCity(fresh);
      setPackPriceUsd(seed.localPackPriceUsd);
      setActiveTab('pack');
      scrollToTop();
    } catch {
      if (request === primaryRequest.current)
        setLocationError('Could not load this location. Please try again.');
    } finally {
      if (request === primaryRequest.current) setIsDetectingLoc(false);
    }
  };

  const handleSelectBenchmarkAsChallenger = async (
    seed: BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }
  ) => {
    const request = ++challengerRequest.current;
    setLocationError('');
    try {
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
      if (request !== challengerRequest.current) return;
      setChallengerCity(fresh);
      scrollToTop();
    } catch {
      if (request === challengerRequest.current)
        setLocationError('Could not load the comparison city. Please try again.');
    }
  };

  const handleSwapPrimaryWithChallenger = () => {
    primaryRequest.current++;
    challengerRequest.current++;
    setIsDetectingLoc(false);
    const temp = cityData;
    setCityData(challengerCity);
    setChallengerCity(temp);
    setManualPm25Override(null);
  };

  return (
    <div className="app-shell min-h-screen relative bg-surface text-paper pb-24">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {/* Dynamic Atmospheric Smog Haze Layer */}
      <div
        ref={ambientRef}
        className="ambient fixed inset-0 pointer-events-none transition-colors duration-1000 z-0 animate-smog"
        style={{
          background: `radial-gradient(circle at 50% 18%, ${severity.glowColor}, transparent 60%), radial-gradient(circle at 80% 80%, ${severity.glowColor}, transparent 65%)`,
          opacity: Math.min(1, severity.smogOpacity + 0.25),
        }}
      />

      {/* COMPACT MOBILE-FIRST TOP BAR */}
      <header className="app-header sticky top-0 z-40 backdrop-blur-xl bg-surface/85 border-b border-stone-800/80">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <a
            href={hrefForTab('pack')}
            onClick={tabLinkHandler('pack')}
            aria-label="airn’t home"
            className="flex items-center gap-2 text-left cursor-pointer shrink-0 min-h-11"
          >
            <img
              src="/favicon-32.png"
              alt=""
              width={28}
              height={28}
              className="w-7 h-7 rounded-lg border border-stone-800 object-cover"
            />
            <span translate="no" className="font-serif-editorial italic text-xl tracking-wide text-stone-100">
              airn’t
            </span>
          </a>

          {/* Center / Right Location Pill + Search + Share */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Inline Search */}
            <div className="hidden sm:block relative w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={desktopSearchRef}
                type="search"
                name="city-search"
                autoComplete="off"
                spellCheck={false}
                aria-label="Search cities"
                aria-controls="header-search-results"
                aria-expanded={headerResults.length > 0}
                value={headerSearch}
                onChange={(e) => handleHeaderSearchChange(e.target.value)}
                onKeyDown={(e) => onCitySearchKeyDown(e, 'header-search-results', () => header.change(''))}
                placeholder="Check any city worldwide…"
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-stone-950/90 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500/60"
              />
              {isHeaderSearching && (
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
              )}
              {header.message && (
                <p role="status" className="search-message">
                  {header.message}
                </p>
              )}
              <CitySearchResults
                id="header-search-results"
                results={headerResults}
                onSelect={handleSelectHeaderCity}
                actionLabel="Load"
                inputRef={desktopSearchRef}
                onEscape={() => header.change('')}
                className="absolute left-0 right-0 mt-1.5 rounded-xl bg-stone-950 border border-stone-700 shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
              />
            </div>

            {/* Mobile City Pill Trigger (Opens Search Bar Overlay) */}
            <button
              type="button"
              onClick={() => setIsSearchOpenMobile(!isSearchOpenMobile)}
              aria-label={`Search cities (current: ${cityData.city})`}
              aria-expanded={isSearchOpenMobile}
              aria-controls="mobile-city-search"
              className="mobile-city-trigger sm:hidden px-2.5 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs font-mono-code text-stone-200 flex items-center gap-1.5 max-w-[165px] truncate cursor-pointer"
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
              aria-busy={isDetectingLoc}
              aria-label={isDetectingLoc ? 'Detecting your location' : 'Use my current location'}
              title="Use my current location"
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 transition-colors cursor-pointer"
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
                ref={tokenTriggerRef}
                type="button"
                onClick={() => setShowTokenPopover(!showTokenPopover)}
                aria-label={waqiToken ? 'WAQI station token (set)' : 'WAQI station token (not set)'}
                aria-expanded={showTokenPopover}
                aria-controls="waqi-token-popover"
                className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                  waqiToken
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
                title="WAQI ground-station token"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>

              {showTokenPopover && (
                <form
                  ref={tokenPopoverRef}
                  id="waqi-token-popover"
                  role="group"
                  aria-labelledby="waqi-token-title"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSaveWaqiToken(tokenInputRef.current?.value.trim() || '');
                  }}
                  className="token-popover absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-stone-950 border border-stone-700 p-4 shadow-2xl z-50 text-xs"
                >
                  <div id="waqi-token-title" className="font-mono-code font-bold text-amber-300 uppercase mb-1">
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
                    ref={tokenInputRef}
                    type="text"
                    name="waqi-token"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    defaultValue={waqiToken}
                    placeholder="Optional WAQI token…"
                    aria-label="Optional WAQI token"
                    className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-100 font-mono-code text-xs mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => closeTokenPopover()}
                      className="px-2.5 py-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono-code font-semibold cursor-pointer"
                    >
                      Save Token
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Share Card & Receipt Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                setIsReceiptOpen(true);
              }}
              aria-label="Share card and receipt"
              title="Share card and receipt"
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono-code font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-md shadow-amber-500/15"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Drawer */}
        {isSearchOpenMobile && (
          <div id="mobile-city-search" className="sm:hidden px-3.5 pb-3 pt-1 border-t border-stone-800/80 bg-stone-950/95">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 pointer-events-none" />
              {/* autoFocus is intentional: this field only mounts after the user taps "search". */}
              <input
                ref={mobileSearchRef}
                type="search"
                name="city-search-mobile"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                enterKeyHint="search"
                aria-label="Search cities"
                aria-controls="mobile-search-results"
                aria-expanded={headerResults.length > 0}
                value={headerSearch}
                onChange={(e) => handleHeaderSearchChange(e.target.value)}
                onKeyDown={(e) =>
                  onCitySearchKeyDown(e, 'mobile-search-results', () => {
                    header.change('');
                    setIsSearchOpenMobile(false);
                  })
                }
                placeholder="Type any city (e.g. Tokyo, London, Mumbai)…"
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                aria-label="Close city search"
                onClick={() => {
                  setIsSearchOpenMobile(false);
                  header.change('');
                }}
                className="absolute right-0.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {header.message && (
              <p role="status" className="search-message">
                {header.message}
              </p>
            )}
            <CitySearchResults
              id="mobile-search-results"
              results={headerResults}
              onSelect={handleSelectHeaderCity}
              actionLabel="Load"
              inputRef={mobileSearchRef}
              onEscape={() => header.change('')}
              className="mt-1.5 rounded-xl bg-stone-900 border border-stone-800 divide-y divide-stone-800 max-h-56 overflow-y-auto"
            />
          </div>
        )}
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <main
        id="main-content"
        tabIndex={-1}
        key={activeTab}
        className="tab-content relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-5"
      >
        <h1 className="sr-only">
          {isInitialResolving
            ? 'airn’t: your air quality in cigarettes'
            : `${cityData.city}: ${economics.effectiveCigsPerDay.toFixed(1)} passive cigarettes per day (US AQI ${economics.usAqi})`}
        </h1>

        {locationError && (
          <p role="status" className="status-message mb-4">
            {locationError}
          </p>
        )}

        {/* TAB 1: PACK & VERDICT (PUNCHY MOBILE HERO) */}
        {activeTab === 'pack' && (
          <div className="pack-layout">
            {/* Compact Top Status + "Tune Exposure" Trigger Pill */}
            <div className="pack-status w-full flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-sm font-semibold text-stone-100 break-words min-w-0">
                  {cityData.city}
                </span>
                <span
                  className={`text-xs font-mono-code px-2 py-0.5 rounded-full border ${severity.badgeClass}`}
                >
                  24h AQI {economics.usAqi}
                </span>
                {typeof cityData.currentUsAqi === 'number' &&
                  manualPm25Override === null &&
                  cityData.currentUsAqi !== economics.usAqi && (
                    <span className="text-xs font-mono-code text-stone-400">
                      (Now: AQI {cityData.currentUsAqi})
                    </span>
                  )}
                {manualPm25Override !== null && (
                  <button
                    type="button"
                    onClick={() => setManualPm25Override(null)}
                    className="text-xs font-mono-code px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Simulation</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setIsExposureSheetOpen(true);
                }}
                className="px-2.5 py-1 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700/90 text-xs font-mono-code text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <Sliders className="w-3 h-3" />
                <span>
                  {hoursOutdoors}h • {ACTIVITY_LEVELS[activityLevel].label.split(' ')[0]}
                </span>
              </button>
            </div>

            {isInitialResolving ? (
              /* Honest First-Load Skeleton (No Fake City Flash) */
              <div
                role="status"
                aria-label="Sampling your local air quality"
                className="w-full max-w-md mx-auto my-4 rounded-3xl border border-stone-800/90 bg-panel/90 p-8 text-center space-y-4 animate-pulse"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="font-serif-editorial text-2xl text-stone-200">
                  Sampling your local air…
                </div>
                <p className="text-xs font-mono-code text-stone-400">
                  Computing trailing 24-hour mean PM2.5 (Copernicus CAMS)
                </p>
              </div>
            ) : (
              <>
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

                {/* Freshness & Provenance Micro-Chip */}
                <div className="w-full max-w-md mx-auto flex items-center justify-between px-2 text-xs font-mono-code text-stone-400">
                  <span>
                    Source: {manualPm25Override !== null ? 'Manual Simulator' : cityData.source}
                    {cityData.stationName ? ` (${cityData.stationName})` : ''}
                  </span>
                  <span>Updated {cityData.updatedAt}</span>
                </div>

                {/* 2. BOLD BINARY VERDICT: "SHOULD YOU GO SMOKE A CIGARETTE?" */}
                <ShouldYouSmokeCard
                  economics={economics}
                  cityName={cityData.city}
                  showMarginalCigPreview={showMarginalCigPreview}
                  onToggleMarginalPreview={() =>
                    setShowMarginalCigPreview(!showMarginalCigPreview)
                  }
                  onOpenShareModal={() => setIsReceiptOpen(true)}
                  onOpenScienceTab={() => switchTab('science')}
                  scienceHref={hrefForTab('science')}
                />
              </>
            )}

            {/* Quick City Hot-Swap Pills right below the Verdict for instant exploration */}
            <div className="city-shortcuts w-full pt-1">
              <div className="flex items-center justify-between text-xs font-mono-code uppercase tracking-wider text-stone-400 mb-2 px-1">
                <span>Instant City Teleport (24h Cigs/Day):</span>
                <a
                  href={hrefForTab('compare')}
                  onClick={tabLinkHandler('compare')}
                  className="text-amber-400 hover:underline cursor-pointer inline-flex items-center min-h-11"
                >
                  Compare All Cities →
                </a>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {benchmarks.slice(0, 7).map((b) => {
                  const isCurrent =
                    !isInitialResolving &&
                    cityData.city.toLowerCase() === b.city.toLowerCase() &&
                    manualPm25Override === null;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBenchmarkAsPrimary(b)}
                      aria-current={isCurrent ? 'true' : undefined}
                      aria-label={`${b.city}: ${(b.livePm25 / 22).toFixed(1)} cigarettes per day${isCurrent ? ' (current city)' : ''}`}
                      className={`px-3 py-1.5 rounded-xl font-mono-code text-xs shrink-0 border transition-colors cursor-pointer ${
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

        {/* SECONDARY TABS (LAZY-LOADED) */}
        <Suspense
          fallback={
            <div className="py-16 text-center text-xs font-mono-code text-stone-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Loading module…</span>
            </div>
          }
        >
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
                beginChallengerRequest={() => ++challengerRequest.current}
                isChallengerRequestCurrent={(id) => id === challengerRequest.current}
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
                countryName={cityData.country}
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
        </Suspense>
      </main>

      {/* STICKY MOBILE-FIRST 4-TAB BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Main navigation"
        className="bottom-nav fixed bottom-0 inset-x-0 z-40 backdrop-blur-2xl bg-surface/92 border-t border-stone-800/90"
      >
        <div className="max-w-lg mx-auto px-2 py-1.5 grid grid-cols-4 gap-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <a
                key={id}
                href={hrefForTab(id)}
                aria-current={isActive ? 'page' : undefined}
                onClick={tabLinkHandler(id)}
                className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-mono-code font-semibold tracking-tight">
                  {label}
                </span>
              </a>
            );
          })}
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

      {/* Shareable Warning Receipt & Card Modal */}
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
