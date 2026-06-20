import ActiveUserHeartbeat from "@/components/ActiveUserHeartbeat";
import BackgroundEffects from "@/components/landing/BackgroundEffects";
import ContactSection from "@/components/landing/ContactSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import { useSessionAuth } from "@/context/SessionAuthContext";
import { fetchUserState } from "@/lib/userState";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
	const [selectedMode, setSelectedMode] = useState<
		"friendly" | "challenge" | null
	>(null);
	const [selectedDifficulty, setSelectedDifficulty] = useState<
		"easy" | "medium" | "hard" | null
	>(null);
	const { user, sessionToken } = useSessionAuth();
	const navigate = useNavigate();

	const [userState, setUserState] = useState(null);
	useEffect(() => {
		if (!user || !sessionToken) return;
		fetchUserState(user.id, sessionToken).then((state) => {
			setUserState(state);
			if (
				state &&
				state.state === "waiting" &&
				state.mode &&
				state.difficulty
			) {
				navigate("/matchmaking", {
					state: { mode: state.mode, difficulty: state.difficulty },
				});
			}
		});
	}, [user, sessionToken, navigate]);

	useEffect(() => {
		if (
			userState &&
			(userState.state === "matched" ||
				userState.state === "in-session") &&
			userState.roomId
		) {
			navigate(`/session/${userState.roomId}`, {
				state: {
					mode: userState.mode,
					difficulty: userState.difficulty,
				},
			});
		}
	}, [userState, navigate]);

	return (
		<>
			{user && <ActiveUserHeartbeat userId={user.id} />}
			<div className="arena relative min-h-screen overflow-x-hidden scroll-smooth">
				<BackgroundEffects />
				<Header />

				<HeroSection
					selectedMode={selectedMode}
					setSelectedMode={setSelectedMode}
					selectedDifficulty={selectedDifficulty}
					setSelectedDifficulty={setSelectedDifficulty}
				/>

				{/* Divider */}
				<div className="relative z-10 mx-auto w-full max-w-xs h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

				<FeaturesSection />

				{/* Divider */}
				<div className="relative z-10 mx-auto w-full max-w-xs h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

				<ContactSection />
				<Footer />
			</div>
		</>
	);
};

export default Index;
