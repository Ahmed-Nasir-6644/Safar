import React, { useState } from 'react';
import { AlertCircle, Phone, Mail, X, Send } from 'lucide-react';

const SOSButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    const handleSend = () => {
        // Mock send
        setMessageSent(true);
        setTimeout(() => {
            setMessageSent(false);
            setIsOpen(false);
        }, 2000);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 hover:scale-110 transition-all duration-300 animate-pulse"
                aria-label="SOS Emergency"
            >
                <span className="font-bold text-lg">SOS</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-red-600 p-4 flex justify-between items-center text-white">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-6 h-6" />
                                <h3 className="font-bold text-lg">Emergency Assistance</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-red-700 rounded-full p-1 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {!messageSent ? (
                                <>
                                    <div className="text-center space-y-2">
                                        <p className="text-gray-600">Your live location and details will be sent to your emergency contacts.</p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Emergency Contact</h4>
                                        <div className="flex items-center space-x-3 text-gray-700">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="font-bold text-gray-500">M</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">Mom</p>
                                                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                                        <strong>Message Preview:</strong> "SOS! I need help. My current location is..."
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={handleSend}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 hover:border-red-200 transition-all group"
                                        >
                                            <Mail className="w-6 h-6 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="font-semibold text-red-600">Send Email</span>
                                        </button>
                                        <button
                                            onClick={handleSend}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 hover:border-red-200 transition-all group"
                                        >
                                            <Send className="w-6 h-6 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                                            <span className="font-semibold text-red-600">Send SMS</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 space-y-4">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                        <Send className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Alert Sent!</h3>
                                    <p className="text-gray-500">Your emergency contacts have been notified.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SOSButton;
