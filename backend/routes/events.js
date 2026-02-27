const express = require('express');
const router = express.Router();
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent, likeEvent, addComment, getCalendarEvents, getMyEvents } = require('../controllers/eventController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getEvents);
router.get('/calendar', getCalendarEvents);
router.get('/my', protect, getMyEvents);
router.get('/:id', optionalAuth, getEvent);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/like', protect, likeEvent);
router.post('/:id/comments', protect, addComment);

module.exports = router;
