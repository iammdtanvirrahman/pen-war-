import React from 'react';
import { PowerUIState } from '../types/game';

interface PowerGaugeProps {
  powerState: PowerUIState;
}

export const PowerGauge: React.FC<PowerGaugeProps> = ({ powerState }) => {
  if (!powerState.visible) return null;

  const clipRight = Math.max(0, 100 - powerState.power * 100);

  return (
    <div
      className="fixed z-20 left-1/2 -translate-x-1/2 w-[min(280px,75vw)] text-center text-xs text-[#a1a1aa] pointer-events-none transition-opacity duration-150"
      style={{
        bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 52px)',
      }}
    >
      <div className="h-1.5 rounded-full bg-white/15 overflow-hidden mb-1.5 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-[#22c55e] via-[#f59e0b] to-[#ef4444] transition-all duration-75"
          style={{
            clipPath: `inset(0 ${clipRight}% 0 0)`,
          }}
        />
      </div>
      <div className="text-[11px] font-medium tracking-wide drop-shadow text-white/90">
        {powerState.spinComment}
      </div>
    </div>
  );
};
