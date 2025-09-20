import { useContext, useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Code } from 'lucide-react';

const Header: React.FC = () => {
  const { user, loginWithSession, logoutWithSession } = useSessionAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      await loginWithSession();
    } catch (e) {
      console.error('Google sign-in failed', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutWithSession();
      setConfirmLogout(false);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Code className="w-8 h-8 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">CodeTogether</h1>
        </div>
        {!user ? (
          <Button onClick={handleGoogleLogin} variant="outline" className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black">
            Sign In with Google
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-3 focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user.photoURL ?? undefined} 
                    alt={user.displayName ?? 'User'}
                    onError={(e) => {
                      // Fallback to initials if avatar fails to load (429 rate limit)
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback>{user.displayName?.[0] ?? 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-white text-sm hidden sm:inline">{user.displayName ?? 'User'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Signed in as<br />
                <span className="text-foreground text-[13px] font-medium">{user.displayName ?? user.email}</span>
              </div>
              <DropdownMenuItem onClick={() => setConfirmLogout(true)} className="text-red-600 focus:text-red-700">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {/* Centered Logout Confirmation Dialog */}
      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm logout</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">Are you sure you want to logout?</div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmLogout(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
