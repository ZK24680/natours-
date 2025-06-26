const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

process.on('uncaughtException', err => {
  console.error(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASEPASSWORD
);

mongoose.connect(DB).then(() => {
  // console.log(con.connection);
  console.log('DB connection successfull!');
});

// const createNewTour = new Tour({
//   name: 'Mandalay',
//   rating: 4.8,
//   price: 1000
// });

// createNewTour
//   .save()
//   .then(doc => console.log(doc))
//   .catch(err => console.log(err));

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}... `);
});

process.on('unhandledRejection', err => {
  console.error(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});

// console.log(process.env);
