import React from 'react';

const HeroSection = () => {
    return (
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center pt-20 my-container bg-white">
            <h1 className="text-[3rem] md:text-[5vw] font-bold text-gray-900 leading-tight max-w-4xl">
                MetroMate
            </h1>
            <p className="text-xl md:text-2xl text-secondary-gray mt-4 max-w-2xl">
                Your smart companion for seamless daily commuting.
            </p>
            <p className="text-gray-500 mt-2">
                Real-time updates. Smart routing. Cashless payments.
            </p>

            <button className="mt-10 px-8 py-4 bg-accent-orange text-white text-lg font-semibold rounded-full shadow-xl shadow-orange-500/30 hover:scale-105 hover:bg-orange-600 transition-all duration-300">
                Plan Your Route
            </button>

   
        </section>
    );
};

export default HeroSection;
