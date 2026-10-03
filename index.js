require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

// Store shortened URLs
let urls = [];
let nextId = 1;

// Home page
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Create short URL
app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch (error) {
    return res.json({ error: 'invalid url' });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, function (err) {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists
    const existingUrl = urls.find(function (item) {
      return item.original_url === originalUrl;
    });

    if (existingUrl) {
      return res.json(existingUrl);
    }

    const newUrl = {
      original_url: originalUrl,
      short_url: nextId
    };

    urls.push(newUrl);
    nextId++;

    res.json(newUrl);
  });
});

// Redirect short URL
app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = Number(req.params.short_url);

  const foundUrl = urls.find(function (item) {
    return item.short_url === shortUrl;
  });

  if (!foundUrl) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(foundUrl.original_url);
});

// Start server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});