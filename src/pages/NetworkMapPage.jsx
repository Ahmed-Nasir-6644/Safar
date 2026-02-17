import React, { useState } from 'react';
import { Map, Info, Bus, Train, Eye, EyeOff, ZoomIn, ZoomOut, Maximize, Filter, ChevronRight, Layers } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';


const NetworkMapPage = () => {
    const { t } = useGlobalContext();
    const [lines, setLines] = useState([
        {
            id: 1,
            name: "orangeLineTrain",
            type: "train",
            color: "#F97316", // Orange-500
            route: "Ali Town - Dera Gujran",
            stops: ["Ali Town", "Thokar Niaz Baig", "Bund Road", "Lakshmi Chowk", "GPO", "Dera Gujran"],
            visible: true
        },
        {
            id: 2,
            name: "metroBusRed",
            type: "bus",
            color: "#EF4444", // Red-500
            route: "Gajumata - Shahdara",
            stops: ["Gajumata", "Kalma Chowk", "Canal", "MAO College", "Civil Secretariat", "Shahdara"],
            visible: true
        }
    ]);

    const toggleLine = (id) => {
        setLines(lines.map(line =>
            line.id === id ? { ...line, visible: !line.visible } : line
        ));
    };

    const toggleAll = (state) => {
        setLines(lines.map(line => ({ ...line, visible: state })));
    };

    const allVisible = lines.every(l => l.visible);

    return (
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50 flex flex-col font-sans">
            <div className="my-container flex-grow flex flex-col">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Map className="w-8 h-8 text-accent-orange" />
                        {t('mapTitle')}
                    </h1>
                    <p className="text-gray-500">{t('mapSubtitle')}</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-[600px] flex-grow">

                    {/* Sidebar Control Panel */}
                    <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4">
                        {/* Header Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-accent-orange font-bold text-lg">
                                    <Layers className="w-5 h-5" />
                                    <span>{t('activeRoutes')}</span>
                                </div>
                                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                    {lines.filter(l => l.visible).length} {t('visible')}
                                </span>
                            </div>

                            <button
                                onClick={() => toggleAll(!allVisible)}
                                className={`w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all font-semibold mb-6 ${allVisible
                                    ? 'bg-accent-orange text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Filter className="w-4 h-4" />
                                    {t('allLines')}
                                </span>
                                {allVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            <div className="space-y-3">
                                {lines.map((line) => (
                                    <div
                                        key={line.id}
                                        className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${line.visible
                                            ? 'bg-white border-orange-100 shadow-sm'
                                            : 'bg-gray-50 border-transparent opacity-60'
                                            }`}
                                        onClick={() => toggleLine(line.id)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full shadow-sm"
                                                    style={{ backgroundColor: line.color }}
                                                ></div>
                                                <span className={`font-bold text-sm ${line.visible ? 'text-gray-800' : 'text-gray-500'}`}>
                                                    {t(line.name)}
                                                </span>
                                            </div>
                                            {line.visible ? (
                                                <Eye className="w-4 h-4 text-accent-orange" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pl-6">
                                            {line.type === 'train' ? (
                                                <Train className="w-3 h-3 text-gray-400" />
                                            ) : (
                                                <Bus className="w-3 h-3 text-gray-400" />
                                            )}
                                            <span className="text-xs text-gray-500 truncate max-w-[150px]">{line.route}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-grow">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4 text-accent-orange" />
                                {t('legend')}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-white border-2 border-gray-400"></span>
                                    <span>{t('interchangeStation')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-white border-2 border-accent-orange"></span>
                                    <span>{t('regularStation')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Visual Area */}
                    <div className="flex-grow bg-gray-100 rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative group">
                        {/* Map Background simulated with a pattern or image */}
                        <div className="absolute inset-0 bg-[#eef2f5]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                        {/* Map Vector Layer */}
                        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                            {/* City Decoration (River/Roads) */}
                            <path d="M -50 450 C 200 400 400 550 850 400" stroke="#cbd5e1" strokeWidth="15" fill="none" strokeLinecap="round" />

                            {/* Orange Line Train */}
                            {lines.find(l => l.id === 1)?.visible && (
                                <g className="animate-in fade-in duration-500">
                                    {/* Line Shadow */}
                                    <path d="M 50 300 Q 200 150 400 300 T 750 300" stroke="rgba(249, 115, 22, 0.2)" strokeWidth="12" fill="none" />
                                    {/* Main Line */}
                                    <path d="M 50 300 Q 200 150 400 300 T 750 300" stroke="#F97316" strokeWidth="6" fill="none" strokeDasharray="1000" strokeDashoffset="0" />

                                    {/* Stops */}
                                    <circle cx="50" cy="300" r="5" fill="white" stroke="#F97316" strokeWidth="3" />
                                    <circle cx="225" cy="225" r="5" fill="white" stroke="#F97316" strokeWidth="3" />
                                    <circle cx="400" cy="300" r="8" fill="white" stroke="#F97316" strokeWidth="3" /> {/* Interchange */}
                                    <circle cx="575" cy="300" r="5" fill="white" stroke="#F97316" strokeWidth="3" />
                                    <circle cx="750" cy="300" r="5" fill="white" stroke="#F97316" strokeWidth="3" />

                                    {/* Labels */}
                                    <text x="50" y="325" textAnchor="middle" className="text-[10px] fill-gray-600 font-bold">Ali Town</text>
                                    <text x="750" y="325" textAnchor="middle" className="text-[10px] fill-gray-600 font-bold">Dera Gujran</text>
                                </g>
                            )}

                            {/* Metro Bus Red Line */}
                            {lines.find(l => l.id === 2)?.visible && (
                                <g className="animate-in fade-in duration-500">
                                    {/* Line Shadow */}
                                    <path d="M 400 50 C 400 200 350 400 400 550" stroke="rgba(239, 68, 68, 0.2)" strokeWidth="12" fill="none" />
                                    {/* Main Line */}
                                    <path d="M 400 50 C 400 200 350 400 400 550" stroke="#EF4444" strokeWidth="6" fill="none" />

                                    {/* Stops */}
                                    <circle cx="400" cy="50" r="5" fill="white" stroke="#EF4444" strokeWidth="3" />
                                    <circle cx="400" cy="180" r="5" fill="white" stroke="#EF4444" strokeWidth="3" />
                                    <circle cx="400" cy="300" r="6" fill="white" stroke="#EF4444" strokeWidth="3" /> {/* Intersection with Orange */}
                                    <circle cx="375" cy="420" r="5" fill="white" stroke="#EF4444" strokeWidth="3" />
                                    <circle cx="400" cy="550" r="5" fill="white" stroke="#EF4444" strokeWidth="3" />

                                    {/* Labels */}
                                    <text x="420" y="55" textAnchor="start" className="text-[10px] fill-gray-600 font-bold">Shahdara</text>
                                    <text x="420" y="550" textAnchor="start" className="text-[10px] fill-gray-600 font-bold">Gajumata</text>
                                </g>
                            )}

                            {/* Interchange Label */}
                            {lines[0].visible && lines[1].visible && (
                                <g>
                                    <rect x="420" y="290" width="80" height="20" rx="4" fill="white" stroke="#E5E7EB" />
                                    <text x="460" y="304" textAnchor="middle" className="text-[10px] fill-gray-800 font-bold">Interchange</text>
                                </g>
                            )}
                        </svg>

                        {/* Map Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <div className="bg-white p-2 rounded-lg shadow-md border border-gray-100 flex flex-col gap-2">
                                <button className="p-1 hover:bg-gray-50 rounded text-gray-600 hover:text-accent-orange">
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                                <button className="p-1 hover:bg-gray-50 rounded text-gray-600 hover:text-accent-orange">
                                    <ZoomOut className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-white p-2 rounded-lg shadow-md border border-gray-100">
                                <button className="p-1 hover:bg-gray-50 rounded text-gray-600 hover:text-accent-orange">
                                    <Maximize className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkMapPage;
