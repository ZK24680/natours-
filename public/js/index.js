/* eslint-disable */
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

const loginForm = document.querySelector('.form--login');
const map = document.querySelector('#map');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-settings');
const booktour = document.querySelector('#book-tour');

if (map) {
  const locations = JSON.parse(map.dataset.locations);

  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);

    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    document.querySelector('.btn--save-password').innerHTML = 'Updating...';
    const currentPassword = document.querySelector('#password-current').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#password-confirm').value;

    await updateSettings(
      { currentPassword, password, confirmPassword },
      'password'
    );

    document.querySelector('.btn--save-password').innerHTML = 'Save Password';
  });
}

if (booktour) {
  booktour.addEventListener('click', async function(e) {
    booktour.textContent = 'processing.....';
    const tourId = e.target.dataset.tourid;

    await bookTour(tourId);
  });
}
