import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import {
    FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiBriefcase, FiAlertCircle, FiCheck
} from 'react-icons/fi';
import './Auth.css';

const ORG_TYPES = [
    { value: 'company', label: 'Company / Business' },
    { value: 'startup', label: 'Startup' },
    { value: 'ngo', label: 'NGO / Non-profit' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'government', label: 'Government Body' },
    { value: 'community', label: 'Community Group' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6;

const Register = () => {
    const { register, isAuth, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [accountType, setAccountType] = useState('individual');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [touched, setTouched] = useState({});
    const [form, setForm] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        organizationName: '', organizationType: ''
    });

    const requested = location.state?.from;
    const redirectTo = typeof requested === 'string' && requested.startsWith('/') ? requested : null;

    const set = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (error) setError('');
    };
    const blur = (key) => setTouched(prev => ({ ...prev, [key]: true }));

    // Field-level messages are derived, so they update live as the user types.
    const errors = {
        name: !form.name.trim() ? 'Enter your name.' : '',
        email: !form.email.trim()
            ? 'Enter your email address.'
            : !EMAIL_RE.test(form.email.trim()) ? 'Enter a valid email address.' : '',
        password: !form.password
            ? 'Choose a password.'
            : form.password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : '',
        confirmPassword: !form.confirmPassword
            ? 'Re-enter your password.'
            : form.confirmPassword !== form.password ? 'Passwords do not match.' : '',
        organizationName: accountType === 'organization' && !form.organizationName.trim()
            ? 'Enter your organization name.' : '',
    };

    const isValid = Object.values(errors).every(message => !message);
    const showError = (key) => (touched[key] ? errors[key] : '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setTouched({ name: true, email: true, password: true, confirmPassword: true, organizationName: true });

        if (!isValid) {
            setError('Please fix the highlighted fields before continuing.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const user = await register({
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                password: form.password,
                accountType,
                organizationName: accountType === 'organization' ? form.organizationName.trim() : '',
                organizationType: accountType === 'organization' ? form.organizationType : '',
            });

            // Organizers must add a UPI ID before they can sell paid tickets.
            if (user.role === 'organizer') navigate('/profile/upi-setup', { replace: true });
            else navigate(redirectTo || '/', { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message
                || (err.response ? 'Could not create your account. Please try again.' : 'Cannot reach the server. Check your connection and try again.')
            );
            setLoading(false);
        }
    };

    if (isAuth) return <Navigate to={user?.role === 'organizer' ? '/profile/upi-setup' : redirectTo || '/'} replace />;

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

                <div className="account-type-selector" role="group" aria-label="Account type">
                    <button
                        type="button"
                        className={`type-btn ${accountType === 'individual' ? 'active' : ''}`}
                        onClick={() => setAccountType('individual')}
                        aria-pressed={accountType === 'individual'}
                    >
                        <FiUser size={18} />
                        <span>Individual</span>
                        <small>Attend or organize events personally</small>
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${accountType === 'organization' ? 'active' : ''}`}
                        onClick={() => setAccountType('organization')}
                        aria-pressed={accountType === 'organization'}
                    >
                        <FiBriefcase size={18} />
                        <span>Organization</span>
                        <small>Company, NGO, institution or community</small>
                    </button>
                </div>

                {error && (
                    <div className="auth-alert" role="alert">
                        <FiAlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {accountType === 'organization' && (
                        <>
                            <div className="form-group">
                                <label className="form-label" htmlFor="register-org">
                                    Organization Name <span className="required">*</span>
                                </label>
                                <div className="input-icon-wrap">
                                    <FiBriefcase />
                                    <input
                                        id="register-org"
                                        className={`form-input ${showError('organizationName') ? 'invalid' : ''}`}
                                        placeholder="Your company or organization name"
                                        autoComplete="organization"
                                        value={form.organizationName}
                                        onChange={e => set('organizationName', e.target.value)}
                                        onBlur={() => blur('organizationName')}
                                        aria-invalid={!!showError('organizationName')}
                                    />
                                </div>
                                {showError('organizationName') && <p className="field-error">{errors.organizationName}</p>}
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="register-org-type">Organization Type</label>
                                <select
                                    id="register-org-type"
                                    className="form-select"
                                    value={form.organizationType}
                                    onChange={e => set('organizationType', e.target.value)}
                                >
                                    <option value="">Select type (optional)</option>
                                    {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-name">
                            {accountType === 'organization' ? 'Contact Person Name' : 'Full Name'} <span className="required">*</span>
                        </label>
                        <div className="input-icon-wrap">
                            <FiUser />
                            <input
                                id="register-name"
                                className={`form-input ${showError('name') ? 'invalid' : ''}`}
                                placeholder="Full name"
                                autoComplete="name"
                                autoFocus
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                onBlur={() => blur('name')}
                                aria-invalid={!!showError('name')}
                            />
                        </div>
                        {showError('name') && <p className="field-error">{errors.name}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-email">
                            Email Address <span className="required">*</span>
                        </label>
                        <div className="input-icon-wrap">
                            <FiMail />
                            <input
                                id="register-email"
                                className={`form-input ${showError('email') ? 'invalid' : ''}`}
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                onBlur={() => blur('email')}
                                aria-invalid={!!showError('email')}
                            />
                        </div>
                        {showError('email') && <p className="field-error">{errors.email}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-phone">Phone Number</label>
                        <div className="input-icon-wrap">
                            <FiPhone />
                            <input
                                id="register-phone"
                                className="form-input"
                                type="tel"
                                placeholder="+91 00000 00000"
                                autoComplete="tel"
                                value={form.phone}
                                onChange={e => set('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-password">
                            Password <span className="required">*</span>
                        </label>
                        <div className="input-icon-wrap">
                            <FiLock />
                            <input
                                id="register-password"
                                className={`form-input ${showError('password') ? 'invalid' : ''}`}
                                type={showPass ? 'text' : 'password'}
                                placeholder={`At least ${MIN_PASSWORD} characters`}
                                autoComplete="new-password"
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                onBlur={() => blur('password')}
                                aria-invalid={!!showError('password')}
                                aria-describedby="password-hint"
                            />
                            <button
                                type="button"
                                className="pass-toggle"
                                onClick={() => setShowPass(v => !v)}
                                aria-label={showPass ? 'Hide password' : 'Show password'}
                                aria-pressed={showPass}
                            >
                                {showPass ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                        {showError('password')
                            ? <p className="field-error">{errors.password}</p>
                            : form.password.length >= MIN_PASSWORD && (
                                <p className="field-hint" id="password-hint"><FiCheck size={12} /> Password looks good</p>
                            )}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="register-confirm">
                            Confirm Password <span className="required">*</span>
                        </label>
                        <div className="input-icon-wrap">
                            <FiLock />
                            <input
                                id="register-confirm"
                                className={`form-input ${showError('confirmPassword') ? 'invalid' : ''}`}
                                type={showPass ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                                value={form.confirmPassword}
                                onChange={e => set('confirmPassword', e.target.value)}
                                onBlur={() => blur('confirmPassword')}
                                aria-invalid={!!showError('confirmPassword')}
                            />
                        </div>
                        {showError('confirmPassword') && <p className="field-error">{errors.confirmPassword}</p>}
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
