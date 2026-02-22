import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiBriefcase } from 'react-icons/fi';
import './Auth.css';

const ORG_TYPES = [
    { value: 'company', label: 'Company / Business' },
    { value: 'startup', label: 'Startup' },
    { value: 'ngo', label: 'NGO / Non-profit' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'government', label: 'Government Body' },
    { value: 'community', label: 'Community Group' },
];

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [accountType, setAccountType] = useState('individual');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        organizationName: '', organizationType: ''
    });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }
        if (accountType === 'organization' && !form.organizationName.trim()) {
            toast.error('Organization name is required.');
            return;
        }
        setLoading(true);
        try {
            const user = await register({ ...form, accountType });
            toast.success('Account created successfully.');

            if (user.role === 'organizer') navigate('/profile/upi-setup');
            else navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />
            </div>

            <div className="auth-card glass animate-scale" style={{ maxWidth: accountType === 'organization' ? '520px' : '460px' }}>
                <div className="auth-brand">
                    <div className="brand-logo">EH</div>
                    <h1>Create Account</h1>
                    <p>Join EventHub — the professional event management platform</p>
                </div>

                {}
                <div className="account-type-selector">
                    <button
                        type="button"
                        className={`type-btn ${accountType === 'individual' ? 'active' : ''}`}
                        onClick={() => setAccountType('individual')}
                    >
                        <FiUser size={18} />
                        <span>Individual</span>
                        <small>Attend or organize events personally</small>
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${accountType === 'organization' ? 'active' : ''}`}
                        onClick={() => setAccountType('organization')}
                    >
                        <FiBriefcase size={18} />
                        <span>Organization</span>
                        <small>Company, NGO, institution or community</small>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {}
                    {accountType === 'organization' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Organization Name <span className="required">*</span></label>
                                <div className="input-icon-wrap">
                                    <FiBriefcase />
                                    <input className="form-input" placeholder="Your company or organization name"
                                        value={form.organizationName} onChange={e => set('organizationName', e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Organization Type</label>
                                <select className="form-select" value={form.organizationType} onChange={e => set('organizationType', e.target.value)}>
                                    <option value="">Select type (optional)</option>
                                    {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">
                            {accountType === 'organization' ? 'Contact Person Name' : 'Full Name'}
                            <span className="required"> *</span>
                        </label>
                        <div className="input-icon-wrap">
                            <FiUser />
                            <input className="form-input" placeholder="Full name"
                                value={form.name} onChange={e => set('name', e.target.value)} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address <span className="required">*</span></label>
                        <div className="input-icon-wrap">
                            <FiMail />
                            <input className="form-input" type="email" placeholder="you@example.com"
                                value={form.email} onChange={e => set('email', e.target.value)} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <div className="input-icon-wrap">
                            <FiPhone />
                            <input className="form-input" type="tel" placeholder="+91 00000 00000"
                                value={form.phone} onChange={e => set('phone', e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password <span className="required">*</span></label>
                        <div className="input-icon-wrap">
                            <FiLock />
                            <input className="form-input" type={showPass ? 'text' : 'password'}
                                placeholder="Minimum 6 characters"
                                value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                            <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    {accountType === 'organization' && (
                        <div className="info-notice">
                            <strong>Note:</strong> As an organizer, you will need to set up your UPI ID after registration to collect payments from attendees.
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
            </div>
        </div>
    );
};
export default Register;
