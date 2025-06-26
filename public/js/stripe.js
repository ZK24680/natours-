/* eslint-disable */
import axios from 'axios';

export const bookTour = async tourId => {
  try {
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // console.log(session);

    window.location.href = session.data.session.url;
  } catch (err) {
    console.log(err);
  }
};
