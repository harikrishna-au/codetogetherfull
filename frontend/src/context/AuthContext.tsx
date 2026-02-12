import React from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

export const AuthContext = React.createContext<{ user: any; loading: boolean }>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  return (
    <AuthContext.Provider value={{ user: user || null, loading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};
