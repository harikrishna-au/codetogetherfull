import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	SignInButton,
	UserButton,
	SignedIn,
	SignedOut,
	useUser,
} from "@clerk/clerk-react";
import { motion } from "framer-motion";
import ActiveUserCount from "@/components/ActiveUserCount";

const Header = () => {
	const { user } = useUser();
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
			<motion.header
				className="w-full max-w-5xl"
				initial={{ y: -80, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
			>
				<div
					className={`
            rounded-full border border-white/[0.08] backdrop-blur-xl
            bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.5)]
            transition-all duration-500 ease-out
            ${scrolled ? "px-5 py-2" : "px-7 py-3"}
          `}
				>
					<div className="flex items-center justify-between">
						{/* Logo */}
						<a href="/" className="flex items-center gap-2.5 group">
							<div
								className={`
                flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08]
                transition-all duration-500
                ${scrolled ? "w-7 h-7" : "w-8 h-8"}
              `}
							>
								<span className="text-[#cfd3d6] font-bold text-xs font-mono">
									&lt;/&gt;
								</span>
							</div>
							<span
								className={`
                font-semibold text-[#e2e5e8] tracking-tight transition-all duration-500
                group-hover:text-white
                ${scrolled ? "text-base" : "text-lg"}
              `}
							>
								codetogether
							</span>
						</a>

						{/* Active users */}
						<ActiveUserCount />

						{/* Auth section */}
						<SignedOut>
							<SignInButton mode="modal">
								<Button
									variant="ghost"
									className={`
                    rounded-full border border-[#cfd3d6]/20 text-[#cfd3d6]
                    bg-white/[0.04] hover:bg-white/[0.08] hover:text-white
                    hover:border-[#cfd3d6]/40 transition-all duration-300
                    ${scrolled ? "text-sm px-4 py-1.5 h-8" : "text-sm px-5 py-2 h-9"}
                  `}
								>
									Sign In
								</Button>
							</SignInButton>
						</SignedOut>

						<SignedIn>
							<div className="flex items-center gap-3">
								<span
									className={`
                  text-[#bfc5c9] font-medium transition-all duration-500 hidden sm:block
                  ${scrolled ? "text-xs" : "text-sm"}
                `}
								>
									{user?.firstName ||
										user?.fullName ||
										"User"}
								</span>
								<div className="ring-1 ring-white/10 rounded-full hover:ring-white/25 transition-all duration-300">
									<UserButton afterSignOutUrl="/" />
								</div>
							</div>
						</SignedIn>
					</div>
				</div>
			</motion.header>
		</div>
	);
};

export default Header;
