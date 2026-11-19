import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useAmbientMotion } from '../hooks/useAmbientMotion';
import { useMotionPause } from '../hooks/useMotionPause';
import { AqiSeverity } from '../lib/economics';
import './cigarette-pack.css';

interface AnimatedCigarettePackProps {
  cityName: string;
  countryName?: string;
  cigsPerDay: number;
  usAqi: number;
  pm25: number;
  severity: AqiSeverity;
  showMarginalCigPreview: boolean;
  onToggleMarginalPreview: () => void;
  weberRelativeIncreasePct: number;
}

/** Physical pack geometry is decorative; the printed total remains the source of truth. */
export const AnimatedCigarettePack: React.FC<AnimatedCigarettePackProps> = ({
  cityName, cigsPerDay, usAqi, pm25, severity,
  showMarginalCigPreview, onToggleMarginalPreview, weberRelativeIncreasePct,
}) => {
  const root = useAmbientMotion<HTMLDivElement>();
  const rig = useRef<HTMLDivElement>(null);
  const extra = useRef<HTMLButtonElement>(null);
  const extraMotion = useRef<gsap.core.Timeline | null>(null);
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true);
  const [replay, setReplay] = useState(0);
  const [motionPaused, toggleMotionPaused] = useMotionPause();
  const amount = Math.min(20, Math.max(0, cigsPerDay));
  const slots = Array.from({ length: 20 }, (_, index) => ({
    number: index + 1,
    fraction: Math.min(1, Math.max(0, amount - index)),
  }));

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useLayoutEffect(() => {
    if (!root.current) return;
    if (reduced) {
      gsap.killTweensOf(rig.current);
      gsap.set(rig.current, { rotationX: 0, rotationY: 0 });
      return;
    }
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      const raisedSticks = root.current?.querySelectorAll('.carton-cigarette[data-active="true"] .carton-cylinder');
      timeline
        // Keep the whole interior (including an already-pulled +1) behind
        // the closed cap until its lower edge has swung above the hinge.
        .set('.carton-lid-mount', { zIndex: 6 }, 0)
        .set('.carton-neck', { opacity: 0 }, 0)
        .set('.carton-neck', { opacity: 1 }, .57)
        .set('.carton-tray', { opacity: 0, pointerEvents: 'none' }, 0)
        .fromTo('.carton-lid', { rotationX: 0 },
          { rotationX: 166, duration: .70, ease: 'power2.inOut' }, .20)
        .set('.carton-lid-mount', { zIndex: 1 }, .57)
        .fromTo('.carton-tray', { y: 42 }, {
          y: 0, opacity: 1, duration: .34, ease: 'power2.out',
        }, .57)
        .set('.carton-tray', { pointerEvents: 'auto' }, .91)
        .to('.carton-lid', { rotationX: 160, duration: .18 }, .90);
      if (raisedSticks?.length) timeline
        .fromTo(raisedSticks,
          { y: 64, opacity: 0 },
          { y: -4, opacity: 1, duration: .46, stagger: .017 }, .65)
        .to(raisedSticks,
          { y: 0, duration: .22, stagger: .017 }, 1.11);
    }, root);
    return () => context.revert();
  }, [reduced, replay, root]);

  useLayoutEffect(() => {
    const sticks = root.current?.querySelectorAll<HTMLElement>('.carton-cigarette');
    if (!sticks) return;
    const tween = gsap.to(sticks, {
      y: (_, target: HTMLElement) => Number(target.dataset.offset),
      opacity: (_, target: HTMLElement) => target.dataset.active === 'true' ? 1 : .4,
      duration: reduced ? 0 : .55, stagger: reduced ? 0 : .012,
      ease: 'power3.out', overwrite: true,
    });
    return () => { tween.kill(); };
  }, [amount, reduced, root]);

  useLayoutEffect(() => {
    const button = extra.current;
    if (!button) return;
    const tag = button.querySelector('.carton-extra-tag');
    const context = gsap.context(() => {
      extraMotion.current = gsap.timeline({ paused: true })
        .fromTo(button, { y: 88, rotation: 0, autoAlpha: 0 },
          { y: -13, autoAlpha: 1, duration: .32, ease: 'power2.out' }, 0)
        .to(button, { y: -41, rotation: 12, duration: .34, ease: 'power3.out' }, .23)
        .to(button, { y: -36, rotation: 10, duration: .2, ease: 'power2.out' }, .57)
        .fromTo(tag, { opacity: 0, y: 5 },
          { opacity: 1, y: 0, duration: .22, ease: 'power2.out' }, .42);
    }, button);
    return () => { context.revert(); extraMotion.current = null; };
  }, []);

  useLayoutEffect(() => {
    const motion = extraMotion.current;
    if (!motion) return;
    if (reduced) motion.progress(showMarginalCigPreview ? 1 : 0).pause();
    else if (showMarginalCigPreview) motion.timeScale(1).play();
    else motion.timeScale(1.65).reverse();
  }, [showMarginalCigPreview, reduced]);

  useEffect(() => {
    const element = rig.current;
    return () => { if (element) gsap.killTweensOf(element); };
  }, []);
  const tilt = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    gsap.to(rig.current, {
      rotationY: ((event.clientX - bounds.left) / bounds.width - .5) * 9,
      rotationX: -((event.clientY - bounds.top) / bounds.height - .5) * 5,
      duration: .5, ease: 'power2.out', overwrite: true,
    });
  };
  const resetTilt = () => {
    gsap.to(rig.current, { rotationY: 0, rotationX: 0, duration: reduced ? 0 : .65, overwrite: true });
  };

  const lastActiveSlot = Math.ceil(amount);
  const smoke = <span className="carton-tip-smoke"><i /><i /></span>;
  const renderRow = (row: typeof slots, back = false) => (
    <div className={`carton-row ${back ? 'carton-row-back' : 'carton-row-front'}`} aria-hidden="true">
      {row.map(slot => (
        <div className="carton-slot" key={slot.number}>
          <div className="pack-stick carton-cigarette" data-active={slot.fraction > 0}
            data-offset={slot.fraction > 0 ? 28 * (1 - slot.fraction) : 72}>
            <div className="carton-cylinder">
              <span className={`cigarette-end ${slot.fraction > 0 ? 'cigarette-lit' : ''}`} />
              <span className="cigarette-paper" />
              <span className="cigarette-cork" />
              {amount > .05 && slot.number >= lastActiveSlot - 1 && slot.number <= lastActiveSlot && smoke}
              {slot.fraction > 0 && slot.fraction < 1 &&
                <span className="carton-fraction">{slot.fraction < .1 ? slot.fraction.toFixed(2) : slot.fraction.toFixed(1)}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={root} className="pack-art physical-pack" style={{ '--pack-accent': severity.colorHex } as React.CSSProperties}>
      <div className="carton-stage" onPointerMove={tilt} onPointerLeave={resetTilt}>
        <div className="carton-ground" aria-hidden="true" />
        <div className="carton-arrival">
          <div ref={rig} className="carton-rig">
            <div className="carton-lid-mount" aria-hidden="true">
              <div className="carton-lid">
                <div className="carton-lid-outer" />
                <div className="carton-lid-side" />
                <div className="carton-lid-inner"><span translate="no">airn’t</span></div>
              </div>
            </div>
            <div className="carton-cavity" aria-hidden="true" />
            <div className="carton-tray">
              {renderRow(slots.slice(10), true)}
              {renderRow(slots.slice(0, 10))}
              <div className="carton-foil" aria-hidden="true" />
              <button ref={extra} type="button" className="carton-extra" onClick={onToggleMarginalPreview}
                aria-label="Remove extra cigarette preview" aria-hidden={!showMarginalCigPreview}
                disabled={!showMarginalCigPreview} tabIndex={showMarginalCigPreview ? 0 : -1}>
                <span className="carton-extra-tag">+1 REAL · +{weberRelativeIncreasePct > 999 ? '>999' : weberRelativeIncreasePct.toFixed(0)}%</span>
                <span className="extra-cylinder"><span className="cigarette-end cigarette-lit" /><span className="cigarette-paper" /><span className="cigarette-cork" />{showMarginalCigPreview && smoke}</span>
              </button>
            </div>
            <div className="carton-side" aria-hidden="true"><span translate="no">airn’t · ATMOSPHERIC EDITION</span><div className="carton-barcode" /><small>20 / PM2.5</small></div>
            <div className="carton-face">
              <div className="carton-neck" aria-hidden="true" />
              <div className="carton-brand"><span translate="no">airn’t</span><small>{cityName}</small></div>
              <div className="carton-gold-rule" />
              <div className="carton-reading">
                <div className="carton-telemetry font-mono-code"><span className="carton-aqi"><i aria-hidden="true" style={{background: severity.colorHex}} />AQI {usAqi} · {severity.tier.split(' // ')[0]}</span><span>24h PM2.5 · {pm25.toFixed(1)} µg/m³</span></div>
                <div className="carton-total"><span className="text-6xl font-mono-code">{cigsPerDay.toFixed(1)}</span>{showMarginalCigPreview && <span className="carton-plus">+1</span>}</div>
                <div className="carton-dose-label">Passive Cigarettes Today</div>
                <p className="carton-frequency">{cigsPerDay >= .05 ? <>Inhaling <strong>1 cigarette</strong> every <strong>{(24 / cigsPerDay).toFixed(1)} hours</strong> in {cityName}</> : <>Virtually zero passive cigarettes today in {cityName}</>}</p>
                {cigsPerDay > 20 && <p className="carton-overflow">{(cigsPerDay / 20).toFixed(2)} FULL PACKS / DAY</p>}
              </div>
              <div className="carton-warning">
                <div><strong>ATMOSPHERIC TAX WARNING</strong><span>22 µg/m³ = 1 CIG</span></div>
                <p>Breathing {cityName}’s air forces your lungs to smoke <span className="underline">{(cigsPerDay * 7).toFixed(1)} cigarettes/week</span> ({((cigsPerDay * 365) / 20).toFixed(1)} packs/yr) with zero nicotine payoff.</p>
              </div>
              <div className="carton-bottom-seam" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
      <div className="carton-controls">
        <button type="button" className="carton-replay" onClick={() => setReplay(value => value + 1)} disabled={reduced}><RotateCcw size={13} aria-hidden="true" />Replay Opening</button>
        <button type="button" className="carton-replay" onClick={toggleMotionPaused} aria-pressed={motionPaused} disabled={reduced}>
          {motionPaused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          {motionPaused ? 'Resume Smoke' : 'Pause Smoke'}
        </button>
      </div>
    </div>
  );
};
