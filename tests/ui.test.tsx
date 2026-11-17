// @vitest-environment jsdom
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCitySearch } from '../src/hooks/useCitySearch';
import { Dialog } from '../src/components/Dialog';
import { AnimatedCigarettePack } from '../src/components/AnimatedCigarettePack';
import { getAqiSeverity } from '../src/lib/economics';
import {
  searchCitiesWorldwide,
  computeTrailing24hMeanPm25,
  getLocalIsoDateAndHour,
  getPackPriceForCountry,
} from '../src/lib/aqiService';
import { buildCityShareUrl } from '../src/lib/shareCard';
vi.mock('../src/lib/aqiService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/aqiService')>();
  return {
    ...actual,
    searchCitiesWorldwide: vi.fn(),
  };
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
beforeEach(() => { vi.useFakeTimers(); vi.mocked(searchCitiesWorldwide).mockReset(); });
const city = (name: string) => ({ id: 1, name, latitude: 0, longitude: 0, country: 'Test', country_code: 'TT', admin1: '' });

describe('city search', () => {
  it('debounces input and ignores an older response arriving last', async () => {
    let resolveOld!: (value: ReturnType<typeof city>[]) => void;
    vi.mocked(searchCitiesWorldwide).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce([city('Paris')]);
    const { result } = renderHook(useCitySearch);
    act(() => result.current.change('Lo'));
    act(() => result.current.change('London'));
    await act(async () => { vi.advanceTimersByTime(250); });
    expect(searchCitiesWorldwide).toHaveBeenCalledTimes(1);
    act(() => result.current.change('Paris'));
    await act(async () => { vi.advanceTimersByTime(250); });
    await act(async () => { resolveOld([city('London')]); });
    expect(result.current.results[0].name).toBe('Paris');
    expect(result.current.loading).toBe(false);
  });
  it('clearing input cancels pending results and loading', async () => {
    let resolve!: (value: ReturnType<typeof city>[]) => void;
    vi.mocked(searchCitiesWorldwide).mockImplementation(() => new Promise(r => { resolve = r; }));
    const { result } = renderHook(useCitySearch);
    act(() => result.current.change('London'));
    await act(async () => { vi.advanceTimersByTime(250); });
    act(() => result.current.change(''));
    await act(async () => { resolve([city('London')]); });
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.message).toBe('');
  });
  it('distinguishes empty results from a failure and recovers', async () => {
    vi.mocked(searchCitiesWorldwide).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([city('Paris')]);
    const { result } = renderHook(useCitySearch);
    act(() => result.current.change('Unknown'));
    await act(async () => { vi.advanceTimersByTime(250); });
    expect(result.current.message).toContain('No cities');
    act(() => result.current.change('Offline'));
    await act(async () => { vi.advanceTimersByTime(250); });
    expect(result.current.message).toContain('failed');
    expect(result.current.loading).toBe(false);
    act(() => result.current.change('Paris'));
    await act(async () => { vi.advanceTimersByTime(250); });
    expect(result.current.message).toBe('');
    expect(result.current.results).toHaveLength(1);
  });
});

describe('dialog', () => {
  it('contains keyboard focus, retains exit content, then restores focus and scrolling', () => {
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open</button><Dialog open={open} onClose={() => setOpen(false)} label="Settings"><button>First</button><button>Last</button></Dialog></>;
    }
    render(<Harness />);
    const trigger = screen.getByText('Open'); trigger.focus(); fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByText('First'));
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(180); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe('');
  });
  it('dismisses only for a backdrop click', () => {
    const close = vi.fn(); render(<Dialog open onClose={close} label="Receipt"><button>Inside</button></Dialog>);
    fireEvent.click(screen.getByText('Inside')); expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog').parentElement!); expect(close).toHaveBeenCalledOnce();
  });
});

