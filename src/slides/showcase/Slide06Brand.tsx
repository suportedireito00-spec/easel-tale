import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';

export default function Slide06Brand() {
  return (
    <DarkSlide bloom="corner" pager="06 / 12">
      <div className="flex flex-col h-full px-24 py-24">
        <div className="mb-12">
          <p className="text-xl uppercase tracking-[0.3em] mb-6 font-medium" style={{ color: '#FF6A3D' }}>
            Promise 03 — Brand adherence
          </p>
          <h2 className="text-6xl font-semibold tracking-tight max-w-5xl leading-[1.05]">
            Drop in your brand. Every slide obeys.
          </h2>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-10">
          {/* Input — brand specs */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 flex flex-col">
            <p className="text-white/40 text-base uppercase tracking-wider mb-6">You upload</p>
            <ul className="space-y-4 text-xl text-white/85">
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white/40" /> Brand guidelines PDF</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white/40" /> Logo SVG &amp; wordmark</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white/40" /> Color tokens &amp; typography</li>
              <li className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-white/40" /> Voice &amp; tone notes</li>
            </ul>
            <div className="mt-auto pt-8 border-t border-white/10">
              <p className="text-white/40 text-base">No design system? We'll generate one for you.</p>
            </div>
          </div>

          {/* Output — three brand swatch cards */}
          <div className="grid grid-rows-3 gap-4">
            {[
              { name: 'Acme Finance',  colors: ['#0F1B3D','#1E3A5F','#C9A84C'], font: 'Libre Baskerville' },
              { name: 'Lumen Health',  colors: ['#F5F0E8','#A8C0A0','#7D9B76'], font: 'Outfit · Figtree' },
              { name: 'Orbit Studios', colors: ['#0A0A0F','#E91E90','#4E93FF'], font: 'Space Grotesk · Inter' },
            ].map((b) => (
              <div key={b.name} className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-5 flex items-center gap-6">
                <div className="flex gap-1.5">
                  {b.colors.map(c => (
                    <div key={c} className="w-10 h-10 rounded-md border border-white/15" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-semibold tracking-tight">{b.name}</p>
                  <p className="text-base text-white/50">{b.font}</p>
                </div>
                <span className="text-white/40 text-base uppercase tracking-wider">On-brand</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DarkSlide>
  );
}
