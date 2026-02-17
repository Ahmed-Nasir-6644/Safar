import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import FindRoutePage from './pages/FindRoutePage';
import NetworkMapPage from './pages/NetworkMapPage';
import HistoryPage from './pages/HistoryPage';
import HelpPage from './pages/HelpPage';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SOSButton from './components/SOSButton';
import { GlobalProvider, useGlobalContext } from './context/GlobalContext';
import ChatWidget from './components/ChatWidget';
function AppLayout() {
  const location = useLocation();
  const { user, loading } = useGlobalContext();
  const [appLoading, setAppLoading] = useState(true);

  // Initial splash screen simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (appLoading || loading) {
    return <Loader />;
  }

  // If not authenticated, show Auth Page immediately (gated)
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="font-poppins flex flex-col min-h-screen">
      <Navbar />
      <SOSButton />
      <ChatWidget />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<MainPage />} />
          {/* Since we are gated, /login should just redirect to home if accessed while logged in */}
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/find-routes" element={<FindRoutePage />} />
          <Route path="/network-map" element={<NetworkMapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <GlobalProvider>
      <Router>
        <AppLayout />
      </Router>
    </GlobalProvider>
  );
}

export default App;
