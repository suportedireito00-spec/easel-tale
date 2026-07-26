import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';

export default function Slide11Stat() {
  return (
    <DarkSlide bloom="full" pager="11 / 12">
      <div className="flex flex-col justify-center h-full px-24">
        <p className="text-white/50 text-xl uppercase tracking-[0.3em] mb-10 font-medium">
          The math
        </p>
        <div className="grid grid-cols-3 gap-16">
          {[
            { v: '14 min', l: 'From prompt to first draft', tone: '#4E93FF' },
            { v: '100×',    l: 'Faster than agency rounds',  tone: '#E91E90' },
            { v: '0',       l: 'Designers in the loop',      tone: '#FF6A3D' },
          ].map(s => (
            <div key={s.l}>
              <p
                className="text-[140px] font-semibold tracking-[-0.05em] leading-none mb-6"
                style={{ color: s.tone }}
              >
                {s.v}
              </p>
              <p className="text-2xl text-white/70 font-light leading-snug">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </DarkSlide>
  );
}