describe('pack quantities', () => {
  it.each([0, 0.01, 0.5, 19.9, 25])('keeps 20 slots and the correct total at %s cigarettes', (value) => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    const { container } = render(<AnimatedCigarettePack cityName="A very long city name" cigsPerDay={value} usAqi={100} pm25={22} severity={getAqiSeverity(100)} showMarginalCigPreview={false} onToggleMarginalPreview={() => {}} weberRelativeIncreasePct={10} />);
    expect(container.querySelectorAll('.pack-stick')).toHaveLength(20);
    expect(screen.getByText(value.toFixed(1), {selector: 'span.text-6xl'})).toBeTruthy();
  });
});


describe('physical pack preview', () => {
  it('keeps the extra cigarette out of keyboard navigation until selected, including rapid reversals', () => {
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const props = { cityName: 'New Delhi', cigsPerDay: 2.5, usAqi: 100, pm25: 22, severity: getAqiSeverity(100), onToggleMarginalPreview: vi.fn(), weberRelativeIncreasePct: 40 };
    const { rerender } = render(<AnimatedCigarettePack {...props} showMarginalCigPreview={false} />);
    const extra = screen.getByLabelText('Remove extra cigarette preview', { selector: 'button' }) as HTMLButtonElement;
    expect(extra.disabled).toBe(true);
    expect(extra.tabIndex).toBe(-1);
    expect(screen.getByLabelText('Replay pack opening animation').hasAttribute('disabled')).toBe(true);
    rerender(<AnimatedCigarettePack {...props} showMarginalCigPreview />);
    expect(extra.disabled).toBe(false);
    expect(extra.style.visibility).toBe('inherit');
    fireEvent.click(extra);
    expect(props.onToggleMarginalPreview).toHaveBeenCalledOnce();
    rerender(<AnimatedCigarettePack {...props} showMarginalCigPreview={false} />);
    rerender(<AnimatedCigarettePack {...props} showMarginalCigPreview />);
    rerender(<AnimatedCigarettePack {...props} showMarginalCigPreview={false} />);
    expect(extra.disabled).toBe(true);
    expect(extra.style.visibility).toBe('hidden');
    vi.unstubAllGlobals();
  });
});

describe('24h mean PM2.5, local timezone & share helpers', () => {
  it('computes trailing 24h mean PM2.5 up to the current local hour', () => {
    const times = Array.from({ length: 30 }, (_, i) => {
      const h = String(i % 24).padStart(2, '0');
      const day = i < 24 ? '2026-11-17' : '2026-11-18';
      return `${day}T${h}:00`;
    });
    // First 6 hours = 100, next 24 hours = 44
    const pms = times.map((_, i) => (i < 6 ? 100 : 44));
    const mean = computeTrailing24hMeanPm25(times, pms, '2026-11-18T05:00');
    expect(mean).toBe(44.0);
  });

  it('computes local todayIso accurately across positive and negative UTC offsets', () => {
    // 2026-11-17T22:30:00Z is already 2026-11-18T04:00 in India (+5:30 = +19800s)
    const utcMs = Date.parse('2026-11-17T22:30:00Z');
    const india = getLocalIsoDateAndHour(19800, utcMs);
    expect(india.todayIso).toBe('2026-11-18');
    expect(india.currentHourIso).toBe('2026-11-18T04:00');

    // At 2026-11-18T03:00:00Z, New York (UTC-5 = -18000s) is still 2026-11-17T22:00
    const nyMs = Date.parse('2026-11-18T03:00:00Z');
    const ny = getLocalIsoDateAndHour(-18000, nyMs);
    expect(ny.todayIso).toBe('2026-11-17');
    expect(ny.currentHourIso).toBe('2026-11-17T22:00');
  });

  it('resolves country pack prices and builds encoded city deep-link URLs', () => {
    expect(getPackPriceForCountry('IN')).toBe(4.2);
    expect(getPackPriceForCountry('GB')).toBe(19.8);
    expect(buildCityShareUrl('New Delhi')).toContain('?city=New+Delhi');
  });
});
