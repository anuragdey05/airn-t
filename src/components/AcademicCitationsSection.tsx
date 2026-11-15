import React, { useState } from 'react';
import { ACADEMIC_CITATIONS } from '../lib/economics';
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export const AcademicCitationsSection: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('pope-2009');

  return (
    <div className="rounded-2xl border border-stone-800/90 bg-[#12100E]/95 p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code uppercase tracking-widest text-amber-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Peer-Reviewed Literature &amp; Econometric Foundations</span>
          </div>
          <h3 className="text-xl font-serif-editorial text-stone-100 mt-0.5">
            Research Papers Backing the AQI-to-Cigarette &amp; Marginal Utility Engine
          </h3>
        </div>
        <span className="text-xs font-mono-code text-stone-400">
          4 Foundational Papers
        </span>
      </div>

      <div className="space-y-3">
        {ACADEMIC_CITATIONS.map((paper) => {
          const isOpen = expandedId === paper.id;
          return (
            <div
              key={paper.id}
              className="rounded-xl border border-stone-800/90 bg-stone-950/70 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : paper.id)}
                className="w-full text-left px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-stone-900/50 transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {paper.year}
                    </span>
                    <span className="text-sm font-semibold text-stone-100">
                      {paper.shortTitle}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {paper.authors} — <span className="italic text-stone-300">{paper.journal}</span>
                  </div>
                </div>
                <div className="text-stone-400 shrink-0">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-stone-900 bg-stone-950/90 text-xs space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800 font-mono-code text-amber-200">
                    <span className="text-stone-400 uppercase mr-2">Core Equation:</span>
                    {paper.formulaSummary}
                  </div>
                  <p className="text-stone-300 leading-relaxed">
                    <strong className="text-stone-100">How We Use It: </strong>
                    {paper.applicationInApp}
                  </p>
                  <div className="pt-1">
                    <a
                      href={paper.doiOrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono-code text-amber-400 hover:text-amber-300 underline underline-offset-4"
                    >
                      <span>View Source / DOI Reference</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
