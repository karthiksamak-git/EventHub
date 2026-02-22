import { useState, useEffect } from 'react';
import { ticketsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiAlertCircle, FiCopy } from 'react-icons/fi';
import QRCodeLib from 'qrcode';
import './PaymentModal.css';

const PaymentModal = ({ ticket, event, onClose, onPaid }) => {
    const [upiQr, setUpiQr] = useState('');
    const [utr, setUtr] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const upiId = ticket.organizerUpiId || event?.organizer?.upiId || '';
    const amount = ticket.totalAmount;
    const payee = event?.organizer?.organizationName || event?.organizer?.name || 'Event Organizer';

    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`EventHub-${ticket._id?.slice(-6) || 'ticket'}`)}`;

    useEffect(() => {
        if (upiId && amount > 0) {
            QRCodeLib.toDataURL(upiUri, { width: 240, margin: 2 })
                .then(url => setUpiQr(url))
                .catch(() => { });
        }
    }, [upiId, amount]);

    const copyUpi = () => {
        navigator.clipboard.writeText(upiId);
        toast.success('UPI ID copied.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!utr.trim()) { toast.error('Please enter the UPI transaction reference.'); return; }
        setSubmitting(true);
        try {
            await ticketsAPI.submitPayment(ticket._id, utr.trim());
            setSubmitted(true);
            toast.success('Payment reference submitted. The organizer will verify and confirm your ticket.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit payment reference.');
        }
        setSubmitting(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal payment-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Complete Payment</h3>
                    <button className="modal-close" onClick={onClose}><FiX /></button>
                </div>
                <div className="modal-body">

                    {!submitted ? (
                        <>
                            <div className="payment-steps">
                                <div className="payment-step active">
                                    <div className="step-num">1</div>
                                    <span>Scan & Pay</span>
                                </div>
                                <div className="payment-step-line" />
                                <div className="payment-step">
                                    <div className="step-num">2</div>
                                    <span>Enter Reference</span>
                                </div>
                                <div className="payment-step-line" />
                                <div className="payment-step">
                                    <div className="step-num">3</div>
                                    <span>Get Ticket</span>
                                </div>
                            </div>

                            <div className="payment-amount-display">
                                <div className="amount-label">Amount to Pay</div>
                                <div className="amount-value">₹{amount.toLocaleString()}</div>
                                <div className="amount-desc">For: {event?.title} — {ticket.ticketType?.name}</div>
                            </div>

                            <div className="upi-payment-section">
                                {upiQr ? (
                                    <div className="qr-container">
                                        <img src={upiQr} alt="UPI QR Code" className="upi-qr-img" />
                                        <p className="qr-caption">Scan with any UPI app</p>
                                    </div>
                                ) : (
                                    <div className="qr-loading">Generating QR...</div>
                                )}

                                <div className="upi-divider"><span>or pay directly</span></div>

                                <div className="upi-id-box">
                                    <div className="upi-id-label">UPI ID</div>
                                    <div className="upi-id-value">
                                        <strong>{upiId}</strong>
                                        <button className="copy-btn" onClick={copyUpi} title="Copy UPI ID"><FiCopy size={14} /></button>
                                    </div>
                                </div>

                                <div className="supported-apps">
                                    <span className="apps-label">Accepted via:</span>
                                    <span className="app-chip">PhonePe</span>
                                    <span className="app-chip">Google Pay</span>
                                    <span className="app-chip">Paytm</span>
                                    <span className="app-chip">BHIM</span>
                                    <span className="app-chip">Any UPI App</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="utr-form">
                                <div className="form-group">
                                    <label className="form-label">Transaction Reference Number (UTR / Transaction ID)</label>
                                    <input
                                        className="form-input"
                                        placeholder="Enter the 12-digit UTR or transaction reference"
                                        value={utr}
                                        onChange={e => setUtr(e.target.value)}
                                        required
                                    />
                                    <p className="form-hint">This is shown in your UPI app after a successful payment. Do NOT submit before paying.</p>
                                </div>
                                <div className="payment-notice" style={{ marginBottom: '1rem' }}>
                                    <FiAlertCircle size={14} />
                                    Your ticket will be issued only after the organizer verifies your payment. This may take a few hours.
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Payment Reference'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="payment-submitted">
                            <div className="submitted-icon">
                                <FiCheck size={32} />
                            </div>
                            <h3>Payment Reference Submitted</h3>
                            <p>
                                The organizer has been notified. Once they verify your payment,
                                your ticket will be activated and the QR code will be available in <strong>My Tickets</strong>.
                            </p>
                            <div className="submitted-details">
                                <div><span>Event:</span> {event?.title}</div>
                                <div><span>Ticket:</span> {ticket.ticketType?.name}</div>
                                <div><span>Amount:</span> ₹{amount.toLocaleString()}</div>
                                <div><span>UTR Submitted:</span> {utr}</div>
                            </div>
                            <button className="btn btn-primary w-full" onClick={onPaid}>Go to My Tickets</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default PaymentModal;
