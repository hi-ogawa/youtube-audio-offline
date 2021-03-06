import axios from 'axios';

const BACKEND_URL_BASE = 'https://user-data-api-rails-autcwh26da-an.a.run.app'
// const BACKEND_URL_BASE = 'http://localhost:3030';

export default {
  register: async (username, password) => {
    const response = await axios.post(
      `${BACKEND_URL_BASE}/register`,
      { username, password },
      { responseType: 'json' }
    );
    return response;
  },

  login: async (username, password) => {
    const response = await axios.post(
      `${BACKEND_URL_BASE}/login`,
      { username, password },
      { responseType: 'json' }
    );
    return response;
  },

  getData: async (state) => {
    const { user: { authToken } } = state;
    const response = await axios.get(
      `${BACKEND_URL_BASE}/data`,
      { responseType: 'json', headers: { Authorization: `Bearer ${authToken}` } });
    return response;
  },
  patchData: async (state) => {
    const { user: { authToken } } = state;
    const response = await axios.patch(
      `${BACKEND_URL_BASE}/data`,
      state,
      { responseType: 'json', headers: { Authorization: `Bearer ${authToken}` } });
    return response;
  },
}
