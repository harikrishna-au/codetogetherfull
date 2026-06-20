import { DifficultySelector } from "@/components/DifficultySelector";
import { LiveUserCounts } from "@/components/LiveUserCounts";
import { ModeSelector } from "@/components/ModeSelector";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowRight, ChevronDown, Zap, Lock, Swords, Radio } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface HeroSectionProps {
  selectedMode: "friendly" | "challenge" | null;
  setSelectedMode: (mode: "friendly" | "challenge" | null) => void;
  selectedDifficulty: "easy" | "medium" | "hard" | null;
  setSelectedDifficulty: (difficulty: "easy" | "medium" | "hard" | null) => void;
}

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ── Live duel mockup card (3D mouse-tilt) ─────────────────────────────────── */
const DuelCard = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 12, ry: px * 16 });
  };
  const reset = () => setTilt({ rx: 0, ry: 0 });

  return (
  <motion.div
    variants={rise}
    className="relative mx-auto w-full max-w-md ct-scene"
    onPointerMove={onMove}
    onPointerLeave={reset}
  >
   <div
     ref={ref}
     className="ct-tilt relative"
     style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
   >
    {/* glow */}
    <div className="absolute -inset-4 rounded-[28px] bg-[radial-gradient(circle_at_30%_0%,rgba(78,201,176,0.18),transparent_60%),radial-gradient(circle_at_80%_100%,rgba(255,107,94,0.16),transparent_60%)] blur-xl" style={{ transform: 'translateZ(-40px)' }} />

    <div className="relative rounded-2xl border border-[var(--line-strong)] bg-[var(--panel)]/90 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]" style={{ transform: 'translateZ(30px)' }}>
      {/* title bar */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--coral)]">
            <Radio className="w-3 h-3 animate-pulse" /> Live duel
          </span>
        </div>
        <span className="font-mono-ct text-xs text-[var(--fg-dim)] tabular-nums">04:12</span>
      </div>

      {/* combatants */}
      <div className="p-4 space-y-3">
        {/* You */}
        <div className="rounded-xl border border-[var(--teal)]/25 bg-[var(--teal)]/[0.06] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--teal)]/20 border border-[var(--teal)]/40 flex items-center justify-center text-[11px] font-bold text-[var(--teal-bright)]">Y</span>
              <span className="text-sm font-semibold text-[var(--fg)]">You</span>
            </div>
            <span className="font-mono-ct text-[11px] text-[var(--teal-bright)]">7/8 passed</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="ct-grow-teal h-full rounded-full" style={{ width: "88%", background: "linear-gradient(90deg,var(--teal),var(--teal-bright))" }} />
          </div>
        </div>

        {/* Opponent */}
        <div className="rounded-xl border border-[var(--coral)]/25 bg-[var(--coral)]/[0.05] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[var(--coral)]/20 border border-[var(--coral)]/40 flex items-center justify-center text-[11px] font-bold text-[var(--coral-bright)]">A</span>
              <span className="text-sm font-semibold text-[var(--fg)]">arjun_dev</span>
            </div>
            <span className="font-mono-ct text-[11px] text-[var(--coral-bright)]">5/8 passed</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="ct-grow-coral h-full rounded-full" style={{ width: "62%", background: "linear-gradient(90deg,var(--coral),var(--coral-bright))" }} />
          </div>
        </div>

        {/* code line */}
        <div className="rounded-xl bg-[var(--ink)]/80 border border-[var(--line)] px-3 py-2.5 font-mono-ct text-[12px] leading-relaxed">
          <div className="text-[var(--fg-faint)]">{"// two sum — return indices"}</div>
          <div>
            <span className="text-[var(--coral-bright)]">const</span>
            <span className="text-[var(--fg-dim)]"> seen </span>
            <span className="text-[var(--fg-faint)]">=</span>
            <span className="text-[var(--teal-bright)]"> new </span>
            <span className="text-[var(--amber)]">Map</span>
            <span className="text-[var(--fg-dim)]">();</span>
            <span className="ct-caret text-[var(--teal-bright)]">▋</span>
          </div>
        </div>
      </div>
    </div>
   </div>
  </motion.div>
  );
};

