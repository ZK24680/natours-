const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1 Get Data from collection
  const tours = await Tour.find();

  // 2 Build Template

  // 3 Render template based on data from stage 1
  res.status(200).render('overview', {
    title: 'All Tour',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1 Get the data of requested tour from collection

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'rating review -tour'
  });

  // console.log(tour);

  //2 Build Template
  //3 Render Template
  if (!tour) {
    return next(new AppError('There is no tour with this route!', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log in to your account'
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your Account'
  });
});

exports.getMyBookTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  const tourIDs = bookings.map(book => book.tour);

  const booktours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours: booktours
  });
});
