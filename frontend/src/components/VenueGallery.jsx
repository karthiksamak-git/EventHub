import { useEffect, useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { mediaUrl } from '../services/api';
import './VenueGallery.css';

/**
 * Read-only gallery: a large lead image, thumbnails, and a keyboard-navigable
 * lightbox. Renders nothing when the venue has no photos.
 */
const VenueGallery = ({ photos = [], name = 'Venue' }) => {
    const [active, setActive] = useState(0);
    const [lightbox, setLightbox] = useState(false);

    // Photos can disappear while the page is open (a photo is deleted), so the
    // selected index is clamped at render time rather than synced in an effect.
    const index = Math.min(active, Math.max(0, photos.length - 1));

    useEffect(() => {
        if (!lightbox) return undefined;

        const onKey = (e) => {
            if (e.key === 'Escape') setLightbox(false);
            if (e.key === 'ArrowRight') setActive(i => (i + 1) % photos.length);
            if (e.key === 'ArrowLeft') setActive(i => (i - 1 + photos.length) % photos.length);
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [lightbox, photos.length]);

    if (!photos.length) return null;

    const current = photos[index];

    return (
        <div className="venue-gallery">
            <div className="venue-gallery-main">
                <img
                    src={mediaUrl(current.url)}
                    alt={current.caption || `${name} photo ${index + 1}`}
                    onClick={() => setLightbox(true)}
                />
                {photos.length > 1 && (
                    <>
                        <button
                            type="button"
                            className="gallery-nav prev"
                            aria-label="Previous photo"
                            onClick={() => setActive(i => (i - 1 + photos.length) % photos.length)}
                        >
                            <FiChevronLeft />
                        </button>
                        <button
                            type="button"
                            className="gallery-nav next"
                            aria-label="Next photo"
                            onClick={() => setActive(i => (i + 1) % photos.length)}
                        >
                            <FiChevronRight />
                        </button>
                        <span className="gallery-counter">{index + 1} / {photos.length}</span>
                    </>
                )}
            </div>

            {photos.length > 1 && (
                <div className="venue-gallery-thumbs">
                    {photos.map((photo, i) => (
                        <button
                            key={photo._id}
                            type="button"
                            className={`venue-gallery-thumb ${i === index ? 'active' : ''}`}
                            onClick={() => setActive(i)}
                            aria-label={`Show photo ${i + 1}`}
                        >
                            <img src={mediaUrl(photo.url)} alt="" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}

            {lightbox && (
                <div className="gallery-lightbox" onClick={() => setLightbox(false)}>
                    <button type="button" className="gallery-close" aria-label="Close" onClick={() => setLightbox(false)}>
                        <FiX size={22} />
                    </button>
                    <img
                        src={mediaUrl(current.url)}
                        alt={current.caption || `${name} photo ${index + 1}`}
                        onClick={e => e.stopPropagation()}
                    />
                    {photos.length > 1 && (
                        <>
                            <button type="button" className="gallery-nav prev" aria-label="Previous photo"
                                onClick={e => { e.stopPropagation(); setActive(i => (i - 1 + photos.length) % photos.length); }}>
                                <FiChevronLeft size={26} />
                            </button>
                            <button type="button" className="gallery-nav next" aria-label="Next photo"
                                onClick={e => { e.stopPropagation(); setActive(i => (i + 1) % photos.length); }}>
                                <FiChevronRight size={26} />
                            </button>
                        </>
                    )}
                    {current.caption && <p className="gallery-caption">{current.caption}</p>}
                </div>
            )}
        </div>
    );
};

export default VenueGallery;
