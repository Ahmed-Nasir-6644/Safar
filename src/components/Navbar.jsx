import React, { useState } from 'react';
import { Home, Route, Map, Menu, X, User, Settings, LogOut, LogIn, UserPlus, Users, History, HelpCircle, Heart } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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

                    <button className="relative text-gray-400 hover:text-accent-orange transition-colors">
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </button>
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
