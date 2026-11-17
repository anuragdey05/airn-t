export const config = {
  runtime: 'edge',
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default function handler(req: Request): Response {
  const { searchParams } = new URL(req.url);
  const city = escapeXml((searchParams.get('city') || 'Your City').slice(0, 36));
  const cigsRaw = parseFloat(searchParams.get('cigs') || '4.2');
  const cigs = Number.isNaN(cigsRaw) ? 4.2 : Math.max(0, Math.min(99, cigsRaw));
  const aqiRaw = parseInt(searchParams.get('aqi') || '135', 10);
  const aqi = Number.isNaN(aqiRaw) ? 135 : Math.max(0, Math.min(999, aqiRaw));

  const accent =
    aqi <= 50
      ? '#10B981'
      : aqi <= 100
      ? '#F59E0B'
      : aqi <= 150
      ? '#F97316'
      : aqi <= 200
      ? '#EF4444'
      : '#E11D48';

  const sticksSvg = Array.from({ length: 20 }, (_, i) => {
    const lit = i < Math.ceil(cigs);
    const x = 80 + i * 52;
    const op = lit ? '1' : '0.22';
    const tipColor = lit ? '#F97316' : '#57534E';
    return `<g opacity="${op}">
      <rect x="${x}" y="445" width="38" height="10" fill="${tipColor}" rx="2" />
      <rect x="${x}" y="455" width="38" height="22" fill="#C2813A" />
      <rect x="${x}" y="477" width="38" height="58" fill="#EAE4D7" />
    </g>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0B0A09" />
    <rect x="36" y="36" width="1128" height="558" fill="none" stroke="rgba(242,237,228,0.16)" stroke-width="2" rx="24" />
    <text x="80" y="102" fill="#F59E0B" font-family="monospace" font-size="22" font-weight="bold">airn&apos;t // ${city.toUpperCase()} · 24H AVG US AQI ${aqi}</text>
    <text x="80" y="176" fill="#F2EDE4" font-family="Georgia, serif" font-size="54">My air already smokes</text>
    <text x="80" y="325" fill="${accent}" font-family="monospace" font-size="144" font-weight="bold">${cigs.toFixed(1)}</text>
    <text x="430" y="285" fill="#F2EDE4" font-family="sans-serif" font-size="44" font-weight="bold">cigarettes / day</text>
    <text x="430" y="330" fill="#A8A29E" font-family="monospace" font-size="24">22 µg/m³ PM2.5 = 1 cig/day (Berkeley Earth)</text>
    ${sticksSvg}
    <text x="80" y="572" fill="#F59E0B" font-family="monospace" font-size="22">Check your city → airn-t.vercel.app/?city=${encodeURIComponent(city)}</text>
  </svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
