const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

router.use(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide')
);

router
  .route('/')
  .get(bookingController.getAllBook)
  .post(bookingController.crateNewBook);

router
  .route('/:id')
  .get(bookingController.getOneBook)
  .patch(bookingController.updateBook)
  .delete(bookingController.deleteBook);

module.exports = router;
