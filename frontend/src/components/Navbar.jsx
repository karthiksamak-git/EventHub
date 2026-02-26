import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMenu, FiX, FiCalendar, FiMapPin, FiUsers, FiTag, FiLogOut, FiUser, FiPlusCircle, FiHome } from 'react-icons/fi';
import { MdQrCodeScanner } from 'react-icons/md';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuth } = useAuth();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { to: '/', label: 'Home', icon: <FiHome /> },
        { to: '/events', label: 'Events', icon: <FiTag /> },
        { to: '/calendar', label: 'Calendar', icon: <FiCalendar /> },
        { to: '/venues', label: 'Venues', icon: <FiMapPin /> },
        { to: '/network', label: 'People', icon: <FiUsers /> },
    ];

    const handleLogout = () => { logout(); navigate('/'); setDropdownOpen(false); };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="container navbar-inner">
                <Link to="/" className="navbar-brand">
                    <div className="brand-icon">EH</div>
                    <span>Event<span className="brand-hub">Hub</span></span>
                </Link>

                <div className={`navbar-links ${open ? 'mobile-open' : ''}`}>
                    {navLinks.map(l => (
                        <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
                            {l.icon} {l.label}
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-actions">
                    {isAuth ? (
                        <>
                            <Link to="/events/create" className="btn btn-primary btn-sm hide-mobile">
                                <FiPlusCircle /> Create Event
                            </Link>
                            <div className="user-menu relative">
                                <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                    <div className="avatar-placeholder" style={{ width: 38, height: 38, fontSize: '1rem' }}>
                                        {user?.name?.[0]?.toUpperCase()}
                                    </div>
                                </button>
                                {dropdownOpen && (
                                    <div className="user-dropdown animate-scale">
                                        <div className="dropdown-user-info">
                                            <div className="avatar-placeholder lg">{(user?.organizationName || user?.name)?.[0]?.toUpperCase()}</div>
                                            <div>
                                                <div className="font-semibold">{user?.accountType === 'organization' ? user.organizationName : user?.name}</div>
                                                <div style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{user?.email}</div>
                                                <div style={{ color: 'var(--primary-light)', fontSize: '0.72rem', marginTop: '0.15rem' }}>{user?.role}</div>
                                            </div>
                                        </div>
                                        <div className="dropdown-divider"></div>
                                        <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}><FiUser /> Dashboard</Link>
                                        <Link to="/my-tickets" className="dropdown-item" onClick={() => setDropdownOpen(false)}><FiTag /> My Tickets</Link>
                                        {(user?.role === 'organizer' || user?.role === 'admin') && (
                                            <Link to="/checkin" className="dropdown-item" onClick={() => setDropdownOpen(false)}><MdQrCodeScanner /> QR Check-In</Link>
                                        )}
                                        {user?.role === 'organizer' && !user?.upiId && (
                                            <Link to="/profile/upi-setup" className="dropdown-item" style={{ color: 'var(--accent2)' }} onClick={() => setDropdownOpen(false)}><FiPlusCircle /> Set Up UPI ID</Link>
                                        )}
                                        <Link to="/events/create" className="dropdown-item" onClick={() => setDropdownOpen(false)}><FiPlusCircle /> Create Event</Link>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item danger" onClick={handleLogout}><FiLogOut /> Log Out</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                        </>
                    )}
                    <button className="mobile-toggle" onClick={() => setOpen(!open)}>
                        {open ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                </div>
            </div>
            {dropdownOpen && <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)} />}
        </nav>
    );
};

export default Navbar;
