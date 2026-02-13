import { motion } from "framer-motion";
import { useMemo } from "react";
import LightRays from "../LightRays";

const CODE_SYMBOLS = [
	"{",
	"}",
	";",
	"<",
	">",
	"/",
	"//",
	"=>",
	"()",
	"[]",
	"&&",
	"||",
	"!=",
	"++",
	"===",
	"...",
	"<?>",
	"</>",
];

interface FloatingSymbolProps {
	symbol: string;
	index: number;
}

const FloatingSymbol = ({ symbol, index }: FloatingSymbolProps) => {
	const style = useMemo(() => {
		const col = index % 6;
		const row = Math.floor(index / 6);
		return {
			left: `${col * 15 + 5 + (row % 2) * 5}%`,
			top: `${row * 20 + 10 + (index % 3) * 5}%`,
			fontSize: `${12 + (index % 4) * 4}px`,
		};
	}, [index]);

	return (
		<motion.span
			className="absolute select-none pointer-events-none whitespace-nowrap"
			style={{
				...style,
				fontFamily:
					"Fira Code, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
				color: `rgba(207, 211, 214, ${0.08 + (index % 3) * 0.04})`, // Slightly higher visibility
			}}
			animate={{
				y: [0, -20, 0],
				x: [0, index % 2 === 0 ? 10 : -10, 0],
				opacity: [0.05, 0.15, 0.05],
			}}
			transition={{
				duration: 8 + (index % 5) * 2,
				repeat: Infinity,
				ease: "easeInOut",
				delay: index * 0.2,
			}}
		>
			{symbol}
		</motion.span>
	);
};

const BackgroundEffects = () => {
	return (
		<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-black">
			{/* Visual Depth Gradients */}
			<div
				className="absolute inset-0 opacity-[0.05]"
				style={{
					backgroundImage: `radial-gradient(circle at 25% 25%, white 15%, transparent 50%)`,
				}}
			/>
			<div
				style={{ width: "100%", height: "600px", position: "relative" }}
			>
				<LightRays
					raysOrigin="top-center"
					raysColor="#fff"
					raysSpeed={1}
					lightSpread={0.8}
					rayLength={3}
					followMouse={true}
					mouseInfluence={0.1}
					noiseAmount={0}
					distortion={0}
					className="custom-rays"
					pulsating={false}
					fadeDistance={1}
					saturation={1}
				/>
			</div>

			{/* Top Right Glow */}
			<div className="absolute -top-[10%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px] bg-white/[0.05]" />

			{/* Symbols Mapping */}
			{CODE_SYMBOLS.map((symbol, index) => (
				<FloatingSymbol
					key={`${symbol}-${index}`}
					symbol={symbol}
					index={index}
				/>
			))}

			{/* Vignette to focus the center */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
		</div>
	);
};

export default BackgroundEffects;
