import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';

const HeroSection = () => {
    const { t } = useGlobalContext();
    const navigate = useNavigate();

    const handlePlanRoute = () => {
        navigate('/network-map');
    };

    return (
        <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center pt-20 my-container bg-white">
            <h1 className="text-[3rem] md:text-[5vw] font-bold text-gray-900 leading-tight max-w-4xl">
                {t('welcomeTitle')}
            </h1>
            <p className="text-xl md:text-2xl text-secondary-gray mt-4 max-w-2xl">
                {t('welcomeSubtitle')}
            </p>
            <p className="text-gray-500 mt-2">
                {t('welcomeFeature')}
            </p>

            <button 
                onClick={handlePlanRoute}
                className="mt-10 px-8 py-4 bg-accent-orange text-white text-lg font-semibold rounded-full shadow-xl shadow-orange-500/30 hover:scale-105 hover:bg-orange-600 transition-all duration-300"
            >
                {t('planRoute')}
            </button>
        </section>
    );
};

export default HeroSection;
