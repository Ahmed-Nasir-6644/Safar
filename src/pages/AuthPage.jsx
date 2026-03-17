import React, { useEffect, useState } from 'react';
import { User, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, signup, user } = useGlobalContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [verificationPopup, setVerificationPopup] = useState({ show: false, success: true, message: '' });

    useEffect(() => {
        const search = location.search || window.location.search;
        const hashQuery = window.location.hash.includes('?')
            ? window.location.hash.slice(window.location.hash.indexOf('?'))
            : '';
        const params = new URLSearchParams(search || hashQuery);
        const emailVerified = params.get('emailVerified');

        if (!emailVerified) {
            return;
        }

        if (emailVerified === 'success') {
            setIsLogin(true);
            setVerificationPopup({
                show: true,
                success: true,
                message: 'Your email has been verified. Please login to continue.',
            });
            setSuccessMessage('Your email has been verified. Please login to continue.');
        } else {
            setVerificationPopup({
                show: true,
                success: false,
                message: 'Email verification failed or link has expired. Please sign up again.',
            });
        }

        navigate('/', { replace: true });
    }, [location.search, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setAuthError('');
        setSuccessMessage('');
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                const signupResponse = await signup(name, email, password);
                // On successful signup, switch to login mode
                setSuccessMessage(signupResponse?.message || 'Signup successful. Please check your email for the verification link.');
                setIsLogin(true);
                setName('');
                setEmail('');
                setPassword('');
            }
        } catch (error) {
            console.error("Auth failed", error);
            setAuthError(error.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            {verificationPopup.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className={`text-lg font-semibold ${verificationPopup.success ? 'text-green-700' : 'text-red-700'}`}>
                            {verificationPopup.success ? 'Email Verified' : 'Verification Failed'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">{verificationPopup.message}</p>
                        <button
                            onClick={() => setVerificationPopup({ show: false, success: true, message: '' })}
                            className={`mt-5 w-full rounded-lg px-4 py-2 text-white ${verificationPopup.success ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} transition-colors`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative">
                {/* Header Pattern */}
                <div className="h-32 bg-accent-orange relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 -left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                        <h2 className="text-2xl font-bold tracking-tight">MetroMate</h2>
                        <p className="text-white/90 text-sm">Welcome Back</p>
                    </div>
                </div>

                <div className="p-8 pt-10">
                    <div className="flex justify-center mb-8 bg-gray-100 p-1 rounded-full w-fit mx-auto">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isLogin ? 'bg-white text-accent-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${!isLogin ? 'bg-white text-accent-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-accent-orange text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>{isLogin ? 'Login' : 'Create Account'}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {authError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {authError}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            {successMessage}
                        </div>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="text-accent-orange font-medium hover:underline">
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
