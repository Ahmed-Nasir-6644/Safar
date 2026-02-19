import React, { useState } from 'react';
import { AlertCircle, X, Mail, Send } from 'lucide-react';

const SOSButton = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messageSent, setMessageSent] = useState(false);

    const handleSend = () => {
        setMessageSent(true);
        setTimeout(() => {
            setMessageSent(false);
            setIsOpen(false);
        }, 2000);
    };

    return (
        <>
            {/* Floating SOS trigger */}
            {children ? (
                <div onClick={() => setIsOpen(true)}>{children}</div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 hover:scale-110 transition-all duration-300 animate-pulse"
                    aria-label="SOS Emergency"
                >
                    <span className="font-bold text-lg">SOS</span>
                </button>
            )}

            {/* Backdrop + Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-red-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                <h3 className="font-bold text-lg leading-none">Emergency Assistance</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-700 hover:bg-red-800 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {!messageSent ? (
                                <>
                                    <p className="text-gray-600 text-center text-sm">
                                        Your live location and details will be sent to your emergency contacts.
                                    </p>

                                    {/* Emergency Contact card */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Emergency Contact</h4>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="font-bold text-red-600">M</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold">Mom</p>
                                                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message preview */}
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                                        <strong>Message Preview:</strong> "SOS! I need help. My current location is..."
                                    </div>

                                    {/* Action buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handleSend}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 hover:border-red-300 transition-all group"
                                        >
                                            <Mail className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                                            <span className="font-semibold text-red-600 text-sm">Send Email</span>
                                        </button>
                                        <button
                                            onClick={handleSend}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-red-100 bg-white hover:bg-red-50 hover:border-red-300 transition-all group"
                                        >
                                            <Send className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                                            <span className="font-semibold text-red-600 text-sm">Send SMS</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 space-y-3">
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
