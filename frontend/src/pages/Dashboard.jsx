import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsAPI, ticketsAPI, authAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
    FiCalendar, FiUsers, FiPlusCircle, FiEdit, FiTrendingUp,
    FiCreditCard, FiAlertCircle, FiCheck, FiX, FiSettings
} from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = () => {
    const { user, isAuth, updateUser } = useAuth();
    const navigate = useNavigate();
    const [myEvents, setMyEvents] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [attendees, setAttendees] = useState([]);
    const [organizerStats, setOrganizerStats] = useState({ totalRevenue: 0, totalTicketsSold: 0 });
    const [loading, setLoading] = useState(true);
    const [savingUpi, setSavingUpi] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [upiInput, setUpiInput] = useState(user?.upiId || '');

    useEffect(() => {
        if (!isAuth) return;
        const loadData = async () => {
            try {
                const [evRes, tkRes] = await Promise.all([
                    eventsAPI.getMyEvents(),
                    ticketsAPI.getMyTickets()
                ]);
                setMyEvents(evRes.data.events || []);
                setMyTickets(tkRes.data.tickets || []);

                if (user?.role === 'organizer' || user?.role === 'admin') {
                    // Fetch real revenue and sales stats
                    statsAPI.getOrganizerStats()
                        .then(res => setOrganizerStats(res.data.stats))
                        .catch(() => { });

                    const events = evRes.data.events || [];
                    const attendeesAll = [];
                    for (const ev of events.slice(0, 5)) {
                        try {
                            const tickRes = await ticketsAPI.getEventTickets(ev._id);
                            const validTickets = (tickRes.data.tickets || []).filter(t => t.status !== 'cancelled');
                            validTickets.forEach(t => attendeesAll.push({ ...t, eventTitle: ev.title }));
                        } catch { }
                    }
                    setAttendees(attendeesAll);
                }
            } catch { }
            setLoading(false);
        };
        loadData();
    }, [isAuth, user?.role]);

    const handleSaveUpi = async () => {
        if (!upiInput.trim()) { toast.error('UPI ID is required.'); return; }
        setSavingUpi(true);
        try {
            const res = await authAPI.setUpiId(upiInput.trim());
            updateUser({ upiId: res.data.user.upiId });
            toast.success('UPI ID saved.');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
        setSavingUpi(false);
    };

    const handleConfirmPayment = async (ticketId) => {
        try {
            const res = await ticketsAPI.confirmPayment(ticketId);
            toast.success('Payment confirmed. Ticket activated.');
            setAttendees(prev => prev.map(t => t._id === ticketId ? { ...t, paymentStatus: 'confirmed', status: 'active' } : t));
        } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    };

    const handleRejectPayment = async (ticketId) => {
        if (!confirm('Reject this payment? This will cancel the ticket.')) return;
        try {
            await ticketsAPI.rejectPayment(ticketId);
            toast.success('Payment rejected.');
            setAttendees(prev => prev.map(t => t._id === ticketId ? { ...t, paymentStatus: 'failed' } : t));
        } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    };

    const now = new Date();
    const upcomingTickets = myTickets.filter(t => t.event && new Date(t.event.startDate) >= now && t.status === 'active');


    if (loading) return <div className="loading-screen" style={{ paddingTop: '7rem' }}><div className="spinner" /></div>;

    return (
        <div className="dashboard-page">
            <div className="container">
                <div className="dashboard-header">
                    <div className="dashboard-welcome">
                        <div className="avatar-placeholder xl">{user?.name?.[0]?.toUpperCase()}</div>
                        <div>
                            <h1>
                                {user?.accountType === 'organization' ? user.organizationName : user?.name}
                            </h1>
                            <p>{user?.email} &nbsp;·&nbsp; <span className="badge badge-primary">{user?.role}</span></p>
                            {user?.accountType === 'organization' && <p style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>Organization Account</p>}
                        </div>
                    </div>
                    <div className="dashboard-tabs">
                        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                        {(user?.role === 'organizer' || user?.role === 'admin') && (
                            <button className={`tab ${activeTab === 'attendees' ? 'active' : ''}`} onClick={() => setActiveTab('attendees')}>
                                Attendees {attendees.filter(t => t.paymentStatus === 'submitted').length > 0 && <span className="tab-badge">{attendees.filter(t => t.paymentStatus === 'submitted').length}</span>}
                            </button>
                        )}
                        <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <>
                        { }
                        <div className="dashboard-stats">
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'rgba(108,99,255,0.12)', color: 'var(--primary)' }}><FiCalendar size={20} /></div>
                                <div className="stat-value">{myEvents.length}</div>
                                <div className="stat-label">Events Created</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'rgba(78,205,196,0.12)', color: 'var(--accent)' }}><FiUsers size={20} /></div>
                                <div className="stat-value">
                                    {(user?.role === 'organizer' || user?.role === 'admin')
                                        ? (organizerStats?.totalTicketsSold || 0)
                                        : myTickets.filter(t => t.status === 'active').length}
                                </div>
                                <div className="stat-label">{(user?.role === 'organizer' || user?.role === 'admin') ? 'Total Tickets Sold' : 'Active Tickets'}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ background: 'rgba(255,230,109,0.12)', color: 'var(--accent2)' }}><FiTrendingUp size={20} /></div>
                                <div className="stat-value">{upcomingTickets.length}</div>
                                <div className="stat-label">Upcoming</div>
                            </div>
                            {(user?.role === 'organizer' || user?.role === 'admin') && (
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(255,107,107,0.12)', color: 'var(--secondary)' }}><FiCreditCard size={20} /></div>
                                    <div className="stat-value">₹{(organizerStats?.totalRevenue || 0).toLocaleString()}</div>
                                    <div className="stat-label">Revenue Collected</div>
                                </div>
                            )}
                        </div>

                        { }
                        {(user?.role === 'organizer' || user?.role === 'admin') && (
                            <div className="quick-actions glass">
                                <h3>Quick Actions</h3>
                                <div className="actions-row">
                                    <Link to="/events/create" className="action-card"><FiPlusCircle size={18} /><span>Create Event</span></Link>
                                    <Link to="/checkin" className="action-card"><FiCheck size={18} /><span>Check-In Console</span></Link>
                                    <Link to="/venues" className="action-card"><FiCalendar size={18} /><span>Venues</span></Link>
                                </div>
                            </div>
                        )}

                        { }
                        {(user?.role === 'organizer') && !user?.upiId && (
                            <div className="alert alert-warning">
                                <FiAlertCircle />
                                <div>
                                    <strong>UPI ID not set.</strong> You cannot collect payments from attendees until you set up your UPI ID.
                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab('settings')} style={{ marginLeft: '1rem' }}>Set Up Now</button>
                                </div>
                            </div>
                        )}

                        <div className="dashboard-cols">
                            { }
                            <div className="dash-col">
                                <div className="col-header">
                                    <h3>My Events</h3>
                                    {(user?.role === 'organizer' || user?.role === 'admin') && (
                                        <Link to="/events/create" className="btn btn-primary btn-sm"><FiPlusCircle size={14} /> New</Link>
                                    )}
                                </div>
                                {myEvents.length > 0 ? (
                                    <div className="dash-list">
                                        {myEvents.slice(0, 6).map(e => (
                                            <div key={e._id} className="dash-list-item">
                                                <div className={`status-dot ${e.status === 'published' ? 'green' : e.status === 'cancelled' ? 'red' : 'gray'}`} />
                                                <div className="dash-item-info">
                                                    <div className="dash-item-title">{e.title}</div>
                                                    <div className="dash-item-sub">{format(new Date(e.startDate), 'MMM d, yyyy')} &middot; {e.currentAttendees} attendees</div>
                                                </div>
                                                <Link to={`/events/${e._id}/edit`} className="btn btn-secondary btn-sm"><FiEdit size={13} /></Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <p>No events yet</p>
                                        {(user?.role === 'organizer' || user?.role === 'admin') && (
                                            <Link to="/events/create" className="btn btn-primary btn-sm">Create Your First Event</Link>
                                        )}
                                    </div>
                                )}
                            </div>

                            { }
                            <div className="dash-col">
                                <div className="col-header">
                                    <h3>My Tickets</h3>
                                    <Link to="/my-tickets" className="btn btn-secondary btn-sm">View All</Link>
                                </div>
                                {myTickets.length > 0 ? (
                                    <div className="dash-list">
                                        {myTickets.slice(0, 6).map(t => (
                                            <div key={t._id} className="dash-list-item">
                                                <div className={`status-dot ${t.status === 'active' ? 'green' : t.status === 'pending_payment' ? 'yellow' : 'gray'}`} />
                                                <div className="dash-item-info">
                                                    <div className="dash-item-title">{t.event?.title}</div>
                                                    <div className="dash-item-sub">
                                                        {t.ticketType?.name} &middot;
                                                        <span className={`status-pill status-${t.paymentStatus}`}>{t.paymentStatus?.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                                <span>{t.totalAmount === 0 ? 'Free' : `₹${t.totalAmount}`}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <p>No tickets booked yet</p>
                                        <Link to="/events" className="btn btn-primary btn-sm">Browse Events</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'attendees' && (
                    <div className="payments-tab">
                        <h2>Attendees & Verifications</h2>
                        <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            View your recent attendees and review submitted UPI transaction references.
                        </p>
                        {attendees.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon-box"><FiUsers size={24} /></div>
                                <p>No attendees yet</p>
                            </div>
                        ) : (
                            <div className="payments-list">
                                {attendees.map(ticket => (
                                    <div key={ticket._id} className="payment-verify-card glass" style={{ borderLeft: ticket.paymentStatus === 'submitted' ? '4px solid var(--warning)' : ticket.status === 'active' ? '4px solid var(--success)' : 'none' }}>
                                        <div className="pvc-event">
                                            {ticket.eventTitle}
                                            <span className={`badge ml-2 ${ticket.status === 'active' ? 'badge-success' : ticket.paymentStatus === 'submitted' ? 'badge-warning' : 'badge-secondary'}`}>
                                                {ticket.status === 'active' ? 'Active' : ticket.paymentStatus === 'submitted' ? 'Verification Pending' : ticket.status}
                                            </span>
                                        </div>
                                        <div className="pvc-details">
                                            <div><span>Attendee:</span> {ticket.attendee?.name} ({ticket.attendee?.email})</div>
                                            <div><span>Ticket:</span> {ticket.ticketType?.name} &times; {ticket.quantity}</div>
                                            <div><span>Amount:</span> {ticket.totalAmount === 0 ? 'Free' : `₹${ticket.totalAmount?.toLocaleString()}`}</div>
                                            {ticket.upiTransactionRef && <div><span>UTR:</span> <code>{ticket.upiTransactionRef}</code></div>}
                                            {ticket.paymentStatus === 'submitted' && ticket.paymentSubmittedAt && (
                                                <div><span>Submitted:</span> {format(new Date(ticket.paymentSubmittedAt), 'MMM d, h:mm a')}</div>
                                            )}
                                        </div>
                                        {ticket.paymentStatus === 'submitted' && (
                                            <div className="pvc-actions">
                                                <button className="btn btn-primary btn-sm" onClick={() => handleConfirmPayment(ticket._id)}>
                                                    <FiCheck size={14} /> Confirm Payment
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleRejectPayment(ticket._id)}>
                                                    <FiX size={14} /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="settings-tab glass">
                        <h2>Account Settings</h2>

                        { }
                        <div className="settings-section">
                            <h3>Payment Collection (UPI)</h3>
                            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                                This UPI ID will be shown to attendees when they book paid tickets. Make sure it is correct and accepting payments.
                            </p>
                            {user?.upiId && (
                                <div className="current-upi">
                                    <span>Current UPI ID:</span>
                                    <strong>{user.upiId}</strong>
                                    <span className="badge badge-success">Saved</span>
                                </div>
                            )}
                            <div className="upi-input-row">
                                <input
                                    className="form-input"
                                    placeholder="yourname@upi or yourname@bank"
                                    value={upiInput}
                                    onChange={e => setUpiInput(e.target.value)}
                                    style={{ maxWidth: '360px' }}
                                />
                                <button className="btn btn-primary" onClick={handleSaveUpi} disabled={savingUpi}>
                                    {savingUpi ? 'Saving...' : 'Save UPI ID'}
                                </button>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.4rem' }}>
                                Format: <code>name@bank</code> — e.g. <code>business@paytm</code>, <code>company@ybl</code>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Dashboard;
