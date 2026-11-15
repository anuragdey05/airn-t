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
  pm25: number; // µg/m³
  pm10: number; // µg/m³
  no2: number; // µg/m³
  o3: number; // µg/m³
  usAqi: number;
  source: 'Hybrid (WAQI Ground Station + Open-Meteo CAMS)' | 'Open-Meteo CAMS Global' | 'Manual Simulator';
  stationName?: string;
  updatedAt: string;
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

export async function searchCitiesWorldwide(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []) as GeocodingResult[];
  } catch {
    return [];
  }
}

function buildFallbackTimeline(basePm25: number): DailyExposurePoint[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const points: DailyExposurePoint[] = [];
  const multipliers = [0.88, 0.95, 1.12, 1.04, 0.91, 0.97, 1.0, 1.06, 0.94, 0.89];

  for (let offset = -6; offset <= 3; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const iso = d.toISOString().slice(0, 10);
    const mult = multipliers[offset + 6] ?? 1.0;
    const pm = Number(Math.max(1.5, basePm25 * mult).toFixed(1));
    points.push({
      date: iso,
      label: offset === 0 ? 'Today' : days[d.getDay()],
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
 * Includes past 6 days + today + 3 forecast days hourly PM2.5 aggregated into daily points.
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
  let pm10 = fallbackPm25 * 1.6;
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
      if (data.current) {
        if (typeof data.current.pm2_5 === 'number') {
          pm25 = Number(data.current.pm2_5.toFixed(1));
        } else if (typeof data.current.us_aqi === 'number') {
          pm25 = usAqiToPm25(data.current.us_aqi);
        }
        pm10 = typeof data.current.pm10 === 'number' ? Number(data.current.pm10.toFixed(1)) : Number((pm25 * 1.5).toFixed(1));
        no2 = typeof data.current.nitrogen_dioxide === 'number' ? Number(data.current.nitrogen_dioxide.toFixed(1)) : 16.0;
        o3 = typeof data.current.ozone === 'number' ? Number(data.current.ozone.toFixed(1)) : 44.0;
        usAqi = typeof data.current.us_aqi === 'number' ? Math.round(data.current.us_aqi) : pm25ToUsAqi(pm25);
      }

      // Aggregate hourly into daily timeline
      if (data.hourly?.time && data.hourly?.pm2_5) {
        const times: string[] = data.hourly.time;
        const pms: (number | null)[] = data.hourly.pm2_5;
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

        const todayIso = new Date().toISOString().slice(0, 10);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const computedTimeline: DailyExposurePoint[] = [];

        Array.from(byDate.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(0, 10)
          .forEach(([dateStr, vals]) => {
            if (vals.length === 0) return;
            const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
            const pmAvg = Number(avg.toFixed(1));
            const dt = new Date(dateStr + 'T12:00:00');
            const isToday = dateStr === todayIso;
            computedTimeline.push({
              date: dateStr,
              label: isToday ? 'Today' : dayNames[dt.getDay()],
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

  // Optional Hybrid WAQI Ground Station check if token provided (or 'demo' when supported)
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
          if (typeof iaqiPm25SubIndex === 'number') {
            usAqi = Math.round(iaqiPm25SubIndex);
            pm25 = usAqiToPm25(usAqi);
            source = 'Hybrid (WAQI Ground Station + Open-Meteo CAMS)';
            stationName = wJson.data.city?.name;
          } else if (typeof stationAqi === 'number') {
            usAqi = Math.round(stationAqi);
            pm25 = usAqiToPm25(usAqi);
            source = 'Hybrid (WAQI Ground Station + Open-Meteo CAMS)';
            stationName = wJson.data.city?.name;
          }
        }
      }
    } catch {
      // Fallback gracefully to Open-Meteo CAMS
    }
  }

  return {
    id: `${city.toLowerCase().replace(/\s+/g, '-')}-${latitude.toFixed(2)}`,
    city,
    region,
    country,
    countryCode,
    latitude,
    longitude,
    pm25,
    pm10,
    no2,
    o3,
    usAqi,
    source,
    stationName,
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dailyTimeline,
  };
}

/**
 * Detects user's current coordinates and city name via Browser Geolocation -> Reverse Geocode,
 * or falls back automatically to IP geolocation so the user always sees their real location immediately.
 */
export async function detectUserLocation(waqiToken?: string): Promise<CityAirQualityData> {
  // 1. Try browser geolocation with a 4.5s timeout
  const getBrowserCoords = (): Promise<{ latitude: number; longitude: number } | null> =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }
      const timer = setTimeout(() => resolve(null), 4500);
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
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
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

  // 2. Fallback to IP Geolocation (geojs.io or ipapi.co)
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

  // 3. Final fallback: New Delhi or New York
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
 * Fetches live PM2.5 and US AQI for all 12 benchmark cities in a single batched Open-Meteo request!
 */
export async function fetchGlobalBenchmarksLive(): Promise<
  Array<BenchmarkCitySeed & { livePm25: number; liveUsAqi: number }>
> {
  try {
    const lats = GLOBAL_BENCHMARK_CITIES.map((c) => c.latitude.toFixed(4)).join(',');
    const lons = GLOBAL_BENCHMARK_CITIES.map((c) => c.longitude.toFixed(4)).join(',');
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=pm2_5,us_aqi`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Batch fetch failed');
    const json = await res.json();
    const list = Array.isArray(json) ? json : [json];

    return GLOBAL_BENCHMARK_CITIES.map((seed, idx) => {
      const item = list[idx];
      const livePm25 =
        typeof item?.current?.pm2_5 === 'number'
          ? Number(item.current.pm2_5.toFixed(1))
          : seed.fallbackPm25;
      const liveUsAqi =
        typeof item?.current?.us_aqi === 'number'
          ? Math.round(item.current.us_aqi)
          : pm25ToUsAqi(livePm25);
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
