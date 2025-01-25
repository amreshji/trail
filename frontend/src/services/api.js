import axios from 'axios';

export const BASE_URL = 'http://127.0.0.1:5000';


const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // needed if you rely on cookies/sessions
});

export default api;
