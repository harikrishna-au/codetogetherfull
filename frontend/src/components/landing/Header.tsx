import { Button } from '@/components/ui/button';
import { useSessionAuth } from '@/context/SessionAuthContext';
// Note: useSessionAuth might still be used for loginWithSession but Header doesn't need it for UI anymore. 
// We will keep it for now if other logic depends on it, but simpler to just use Clerk.
import { SignInButton, UserButton, SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Code } from 'lucide-react';

import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { user } = useUser();

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

};

export default Header;
