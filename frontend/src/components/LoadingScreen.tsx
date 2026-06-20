import { useEffect, useState } from 'react';

/**
 * Branded 3D splash — a rotating code-cube with orbiting particles over a
 * dual-aurora arena scene, with a live progress counter and cycling status
 * messages. Used as the initial app boot screen and reusable as a loader.
 */

const FACES = ['</>', '{ }', '( )', '=>', '[ ]', '##'];
const CUBE = 88; // px
const HALF = CUBE / 2;

const faceTransforms = [
  `rotateY(0deg) translateZ(${HALF}px)`,
  `rotateY(90deg) translateZ(${HALF}px)`,
  `rotateY(180deg) translateZ(${HALF}px)`,
  `rotateY(-90deg) translateZ(${HALF}px)`,
  `rotateX(90deg) translateZ(${HALF}px)`,
  `rotateX(-90deg) translateZ(${HALF}px)`,
];

const STATUS = [
  'connecting to arena',
  'matching peers',
  'warming up sandboxes',
  'loading editor',
  'syncing problem set',
  'ready',
];

interface LoadingScreenProps {
  /** When true, fades the overlay out and unmounts after the transition */
  done?: boolean;
}

const LoadingScreen = ({ done = false }: LoadingScreenProps) => {
  const [gone, setGone] = useState(false);
  const [pct, setPct] = useState(8);
  const [status, setStatus] = useState(0);

  // Animate the percentage toward 96, snap to 100 on done
  useEffect(() => {
    if (done) { setPct(100); return; }
    const id = setInterval(() => {
      setPct((p) => (p >= 96 ? 96 : p + Math.max(1, Math.round((96 - p) * 0.18))));
    }, 110);
    return () => clearInterval(id);
  }, [done]);

  // Cycle status messages
  useEffect(() => {
    if (done) { setStatus(STATUS.length - 1); return; }
    const id = setInterval(() => setStatus((s) => Math.min(s + 1, STATUS.length - 2)), 380);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setGone(true), 620);
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
      {/* aurora + grid */}
      <div className="arena-aurora ct-drift" style={{ top: '-20%', left: '-10%', width: '52vw', height: '52vw', background: 'radial-gradient(circle, rgba(78,201,176,0.22) 0%, transparent 70%)' }} />
      <div className="arena-aurora ct-drift-slow" style={{ bottom: '-22%', right: '-12%', width: '54vw', height: '54vw', background: 'radial-gradient(circle, rgba(255,107,94,0.18) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 arena-grid opacity-50" />
      <div className="absolute inset-0 ct-noise opacity-[0.04] mix-blend-overlay" />

      {/* scene: cube + orbiting particles + reflection */}
      <div className="ct-scene relative mb-12" style={{ width: 220, height: 150 }}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ct-3d" style={{ width: CUBE, height: CUBE }}>
          {/* orbit rings */}
          {[
            { r: 78, dur: '3.6s', color: 'var(--teal-bright)', size: 6 },
            { r: 96, dur: '5.2s', color: 'var(--coral-bright)', size: 5 },
            { r: 112, dur: '7s', color: 'var(--amber)', size: 4 },
          ].map((o, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: o.size, height: o.size, marginLeft: -o.size / 2, marginTop: -o.size / 2,
                background: o.color, boxShadow: `0 0 12px ${o.color}`,
                ['--r' as string]: `${o.r}px`,
                animation: `ct-orbit ${o.dur} linear infinite`,
              }}
            />
          ))}

          {/* the cube */}
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

          {/* glow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl -z-10" style={{ background: 'radial-gradient(circle, rgba(78,201,176,0.32), transparent 70%)' }} />
        </div>

        {/* reflection */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-10 rounded-[50%] blur-md"
          style={{ background: 'radial-gradient(ellipse, rgba(78,201,176,0.25), transparent 70%)' }}
        />
      </div>

      {/* wordmark */}
      <h1 className="font-display text-4xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--fg)' }}>
        code<span style={{ color: 'var(--teal-bright)' }}>together</span>
      </h1>

      {/* status line */}
      <div className="font-mono-ct text-xs mb-7 h-4" style={{ color: 'var(--fg-dim)' }}>
        <span style={{ color: 'var(--teal)' }}>$</span> {STATUS[status]}
        <span className="ct-caret" style={{ color: 'var(--teal-bright)' }}>▋</span>
      </div>

      {/* progress + percentage */}
      <div className="w-64 flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--teal-bright), var(--teal) 50%, var(--coral))',
              transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 12px rgba(78,201,176,0.6)',
            }}
          />
        </div>
        <span className="font-mono-ct text-xs tabular-nums w-9 text-right" style={{ color: 'var(--fg-dim)' }}>{pct}%</span>
      </div>

      {/* footer tag */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--fg-faint)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] animate-pulse" />
        real-time coding arena
      </div>
    </div>
  );
};

export default LoadingScreen;
