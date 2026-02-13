import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Users, Code, Timer, Trophy, Zap, Heart } from 'lucide-react';

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
        bg-white/[0.02] border border-white/[0.06]
        hover:bg-white/[0.05] hover:border-white/[0.12]
        transition-all duration-500
      ">
        {/* Subtle glow on hover */}
        <div className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          bg-gradient-to-br from-[#cfd3d6]/[0.03] to-transparent
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
              w-10 h-10 rounded-xl mb-4
              flex items-center justify-center
              bg-white/[0.04] border border-white/[0.08]
              group-hover:bg-white/[0.08] group-hover:border-white/[0.15]
              transition-all duration-500
            "
          >
            <Icon className="w-5 h-5 text-[#cfd3d6] group-hover:text-white transition-colors duration-300" />
          </motion.div>

          {/* Title */}
          <h4 className="text-lg font-semibold text-white mb-2 tracking-tight">
            {title}
          </h4>

          {/* Description */}
          <p className="text-sm text-[#6b7075] leading-relaxed group-hover:text-[#8a8f94] transition-colors duration-300">
            {description}
          </p>
        </div>

        {/* Bottom accent line */}
        <div className="
          absolute bottom-0 left-0 right-0 h-[1px]
          bg-gradient-to-r from-transparent via-[#cfd3d6]/10 to-transparent
          group-hover:via-[#cfd3d6]/25 transition-all duration-500
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
          <p className="text-xs uppercase tracking-[0.2em] text-[#6b7075] mb-3">
            Why Codetogether
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Built for developers who
            <span className="bg-gradient-to-r from-[#cfd3d6] to-[#8a8f94] bg-clip-text text-transparent">
              {' '}grow together
            </span>
          </h2>
          <div className="mx-auto h-[1px] w-20 bg-gradient-to-r from-transparent via-[#cfd3d6]/30 to-transparent" />
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
