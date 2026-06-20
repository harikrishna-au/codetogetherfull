interface DifficultySelectorProps {
  selectedDifficulty: 'easy' | 'medium' | 'hard' | null;
  onDifficultySelect: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

const levels = [
  { value: 'easy' as const, label: 'Easy', dots: 1, accent: 'var(--teal)' },
  { value: 'medium' as const, label: 'Medium', dots: 2, accent: 'var(--amber)' },
  { value: 'hard' as const, label: 'Hard', dots: 3, accent: 'var(--coral)' },
];

export const DifficultySelector = ({ selectedDifficulty, onDifficultySelect }: DifficultySelectorProps) => {
  return (
    <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl border border-[var(--line)] bg-white/[0.02] backdrop-blur-sm">
      {levels.map((lvl) => {
        const active = selectedDifficulty === lvl.value;
        return (
          <button
            key={lvl.value}
            onClick={() => onDifficultySelect(lvl.value)}
            className="relative flex items-center gap-2.5 px-5 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
            style={{
              background: active ? `${lvl.accent}1f` : 'transparent',
              border: `1px solid ${active ? lvl.accent : 'transparent'}`,
              color: active ? 'var(--fg)' : 'var(--fg-dim)',
            }}
          >
            <span className="flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                  style={{
                    background: i < lvl.dots ? (active ? lvl.accent : 'var(--fg-faint)') : 'rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </span>
            {lvl.label}
          </button>
        );
      })}
    </div>
  );
};
