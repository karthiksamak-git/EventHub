import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { venuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiMapPin, FiUsers, FiStar, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Venues.css';

const AMENITY_ICONS = { WiFi: '📶', Parking: '🅿️', Catering: '🍽️', Stage: '🎭', 'AV Equipment': '📽️', 'Coffee Bar': '☕', Lighting: '💡', Security: '🔒' };

const Venues = () => {
    const { user, isAuth } = useAuth();
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', capacity: '', pricePerDay: '', contactEmail: '', contactPhone: '', amenities: [], address: { line1: '', line2: '', city: '', state: '', country: '', postalCode: '', mapLink: '' } });
    const [creating, setCreating] = useState(false);

    const fetchVenues = async () => {
        setLoading(true);
        try {
            const res = await venuesAPI.getAll({ search });
            setVenues(res.data.venues || []);
        } catch { setVenues([]); }
        setLoading(false);
    };

    useEffect(() => { fetchVenues(); }, [search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            await venuesAPI.create(form);
            toast.success('Venue created!');
            setShowCreate(false);
            fetchVenues();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        setCreating(false);
    };

    const AMENITIES = ['WiFi', 'Parking', 'Catering', 'Stage', 'AV Equipment', 'Coffee Bar', 'Lighting', 'Security'];
    const toggleAmenity = (a) => setForm(p => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a] }));

    return (
        <div className="venues-page">
            <div className="container">
                <div className="page-header flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <h1>📍 <span className="gradient-text">Venues</span></h1>
                        <p>Discover & manage event venues</p>
                    </div>
                    {isAuth && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> Add Venue</button>}
                </div>

                { }
                <div className="search-bar" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                    <FiSearch className="search-icon" />
                    <input type="text" placeholder="Search venues by name or city..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button className="clear-btn" onClick={() => setSearch('')}><FiX /></button>}
                </div>

                {loading ? (
                    <div className="loading-screen"><div className="spinner"></div></div>
                ) : venues.length > 0 ? (
                    <div className="venues-grid">
                        {venues.map(venue => (
                            <Link key={venue._id} to={`/venues/${venue._id}`} className="venue-card card">
                                <div className="venue-card-header" style={{ background: `linear-gradient(135deg, rgba(108,99,255,0.15), rgba(255,107,107,0.08))` }}>
                                    <div className="venue-emoji">🏛️</div>
                                    <div className="venue-rating"><FiStar fill="currentColor" size={12} /> {venue.rating?.toFixed(1) || '—'}</div>
                                </div>
                                <div className="venue-card-body">
                                    <h3 className="venue-name">{venue.name}</h3>
                                    <div className="venue-location"><FiMapPin size={13} />{venue.address?.city}, {venue.address?.state}</div>
                                    <div className="venue-stats">
                                        <div className="venue-stat"><FiUsers size={12} />{venue.capacity?.toLocaleString()} capacity</div>
                                    </div>
                                    {venue.pricePerDay > 0 && <div className="venue-price">From <strong>₹{venue.pricePerDay?.toLocaleString()}</strong>/day</div>}
                                    <div className="venue-amenities">
                                        {venue.amenities?.slice(0, 4).map(a => (
                                            <span key={a} className="amenity-chip">{AMENITY_ICONS[a] || '✓'} {a}</span>
                                        ))}
                                        {venue.amenities?.length > 4 && <span className="amenity-chip">+{venue.amenities.length - 4}</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="icon">🏛️</div>
                        <h3>No venues found</h3>
                        <p>Be the first to add a venue!</p>
                        {isAuth && <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Add Venue</button>}
                    </div>
                )}
            </div>

            {/* Create Venue Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🏛️ Add New Venue</h3>
                            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="form-grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                                <div className="form-group col-span-2"><label className="form-label">Venue Name *</label><input className="form-input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                                <div className="form-group col-span-2"><label className="form-label">Description</label><textarea className="form-textarea" rows={2} placeholder="Brief description of the venue" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Capacity *</label><input type="number" className="form-input" required min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Price Per Day (₹)</label><input type="number" className="form-input" value={form.pricePerDay} onChange={e => setForm(p => ({ ...p, pricePerDay: e.target.value }))} /></div>
                                <div className="form-group col-span-2"><label className="form-label">Address Line 1 *</label><input className="form-input" required placeholder="Street address, building name" value={form.address.line1} onChange={e => setForm(p => ({ ...p, address: { ...p.address, line1: e.target.value } }))} /></div>
                                <div className="form-group col-span-2"><label className="form-label">Address Line 2</label><input className="form-input" placeholder="Area, neighbourhood (optional)" value={form.address.line2} onChange={e => setForm(p => ({ ...p, address: { ...p.address, line2: e.target.value } }))} /></div>
                                <div className="form-group col-span-2"><label className="form-label">Map Link (Google Maps etc.) *</label><input type="url" className="form-input" required placeholder="https://maps.google.com/..." value={form.address.mapLink} onChange={e => setForm(p => ({ ...p, address: { ...p.address, mapLink: e.target.value } }))} /></div>
                                <div className="form-group"><label className="form-label">City *</label><input className="form-input" required placeholder="City" value={form.address.city} onChange={e => setForm(p => ({ ...p, address: { ...p.address, city: e.target.value } }))} /></div>
                                <div className="form-group"><label className="form-label">State *</label><input className="form-input" required placeholder="State or province" value={form.address.state} onChange={e => setForm(p => ({ ...p, address: { ...p.address, state: e.target.value } }))} /></div>
                                <div className="form-group"><label className="form-label">Country *</label><input className="form-input" required placeholder="Country" value={form.address.country} onChange={e => setForm(p => ({ ...p, address: { ...p.address, country: e.target.value } }))} /></div>
                                <div className="form-group"><label className="form-label">Postal Code</label><input className="form-input" placeholder="Postal / ZIP code" value={form.address.postalCode} onChange={e => setForm(p => ({ ...p, address: { ...p.address, postalCode: e.target.value } }))} /></div>
                                <div className="form-group"><label className="form-label">Contact Email</label><input type="email" className="form-input" placeholder="venue@example.com" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Contact Phone</label><input type="tel" className="form-input" placeholder="+91 XXXXX XXXXX" value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} /></div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Amenities</label>
                                <div className="amenities-select">
                                    {AMENITIES.map(a => (
                                        <label key={a} className={`amenity-check ${form.amenities.includes(a) ? 'selected' : ''}`} onClick={() => toggleAmenity(a)}>
                                            {AMENITY_ICONS[a] || '✓'} {a}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full" disabled={creating}>{creating ? 'Creating...' : '✓ Create Venue'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Venues;
