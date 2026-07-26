import React from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { Sparkles, Compass, Palette, MousePointer2 } from 'lucide-react';

const promises = [
  { icon: Sparkles, title: 'Instant sleek design', body: 'Prompt or drop a brief. A polished deck appears.' },
  { icon: Compass, title: 'Expert structure', body: 'Narrative and visual hierarchy, handled for you.' },
  { icon: Palette, title: 'On-brand by default', body: 'Drop in brand specs — every slide adheres.' },
  { icon: MousePointer2, title: 'Interactive by nature', body: 'Charts, mini-apps, 3D, live elements — built-in.' },
];

export default function Slide03Promise() {
  return (
    <DarkSlide bloom="corner" pager="03 / 12">
      <div className="flex flex-col h-full px-24 py-24">
        <div className="mb-16">
          <p className="text-white/50 text-xl uppercase tracking-[0.3em] mb-6 font-medium">
            The promise
          </p>
          <h2 className="text-6xl font-semibold tracking-tight max-w-4xl leading-[1.05]">
            Four things every deck deserves.
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 flex-1">
          {promises.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="relative rounded-2xl p-10 border border-white/10 bg-white/[0.03] backdrop-blur-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-5 mb-6">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #4E93FF22 0%, #E91E9022 100%)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <Icon className="w-7 h-7" style={{ color: ['#4E93FF', '#E91E90', '#FF6A3D', '#7DD3FC'][i] }} />
                </div>
                <span className="text-white/30 text-2xl font-mono tabular-nums">0{i + 1}</span>
              </div>
              <div>
                <h3 className="text-4xl font-semibold mb-3 tracking-tight">{title}</h3>
                <p className="text-xl text-white/60 leading-snug">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DarkSlide>
  );
}
