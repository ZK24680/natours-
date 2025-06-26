const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRESIN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  //Remove Password field from document
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     newUser
  //   }
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  // check valid request (check email and password are included in request)
  const { email, password } = req.body;
  // console.log(password, email);

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // check user exists with requested email and check requested password correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  //send json web token back to client
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });

  createSendToken(user, 200, res);
});

exports.logout = async (req, res, next) => {
  res.clearCookie('jwt', {
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // Getting token and check of it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not log in. Please log in to get access', 401)
    );
  }
  // Verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exits
  const currentUser = await User.findById({ _id: decoded.id });

  if (!currentUser) {
    return next(
      new AppError('User that belong with this token doe not exists', 401)
    );
  }

  // Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Token is invalid. Password is change after login. Please login again!',
        401
      )
    );
  }

  //Grant user
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLogin = async (req, res, next) => {
  if (req.cookies.jwt) {
    // Verification token

    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    // Check if user still exits
    const currentUser = await User.findById({ _id: decoded.id });

    if (!currentUser) {
      return next();
    }

    // Check if user changed password after the token was issued
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next();
    }

    // console.log(currentUser);
    //Grant user
    res.locals.user = currentUser;
    // console.log(res.locals.user);
  }
  next();
};

exports.restrictTo = (...roles) => {
  //roles = ['admin','lead-guide']

  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('User has no permession to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //check there is a user with posted email
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }

  // if user exits create reset Token
  const resetToken = user.createResetToken();

  await user.save({ validateBeforeSave: false });

  //create reset url
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  // send back resturl to email with node mailer
  // const message = `Forgot your password? Submit a PATCH request with your new password and confirmPassword to : ${resetURL} url. If you don't forget your password please ignore this mail`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password Reset Token (expires in 10 minutes)',
    //   message
    // });

    await new Email(user, resetURL).sendResetPassword();

    res.status(200).json({
      status: 'success',
      message: 'Successfully send token to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new AppError('Something went wrong. Email send fail!', 500));
  }
});

exports.resetPasswrod = catchAsync(async (req, res, next) => {
  //1 Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(
      new AppError('Invalid token or token expired. Please Try again!', 401)
    );
  }

  //3 If token has not expired, and there is user, set the new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //3 Update changedPasswordAt property for the user
  //step 3 is happening in save middleware

  //4 Log the user in, send JWT
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get the user from collection

  const user = await User.findById(req.user._id).select('+password');

  //Check if the posted current password is correct
  if (!(await user.correctPassword(req.body.currentPassword))) {
    return next(new AppError('Current Password is not correct', 401));
  }

  //if so, update passwrod,
  user.password = req.body.password;
  // console.log(req.body.password, req.body.confirmPassword);
  user.confirmPassword = req.body.confirmPassword;
  // from document middleware auto update passwordChangeAt
  await user.save();

  //log user in and send JWT
  // const token = signToken(user._id);

  // res.status(200).json({
  //   status: 'success',
  //   token
  // });

  createSendToken(user, 200, res);
});
