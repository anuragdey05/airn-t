import { CityAirQualityData } from './aqiService';
import { EconomicBreakdown, getAqiSeverity } from './economics';
import { formatUsd } from './format';

export type ShareCardFormat = 'story' | 'landscape';

export interface ShareCardOptions {
  cityData: CityAirQualityData;
  economics: EconomicBreakdown;
  hoursOutdoors: number;
  packPriceUsd: number;
  format?: ShareCardFormat;
}

export function buildCityShareUrl(cityName: string): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://airn-t.vercel.app';
  const params = new URLSearchParams();
  params.set('city', cityName);
  return `${origin}/?${params.toString()}`;
}

export function drawShareCardToCanvas(
  canvas: HTMLCanvasElement,
  options: ShareCardOptions
): void {
  const { cityData, economics, hoursOutdoors, packPriceUsd, format = 'story' } = options;
  const isStory = format === 'story';
  const W = isStory ? 1080 : 1200;
  const H = isStory ? 1920 : 630;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sev = getAqiSeverity(economics.usAqi);
  const cigs = economics.effectiveCigsPerDay;
  const edge = isStory ? 64 : 42;

  // Draw text, truncating with an ellipsis if it would run past the card frame (long city names).
  const fitText = (text: string, x: number, y: number) => {
    const max = W - x - edge - 16;
    let out = text;
    if (typeof ctx.measureText === 'function' && ctx.measureText(out).width > max) {
      while (out.length > 1 && ctx.measureText(`${out}…`).width > max) out = out.slice(0, -1);
      out = `${out.trimEnd()}…`;
    }
    ctx.fillText(out, x, y);
  };

  // 1. Deep Atmospheric Background
  ctx.fillStyle = '#0B0A09';
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(
    W * 0.5,
    isStory ? H * 0.28 : H * 0.35,
    40,
    W * 0.5,
    isStory ? H * 0.28 : H * 0.35,
    isStory ? 680 : 520
  );
  glow.addColorStop(0, sev.colorHex + '44');
  glow.addColorStop(0.55, sev.colorHex + '14');
  glow.addColorStop(1, 'rgba(11, 10, 9, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Subtle frame border
  const pad = isStory ? 64 : 42;
  ctx.strokeStyle = 'rgba(242, 237, 228, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

  if (isStory) {
    // STORY LAYOUT (1080 x 1920)
    // Header brand & location
    ctx.fillStyle = '#F59E0B';
    ctx.font = '700 28px "JetBrains Mono", monospace';
    fitText("airn’t // ATMOSPHERIC TAR REPORT", pad + 44, pad + 72);

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 24px "JetBrains Mono", monospace';
    const locLabel = `${cityData.city.toUpperCase()}${
      cityData.country ? ' · ' + cityData.country.toUpperCase() : ''
    } · 24H AVG`;
    fitText(locLabel, pad + 44, pad + 114);

    // Big Hero Statement: "My air already smokes X.X cigarettes a day"
    ctx.fillStyle = '#F2EDE4';
    ctx.font = '400 68px "Instrument Serif", Georgia, serif';
    fitText('My air already smokes', pad + 44, pad + 230);

    // Giant Cigarette Count
    ctx.fillStyle = sev.colorHex;
    ctx.font = '800 186px "JetBrains Mono", monospace';
    const cigStr = cigs.toFixed(1);
    fitText(cigStr, pad + 44, pad + 420);

    const cigWidth = ctx.measureText(cigStr).width;
    ctx.fillStyle = '#F2EDE4';
    ctx.font = '600 46px "Space Grotesk", sans-serif';
    fitText('cigarettes', pad + 44 + cigWidth + 28, pad + 355);
    ctx.fillStyle = '#F59E0B';
    ctx.font = '500 38px "JetBrains Mono", monospace';
    fitText('per day', pad + 44 + cigWidth + 28, pad + 408);

    // Sub-caption
    ctx.fillStyle = '#D6D3D1';
    ctx.font = '400 30px "Space Grotesk", sans-serif';
    const freqText =
      cigs >= 0.05
        ? `Inhaling 1 passive cigarette every ${(24 / cigs).toFixed(1)} hours in ${cityData.city}.`
        : `Breathing clean alpine-grade air today in ${cityData.city}.`;
    fitText(freqText, pad + 44, pad + 490);

    // Visual 20-Cigarette Pack Tray Illustration (Centerpiece)
    const trayX = pad + 44;
    const trayY = pad + 560;
    const trayW = W - (pad + 44) * 2;
    const trayH = 540;

    ctx.fillStyle = '#151210';
    ctx.strokeStyle = '#44403C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(trayX, trayY, trayW, trayH, 28);
    ctx.fill();
    ctx.stroke();

    // Draw 20 cigarettes inside the pack
    const stickCount = 20;
    const gap = 12;
    const innerPad = 42;
    const stickW = (trayW - innerPad * 2 - gap * (stickCount - 1)) / stickCount;
    const maxStickH = 310;
    const baseBottomY = trayY + 380;

    for (let i = 0; i < stickCount; i++) {
      const frac = Math.min(1, Math.max(0, cigs - i));
      const isLit = frac > 0;
      const pullOffset = isLit ? 30 + frac * 65 : 0;
      const sx = trayX + innerPad + i * (stickW + gap);
      const sy = baseBottomY - maxStickH - pullOffset;

      ctx.save();
      ctx.globalAlpha = isLit ? 1 : 0.22;

      // Ember tip
      ctx.fillStyle = isLit ? '#F97316' : '#57534E';
      ctx.fillRect(sx, sy, stickW, 14);

      // Cork filter
      ctx.fillStyle = '#C2813A';
      ctx.fillRect(sx, sy + 14, stickW, 56);

      // Paper body
      ctx.fillStyle = '#EAE4D7';
      ctx.fillRect(sx, sy + 70, stickW, maxStickH - 70);
      ctx.restore();
    }

    // Pack Front Collar Overlay
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(trayX + 4, trayY + 340, trayW - 8, trayH - 344);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trayX + 36, trayY + 340);
    ctx.lineTo(trayX + trayW - 36, trayY + 340);
    ctx.stroke();

    ctx.fillStyle = '#F2EDE4';
    ctx.font = '400 48px "Instrument Serif", Georgia, serif';
    fitText(`airn’t · ${cityData.city}`, trayX + 44, trayY + 415);

    ctx.fillStyle = '#A8A29E';
    ctx.font = '500 24px "JetBrains Mono", monospace';
    fitText(
      `20 CLASS A PARTICULATE EQUIVALENTS · ${hoursOutdoors}H OUTDOOR PROFILE`,
      trayX + 44,
      trayY + 465
    );

    // 3 Metric Boxes Below Pack
    const boxY = trayY + trayH + 48;
    const boxH = 190;
    const boxGap = 24;
    const boxW = (trayW - boxGap * 2) / 3;

    const metrics = [
      {
        label: '24H PM2.5 / AQI',
        val: `${cityData.pm25.toFixed(1)} µg`,
        sub: `US AQI ${economics.usAqi}`,
        color: sev.colorHex,
      },
      {
        label: 'ANNUAL HABIT',
        val: `${economics.packsPerYear.toFixed(1)}`,
        sub: `packs/yr (${formatUsd(economics.packsPerYear * packPriceUsd)})`,
        color: '#F59E0B',
      },
      {
        label: 'SLOPE DISCOUNT',
        val: `-${economics.marginalDamageDiscountPct.toFixed(0)}%`,
        sub: 'Pope (2009) curve fit',
        color: '#10B981',
      },
    ];

    metrics.forEach((m, idx) => {
      const bx = trayX + idx * (boxW + boxGap);
      ctx.fillStyle = '#141210';
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, boxY, boxW, boxH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#A8A29E';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      fitText(m.label, bx + 24, boxY + 46);

      ctx.fillStyle = m.color;
      ctx.font = '700 48px "JetBrains Mono", monospace';
      fitText(m.val, bx + 24, boxY + 112);

      ctx.fillStyle = '#D6D3D1';
      ctx.font = '400 22px "Space Grotesk", sans-serif';
      fitText(m.sub, bx + 24, boxY + 154);
    });

    // Surgeon General / Berkeley Earth Warning Box
    const warnY = boxY + boxH + 48;
    ctx.fillStyle = '#F4EFE6';
    ctx.beginPath();
    ctx.roundRect(trayX, warnY, trayW, 180, 16);
    ctx.fill();

    ctx.fillStyle = '#0B0A09';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    fitText(
      'ATMOSPHERIC WARNING · BERKELEY EARTH (22 µg/m³ PM2.5 = 1 CIG/DAY)',
      trayX + 28,
      warnY + 48
    );

    ctx.font = '500 22px "Space Grotesk", sans-serif';
    fitText(
      `Breathing ${cityData.city}’s air equals ${(cigs * 7).toFixed(
        1
      )} cigarettes/week (${economics.packsPerYear.toFixed(1)} packs/year).`,
      trayX + 28,
      warnY + 96
    );
    ctx.fillStyle = '#44403C';
    ctx.font = '500 20px "JetBrains Mono", monospace';
    fitText(
      `Check your city → airn-t.vercel.app/?city=${cityData.city}`,
      trayX + 28,
      warnY + 142
    );
  } else {
    // LANDSCAPE / POST LAYOUT (1200 x 630)
    const leftX = pad + 38;
    ctx.fillStyle = '#F59E0B';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    fitText(
      `airn’t // ${cityData.city.toUpperCase()} · 24H AVG AQI ${economics.usAqi}`,
      leftX,
      pad + 54
    );

    ctx.fillStyle = '#F2EDE4';
    ctx.font = '400 48px "Instrument Serif", Georgia, serif';
    fitText('My air already smokes', leftX, pad + 124);

    ctx.fillStyle = sev.colorHex;
    ctx.font = '800 132px "JetBrains Mono", monospace';
    const cigStr = cigs.toFixed(1);
    fitText(cigStr, leftX, pad + 260);
    const cw = ctx.measureText(cigStr).width;

    ctx.fillStyle = '#F2EDE4';
    ctx.font = '600 36px "Space Grotesk", sans-serif';
    fitText('cigarettes / day', leftX + cw + 24, pad + 235);

    ctx.fillStyle = '#D6D3D1';
    ctx.font = '400 24px "Space Grotesk", sans-serif';
    fitText(
      `24h PM2.5: ${cityData.pm25.toFixed(1)} µg/m³ · ${economics.packsPerYear.toFixed(
        1
      )} packs/year · -${economics.marginalDamageDiscountPct.toFixed(0)}% slope discount`,
      leftX,
      pad + 330
    );

    // Mini 20-stick bar on landscape card
    const barY = pad + 368;
    const stickW = 36;
    const gap = 8;
    for (let i = 0; i < 20; i++) {
      const frac = Math.min(1, Math.max(0, cigs - i));
      const isLit = frac > 0;
      const sx = leftX + i * (stickW + gap);
      ctx.save();
      ctx.globalAlpha = isLit ? 1 : 0.2;
      ctx.fillStyle = isLit ? '#F97316' : '#57534E';
      ctx.fillRect(sx, barY, stickW, 8);
      ctx.fillStyle = '#C2813A';
      ctx.fillRect(sx, barY + 8, stickW, 18);
      ctx.fillStyle = '#EAE4D7';
      ctx.fillRect(sx, barY + 26, stickW, 48);
      ctx.restore();
    }

    ctx.fillStyle = '#F59E0B';
    ctx.font = '600 22px "JetBrains Mono", monospace';
    fitText(
      `Check your city at airn-t.vercel.app/?city=${cityData.city}`,
      leftX,
      H - pad - 28
    );
  }
}

