import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import './Auth.css';

const Login = () => {
    const { login, isAuth, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Set by ProtectedRoute when a signed-out visitor opens a private page.
    const requested = location.state?.from;
    const redirectTo = typeof requested === 'string' && requested.startsWith('/') ? requested : null;

    const set = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = form.email.trim().toLowerCase();

        if (!email || !form.password) {
            setError('Enter your email and password to continue.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const user = await login(email, form.password);
            navigate(redirectTo || (user.role === 'admin' ? '/dashboard' : '/'), { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message
                || (err.response ? 'Unable to sign in right now. Please try again.' : 'Cannot reach the server. Check your connection and try again.')
            );
            setLoading(false);
        }
    };

    // Already signed in (for example after the redirect below runs): send the
    // visitor on to wherever they were headed instead of showing the form again.
    if (isAuth) return <Navigate to={redirectTo || (user?.role === 'admin' ? '/dashboard' : '/')} replace />;

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-orb auth-orb-1" />
                <div className="auth-orb auth-orb-2" />
            </div>

            <div className="auth-card glass animate-scale">
                <div className="auth-brand">
                    <div className="brand-logo">EH</div>
                    <h1>Welcome Back</h1>
                    <p>{redirectTo ? 'Sign in to continue where you left off' : 'Sign in to your EventHub account'}</p>
                </div>

                {error && (
                    <div className="auth-alert" role="alert">
                        <FiAlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">Email Address</label>
                        <div className="input-icon-wrap">
                            <FiMail />
                            <input
                                id="login-email"
                                className="form-input"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                autoFocus
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">Password</label>
                        <div className="input-icon-wrap">
                            <FiLock />
                            <input
                                id="login-password"
                                className="form-input"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Your password"
                                autoComplete="current-password"
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                required
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
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don&apos;t have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
