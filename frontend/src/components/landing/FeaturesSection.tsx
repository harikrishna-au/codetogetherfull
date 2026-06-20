import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Users, Code, Timer, Trophy, Heart, Swords, type LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  accentBright: string;
  span: string;
  big?: boolean;
}

const features: Feature[] = [
  {
    icon: Swords,
    title: 'Real-time duels',
    description:
      'Challenge a developer to a live 1v1. Watch their progress bar climb beside yours as tests turn green — first to solve it takes the win.',
    accent: 'var(--teal)',
    accentBright: 'var(--teal-bright)',
    span: 'lg:col-span-3 lg:row-span-2',
    big: true,
  },
  {
    icon: Users,
    title: 'Skill-based matchmaking',
    description: 'Rating-aware pairing finds an opponent near your level — the window widens until it lands a fair fight, usually in seconds.',
    accent: 'var(--coral)',
    accentBright: 'var(--coral-bright)',
    span: 'lg:col-span-3',
  },
  {
    icon: Code,
    title: 'Live shared editor',
    description: 'A full Monaco editor with multi-language support, syntax highlighting, and instant test feedback — optionally synced in real time.',
    accent: 'var(--teal)',
    accentBright: 'var(--teal-bright)',
    span: 'lg:col-span-3',
  },
  {
    icon: Timer,
    title: 'Timed sessions',
    description: 'Focused rounds keep the pressure real.',
    accent: 'var(--amber)',
    accentBright: 'var(--amber)',
    span: 'lg:col-span-2',
  },
  {
    icon: Trophy,
    title: 'Elo leaderboards',
    description: 'Win, climb tiers, defend your rank.',
    accent: 'var(--coral)',
    accentBright: 'var(--coral-bright)',
    span: 'lg:col-span-2',
  },
  {
    icon: Heart,
    title: 'Learn together',
    description: 'Review each other’s solutions after.',
    accent: 'var(--teal)',
    accentBright: 'var(--teal-bright)',
    span: 'lg:col-span-2',
  },
];

const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`group ct-card relative overflow-hidden rounded-2xl p-6 ${feature.span} ${feature.big ? 'flex flex-col justify-between' : ''}`}
    >
      {/* hover glow */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: feature.accent }}
      />

      <div className="relative">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
          style={{ background: `${feature.accent}1a`, border: `1px solid ${feature.accent}33` }}
        >
          <Icon className="w-5 h-5" style={{ color: feature.accentBright }} />
        </div>
        <h4 className={`font-display font-bold text-[var(--fg)] mb-2 tracking-tight ${feature.big ? 'text-2xl' : 'text-lg'}`}>
          {feature.title}
        </h4>
        <p className={`text-[var(--fg-dim)] leading-relaxed ${feature.big ? 'text-base' : 'text-sm'}`}>
          {feature.description}
        </p>
      </div>

      {/* big card extra flourish — a faux progress duel */}
      {feature.big && (
        <div className="relative mt-6 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono-ct text-[10px] w-10 text-[var(--teal-bright)]">YOU</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full ct-grow-teal" style={{ width: '82%', background: 'linear-gradient(90deg,var(--teal),var(--teal-bright))' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-ct text-[10px] w-10 text-[var(--coral-bright)]">OPP</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full ct-grow-coral" style={{ width: '57%', background: 'linear-gradient(90deg,var(--coral),var(--coral-bright))' }} />
            </div>
          </div>
        </div>
      )}

      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)` }}
      />
    </motion.div>
  );
};

const FeaturesSection = () => {
  const headerRef = useRef(null);
  const inView = useInView(headerRef, { once: true, margin: '-80px' });

  return (
    <section id="features" className="relative z-10 py-28 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          ref={headerRef}
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--fg-faint)] mb-3">
            Why codetogether
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-[var(--fg)] tracking-tight">
            Built for developers who
            <span className="ct-text-duel"> grow together</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 auto-rows-[minmax(0,1fr)]">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
