const express = require('express');
const router = express.Router();
const {
    bookTicket, submitPayment, confirmPayment, rejectPayment,
    getMyTickets, getTicket, getEventTickets, cancelTicket
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

router.post('/book', protect, bookTicket);
router.get('/my', protect, getMyTickets);
router.get('/event/:eventId', protect, getEventTickets);
router.get('/:id', protect, getTicket);
router.delete('/:id', protect, cancelTicket);
router.post('/:id/submit-payment', protect, submitPayment);
router.post('/:id/confirm-payment', protect, confirmPayment);
router.post('/:id/reject-payment', protect, rejectPayment);

module.exports = router;
