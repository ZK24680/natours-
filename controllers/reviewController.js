const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// exports.getAllReview = catchAsync(async (req, res, next) => {
//   let filter = {};
//   console.log(req.params.tourID);
//   if (req.params.tourID) filter = { tour: req.params.tourID };

//   const features = new ApiFeatures(Review.find(filter), req.query);

//   const reviews = await features.query;

//   res.status(200).json({
//     status: 'success',
//     reaults: reviews?.length,
//     data: {
//       reviews
//     }
//   });
// });

exports.setTourUserID = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourID;

  if (!req.body.user) req.body.user = req.user._id;

  next();
};

// exports.createReview = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review: newReview
//     }
//   });
// });

exports.getReview = factory.getOne(Review);
exports.getAllReview = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
