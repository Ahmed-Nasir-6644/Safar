import React, { useState } from 'react';
import ReactDOM from 'react-dom';
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

    // Portal modal — rendered directly on document.body so fixed positioning always works
    const modal = isOpen ? ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                backgroundColor: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsOpen(false)}
        >
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                    width: '100%',
                    maxWidth: '420px',
                    overflow: 'hidden',
                    fontFamily: 'Poppins, sans-serif',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ backgroundColor: '#dc2626', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                        <AlertCircle size={22} />
                        <span style={{ fontWeight: 700, fontSize: '17px' }}>Emergency Assistance</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#b91c1c',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0,
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {!messageSent ? (
                        <>
                            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: 0 }}>
                                Your live location and details will be sent to your emergency contacts.
                            </p>

                            {/* Contact card */}
                            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                                <p style={{ fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '10px', marginTop: 0 }}>Emergency Contact</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <span style={{ fontWeight: 700, color: '#dc2626' }}>M</span>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Mom</p>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>+1 (555) 123-4567</p>
                                    </div>
                                </div>
                            </div>

                            {/* Message preview */}
                            <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#b91c1c' }}>
                                <strong>Message Preview:</strong> "SOS! I need help. My current location is..."
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {[
                                    { icon: <Mail size={22} />, label: 'Send Email' },
                                    { icon: <Send size={22} />, label: 'Send SMS' },
                                ].map(({ icon, label }) => (
                                    <button
                                        key={label}
                                        onClick={handleSend}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            gap: '8px', padding: '16px', borderRadius: '12px',
                                            border: '2px solid #fecaca', backgroundColor: '#fff',
                                            cursor: 'pointer', transition: 'background 0.2s',
                                            color: '#dc2626', fontWeight: 600, fontSize: '14px',
                                            fontFamily: 'Poppins, sans-serif',
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#fff5f5'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}
                                    >
                                        {icon}
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Send size={28} />
                            </div>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '20px', color: '#111827' }}>Alert Sent!</h3>
                            <p style={{ margin: 0, color: '#6b7280' }}>Your emergency contacts have been notified.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
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
            {modal}
        </>
    );
};

export default SOSButton;
