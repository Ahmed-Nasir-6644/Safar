import React from 'react';

const SearchBar = () => {
    return (
        <div className="w-full max-w-[90%] md:max-w-[60vw] mx-auto my-[4vh] relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[1.5rem] w-[1.5rem] md:h-[1.8vw] md:w-[1.8vw] text-gray-400 group-focus-within:text-accent transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                className="block w-full pl-12 pr-12 py-[1.2rem] md:py-[1.5vh] text-[1rem] md:text-[1.2vw] rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 backdrop-blur-md shadow-lg"
                placeholder="Where do you want to go?"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-[1.5rem] w-[1.5rem] md:h-[1.8vw] md:w-[1.8vw] text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <p className="text-center mt-3 text-[0.875rem] md:text-[0.9vw] text-gray-400">
                Try: <span className="text-secondary-highlight cursor-pointer hover:underline">Bahria University to Faizabad</span>
            </p>
        </div>
    );
};

export default SearchBar;
