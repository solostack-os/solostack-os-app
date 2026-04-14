'use client';
import React, { useRef, useId, useEffect, CSSProperties } from 'react';
import { animate, useMotionValue } from 'framer-motion';
import type { AnimationPlaybackControls } from 'framer-motion';

function mapRange(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number): number {
  if (fromLow === fromHigh) return toLow;
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

interface HeroBackgroundProps {
  color?: string;
  scale?: number;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

export function HeroBackground({
  color = 'rgba(108, 140, 255, 0.15)',
  scale = 40,
  speed = 30,
  className,
  style
}: HeroBackgroundProps) {
  const id = useId().replace(/:/g, '');
  const filterId = `hero-bg-${id}`;
  const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const hueRotateMotionValue = useMotionValue(0);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const displacementScale = mapRange(scale, 1, 100, 20, 100);
  const duration = mapRange(speed, 1, 100, 1000, 50) / 100;

  useEffect(() => {
    if (!feColorMatrixRef.current) return;
    hueRotateMotionValue.set(0);
    animationRef.current = animate(hueRotateMotionValue, 360, {
      duration,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'linear',
      onUpdate: (value) => {
        feColorMatrixRef.current?.setAttribute('values', String(value));
      }
    });
    return () => { animationRef.current?.stop(); };
  }, [duration, hueRotateMotionValue]);

  return (
    <div
      className={className}
      style={{ overflow: 'hidden', position: 'absolute', inset: 0, zIndex: 0, ...style }}
    >
      <div style={{ position: 'absolute', inset: -displacementScale, filter: `url(#${filterId}) blur(4px)` }}>
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id={filterId}>
              <feTurbulence
                result="undulation"
                numOctaves="2"
                baseFrequency={`${mapRange(scale, 0, 100, 0.001, 0.0005)},${mapRange(scale, 0, 100, 0.004, 0.002)}`}
                seed="0"
                type="turbulence"
              />
              <feColorMatrix ref={feColorMatrixRef} in="undulation" type="hueRotate" values="180" />
              <feColorMatrix in="dist" result="circulation" type="matrix" values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0" />
              <feDisplacementMap in="SourceGraphic" in2="circulation" scale={displacementScale} result="dist" />
              <feDisplacementMap in="dist" in2="undulation" scale={displacementScale} result="output" />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            backgroundColor: color,
            maskImage: `url('/hero-mask.png')`,
            maskSize: 'cover',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            width: '100%',
            height: '100%'
          }}
        />
      </div>
    </div>
  );
}
