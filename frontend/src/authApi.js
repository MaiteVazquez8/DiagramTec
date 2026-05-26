import axios from 'axios';

// Login y registro vía backend proxy hacia PHP
const authApi = axios.create({
  baseURL: '/api/php-auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default authApi;
