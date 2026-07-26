import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';

const arc = [
  { n: '01', label: 'Hook',     copy: 'A single statement that earns the room.' },
  { n: '02', label: 'Tension',  copy: 'The problem your audience already feels.' },
  { n: '03', label: 'Insight',  copy: 'The unique thing only you can say.' },
  { n: '04', label: 'Proof',    copy: 'Data, demo, and stories that land.' },
  { n: '05', label: 'Resolve',  copy: 'A clear next step.' },
];

export default function Slide05Structure() {
  return (
    <DarkSlide bloom="corner" pager="05 / 12">
      <div className="flex flex-col h-full px-24 py-24">
        <div className="mb-16">
          <p className="text-xl uppercase tracking-[0.3em] mb-6 font-medium" style={{ color: '#4E93FF' }}>
            Promise 02 — Expert structure
          </p>
          <h2 className="text-6xl font-semibold tracking-tight max-w-5xl leading-[1.05]">
            A narrative arc, not a deck of bullet points.
          </h2>
        </div>

        <div className="flex-1 relative">
          {/* Connecting line */}
          <div className="absolute top-[58px] left-[5%] right-[5%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #4E93FF, #E91E90, #FF6A3D, transparent)' }} />

          <div className="grid grid-cols-5 gap-6 relative">
            {arc.map((step, i) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div
                  className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-white font-semibold text-xl mb-8 relative z-10"
                  style={{
                    background: '#0A0A0F',
                    border: `2px solid ${['#4E93FF','#7B7DFF','#E91E90','#FF4F8B','#FF6A3D'][i]}`,
                  }}
                >
                  {step.n}
                </div>
                <p className="text-2xl font-semibold mb-3 tracking-tight">{step.label}</p>
                <p className="text-lg text-white/55 leading-snug">{step.copy}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 max-w-3xl">
            <p className="text-2xl text-white/70 font-light leading-relaxed">
              Lovable infers your audience, picks the arc, paces the slides, and gives every chart a punchline.
              You bring the story — we make sure it lands.
            </p>
          </div>
        </div>
      </div>
    </DarkSlide>
  );
}
