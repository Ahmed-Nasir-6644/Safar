import React, { useState, useEffect } from 'react';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import Loader from './components/Loader';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate initial app loading (splash screen)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="font-poppins">
      <MainPage />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
