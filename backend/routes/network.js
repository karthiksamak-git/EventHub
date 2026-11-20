const express = require('express');
const router = express.Router();
const { getSuggestions, sendConnectionRequest, acceptConnection, declineConnection, removeConnection, getConnections, getEventAttendees } = require('../controllers/networkController');
const { protect } = require('../middleware/auth');

router.get('/suggestions', protect, getSuggestions);
router.get('/connections', protect, getConnections);
router.get('/attendees/:eventId', protect, getEventAttendees);
router.post('/connect/:userId', protect, sendConnectionRequest);
router.put('/accept/:userId', protect, acceptConnection);
router.put('/decline/:userId', protect, declineConnection);
router.delete('/disconnect/:userId', protect, removeConnection);

module.exports = router;
