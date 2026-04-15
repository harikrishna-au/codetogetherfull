import { DifficultySelector } from "@/components/DifficultySelector";
import { LiveUserCounts } from "@/components/LiveUserCounts";
import { ModeSelector } from "@/components/ModeSelector";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowRight, ChevronDown, Zap, Sparkles } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FlipWords } from "../ui/flip-words";

interface HeroSectionProps {
selectedMode: "friendly" | "challenge" | null;
setSelectedMode: (mode: "friendly" | "challenge" | null) => void;
selectedDifficulty: "easy" | "medium" | "hard" | null;
setSelectedDifficulty: (
difficulty: "easy" | "medium" | "hard" | null,
) => void;
}

const staggerVariants: Variants = {
hidden: { opacity: 0 },
show: {
opacity: 1,
transition: { staggerChildren: 0.1, delayChildren: 0.2 },
},
};

const riseVariants: Variants = {
hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
show: {
opacity: 1,
y: 0,
filter: "blur(0px)",
transition: {
duration: 0.8,
ease: [0.25, 0.46, 0.45, 0.94] as const,
},
},
};

const CodeTerminal = () => (
<motion.div
variants={riseVariants}
className="
      relative mx-auto mt-12 max-w-lg w-full
      rounded-xl border border-primary/20 overflow-hidden
      bg-gradient-to-b from-slate-950 to-slate-900 
      shadow-2xl shadow-primary/20
    "
>
<div className="flex items-center gap-2 px-4 py-3 border-b border-primary/10 bg-gradient-to-r from-slate-900 to-slate-800">
<div className="w-2.5 h-2.5 rounded-full bg-red-500" />
<div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
<div className="w-2.5 h-2.5 rounded-full bg-green-500" />
<span className="ml-3 text-[10px] text-slate-400 font-mono">
codetogether.session
</span>
</div>

<div className="p-5 text-left font-mono text-[13px] leading-6 overflow-hidden">
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 1 }}
>
<span className="text-slate-500">
{"// solve together, grow together"}
</span>
</motion.div>
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 1.3 }}
>
<span className="text-violet-400">const </span>
<span className="text-blue-400">solve</span>
<span className="text-slate-400"> = </span>
<span className="text-violet-400">(</span>
<span className="text-orange-400">problem</span>
<span className="text-violet-400">)</span>
<span className="text-slate-400"> =&gt; </span>
<span className="text-violet-400">{"{"}</span>
</motion.div>
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 1.6 }}
>
<span className="text-slate-500">{"  "}</span>
<span className="text-violet-400">return </span>
<span className="text-blue-400">collaborate</span>
<span className="text-slate-400">(</span>
<span className="text-green-400">peers</span>
<span className="text-slate-400">, </span>
<span className="text-orange-400">problem</span>
<span className="text-slate-400">);</span>
</motion.div>
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 1.9 }}
>
<span className="text-violet-400">{"}"}</span>
<span className="text-slate-400">;</span>
</motion.div>

<motion.span
className="inline-block w-[2px] h-4 bg-blue-400/80 ml-0.5 align-middle"
animate={{ opacity: [1, 0, 1] }}
transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
/>
</div>
</motion.div>
);

const HeroSection = ({
selectedMode,
setSelectedMode,
selectedDifficulty,
setSelectedDifficulty,
}: HeroSectionProps) => {
const navigate = useNavigate();
const sectionRef = useRef<HTMLElement>(null);
const words = ["Code", "Grow"];
const { scrollYProgress } = useScroll({
target: sectionRef,
offset: ["start start", "end start"],
});

const yParallax = useTransform(scrollYProgress, [0, 1], [0, 80]);
const opacityParallax = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

const handleStartCoding = () => {
if (selectedMode && selectedDifficulty) {
navigate("/matchmaking", {
state: { mode: selectedMode, difficulty: selectedDifficulty },
});
}
};

const scrollToFeatures = () => {
document
.getElementById("features")
?.scrollIntoView({ behavior: "smooth" });
};

const codeFont =
"'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

return (
<section
ref={sectionRef}
className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-20 overflow-hidden"
>
<motion.div
className="w-full max-w-4xl mx-auto"
style={{ y: yParallax, opacity: opacityParallax }}
>
<motion.div
className="text-center"
variants={staggerVariants}
initial="hidden"
animate="show"
>
<motion.div
variants={riseVariants}
className="flex justify-center mb-8"
>
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-xs tracking-widest uppercase text-primary font-semibold backdrop-blur-sm hover:border-primary/50 transition-all">
<Sparkles className="w-3.5 h-3.5" />
Collaborative Coding Platform
</div>
</motion.div>

<motion.h1 variants={riseVariants} className="mb-4">
<span
className="block text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1]"
style={{ fontFamily: codeFont }}
>
<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
<FlipWords words={words} className="text-white/90 !px-0" duration={1000} />
</span>
<span className="text-foreground/30">.</span>
<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Together</span>
</span>
</motion.h1>

<motion.div
variants={riseVariants}
className="mx-auto mb-8 flex items-center gap-3 justify-center"
>
<div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-primary/50" />
<div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
<div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-primary/50" />
</motion.div>

<motion.p
variants={riseVariants}
className="text-base sm:text-lg text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-12 font-light tracking-wide"
>
Connect with developers worldwide. Practice problems together and learn from each other's solutions in real-time. Challenge yourself and grow with the community.
</motion.p>

<motion.div
variants={riseVariants}
className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
>
<Button
onClick={() =>
document
.getElementById("mode-select")
?.scrollIntoView({
behavior: "smooth",
block: "center",
})
}
variant="gradient"
size="lg"
className="rounded-full"
>
<Zap className="w-5 h-5" />
Start Duel
<ArrowRight className="w-4 h-4" />
</Button>
<Button
variant="outline"
size="lg"
onClick={scrollToFeatures}
className="rounded-full"
>
Learn More
<ChevronDown className="w-4 h-4" />
</Button>
</motion.div>

<CodeTerminal />
</motion.div>
</motion.div>

<div
id="mode-select"
className="w-full max-w-4xl mx-auto mt-24 text-center"
>
<motion.div
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: "-50px" }}
transition={{ duration: 0.6 }}
>
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] uppercase tracking-[0.15em] font-bold mb-4">
<Sparkles className="w-3 h-3" />
Configure
</div>
<h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-10 tracking-tight">
Choose Your Experience
</h3>
<ModeSelector
selectedMode={selectedMode}
onModeSelect={setSelectedMode}
/>
</motion.div>

{selectedMode && (
<motion.div
className="mt-12"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
>
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] uppercase tracking-[0.15em] font-bold mb-4">
<Sparkles className="w-3 h-3" />
Select Difficulty
</div>
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
>
<LiveUserCounts
mode={selectedMode}
difficulty={selectedDifficulty}
/>
<div className="mt-10">
<Button
onClick={handleStartCoding}
size="xl"
variant={selectedMode === "friendly" ? "gradient" : "gradient-alt"}
className="rounded-full"
>
<Zap className="w-5 h-5" />
Start{" "}
{selectedMode === "friendly"
? "Collaborating"
: "Competing"}
</Button>
</div>
</motion.div>
)}
</div>
</section>
);
};

export default HeroSection;
