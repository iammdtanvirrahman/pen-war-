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
      setTimeout(() => {
        engine.resize();
      }, 150);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCallbacks(callbacks);
    }
  }, [callbacks]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 touch-none w-full h-full"
    />
  );
});

GameCanvas.displayName = 'GameCanvas';
