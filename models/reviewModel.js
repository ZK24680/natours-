//review / rating/ createAt, ref to tour , ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can't be empty"]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must be belong to a tour']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      requried: [true, 'Review must be belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//to avoide duplicate user's reveiew on a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        ratingAverage: { $avg: '$rating' } // ✅ Correct usage!
      }
    },
    {
      $set: { ratingAverage: { $round: ['$ratingAverage', 1] } }
    }
  ]);

  // console.log(stats);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRatings,
    ratingsAverage: stats[0].ratingAverage
  });
};

//Document Middle

//calculate Average rating for tour
reviewSchema.post('save', function(doc, next) {
  this.constructor.calcAverageRating(doc.tour);

  next();
});

//Query middleware

//Calculate Average rating for tour when a tour is deleted or updated
reviewSchema.post(/^findOne/, function(doc, next) {
  doc.constructor.calcAverageRating(doc.tour);

  next();
});

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
