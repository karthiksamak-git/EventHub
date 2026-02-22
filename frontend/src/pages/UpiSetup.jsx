import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiCreditCard, FiCheck, FiArrowRight } from 'react-icons/fi';
import './UpiSetup.css';

const UpiSetup = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [upiId, setUpiId] = useState(user?.upiId || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!upiId.trim()) { toast.error('Please enter your UPI ID.'); return; }
        setLoading(true);
        try {
            const res = await authAPI.setUpiId(upiId.trim());
            updateUser({ upiId: res.data.user.upiId });
            toast.success('UPI ID saved. You can now create paid events.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save UPI ID.');
        }
        setLoading(false);
    };

    return (
        <div className="upi-setup-page">
            <div className="container">
                <div className="upi-setup-card glass">
                    <div className="upi-setup-icon">
                        <FiCreditCard size={28} />
                    </div>
                    <h1>Set Up Payment Collection</h1>
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
