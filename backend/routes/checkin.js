const express = require('express');
const router = express.Router();
const { checkIn, getCheckInStats } = require('../controllers/checkinController');
const { protect } = require('../middleware/auth');

router.post('/scan', protect, checkIn);
router.get('/event/:eventId/stats', protect, getCheckInStats);

module.exports = router;
