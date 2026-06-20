import { Heart, Swords, Check } from 'lucide-react';

interface ModeSelectorProps {
  selectedMode: 'friendly' | 'challenge' | null;
  onModeSelect: (mode: 'friendly' | 'challenge') => void;
}

const modes = [
  {
    id: 'friendly' as const,
    icon: Heart,
    label: 'Collaborate',
    tag: 'Friendly',
    desc: 'Solve a problem side by side. Shared editor, no clock, no rating — just two minds learning out loud.',
    accent: 'var(--teal)',
    accentBright: 'var(--teal-bright)',
    glow: 'rgba(78,201,176,0.5)',
  },
  {
    id: 'challenge' as const,
    icon: Swords,
    label: 'Compete',
    tag: 'Ranked',
    desc: 'First to pass every test wins. Timed, rated, head-to-head. Climb the leaderboard one duel at a time.',
    accent: 'var(--coral)',
    accentBright: 'var(--coral-bright)',
    glow: 'rgba(255,107,94,0.5)',
  },
];

export const ModeSelector = ({ selectedMode, onModeSelect }: ModeSelectorProps) => {
  return (
    <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
      {modes.map((mode) => {
        const active = selectedMode === mode.id;
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            className="group relative text-left rounded-2xl p-6 transition-all duration-300 active:scale-[0.98] overflow-hidden"
            style={{
              background: active
                ? `linear-gradient(160deg, ${mode.accent}1f, rgba(255,255,255,0.02))`
                : 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
              border: `1px solid ${active ? mode.accent : 'var(--line)'}`,
              boxShadow: active ? `0 18px 50px -16px ${mode.glow}` : 'none',
            }}
          >
            {/* corner glow */}
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-opacity duration-300"
              style={{ background: mode.accent, opacity: active ? 0.18 : 0.06 }}
            />

            {/* selected check */}
            {active && (
              <span
                className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: mode.accent, color: '#06201b' }}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
            )}

            <div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
              style={{
                background: `${active ? mode.accent : 'rgba(255,255,255,0.06)'}`,
                color: active ? '#06201b' : 'var(--fg-dim)',
              }}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-display text-xl font-bold text-[var(--fg)]">{mode.label}</h3>
              <span
                className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                style={{ color: mode.accentBright, background: `${mode.accent}1a`, border: `1px solid ${mode.accent}33` }}
              >
                {mode.tag}
              </span>
            </div>
            <p className="text-sm text-[var(--fg-dim)] leading-relaxed">{mode.desc}</p>
          </button>
        );
      })}
    </div>
  );
};
