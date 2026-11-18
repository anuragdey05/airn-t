import React from 'react';
import { Dialog } from './Dialog';
import {
  ACTIVITY_LEVELS,
  ActivityLevel,
  EconomicBreakdown,
} from '../lib/economics';
import { X, Sliders, Wind, ShieldCheck, RotateCcw } from 'lucide-react';

interface ExposureBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activePm25: number;
  isManualOverride: boolean;
  onChangeManualPm25: (val: number | null) => void;
  hoursOutdoors: number;
  onChangeHoursOutdoors: (val: number) => void;
  activityLevel: ActivityLevel;
  onChangeActivityLevel: (val: ActivityLevel) => void;
  indoorPurifier: boolean;
  onTogglePurifier: () => void;
  baselineCravingUtility: number;
  onChangeCravingUtility: (val: number) => void;
  economics: EconomicBreakdown;
}

export const ExposureBottomSheet: React.FC<ExposureBottomSheetProps> = ({
  isOpen,
  onClose,
  activePm25,
  isManualOverride,
  onChangeManualPm25,
  hoursOutdoors,
  onChangeHoursOutdoors,
  activityLevel,
  onChangeActivityLevel,
  indoorPurifier,
  onTogglePurifier,
  baselineCravingUtility,
  onChangeCravingUtility,
  economics,
}) => {


  return (
    <Dialog open={isOpen} onClose={onClose} label="Tune exposure and simulate AQI" sheet>
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#13100E] border-t-2 sm:border-2 border-stone-700/90 p-5 sm:p-6 shadow-2xl max-h-[88vh] overflow-y-auto">
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 rounded-full bg-stone-700 mx-auto mb-3 sm:hidden" />

        {/* Header + Live Preview Pill */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold text-stone-100">
              Tune Exposure &amp; Simulate AQI
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close exposure settings"
            className="p-1.5 rounded-xl bg-stone-900 text-stone-400 hover:text-stone-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sticky Live Output Mini-Bar */}
        <div className="p-3 rounded-2xl bg-stone-950 border border-amber-500/30 mb-5 flex items-center justify-between font-mono-code text-xs">
          <div>
            <span className="text-xs text-stone-400 block uppercase">
              Passive Cigarettes
            </span>
            <span className="text-lg font-bold text-amber-300">
              {economics.effectiveCigsPerDay.toFixed(2)} / day
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400 block uppercase">
              Temptation Index
            </span>
            <span className="text-lg font-bold text-rose-400">
              {economics.smokingPropensityPct}%
            </span>
          </div>
        </div>

        <div className="space-y-5">
          {/* 1. Hypothetical AQI / PM2.5 Simulator */}
          <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-mono-code text-stone-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate PM2.5 / AQI:</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono-code text-amber-300 font-bold">
                  {activePm25.toFixed(0)} µg/m³ (AQI {economics.usAqi})
                </span>
                {isManualOverride && (
                  <button
                    type="button"
                    onClick={() => onChangeManualPm25(null)}
                    className="px-2 py-0.5 rounded bg-stone-800 text-xs font-mono-code text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Live</span>
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="350"
              step="1"
              aria-label="Simulated PM2.5 in micrograms per cubic meter"
              value={activePm25}
              onChange={(e) => onChangeManualPm25(parseFloat(e.target.value))}
              className="w-full noir-slider"
            />
            <div className="flex justify-between text-xs font-mono-code text-stone-400 mt-1">
              <span>Clean (5)</span>
              <span>1 Cig (22)</span>
              <span>5 Cigs (110)</span>
              <span>15+ Cigs (350)</span>
            </div>
          </div>

          {/* 2. Hours Outdoors */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-stone-300 font-medium">
                Hours Outdoors per Day
              </span>
              <span className="font-mono-code text-amber-300 font-bold">
                {hoursOutdoors}h out / {24 - hoursOutdoors}h in
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              aria-label="Hours outdoors per day"
              value={hoursOutdoors}
              onChange={(e) => onChangeHoursOutdoors(parseFloat(e.target.value))}
              className="w-full noir-slider"
            />
          </div>

          {/* 3. Exertion / Activity Level */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-stone-300 font-medium">
                Outdoor Activity Level (Breathing Rate)
              </span>
              <span className="font-mono-code text-amber-300">
                {ACTIVITY_LEVELS[activityLevel].ventilationMultiplier}x intake
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
                    aria-pressed={active}
                    onClick={() => onChangeActivityLevel(lvl)}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                        : 'bg-stone-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center justify-between">
                      <span>{meta.label}</span>
                      <span className="font-mono-code text-xs text-amber-400">
                        {meta.ventilationMultiplier}x
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Indoor HEPA Air Purifier */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-950 border border-stone-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${
                  indoorPurifier ? 'text-emerald-400' : 'text-stone-400'
                }`}
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-stone-200">
                  Indoor Air Purifier (HEPA)
                </div>
                <div className="text-xs text-stone-400">
                  Cuts indoor PM2.5 infiltration from 55% to 15%
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={indoorPurifier}
              aria-label="Indoor HEPA air purifier"
              onClick={onTogglePurifier}
              className={`px-3 py-1 rounded-lg text-xs font-mono-code font-semibold border transition-colors cursor-pointer shrink-0 ${
                indoorPurifier
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-stone-900 text-stone-400 border-stone-700'
              }`}
            >
              {indoorPurifier ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 5. Personal Craving / Hedonic Desire */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-stone-300 font-medium">
                Your Nicotine Craving / Desire for a Cigarette
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
              aria-label="Nicotine craving"
              value={baselineCravingUtility}
              onChange={(e) => onChangeCravingUtility(parseInt(e.target.value, 10))}
              className="w-full noir-slider"
            />
            <div className="flex justify-between text-xs font-mono-code text-stone-400 mt-1">
              <span>Non-Smoker (5)</span>
              <span>Curious / Social (50)</span>
              <span>Strong Craving (95)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono-code font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Done — View Updated Pack
          </button>
        </div>
      </div>
    </Dialog>
  );
};
