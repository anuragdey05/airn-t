import { pm25ToUsAqi, usAqiToPm25 } from './economics';

export interface DailyExposurePoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g., "Mon", "Today"
  pm25Avg: number;
  usAqiAvg: number;
  cigsPerDay: number;
  isForecast: boolean;
}

export interface CityAirQualityData {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  pm25: number; // 24-hour trailing mean PM2.5 (µg/m³) — used for Berkeley Earth cigarette conversion
  currentPm25?: number; // Instantaneous current-hour PM2.5 (µg/m³)
  currentUsAqi?: number; // Instantaneous current-hour AQI
  pm10: number; // µg/m³
  no2: number; // µg/m³
  o3: number; // µg/m³
  usAqi: number; // 24-hour US EPA AQI
  source: 'Hybrid (WAQI Ground Station + Open-Meteo CAMS)' | 'Open-Meteo CAMS Global' | 'Manual Simulator';
  stationName?: string;
  updatedAt: string;
  fetchedAtMs?: number;
  dailyTimeline: DailyExposurePoint[];
}

export interface GeocodingResult {
  id: number;
  name: string;
  admin1?: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  population?: number;
}

export interface BenchmarkCitySeed {
  id: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  fallbackPm25: number;
  localPackPriceUsd: number;
  localCurrencySymbol: string;
  localPackPriceNative: number;
}

export const GLOBAL_BENCHMARK_CITIES: BenchmarkCitySeed[] = [
  {
    id: 'delhi-in',
    city: 'New Delhi',
    region: 'Delhi NCR',
    country: 'India',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    fallbackPm25: 168.4,
    localPackPriceUsd: 4.2,
    localCurrencySymbol: '₹',
    localPackPriceNative: 350,
  },
  {
    id: 'lahore-pk',
    city: 'Lahore',
    region: 'Punjab',
    country: 'Pakistan',
    countryCode: 'PK',
    latitude: 31.5204,
    longitude: 74.3587,
    fallbackPm25: 182.0,
    localPackPriceUsd: 2.1,
    localCurrencySymbol: '₨',
    localPackPriceNative: 580,
  },
  {
    id: 'beijing-cn',
    city: 'Beijing',
    region: 'Hebei / Municipality',
    country: 'China',
    countryCode: 'CN',
    latitude: 39.9042,
    longitude: 116.4074,
    fallbackPm25: 78.5,
    localPackPriceUsd: 3.5,
    localCurrencySymbol: '¥',
    localPackPriceNative: 25,
  },
  {
    id: 'cairo-eg',
    city: 'Cairo',
    region: 'Greater Cairo',
    country: 'Egypt',
    countryCode: 'EG',
    latitude: 30.0444,
    longitude: 31.2357,
    fallbackPm25: 64.2,
    localPackPriceUsd: 1.9,
    localCurrencySymbol: 'E£',
    localPackPriceNative: 95,
  },
  {
    id: 'jakarta-id',
    city: 'Jakarta',
    region: 'Java',
    country: 'Indonesia',
    countryCode: 'ID',
    latitude: -6.2088,
    longitude: 106.8456,
    fallbackPm25: 56.8,
    localPackPriceUsd: 2.6,
    localCurrencySymbol: 'Rp',
    localPackPriceNative: 40000,
  },
  {
    id: 'mexico-city-mx',
    city: 'Mexico City',
    region: 'CDMX',
    country: 'Mexico',
    countryCode: 'MX',
    latitude: 19.4326,
    longitude: -99.1332,
    fallbackPm25: 31.4,
    localPackPriceUsd: 4.5,
    localCurrencySymbol: 'MX$',
    localPackPriceNative: 80,
  },
  {
    id: 'los-angeles-us',
    city: 'Los Angeles',
    region: 'California',
    country: 'United States',
    countryCode: 'US',
    latitude: 34.0522,
    longitude: -118.2437,
    fallbackPm25: 23.6,
    localPackPriceUsd: 11.5,
    localCurrencySymbol: '$',
    localPackPriceNative: 11.5,
  },
  {
    id: 'new-york-us',
    city: 'New York',
    region: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    fallbackPm25: 13.8,
    localPackPriceUsd: 14.5,
    localCurrencySymbol: '$',
    localPackPriceNative: 14.5,
  },
  {
    id: 'london-gb',
    city: 'London',
    region: 'England',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    fallbackPm25: 11.9,
    localPackPriceUsd: 19.8,
    localCurrencySymbol: '£',
    localPackPriceNative: 15.6,
  },
  {
    id: 'tokyo-jp',
    city: 'Tokyo',
    region: 'Kanto',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    fallbackPm25: 10.4,
    localPackPriceUsd: 4.1,
    localCurrencySymbol: '¥',
    localPackPriceNative: 600,
  },
  {
    id: 'zurich-ch',
    city: 'Zurich',
    region: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    latitude: 47.3769,
    longitude: 8.5417,
    fallbackPm25: 6.2,
    localPackPriceUsd: 10.8,
    localCurrencySymbol: 'CHF ',
    localPackPriceNative: 9.5,
  },
  {
    id: 'reykjavik-is',
    city: 'Reykjavik',
    region: 'Capital Region',
    country: 'Iceland',
    countryCode: 'IS',
    latitude: 64.1466,
    longitude: -21.9426,
    fallbackPm25: 2.8,
    localPackPriceUsd: 11.9,
    localCurrencySymbol: 'kr ',
    localPackPriceNative: 1650,
  },
];

