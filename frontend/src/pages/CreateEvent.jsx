import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { eventsAPI, venuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiX, FiAlertCircle, FiWifi, FiMapPin, FiNavigation } from 'react-icons/fi';
import './CreateEvent.css';

const CATEGORIES = [
    'conference', 'workshop', 'concert', 'sports', 'networking',
    'festival', 'exhibition', 'seminar', 'hackathon', 'webinar', 'other'
];

const TIMEZONES = [
    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'America/New_York', 'America/Chicago', 'America/Los_Angeles',
    'America/Sao_Paulo', 'Africa/Nairobi', 'Australia/Sydney', 'Pacific/Auckland'
];

const ONLINE_PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Webex', 'YouTube Live', 'Other'];

const today = new Date().toISOString().split('T')[0];

const CreateEvent = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'conference',
        isOnline: false,
        onlineLink: '',
        onlinePlatform: '',
        venueRef: '',
        physicalLocation: {
            addressLine1: '', addressLine2: '', city: '', state: '',
            country: '', postalCode: '', landmark: '', mapLink: ''
        },
        startDate: '', endDate: '', startTime: '09:00', endTime: '18:00',
        timezone: 'Asia/Kolkata',
        maxAttendees: '',
        status: 'draft',
        isFeatured: false,
        language: 'English',
        tags: [],
        requirements: '',
        refundPolicy: '',
        ageRestriction: '',
        ticketTypes: [{ name: 'General Admission', price: 0, quantity: 100, description: '', isActive: true }]
    });

    useEffect(() => {
        if (isEdit) {
            eventsAPI.getOne(id)
                .then(res => {
                    const e = res.data.event;
                    setForm({
                        title: e.title, description: e.description, category: e.category,
                        isOnline: e.isOnline,
                        onlineLink: e.onlineLink || '', onlinePlatform: e.onlinePlatform || '',
                        venueRef: e.venueRef || '',
                        physicalLocation: e.physicalLocation || { addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '', landmark: '', mapLink: '' },
                        startDate: e.startDate?.substring(0, 10),
                        endDate: e.endDate?.substring(0, 10),
                        startTime: e.startTime, endTime: e.endTime,
                        timezone: e.timezone || 'Asia/Kolkata',
                        maxAttendees: e.maxAttendees || '',
                        status: e.status, isFeatured: e.isFeatured,
                        language: e.language || 'English',
                        tags: e.tags || [], requirements: e.requirements || '',
                        refundPolicy: e.refundPolicy || '', ageRestriction: e.ageRestriction || '',
                        ticketTypes: e.ticketTypes || [{ name: 'General Admission', price: 0, quantity: 100, description: '', isActive: true }]
                    });
                })
                .catch(() => navigate('/events'));
        }
        venuesAPI.getAll().then(res => setVenues(res.data.venues || [])).catch(() => { });
    }, [id]);

    const [venues, setVenues] = useState([]);

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
    const setLocation = (key, val) => setForm(p => ({ ...p, physicalLocation: { ...p.physicalLocation, [key]: val } }));

    const handleVenueSelect = (e) => {
        const vId = e.target.value;
        if (!vId) {
            set('venueRef', '');
            setForm(p => ({ ...p, physicalLocation: { addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '', landmark: '', mapLink: '' } }));
            return;
        }
        const v = venues.find(x => x._id === vId);
        if (v) {
            set('venueRef', vId);
            setForm(p => ({
                ...p,
                physicalLocation: {
                    addressLine1: v.address?.line1 || '',
                    addressLine2: v.address?.line2 || '',
                    city: v.address?.city || '',
                    state: v.address?.state || '',
                    country: v.address?.country || '',
                    postalCode: v.address?.postalCode || '',
                    landmark: v.address?.landmark || '',
                    mapLink: v.address?.mapLink || ''
                }
            }));
        }
    };

    const addTicketType = () => setForm(p => ({
        ...p,
        ticketTypes: [...p.ticketTypes, { name: '', price: 0, quantity: 50, description: '', isActive: true }]
    }));
    const removeTicketType = (i) => setForm(p => ({ ...p, ticketTypes: p.ticketTypes.filter((_, idx) => idx !== i) }));
    const updateTicket = (i, key, val) => setForm(p => ({
        ...p,
        ticketTypes: p.ticketTypes.map((t, idx) => idx === i ? { ...t, [key]: val } : t)
    }));

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !form.tags.includes(tag)) {
            set('tags', [...form.tags, tag]);
            setTagInput('');
        }
    };

    const hasPaidTickets = form.ticketTypes.some(t => Number(t.price) > 0);
    const organizerHasUpi = !!user?.upiId;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isEdit && form.startDate < today) {
            toast.error('Start date cannot be in the past.');
            return;
        }
        if (form.endDate < form.startDate) {
            toast.error('End date cannot be before start date.');
            return;
        }
        if (form.isOnline && !form.onlineLink.trim()) {
            toast.error('Online event link is required.');
            return;
        }
        if (!form.isOnline && (!form.physicalLocation.city.trim() || !form.physicalLocation.country.trim())) {
            toast.error('City and country are required for in-person events.');
            return;
        }
        if (hasPaidTickets && !organizerHasUpi) {
            toast.error('Set up your UPI ID in your profile before creating paid events.');
            return;
        }
        if (!form.ticketTypes.every(t => t.name.trim())) {
            toast.error('All ticket types must have a name.');
            return;
        }

        setLoading(true);
        try {
            const payload = { ...form };
            if (form.isOnline) {
                payload.physicalLocation = {};
                payload.venueRef = null;
            } else {
                payload.onlineLink = '';
                payload.onlinePlatform = '';
                if (!payload.venueRef) payload.venueRef = null;
            }

            if (isEdit) {
                await eventsAPI.update(id, payload);
                toast.success('Event updated successfully.');
                navigate(`/events/${id}`);
            } else {
                const res = await eventsAPI.create(payload);
                toast.success('Event created successfully.');
                navigate(`/events/${res.data.event._id}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save event.');
        }
        setLoading(false);
    };

    return (
        <div className="create-event-page">
            <div className="container">
                <div className="create-event-header">
                    <Link to="/events" className="back-btn"><FiArrowLeft /> Back</Link>
                    <h1>{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
                </div>

                {hasPaidTickets && !organizerHasUpi && (
                    <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
                        <FiAlertCircle />
                        <div>
                            <strong>UPI ID Required:</strong> You need to set up your UPI ID before creating paid events.
                            <Link to="/profile/upi-setup" style={{ marginLeft: '0.5rem', color: 'var(--primary)' }}>Set up now</Link>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="create-event-form">
                    { }
                    <div className="form-section glass">
                        <h3>Basic Information</h3>
                        <div className="form-grid-2">
                            <div className="form-group col-span-2">
                                <label className="form-label">Event Title <span className="required">*</span></label>
                                <input className="form-input" placeholder="A clear, descriptive title for your event" value={form.title} onChange={e => set('title', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category <span className="required">*</span></label>
                                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Language</label>
                                <input className="form-input" placeholder="English" value={form.language} onChange={e => set('language', e.target.value)} />
                            </div>
                            <div className="form-group col-span-2">
                                <label className="form-label">Description <span className="required">*</span></label>
                                <textarea className="form-textarea" rows={5} placeholder="Describe your event — agenda, speakers, what attendees will gain..." value={form.description} onChange={e => set('description', e.target.value)} required />
                            </div>
                            <div className="form-group col-span-2">
                                <label className="form-label">Requirements / Prerequisites</label>
                                <textarea className="form-textarea" rows={2} placeholder="Any prerequisites, what to bring, dress code, etc." value={form.requirements} onChange={e => set('requirements', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Age Restriction</label>
                                <input className="form-input" placeholder="e.g. 18+, All ages, 21+" value={form.ageRestriction} onChange={e => set('ageRestriction', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                                    <option value="draft">Draft (not publicly visible)</option>
                                    <option value="published">Published (visible to everyone)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="form-section glass">
                        <h3>Date & Time</h3>
                        <div className="form-grid-4">
                            <div className="form-group">
                                <label className="form-label">Start Date <span className="required">*</span></label>
                                <input type="date" className="form-input" value={form.startDate} min={isEdit ? undefined : today} onChange={e => { set('startDate', e.target.value); if (form.endDate && e.target.value > form.endDate) set('endDate', e.target.value); }} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date <span className="required">*</span></label>
                                <input type="date" className="form-input" value={form.endDate} min={form.startDate || (isEdit ? undefined : today)} onChange={e => set('endDate', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Start Time</label>
                                <input type="time" className="form-input" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Time</label>
                                <input type="time" className="form-input" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
                            </div>
                            <div className="form-group col-span-4">
                                <label className="form-label">Timezone</label>
                                <select className="form-select" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
                                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="form-section glass">
                        <h3>Event Location</h3>
                        <div className="location-toggle">
                            <button
                                type="button"
                                className={`loc-toggle-btn ${!form.isOnline ? 'active' : ''}`}
                                onClick={() => set('isOnline', false)}
                            >
                                <FiMapPin size={16} />
                                In-Person
                            </button>
                            <button
                                type="button"
                                className={`loc-toggle-btn ${form.isOnline ? 'active' : ''}`}
                                onClick={() => set('isOnline', true)}
                            >
                                <FiWifi size={16} />
                                Online
                            </button>
                        </div>

                        {form.isOnline ? (
                            <div className="online-fields">
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Online Platform <span className="required">*</span></label>
                                        <select className="form-select" value={form.onlinePlatform} onChange={e => set('onlinePlatform', e.target.value)}>
                                            <option value="">Select platform</option>
                                            {ONLINE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Meeting Link <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            type="url"
                                            placeholder="https://zoom.us/j/..."
                                            value={form.onlineLink}
                                            onChange={e => set('onlineLink', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="online-info-note">
                                    The meeting link will only be visible to registered attendees with confirmed tickets.
                                </div>
                            </div>
                        ) : (
                            <div className="physical-fields">
                                <div className="form-group mb-4">
                                    <label className="form-label">Select Saved Venue (Optional)</label>
                                    <select className="form-select" value={form.venueRef} onChange={handleVenueSelect}>
                                        <option value="">-- Custom Location --</option>
                                        {venues.map(v => <option key={v._id} value={v._id}>{v.name} ({v.address?.city})</option>)}
                                    </select>
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Address Line 1 <span className="required">*</span></label>
                                        <input className="form-input" placeholder="Street address, building name, floor" value={form.physicalLocation.addressLine1} onChange={e => setLocation('addressLine1', e.target.value)} required={!form.isOnline} />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Address Line 2</label>
                                        <input className="form-input" placeholder="Area, neighbourhood (optional)" value={form.physicalLocation.addressLine2} onChange={e => setLocation('addressLine2', e.target.value)} />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label"><FiNavigation size={13} /> Map Link (Optional)</label>
                                        <input type="url" className="form-input" placeholder="https://maps.google.com/..." value={form.physicalLocation.mapLink} onChange={e => setLocation('mapLink', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City <span className="required">*</span></label>
                                        <input className="form-input" placeholder="City" value={form.physicalLocation.city} onChange={e => setLocation('city', e.target.value)} required={!form.isOnline} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">State / Province</label>
                                        <input className="form-input" placeholder="State or province" value={form.physicalLocation.state} onChange={e => setLocation('state', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Country <span className="required">*</span></label>
                                        <input className="form-input" placeholder="Country" value={form.physicalLocation.country} onChange={e => setLocation('country', e.target.value)} required={!form.isOnline} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Postal / ZIP Code</label>
                                        <input className="form-input" placeholder="Postal code" value={form.physicalLocation.postalCode} onChange={e => setLocation('postalCode', e.target.value)} />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="form-label">Landmark / Note</label>
                                        <input className="form-input" placeholder="Nearby landmark or directions" value={form.physicalLocation.landmark} onChange={e => setLocation('landmark', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    { }
                    <div className="form-section glass">
                        <h3>Capacity</h3>
                        <div className="form-group" style={{ maxWidth: '300px' }}>
                            <label className="form-label">Maximum Attendees</label>
                            <input type="number" className="form-input" placeholder="Leave empty for unlimited" value={form.maxAttendees} onChange={e => set('maxAttendees', e.target.value)} min={1} />
                        </div>
                    </div>

                    { }
                    <div className="form-section glass">
                        <div className="section-header-row">
                            <h3>Ticket Types</h3>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={addTicketType}>
                                <FiPlus /> Add Ticket Type
                            </button>
                        </div>

                        {hasPaidTickets && !organizerHasUpi && (
                            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                                <FiAlertCircle size={14} />
                                UPI ID not set. Paid tickets require your UPI ID for payment collection.
                            </div>
                        )}

                        {form.ticketTypes.map((t, i) => (
                            <div key={i} className="ticket-form-card">
                                <div className="ticket-form-header">
                                    <h4>Ticket #{i + 1}</h4>
                                    {form.ticketTypes.length > 1 && (
                                        <button type="button" className="btn-icon" onClick={() => removeTicketType(i)} title="Remove"><FiX size={16} /></button>
                                    )}
                                </div>
                                <div className="form-grid-3">
                                    <div className="form-group col-span-1">
                                        <label className="form-label">Name <span className="required">*</span></label>
                                        <input className="form-input" placeholder="e.g. General Admission" value={t.name} onChange={e => updateTicket(i, 'name', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price (₹)</label>
                                        <input type="number" className="form-input" placeholder="0 for free" value={t.price} onChange={e => updateTicket(i, 'price', Number(e.target.value))} min={0} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Quantity</label>
                                        <input type="number" className="form-input" placeholder="Available tickets" value={t.quantity} onChange={e => updateTicket(i, 'quantity', Number(e.target.value))} min={1} required />
                                    </div>
                                    <div className="form-group col-span-3">
                                        <label className="form-label">Description</label>
                                        <input className="form-input" placeholder="What's included, perks, access..." value={t.description} onChange={e => updateTicket(i, 'description', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {hasPaidTickets && (
                            <div className="form-group">
                                <label className="form-label">Refund Policy</label>
                                <textarea className="form-textarea" rows={2} placeholder="Describe your refund and cancellation policy for paid tickets" value={form.refundPolicy} onChange={e => set('refundPolicy', e.target.value)} />
                            </div>
                        )}
                    </div>

                    { }
                    <div className="form-section glass">
                        <h3>Tags</h3>
                        <div className="tag-input-row">
                            <input className="form-input" placeholder="Add keyword tags to help people find your event" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                            <button type="button" className="btn btn-secondary" onClick={addTag}><FiPlus /></button>
                        </div>
                        <div className="tags-row" style={{ marginTop: '0.75rem' }}>
                            {form.tags.map(t => (
                                <span key={t} className="tag">
                                    {t}
                                    <button type="button" onClick={() => set('tags', form.tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: '0.25rem', padding: 0 }}>
                                        <FiX size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="form-submit-row">
                        <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default CreateEvent;
