import React from 'react';
import { Search, Bus, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import useRoutes from '../hooks/useRoutes';
import { routesAPI } from '../utils/api';

const RouteSearchSection = () => {
    const navigate = useNavigate();
    const { t } = useGlobalContext();

    return (
        <section id="find-route" className="py-20 bg-gray-50 my-container">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-[2rem] md:text-[2.5vw] font-bold text-gray-900 mb-6">
                        {t('findBestRouteTitle') || 'Find Your Best Route'}
                    </h2>
                    <p className="text-secondary-gray text-lg mb-10 leading-relaxed">
                        {t('findBestRouteDesc') || 'Discover the most efficient connections across the MetroMate network. Enter your trip details to see optimized routes, travel times, and transfer points.'}
                    </p>

                    <button
                        onClick={() => navigate('/find-routes')}
                        className="inline-flex items-center gap-3 px-10 py-5 bg-accent-orange text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300"
                    >
                        <Search className="w-6 h-6" />
                        <span>Find Routes</span>
                    </button>

                    {/* Visual decoration */}
                    <div className="mt-12 flex justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex flex-col items-center gap-2">
                            <Bus className="w-8 h-8 text-blue-500" />
                            <span className="text-xs font-medium text-gray-500">Metro Bus</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <TrendingUp className="w-8 h-8 text-green-500" />
                            <span className="text-xs font-medium text-gray-500">Fastest Path</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Clock className="w-8 h-8 text-purple-500" />
                            <span className="text-xs font-medium text-gray-500">Real-time</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RouteSearchSection;
