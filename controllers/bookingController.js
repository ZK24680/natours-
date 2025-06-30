const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const User = require('../models/userModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1 Get tour that currently booked
  const tour = await Tour.findById(req.params.tourId);

  //Crate Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.hostname}/my-tours`,
    cancel_url: `${req.protocol}://${req.hostname}/tour/${tour.slug}`,
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
            images: [
              `${req.protocol}://${req.hostname}/img/tours/${tour.imageCover}`
            ]
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

// exports.getBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   if (!tour || !user || !price) return next();

//   await Booking.create(req.query);
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBooking = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.getWebHookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRECT
    );
  } catch (err) {
    return res.status(400).send(`Webhook error:${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    await createBooking(event.data.object);
  }

  res.status(200).json({ recived: true });
};

exports.getAllBook = factory.getAll(Booking);
exports.getOneBook = factory.getOne(Booking);
exports.crateNewBook = factory.createOne(Booking);
exports.updateBook = factory.updateOne(Booking);
exports.deleteBook = factory.deleteOne(Booking);