export async function renderShareCardBlob(
  options: ShareCardOptions
): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  drawShareCardToCanvas(canvas, options);
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(null);
      return;
    }
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

/**
 * Outcome of a share attempt, reported truthfully so the UI never claims a share or copy
 * that did not happen.
 */
export type ShareOutcome =
  | 'shared'
  | 'cancelled'
  | 'downloaded-and-copied'
  | 'downloaded'
  | 'copied'
  | 'failed';

async function tryCopy(text: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareOrDownloadCard(
  options: ShareCardOptions
): Promise<ShareOutcome> {
  const { cityData, economics } = options;
  const shareUrl = buildCityShareUrl(cityData.city);
  const cigs = economics.effectiveCigsPerDay.toFixed(1);
  const shareTitle = `airn’t — ${cityData.city}: ${cigs} cigarettes/day`;
  const shareText = `My air in ${cityData.city} already smokes ${cigs} cigarettes a day (24h PM2.5: ${cityData.pm25.toFixed(
    1
  )} µg/m³, AQI ${economics.usAqi}). Check yours:`;

  const blob = await renderShareCardBlob(options);
  const fileName = `airnt-${cityData.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cigs}cigs.png`;

  if (blob && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          files: [file],
        });
        return 'shared';
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to download
    }
  }

  if (blob && typeof document !== 'undefined') {
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    return (await tryCopy(`${shareText} ${shareUrl}`)) ? 'downloaded-and-copied' : 'downloaded';
  }

  return (await tryCopy(`${shareText} ${shareUrl}`)) ? 'copied' : 'failed';
}
