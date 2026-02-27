import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI, statsAPI } from '../services/api';
import EventCard from '../components/EventCard';
import {
    FiArrowRight, FiCalendar, FiMapPin, FiUsers, FiTag, FiZap,
    FiTrendingUp, FiGlobe, FiPlay, FiCheckCircle, FiAward
} from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import './Home.css';

const CATEGORIES = [
    { name: 'conference', label: 'Conference', emoji: '🎤', color: '#6C63FF' },
    { name: 'workshop', label: 'Workshop', emoji: '🛠️', color: '#4ECDC4' },
    { name: 'concert', label: 'Concert', emoji: '🎵', color: '#FF6B6B' },
    { name: 'sports', label: 'Sports', emoji: '⚽', color: '#FFE66D' },
    { name: 'networking', label: 'Networking', emoji: '🤝', color: '#A8FF78' },
    { name: 'festival', label: 'Festival', emoji: '🎉', color: '#FF9F43' },
    { name: 'exhibition', label: 'Exhibition', emoji: '🖼️', color: '#48dbfb' },
    { name: 'seminar', label: 'Seminar', emoji: '📚', color: '#fd79a8' },
    { name: 'hackathon', label: 'Hackathon', emoji: '💻', color: '#6c5ce7' },
    { name: 'webinar', label: 'Webinar', emoji: '🌐', color: '#00b894' },
    { name: 'other', label: 'Other', emoji: '✨', color: '#a29bfe' },
];

const FEATURES = [
    { icon: <FiTag size={26} />, title: 'Easy Ticket Booking', desc: 'Book tickets in seconds with multiple ticket tiers and secure payment processing.', color: '#6C63FF' },
    { icon: <MdQrCodeScanner size={26} />, title: 'QR Code Check-In', desc: 'Streamline event entry with instant QR code scanning and real-time check-in stats.', color: '#FF6B6B' },
    { icon: <FiCalendar size={26} />, title: 'Event Calendar', desc: 'Never miss an event with our interactive calendar view and smart reminders.', color: '#4ECDC4' },
    { icon: <FiMapPin size={26} />, title: 'Venue Management', desc: 'Discover and manage premier venues with detailed amenities and availability.', color: '#FFE66D' },
    { icon: <FiUsers size={26} />, title: 'Attendee Networking', desc: 'Connect with like-minded attendees before, during, and after events.', color: '#A8FF78' },
    { icon: <FiTrendingUp size={26} />, title: 'Analytics Dashboard', desc: 'Track event performance with real-time analytics and detailed reports.', color: '#FF9F43' },
];

// ─── Animated Counter ──────────────────────────────────────────────────────────
const AnimatedCounter = ({ target, isVisible }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isVisible || !target) return;
        setCount(0);
        const duration = 1600;
        const steps = 50;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);
        return () => clearInterval(timer);
    }, [isVisible, target]);

    return <>{count.toLocaleString()}</>;
};

// ─── Typewriter effect ─────────────────────────────────────────────────────────
const WORDS = ['Unforgettable Events', 'Amazing Experiences', 'Lasting Memories', 'Incredible Moments'];
const useTypewriter = () => {
    const [displayed, setDisplayed] = useState('');
    const [wordIdx, setWordIdx] = useState(0);
    const [charIdx, setCharIdx] = useState(0);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const word = WORDS[wordIdx];
        let timeout;
        if (!deleting && charIdx <= word.length) {
            timeout = setTimeout(() => { setDisplayed(word.slice(0, charIdx)); setCharIdx(c => c + 1); }, 80);
        } else if (!deleting && charIdx > word.length) {
            timeout = setTimeout(() => setDeleting(true), 2200);
        } else if (deleting && charIdx > 0) {
            timeout = setTimeout(() => { setDisplayed(word.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }, 45);
        } else {
            setDeleting(false);
            setWordIdx(i => (i + 1) % WORDS.length);
        }
        return () => clearTimeout(timeout);
    }, [charIdx, deleting, wordIdx]);

    return displayed;
};

