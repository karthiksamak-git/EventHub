import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { authAPI } from '../services/api';
import { hasSeenUpiPrompt, markUpiPromptSeen } from '../utils/upiOnboarding';
import toast from 'react-hot-toast';
import { FiCreditCard, FiCheck, FiArrowRight, FiInfo } from 'react-icons/fi';
import './UpiSetup.css';

const UpiSetup = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    // A null draft means "show the saved value"; typing takes over until it is saved.
    const [upiDraft, setUpiDraft] = useState(null);
    const upiId = upiDraft ?? user?.upiId ?? '';
    const setUpiId = (value) => setUpiDraft(value);
    const [loading, setLoading] = useState(false);

    // First-time prompt: decided once on arrival, and remembered so it never
    // appears again for this account (including after a reload or a skip).
    const [onboarding] = useState(() => {
        if (!user?.id || user.upiId || hasSeenUpiPrompt(user.id)) return false;
        markUpiPromptSeen(user.id);
        return true;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!upiId.trim()) { toast.error('Please enter your UPI ID.'); return; }
        setLoading(true);
        try {
            const res = await authAPI.setUpiId(upiId.trim());
            setUpiDraft(res.data.user.upiId);
            updateUser({ upiId: res.data.user.upiId, role: res.data.user.role });
            toast.success('UPI ID saved.');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save UPI ID.');
            setLoading(false);
        }
    };

    const handleSkip = () => navigate('/dashboard', { replace: true });

    return (
        <div className="upi-setup-page">
            <div className="container">
                <div className="upi-setup-card glass">
                    <div className="upi-setup-icon">
                        <FiCreditCard size={28} />
                    </div>

                    {onboarding && (
                        <div className="upi-onboarding-note" role="status">
                            <FiInfo size={16} />
                            <span>Welcome! Set your UPI ID first — this step is asked only once.</span>
                        </div>
                    )}

                    <h1>{onboarding ? 'Set Up Your UPI ID First' : 'Set Up Payment Collection'}</h1>
                    <p className="upi-setup-desc">
                        To collect payments from ticket buyers, you need to provide your UPI ID.
                        Attendees will scan a QR code or pay directly to this UPI ID when booking paid tickets.
                    </p>

                    <form onSubmit={handleSubmit} className="upi-form">
                        <div className="form-group">
                            <label className="form-label">Your UPI ID</label>
                            <input
                                className="form-input"
                                placeholder="yourname@upi  or  yourname@bank"
                                value={upiId}
                                onChange={e => setUpiId(e.target.value)}
                                required
                            />
                            <p className="form-hint">
                                Examples: <code>business@paytm</code>, <code>company@ybl</code>, <code>yourname@okaxis</code>
                            </p>
                        </div>

                        <div className="upi-how-it-works">
                            <h4>How payment collection works</h4>
                            <ul>
                                <li><FiCheck size={14} /> When an attendee books a paid ticket, they see your UPI QR code</li>
                                <li><FiCheck size={14} /> They pay the ticket amount to your UPI ID and enter the transaction reference</li>
                                <li><FiCheck size={14} /> You review and confirm the payment from your event dashboard</li>
                                <li><FiCheck size={14} /> Once confirmed, the attendee receives their QR-coded ticket</li>
                            </ul>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? 'Saving...' : 'Save UPI ID and Continue'}
                            {!loading && <FiArrowRight size={16} />}
                        </button>

                        {onboarding && (
                            <button
                                type="button"
                                className="btn btn-secondary btn-lg w-full"
                                style={{ marginTop: '0.75rem' }}
                                onClick={handleSkip}
                                disabled={loading}
                            >
                                Skip for now
                            </button>
                        )}
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-3)' }}>
                        You can also update this later in your{' '}
                        <Link to="/dashboard" style={{ color: 'var(--primary)' }}>profile settings</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
};
export default UpiSetup;
