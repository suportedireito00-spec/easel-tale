import React, { useState } from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { Check, Zap, Shield, BarChart3, Users, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  { id: 'analytics',     icon: BarChart3, name: 'Live analytics',    adoption: 87 },
  { id: 'automation',    icon: Zap,       name: 'Workflow automation', adoption: 72 },
  { id: 'security',      icon: Shield,    name: 'Enterprise security', adoption: 94 },
  { id: 'collaboration', icon: Users,     name: 'Team collaboration', adoption: 68 },
  { id: 'notifications', icon: Bell,      name: 'Smart notifications', adoption: 45 },
];

export default function Slide03FeatureAdoption() {
  const [selected, setSelected] = useState<string[]>(['analytics', 'security']);
  const toggle = (id: string) =>
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const avg = selected.length === 0 ? 0 :
    Math.round(features.filter(f => selected.includes(f.id)).reduce((s, f) => s + f.adoption, 0) / selected.length);

  return (
    <DarkSlide bloom="corner" pager="09 / 12">
      <div className="flex flex-col h-full px-24 py-20">
        <div className="mb-8">
          <p className="text-xl uppercase tracking-[0.3em] mb-4 font-medium" style={{ color: '#E91E90' }}>
            Live · Calculations on the fly
          </p>
          <h2 className="text-5xl font-semibold tracking-tight leading-tight">
            Click features. Numbers update. No spreadsheets.
          </h2>
        </div>

        <div className="flex-1 grid grid-cols-[2fr_1fr] gap-8 min-h-0">
          <div className="grid grid-cols-2 gap-4 content-start">
            {features.map((f) => {
              const Icon = f.icon;
              const on = selected.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className={cn(
                    'relative p-6 rounded-2xl border text-left transition-colors',
                    on
                      ? 'border-transparent bg-white/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                  style={on ? { boxShadow: 'inset 0 0 0 1px #E91E90' } : {}}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                      on ? 'text-white' : 'bg-white/5 text-white/60')}
                      style={on ? { background: 'linear-gradient(135deg,#E91E90,#4E93FF)' } : {}}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center',
                      on ? 'bg-white text-[#0A0A0F]' : 'border border-white/20')}>
                      {on && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>
                  </div>
                  <p className="text-2xl font-semibold mb-3 tracking-tight">{f.name}</p>
                  <div className="flex items-center justify-between text-base text-white/50 mb-1">
                    <span>Adoption</span>
                    <span className="font-mono text-white/80">{f.adoption}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${f.adoption}%`,
                      background: on ? 'linear-gradient(90deg,#E91E90,#4E93FF)' : 'rgba(255,255,255,0.3)',
                    }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-7 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #4E93FF, #E91E90)' }}>
              <p className="text-white/80 text-base uppercase tracking-wider mb-2">Selected</p>
              <p className="text-7xl font-semibold tabular-nums mb-1">{selected.length}</p>
              <p className="text-white/80 text-lg">of {features.length} capabilities</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 flex-1">
              <p className="text-base text-white/40 uppercase tracking-wider mb-3">Combined adoption</p>
              <div className="flex items-end gap-2 mb-5">
                <span className="text-7xl font-semibold tabular-nums">{avg}</span>
                <span className="text-3xl text-white/40 mb-3">%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-6">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${avg}%`,
                  background: 'linear-gradient(90deg,#4E93FF,#E91E90,#FF6A3D)',
                }} />
              </div>
              <p className="text-base text-white/55 leading-relaxed">
                Every interactive element is real React — not a screenshot, not a mockup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DarkSlide>
  );
}
