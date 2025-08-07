// server.js
// Simple Express server to fetch and return YouTube subscriber count.
// Uses an in-memory cache (TTL) to reduce YouTube API calls.

const express = require('express');
const fetch = require('node-fetch'); // if Node v18+ you can use global fetch and remove this dependency
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = 'UC5kX1Pt3qBdjmykufvqsWZw'; // your channel ID
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS) || 9000; // default 9s (align with 10s frontend)
const YT_API_URL = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${YT_API_KEY}`;

if (!YT_API_KEY) {
  console.error('ERROR: Set YOUTUBE_API_KEY in environment (or .env).');
  process.exit(1);
}

// CORS: allow your site origin(s). For development, you can allow all (not recommended for production).
app.use(cors({
  origin: process.env.CORS_ORIGIN || true
}));

let cache = {
  value: null,
  expiresAt: 0
};

async function getSubscriberCountFromYouTube() {
  const res = await fetch(YT_API_URL, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube API error: ${res.status} ${res.statusText} - ${text}`);
  }
  const json = await res.json();
  if (!json.items || !json.items[0] || !json.items[0].statistics) {
    throw new Error('Unexpected YouTube API response');
  }
  const raw = json.items[0].statistics.subscriberCount;
  const parsed = parseInt(raw || '0', 10);
  if (Number.isNaN(parsed)) throw new Error('Subscriber count is not numeric');
  return parsed;
}

app.get('/api/subscribers', async (req, res) => {
  try {
    const now = Date.now();
    if (cache.value !== null && now < cache.expiresAt) {
      // return cached
      return res.json({ subscriberCount: cache.value, cached: true, expiresAt: cache.expiresAt });
    }

    const count = await getSubscriberCountFromYouTube();

    // update cache
    cache.value = count;
    cache.expiresAt = now + CACHE_TTL_MS;

    res.json({ subscriberCount: count, cached: false, expiresAt: cache.expiresAt });
  } catch (err) {
    console.error('Error in /api/subscribers:', err);
    res.status(500).json({ error: 'Failed to fetch subscriber count' });
  }
});

// Optional health route
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