const COUNTRY_PACK_PRICE_USD: Record<string, number> = {
  AU: 26.0,
  NZ: 24.0,
  GB: 19.8,
  IE: 18.0,
  NO: 15.5,
  CA: 13.5,
  FR: 13.0,
  SG: 11.8,
  US: 11.5,
  IS: 11.9,
  CH: 10.8,
  NL: 10.5,
  DE: 9.2,
  IT: 6.8,
  ES: 6.5,
  AE: 6.0,
  MX: 4.5,
  IN: 4.2,
  JP: 4.1,
  KR: 3.6,
  CN: 3.5,
  ZA: 3.2,
  ID: 2.6,
  BR: 2.5,
  PK: 2.1,
  EG: 1.9,
  VN: 1.6,
  NG: 1.5,
};

export function getPackPriceForCountry(countryCode?: string): number {
  if (!countryCode) return 10.5;
  const code = countryCode.trim().toUpperCase();
  return COUNTRY_PACK_PRICE_USD[code] ?? 10.5;
}

/**
 * Computes the local YYYY-MM-DD and YYYY-MM-DDTHH:00 for a location given its UTC offset in seconds.
 * Avoids the UTC toISOString() day-shift bug in timezones ahead/behind UTC.
 */
export function getLocalIsoDateAndHour(
  utcOffsetSeconds?: number,
  nowMs: number = Date.now()
): { todayIso: string; currentHourIso: string } {
  const offsetSec =
    typeof utcOffsetSeconds === 'number' && !Number.isNaN(utcOffsetSeconds)
      ? utcOffsetSeconds
      : -new Date(nowMs).getTimezoneOffset() * 60;

  const localShifted = new Date(nowMs + offsetSec * 1000);
  const iso = localShifted.toISOString(); // now represents local wall-clock time
  return {
    todayIso: iso.slice(0, 10),
    currentHourIso: iso.slice(0, 13) + ':00',
  };
}

/**
 * Computes the trailing 24-hour mean PM2.5 (µg/m³) ending at `currentHourIso` (or the latest past hour).
 * Berkeley Earth's 22 µg/m³ = 1 cigarette/day equivalence is defined on 24-hour average exposure.
 */
export function computeTrailing24hMeanPm25(
  times: string[],
  pms: (number | null | undefined)[],
  currentHourIso: string
): number | null {
  if (!times?.length || !pms?.length) return null;

  const validPairs: Array<{ time: string; val: number }> = [];
  const len = Math.min(times.length, pms.length);
  for (let i = 0; i < len; i++) {
    const v = pms[i];
    const t = times[i];
    if (typeof t === 'string' && typeof v === 'number' && !Number.isNaN(v) && v >= 0) {
      validPairs.push({ time: t, val: v });
    }
  }
  if (validPairs.length === 0) return null;

  // Filter up to currentHourIso
  const upToNow = validPairs.filter((p) => p.time <= currentHourIso);
  const windowSource = upToNow.length >= 6 ? upToNow : validPairs.slice(0, 24);
  const trailing24 = windowSource.slice(-24);

  if (trailing24.length === 0) return null;
  const mean = trailing24.reduce((acc, item) => acc + item.val, 0) / trailing24.length;
  return Number(mean.toFixed(1));
}

