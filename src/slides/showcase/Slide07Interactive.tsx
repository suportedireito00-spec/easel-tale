import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { LineChart, MousePointer2, Box, Calendar, Camera, Gamepad2 } from 'lucide-react';

const types = [
  { icon: LineChart,     label: 'Live charts',         tone: '#4E93FF' },
  { icon: Box,           label: '3D stage elements',   tone: '#E91E90' },
  { icon: Calendar,      label: 'Booking & forms',     tone: '#FF6A3D' },
  { icon: Camera,        label: 'Camera plots',        tone: '#7DD3FC' },
  { icon: Gamepad2,      label: 'Mini-games',          tone: '#FFD166' },
  { icon: MousePointer2, label: 'Configurators',       tone: '#A78BFA' },
];

export default function Slide07Interactive() {
  return (
    <DarkSlide bloom="bottom" pager="07 / 12">
      <div className="flex flex-col h-full px-24 py-24">
        <p className="text-xl uppercase tracking-[0.3em] mb-6 font-medium" style={{ color: '#A78BFA' }}>
          Promise 04 — Interactive by nature
        </p>
        <h2 className="text-7xl font-semibold tracking-tight max-w-5xl leading-[1.02] mb-6">
          Slides that <em className="not-italic" style={{
            backgroundImage: 'linear-gradient(90deg,#4E93FF,#E91E90,#FF6A3D)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>do something</em>.
        </h2>
        <p className="text-2xl text-white/65 max-w-3xl font-light mb-12">
          Real components. Real state. Real interaction — right inside the deck.
        </p>

        <div className="grid grid-cols-3 gap-5 flex-1">
          {types.map(({ icon: Icon, label, tone }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col justify-between"
            >
              <Icon className="w-10 h-10" style={{ color: tone }} />
              <p className="text-3xl font-semibold tracking-tight mt-6">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-lg text-white/40 mt-10">→ The next four slides are live. Click anything.</p>
      </div>
    </DarkSlide>
  );
}
