import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { API_ENDPOINTS } from '@/lib/api';

interface SessionAuthContextValue {
  user: User | null;
  sessionToken: string | null;
  loading: boolean;
  loginWithSession: () => Promise<void>;
  logoutWithSession: () => Promise<void>;
}

const SessionAuthContext = createContext<SessionAuthContextValue>({
  user: null,
  sessionToken: null,
  loading: true,
  loginWithSession: async () => {},
  logoutWithSession: async () => {},
});

export const SessionAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const res = await fetch(API_ENDPOINTS.SESSION_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
            credentials: 'include',
          });
          if (res.ok) {
            setSessionToken('cookie');
            setBackendError(false);
          } else {
            setSessionToken(null);
            setBackendError(true);
          }
        } catch (err) {
          setSessionToken(null);
          setBackendError(true);
        }
        console.log('Session details:', {
          user: firebaseUser,
          sessionToken: 'cookie',
          sessionId: firebaseUser.uid,
        });
      } else {
        setSessionToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithSession = async () => {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Not signed in');
    const idToken = await firebaseUser.getIdToken();
    const res = await fetch(API_ENDPOINTS.SESSION_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Session login failed');
    setSessionToken('cookie');
    console.log('Session details:', {
      user: firebaseUser,
      sessionToken: 'cookie',
      sessionId: firebaseUser.uid,
    });
  };

  const logoutWithSession = async () => {
    await fetch(API_ENDPOINTS.SESSION_LOGOUT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    setSessionToken(null);
    await getAuth().signOut();
  };

  return (
    <SessionAuthContext.Provider value={{ user, sessionToken, loading, loginWithSession, logoutWithSession }}>
      {backendError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.85)',
          color: 'white',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          flexDirection: 'column',
        }}>
          <div>Site is not working. Please try again later.</div>
        </div>
      )}
      {children}
    </SessionAuthContext.Provider>
  );
}

export const useSessionAuth = () => useContext(SessionAuthContext);