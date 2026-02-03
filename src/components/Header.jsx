import React from 'react';

const Header = () => {
    return (
        <header className="flex flex-col items-center justify-center pt-[5vh] pb-[3vh] text-center space-y-2">
            <div className="flex items-center space-x-2">
                {/* Simple Metro Icon placeholder */}
                <div className="w-[3rem] h-[3rem] md:w-[4vw] md:h-[4vw] bg-accent rounded-full flex items-center justify-center opacity-90 shadow-[0_0_15px_rgba(47,212,197,0.5)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[1.5rem] w-[1.5rem] md:h-[2vw] md:w-[2vw] text-primary-bg-start" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h1 className="text-[2rem] md:text-[3.5vw] font-bold tracking-tight text-white drop-shadow-lg">
                    MetroMate
                </h1>
            </div>
            <p className="text-[1rem] md:text-[1.2vw] text-gray-300 font-light tracking-wide">
                AI-Powered Public Transport Assistant
            </p>
            <div className="flex items-center text-[0.875rem] md:text-[0.9vw] text-accent font-medium bg-white/5 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10 mt-2">
                <span className="mr-2">📍</span> Islamabad • Rawalpindi
            </div>
        </header>
    );
};

export default Header;
