import React from 'react';

const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-[1.5rem] md:p-[2vw] hover:bg-white/10 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm cursor-pointer flex flex-col items-center text-center h-full">
            <div className="text-[2.5rem] md:text-[3vw] mb-[1rem] md:mb-[1.5vh] group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-[1.125rem] md:text-[1.2vw] font-semibold text-white mb-2">
                {title}
            </h3>
            <p className="text-[0.875rem] md:text-[0.9vw] text-gray-400 font-light">
                {description}
            </p>
        </div>
    );
};

export default FeatureCard;
