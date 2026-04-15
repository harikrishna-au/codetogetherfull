import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Users, Code, Timer, Trophy, Zap, Heart, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Real-time Duels',
    description: 'Challenge developers to live coding battles. Solve problems head-to-head with real-time progress tracking.',
  },
  {
    icon: Users,
    title: 'Smart Matchmaking',
    description: 'Get paired with developers at your skill level. Our system finds the right opponent for a fair challenge.',
  },
  {
    icon: Timer,
    title: 'Timed Challenges',
    description: '15-minute focused sessions keep you sharp. Perfect for quick practice during breaks or intense competition.',
  },
  {
    icon: Code,
    title: 'Live Code Editor',
    description: 'Full-featured Monaco editor with syntax highlighting, multi-language support, and instant test feedback.',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description: 'Track your progress and climb the ranks. Compete for top positions across different difficulty levels.',
  },
  {
    icon: Heart,
    title: 'Learn Together',
    description: 'Review solutions after each session. Discover new approaches and patterns from fellow developers.',
  },
];

interface FeatureCardProps {
  icon: typeof Zap;
  title: string;
  description: string;
  index: number;
}

const FeatureCard = ({ icon: Icon, title, description, index }: FeatureCardProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const isLeft = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
      <div className="
        relative overflow-hidden rounded-2xl p-6
        bg-gradient-to-br from-card to-card/50 border border-border/50
        hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30
        transition-all duration-500 group-hover:scale-[1.02]
      ">
        {/* Subtle glow on hover */}
        <div className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          bg-gradient-to-br from-primary/5 to-transparent
        " />

        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{
              duration: 0.5,
              delay: (index % 3) * 0.1 + 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="
              w-12 h-12 rounded-xl mb-4
              flex items-center justify-center
              bg-primary/10 border border-primary/20
              group-hover:bg-primary/20 group-hover:border-primary/40
              transition-all duration-500
            "
          >
            <Icon className="w-6 h-6 text-primary group-hover:text-accent transition-colors duration-300" />
          </motion.div>

          {/* Title */}
          <h4 className="text-lg font-bold text-foreground mb-2 tracking-tight">
            {title}
          </h4>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/70 transition-colors duration-300">
            {description}
          </p>
        </div>

        {/* Bottom accent line */}
        <div className="
          absolute bottom-0 left-0 right-0 h-[2px]
          bg-gradient-to-r from-transparent via-primary/20 to-transparent
          group-hover:via-primary/50 transition-all duration-500
        " />
      </div>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-80px' });

  return (
    <section id="features" className="relative z-10 py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-secondary font-bold mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            Why Codetogether
            <Sparkles className="w-3 h-3" />
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight mb-4">
            Built for developers who
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {' '}grow together
            </span>
          </h2>
          <div className="mx-auto h-[2px] w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
