const express = require('express');
const router = express.Router();
const { getVenues, getVenue, createVenue, updateVenue, deleteVenue, addReview } = require('../controllers/venueController');
const { protect } = require('../middleware/auth');

router.get('/', getVenues);
router.get('/:id', getVenue);
router.post('/', protect, createVenue);
router.put('/:id', protect, updateVenue);
router.delete('/:id', protect, deleteVenue);
router.post('/:id/review', protect, addReview);

module.exports = router;
