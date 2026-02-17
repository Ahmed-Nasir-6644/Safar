import { Map, ArrowRightLeft, CreditCard, Clock, ChevronRight, ShoppingBag, Landmark, Briefcase, Trees, ArrowRight } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MapExploreSection = () => {
    const { t } = useGlobalContext();
    const navigate = useNavigate();
    const [randomStops, setRandomStops] = useState([]);

    // Icons for different types of locations
    const iconTypes = [
        { icon: <ShoppingBag className="w-5 h-5" />, type: t("shopping") || "Shopping" },
        { icon: <Landmark className="w-5 h-5" />, type: t("landmark") || "Landmark" },
        { icon: <Briefcase className="w-5 h-5" />, type: t("business") || "Business" },
        { icon: <Trees className="w-5 h-5" />, type: t("nature") || "Transit" },
    ];

    // Load random stops from stops.geojson
    useEffect(() => {
        fetch('/stops.geojson')
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    // Shuffle and pick 4 random stops
                    const shuffled = [...data.features].sort(() => 0.5 - Math.random());
                    const selected = shuffled.slice(0, 4).map((feature, index) => ({
                        id: index + 1,
                        name: feature.properties.stop_name,
                        type: iconTypes[index].type,
                        icon: iconTypes[index].icon,
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0]
                    }));
                    setRandomStops(selected);
                } else {
                    // Fallback to hardcoded locations if no data
                    setRandomStops([
                        { id: 1, name: "Centaurus Mall", type: iconTypes[0].type, icon: iconTypes[0].icon },
                        { id: 2, name: "Faisal Mosque", type: iconTypes[1].type, icon: iconTypes[1].icon },
                        { id: 3, name: "Blue Area", type: iconTypes[2].type, icon: iconTypes[2].icon },
                        { id: 4, name: "Rawal Lake", type: iconTypes[3].type, icon: iconTypes[3].icon },
                    ]);
                }
            })
            .catch(err => {
                console.error("Could not load stops for preview:", err);
                // Fallback to hardcoded locations
                setRandomStops([
                    { id: 1, name: "Centaurus Mall", type: iconTypes[0].type, icon: iconTypes[0].icon },
                    { id: 2, name: "Faisal Mosque", type: iconTypes[1].type, icon: iconTypes[1].icon },
                    { id: 3, name: "Blue Area", type: iconTypes[2].type, icon: iconTypes[2].icon },
                    { id: 4, name: "Rawal Lake", type: iconTypes[3].type, icon: iconTypes[3].icon },
                ]);
            });
    }, []);

    // Navigate to Network Map with specific stop
    const handleStopClick = (stop) => {
        if (stop.lat && stop.lng) {
            navigate(`/network-map?stop=${encodeURIComponent(stop.name)}&lat=${stop.lat}&lng=${stop.lng}`);
        } else {
            navigate('/network-map');
        }
    };

    // Navigate to Network Map
    const handleOpenMap = () => {
        navigate('/network-map');
    };

    return (
        <section className="py-20 bg-white my-container">
            <div className="flex flex-col lg:flex-row items-center gap-12">
                {/* Text Content */}
                <div className="lg:w-1/2 text-left">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-orange-50 rounded-full text-accent-orange text-sm font-semibold mb-6 border border-orange-100">
                        <Map className="w-4 h-4" />
                        <span>{t('interactiveMap')}</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                        {t('exploreCityTitle')}
                    </h2>
                    <p className="text-lg text-secondary-gray mb-8 leading-relaxed">
                        {t('exploreCityDesc')}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {randomStops.map((loc) => (
                            <button
                                key={loc.id}
                                onClick={() => handleStopClick(loc)}
                                className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors group cursor-pointer text-left"
                            >
                                <div className="p-2 bg-white rounded-lg text-gray-400 group-hover:text-accent-orange shadow-sm transition-colors">
                                    {loc.icon}
                                </div>
                                <div className="flex-grow">
                                    <span className="font-medium text-gray-700 group-hover:text-gray-900 block">{loc.name}</span>
                                    <span className="text-xs text-gray-500">{loc.type}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleOpenMap}
                        className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl shadow-lg hover:bg-black hover:scale-105 transition-all flex items-center space-x-2"
                    >
                        <span>{t('openFullMap')}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Map Visual */}
                <div className="lg:w-1/2 relative">
                    <div className="absolute -inset-4 bg-accent-orange/20 rounded-3xl blur-2xl -z-10"></div>
                    <button
                        onClick={handleOpenMap}
                        className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-video bg-gray-100 group cursor-pointer w-full"
                    >
                        {/* Placeholder Map Image - Using a gradient for now, replace with actual map image/component */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                        <div className="absolute bottom-6 left-6 text-white">
                            <p className="text-sm font-medium uppercase tracking-wider text-orange-400">{t('liveView')}</p>
                            <h3 className="text-2xl font-bold">{t('islamabadMetroNetwork')}</h3>
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/50 group-hover:scale-110 transition-transform">
                            <Map className="w-8 h-8" />
                        </div>
                    </button>
                </div>
            </div>
        </section>
    );
};
export default MapExploreSection;
