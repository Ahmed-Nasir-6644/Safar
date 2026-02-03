import { Map, ArrowRightLeft, CreditCard, Clock, ChevronRight, ShoppingBag, Landmark, Briefcase, Trees, ArrowRight } from 'lucide-react';

const MapExploreSection = () => {
    const locations = [
        { id: 1, name: "Centaurus Mall", type: "Shopping", icon: <ShoppingBag className="w-5 h-5" /> },
        { id: 2, name: "Faisal Mosque", type: "Landmark", icon: <Landmark className="w-5 h-5" /> },
        { id: 3, name: "Blue Area", type: "Business", icon: <Briefcase className="w-5 h-5" /> },
        { id: 4, name: "Rawal Lake", type: "Nature", icon: <Trees className="w-5 h-5" /> },
    ];

    return (
        <section className="py-20 bg-white my-container">
            <div className="flex flex-col lg:flex-row items-center gap-12">
                {/* Text Content */}
                <div className="lg:w-1/2 text-left">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-orange-50 rounded-full text-accent-orange text-sm font-semibold mb-6 border border-orange-100">
                        <Map className="w-4 h-4" />
                        <span>Interactive Map</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                        Explore the City <br /> Like Never Before.
                    </h2>
                    <p className="text-lg text-secondary-gray mb-8 leading-relaxed">
                        Discover key landmarks, metro stations, and popular spots directly on our interactive map. Plan your trip visually.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {locations.map((loc) => (
                            <div key={loc.id} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors group">
                                <div className="p-2 bg-white rounded-lg text-gray-400 group-hover:text-accent-orange shadow-sm transition-colors">
                                    {loc.icon}
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-gray-900">{loc.name}</span>
                            </div>
                        ))}
                    </div>

                    <button className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl shadow-lg hover:bg-black hover:scale-105 transition-all flex items-center space-x-2">
                        <span>Open Full Map</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Map Visual */}
                <div className="lg:w-1/2 relative">
                    <div className="absolute -inset-4 bg-accent-orange/20 rounded-3xl blur-2xl -z-10"></div>
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-video bg-gray-100 group cursor-pointer">
                        {/* Placeholder Map Image - Using a gradient for now, replace with actual map image/component */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                        <div className="absolute bottom-6 left-6 text-white">
                            <p className="text-sm font-medium uppercase tracking-wider text-orange-400">Live View</p>
                            <h3 className="text-2xl font-bold">Islamabad Metro Network</h3>
                        </div>

                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/50 group-hover:scale-110 transition-transform">
                            <Map className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
export default MapExploreSection;
