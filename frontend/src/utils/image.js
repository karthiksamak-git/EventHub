// Browser-side image preparation for venue photos.
//
// Vercel caps serverless request bodies at ~4.5 MB, so photos are downscaled and
// re-encoded before they leave the browser. Anything that is still too large keeps
// dropping in quality rather than failing the upload.

const MAX_DATA_URL_LENGTH = 700 * 1024; // ~525 KB of image bytes

export const compressImage = (file, { maxDim = 1600, quality = 0.82 } = {}) =>
    new Promise((resolve, reject) => {
        if (!file.type?.startsWith('image/')) {
            reject(new Error(`${file.name || 'That file'} is not an image.`));
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            try {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const width = Math.max(1, Math.round(img.width * scale));
                const height = Math.max(1, Math.round(img.height * scale));

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                // JPEG has no alpha channel; fill white so transparent PNGs do not turn black.
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                let q = quality;
                while (dataUrl.length > MAX_DATA_URL_LENGTH && q > 0.4) {
                    q = Math.round((q - 0.1) * 100) / 100;
                    dataUrl = canvas.toDataURL('image/jpeg', q);
                }

                resolve(dataUrl);
            } catch {
                reject(new Error('That image could not be processed.'));
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error(`${file.name || 'That image'} could not be read. Try a JPEG, PNG or WebP.`));
        };

        img.src = objectUrl;
    });
