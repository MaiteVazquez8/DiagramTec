const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy any request under /php/* to the internal PHP built-in server
router.all('/*', async (req, res) => {
  try {
    const targetPath = req.originalUrl.replace(/^\/php/, '');
    const targetUrl = `http://localhost:8000${targetPath}`;
    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers: Object.assign({}, req.headers),
      data: req.body,
      responseType: 'stream',
      validateStatus: () => true
    };
    // remove host to avoid conflicts
    delete axiosConfig.headers.host;
    const response = await axios(axiosConfig);
    res.status(response.status);
    for (const [k, v] of Object.entries(response.headers)) {
      // avoid overriding express headers that may cause issues
      if (k.toLowerCase() === 'transfer-encoding') continue;
      res.setHeader(k, v);
    }
    response.data.pipe(res);
  } catch (err) {
    console.error('PHP proxy error', err.message);
    res.status(500).json({ error: 'Error proxying to PHP' });
  }
});

module.exports = router;