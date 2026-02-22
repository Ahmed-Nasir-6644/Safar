/**
 * PaymentFlow.jsx
 * Full payment method selection + QR display flow.
 * Demo / visual only — no real payment SDK.
 */

import React, { useState, useCallback } from 'react';
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    MapPin,
    Download,
    RefreshCw,
    Ticket,
    Wallet,
    ChevronRight,
    X,
} from 'lucide-react';
import { bookingAPI } from '../utils/api';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAYMENT_METHODS = [
    {
        id: 'easypaisa',
        label: 'Easypaisa',
        shortLabel: 'EP',
        description: 'Pay via Easypaisa wallet',
        accentColor: '#22c55e',      // green-500
        hoverBorder: 'hover:border-green-400',
        hoverBg: 'hover:bg-green-50',
        badgeBg: 'bg-green-100',
        badgeText: 'text-green-700',
        selectedBorder: 'border-green-500',
        selectedBg: 'bg-green-50',
        selectedRing: 'ring-green-200',
    },
    {
        id: 'jazzcash',
        label: 'JazzCash',
        shortLabel: 'JC',
        description: 'Pay via JazzCash wallet',
        accentColor: '#ef4444',      // red-500
        hoverBorder: 'hover:border-red-400',
        hoverBg: 'hover:bg-red-50',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-700',
        selectedBorder: 'border-red-500',
        selectedBg: 'bg-red-50',
        selectedRing: 'ring-red-200',
    },
    {
        id: 'pay_on_stop',
        label: 'Pay on Stop',
        shortLabel: null,       // uses icon instead
        description: 'Pay cash at the bus stop',
        accentColor: '#6b7280',      // gray-500
        hoverBorder: 'hover:border-gray-400',
        hoverBg: 'hover:bg-gray-100',
        badgeBg: 'bg-gray-100',
        badgeText: 'text-gray-600',
        selectedBorder: 'border-gray-500',
        selectedBg: 'bg-gray-50',
        selectedRing: 'ring-gray-200',
    },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const isDigitalMethod = (methodId) =>
    methodId === 'easypaisa' || methodId === 'jazzcash';

const buildQRData = (ticketNumber, amount, method) =>
    `SAFAR|TKT:${ticketNumber}|AMT:${amount}|METHOD:${method}|TS:${Date.now()}`;

const buildFallbackBooking = (route, selectedMethod, fare) => {
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const hasQR = isDigitalMethod(selectedMethod);
    return {
        success: true,
        message: 'Booking confirmed (demo)',
        data: {
            ticketNumber,
            fare: fare ?? 'N/A',
            payment: {
                method: selectedMethod,
                status: hasQR ? 'pending_payment' : 'pay_on_stop',
                qrCodeImage: hasQR
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildQRData(ticketNumber, fare, selectedMethod))}`
                    : null,
                qrPayload: hasQR ? buildQRData(ticketNumber, fare, selectedMethod) : null,
            },
        },
    };
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Single payment method card */
const MethodCard = ({ method, isSelected, onSelect, disabled }) => (
    <button
        type="button"
        onClick={() => !disabled && onSelect(method.id)}
        disabled={disabled}
        aria-pressed={isSelected}
        className={[
            'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 w-full focus:outline-none',
            isSelected
                ? `${method.selectedBorder} ${method.selectedBg} ring-2 ${method.selectedRing} shadow-md`
                : `border-gray-200 bg-white ${method.hoverBorder} ${method.hoverBg}`,
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]',
        ].join(' ')}
    >
        {/* Badge */}
        <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-transform ${method.badgeBg} ${method.badgeText} ${isSelected ? 'scale-110' : ''}`}
        >
            {method.shortLabel ? (
                <span>{method.shortLabel}</span>
            ) : (
                <MapPin className="w-5 h-5" />
            )}
        </div>

        <span className="text-sm font-bold text-gray-800 leading-tight text-center">
            {method.label}
        </span>
        <span className="text-[11px] text-gray-400 leading-tight text-center">
            {method.description}
        </span>

        {/* Selected checkmark */}
        {isSelected && (
            <div className="absolute top-2 right-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: method.accentColor }} />
            </div>
        )}
    </button>
);

/** QR code display for digital payments */
const QRDisplay = ({ booking, selectedMethod, onReset }) => {
    const { ticketNumber, fare, payment } = booking;
    const [imgError, setImgError] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const methodMeta = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

    const handleDownload = useCallback(async () => {
        if (!payment?.qrCodeImage) return;
        setDownloading(true);
        try {
            const res = await fetch(payment.qrCodeImage);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `safar-ticket-${ticketNumber}.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            /* silently ignore download failure */
        } finally {
            setDownloading(false);
        }
    }, [payment?.qrCodeImage, ticketNumber]);

    return (
        <div className="flex flex-col items-center gap-5 py-2">
            {/* Header */}
            <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-lg">
                    <CheckCircle2 className="w-5 h-5" />
                    Ticket Booked!
                </div>
                <p className="text-xs text-gray-500">
                    Ticket #{ticketNumber}
                </p>
            </div>

            {/* QR card */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-md flex flex-col items-center gap-3 w-full max-w-[260px]">
                {!imgError && payment?.qrCodeImage ? (
                    <img
                        src={payment.qrCodeImage}
                        alt="Payment QR code"
                        className="w-44 h-44 rounded-xl"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    /* Graceful fallback when QR is missing / fails to load */
                    <div className="w-44 h-44 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-2 border border-dashed border-gray-300">
                        <AlertCircle className="w-8 h-8 text-gray-400" />
                        <p className="text-xs text-gray-400 text-center px-2">
                            QR unavailable.<br />Show ticket number at stop.
                        </p>
                    </div>
                )}

                {/* Amount & method */}
                <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">{fare}</p>
                    <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${methodMeta?.badgeBg} ${methodMeta?.badgeText}`}
                    >
                        {methodMeta?.label ?? selectedMethod}
                    </span>
                </div>
            </div>

            {/* Helper text */}
            <p className="text-xs text-center text-gray-500 max-w-[240px] leading-relaxed">
                Scan this QR using your selected wallet to complete payment.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-[260px]">
                {payment?.qrCodeImage && !imgError && (
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all flex-1 disabled:opacity-60"
                    >
                        {downloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Save QR
                    </button>
                )}
                <button
                    type="button"
                    onClick={onReset}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent-orange text-white text-sm font-semibold hover:bg-orange-600 transition-all flex-1"
                >
                    <Ticket className="w-4 h-4" />
                    New Ticket
                </button>
            </div>
        </div>
    );
};

/** Pay on Stop confirmation display */
const PayOnStopDisplay = ({ booking, onReset }) => {
    const { ticketNumber, fare } = booking;
    return (
        <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-500" />
            </div>
            <div className="text-center space-y-1">
                <p className="font-bold text-gray-900 text-lg">Pay at the Stop</p>
                <p className="text-sm text-gray-500">
                    Please have <span className="font-bold text-gray-800">{fare}</span> ready when boarding.
                </p>
            </div>
            {/* Ticket details */}
            <div className="w-full max-w-[280px] bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Ticket #</span>
                    <span className="font-bold text-gray-800 font-mono">{ticketNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Method</span>
                    <span className="font-semibold text-gray-700">Cash / Pay on Stop</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-accent-orange">{fare}</span>
                </div>
            </div>
            <p className="text-xs text-gray-400 text-center max-w-[240px]">
                Present this ticket number to the conductor. No QR required.
            </p>
            <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-orange text-white font-semibold text-sm hover:bg-orange-600 transition-all"
            >
                <Ticket className="w-4 h-4" />
                Book Another
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────
// Main PaymentFlow component
// ─────────────────────────────────────────────

/**
 * PaymentFlow
 *
 * Props:
 *   fare        {string}  — formatted fare string, e.g. "Rs. 50"
 *   routeData   {object}  — full route object to attach to booking payload
 *   fromStop    {string}  — starting stop name
 *   toStop      {string}  — destination stop name
 */
const PaymentFlow = ({ fare = 'N/A', routeData = null, fromStop = '', toStop = '' }) => {
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [bookingState, setBookingState] = useState('idle');
    // idle | loading | success | error
    const [booking, setBooking] = useState(null);
    const [bookingError, setBookingError] = useState('');

    const handleBook = useCallback(async () => {
        if (!selectedMethod) return;

        setBookingState('loading');
        setBookingError('');

        try {
            let response;

            try {
                // Attempt real API call
                response = await bookingAPI.bookTicket({
                    paymentMethod: selectedMethod,
                    fromStop,
                    toStop,
                    fare,
                    routeData,
                });
            } catch (apiErr) {
                // API unavailable — fall back to demo response
                console.warn('Booking API unavailable, using demo fallback:', apiErr.message);
                response = buildFallbackBooking(routeData, selectedMethod, fare);
            }

            if (!response?.success) {
                throw new Error(response?.message || 'Booking failed. Please try again.');
            }

            setBooking(response.data);
            setBookingState('success');
        } catch (err) {
            setBookingError(err.message || 'Something went wrong. Please retry.');
            setBookingState('error');
        }
    }, [selectedMethod, fromStop, toStop, fare, routeData]);

    const handleReset = useCallback(() => {
        setSelectedMethod(null);
        setBookingState('idle');
        setBooking(null);
        setBookingError('');
    }, []);

    const handleRetry = useCallback(() => {
        setBookingState('idle');
        setBookingError('');
        handleBook();
    }, [handleBook]);

    // ── Render: Success ──
    if (bookingState === 'success' && booking) {
        const isDigital = isDigitalMethod(selectedMethod);
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {isDigital ? (
                    <QRDisplay
                        booking={booking}
                        selectedMethod={selectedMethod}
                        onReset={handleReset}
                    />
                ) : (
                    <PayOnStopDisplay booking={booking} onReset={handleReset} />
                )}
            </div>
        );
    }

    // ── Render: Selector + Book button ──
    return (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">

            {/* Section heading */}
            <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-accent-orange" />
                <h4 className="font-bold text-gray-900 text-sm">
                    Pay Fare{fare !== 'N/A' && <span className="text-accent-orange ml-1">{fare}</span>}
                </h4>
            </div>

            {/* Method grid */}
            <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => (
                    <MethodCard
                        key={method.id}
                        method={method}
                        isSelected={selectedMethod === method.id}
                        onSelect={setSelectedMethod}
                        disabled={bookingState === 'loading'}
                    />
                ))}
            </div>

            {/* Error message */}
            {bookingState === 'error' && bookingError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1">{bookingError}</span>
                    <button
                        type="button"
                        onClick={() => { setBookingState('idle'); setBookingError(''); }}
                        className="shrink-0 text-red-400 hover:text-red-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Confirm / Retry button */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={bookingState === 'error' ? handleRetry : handleBook}
                    disabled={!selectedMethod || bookingState === 'loading'}
                    className={[
                        'flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold transition-all',
                        !selectedMethod || bookingState === 'loading'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-accent-orange text-white hover:bg-orange-600 hover:scale-[1.02] shadow-md shadow-orange-200',
                    ].join(' ')}
                >
                    {bookingState === 'loading' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Booking…
                        </>
                    ) : bookingState === 'error' ? (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </>
                    ) : (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            Confirm & Book
                        </>
                    )}
                </button>
            </div>

            {/* Hint when no method selected */}
            {!selectedMethod && (
                <p className="text-xs text-center text-gray-400">
                    Select a payment method above to continue.
                </p>
            )}
        </div>
    );
};

export default PaymentFlow;
