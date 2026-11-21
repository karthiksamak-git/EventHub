import { useRef, useState } from 'react';
import { FiUpload, FiTrash2, FiStar, FiLink, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { venuesAPI, mediaUrl } from '../services/api';
import { compressImage } from '../utils/image';
import './VenueGallery.css';

export const MAX_VENUE_PHOTOS = 12;

/**
 * Photo management for a venue owner (or an admin).
 * Uploads are compressed in the browser, then stored by the API — no external
 * file service is involved, so this works on serverless hosting.
 */
const VenuePhotoManager = ({ venueId, photos = [], onChange }) => {
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');
    const [link, setLink] = useState('');
    const fileInput = useRef(null);

    const remaining = MAX_VENUE_PHOTOS - photos.length;

    const handleFiles = async (fileList) => {
        const files = Array.from(fileList || []).filter(f => f.type?.startsWith('image/'));
        if (!files.length) {
            toast.error('Please choose image files.');
            return;
        }

        const accepted = files.slice(0, Math.max(0, remaining));
        if (!accepted.length) {
            toast.error(`This venue already has the maximum of ${MAX_VENUE_PHOTOS} photos.`);
            return;
        }
        if (accepted.length < files.length) {
            toast.error(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added.`);
        }

        setBusy(true);
        try {
            const prepared = [];
            for (let i = 0; i < accepted.length; i++) {
                setStatus(`Optimising ${i + 1} of ${accepted.length}…`);
                prepared.push({ image: await compressImage(accepted[i]) });
            }

            setStatus('Uploading…');
            const res = await venuesAPI.addPhotos(venueId, { photos: prepared });
            onChange?.(res.data.photos || []);
            (res.data.rejected || []).forEach(message => toast.error(message));
            toast.success(`${res.data.added} photo${res.data.added === 1 ? '' : 's'} added.`);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Upload failed.');
        } finally {
            setBusy(false);
            setStatus('');
            if (fileInput.current) fileInput.current.value = '';
        }
    };

    const handleAddLink = async (e) => {
        e.preventDefault();
        const url = link.trim();
        if (!/^https?:\/\//i.test(url)) {
            toast.error('Image links must start with http:// or https://');
            return;
        }
        setBusy(true);
        try {
            const res = await venuesAPI.addPhotos(venueId, { url });
            onChange?.(res.data.photos || []);
            setLink('');
            toast.success('Photo link added.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not add that link.');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (photoId) => {
        setBusy(true);
        try {
            const res = await venuesAPI.deletePhoto(venueId, photoId);
            onChange?.(res.data.photos || []);
            toast.success('Photo removed.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not remove that photo.');
        } finally {
            setBusy(false);
        }
    };

    const handleCover = async (photoId) => {
        setBusy(true);
        try {
            const res = await venuesAPI.setCover(venueId, photoId);
            onChange?.(res.data.photos || []);
            toast.success('Cover photo updated.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not set the cover photo.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="photo-manager">
            <div className="photo-manager-head">
                <div>
                    <h3><FiImage /> Manage photos</h3>
                    <p className="photo-manager-hint">
                        Show attendees what the space looks like. The first photo is the cover.
                        {remaining > 0 ? ` ${remaining} slot${remaining === 1 ? '' : 's'} left.` : ' Limit reached.'}
                    </p>
                </div>
                <div className="photo-manager-actions">
                    <input
                        ref={fileInput}
                        id="venue-photo-input"
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={e => handleFiles(e.target.files)}
                    />
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => fileInput.current?.click()}
                        disabled={busy || remaining <= 0}
                    >
                        <FiUpload size={14} /> {busy ? (status || 'Working…') : 'Upload photos'}
                    </button>
                </div>
            </div>

            <form className="photo-link-form" onSubmit={handleAddLink}>
                <FiLink size={14} />
                <input
                    type="url"
                    className="form-input"
                    placeholder="…or paste an image link (https://…)"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    disabled={busy || remaining <= 0}
                />
                <button type="submit" className="btn btn-secondary btn-sm" disabled={busy || !link.trim() || remaining <= 0}>
                    Add link
                </button>
            </form>

            {photos.length > 0 ? (
                <div className="photo-manager-grid">
                    {photos.map((photo, index) => (
                        <div key={photo._id} className={`photo-manager-item ${index === 0 ? 'is-cover' : ''}`}>
                            <img src={mediaUrl(photo.url)} alt={photo.caption || 'Venue photo'} loading="lazy" />
                            {index === 0 && <span className="photo-cover-badge"><FiStar size={11} /> Cover</span>}
                            <div className="photo-manager-item-actions">
                                {index !== 0 && (
                                    <button type="button" title="Make cover photo" disabled={busy}
                                        onClick={() => handleCover(photo._id)}>
                                        <FiStar size={13} />
                                    </button>
                                )}
                                <button type="button" title="Remove photo" className="danger" disabled={busy}
                                    onClick={() => handleDelete(photo._id)}>
                                    <FiTrash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="photo-manager-empty">
                    <FiImage size={22} />
                    <span>No photos yet — upload the first one.</span>
                </div>
            )}
        </div>
    );
};

export default VenuePhotoManager;
