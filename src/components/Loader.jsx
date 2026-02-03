import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = () => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[100]">
            <div className="relative flex flex-col items-center">
                {/* Logo/Icon Animation */}
                <div className="w-20 h-20 bg-accent-orange rounded-full flex items-center justify-center text-white shadow-2xl animate-bounce mb-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>

                {/* Text Animation */}
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight animate-pulse">
                    MetroMate
                </h1>
                <p className="mt-4 text-secondary-gray font-medium">
                    Your Journey, Simplified.
                </p>

                {/* Spinner */}
                <div className="mt-8">
                    <Loader2 className="w-8 h-8 text-accent-orange animate-spin" />
                </div>
            </div>
        </div>
    );
};

export default Loader;