export async function searchCitiesWorldwide(query: string, reportErrors = false): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('City search unavailable');
    const data = await res.json();
    return (data.results || []) as GeocodingResult[];
  } catch (error) {
    if (reportErrors) throw error;
    return [];
  }
}

function buildFallbackTimeline(basePm25: number, utcOffsetSeconds?: number): DailyExposurePoint[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const { todayIso } = getLocalIsoDateAndHour(utcOffsetSeconds);
  const baseDate = new Date(todayIso + 'T12:00:00Z');
  const points: DailyExposurePoint[] = [];
  const multipliers = [0.88, 0.95, 1.12, 1.04, 0.91, 0.97, 1.0, 1.06, 0.94, 0.89];

  for (let offset = -6; offset <= 3; offset++) {
    const d = new Date(baseDate.getTime() + offset * 86400_000);
    const iso = d.toISOString().slice(0, 10);
    const mult = multipliers[offset + 6] ?? 1.0;
    const pm = Number(Math.max(1.5, basePm25 * mult).toFixed(1));
    points.push({
      date: iso,
      label: offset === 0 ? 'Today' : days[d.getUTCDay()],
      pm25Avg: pm,
      usAqiAvg: pm25ToUsAqi(pm),
      cigsPerDay: Number((pm / 22).toFixed(2)),
      isForecast: offset > 0,
    });
  }
  return points;
}

/**
 * Fetches live Air Quality from Open-Meteo CAMS + optional WAQI ground station override.
 * Uses trailing 24-hour average PM2.5 for the cigarette conversion while preserving instantaneous AQI context.
 */
