const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// exports.checkID = (req, res, next, val) => {
//   if (val * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }

//   next();
// };

// exports.checkBody = (req, res, next) => {
//   console.log(req.body);
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name and price'
//     });
//   }

//   next();
// };

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please only upload image file!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.user.id}-cover.jpg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg()
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.user.id}-${i + 1}.jpg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg()
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  console.log(req.body);
  next();
};

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// exports.getAllTour = catchAsync(async (req, res) => {
//   console.log(req.query);

//   //Build Query
//   // const queryObj = { ...req.query };
//   // const excludedFields = ['page', 'limit', 'sort', 'fields'];

//   // excludedFields.forEach(el => delete queryObj[el]);

//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
//   // // console.log(queryObj);
//   // // console.log(queryStr);

//   // //Filtering
//   // let query = Tour.find(JSON.parse(queryStr));
//   // {duration : 5} query duration is equal to 5
//   // {duration : {$gte : 5 }} query duration is equal to or greater than 5

//   //Sorting
//   // if (req.query.sort) {
//   //   // console.log(req.query.sort);
//   //   const sortStr = req.query.sort.split(',').join(' ');
//   //   // console.log(sortStr);

//   //   query = query.sort(sortStr);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   //Projection (limit Fields)
//   // if (req.query.fields) {
//   //   // console.log(req.query.fields);

//   //   const queryFields = req.query.fields.split(',').join(' ');

//   //   query = query.select(queryFields);
//   // } else {
//   //   query = query.select('-__v');
//   //   // __v fields is from mongoose , we don't need to send back that fields to our app
//   // }

//   // //Pagination
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;

//   // query = query.skip(skip).limit(limit);

//   // // query.find().sort().select().skip().limit()

//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();

//   //   // console.log(skip, numTours);
//   //   if (skip >= numTours) {
//   //     throw new Error('This page does not exist');
//   //   }
//   // }

//   // Build Query
//   const features = new ApiFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitedFields()
//     .panginate();

//   //Excute Query
//   const tours = await features.query;

//   //Respone
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: { tours }
//   });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   // console.log(req.params.id);

//   const tour = await Tour.findById(req.params.id).populate('reviews');

//   if (!tour) {
//     return next(new AppError('No Tour with this ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

// const catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(err => next(err));
//   };
// };

// exports.createTour = catchAsync(async (req, res) => {
//   // const newTour = new Tour(req.body);
//   // newTour.save();

//   const newTour = await Tour.create(req.body);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const updateTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!updateTour) {
//     return next(new AppError('No tour found with this ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: updateTour
//     }
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour was found with this ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

exports.getAllTour = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please Provide Latitude and longitude in the format lat,lng!',
        400
      )
    );
  }

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // console.log(radius);

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please Provide lattitude and longitude in the format lat,lng !',
        400
      )
    );
  }

  const tours = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      tours
    }
  });
});

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgRating: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    stats
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-1-1`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: {
          $toUpper: {
            $arrayElemAt: [
              [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
              ],
              { $subtract: ['$_id', 1] }
            ]
          }
        }
      }
    },
    {
      $project: { _id: 0 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  });
});
