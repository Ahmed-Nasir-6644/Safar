import React, { useState } from 'react';
import { Home, Route, Map, Menu, X, User, Settings, LogOut, LogIn, UserPlus, Users, History, HelpCircle, AlertCircle, Heart } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SOSButton from './SOSButton';
import { notificationsData } from '../data/notifications';
const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout, language, toggleLanguage, t } = useGlobalContext();
    const location = useLocation();
    const navigate = useNavigate();
    const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';

    const navItems = [
        { name: t('home'), icon: <Home className="w-5 h-5" />, path: "/" },
        { name: t('findRoutes'), icon: <Route className="w-5 h-5" />, path: "/find-routes" },
        { name: t('networkMap'), icon: <Map className="w-5 h-5" />, path: "/network-map" },
        { name: t('help'), icon: <HelpCircle className="w-5 h-5" />, path: "/help" },
    ];

    const isActive = (path) => location.pathname === path;

    const [notifications, setNotifications] = useState([notificationsData[0]]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(1);

    // Add a new random notification every 15 minutes (900000 ms)
    React.useEffect(() => {
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * notificationsData.length);
            const newNotification = {
                ...notificationsData[randomIndex],
                id: Date.now() // Ensure unique ID for list rendering
            };

            setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep max 10
            setUnreadCount(prev => prev + 1);
        }, 900000); // 15 minutes

        return () => clearInterval(interval);
    }, []);

    const handleNotificationClick = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        if (!isNotificationsOpen) {
            setUnreadCount(0);
        }
    };

    return (
        <nav className="absolute top-0 left-0 w-full flex items-center justify-between py-4 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 my-container">
            {/* Logo area */}
            <Link to="/" className="flex items-center space-x-2 mr-8">
                <div className="w-9 h-9 bg-accent-orange rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div className="text-xl font-bold text-gray-900 tracking-tight">
                    MetroMate
                </div>
            </Link>

            {/* Center Navigation - Desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1">
                <div className="flex items-center space-x-8">
                    {navItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-300
                            ${isActive(item.path)
                                    ? 'text-accent-orange font-semibold'
                                    : 'text-secondary-gray hover:text-accent-orange'
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Right Side - Auth / Profile */}
            <div className="hidden lg:flex items-center space-x-6">
                {/* Extras: Lang + Notifications */}
                <div className="flex items-center space-x-4 border-r border-gray-200 pr-6 mr-2">
                    <button
                        onClick={toggleLanguage}
                        className="font-semibold text-sm text-gray-700 hover:text-accent-orange transition-colors uppercase"
                    >
                        {language === 'en' ? t('englishAbbr') : t('urduAbbr')}
                    </button>

                    <div className="relative flex items-center">
                        <button
                            onClick={handleNotificationClick}
                            className="relative flex items-center justify-center text-gray-400 hover:text-accent-orange transition-colors focus:outline-none"
                        >
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotificationsOpen && (
                            <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
                                <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <p className="font-semibold text-gray-900">Notifications</p>
                                    <span className="text-xs text-secondary-gray bg-gray-100 px-2 py-1 rounded-full">{notifications.length}</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="px-5 py-8 text-center text-secondary-gray text-sm">
                                            No new notifications
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div key={notif.id} className="px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start space-x-3">
                                                <div className="text-xl mt-0.5">{notif.icon}</div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                                    <p className="text-xs text-secondary-gray mt-1 leading-relaxed">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">Just now</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="border-t border-gray-100 pt-2 px-5 pb-2">
                                        <button
                                            onClick={() => setNotifications([])}
                                            className="w-full text-center text-xs text-accent-orange hover:text-orange-600 font-medium py-1"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {user && (
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center space-x-3 focus:outline-none"
                        >
                            <div className="w-10 h-10 rounded-full bg-accent-orange text-white flex items-center justify-center font-bold text-lg shadow-md hover:scale-105 transition-transform border-4 border-white">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-200">
                                <div className="px-5 py-3 border-b border-gray-100">
                                    <p className="font-semibold text-gray-900">{displayName}</p>
                                    <p className="text-xs text-secondary-gray">{user.email}</p>
                                </div>
                                <div className="py-2">
                                    <Link to="/history" className="flex items-center space-x-3 px-5 py-2.5 text-sm text-secondary-gray hover:bg-orange-50 hover:text-accent-orange transition-colors">
                                        <History className="w-4 h-4" />
                                        <span>{t('myHistory')}</span>
                                    </Link>
                                    <SOSButton>
                                        <button className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Emergency SOS</span>
                                        </button>
                                    </SOSButton>

                                    <Link to="/favorites" className="flex items-center space-x-3 px-5 py-2.5 text-sm text-secondary-gray hover:bg-orange-50 hover:text-accent-orange transition-colors">
                                        <Heart className="w-4 h-4" />
                                        <span>{t('myFavorites')}</span>
                                    </Link>
                                </div>
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsProfileOpen(false);
                                            navigate('/');
                                        }}
                                        className="w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>{t('logout')}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Menu Button */}
            <button className="lg:hidden text-gray-900 p-2" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>

            {/* Mobile Menu Overlay */}
            <div className={`fixed top-0 right-0 w-screen h-[100dvh] z-[9999] bg-gray-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col min-h-full my-container py-6 overflow-y-auto">
                    {/* Header in Mobile Menu */}
                    <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
                                M
                            </div>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">MetroMate</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-500 hover:text-accent-orange transition-colors rounded-full hover:bg-gray-100"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col space-y-8 flex-grow justify-center items-center py-10">
                        {navItems.map((item, index) => (
                            <Link
                                key={index}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={`text-3xl font-bold transition-colors ${isActive(item.path) ? 'text-accent-orange' : 'text-gray-800 hover:text-accent-orange'}`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons Mobile */}
                    <div className="mt-auto space-y-4 pb-4 flex-shrink-0">
                        {user && (
                            <div className="flex flex-col space-y-4 items-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-accent-orange text-white flex items-center justify-center font-bold text-xl border-4 border-white shadow-sm">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-900 text-lg leading-tight">{displayName}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex w-full gap-3">
                                    <Link to="/history" onClick={() => setIsOpen(false)} className="flex-1 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-center">
                                        {t('myHistory')}
                                    </Link>
                                    <Link to="/favorites" onClick={() => setIsOpen(false)} className="flex-1 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-center">
                                        {t('myFavorites')}
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsOpen(false);
                                            navigate('/');
                                        }}
                                        className="flex-1 py-3 bg-white text-red-500 font-semibold rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
