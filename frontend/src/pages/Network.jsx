import { useState, useEffect } from 'react';
import { networkAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSearch, FiUserPlus, FiUserCheck, FiUsers, FiX } from 'react-icons/fi';
import './Network.css';

const Network = () => {
    const { user, isAuth } = useAuth();
    const [tab, setTab] = useState('discover');
    const [people, setPeople] = useState([]);
    const [connections, setConnections] = useState([]);
    const [requests, setRequests] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuth) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                if (tab === 'discover') {
                    const res = await usersAPI.getAll({ search, limit: 30 });
                    setPeople(res.data.users || []);
                } else {
                    const res = await networkAPI.getConnections();
                    setConnections(res.data.connections || []);
                    setRequests(res.data.requests || []);
                }
            } catch { }
            setLoading(false);
        };
        fetchData();
    }, [tab, search, isAuth]);

    const handleConnect = async (userId) => {
        try {
            await networkAPI.connect(userId);
            toast.success('Connection request sent!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleAccept = async (userId) => {
        try {
            await networkAPI.accept(userId);
            toast.success('Connection accepted!');
            setRequests(prev => prev.filter(r => r._id !== userId));
            const res = await networkAPI.getConnections();
            setConnections(res.data.connections || []);
        } catch { toast.error('Failed'); }
    };

    const handleDisconnect = async (userId) => {
        try {
            await networkAPI.disconnect(userId);
            toast.success('Connection removed');
            setConnections(prev => prev.filter(c => c._id !== userId));
        } catch { toast.error('Failed'); }
    };

    if (!isAuth) {
        return (
            <div className="network-page"><div className="container"><div className="empty-state" style={{ marginTop: '7rem' }}>
                <div className="icon">🤝</div><h3>Join EventHub to Network</h3><p>Connect with event organizers and attendees</p>
                <Link to="/register" className="btn btn-primary">Create Account</Link>
            </div></div></div>
        );
    }

    const UserCard = ({ u, showActions = true, isConnected = false }) => (
        <div className="user-card card">
            <div className="user-card-header"></div>
            <div className="user-card-avatar avatar-placeholder xl">{u.name?.[0]?.toUpperCase()}</div>
            <div className="user-card-body">
                <h3 className="user-name">{u.name}</h3>
                {u.role !== 'user' && <span className="badge badge-primary">{u.role}</span>}
                {u.location && <div className="user-location">📍 {u.location}</div>}
                {u.bio && <p className="user-bio">{u.bio.substring(0, 80)}{u.bio.length > 80 ? '...' : ''}</p>}
                {u.interests?.length > 0 && (
                    <div className="user-interests">{u.interests.slice(0, 3).map(i => <span key={i} className="tag">{i}</span>)}</div>
                )}
                <div className="user-card-actions">
                    {showActions && !isConnected && u._id !== user?.id && (
                        <button className="btn btn-primary btn-sm w-full" onClick={() => handleConnect(u._id)}>
                            <FiUserPlus size={14} /> Connect
                        </button>
                    )}
                    {isConnected && (
                        <button className="btn btn-secondary btn-sm w-full" onClick={() => handleDisconnect(u._id)}>
                            <FiUserCheck size={14} /> Connected
                        </button>
                    )}
                    <div className="user-connections-count"><FiUsers size={12} /> {u.connections?.length || 0} connections</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="network-page">
            <div className="container">
                <div className="page-header">
                    <h1>🤝 <span className="gradient-text">People</span></h1>
                    <p>Connect with attendees and organizers in the community</p>
                </div>

                <div className="tabs">
                    <button className={`tab ${tab === 'discover' ? 'active' : ''}`} onClick={() => setTab('discover')}>Discover People</button>
                    <button className={`tab ${tab === 'connections' ? 'active' : ''}`} onClick={() => setTab('connections')}>My Connections ({connections.length})</button>
                    <button className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>Requests {requests.length > 0 && <span className="request-badge">{requests.length}</span>}</button>
                </div>

                {tab === 'discover' && (
                    <>
                        <div className="search-bar" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                            <FiSearch className="search-icon" />
                            <input type="text" placeholder="Search people by name..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
                            {search && <button className="clear-btn" onClick={() => setSearch('')}><FiX /></button>}
                        </div>
                        {loading ? <div className="loading-screen"><div className="spinner"></div></div> :
                            people.length > 0 ? (
                                <div className="people-grid">{people.map(u => <UserCard key={u._id} u={u} />)}</div>
                            ) : <div className="empty-state"><div className="icon">👤</div><h3>No users found</h3></div>}
                    </>
                )}

                {tab === 'connections' && (
                    loading ? <div className="loading-screen"><div className="spinner"></div></div> :
                        connections.length > 0 ? (
                            <div className="people-grid">{connections.map(u => <UserCard key={u._id} u={u} isConnected showActions={false} />)}</div>
                        ) : <div className="empty-state"><div className="icon">🤝</div><h3>No connections yet</h3><p>Discover people and start connecting!</p><button className="btn btn-primary" onClick={() => setTab('discover')}>Discover People</button></div>
                )}

                {tab === 'requests' && (
                    loading ? <div className="loading-screen"><div className="spinner"></div></div> :
                        requests.length > 0 ? (
                            <div className="requests-list">
                                {requests.map(u => (
                                    <div key={u._id} className="request-card card">
                                        <div className="avatar-placeholder lg">{u.name?.[0]?.toUpperCase()}</div>
                                        <div className="request-info">
                                            <h4>{u.name}</h4>
                                            <p>{u.bio?.substring(0, 60) || 'No bio'}</p>
                                        </div>
                                        <div className="request-actions">
                                            <button className="btn btn-primary btn-sm" onClick={() => handleAccept(u._id)}>Accept</button>
                                            <button className="btn btn-secondary btn-sm">Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <div className="empty-state"><div className="icon">📬</div><h3>No pending requests</h3></div>
                )}
            </div>
        </div>
    );
};
export default Network;
