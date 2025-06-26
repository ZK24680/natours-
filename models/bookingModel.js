const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    ref: 'Tour',
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Booking must have a tour!']
  },

  user: {
    ref: 'User',
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Booking must have a user!']
  },

  price: {
    type: Number,
    required: [true, 'Booking must have a price!']
  },

  createdAt: {
    type: Date,
    default: Date.now()
  },

  paid: {
    type: Boolean,
    default: true
  }
});

bookingSchema.pre(/^find/, function(next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
