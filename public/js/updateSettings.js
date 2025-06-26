/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  const url =
    type === 'password'
      ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
      : 'http://127.0.0.1:3000/api/v1/users/updateMe';

  try {
    const res = await axios({
      method: 'patch',
      url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `Update User-${type} Successful!`);
      window.location.reload();
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
