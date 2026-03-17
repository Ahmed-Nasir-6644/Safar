import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import AuthPage from './pages/AuthPage';
import FindRoutePage from './pages/FindRoutePage'; // Keep existing import for now, will be replaced in route
import FindRoutesPage from './pages/FindRoutesPage'; // New import as per instruction
import NetworkMapPage from './pages/NetworkMapPage';
import HistoryPage from './pages/HistoryPage';
import FavoriteRoutesPage from './pages/FavoriteRoutesPage';
import HelpPage from './pages/HelpPage';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { GlobalProvider, useGlobalContext } from './context/GlobalContext';
import { isAuthenticated } from './utils/auth';
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

  // Use robust authentication check instead of just checking user
  const authenticated = isAuthenticated(user);

  // Define routes that should be accessible when not authenticated
  const publicRoutes = ['/login', '/'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // If not authenticated and trying to access protected route, show Auth Page
  if (!authenticated) {
    console.log('User not authenticated, redirecting to login');
    return <AuthPage />;
  }

  // If not authenticated but accessing public route, render the router
  if (!authenticated) {
    console.log('User not authenticated, showing public routes');
    return (
      <div className="font-poppins flex flex-col min-h-screen">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<AuthPage />} />
          {/* Redirect all other routes to login when not authenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="font-poppins flex flex-col min-h-screen">
      <Navbar />
      <ChatWidget />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<MainPage />} />
          {/* Since we are gated, /login should just redirect to home if accessed while logged in */}
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/find-routes" element={<FindRoutesPage />} /> {/* Changed from FindRoutePage to FindRoutesPage */}
          <Route path="/network-map" element={<NetworkMapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/favorites" element={<FavoriteRoutesPage />} />
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
