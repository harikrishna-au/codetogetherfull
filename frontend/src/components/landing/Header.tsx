import { Button } from '@/components/ui/button';
import { useSessionAuth } from '@/context/SessionAuthContext';
// Note: useSessionAuth might still be used for loginWithSession but Header doesn't need it for UI anymore. 
// We will keep it for now if other logic depends on it, but simpler to just use Clerk.
import { SignInButton, UserButton, SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Code } from 'lucide-react';

const Header: React.FC = () => {
  const { user } = useUser();

  return (
    <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Code className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">CodeTogether</h1>
        </div>
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black">
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">
              {user?.firstName || user?.fullName || "User"}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </div>
      {/* Centered Logout Confirmation Dialog */}
    </header>
  );

};

export default Header;
