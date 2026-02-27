import { useState, useEffect } from 'react';
import { checkinAPI, eventsAPI } from '../services/api';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiZap, FiUsers, FiCheckCircle, FiClock, FiSearch } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import { format } from 'date-fns';
import './CheckIn.css';

const CheckIn = () => {
    const [searchParams] = useSearchParams();
    const [myEvents, setMyEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(searchParams.get('event') || '');
    const [stats, setStats] = useState(null);
    const [scanInput, setScanInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [recentCheckins, setRecentCheckins] = useState([]);
    const [lastScanned, setLastScanned] = useState(null);

    useEffect(() => {
        eventsAPI.getMyEvents().then(res => setMyEvents(res.data.events || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (selectedEvent) fetchStats();
    }, [selectedEvent]);

    const fetchStats = async () => {
        if (!selectedEvent) return;
        try {
            const res = await checkinAPI.getStats(selectedEvent);
            setStats(res.data.stats);
            setRecentCheckins(res.data.recentCheckins || []);
        } catch { setStats(null); }
    };

    const handleScan = async (e, forceId = null) => {
        if (e) e.preventDefault();
        const idToScan = forceId || scanInput.trim();
        if (!idToScan || !selectedEvent) { toast.error('Enter a ticket ID or scan a QR code.'); return; }
        setScanning(true);
        try {
            let ticketId = idToScan;
            const idMatch = idToScan.match(/ID:\s*([a-zA-Z0-9-]+)/);
            if (idMatch) ticketId = idMatch[1];
            try {
                const parsed = JSON.parse(ticketId);
                ticketId = parsed.ticketId || ticketId;
            } catch { }
            const res = await checkinAPI.scan({ ticketId, eventId: selectedEvent });
            toast.success(res.data.message);
            setScanInput('');
            setLastScanned(res.data.ticket);
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Check-in failed. Verify the ticket ID.');
            setLastScanned(null);
        }
        setScanning(false);
    };

    const handleInputChange = (e) => {
        let val = e.target.value;
        setScanInput(val);
        const idMatch = val.match(/ID:\s*([a-zA-Z0-9-]+)/);
        if (idMatch) {
            setScanInput(idMatch[1]);
            handleScan(null, idMatch[1]);
            return;
        }
        try {
            const parsed = JSON.parse(val);
            if (parsed.ticketId) {
                setScanInput(parsed.ticketId);
                handleScan(null, parsed.ticketId);
            }
        } catch { }
    };

    return (
        <div className="checkin-page">
            <div className="container">
                <div className="page-header">
                    <h1>QR <span className="gradient-text">Check-In</span></h1>
                    <p>Manage event check-ins in real-time</p>
                </div>

                <div className="checkin-event-select glass">
                    <label className="form-label">Select Your Event</label>
                    <select className="form-select" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                        <option value="">Choose an event...</option>
                        {myEvents.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                </div>

                {selectedEvent && (
                    <>
                        {stats && (
                            <div className="checkin-stats">
                                <div className="checkin-stat-card">
                                    <div className="checkin-stat-icon" style={{ background: 'rgba(108, 99, 255, 0.2)', color: 'var(--primary)' }}><FiUsers size={24} /></div>
                                    <div className="checkin-stat-value">{stats.totalTickets}</div>
                                    <div className="checkin-stat-label">Total Tickets</div>
                                </div>
                                <div className="checkin-stat-card">
                                    <div className="checkin-stat-icon" style={{ background: 'rgba(78, 205, 196, 0.2)', color: 'var(--accent)' }}><FiCheckCircle size={24} /></div>
                                    <div className="checkin-stat-value">{stats.checkedIn}</div>
                                    <div className="checkin-stat-label">Checked In</div>
                                </div>
                                <div className="checkin-stat-card">
                                    <div className="checkin-stat-icon" style={{ background: 'rgba(255, 230, 109, 0.2)', color: 'var(--accent2)' }}><FiClock size={24} /></div>
                                    <div className="checkin-stat-value">{stats.remaining}</div>
                                    <div className="checkin-stat-label">Remaining</div>
                                </div>
                                <div className="checkin-stat-card">
                                    <div className="checkin-stat-icon" style={{ background: 'rgba(255, 107, 107, 0.2)', color: 'var(--secondary)' }}><FiZap size={24} /></div>
                                    <div className="checkin-stat-value">{stats.percentage}%</div>
                                    <div className="checkin-stat-label">Attendance</div>
                                </div>
                            </div>
                        )}

                        {stats && (
                            <div className="attendance-progress glass">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: 600 }}>Attendance Rate</span>
                                    <span style={{ color: 'var(--primary)' }}>{stats.percentage}%</span>
                                </div>
                                <div className="progress-bar-container" style={{ height: 12 }}>
                                    <div className="progress-bar" style={{ width: `${stats.percentage}%` }} />
                                </div>
                            </div>
                        )}

                        <div className="scan-section glass">
                            <div className="scan-header">
                                <MdQrCodeScanner size={22} />
                                <h3>Manual Check-In</h3>
                            </div>
                            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                                Enter a Ticket ID or paste the raw QR code data to check in an attendee manually.
                            </p>
                            <form onSubmit={handleScan} className="scan-form">
                                <div className="scan-input-wrap">
                                    <FiSearch className="scan-input-icon" />
                                    <input
                                        className="form-input scan-input"
                                        placeholder="Ticket ID or QR code data..."
                                        value={scanInput}
                                        onChange={handleInputChange}
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={scanning || !scanInput.trim()}>
                                    {scanning ? 'Processing...' : 'Check In'}
                                </button>
                            </form>

                            {lastScanned && (
                                <div className="last-scanned success card mt-3 p-3" style={{ background: 'rgba(78, 205, 196, 0.1)', border: '1px solid var(--accent)' }}>
                                    <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <FiCheckCircle /> Checked In Successfully
                                    </h4>
                                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{lastScanned.attendee?.name}</div>
                                    <div style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>{lastScanned.attendee?.email}</div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                        <span className="badge badge-primary">{lastScanned.ticketType?.name}</span>
                                        <span style={{ marginLeft: '0.5rem' }}>Qty: {lastScanned.quantity}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {recentCheckins.length > 0 && (
                            <div className="recent-checkins glass">
                                <h3>Recent Check-ins</h3>
                                <div className="checkins-list">
                                    {recentCheckins.map((t, i) => (
                                        <div key={i} className="checkin-item">
                                            <div className="avatar-placeholder" style={{ width: 38, height: 38, fontSize: '0.9rem', flexShrink: 0 }}>
                                                {t.attendee?.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="checkin-info">
                                                <div className="checkin-name">{t.attendee?.name}</div>
                                                <div className="checkin-meta">
                                                    {t.attendee?.email} &middot; {t.ticketType?.name}
                                                </div>
                                            </div>
                                            <div className="checkin-time-col">
                                                <span className="badge badge-success">Checked In</span>
                                                <div className="checkin-time">{t.checkedInAt ? format(new Date(t.checkedInAt), 'h:mm a') : 'Just now'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {!selectedEvent && (
                    <div className="empty-state" style={{ paddingTop: '3rem' }}>
                        <div className="empty-icon"><MdQrCodeScanner size={28} /></div>
                        <h3>Select an Event</h3>
                        <p>Choose one of your events above to manage attendee check-ins</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default CheckIn;
