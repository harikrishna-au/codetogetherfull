/**
 * Arena backdrop — perspective grid floor + dual aurora (teal vs coral)
 * + fine noise + vignette. Replaces the old floating-symbols / light-rays look.
 */
const BackgroundEffects = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" style={{ background: 'var(--ink)' }}>
      {/* Deep base wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% -10%, #11151a 0%, #0a0c0e 45%, #08090b 100%)',
        }}
      />

      {/* Teal aurora — top left (collaborate) */}
      <div
        className="arena-aurora ct-drift"
        style={{
          top: '-12%',
          left: '-8%',
          width: '46vw',
          height: '46vw',
          background:
            'radial-gradient(circle, rgba(78,201,176,0.20) 0%, rgba(78,201,176,0.05) 45%, transparent 70%)',
        }}
      />

      {/* Coral aurora — bottom right (compete) */}
      <div
        className="arena-aurora ct-drift-slow"
        style={{
          bottom: '-15%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          background:
            'radial-gradient(circle, rgba(255,107,94,0.16) 0%, rgba(255,107,94,0.04) 45%, transparent 70%)',
        }}
      />

      {/* Perspective grid floor */}
      <div className="absolute inset-x-0 top-0 h-screen arena-grid" />

      {/* Fine film grain */}
      <div className="absolute inset-0 ct-noise opacity-[0.035] mix-blend-overlay" />

      {/* Vignette to focus the center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
};

export default BackgroundEffects;
