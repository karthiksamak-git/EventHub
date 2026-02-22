import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import EventCard from '../components/EventCard';
import { FiArrowRight, FiCalendar, FiMapPin, FiUsers, FiTag, FiZap, FiTrendingUp, FiGlobe } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import './Home.css';

const CATEGORIES = [
    { name: 'conference', label: 'Conference' },
    { name: 'workshop', label: 'Workshop' },
    { name: 'concert', label: 'Concert' },
    { name: 'sports', label: 'Sports' },
    { name: 'networking', label: 'Networking' },
    { name: 'festival', label: 'Festival' },
    { name: 'exhibition', label: 'Exhibition' },
    { name: 'seminar', label: 'Seminar' },
    { name: 'hackathon', label: 'Hackathon' },
    { name: 'webinar', label: 'Webinar' },
    { name: 'other', label: 'Other' }
];

const FEATURES = [
    { icon: <FiTag size={24} />, title: 'Easy Ticket Booking', desc: 'Book tickets in seconds with multiple ticket tiers and secure payment processing.' },
    { icon: <MdQrCodeScanner size={24} />, title: 'QR Code Check-In', desc: 'Streamline event entry with instant QR code scanning and real-time check-in stats.' },
    { icon: <FiCalendar size={24} />, title: 'Event Calendar', desc: 'Never miss an event with our interactive calendar view and smart reminders.' },
    { icon: <FiMapPin size={24} />, title: 'Venue Management', desc: 'Discover and manage premier venues with detailed amenities and availability.' },
    { icon: <FiUsers size={24} />, title: 'Attendee Networking', desc: 'Connect with like-minded attendees before, during, and after events.' },
    { icon: <FiTrendingUp size={24} />, title: 'Analytics Dashboard', desc: 'Track event performance with real-time analytics and detailed reports.' }
];

const STATS = [
    { value: '10K+', label: 'Events Created', icon: <FiZap /> },
    { value: '250K+', label: 'Tickets Booked', icon: <FiTag /> },
    { value: '50K+', label: 'Active Users', icon: <FiUsers /> },
    { value: '100+', label: 'Cities Covered', icon: <FiGlobe /> }
];

const Home = () => {
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        eventsAPI.getAll({ status: 'published', limit: 6 })
            .then(res => setFeaturedEvents(res.data.events || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="home">
            {}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-orb orb-1"></div>
                    <div className="hero-orb orb-2"></div>
                    <div className="hero-orb orb-3"></div>
                    <div className="hero-grid"></div>
                </div>
                <div className="container hero-content">
                    <div className="hero-badge animate-fade"><FiZap /> #1 Event Management Platform</div>
                    <h1 className="hero-title animate-fade">
                        Create & Discover<br />
                        <span className="gradient-text">Unforgettable Events</span>
                    </h1>
                    <p className="hero-desc animate-fade">
                        From intimate workshops to massive concerts — plan, manage, and experience events like never before. Connect with thousands of event-goers worldwide.
                    </p>
                    <div className="hero-actions animate-fade">
                        <Link to="/events" className="btn btn-primary btn-lg">Explore Events <FiArrowRight /></Link>
                        <Link to="/events/create" className="btn btn-secondary btn-lg">Create Event</Link>
                    </div>
                    <div className="hero-stats animate-fade">
                        {STATS.map(s => (
                            <div key={s.label} className="hero-stat">
                                <div className="hero-stat-value">{s.value}</div>
                                <div className="hero-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="hero-scroll-indicator">
                    <div className="scroll-mouse"><div className="scroll-dot"></div></div>
                </div>
            </section>

            {}
            <section className="section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Browse by <span className="gradient-text">Category</span></h2>
                        <p>Find the perfect event that matches your interests</p>
                    </div>
                    <div className="categories-grid">
                        {CATEGORIES.map(cat => (
                            <Link key={cat.name} to={`/events?category=${cat.name}`} className="category-card">
                                <div className="category-label">{cat.label}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {}
            <section className="section section-dark">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2>Upcoming <span className="gradient-text">Events</span></h2>
                            <p>Don't miss out on these amazing upcoming events</p>
                        </div>
                        <Link to="/events" className="btn btn-secondary">View All <FiArrowRight /></Link>
                    </div>
                    {loading ? (
                        <div className="loading-screen"><div className="spinner"></div></div>
                    ) : featuredEvents.length > 0 ? (
                        <div className="grid-3">{featuredEvents.map(e => <EventCard key={e._id} event={e} />)}</div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon"><FiCalendar size={28} /></div>
                            <h3>No events yet</h3>
                            <p>Be the first to create an event on EventHub.</p>
                            <Link to="/events/create" className="btn btn-primary">Create Event</Link>
                        </div>
                    )}
                </div>
            </section>

            {}
            <section className="section features-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Everything You Need to <span className="gradient-text">Succeed</span></h2>
                        <p>A complete platform for organizers and attendees</p>
                    </div>
                    <div className="features-grid">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-content">
                            <h2>Ready to Create Your <span className="gradient-text">Event?</span></h2>
                            <p>Join thousands of organizers who trust EventHub to make their events unforgettable.</p>
                            <div className="hero-actions">
                                <Link to="/register" className="btn btn-primary btn-lg">Get Started Free <FiArrowRight /></Link>
                                <Link to="/events" className="btn btn-secondary btn-lg">Explore Events</Link>
                            </div>
                        </div>
                        <div className="cta-decoration">
                            <div className="cta-orb-1" />
                            <div className="cta-orb-2" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
