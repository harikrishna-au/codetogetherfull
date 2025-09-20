import ActiveUserCount from '@/components/ActiveUserCount';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { fetchUserState } from '@/lib/userState';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import Footer from '@/components/landing/Footer';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';



const Index = () => {
  const [selectedMode, setSelectedMode] = useState<'friendly' | 'challenge' | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const { user } = useSessionAuth();
  const navigate = useNavigate();

  const [userState, setUserState] = useState(null);
  useEffect(() => {
    if (!user) return;
    fetchUserState(user.uid).then(state => {
      setUserState(state);
      if (state && state.state === 'waiting' && state.mode && state.difficulty) {
        // Redirect to matchmaking page to show waiting screen
        navigate('/matchmaking', { state: { mode: state.mode, difficulty: state.difficulty } });
      }
    });
  }, [user, navigate]);

  useEffect(() => {
    if (
      userState &&
      (userState.state === 'matched' || userState.state === 'in-session') &&
      userState.roomId
    ) {
      navigate(`/session/${userState.roomId}`, { state: { mode: userState.mode, difficulty: userState.difficulty } });
    }
  }, [userState, navigate]);

  return (
    <>
  {user && <ActiveUserHeartbeat userId={user.uid} />}
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <Header />
    <div className="flex flex-col items-center justify-center pt-8">
      <ActiveUserCount />
    </div>
    <HeroSection
      selectedMode={selectedMode}
      setSelectedMode={setSelectedMode}
      selectedDifficulty={selectedDifficulty}
      setSelectedDifficulty={setSelectedDifficulty}
    />
    <FeaturesSection />
    <Footer />
  </div>
    </>
  );
};

export default Index;
