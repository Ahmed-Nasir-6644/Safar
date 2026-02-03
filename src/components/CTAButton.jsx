import React from 'react';

const CTAButton = () => {
    return (
        <div className="flex justify-center mt-[4vh]">
            <button className="px-[2.5rem] py-[1rem] md:px-[3vw] md:py-[1.2vw] bg-accent hover:bg-[#25b8ab] text-[#0F1C2E] text-[1.125rem] md:text-[1.2vw] font-bold rounded-full shadow-[0_4px_14px_0_rgba(47,212,197,0.39)] hover:shadow-[0_6px_20px_rgba(47,212,197,0.23)] hover:-translate-y-1 transition-all duration-300">
                Plan My Route
            </button>
        </div>
    );
};

export default CTAButton;
