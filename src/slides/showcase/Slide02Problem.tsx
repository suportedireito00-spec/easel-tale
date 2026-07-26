import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';

export default function Slide02Problem() {
  return (
    <DarkSlide bloom="bottom" pager="02 / 12">
      <div className="flex flex-col justify-center items-center h-full px-24 text-center">
        <p className="text-white/50 text-xl uppercase tracking-[0.3em] mb-10 font-medium">
          The problem
        </p>
        <h2 className="text-7xl font-semibold tracking-tight leading-[1.05] max-w-5xl mb-12">
          You know what to say.
          <br />
          You just don't have
          <br />
          <span className="text-white/40 line-through decoration-[#E91E90] decoration-4">three weeks</span>
          {' '}
          <span style={{ color: '#FF6A3D' }}>to design it.</span>
        </h2>
        <div className="grid grid-cols-3 gap-12 mt-8 max-w-4xl">
          {[
            { label: 'Briefing the agency', value: '2 weeks' },
            { label: 'Designer revisions', value: '4–6 rounds' },
            { label: 'Engineering custom viz', value: 'Never' },
          ].map((item) => (
            <div key={item.label} className="text-left border-l border-white/15 pl-6">
              <p className="text-white/50 text-base uppercase tracking-wider mb-2">{item.label}</p>
              <p className="text-3xl text-white font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </DarkSlide>
  );
}
