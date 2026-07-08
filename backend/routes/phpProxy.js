const express = require('express');
const axios = require('axios');

const router = express.Router();
const PHP_BACKEND_URL = process.env.PHP_BACKEND_URL || 'http://localhost:8000';

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
      },
    });

    res.status(response.status).send(response.data);
  } catch (err) {
    console.error('PHP proxy error:', err.message || err);
    if (err.response) {
      return res.status(err.response.status).send(err.response.data);
    }
    res.status(500).json({ error: 'PHP proxy error' });
  }
});

module.exports = router;