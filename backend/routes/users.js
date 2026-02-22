const express = require('express');
const router = express.Router();
const { getUsers, getUser, getUserEvents } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.get('/:id', protect, getUser);
router.get('/:id/events', protect, getUserEvents);

module.exports = router;
