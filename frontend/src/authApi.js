import axios from 'axios';

// Login y registro vía PHP (proxy /php-auth → Apache/php/)
const authApi = axios.create({
  baseURL: '/php-auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default authApi;
