const mongoose = require('mongoose');

// Venue photos live in their own collection on purpose:
//  - venue documents stay small (list/detail queries never drag megabytes around)
//  - a normal `venue.save()` can never wipe image bytes
//  - uploaded files are stored in the database, which works on read-only
//    serverless hosts such as Vercel where the filesystem is not writable
const VenuePhotoSchema = new mongoose.Schema({
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    kind: { type: String, enum: ['upload', 'link'], default: 'upload' },
    data: { type: Buffer, select: false },
    contentType: { type: String, default: '' },
    url: { type: String, default: '' },
    caption: { type: String, default: '', trim: true, maxlength: 120 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VenuePhoto', VenuePhotoSchema);
