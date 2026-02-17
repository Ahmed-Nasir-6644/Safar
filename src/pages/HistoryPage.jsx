import React from 'react';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';

const HistoryPage = () => {
    const { history, t } = useGlobalContext();

    return (
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{t('tripHistory')}</h1>
                    <span className="px-3 py-1 bg-orange-100 text-accent-orange rounded-full text-sm font-medium">
                        {history.length} {t('trips')}
                    </span>
                </div>

                <div className="space-y-4">
                    {history.length > 0 ? (
                        history.map((trip) => (
                            <div key={trip.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                                <div className="w-0.5 h-6 bg-gray-100"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-accent-orange"></div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="font-medium text-gray-900">{trip.from}</p>
                                                <p className="font-medium text-gray-900">{trip.to}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-6 min-w-[120px]">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>{trip.date}</span>
                                        </div>
                                        <div className="text-lg font-bold text-accent-orange font-mono">
                                            {trip.fare}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">{t('noTrips')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
