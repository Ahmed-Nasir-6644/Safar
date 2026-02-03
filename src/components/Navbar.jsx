import React, { useState } from 'react';
import { Home, Route, Map, Menu, X, ChevronDown, User, Settings, LogOut, LogIn, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { user, logout } = useAuth();

    const navItems = [
        { name: "Home", icon: <Home className="w-5 h-5" />, active: true },
        { name: "Find Routes", icon: <Route className="w-5 h-5" />, active: false },
        { name: "Network Map", icon: <Map className="w-5 h-5" />, active: false },
    ];

    return (
        <nav className="absolute top-0 left-0 flex items-center justify-between py-4 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 my-container">
            {/* Logo area */}
            <div className="flex items-center space-x-2 mr-8">
                <div className="w-9 h-9 bg-accent-orange rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div className="text-xl font-bold text-gray-900 tracking-tight">
                    MetroMate
                </div>
            </div>

            {/* Center Navigation - Desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1">
                <div className="flex items-center space-x-8">
                    {navItems.map((item, index) => (
                        <a
                            key={index}
                            href="#"
                            className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-300
                            ${item.active
                                    ? 'text-accent-orange font-semibold'
                                    : 'text-secondary-gray hover:text-accent-orange'
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Right Side - Auth / Profile */}
            <div className="hidden lg:flex items-center space-x-6">
                {user ? (
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center space-x-3 focus:outline-none"
                        >
                            <div className="w-10 h-10 rounded-full bg-accent-orange text-white flex items-center justify-center font-bold text-lg shadow-md hover:scale-105 transition-transform border-4 border-white">
                                {user.name.charAt(0)}
                            </div>
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-4 duration-200">
                                <div className="px-5 py-3 border-b border-gray-100">
                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-xs text-secondary-gray">{user.email}</p>
                                </div>
                                <div className="py-2">
                                    <a href="#" className="flex items-center space-x-3 px-5 py-2.5 text-sm text-secondary-gray hover:bg-orange-50 hover:text-accent-orange transition-colors">
                                        <Users className="w-4 h-4" />
                                        <span>Profile Overview</span>
                                    </a>
                                    <a href="#" className="flex items-center space-x-3 px-5 py-2.5 text-sm text-secondary-gray hover:bg-orange-50 hover:text-accent-orange transition-colors">
                                        <Settings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </a>
                                </div>
                                <div className="border-t border-gray-100 mt-2 pt-2">
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <button className="flex items-center space-x-2 text-secondary-gray hover:text-accent-orange font-medium transition-colors text-sm">
                            <LogIn className="w-5 h-5" />
                            <span>Login</span>
                        </button>
                        <button className="flex items-center space-x-2 px-6 py-2.5 bg-accent-orange text-white rounded-full font-medium shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-105 transition-all duration-300 text-sm">
                            <UserPlus className="w-5 h-5" />
                            <span>Sign Up</span>
                        </button>
                    </>
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
                            <a
                                key={index}
                                href="#"
                                onClick={() => setIsOpen(false)}
                                className={`text-3xl font-bold transition-colors ${item.active ? 'text-accent-orange' : 'text-gray-800 hover:text-accent-orange'}`}
                            >
                                {item.name}
                            </a>
                        ))}
                    </div>

                    {/* Auth Buttons Mobile */}
                    <div className="mt-auto space-y-4 pb-4 flex-shrink-0">
                        {user ? (
                            <div className="flex flex-col space-y-4 items-center bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-accent-orange text-white flex items-center justify-center font-bold text-xl border-4 border-white shadow-sm">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-900 text-lg leading-tight">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex w-full gap-3">
                                    <button className="flex-1 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsOpen(false);
                                        }}
                                        className="flex-1 py-3 bg-white text-red-500 font-semibold rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-100 transition-colors shadow-sm"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <button className="w-full py-4 text-gray-700 font-semibold hover:text-accent-orange transition-colors border border-gray-200 rounded-xl">
                                    Log In
                                </button>
                                <button className="w-full py-4 bg-accent-orange text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors">
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
