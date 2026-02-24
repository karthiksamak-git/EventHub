import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketsAPI, eventsAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { FiCalendar, FiClock, FiMapPin, FiWifi, FiAlertCircle, FiX, FiClock as FiHourglass } from 'react-icons/fi';
import { MdHourglassTop } from 'react-icons/md';
import PaymentModal from '../components/PaymentModal';
import './MyTickets.css';

const STATUS_LABELS = {
    pending_payment: 'Awaiting Payment',
    submitted: 'Awaiting Review',
    active: 'Confirmed',
    cancelled: 'Cancelled',
    used: 'Used',
    expired: 'Expired'
};

const getDisplayStatus = (ticket) => {
    if (ticket.status === 'pending_payment' && ticket.paymentStatus === 'submitted') return 'submitted';
    return ticket.status;
};

const MyTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qrTicket, setQrTicket] = useState(null);
    const [payTicket, setPayTicket] = useState(null);
    const [payEvent, setPayEvent] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        ticketsAPI.getMyTickets()
            .then(res => setTickets(res.data.tickets || []))
            .catch(() => toast.error('Failed to load tickets.'))
            .finally(() => setLoading(false));
    }, []);

    const handleCancel = async (id) => {
        if (!confirm('Cancel this ticket?')) return;
        try {
            await ticketsAPI.cancel(id);
            setTickets(prev => prev.map(t => t._id === id ? { ...t, status: 'cancelled' } : t));
            toast.success('Ticket cancelled.');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    };

    const handlePayNow = async (ticket) => {
        try {
            const res = await eventsAPI.getOne(ticket.event._id);
            setPayEvent(res.data.event);
            setPayTicket(ticket);
        } catch { toast.error('Failed to load event details.'); }
    };

    const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

    if (loading) return <div className="loading-screen" style={{ paddingTop: '7rem' }}><div className="spinner" /></div>;

    return (
        <div className="my-tickets-page">
            <div className="container">
                <div className="page-header">
                    <h1>My Tickets</h1>
                    <p>All your event registrations in one place</p>
                </div>

                <div className="ticket-filters">
                    {['all', 'pending_payment', 'active', 'used', 'cancelled'].map(f => (
                        <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f === 'all' ? 'All' : STATUS_LABELS[f] || f}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="empty-state" style={{ paddingTop: '4rem' }}>
                        <div className="empty-icon"><FiCalendar size={28} /></div>
                        <h3>No tickets found</h3>
                        <p>Browse events and book your first ticket</p>
                        <Link to="/events" className="btn btn-primary">Browse Events</Link>
                    </div>
                ) : (
                    <div className="ticket-grid">
                        {filtered.map(ticket => {
                            const ev = ticket.event;
                            const locationText = ev?.isOnline
                                ? 'Online Event'
                                : [ev?.physicalLocation?.city, ev?.physicalLocation?.country].filter(Boolean).join(', ');

                            return (
                                <div key={ticket._id} className={`ticket-card ${ticket.status}`}>
                                    <div className="ticket-card-top">
                                        <div className="ticket-event-info">
                                            <div className="ticket-category">{ev?.category}</div>
                                            <h3 className="ticket-event-title">{ev?.title || 'Event'}</h3>
                                            <div className="ticket-meta">
                                                <span><FiCalendar size={13} />{ev?.startDate ? format(new Date(ev.startDate), 'MMM d, yyyy') : '—'}</span>
                                                {ev?.startTime && <span><FiClock size={13} />{ev.startTime}</span>}
                                                <span>{ev?.isOnline ? <FiWifi size={13} /> : <FiMapPin size={13} />}{locationText}</span>
                                            </div>
                                        </div>
                                        <div className="ticket-status-badge">
                                            <span className={`status-badge status-${getDisplayStatus(ticket)}`}>{STATUS_LABELS[getDisplayStatus(ticket)] || ticket.status}</span>
                                        </div>
                                    </div>

                                    <div className="ticket-divider" />

                                    <div className="ticket-card-bottom">
                                        <div className="ticket-details">
                                            <div className="ticket-type-label">{ticket.ticketType?.name}</div>
                                            <div className="ticket-amount">
                                                {ticket.totalAmount === 0 ? 'Free' : `₹${ticket.totalAmount.toLocaleString()}`}
                                            </div>
                                        </div>

                                        <div className="ticket-actions">
                                            {ticket.status === 'pending_payment' && ticket.paymentStatus !== 'submitted' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => handlePayNow(ticket)}>Complete Payment</button>
                                            )}
                                            {ticket.status === 'pending_payment' && ticket.paymentStatus === 'submitted' && (
                                                <span className="pending-note awaiting-review">
                                                    <MdHourglassTop size={13} /> Awaiting organizer review
                                                </span>
                                            )}
                                            {ticket.status === 'active' && ticket.qrCode && (
                                                <button className="btn btn-secondary btn-sm" onClick={() => setQrTicket(ticket)}>View QR Code</button>
                                            )}
                                            {ticket.status === 'active' && !ticket.qrCode && (
                                                <span className="pending-note"><FiAlertCircle size={12} /> Verification pending</span>
                                            )}
                                            {ticket.status === 'pending_payment' && ticket.paymentStatus !== 'submitted' && (
                                                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(ticket._id)}><FiX size={13} /></button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            { }
            {qrTicket && (
                <div className="modal-overlay" onClick={() => setQrTicket(null)}>
                    <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Your Ticket QR Code</h3>
                            <button className="modal-close" onClick={() => setQrTicket(null)}><FiX /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-2)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                                {qrTicket.event?.title} — {qrTicket.ticketType?.name}
                            </p>
                            <img src={qrTicket.qrCode} alt="Ticket QR Code" style={{ width: '220px', height: '220px', borderRadius: 'var(--r-md)' }} />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '1rem', lineHeight: '1.5' }}>
                                Present this QR code at the event entrance for check-in.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            { }
            {payTicket && payEvent && (
                <PaymentModal
                    ticket={payTicket}
                    event={payEvent}
                    onClose={() => { setPayTicket(null); setPayEvent(null); }}
                    onPaid={() => {
                        setTickets(prev => prev.map(t =>
                            t._id === payTicket._id ? { ...t, paymentStatus: 'submitted' } : t
                        ));
                        setPayTicket(null);
                        setPayEvent(null);
                    }}
                />
            )}
        </div>
    );
};
export default MyTickets;
