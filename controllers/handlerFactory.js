const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apifeatures');

exports.deleteOne = Model => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document was found with this id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
};

exports.createOne = Model =>
  catchAsync(async (req, res) => {
    // const newTour = new Tour(req.body);
    // newTour.save();

    const newTour = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document found with this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.params.id);
    let query = Model.findById(req.params.id);

    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;
    if (!doc) {
      return next(new AppError('No document with this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res) => {
    console.log(req.query);

    // For get all review document based on tour ID (hack XD)
    let filter = {};
    if (req.params.tourID) filter = { tour: req.params.tourID };

    // Build Query
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitedFields()
      .panginate();

    //Excute Query

    //to check the query details
    // const doc = await features.query.explain();
    const doc = await features.query;

    //Respone
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc }
    });
  });