/* ── Scrolling stat ticker ─────────────────────────────────────────────────── */
const Ticker = () => {
  const items = [
    "1,240 duels today",
    "38 coders online",
    "avg match in 4s",
    "100+ problems",
    "4 languages",
    "live video pairing",
  ];
  const row = [...items, ...items];
  return (
    <div className="relative w-full overflow-hidden border-y border-[var(--line)] py-3 bg-white/[0.015]">
      <div className="ct-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 text-xs font-medium text-[var(--fg-dim)]">
            <span className="font-mono-ct">{t}</span>
            <span className="text-[var(--teal)]/50">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const HeroSection = ({
  selectedMode,
  setSelectedMode,
  selectedDifficulty,
  setSelectedDifficulty,
}: HeroSectionProps) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const handleStartCoding = () => {
    if (selectedMode && selectedDifficulty) {
      navigate("/matchmaking", { state: { mode: selectedMode, difficulty: selectedDifficulty } });
    }
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <section ref={sectionRef} className="relative z-10 px-4 pt-32 pb-20">
      {/* ── Hero ── */}
      <motion.div
        className="mx-auto max-w-6xl"
        style={{ y: yParallax, opacity: fade }}
      >
        <motion.div
          className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <motion.div variants={rise} className="flex justify-center lg:justify-start mb-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--line-strong)] bg-white/[0.03] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--teal-bright)] backdrop-blur-sm">
                <Swords className="w-3.5 h-3.5" />
                1v1 real-time coding arena
              </span>
            </motion.div>

            <motion.h1
              variants={rise}
              className="font-display font-extrabold leading-[0.95] tracking-tight text-[clamp(2.75rem,7vw,5.25rem)] text-[var(--fg)] mb-6"
            >
              Real-time coding,
              <br />
              <span className="ct-text-duel">built for two.</span>
            </motion.h1>

            <motion.p
              variants={rise}
              className="text-base sm:text-lg text-[var(--fg-dim)] leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
            >
              Pair up to solve a problem together, or face off in a timed duel.
              Shared editor, live video, instant tests, and a ranking that climbs
              with every win — <span className="text-[var(--fg)] font-medium">codetogether</span> is
              where developers sharpen each other.
            </motion.p>

            <motion.div variants={rise} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <button
                onClick={() => scrollTo("mode-select")}
                className="group relative inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-[#04201b] overflow-hidden transition-transform active:scale-95"
                style={{ background: "linear-gradient(100deg,var(--teal-bright),var(--teal))" }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: "0 0 40px rgba(78,201,176,0.6)" }} />
                <Zap className="w-4.5 h-4.5 relative" />
                <span className="relative">Enter the arena</span>
                <ArrowRight className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollTo("features")}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-semibold text-[var(--fg)] border border-[var(--line-strong)] bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
              >
                See how it works
                <ChevronDown className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {/* Right — duel card */}
          <DuelCard />
        </motion.div>
      </motion.div>

      {/* ── Ticker ── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-6xl mt-20"
      >
        <Ticker />
      </motion.div>

      {/* ── Choose your side ── */}
      <div id="mode-select" className="mx-auto max-w-4xl mt-28 text-center scroll-mt-28">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--fg-faint)] mb-3">
            Step 01
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--fg)] tracking-tight mb-3">
            Choose your side
          </h2>
          <p className="text-sm text-[var(--fg-dim)] max-w-md mx-auto mb-10">
            Collaborate without pressure, or compete for the rating. You decide the energy.
          </p>
          <ModeSelector selectedMode={selectedMode} onModeSelect={setSelectedMode} />
        </motion.div>

        {selectedMode && (
          <motion.div
            className="mt-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--fg-faint)] mb-5">
              Step 02 · Pick difficulty
            </span>
            <DifficultySelector
              selectedDifficulty={selectedDifficulty}
              onDifficultySelect={setSelectedDifficulty}
            />
          </motion.div>
        )}

        {selectedMode && selectedDifficulty && (
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md mx-auto mb-8">
              <LiveUserCounts mode={selectedMode} difficulty={selectedDifficulty} />
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleStartCoding}
                className="group inline-flex items-center gap-2.5 rounded-full px-9 py-4 text-lg font-bold text-[#04201b] transition-transform active:scale-95"
                style={{
                  background:
                    selectedMode === "friendly"
                      ? "linear-gradient(100deg,var(--teal-bright),var(--teal))"
                      : "linear-gradient(100deg,var(--coral-bright),var(--coral))",
                  boxShadow:
                    selectedMode === "friendly"
                      ? "0 12px 40px -8px rgba(78,201,176,0.55)"
                      : "0 12px 40px -8px rgba(255,107,94,0.55)",
                }}
              >
                <Zap className="w-5 h-5" />
                {selectedMode === "friendly" ? "Start collaborating" : "Start competing"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/private-room", { state: { mode: selectedMode, difficulty: selectedDifficulty } })}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors px-3 py-1.5 rounded-full border border-transparent hover:border-[var(--line)]"
              >
                <Lock className="w-3 h-3" />
                or challenge a friend with a private room
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
