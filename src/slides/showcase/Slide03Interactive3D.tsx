import React, { useRef } from 'react';
import { DarkSlide } from '@/components/slides/DarkSlide';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Float, MeshDistortMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedTorus() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(state => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.005;
    }
  });
  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.35, 128, 32]} />
      <MeshDistortMaterial color="#E91E90" roughness={0.2} metalness={0.85} distort={0.25} speed={2} />
    </mesh>
  );
}

function FloatingCubes() {
  const colors = ['#4E93FF', '#E91E90', '#FF6A3D', '#7DD3FC'];
  return (
    <>
      {colors.map((color, i) => {
        const angle = (i / colors.length) * Math.PI * 2;
        const radius = 2.6;
        return (
          <Float key={i} speed={2} rotationIntensity={1} floatIntensity={2}
            position={[Math.cos(angle) * radius, Math.sin(i * 0.5) * 0.6, Math.sin(angle) * radius]}>
            <RoundedBox args={[0.45, 0.45, 0.45]} radius={0.08} smoothness={4}>
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
            </RoundedBox>
          </Float>
        );
      })}
    </>
  );
}

export default function Slide03Interactive3D() {
  return (
    <DarkSlide bloom="full" pager="10 / 12">
      <div className="absolute top-20 left-24 z-10 max-w-xl">
        <p className="text-xl uppercase tracking-[0.3em] mb-4 font-medium" style={{ color: '#FF6A3D' }}>
          Live · 3D stage element
        </p>
        <h2 className="text-5xl font-semibold tracking-tight leading-tight">
          Real geometry. Real lighting. Right inside the slide.
        </h2>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto" style={{ width: 900, height: 700 }}>
          <Canvas
            camera={{ position: [0, 0, 6], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            dpr={1}
            style={{ background: 'transparent' }}
            resize={{ scroll: false, offsetSize: true }}
          >
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4E93FF" />
            <pointLight position={[0, 5, 0]} intensity={0.7} color="#E91E90" />
            <AnimatedTorus />
            <FloatingCubes />
            <Environment preset="night" />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
          </Canvas>
        </div>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
        <div className="px-5 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/15 text-base text-white/70">
          Click + drag to orbit
        </div>
      </div>
    </DarkSlide>
  );
}
