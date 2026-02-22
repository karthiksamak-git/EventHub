import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import EventCard from '../components/EventCard';
import { FiSearch, FiFilter, FiX, FiPlus } from 'react-icons/fi';
import './EventsList.css';

const CATEGORIES = ['conference', 'workshop', 'concert', 'sports', 'networking', 'festival', 'exhibition', 'other'];

const EventsList = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [showFilter, setShowFilter] = useState(false);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        startDate: '',
        endDate: ''
    });

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 12, status: 'published' };
            if (filters.search) params.search = filters.search;
            if (filters.category) params.category = filters.category;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            const res = await eventsAPI.getAll(params);
            setEvents(res.data.events || []);
            setTotal(res.data.total || 0);
        } catch { setEvents([]); }
        setLoading(false);
    }, [filters, page]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleFilter = (key, val) => {
        setFilters(p => ({ ...p, [key]: val }));
        setPage(1);
    };
    const clearFilters = () => { setFilters({ search: '', category: '', startDate: '', endDate: '' }); setPage(1); };
    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <div className="events-list-page">
            <div className="container">
                <div className="events-list-header">
                    <div>
                        <h1>Discover <span className="gradient-text">Events</span></h1>
                        <p>{total} events found{filters.category ? ` in ${filters.category}` : ''}</p>
                    </div>
                    <Link to="/events/create" className="btn btn-primary"><FiPlus /> Create Event</Link>
                </div>

                {/* Search & Filter */}
                <div className="events-toolbar">
                    <div className="search-bar">
                        <FiSearch className="search-icon" />
                        <input
                            type="text" placeholder="Search events..."
                            className="search-input" value={filters.search}
                            onChange={e => handleFilter('search', e.target.value)}
                        />
                        {filters.search && <button className="clear-btn" onClick={() => handleFilter('search', '')}><FiX /></button>}
                    </div>
                    <button className={`btn btn-secondary ${showFilter ? 'active' : ''}`} onClick={() => setShowFilter(!showFilter)}>
                        <FiFilter /> Filters {hasFilters && <span className="filter-badge">●</span>}
                    </button>
                    {hasFilters && <button className="btn btn-danger btn-sm" onClick={clearFilters}><FiX /> Clear</button>}
                </div>

                {showFilter && (
                    <div className="filters-panel animate-fade">
                        <div className="filter-group">
                            <label className="form-label">Category</label>
                            <div className="category-filters">
                                <button className={`cat-btn ${!filters.category ? 'active' : ''}`} onClick={() => handleFilter('category', '')}>All</button>
                                {CATEGORIES.map(c => (
                                    <button key={c} className={`cat-btn ${filters.category === c ? 'active' : ''}`} onClick={() => handleFilter('category', c)}>{c}</button>
                                ))}
                            </div>
                        </div>
                        <div className="filter-row">
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input type="date" className="form-input" value={filters.startDate} onChange={e => handleFilter('startDate', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input type="date" className="form-input" value={filters.endDate} onChange={e => handleFilter('endDate', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {}
                {loading ? (
                    <div className="loading-screen"><div className="spinner"></div><p>Loading events...</p></div>
                ) : events.length > 0 ? (
                    <>
                        <div className="grid-3">{events.map(e => <EventCard key={e._id} event={e} />)}</div>
                        {total > 12 && (
                            <div className="pagination">
                                <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                                <span className="page-info">Page {page} of {Math.ceil(total / 12)}</span>
                                <button className="btn btn-secondary" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon"><FiSearch size={24} /></div>
                        <h3>No events found</h3>
                        <p>Try adjusting your filters or be the first to create an event.</p>
                        <Link to="/events/create" className="btn btn-primary">Create Event</Link>
                    </div>
                )}
            </div>
        </div>
    );
};
export default EventsList;
