const express = require('express');
const router = express.Router();
const {
    getVenues, getVenue, getVenuePhoto, createVenue, updateVenue, deleteVenue,
    addVenuePhotos, deleteVenuePhoto, setCoverPhoto, addReview, likeVenue
} = require('../controllers/venueController');
const { protect } = require('../middleware/auth');

router.get('/', getVenues);
router.get('/:id', getVenue);
router.get('/:id/photos/:photoId', getVenuePhoto);
router.post('/', protect, createVenue);
router.put('/:id', protect, updateVenue);
router.delete('/:id', protect, deleteVenue);
router.post('/:id/photos', protect, addVenuePhotos);
router.delete('/:id/photos/:photoId', protect, deleteVenuePhoto);
router.put('/:id/photos/:photoId/cover', protect, setCoverPhoto);
router.post('/:id/review', protect, addReview);
router.post('/:id/like', protect, likeVenue);

module.exports = router;
