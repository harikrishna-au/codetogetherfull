import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SignInButton, UserButton, SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { motion } from 'framer-motion';
import ActiveUserCount from '@/components/ActiveUserCount';

import { Link } from 'react-router-dom';
import { Code } from 'lucide-react';

const Header: React.FC = () => {
  const { user } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="border-b border-white/10 backdrop-blur-sm bg-black/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-white hover:text-purple-400 transition-colors">
          <Code className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold">CodeTogether</h1>
        </Link>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link to="/profile">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                  Profile
                </Button>
              </Link>
              <span className="text-white font-medium hidden sm:block">
                {user?.firstName || user?.fullName || "User"}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  );

  //           {/* Active users */}
  //           <ActiveUserCount />

  //           {/* Auth section */}
  //           <SignedOut>
  //             <SignInButton mode="modal">
  //               <Button
  //                 variant="ghost"
  //                 className={`
  //                   rounded-full border border-[#cfd3d6]/20 text-[#cfd3d6]
  //                   bg-white/[0.04] hover:bg-white/[0.08] hover:text-white
  //                   hover:border-[#cfd3d6]/40 transition-all duration-300
  //                   ${scrolled ? 'text-sm px-4 py-1.5 h-8' : 'text-sm px-5 py-2 h-9'}
  //                 `}
  //               >
  //                 Sign In
  //               </Button>
  //             </SignInButton>
  //           </SignedOut>

  //           <SignedIn>
  //             <div className="flex items-center gap-3">
  //               <span className={`
  //                 text-[#bfc5c9] font-medium transition-all duration-500 hidden sm:block
  //                 ${scrolled ? 'text-xs' : 'text-sm'}
  //               `}>
  //                 {user?.firstName || user?.fullName || "User"}
  //               </span>
  //               <div className="ring-1 ring-white/10 rounded-full hover:ring-white/25 transition-all duration-300">
  //                 <UserButton afterSignOutUrl="/" />
  //               </div>
  //             </div>
  //           </SignedIn>
  //         </div>
  //       </div>
  //     </motion.header>
  //   </div>
  // );
};

export default Header;
