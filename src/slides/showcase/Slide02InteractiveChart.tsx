import React, { useState, useMemo } from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot, ResponsiveContainer, ComposedChart, Tooltip } from 'recharts';
import { Slider } from '@/components/ui/slider';

const generateCurveData = (demandShift: number, supplyShift: number) => {
  const points = [];
  const demandA = 120, demandK = 0.025;
  const supplyBase = 15, supplyB = 100, supplyM = 0.03;
  for (let q = 0; q <= 100; q += 1) {
    points.push({
      quantity: q,
      demand: Math.max(0, demandA * Math.exp(-demandK * q) + demandShift),
      supply: Math.max(0, supplyBase + supplyB * (1 - Math.exp(-supplyM * q)) + supplyShift),
    });
  }
  return points;
};

const calculateEquilibrium = (demandShift: number, supplyShift: number) => {
  const demandA = 120, demandK = 0.025;
  const supplyBase = 15, supplyB = 100, supplyM = 0.03;
  let q = 50;
  for (let i = 0; i < 20; i++) {
    const demand = demandA * Math.exp(-demandK * q) + demandShift;
    const supply = supplyBase + supplyB * (1 - Math.exp(-supplyM * q)) + supplyShift;
    const diff = demand - supply;
    if (Math.abs(diff) < 0.01) break;
    const dDiff = -demandA * demandK * Math.exp(-demandK * q) - supplyB * supplyM * Math.exp(-supplyM * q);
    q = Math.max(0, Math.min(100, q - diff / dDiff));
  }
  return {
    quantity: Math.max(0, Math.min(100, q)),
    price: Math.max(0, supplyBase + supplyB * (1 - Math.exp(-supplyM * q)) + supplyShift),
  };
};

export default function Slide02InteractiveChart() {
  const [demandShift, setDemandShift] = useState(0);
  const [supplyShift, setSupplyShift] = useState(0);
  const data = useMemo(() => generateCurveData(demandShift, supplyShift), [demandShift, supplyShift]);
  const eq = useMemo(() => calculateEquilibrium(demandShift, supplyShift), [demandShift, supplyShift]);

  return (
    <DarkSlide bloom="corner" pager="08 / 12">
      <div className="flex flex-col h-full px-24 py-20">
        <div className="mb-8">
          <p className="text-xl uppercase tracking-[0.3em] mb-4 font-medium" style={{ color: '#4E93FF' }}>
            Live · Interactive chart
          </p>
          <h2 className="text-5xl font-semibold tracking-tight leading-tight">
            Drag the sliders. Watch the market move.
          </h2>
        </div>

        <div className="flex-1 grid grid-cols-[2fr_1fr] gap-8 min-h-0">
          {/* Chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="quantity" tick={{ fontSize: 14, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.15)" />
                <YAxis tick={{ fontSize: 14, fill: 'rgba(255,255,255,0.5)' }} stroke="rgba(255,255,255,0.15)" domain={[0, 140]} />
                <Tooltip contentStyle={{ background: '#15151D', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff' }} />
                <Line type="monotone" dataKey="supply"  stroke="#FF6A3D" strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="demand"  stroke="#4E93FF" strokeWidth={3} dot={false} isAnimationActive={false} />
                <ReferenceLine x={eq.quantity} stroke="#E91E90" strokeDasharray="5 5" strokeWidth={2} />
                <ReferenceLine y={eq.price}    stroke="#E91E90" strokeDasharray="5 5" strokeWidth={2} />
                <ReferenceDot x={eq.quantity} y={eq.price} r={9} fill="#E91E90" stroke="#fff" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Controls + readout */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-base text-white/40 uppercase tracking-wider mb-5">Controls</p>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-lg flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: '#4E93FF' }} /> Demand</span>
                    <span className="font-mono text-base text-white/70">{demandShift > 0 ? '+' : ''}{demandShift}</span>
                  </div>
                  <Slider value={[demandShift]} onValueChange={v => setDemandShift(v[0])} min={-40} max={40} step={1} />
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-lg flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: '#FF6A3D' }} /> Supply</span>
                    <span className="font-mono text-base text-white/70">{supplyShift > 0 ? '+' : ''}{supplyShift}</span>
                  </div>
                  <Slider value={[supplyShift]} onValueChange={v => setSupplyShift(v[0])} min={-40} max={40} step={1} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 flex-1 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #E91E9020, #4E93FF20)', border: '1px solid rgba(233,30,144,0.3)' }}>
              <p className="text-base uppercase tracking-wider mb-4" style={{ color: '#E91E90' }}>Equilibrium</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/50 mb-1">Price</p>
                  <p className="text-4xl font-semibold tabular-nums">${eq.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Quantity</p>
                  <p className="text-4xl font-semibold tabular-nums">{eq.quantity.toFixed(1)}</p>
                </div>
              </div>
              <p className="text-base text-white/55 mt-6 leading-relaxed">
                The chart, the math, the styling — all generated by Lovable from a single prompt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DarkSlide>
  );
}