export async function fetchAirQualityForCoords(params: {
  city: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  waqiToken?: string;
  fallbackPm25?: number;
}): Promise<CityAirQualityData> {
  const {
    city,
    region = '',
    country = '',
    countryCode = '',
    latitude,
    longitude,
    waqiToken,
    fallbackPm25 = 24.5,
  } = params;

  let pm25 = fallbackPm25;
  let currentPm25 = fallbackPm25;
  let currentUsAqi = pm25ToUsAqi(fallbackPm25);
  let pm10 = Number((fallbackPm25 * 1.5).toFixed(1));
  let no2 = 18.0;
  let o3 = 42.0;
  let usAqi = pm25ToUsAqi(fallbackPm25);
  let source: CityAirQualityData['source'] = 'Open-Meteo CAMS Global';
  let stationName: string | undefined;
  let dailyTimeline: DailyExposurePoint[] = buildFallbackTimeline(fallbackPm25);

  try {
    const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude.toFixed(
      4
    )}&longitude=${longitude.toFixed(
      4
    )}&current=pm2_5,pm10,us_aqi,nitrogen_dioxide,ozone&hourly=pm2_5,us_aqi&past_days=6&forecast_days=4&timezone=auto`;

    const res = await fetch(openMeteoUrl);
    if (res.ok) {
      const data = await res.json();
      const utcOffsetSeconds: number | undefined =
        typeof data.utc_offset_seconds === 'number' ? data.utc_offset_seconds : undefined;
      const { todayIso, currentHourIso } = getLocalIsoDateAndHour(utcOffsetSeconds);

      if (data.current) {
        if (typeof data.current.pm2_5 === 'number') {
          currentPm25 = Number(data.current.pm2_5.toFixed(1));
          pm25 = currentPm25;
        } else if (typeof data.current.us_aqi === 'number') {
          currentPm25 = usAqiToPm25(data.current.us_aqi);
          pm25 = currentPm25;
        }
        pm10 =
          typeof data.current.pm10 === 'number'
            ? Number(data.current.pm10.toFixed(1))
            : Number((currentPm25 * 1.5).toFixed(1));
        no2 =
          typeof data.current.nitrogen_dioxide === 'number'
            ? Number(data.current.nitrogen_dioxide.toFixed(1))
            : 16.0;
        o3 =
          typeof data.current.ozone === 'number'
            ? Number(data.current.ozone.toFixed(1))
            : 44.0;
        currentUsAqi =
          typeof data.current.us_aqi === 'number'
            ? Math.round(data.current.us_aqi)
            : pm25ToUsAqi(currentPm25);
        usAqi = currentUsAqi;
      }

      // Compute 24-hour trailing mean PM2.5 + aggregate daily timeline in local timezone
      if (data.hourly?.time && data.hourly?.pm2_5) {
        const times: string[] = data.hourly.time;
        const pms: (number | null)[] = data.hourly.pm2_5;

        const trailing24Mean = computeTrailing24hMeanPm25(times, pms, currentHourIso);
        if (trailing24Mean !== null) {
          pm25 = trailing24Mean;
          usAqi = pm25ToUsAqi(trailing24Mean);
        }

        const byDate = new Map<string, number[]>();
        times.forEach((t, idx) => {
          const datePart = t.slice(0, 10);
          const val = pms[idx];
          if (typeof val === 'number' && !Number.isNaN(val)) {
            const arr = byDate.get(datePart) || [];
            arr.push(val);
            byDate.set(datePart, arr);
          }
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const computedTimeline: DailyExposurePoint[] = [];

        Array.from(byDate.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(0, 10)
          .forEach(([dateStr, vals]) => {
            if (vals.length === 0) return;
            const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
            const pmAvg = Number(avg.toFixed(1));
            const dt = new Date(dateStr + 'T12:00:00Z');
            const isToday = dateStr === todayIso;
            computedTimeline.push({
              date: dateStr,
              label: isToday ? 'Today' : dayNames[dt.getUTCDay()],
              pm25Avg: pmAvg,
              usAqiAvg: pm25ToUsAqi(pmAvg),
              cigsPerDay: Number((pmAvg / 22).toFixed(2)),
              isForecast: dateStr > todayIso,
            });
          });

        if (computedTimeline.length >= 5) {
          dailyTimeline = computedTimeline;
        }
      }
    }
  } catch {
    // Keep fallback timeline if offline
  }

  // Optional Hybrid WAQI Ground Station check if token provided
  const tokenToUse = waqiToken?.trim();
  if (tokenToUse) {
    try {
      const waqiUrl = `https://api.waqi.info/feed/geo:${latitude.toFixed(4)};${longitude.toFixed(
        4
      )}/?token=${encodeURIComponent(tokenToUse)}`;
      const wRes = await fetch(waqiUrl);
      if (wRes.ok) {
        const wJson = await wRes.json();
        if (wJson.status === 'ok' && wJson.data) {
          const stationAqi = typeof wJson.data.aqi === 'number' ? wJson.data.aqi : undefined;
          const iaqiPm25SubIndex = wJson.data.iaqi?.pm25?.v;
          const resolvedAqi =
            typeof iaqiPm25SubIndex === 'number' ? iaqiPm25SubIndex : stationAqi;
          if (typeof resolvedAqi === 'number') {
            usAqi = Math.round(resolvedAqi);
            pm25 = usAqiToPm25(usAqi);
            currentUsAqi = usAqi;
            currentPm25 = pm25;
            source = 'Hybrid (WAQI Ground Station + Open-Meteo CAMS)';
            stationName = wJson.data.city?.name;
          }
        }
      }
    } catch {
      // Fallback gracefully to Open-Meteo CAMS
    }
  }

  const nowMs = Date.now();
  return {
    id: `${city.toLowerCase().replace(/\s+/g, '-')}-${latitude.toFixed(2)}`,
    city,
    region,
    country,
    countryCode,
    latitude,
    longitude,
    pm25,
    currentPm25,
    currentUsAqi,
    pm10,
    no2,
    o3,
    usAqi,
    source,
    stationName,
    updatedAt: new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fetchedAtMs: nowMs,
    dailyTimeline,
  };
}

/**
 * Resolves a city by name (for ?city= deep links) and fetches its live air quality.
 */
export async function fetchAirQualityByCityName(
  cityNameQuery: string,
  waqiToken?: string
): Promise<CityAirQualityData | null> {
  const q = cityNameQuery.trim();
  if (!q) return null;

  // Check if it matches one of our benchmark cities first for instant coordinates
  const matchedBenchmark = GLOBAL_BENCHMARK_CITIES.find(
    (b) => b.city.toLowerCase() === q.toLowerCase() || b.id.toLowerCase() === q.toLowerCase()
  );
  if (matchedBenchmark) {
    return fetchAirQualityForCoords({
      city: matchedBenchmark.city,
      region: matchedBenchmark.region,
      country: matchedBenchmark.country,
      countryCode: matchedBenchmark.countryCode,
      latitude: matchedBenchmark.latitude,
      longitude: matchedBenchmark.longitude,
      fallbackPm25: matchedBenchmark.fallbackPm25,
      waqiToken,
    });
  }

  const results = await searchCitiesWorldwide(q);
  if (!results.length) return null;
  const top = results[0];
  return fetchAirQualityForCoords({
    city: top.name,
    region: top.admin1 || '',
    country: top.country || '',
    countryCode: top.country_code || '',
    latitude: top.latitude,
    longitude: top.longitude,
    waqiToken,
  });
}

/**
 * Detects user's current coordinates and city name via Browser Geolocation -> Reverse Geocode,
 * or falls back automatically to IP geolocation.
 */
export async function detectUserLocation(waqiToken?: string): Promise<CityAirQualityData> {
  const getBrowserCoords = (): Promise<{ latitude: number; longitude: number } | null> =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }
      const timer = setTimeout(() => resolve(null), 4000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
      );
    });

  const browserCoords = await getBrowserCoords();
  if (browserCoords) {
    let city = 'Your Location';
    let region = '';
    let country = '';
    let countryCode = '';

    try {
      const revUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${browserCoords.latitude}&longitude=${browserCoords.longitude}&localityLanguage=en`;
      const revRes = await fetch(revUrl);
      if (revRes.ok) {
        const revData = await revRes.json();
        city = revData.city || revData.locality || revData.principalSubdivision || 'Current Location';
        region = revData.principalSubdivision || '';
        country = revData.countryName || '';
        countryCode = revData.countryCode || '';
      }
    } catch {
      // ignore reverse geocode failure
    }

    return fetchAirQualityForCoords({
      city,
      region,
      country,
      countryCode,
      latitude: browserCoords.latitude,
      longitude: browserCoords.longitude,
      waqiToken,
    });
  }

  // 2. Fallback to IP Geolocation (geojs.io)
  try {
    const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      const lat = parseFloat(ipData.latitude);
      const lon = parseFloat(ipData.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        return fetchAirQualityForCoords({
          city: ipData.city || 'Detected City',
          region: ipData.region || '',
          country: ipData.country || '',
          countryCode: ipData.country_code || '',
          latitude: lat,
          longitude: lon,
          waqiToken,
        });
      }
    }
  } catch {
    // ignore IP geo failure
  }

  // 3. Final fallback if both GPS and IP are blocked
  const fallbackSeed = GLOBAL_BENCHMARK_CITIES[0];
  return fetchAirQualityForCoords({
    city: fallbackSeed.city,
    region: fallbackSeed.region,
    country: fallbackSeed.country,
    countryCode: fallbackSeed.countryCode,
    latitude: fallbackSeed.latitude,
    longitude: fallbackSeed.longitude,
    fallbackPm25: fallbackSeed.fallbackPm25,
    waqiToken,
  });
}

