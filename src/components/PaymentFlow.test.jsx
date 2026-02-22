/**
 * PaymentFlow.test.jsx
 * Unit tests for the PaymentFlow component.
 *
 * Run with: npx vitest  (or npx jest if the project uses Jest)
 *
 * Covers:
 *   - Payment method selection state
 *   - Correct payload sent to bookingAPI
 *   - QR code renders when present in response
 *   - Pay-on-Stop flow shows correctly (no QR)
 *   - Error state and retry
 *   - Missing QR graceful fallback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Mock the bookingAPI module ───────────────────────────────────────────────
vi.mock('../utils/api', () => ({
    bookingAPI: {
        bookTicket: vi.fn(),
    },
}));

import { bookingAPI } from '../utils/api';
import PaymentFlow from './PaymentFlow';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeDigitalResponse = (method = 'easypaisa') => ({
    success: true,
    message: 'Booking confirmed',
    data: {
        ticketNumber: 'TKT-TEST-001',
        fare: 'Rs. 50',
        payment: {
            method,
            status: 'pending_payment',
            qrCodeImage: 'https://example.com/qr.png',
            qrPayload: `SAFAR|TKT:TKT-TEST-001|AMT:Rs. 50|METHOD:${method}`,
        },
    },
});

const makePayOnStopResponse = () => ({
    success: true,
    message: 'Booking confirmed',
    data: {
        ticketNumber: 'TKT-TEST-002',
        fare: 'Rs. 30',
        payment: {
            method: 'pay_on_stop',
            status: 'pay_on_stop',
            qrCodeImage: null,
            qrPayload: null,
        },
    },
});

const defaultProps = {
    fare: 'Rs. 50',
    routeData: { totalDistance: 5, estimatedMinutes: 20 },
    fromStop: 'Stop A',
    toStop: 'Stop B',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PaymentFlow — method selection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all three payment method cards', () => {
        render(<PaymentFlow {...defaultProps} />);
        expect(screen.getByText('Easypaisa')).toBeInTheDocument();
        expect(screen.getByText('JazzCash')).toBeInTheDocument();
        expect(screen.getByText('Pay on Stop')).toBeInTheDocument();
    });

    it('Confirm button is disabled when no method is selected', () => {
        render(<PaymentFlow {...defaultProps} />);
        const btn = screen.getByRole('button', { name: /confirm & book/i });
        expect(btn).toBeDisabled();
    });

    it('selects Easypaisa and enables Confirm button', () => {
        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        const btn = screen.getByRole('button', { name: /confirm & book/i });
        expect(btn).not.toBeDisabled();
    });

    it('selects JazzCash', () => {
        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('JazzCash'));
        // Confirm button must be enabled
        expect(screen.getByRole('button', { name: /confirm & book/i })).not.toBeDisabled();
    });

    it('selects Pay on Stop', () => {
        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Pay on Stop'));
        expect(screen.getByRole('button', { name: /confirm & book/i })).not.toBeDisabled();
    });
});

describe('PaymentFlow — correct payload sent to bookingAPI', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('sends paymentMethod=easypaisa in the payload', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makeDigitalResponse('easypaisa'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(bookingAPI.bookTicket).toHaveBeenCalledWith(
                expect.objectContaining({ paymentMethod: 'easypaisa' })
            );
        });
    });

    it('sends paymentMethod=jazzcash in the payload', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makeDigitalResponse('jazzcash'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('JazzCash'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(bookingAPI.bookTicket).toHaveBeenCalledWith(
                expect.objectContaining({ paymentMethod: 'jazzcash' })
            );
        });
    });

    it('sends fromStop, toStop, fare, and routeData in the payload', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makeDigitalResponse('easypaisa'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(bookingAPI.bookTicket).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromStop: 'Stop A',
                    toStop: 'Stop B',
                    fare: 'Rs. 50',
                    routeData: defaultProps.routeData,
                })
            );
        });
    });
});

describe('PaymentFlow — QR display when present', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows QR image after successful Easypaisa booking', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makeDigitalResponse('easypaisa'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            const qrImg = screen.getByAltText(/payment qr code/i);
            expect(qrImg).toBeInTheDocument();
            expect(qrImg.src).toBe('https://example.com/qr.png');
        });
    });

    it('shows ticket number and fare in QR screen', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makeDigitalResponse('jazzcash'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('JazzCash'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.getByText(/TKT-TEST-001/i)).toBeInTheDocument();
            expect(screen.getByText('Rs. 50')).toBeInTheDocument();
        });
    });

    it('shows wallet scan helper text', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makeDigitalResponse('easypaisa'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/scan this qr using your selected wallet to complete payment/i)
            ).toBeInTheDocument();
        });
    });

    it('shows fallback message when qrCodeImage is null', async () => {
        const noQrResponse = makeDigitalResponse('easypaisa');
        noQrResponse.data.payment.qrCodeImage = null;
        bookingAPI.bookTicket.mockResolvedValueOnce(noQrResponse);

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.getByText(/qr unavailable/i)).toBeInTheDocument();
        });
    });
});

describe('PaymentFlow — Pay on Stop flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows Pay at the Stop message after booking', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makePayOnStopResponse());

        render(<PaymentFlow {...defaultProps} fare="Rs. 30" />);
        fireEvent.click(screen.getByText('Pay on Stop'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.getByText(/pay at the stop/i)).toBeInTheDocument();
        });
    });

    it('does NOT show a QR image for Pay on Stop', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makePayOnStopResponse());

        render(<PaymentFlow {...defaultProps} fare="Rs. 30" />);
        fireEvent.click(screen.getByText('Pay on Stop'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.queryByAltText(/payment qr code/i)).not.toBeInTheDocument();
        });
    });

    it('shows ticket details: number, method, amount', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makePayOnStopResponse());

        render(<PaymentFlow {...defaultProps} fare="Rs. 30" />);
        fireEvent.click(screen.getByText('Pay on Stop'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.getByText('TKT-TEST-002')).toBeInTheDocument();
            expect(screen.getByText(/cash \/ pay on stop/i)).toBeInTheDocument();
            expect(screen.getByText('Rs. 30')).toBeInTheDocument();
        });
    });
});

describe('PaymentFlow — error handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows error message when booking API returns success=false', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce({
            success: false,
            message: 'Payment gateway error',
        });

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.getByText(/payment gateway error/i)).toBeInTheDocument();
        });
    });

    it('shows Retry button after error', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce({ success: false, message: 'Timeout' });

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('JazzCash'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
        });
    });

    it('falls back to demo response when API throws a network error', async () => {
        bookingAPI.bookTicket.mockRejectedValueOnce(new Error('Network error'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        // Falls back: should still show success (demo booking)
        await waitFor(() => {
            expect(screen.getByText(/ticket booked/i)).toBeInTheDocument();
        });
    });

    it('shows "New Ticket" button to reset after success', async () => {
        bookingAPI.bookTicket.mockResolvedValueOnce(makeDigitalResponse('easypaisa'));

        render(<PaymentFlow {...defaultProps} />);
        fireEvent.click(screen.getByText('Easypaisa'));
        fireEvent.click(screen.getByRole('button', { name: /confirm & book/i }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /new ticket/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /new ticket/i }));

        // Back to selector
        await waitFor(() => {
            expect(screen.getByText('Easypaisa')).toBeInTheDocument();
            expect(screen.getByText('JazzCash')).toBeInTheDocument();
        });
    });
});
