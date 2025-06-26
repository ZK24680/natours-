const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 Get tour that currently booked
  const tour = await Tour.findById(req.params.tourId);

  //Crate Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.host}:3000/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.host}:3000/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tour.id,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`]
          }
        },
        quantity: 1
      }
    ],
    mode: 'payment'
  });

  // Send Created Session
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.getBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();

  await Booking.create(req.query);
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBook = factory.getAll(Booking);
exports.getOneBook = factory.getOne(Booking);
exports.crateNewBook = factory.createOne(Booking);
exports.updateBook = factory.updateOne(Booking);
exports.deleteBook = factory.deleteOne(Booking);
