const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const ratelimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const comperssion = require('compression');
const cors = require('cors');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewsRouter = require('./routes/viewsRoutes');
const bookingsRouter = require('./routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(`${__dirname}`, 'views'));

// 1. Middleware
// console.log(process.env.NODE_ENV);
// Serving Static File
app.use(express.static(path.join(`${__dirname}`, 'public')));

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/1.8.4/axios.min.js'
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/'
];
const connectSrcUrls = ['https://unpkg.com', 'https://tile.openstreetmap.org'];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls]
    }
  })
);

// Limiting request middleware
const limiter = ratelimit.rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request for this route. Please try again laters'
});
app.use(limiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Body parser middle
app.use(express.json());
app.use(cookieParser());

// Mongo Data Sanitize
app.use(mongoSanitize());

//Prevent XSS attack
app.use(xss());

//prevent Http paremeter pollution
app.use(
  hpp({
    whitelist: [
      'difficulty',
      'duration',
      'maxGroupSize',
      'ratingsAverage',
      'price',
      'ratingsQuantity'
    ]
  })
);

app.use(cors());
app.options('*', cors());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

app.use(comperssion());

// routing

app.use('/', viewsRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingsRouter);

// Handling Unhandled routes
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `There is no Route with ${req.originalUrl} url in this server!`
  // });

  // const err = new Error(
  //   `There is no route with ${req.originalUrl} url in this server!`
  // );

  // err.statusCode = 404;
  // err.status = 'fail';

  next(
    new AppError(
      `There is no route with ${req.originalUrl} url in this server!`,
      404
    )
  );
});

app.use(globalErrorHandler);

module.exports = app;
