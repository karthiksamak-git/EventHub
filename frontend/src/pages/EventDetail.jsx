import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsAPI, ticketsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
    FiCalendar, FiMapPin, FiClock, FiUsers, FiWifi, FiGlobe,
    FiHeart, FiShare2, FiEdit, FiMessageCircle, FiArrowLeft,
    FiCheck, FiX, FiAlertCircle, FiTrash2
} from 'react-icons/fi';
import './EventDetail.css';
import PaymentModal from '../components/PaymentModal';

const EventDetail = () => {
    const { id } = useParams();
    const { user, isAuth } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const [showBooking, setShowBooking] = useState(false);
    const [selectedTicketType, setSelectedTicketType] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [booking, setBooking] = useState(false);
    const [bookedTicket, setBookedTicket] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Delete this event? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await eventsAPI.delete(id);
            toast.success('Event deleted.');
            navigate('/events');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete event.');
            setDeleting(false);
        }
    };

    useEffect(() => {
        eventsAPI.getOne(id)
            .then(res => {
                setEvent(res.data.event);
                if (user) setLiked(res.data.event.likes?.includes(user.id));
            })
            .catch(() => navigate('/events'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleLike = async () => {
        if (!isAuth) { toast.error('Please sign in to like events.'); return; }
        const res = await eventsAPI.like(id);
        setLiked(res.data.liked);
        setEvent(e => ({ ...e, likes: Array.from({ length: res.data.likes }) }));
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            const res = await eventsAPI.comment(id, commentText);
            setEvent(ev => ({ ...ev, comments: res.data.comments }));
            setCommentText('');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to post comment.'); }
        setSubmittingComment(false);
    };

    const handleBook = async () => {
        if (!isAuth) { toast.error('Please sign in to book a ticket.'); return; }
        if (!selectedTicketType) { toast.error('Please select a ticket type.'); return; }

        if (selectedTicketType.price > 0 && !event.organizerUpiId && !event.organizer?.upiId) {
            toast.error('The organizer has not set up payment collection for this event.');
            return;
        }

        setBooking(true);
        try {
            const res = await ticketsAPI.book({
                eventId: id,
                ticketTypeName: selectedTicketType.name,
                quantity
            });
            setShowBooking(false);
            setBookedTicket(res.data.ticket);
            if (res.data.paymentRequired) {
                toast.success('Ticket reserved. Please complete payment.');
            } else {
                toast.success('Your free ticket has been confirmed!');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed.');
        }
        setBooking(false);
    };

    if (loading) return <div className="loading-screen" style={{ paddingTop: '7rem' }}><div className="spinner" /></div>;
    if (!event) return null;

    const isOrganizer = user?.id === event.organizer?._id;
    const totalTickets = event.ticketTypes?.reduce((s, t) => s + t.quantity, 0) || 0;
    const availableTickets = event.ticketTypes?.reduce((s, t) => s + (t.quantity - t.sold), 0) || 0;
    const attendancePercent = totalTickets > 0 ? Math.round((event.currentAttendees / totalTickets) * 100) : 0;

    const locationDisplay = event.isOnline
        ? (event.onlinePlatform || 'Online Event')
        : [
            event.physicalLocation?.addressLine1,
            event.physicalLocation?.city,
            event.physicalLocation?.state,
            event.physicalLocation?.country
        ].filter(Boolean).join(', ') || 'Location not specified';

    return (
        <div className="event-detail-page">
            { }
            <div className="event-hero">
                <div className="event-hero-bg" style={{ background: `linear-gradient(135deg, rgba(108,99,255,0.2), rgba(255,107,107,0.15))` }} />
                <div className="container">
                    <Link to="/events" className="back-btn"><FiArrowLeft /> Back to Events</Link>
                    <div className="event-hero-content">
                        <div className="event-hero-left">
                            <div className="event-meta-top">
                                <span className={`badge badge-${event.category === 'conference' ? 'primary' : 'secondary'}`}>{event.category}</span>
                                {event.isOnline && <span className="badge badge-accent"><FiWifi size={12} /> Online</span>}
                                {event.isFeatured && <span className="badge badge-warning">Featured</span>}
                            </div>
                            <h1 className="event-hero-title">{event.title}</h1>
                            <div className="event-hero-meta">
                                <div className="event-meta-item">
                                    <FiCalendar size={15} />
                                    <span>{format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}</span>
                                </div>
                                <div className="event-meta-item">
                                    <FiClock size={15} />
                                    <span>{event.startTime} – {event.endTime} {event.timezone ? `(${event.timezone})` : ''}</span>
                                </div>
                                <div className="event-meta-item">
                                    {event.isOnline ? <FiGlobe size={15} /> : <FiMapPin size={15} />}
                                    <span>{locationDisplay}</span>
                                </div>
                                {event.language && (
                                    <div className="event-meta-item">
                                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-card)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-2)' }}>{event.language}</span>
                                    </div>
                                )}
                            </div>

                            { }
                            <div className="event-organizer-row">
                                <div className="avatar-placeholder sm">{(event.organizer?.organizationName || event.organizer?.name || 'O')[0]}</div>
                                <div>
                                    <div className="organizer-name">
                                        {event.organizer?.accountType === 'organization'
                                            ? event.organizer.organizationName
                                            : event.organizer?.name}
                                    </div>
                                    <div className="organizer-type">{event.organizer?.accountType === 'organization' ? 'Organization' : 'Individual Organizer'}</div>
                                </div>
                            </div>
                        </div>

                        { }
                        <div className="event-booking-card glass">
                            <div className="booking-price-range">
                                {event.ticketTypes?.length > 0 && (
                                    <>
                                        {event.ticketTypes.every(t => t.price === 0) ? (
                                            <div className="price-free">Free</div>
                                        ) : (
                                            <div className="price-range">
                                                {event.ticketTypes.filter(t => t.price > 0).length > 0
                                                    ? `From ₹${Math.min(...event.ticketTypes.map(t => t.price)).toLocaleString()}`
                                                    : 'Free'}
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="spots-left">{availableTickets} spots remaining</div>
                            </div>

                            <div className="attendance-bar">
                                <div className="attendance-fill" style={{ width: `${attendancePercent}%` }} />
                            </div>
                            <div className="attendance-label">
                                <FiUsers size={12} /> {event.currentAttendees} registered
                            </div>

                            <div className="booking-actions">
                                {isOrganizer ? (
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <Link to={`/events/${id}/edit`} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                                            <FiEdit size={16} /> Edit Event
                                        </Link>
                                        <button
                                            className="btn btn-danger btn-lg"
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            title="Delete Event"
                                        >
                                            {deleting ? '...' : <FiTrash2 size={16} />}
                                        </button>
                                    </div>
                                ) : event.status !== 'published' ? (
                                    <div className="booking-unavailable">Tickets not available</div>
                                ) : availableTickets === 0 ? (
                                    <div className="booking-unavailable">Sold Out</div>
                                ) : (
                                    <button className="btn btn-primary btn-lg w-full" onClick={() => setShowBooking(true)}>
                                        Get Tickets
                                    </button>
                                )}
                            </div>

                            <div className="booking-actions-row">
                                <button className={`action-icon-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
                                    <FiHeart fill={liked ? 'currentColor' : 'none'} />
                                    <span>{event.likes?.length || 0}</span>
                                </button>
                                <button className="action-icon-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied.'); }}>
                                    <FiShare2 />
                                </button>
                            </div>

                            {event.refundPolicy && (
                                <div className="refund-policy">
                                    <strong>Refund Policy:</strong> {event.refundPolicy}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container event-body">
                <div className="event-main">
                    { }
                    <section className="event-section">
                        <h2>About This Event</h2>
                        <p className="event-description">{event.description}</p>
                    </section>

                    { }
                    {event.requirements && (
                        <section className="event-section">
                            <h2>Requirements & Prerequisites</h2>
                            <p className="event-description">{event.requirements}</p>
                        </section>
                    )}

                    { }
                    <section className="event-section">
                        <h2>Ticket Options</h2>
                        <div className="ticket-types-list">
                            {event.ticketTypes?.map((t, i) => (
                                <div key={i} className={`ticket-type-card ${!t.isActive || t.quantity - t.sold <= 0 ? 'sold-out' : ''}`}>
                                    <div className="tt-info">
                                        <div className="tt-name">{t.name}</div>
                                        {t.description && <div className="tt-desc">{t.description}</div>}
                                        <div className="tt-remaining">{Math.max(0, t.quantity - t.sold)} remaining</div>
                                    </div>
                                    <div className="tt-price">
                                        {t.price === 0 ? 'Free' : `₹${t.price.toLocaleString()}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    { }
                    {event.isOnline && event.onlineLink && isAuth && (
                        <section className="event-section">
                            <h2>Event Access</h2>
                            <div className="online-link-card">
                                <FiGlobe size={20} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{event.onlinePlatform || 'Online Meeting Link'}</div>
                                    <a href={event.onlineLink} target="_blank" rel="noopener noreferrer" className="online-link">{event.onlineLink}</a>
                                </div>
                            </div>
                        </section>
                    )}

                    { }
                    {!event.isOnline && (
                        <section className="event-section">
                            <h2>Location</h2>
                            <div className="location-card">
                                <FiMapPin size={18} />
                                <div>
                                    {event.physicalLocation?.addressLine1 && <div>{event.physicalLocation.addressLine1}</div>}
                                    {event.physicalLocation?.addressLine2 && <div>{event.physicalLocation.addressLine2}</div>}
                                    <div>{[event.physicalLocation?.city, event.physicalLocation?.state, event.physicalLocation?.postalCode].filter(Boolean).join(', ')}</div>
                                    <div style={{ fontWeight: 600 }}>{event.physicalLocation?.country}</div>
                                    {event.physicalLocation?.landmark && <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Landmark: {event.physicalLocation.landmark}</div>}
                                </div>
                            </div>
                        </section>
                    )}

                    { }
                    <section className="event-section">
                        <h2>Discussion ({event.comments?.length || 0})</h2>
                        {isAuth ? (
                            <form onSubmit={handleComment} className="comment-form">
                                <div className="avatar-placeholder sm">{user?.name?.[0]}</div>
                                <input className="form-input" placeholder="Share a question or comment..."
                                    value={commentText} onChange={e => setCommentText(e.target.value)} />
                                <button type="submit" className="btn btn-primary" disabled={submittingComment || !commentText.trim()}>
                                    {submittingComment ? 'Posting...' : 'Post'}
                                </button>
                            </form>
                        ) : (
                            <p className="sign-in-prompt"><Link to="/login">Sign in</Link> to join the discussion.</p>
                        )}
                        <div className="comments-list">
                            {event.comments?.map((c, i) => (
                                <div key={i} className="comment-item">
                                    <div className="avatar-placeholder sm">{c.user?.name?.[0]}</div>
                                    <div className="comment-body">
                                        <div className="comment-author">{c.user?.name}</div>
                                        <div className="comment-text">{c.text}</div>
                                        <div className="comment-time">{c.date ? format(new Date(c.date), 'MMM d, h:mm a') : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Ticket Selection Modal */}
            {showBooking && (
                <div className="modal-overlay" onClick={() => setShowBooking(false)}>
                    <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Select Tickets</h3>
                            <button className="modal-close" onClick={() => setShowBooking(false)}><FiX /></button>
                        </div>
                        <div className="modal-body">
                            <div className="ticket-select-list">
                                {event.ticketTypes?.filter(t => t.isActive && t.quantity - t.sold > 0).map((t, i) => (
                                    <label key={i} className={`ticket-select-card ${selectedTicketType?.name === t.name ? 'selected' : ''}`}>
                                        <input type="radio" name="ticket" onChange={() => setSelectedTicketType(t)} />
                                        <div className="ts-info">
                                            <div className="ts-name">{t.name}</div>
                                            {t.description && <div className="ts-desc">{t.description}</div>}
                                            <div className="ts-remaining">{t.quantity - t.sold} available</div>
                                        </div>
                                        <div className="ts-price">{t.price === 0 ? 'Free' : `₹${t.price.toLocaleString()}`}</div>
                                    </label>
                                ))}
                            </div>

                            {selectedTicketType && (
                                <div className="qty-row">
                                    <label className="form-label">Quantity</label>
                                    <div className="qty-controls">
                                        <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                                        <span className="qty-value">{quantity}</span>
                                        <button className="qty-btn" onClick={() => setQuantity(q => Math.min(selectedTicketType.quantity - selectedTicketType.sold, q + 1))}>+</button>
                                    </div>
                                </div>
                            )}

                            {selectedTicketType && (
                                <div className="booking-summary">
                                    <div className="summary-row"><span>Ticket</span><span>{selectedTicketType.name}</span></div>
                                    <div className="summary-row"><span>Quantity</span><span>{quantity}</span></div>
                                    <div className="summary-row total"><span>Total</span><span>{selectedTicketType.price === 0 ? 'Free' : `₹${(selectedTicketType.price * quantity).toLocaleString()}`}</span></div>
                                    {selectedTicketType.price > 0 && (
                                        <div className="payment-notice">
                                            <FiAlertCircle size={14} />
                                            Payment is collected via UPI to the organizer's account. You'll receive your ticket after payment is verified.
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowBooking(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleBook} disabled={!selectedTicketType || booking}>
                                    {booking ? 'Processing...' : selectedTicketType?.price === 0 ? 'Confirm Free Ticket' : 'Proceed to Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            { }
            {bookedTicket && bookedTicket.status === 'pending_payment' && (
                <PaymentModal
                    ticket={bookedTicket}
                    event={event}
                    onClose={() => setBookedTicket(null)}
                    onPaid={() => {
                        setBookedTicket(null);
                        navigate('/my-tickets');
                    }}
                />
            )}
        </div>
    );
};
export default EventDetail;
