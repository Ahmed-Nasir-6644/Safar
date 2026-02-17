import React, { useState } from 'react';
import { Search, Mic, MapPin, Navigation, Clock, Volume2 } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';

const FindRoutePage = () => {
    const { addHistoryItem, t } = useGlobalContext();
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [result, setResult] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!source || !destination) return;

        // Mock Result
        const newResult = {
            steps: [
                t("step1"),
                t("step2"),
                t("step3"),
                t("step4")
            ],
            fare: "$4.50",
            duration: "45 min"
        };
        setResult(newResult);
        addHistoryItem({
            id: Date.now(),
            from: source,
            to: destination,
            date: new Date().toISOString().split('T')[0],
            fare: newResult.fare
        });
    };

    const toggleVoice = () => {
        setIsListening(!isListening);
        if (!isListening) {
            setTimeout(() => {
                setIsListening(false);
                setSource("Central Station");
                setDestination("Airport");
            }, 2000);
        }
    };

    return (
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">{t('findRouteTitle')}</h1>
                    <p className="text-gray-500">{t('findRouteSubtitle')}</p>
                </div>

                {/* Search Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('startingPoint')}
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div className="relative">
                            <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('destination')}
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={toggleVoice}
                                className={`flex-1 py-3 px-4 rounded-xl border font-medium flex items-center justify-center gap-2 transition-all ${isListening ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Mic className="w-5 h-5" />
                                <span>{isListening ? t('listening') : t('voiceSearch')}</span>
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 px-4 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                <Search className="w-5 h-5" />
                                <span>{t('searchRoute')}</span>
                            </button>
                        </div>
                    </form>

                    {/* Dummy Audio Feedback */}
                    {isListening && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-500 italic text-center">
                            "Where would you like to go?"
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {/* Results Section */}
                {result && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 mb-20">
                        <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-accent-orange" />
                                <span className="font-bold">{result.duration}</span>
                            </div>
                            <div className="text-xl font-bold text-accent-orange font-mono">{result.fare}</div>
                        </div>

                        <div className="p-0">
                            {/* Map Placeholder */}
                            <div className="h-48 bg-gray-200 w-full relative group">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium">
                                    {t('mapVisualization')}
                                </div>
                                <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: 'url("https://via.placeholder.com/600x200")' }}></div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                    <h3 className="font-bold text-gray-900">{t('routeSteps')}</h3>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{t('distance')}: 12.4 km</span>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {result.steps.map((step, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-accent-orange"></div>
                                                {index !== result.steps.length - 1 && (
                                                    <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                                )}
                                            </div>
                                            <div className="text-gray-700 text-sm pb-2">
                                                {step}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Payment Section */}
                                <PaymentSection fare={result.fare} t={t} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PaymentSection = ({ fare, t }) => {
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success

    const handlePayment = () => {
        setPaymentStatus('processing');
        setTimeout(() => {
            setPaymentStatus('success');
        }, 1500);
    };

    if (paymentStatus === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Navigation className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-1">{t('ticketBooked')}</h3>
                <p className="text-green-600 text-sm mb-4">{t('qrGenerated')}</p>
                <div className="bg-white p-4 rounded-lg inline-block shadow-sm border border-gray-200">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=MetroMateTicket" alt="Ticket QR" className="w-24 h-24" />
                </div>
                <button
                    onClick={() => setPaymentStatus('idle')}
                    className="block mt-4 text-sm text-green-700 hover:underline mx-auto"
                >
                    {t('bookAnother')}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                {t('payFare')} <span className="text-accent-orange">{fare}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing'}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
                >
                    <div className="w-8 h-8 bg-green-100 rounded-full mb-2 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                        <span className="font-bold text-xs">EP</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">EasyPaisa</span>
                </button>

                <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing'}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group"
                >
                    <div className="w-8 h-8 bg-red-100 rounded-full mb-2 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                        <span className="font-bold text-xs">JC</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">JazzCash</span>
                </button>

                <button
                    onClick={handlePayment}
                    disabled={paymentStatus === 'processing'}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-100 transition-all group"
                >
                    <div className="w-8 h-8 bg-gray-100 rounded-full mb-2 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{t('payAtStation')}</span>
                </button>
            </div>

            {paymentStatus === 'processing' && (
                <div className="mt-4 text-center text-sm text-gray-500 animate-pulse">
                    {t('processing')}
                </div>
            )}
        </div>
    );
};


export default FindRoutePage;
