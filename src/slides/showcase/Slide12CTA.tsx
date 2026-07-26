import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { ArrowRight } from 'lucide-react';

export default function Slide12CTA() {
  return (
    <DarkSlide bloom="full" pager="12 / 12">
      <div className="flex flex-col justify-center items-center h-full px-24 text-center">
        <p className="text-white/50 text-xl uppercase tracking-[0.3em] mb-10 font-medium">
          Your turn
        </p>
        <h1 className="text-8xl font-semibold tracking-tight leading-[1.02] mb-8 max-w-5xl">
          What will you say
          <br />
          <span style={{
            backgroundImage: 'linear-gradient(90deg,#4E93FF,#E91E90,#FF6A3D)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>when the room is yours?</span>
        </h1>
        <p className="text-2xl text-white/65 font-light max-w-3xl mb-14">
          Type a prompt. Drop a brief. Ship a deck before lunch.
        </p>
        <button
          className="group inline-flex items-center gap-4 px-10 py-5 rounded-full text-2xl font-semibold text-white"
          style={{ background: 'linear-gradient(90deg, #4E93FF 0%, #E91E90 50%, #FF6A3D 100%)' }}
        >
          Start your deck
          <ArrowRight className="w-6 h-6" />
        </button>
        <p className="text-base text-white/40 mt-10 font-mono uppercase tracking-widest">
          lovable.dev / slides
        </p>
      </div>
    </DarkSlide>
  );
}
