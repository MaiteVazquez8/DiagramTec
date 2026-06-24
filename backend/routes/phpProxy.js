const express = require('express');
const axios = require('axios');

const router = express.Router();
const PHP_HOST = process.env.PHP_HOST || 'localhost';
const PHP_PORT = process.env.PHP_PORT || '8000';
const PHP_BACKEND_URL = process.env.PHP_BACKEND_URL || `http://${PHP_HOST}:${PHP_PORT}`;

router.all('/:file(*)', async (req, res) => {
  try {
    let file = req.params.file;
    if (!file.toLowerCase().endsWith('.php')) {
      file = `${file}.php`;
    }

    const response = await axios({
      method: req.method,
      url: `${PHP_BACKEND_URL}/${file}`,
      data: req.body,
      params: req.query,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        Cookie: req.headers.cookie || '',
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (location) {
        const cookies = response.headers['set-cookie'];
        if (cookies) {
          res.setHeader('set-cookie', cookies);
        }
        return res.redirect(response.status, location);
      }
    }

    if (response.headers['set-cookie']) {
      res.setHeader('set-cookie', response.headers['set-cookie']);
    }
    if (response.headers['content-type']) {
      res.setHeader('content-type', response.headers['content-type']);
    }

    res.status(response.status).send(response.data);
  } catch (err) {
    if (err.response?.status >= 300 && err.response?.status < 400 && err.response.headers?.location) {
      const cookies = err.response.headers['set-cookie'];
      if (cookies) {
        res.setHeader('set-cookie', cookies);
      }
      return res.redirect(err.response.status, err.response.headers.location);
    }
    console.error('PHP proxy error:', err.message || err);
    if (err.response) {
      return res.status(err.response.status).send(err.response.data);
    }
    res.status(500).json({ error: 'PHP proxy error' });
  }
});

module.exports = router;
