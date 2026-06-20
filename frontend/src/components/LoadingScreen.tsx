import { useEffect, useState } from 'react';

/**
 * Branded 3D splash — a rotating code-cube over dual-aurora ink, with a typing
 * terminal line and a progress fill. Used as the initial app boot screen and
 * reusable as a route/transition loader.
 */

const FACES = ['</>', '{ }', '( )', '=>', '[ ]', '##'];
const CUBE = 84; // px
const HALF = CUBE / 2;

const faceTransforms = [
  `rotateY(0deg) translateZ(${HALF}px)`,
  `rotateY(90deg) translateZ(${HALF}px)`,
  `rotateY(180deg) translateZ(${HALF}px)`,
  `rotateY(-90deg) translateZ(${HALF}px)`,
  `rotateX(90deg) translateZ(${HALF}px)`,
  `rotateX(-90deg) translateZ(${HALF}px)`,
];

interface LoadingScreenProps {
  /** Optional status line shown under the wordmark */
  label?: string;
  /** When true, fades the overlay out and unmounts after the transition */
  done?: boolean;
}

const LoadingScreen = ({ label = 'initializing arena', done = false }: LoadingScreenProps) => {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setGone(true), 600);
      return () => clearTimeout(t);
    }
  }, [done]);

  if (gone) return null;

  return (
    <div
      className="arena fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(120% 90% at 50% -10%, #11151a 0%, #0a0c0e 50%, #08090b 100%)',
        transition: 'opacity 0.6s ease, visibility 0.6s ease',
        opacity: done ? 0 : 1,
        visibility: done ? 'hidden' : 'visible',
      }}
    >
      {/* aurora */}
      <div className="arena-aurora ct-drift" style={{ top: '-20%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(78,201,176,0.22) 0%, transparent 70%)' }} />
      <div className="arena-aurora ct-drift-slow" style={{ bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255,107,94,0.18) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 arena-grid opacity-60" />

      {/* 3D cube */}
      <div className="ct-scene relative mb-10" style={{ width: CUBE, height: CUBE }}>
        <div className="ct-cube" style={{ width: CUBE, height: CUBE }}>
          {FACES.map((f, i) => (
            <div
              key={i}
              className="ct-cube-face font-mono-ct font-bold text-lg"
              style={{ width: CUBE, height: CUBE, transform: faceTransforms[i], color: i % 2 ? 'var(--coral-bright)' : 'var(--teal-bright)' }}
            >
              {f}
            </div>
          ))}
        </div>
        {/* glow under cube */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl -z-10" style={{ background: 'radial-gradient(circle, rgba(78,201,176,0.3), transparent 70%)' }} />
      </div>

      {/* wordmark */}
      <h1 className="font-display text-3xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--fg)' }}>
        code<span style={{ color: 'var(--teal-bright)' }}>together</span>
      </h1>

      {/* typing line */}
      <div className="font-mono-ct text-xs mb-7" style={{ color: 'var(--fg-dim)' }}>
        <span style={{ color: 'var(--teal)' }}>$</span> {label}
        <span className="ct-caret" style={{ color: 'var(--teal-bright)' }}>▋</span>
      </div>

      {/* progress */}
      <div className="w-56 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="ct-loader-bar h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--teal-bright), var(--teal) 50%, var(--coral))' }} />
      </div>
    </div>
  );
};

export default LoadingScreen;