/**
 * Fetches 24-hour mean PM2.5 and US AQI for all 12 benchmark cities in a single batched Open-Meteo request.
 */
export async function fetchGlobalBenchmarksLive(): Promise<
  Array<BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }>
> {
  try {
    const lats = GLOBAL_BENCHMARK_CITIES.map((c) => c.latitude.toFixed(4)).join(',');
    const lons = GLOBAL_BENCHMARK_CITIES.map((c) => c.longitude.toFixed(4)).join(',');
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm2_5,us_aqi&hourly=pm2_5&past_days=1&forecast_days=1&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Batch fetch failed');
    const json = await res.json();
    const list = Array.isArray(json) ? json : [json];

    return GLOBAL_BENCHMARK_CITIES.map((seed, idx) => {
      const item = list[idx];
      const utcOffset =
        typeof item?.utc_offset_seconds === 'number' ? item.utc_offset_seconds : undefined;
      const { currentHourIso } = getLocalIsoDateAndHour(utcOffset);

      let livePm25 = seed.fallbackPm25;
      if (item?.hourly?.time && item?.hourly?.pm2_5) {
        const mean24 = computeTrailing24hMeanPm25(
          item.hourly.time,
          item.hourly.pm2_5,
          currentHourIso
        );
        if (mean24 !== null) {
          livePm25 = mean24;
        }
      } else if (typeof item?.current?.pm2_5 === 'number') {
        livePm25 = Number(item.current.pm2_5.toFixed(1));
      }

      const liveUsAqi = pm25ToUsAqi(livePm25);
      return {
        ...seed,
        livePm25,
        liveUsAqi,
      };
    });
  } catch {
    return GLOBAL_BENCHMARK_CITIES.map((seed) => ({
      ...seed,
      livePm25: seed.fallbackPm25,
      liveUsAqi: pm25ToUsAqi(seed.fallbackPm25),
    }));
  }
}
