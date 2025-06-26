const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      unique: false,
      trim: true,
      maxlength: [40, 'A tour must have less or equal then 40 character'],
      minlength: [10, 'A tour must have more or equal then 10 character']
    },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium , or difficulty'
      }
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below 5.0']
    },

    ratingsQuantity: {
      type: Number,
      default: 0
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Disscount ({VALUE}) must be lower than price'
      }
    },

    summary: {
      type: String,
      trim: true, // remove white space from the start and the end
      required: [true, 'A tour must have a summary']
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a image']
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now()
    },

    description: {
      type: String,
      trim: true
    },

    price: {
      type: Number,
      require: true,
      unique: false,
      default: 2000
    },

    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    },

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        description: String,
        day: Number
      }
    ],
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// indexing
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id' // getting review documents that are match with current document _id and review document's tour
});

// Document Middle : before .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query Middle
//find ,findOne, ....
// /^find/ start with find
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// populate gudies (referencing)
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

// Aggregation Middleware
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// tourSchema.post(/^find/, function(doc, next) {
//   console.log(doc);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   console.log('Will save document');
//   next();
// });

// Document Middle : After .save() and .create()
// tourSchema.post('save', function(doc,next) {
//   console.log(doc);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
