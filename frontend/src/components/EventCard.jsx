import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiUsers, FiHeart, FiClock, FiWifi } from 'react-icons/fi';
import './EventCard.css';

const CATEGORY_COLORS = {
    conference: '#6C63FF', workshop: '#4ECDC4', concert: '#FF6B6B',
    sports: '#FFE66D', networking: '#A8FF78', festival: '#FF9F43',
    exhibition: '#48dbfb', seminar: '#fd79a8', hackathon: '#6c5ce7',
    webinar: '#00b894', other: '#a29bfe'
};

const EventCard = ({ event }) => {
    const { _id, title, category, startDate, startTime, isOnline, physicalLocation, currentAttendees, maxAttendees, ticketTypes, likes = [], status, coverImage } = event;
    const lowestPrice = ticketTypes?.length ? Math.min(...ticketTypes.filter(t => t.isActive).map(t => t.price)) : 0;
    const catColor = CATEGORY_COLORS[category] || '#6C63FF';
    const gradientBg = `linear-gradient(135deg, ${catColor}22, ${catColor}08)`;
    const initials = title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const locationText = isOnline ? 'Online' : [physicalLocation?.city, physicalLocation?.country].filter(Boolean).join(', ') || null;

    return (
        <Link to={`/events/${_id}`} className="event-card card animate-fade">
            <div className="event-card-image" style={{ background: gradientBg }}>
                {coverImage ? (
                    <img src={coverImage} alt={title} loading="lazy" />
                ) : (
                    <div className="event-card-placeholder" style={{ color: catColor }}>
                        <span className="placeholder-initials">{initials}</span>
                    </div>
                )}
                <div className="event-card-category" style={{ background: catColor + '33', color: catColor, borderColor: catColor + '55' }}>
                    {category}
                </div>
                {status === 'cancelled' && <div className="event-card-cancelled">Cancelled</div>}
            </div>

            <div className="event-card-body">
                <h3 className="event-card-title">{title}</h3>

                <div className="event-card-meta">
                    <div className="meta-item">
                        <FiCalendar size={13} />
                        <span>{format(new Date(startDate), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="meta-item">
                        <FiClock size={13} />
                        <span>{startTime}</span>
                    </div>
                </div>

                {locationText && (
                    <div className="meta-item" style={{ marginBottom: '0.5rem' }}>
                        {isOnline ? <FiWifi size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} /> : <FiMapPin size={13} style={{ color: 'var(--secondary)', flexShrink: 0 }} />}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{locationText}</span>
                    </div>
                )}

                <div className="event-card-footer">
                    <div className="event-price">
                        {lowestPrice === 0 ? (
                            <span className="price-free">FREE</span>
                        ) : (
                            <span className="price-paid">From ₹{lowestPrice.toLocaleString()}</span>
                        )}
                    </div>
                    <div className="event-stats">
                        <span className="stat-item"><FiUsers size={12} /> {currentAttendees || 0}</span>
                        <span className="stat-item"><FiHeart size={12} /> {likes.length}</span>
                    </div>
                </div>

                {maxAttendees > 0 && (
                    <div className="availability-bar">
                        <div className="progress-bar-container" style={{ height: 4 }}>
                            <div className="progress-bar" style={{ width: `${Math.min((currentAttendees / maxAttendees) * 100, 100)}%`, background: catColor }} />
                        </div>
                        <span className="availability-text">{maxAttendees - currentAttendees} spots left</span>
                    </div>
                )}
            </div>
        </Link>
    );
};

export default EventCard;
