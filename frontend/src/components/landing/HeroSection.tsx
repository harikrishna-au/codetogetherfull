import { DifficultySelector } from "@/components/DifficultySelector";
import { LiveUserCounts } from "@/components/LiveUserCounts";
import { ModeSelector } from "@/components/ModeSelector";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowRight, ChevronDown, Zap } from "lucide-react";
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

/* ── Animation Variants with Explicit Typing ── */
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
			ease: [0.25, 0.46, 0.45, 0.94] as const, // Fixed tuple for TS
		},
	},
};

/* ── Mini Terminal Component ── */
const CodeTerminal = () => (
	<motion.div
		variants={riseVariants}
		className="
      relative mx-auto mt-12 max-w-lg w-full
      rounded-xl border border-white/[0.06] overflow-hidden
      bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.5)]
    "
	>
		<div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
			<div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
			<div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
			<div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
			<span className="ml-3 text-[10px] text-white/20 font-mono">
				codetogether.session
			</span>
		</div>

		<div className="p-4 text-left font-mono text-[13px] leading-6 overflow-hidden">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1 }}
			>
				<span className="text-[#636669]">
					{"// solve together, grow together"}
				</span>
			</motion.div>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.3 }}
			>
				<span className="text-[#c792ea]">const </span>
				<span className="text-[#82aaff]">solve</span>
				<span className="text-white/40"> = </span>
				<span className="text-[#c792ea]">(</span>
				<span className="text-[#f78c6c]">problem</span>
				<span className="text-[#c792ea]">)</span>
				<span className="text-white/40"> =&gt; </span>
				<span className="text-[#c792ea]">{"{"}</span>
			</motion.div>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.6 }}
			>
				<span className="text-white/20">{"  "}</span>
				<span className="text-[#c792ea]">return </span>
				<span className="text-[#82aaff]">collaborate</span>
				<span className="text-white/40">(</span>
				<span className="text-[#c3e88d]">peers</span>
				<span className="text-white/40">, </span>
				<span className="text-[#f78c6c]">problem</span>
				<span className="text-white/40">);</span>
			</motion.div>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.9 }}
			>
				<span className="text-[#c792ea]">{"}"}</span>
				<span className="text-white/40">;</span>
			</motion.div>

			<motion.span
				className="inline-block w-[7px] h-4 bg-[#cfd3d6]/60 ml-0.5 align-middle"
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
	const words = [
		"Code",
		"Grow",
	];
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
					{/* Tag line chip */}
					<motion.div
						variants={riseVariants}
						className="flex justify-center mb-8"
					>
						<div
							className="
              inline-flex items-center gap-2 px-4 py-1.5
              rounded-full border border-white/[0.06] bg-white/[0.03]
              text-[11px] tracking-widest uppercase text-[#6b7075]
            "
						>
							<div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
							Collaborative Coding Platform
						</div>
					</motion.div>

					{/* Main Titles */}
					<motion.h1 variants={riseVariants} className="mb-2">
						<span
							className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]"
							style={{ fontFamily: codeFont }}
						>
							<span className="bg-clip-text text-transparent bg-gradient-to-br from-[#e8eaed] via-[#cfd3d6] to-[#9ca3a9]">
								<FlipWords words={words} className=" text-white/90 !px-0" duration={1000}/>
							</span><span className="text-white/20 font-light">.</span><span className="text-white/90">Together</span>
						</span>
					</motion.h1>

					{/* Metallic accent line */}
					<motion.div
						variants={riseVariants}
						className="mx-auto mb-8 flex items-center gap-3 justify-center"
					>
						<div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#cfd3d6]/30" />
						<div className="w-1 h-1 rounded-full bg-[#cfd3d6]/40" />
						<div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#cfd3d6]/30" />
					</motion.div>

					{/* Description */}
					<motion.p
						variants={riseVariants}
						className="text-sm sm:text-base text-[#6b7075] leading-relaxed max-w-xl mx-auto mb-10 font-light"
					>
						Connect with developers worldwide. Practice problems
						together and learn from each other's solutions in
						real-time.
					</motion.p>

					{/* CTA Buttons */}
					<motion.div
						variants={riseVariants}
						className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
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
							className="group relative rounded-full px-7 py-2.5 h-11 bg-[#cfd3d6] text-[#0a0a0a] hover:bg-[#e2e5e8] transition-all duration-300 shadow-[0_0_30px_rgba(207,211,214,0.1)] hover:shadow-[0_0_40px_rgba(207,211,214,0.2)]"
						>
							Start Duel
							<ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
						</Button>
						<Button
							variant="ghost"
							onClick={scrollToFeatures}
							className="rounded-full px-7 py-2.5 h-11 text-[#6b7075] hover:text-[#cfd3d6] border border-white/[0.06] hover:border-white/[0.12] transition-all"
						>
							Learn More
							<ChevronDown className="w-3.5 h-3.5 ml-1.5" />
						</Button>
					</motion.div>

					<CodeTerminal />
				</motion.div>
			</motion.div>

			{/* ── Mode & Difficulty Selection ── */}
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
					<p className="text-[11px] uppercase tracking-[0.2em] text-[#4a4f54] mb-2">
						Configure
					</p>
					<h3 className="text-xl sm:text-2xl font-semibold text-white/90 mb-8 tracking-tight">
						Choose Your Experience
					</h3>
					<ModeSelector
						selectedMode={selectedMode}
						onModeSelect={setSelectedMode}
					/>
				</motion.div>

				{selectedMode && (
					<motion.div
						className="mt-10"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<h3 className="text-[11px] uppercase tracking-[0.2em] text-[#4a4f54] mb-5">
							Select Difficulty
						</h3>
						<DifficultySelector
							selectedDifficulty={selectedDifficulty}
							onDifficultySelect={setSelectedDifficulty}
						/>
					</motion.div>
				)}

				{selectedMode && selectedDifficulty && (
					<motion.div
						className="mt-8"
						initial={{ opacity: 0, y: 15 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<LiveUserCounts
							mode={selectedMode}
							difficulty={selectedDifficulty}
						/>
						<div className="mt-8">
							<Button
								onClick={handleStartCoding}
								size="lg"
								className={`rounded-full px-10 py-3 text-base font-semibold transition-all transform hover:scale-[1.03] ${
									selectedMode === "friendly"
										? "bg-gradient-to-r from-green-500 to-emerald-600"
										: "bg-gradient-to-r from-orange-500 to-red-600"
								} text-white`}
							>
								<Zap className="w-5 h-5 mr-2" />
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
