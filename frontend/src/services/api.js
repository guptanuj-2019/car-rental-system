import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = axios.create({
  baseURL: 'https://car-rental-api-dok7.onrender.com/api', 
});

API.interceptors.request.use((req) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && userInfo.token) {
    req.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An unexpected error occurred';
    toast.error(message);

    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('userInfo');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
