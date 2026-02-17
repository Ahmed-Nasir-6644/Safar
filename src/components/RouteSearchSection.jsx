import React from 'react';
import { MapPin, ArrowRightLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';

const RouteSearchSection = () => {
    const navigate = useNavigate();
    const { t } = useGlobalContext();

    return (
        <section id="find-route" className="py-20 bg-gray-50 my-container">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                <div className="text-center mb-10">
                    <h2 className="text-[2rem] md:text-[2.5vw] font-bold text-gray-900 mb-4">
                        {t('findBestRouteTitle')}
                    </h2>
                    <p className="text-secondary-gray text-lg max-w-2xl mx-auto">
                        {t('findBestRouteDesc')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-4xl mx-auto bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    {/* From Input */}
                    <div className="flex-1 w-full relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('fromPlaceholder')}
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Swap Icon */}
                    <div className="p-2 bg-white rounded-full border border-gray-200 shadow-sm text-gray-400">
                        <ArrowRightLeft className="w-5 h-5" />
                    </div>

                    {/* To Input */}
                    <div className="flex-1 w-full relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={t('toPlaceholder')}
                            className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent-orange/20 focus:border-accent-orange transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={() => navigate('/find-routes')}
                        className="w-full md:w-auto px-8 py-4 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 min-w-[160px]"
                    >
                        <Search className="w-5 h-5" />
                        <span>{t('searchButton')}</span>
                    </button>
                </div>
            </div>

            <div className="flex justify-center flex-wrap gap-8 md:gap-16 mt-12 text-center">
                <div>
                    <div className="text-[2rem] font-bold text-gray-900">{t('stationsCount')}</div>
                    <div className="text-sm text-secondary-gray uppercase tracking-wider font-medium">{t('stationsLabel')}</div>
                </div>
                <div>
                    <div className="text-[2rem] font-bold text-gray-900">{t('linesCount')}</div>
                    <div className="text-sm text-secondary-gray uppercase tracking-wider font-medium">{t('linesLabel')}</div>
                </div>
                <div>
                    <div className="text-[2rem] font-bold text-gray-900">{t('commutersCount')}</div>
                    <div className="text-sm text-secondary-gray uppercase tracking-wider font-medium">{t('commutersLabel')}</div>
                </div>
            </div>
        </section>
    );
};

export default RouteSearchSection;
