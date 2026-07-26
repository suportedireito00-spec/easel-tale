import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';

export default function Slide01Intro() {
  return (
    <DarkSlide bloom="full" pager="01 / 12">
      <div className="flex flex-col justify-center h-full px-24">
        <p className="text-white/60 text-xl uppercase tracking-[0.3em] mb-8 font-medium">
          Lovable Slides
        </p>
        <h1 className="text-8xl font-semibold tracking-tight leading-[1.02] mb-10 max-w-5xl">
          You have the message.
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #4E93FF 0%, #E91E90 50%, #FF6A3D 100%)' }}
          >
            We have the medium.
          </span>
        </h1>
        <p className="text-3xl text-white/70 font-light max-w-3xl leading-snug">
          Cinematic, interactive presentations — prompted into existence in minutes, not weeks.
        </p>
      </div>
    </DarkSlide>
  );
}