// ─── useInView hook ────────────────────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Home = () => {
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [stats, setStats] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoveredCategory, setHoveredCategory] = useState(null);

    const typedText = useTypewriter();
    const [statsRef, statsInView] = useInView();
    const [featuresRef, featuresInView] = useInView();

    const handleMouseMove = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
        setMousePos({ x, y });
    }, []);

    useEffect(() => {
        eventsAPI.getAll({ status: 'published', limit: 6 })
            .then(res => setFeaturedEvents(res.data.events || []))
            .catch(() => { })
            .finally(() => setLoadingEvents(false));

        statsAPI.get()
            .then(res => setStats(res.data.stats))
            .catch(() => { });
    }, []);

    const REAL_STATS = stats ? [
        { value: stats.totalEvents, label: 'Events Published', icon: <FiZap />, color: '#6C63FF' },
        { value: stats.totalTickets, label: 'Tickets Booked', icon: <FiTag />, color: '#FF6B6B' },
        { value: stats.totalUsers, label: 'Registered Users', icon: <FiUsers />, color: '#4ECDC4' },
        { value: stats.totalVenues, label: 'Listed Venues', icon: <FiGlobe />, color: '#FFE66D' },
    ] : [];

    return (
        <div className="home">

            {/* ── Hero ── */}
            <section className="hero" onMouseMove={handleMouseMove}>
                <div className="hero-bg">
                    <div className="hero-orb orb-1" style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }} />
                    <div className="hero-orb orb-2" style={{ transform: `translate(${-mousePos.x * 0.3}px, ${-mousePos.y * 0.3}px)` }} />
                    <div className="hero-orb orb-3" style={{ transform: `translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.8}px)` }} />
                    <div className="hero-grid" />
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="hero-particle" style={{
                            left: `${(i * 37 + 11) % 100}%`,
                            top: `${(i * 53 + 7) % 100}%`,
                            animationDelay: `${(i * 0.4) % 6}s`,
                            animationDuration: `${5 + (i % 4)}s`,
                            width: `${2 + (i % 3)}px`,
                            height: `${2 + (i % 3)}px`,
                            opacity: 0.15 + (i % 4) * 0.08,
                        }} />
                    ))}
                </div>

                <div className="container hero-content">
                    <div className="hero-badge animate-fade">
                        <FiZap className="badge-zap" /> EventHub — Event Management Platform
                    </div>

                    <h1 className="hero-title animate-fade">
                        Create &amp; Discover<br />
                        <span className="gradient-text typewriter-text">
                            {typedText}
                            <span className="cursor-blink">|</span>
                        </span>
                    </h1>

                    <p className="hero-desc animate-fade">
                        From intimate workshops to massive concerts — plan, manage, and experience events like never before. Connect with event-goers across the country.
                    </p>

                    <div className="hero-actions animate-fade">
                        <Link to="/events" className="btn btn-primary btn-lg btn-glow">
                            Explore Events <FiArrowRight />
                        </Link>
                        <Link to="/events/create" className="btn btn-secondary btn-lg">
                            <FiPlay size={16} /> Create Event
                        </Link>
                    </div>
                </div>

                <div className="hero-scroll-indicator">
                    <div className="scroll-mouse"><div className="scroll-dot" /></div>
                </div>
            </section>

            {/* ── Real Stats ── */}
            {stats && (
                <section className="section stats-section" ref={statsRef}>
                    <div className="container">
                        <div className="stats-grid">
                            {REAL_STATS.map((s, i) => (
                                <div
                                    key={s.label}
                                    className={`stat-block ${statsInView ? 'stat-visible' : ''}`}
                                    style={{ animationDelay: `${i * 0.12}s`, '--stat-color': s.color }}
                                >
                                    <div className="stat-block-icon" style={{ color: s.color }}>{s.icon}</div>
                                    <div className="stat-block-value" style={{ '--stat-color': s.color }}>
                                        <AnimatedCounter target={s.value} isVisible={statsInView} />
                                    </div>
                                    <div className="stat-block-label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Categories ── */}
            <section className="section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Browse by <span className="gradient-text">Category</span></h2>
                        <p>Find the perfect event that matches your interests</p>
                    </div>
                    <div className="categories-grid">
                        {CATEGORIES.map((cat, i) => (
                            <Link
                                key={cat.name}
                                to={`/events?category=${cat.name}`}
                                className="category-card"
                                style={{ '--cat-color': cat.color, animationDelay: `${i * 0.05}s` }}
                                onMouseEnter={() => setHoveredCategory(cat.name)}
                                onMouseLeave={() => setHoveredCategory(null)}
                            >
                                <div className="category-emoji">{cat.emoji}</div>
                                <div className="category-label">{cat.label}</div>
                                <div className="cat-glow" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Featured Events ── */}
            <section className="section section-dark">
                <div className="container">
                    <div className="section-header">
                        <div>
                            <h2>Upcoming <span className="gradient-text">Events</span></h2>
                            <p>Don&apos;t miss out on these upcoming events</p>
                        </div>
                        <Link to="/events" className="btn btn-secondary">View All <FiArrowRight /></Link>
                    </div>
                    {loadingEvents ? (
                        <div className="loading-screen"><div className="spinner" /></div>
                    ) : featuredEvents.length > 0 ? (
                        <div className="grid-3">
                            {featuredEvents.map((e, i) => (
                                <div key={e._id} className="event-card-wrap" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <EventCard event={e} />
                                </div>
                            ))}
                        </div>
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

            {/* ── Features ── */}
            <section className="section features-section" ref={featuresRef}>
                <div className="container">
                    <div className="section-header text-center">
                        <h2>Everything You Need to <span className="gradient-text">Succeed</span></h2>
                        <p>A complete platform for organizers and attendees</p>
                    </div>
                    <div className="features-grid">
                        {FEATURES.map((f, i) => (
                            <div
                                key={i}
                                className={`feature-card ${featuresInView ? 'feature-visible' : ''}`}
                                style={{ '--feat-color': f.color, animationDelay: `${i * 0.1}s` }}
                            >
                                <div className="feature-icon-wrap" style={{ background: f.color + '22', color: f.color }}>
                                    {f.icon}
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                                <div className="feature-check"><FiCheckCircle size={14} /> Always included</div>
                                <div className="feature-glow" style={{ background: f.color }} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-content">
                            <div className="cta-badge"><FiAward size={14} /> Start for Free — No Credit Card Needed</div>
                            <h2>Ready to Create Your <span className="gradient-text">Event?</span></h2>
                            <p>Join EventHub and manage your events end-to-end — ticketing, check-in, analytics and more.</p>
                            <div className="hero-actions">
                                <Link to="/register" className="btn btn-primary btn-lg btn-glow">
                                    Get Started <FiArrowRight />
                                </Link>
                                <Link to="/events" className="btn btn-secondary btn-lg">Explore Events</Link>
                            </div>
                        </div>
                        <div className="cta-decoration">
                            <div className="cta-orb-1" />
                            <div className="cta-orb-2" />
                            <div className="cta-rings">
                                <div className="cta-ring cta-ring-1" />
                                <div className="cta-ring cta-ring-2" />
                                <div className="cta-ring cta-ring-3" />
                                <div className="cta-center-icon"><FiZap size={28} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
