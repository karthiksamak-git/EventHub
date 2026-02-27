import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { venuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
    FiArrowLeft, FiMapPin, FiUsers, FiStar, FiPhone, FiMail,
    FiGlobe, FiCalendar, FiNavigation, FiCreditCard, FiExternalLink, FiHeart
} from 'react-icons/fi';
import './VenueDetail.css';

const AMENITY_ICONS = {
    WiFi: '📶', Parking: '🅿️', Catering: '🍽️', Stage: '🎭',
    'AV Equipment': '📽️', 'Coffee Bar': '☕', Lighting: '💡', Security: '🔒'
};

const StarRating = ({ value, onChange, readOnly = false }) => (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n} type="button"
                onClick={() => !readOnly && onChange && onChange(n)}
                style={{
                    background: 'none', border: 'none', cursor: readOnly ? 'default' : 'pointer',
                    fontSize: '1.25rem', color: n <= value ? '#FFE66D' : 'var(--border-hover)', padding: 0
                }}
            >★</button>
        ))}
    </div>
);

const VenueDetail = () => {
    const { id } = useParams();
    const { user, isAuth } = useAuth();
    const navigate = useNavigate();
    const [venue, setVenue] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReview, setShowReview] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        venuesAPI.getOne(id)
            .then(res => {
                const venueData = res.data.venue;
                setVenue(venueData);
                setEvents(res.data.events || []);
                if (user) {
                    const userId = user.id || user._id;
                    const isLiked = venueData.likes?.some(l => String(l?._id || l?.id || l) === String(userId));
                    setLiked(!!isLiked);
                }
            })
            .catch(() => {
                toast.error('Venue not found.');
                navigate('/venues');
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleReview = async (e) => {
        e.preventDefault();
        if (!reviewRating) { toast.error('Please select a rating.'); return; }
        setSubmittingReview(true);
        try {
            const res = await venuesAPI.addReview(id, { rating: reviewRating, comment: reviewComment });
            setVenue(prev => ({ ...prev, rating: res.data.rating, reviews: res.data.reviews }));
            setShowReview(false);
            setReviewComment('');
            setReviewRating(5);
            toast.success('Review submitted!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review.');
        }
        setSubmittingReview(false);
    };

    const handleLike = async () => {
        if (!isAuth) { toast.error('Please sign in to like venues.'); return; }
        try {
            const res = await venuesAPI.like(id);
            setLiked(res.data.liked);
            setVenue(v => ({ ...v, likes: Array.from({ length: res.data.likes }) }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to like venue.');
        }
    };

    if (loading) return <div className="loading-screen" style={{ paddingTop: '7rem' }}><div className="spinner" /></div>;
    if (!venue) return null;

    const now = new Date();
    const ongoingEvents = events.filter(e => new Date(e.startDate) <= now && new Date(e.endDate) >= now);
    const upcomingEvents = events.filter(e => new Date(e.startDate) > now);

    return (
        <div className="venue-detail-page">
            {/* Hero */}
            <div className="venue-hero">
                <div className="venue-hero-bg" />
                <div className="container">
                    <Link to="/venues" className="back-btn"><FiArrowLeft /> Back to Venues</Link>
                    <div className="venue-hero-content">
                        <div className="venue-hero-left">
                            <div className="venue-emoji-lg">🏛️</div>
                            <div>
                                <h1 className="venue-hero-title">{venue.name}</h1>
                                <div className="venue-hero-meta">
                                    <span><FiMapPin size={14} />{venue.address?.city}, {venue.address?.state}, {venue.address?.country}</span>
                                    <span><FiUsers size={14} />Capacity: {venue.capacity?.toLocaleString()}</span>
                                    <span><FiCreditCard size={14} />₹{venue.pricePerDay?.toLocaleString()}/day</span>
                                </div>
                                <div className="venue-rating-row">
                                    <StarRating value={Math.round(venue.rating || 0)} readOnly />
                                    <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
                                        {venue.rating?.toFixed(1) || '—'} ({venue.reviews?.length || 0} reviews)
                                    </span>
                                    <button className={`venue-like-btn ${liked ? 'active' : ''}`} onClick={handleLike} title={liked ? 'Unlike' : 'Like'}>
                                        <FiHeart fill={liked ? 'currentColor' : 'none'} size={15} />
                                        <span>{venue.likes?.length || 0}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Get Directions */}
                        {venue.address?.mapLink && (
                            <a
                                href={venue.address.mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-lg"
                            >
                                <FiNavigation size={16} /> Get Directions
                            </a>
                        )}
                    </div>
                </div>
            </div>

            <div className="container venue-body">
                <div className="venue-main">
                    {/* About */}
                    {venue.description && (
                        <section className="venue-section">
                            <h2>About This Venue</h2>
                            <p style={{ color: 'var(--text-2)', lineHeight: 1.75 }}>{venue.description}</p>
                        </section>
                    )}

                    {/* Address */}
                    <section className="venue-section">
                        <h2>Address</h2>
                        <div className="venue-address-card">
                            <FiMapPin size={20} color="var(--primary)" />
                            <div>
                                {venue.address?.line1 && <div>{venue.address.line1}</div>}
                                {venue.address?.line2 && <div>{venue.address.line2}</div>}
                                <div>{[venue.address?.city, venue.address?.state, venue.address?.postalCode].filter(Boolean).join(', ')}</div>
                                <div style={{ fontWeight: 600 }}>{venue.address?.country}</div>
                                {venue.address?.landmark && (
                                    <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                        Landmark: {venue.address.landmark}
                                    </div>
                                )}
                                {venue.address?.mapLink && (
                                    <a href={venue.address.mapLink} target="_blank" rel="noopener noreferrer"
                                        className="map-link-btn">
                                        <FiExternalLink size={13} /> Open in Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Amenities */}
                    {venue.amenities?.length > 0 && (
                        <section className="venue-section">
                            <h2>Amenities</h2>
                            <div className="amenities-grid">
                                {venue.amenities.map(a => (
                                    <div key={a} className="amenity-pill">
                                        <span>{AMENITY_ICONS[a] || '✓'}</span> {a}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Events at this venue */}
                    {events.length > 0 && (
                        <section className="venue-section">
                            <h2>Events at This Venue</h2>
                            {ongoingEvents.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div className="venue-events-label">🟢 Ongoing</div>
                                    <div className="venue-events-list">
                                        {ongoingEvents.map(ev => (
                                            <Link key={ev._id} to={`/events/${ev._id}`} className="venue-event-card">
                                                <div className="vev-cat">{ev.category}</div>
                                                <div className="vev-title">{ev.title}</div>
                                                <div className="vev-date">
                                                    <FiCalendar size={12} />
                                                    {format(new Date(ev.startDate), 'MMM d')} – {format(new Date(ev.endDate), 'MMM d, yyyy')}
                                                    {ev.startTime && ` · ${ev.startTime}`}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {upcomingEvents.length > 0 && (
                                <div>
                                    <div className="venue-events-label">🔵 Upcoming</div>
                                    <div className="venue-events-list">
                                        {upcomingEvents.map(ev => (
                                            <Link key={ev._id} to={`/events/${ev._id}`} className="venue-event-card">
                                                <div className="vev-cat">{ev.category}</div>
                                                <div className="vev-title">{ev.title}</div>
                                                <div className="vev-date">
                                                    <FiCalendar size={12} />
                                                    {format(new Date(ev.startDate), 'MMM d, yyyy')}
                                                    {ev.startTime && ` · ${ev.startTime}`}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Reviews */}
                    <section className="venue-section">
                        <div className="venue-section-header">
                            <h2>Reviews ({venue.reviews?.length || 0})</h2>
                            {isAuth && (
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowReview(s => !s)}>
                                    <FiStar size={13} /> {showReview ? 'Cancel' : 'Write a Review'}
                                </button>
                            )}
                        </div>

                        {showReview && (
                            <form onSubmit={handleReview} className="review-form glass">
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label className="form-label">Your Rating</label>
                                    <StarRating value={reviewRating} onChange={setReviewRating} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Comment (optional)</label>
                                    <textarea className="form-textarea" rows={3}
                                        placeholder="Share your experience with this venue..."
                                        value={reviewComment}
                                        onChange={e => setReviewComment(e.target.value)} />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        )}

                        {venue.reviews?.length > 0 ? (
                            <div className="reviews-list">
                                {venue.reviews.map((r, i) => (
                                    <div key={i} className="review-item">
                                        <div className="review-header">
                                            <div className="avatar-placeholder sm">{r.user?.name?.[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{r.user?.name || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                                                    {r.date ? format(new Date(r.date), 'MMM d, yyyy') : ''}
                                                </div>
                                            </div>
                                            <div style={{ marginLeft: 'auto' }}>
                                                <StarRating value={r.rating} readOnly />
                                            </div>
                                        </div>
                                        {r.comment && <p className="review-comment">{r.comment}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-3)' }}>No reviews yet. Be the first to review this venue.</p>
                        )}
                    </section>
                </div>

                {/* Sidebar */}
                <div className="venue-sidebar">
                    <div className="venue-contact-card glass">
                        <h3>Contact Info</h3>
                        {venue.contactEmail && (
                            <a href={`mailto:${venue.contactEmail}`} className="contact-row">
                                <FiMail size={15} color="var(--primary)" />
                                <span>{venue.contactEmail}</span>
                            </a>
                        )}
                        {venue.contactPhone && (
                            <a href={`tel:${venue.contactPhone}`} className="contact-row">
                                <FiPhone size={15} color="var(--primary)" />
                                <span>{venue.contactPhone}</span>
                            </a>
                        )}
                        {venue.website && (
                            <a href={venue.website} target="_blank" rel="noopener noreferrer" className="contact-row">
                                <FiGlobe size={15} color="var(--primary)" />
                                <span>Website</span>
                            </a>
                        )}
                        {!venue.contactEmail && !venue.contactPhone && !venue.website && (
                            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>No contact info available.</p>
                        )}
                    </div>

                    {venue.address?.mapLink && (
                        <a href={venue.address.mapLink} target="_blank" rel="noopener noreferrer"
                            className="btn btn-primary w-full" style={{ marginTop: '1rem', textDecoration: 'none', textAlign: 'center' }}>
                            <FiNavigation size={15} /> Get Directions
                        </a>
                    )}

                    {venue.managedBy && (
                        <div className="venue-contact-card glass" style={{ marginTop: '1rem' }}>
                            <h3>Managed By</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="avatar-placeholder sm">{venue.managedBy.name?.[0]}</div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{venue.managedBy.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{venue.managedBy.email}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default VenueDetail;
