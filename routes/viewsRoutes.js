const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.getBookingCheckout,
  authController.isLogin,
  viewsController.getOverview
);

router.get('/tours/:slug', authController.isLogin, viewsController.getTour);

router.get('/login', authController.isLogin, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyBookTours);

module.exports = router;
