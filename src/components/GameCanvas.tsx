import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { PenGameEngine, PenEngineCallbacks } from '../game/PenGameEngine';

export interface GameCanvasHandle {
  engine: PenGameEngine | null;
}

interface GameCanvasProps {
  callbacks: PenEngineCallbacks;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ callbacks }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PenGameEngine | null>(null);

  useImperativeHandle(ref, () => ({
    get engine() {
      return engineRef.current;
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new PenGameEngine(containerRef.current, callbacks);
    engineRef.current = engine;

    const onResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 touch-none w-full h-full"
    />
  );
});

GameCanvas.displayName = 'GameCanvas';
