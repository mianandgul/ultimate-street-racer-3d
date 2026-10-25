import React, { useEffect, useState } from 'react';
import { sound } from '../game/audio';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number | 'GO'>(3);

  useEffect(() => {
    sound.playCountdownBeep(false);

    const timer1 = setTimeout(() => {
      setCount(2);
      sound.playCountdownBeep(false);
    }, 900);

    const timer2 = setTimeout(() => {
      setCount(1);
      sound.playCountdownBeep(false);
    }, 1800);

    const timer3 = setTimeout(() => {
      setCount('GO');
      sound.playCountdownBeep(true);
    }, 2700);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center z-30">
      <div className="flex flex-col items-center justify-center animate-scale">
        <span
          className={`font-black tracking-tight drop-shadow-2xl ${
            count === 'GO'
              ? 'text-7xl sm:text-9xl text-emerald-400 animate-pulse'
              : 'text-8xl sm:text-9xl text-amber-400'
          }`}
          style={{ textShadow: '0 0 35px rgba(250, 204, 21, 0.8)' }}
        >
          {count}
        </span>
        <span className="text-sm sm:text-base font-bold tracking-widest text-cyan-300 uppercase mt-2">
          GET READY
        </span>
      </div>
    </div>
  );
};
