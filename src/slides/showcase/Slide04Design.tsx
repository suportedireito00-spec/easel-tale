import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { ArrowRight } from 'lucide-react';

export default function Slide04Design() {
  return (
    <DarkSlide bloom="corner" pager="04 / 12">
      <div className="flex flex-col h-full px-24 py-24">
        <div className="mb-12">
          <p className="text-xl uppercase tracking-[0.3em] mb-6 font-medium" style={{ color: '#E91E90' }}>
            Promise 01 — Instant sleek design
          </p>
          <h2 className="text-6xl font-semibold tracking-tight max-w-4xl leading-[1.05]">
            From a single prompt to a presentation-ready slide.
          </h2>
        </div>
        <div className="flex-1 grid grid-cols-[1fr_auto_1.4fr] gap-10 items-center">
          {/* Prompt */}
          <div className="rounded-2xl p-8 border border-white/10 bg-white/[0.03] h-full flex flex-col">
            <p className="text-white/40 text-base uppercase tracking-wider mb-4">Your prompt</p>
            <p className="text-2xl text-white/90 leading-relaxed font-light italic">
              "Build a 10-slide pitch for our Series B —
              <br />
              focus on traction, market expansion, and the team."
            </p>
            <div className="mt-auto pt-8 border-t border-white/10">
              <p className="text-white/40 text-base">Or drop a Notion doc, PDF, or brief.</p>
            </div>
          </div>

          <ArrowRight className="w-10 h-10 text-white/30" />

          {/* Output preview */}
          <div className="rounded-2xl p-8 border border-white/10 h-full relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4E93FF15 0%, #E91E9015 50%, #FF6A3D15 100%)' }}>
            <div className="absolute inset-0 opacity-30 blur-2xl"
              style={{ background: 'radial-gradient(circle at 70% 30%, #E91E90, transparent 50%)' }} />
            <div className="relative">
              <p className="text-white/50 text-base uppercase tracking-wider mb-4">Output — 12 seconds later</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="aspect-video rounded-md border border-white/15 bg-white/5 p-2">
                    <div className="h-2 bg-white/30 rounded-full mb-1.5 w-3/4" />
                    <div className="h-1.5 bg-white/15 rounded-full mb-1 w-1/2" />
                    <div className="h-1.5 bg-white/15 rounded-full w-2/3" />
                  </div>
                ))}
              </div>
              <p className="text-3xl font-semibold tracking-tight leading-tight">
                Editorial typography. Cinematic palette. Real content. Zero design debt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DarkSlide>
  );
}
