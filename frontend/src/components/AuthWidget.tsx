import React from 'react';
import { googleProvider, auth } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AuthContext } from '@/context/AuthContext';

const AuthWidget: React.FC = () => {
  const { user } = React.useContext(AuthContext);
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error('Google sign-in failed', e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setConfirmLogout(false);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!user ? (
        <Button onClick={handleGoogleLogin} className="bg-white text-black hover:bg-gray-100">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-4 h-4 mr-2" />
          Continue with Google
        </Button>
      ) : (
        <>
          <Button variant="outline" onClick={() => setConfirmLogout(true)}>Logout</Button>
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
        </>
      )}
    </div>
  );
};

export default AuthWidget;
