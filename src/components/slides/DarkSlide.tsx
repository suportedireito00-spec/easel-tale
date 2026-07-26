import React from 'react';
import { cn } from '@/lib/utils';

interface DarkSlideProps {
  children: React.ReactNode;
  className?: string;
  bloom?: 'none' | 'corner' | 'full' | 'bottom';
  pager?: string;
}

/**
 * Dark cinematic slide surface for the Lovable Slides pitch deck.
 * Near-black background with soft magenta→blue→coral gradient blooms.
 */
export function DarkSlide({ children, className, bloom = 'corner', pager }: DarkSlideProps) {
  return (
    <div className={cn(
      'w-full h-full relative font-sans slide-content overflow-hidden',
      'bg-[#0A0A0F] text-white',
      className
    )}>
      {/* Gradient blooms */}
      {bloom === 'full' && (
        <>
          <div className="absolute -top-40 -left-40 w-[900px] h-[900px] rounded-full opacity-50 blur-[140px]"
            style={{ background: 'radial-gradient(circle, #4E93FF 0%, transparent 70%)' }} />
          <div className="absolute top-1/3 left-1/3 w-[1100px] h-[1100px] rounded-full opacity-45 blur-[160px]"
            style={{ background: 'radial-gradient(circle, #E91E90 0%, transparent 70%)' }} />
          <div className="absolute -bottom-40 -right-40 w-[900px] h-[900px] rounded-full opacity-50 blur-[140px]"
            style={{ background: 'radial-gradient(circle, #FF6A3D 0%, transparent 70%)' }} />
        </>
      )}
      {bloom === 'corner' && (
        <>
          <div className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full opacity-30 blur-[140px]"
            style={{ background: 'radial-gradient(circle, #E91E90 0%, transparent 70%)' }} />
          <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full opacity-25 blur-[140px]"
            style={{ background: 'radial-gradient(circle, #4E93FF 0%, transparent 70%)' }} />
        </>
      )}
      {bloom === 'bottom' && (
        <div className="absolute -bottom-80 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] rounded-full opacity-40 blur-[160px]"
          style={{ background: 'radial-gradient(circle, #E91E90 0%, #4E93FF 50%, transparent 80%)' }} />
      )}

      {/* Subtle grain via noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>

      {/* Brand mark — bottom left */}
      <div className="absolute bottom-8 left-12 z-20 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md"
          style={{ background: 'linear-gradient(135deg, #4E93FF 0%, #E91E90 50%, #FF6A3D 100%)' }}
        />
        <span className="text-white/80 text-xl font-medium tracking-tight">Lovable Slides</span>
      </div>

      {/* Pager */}
      {pager && (
        <div className="absolute bottom-8 right-12 z-20 text-white/40 text-lg font-mono tabular-nums">
          {pager}
        </div>
      )}
    </div>
  );
}
