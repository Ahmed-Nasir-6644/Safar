import React from 'react';
import { MapPin, Brain, CheckCircle, TrainFront } from 'lucide-react';

const HowItWorksSection = () => {
    const steps = [
        { title: "Enter Destination", description: "Type where you want to go in Islamabad or Rawalpindi.", icon: <MapPin className="h-8 w-8" /> },
        { title: "Smart Analysis", description: "Our AI finds the fastest Metro & feeder routes.", icon: <Brain className="h-8 w-8" /> },
        { title: "Choose Option", description: "Select the cheapest or fastest travel plan.", icon: <CheckCircle className="h-8 w-8" /> },
        { title: "Travel Safely", description: "Get real-time updates and travel with confidence.", icon: <TrainFront className="h-8 w-8" /> }
    ];

    return (
        <section id="how-it-works" className="py-20 bg-gray-50 my-container">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    How MetroMate Works
                </h2>
                <p className="text-secondary-gray max-w-2xl mx-auto text-lg">
                    Navigate the city like a pro in just 4 simple steps.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center text-center group">
                        <div className="w-20 h-20 rounded-full border-2 border-gray-200 flex items-center justify-center mb-6 group-hover:border-accent-orange group-hover:bg-accent-orange group-hover:text-white transition-all duration-300 bg-white shadow-sm group-hover:shadow-orange-500/30">
                            {/* Render the icon component directly if it's a React element, or use it as a component */}
                            {React.cloneElement(step.icon, { className: "w-8 h-8 text-gray-700 group-hover:text-white transition-colors duration-300" })}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-accent-orange transition-colors duration-300">
                            {step.title}
                        </h3>
                        <p className="text-secondary-gray leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HowItWorksSection;
