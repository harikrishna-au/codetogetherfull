import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

interface SessionAuthContextValue {
  user: any;
  sessionToken: string | null;
  loading: boolean;
  refreshToken: () => Promise<void>;
  loginWithSession: () => Promise<void>; // Deprecated/No-op
  logoutWithSession: () => Promise<void>; // Deprecated/No-op
}

const SessionAuthContext = createContext<SessionAuthContextValue>({
  user: null,
  sessionToken: null,
  loading: true,
  refreshToken: async () => { },
  loginWithSession: async () => { },
  logoutWithSession: async () => { },
});

export const SessionAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    if (!authLoaded) return;

    const fetchToken = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          setSessionToken(token);
          // console.log("Clerk Token Retrieved");
        } catch (error) {
          console.error("Error fetching Clerk token:", error);
          setSessionToken(null);
        }
      } else {
        setSessionToken(null);
      }
      setTokenLoading(false);
    };

    fetchToken();
    // Refresh token periodically? Clerk handles this, but we need to call getToken() to get fresh one.
    // Ideally we should use a mechanism to get token on demand, but context exposing 'sessionToken' string implies it's static-ish.
    // For socket, we probably need a valid one at connection time.

    // Set up an interval to refresh token if needed, or just let it be.
    // Refresh every 3 min — Clerk tokens expire in ~4-5 min, so we need to stay ahead
    const interval = setInterval(fetchToken, 3 * 60 * 1000);
    return () => clearInterval(interval);

  }, [isSignedIn, authLoaded, getToken]);

  const loading = !userLoaded || !authLoaded || tokenLoading;

  return (
    <SessionAuthContext.Provider value={{
      user: user || null,
      sessionToken,
      loading,
      refreshToken: async () => {
        if (isSignedIn) {
          try { setSessionToken(await getToken()); } catch (e) { console.error('Failed to refresh token:', e); }
        }
      },
      loginWithSession: async () => { }, // No-op
      logoutWithSession: async () => { } // No-op
    }}>
      {children}
    </SessionAuthContext.Provider>
  );
}

export const useSessionAuth = () => useContext(SessionAuthContext);