const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Enforce Environment Variable. NO hardcoded keys!
const API_KEY = process.env.GNEWS_API_KEY;

// --- Caching System ---
// Store data in memory: { cacheKey: { data: {...}, timestamp: 123456789 } }
const cache = {};
// 60 minutes in milliseconds
const CACHE_DURATION = 60 * 60 * 1000; 

// Detect if files are in 'public' or in the root directory (handles GitHub upload edge cases)
const staticFolder = fs.existsSync(path.join(__dirname, 'public')) 
    ? path.join(__dirname, 'public') 
    : __dirname;

app.use(express.static(staticFolder));

// API Route to proxy GNews
app.get('/api/news', async (req, res) => {
    if (!API_KEY) {
        console.error("CRITICAL ERROR: GNEWS_API_KEY is missing from environment variables.");
        return res.status(500).json({ error: 'Server misconfiguration: API Key is missing. Please add it to your server Environment Variables.' });
    }

    const { category = 'general', country = 'in', lang = 'en', q } = req.query;
    
    // Create a unique cache key based on the request parameters
    const cacheKey = q ? `search_${q}_${lang}_${country}` : `top_${category}_${lang}_${country}`;

    // Check if we have valid cached data
    const now = Date.now();
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_DURATION)) {
        console.log(`[CACHE HIT] Returning saved data for ${cacheKey}`);
        return res.json(cache[cacheKey].data);
    }

    console.log(`[CACHE MISS] Fetching fresh data from GNews for ${cacheKey}`);
    
    let url;
    
    // If a specific query (like a state) is requested, use the /search endpoint
    if (q) {
        url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${lang}&apikey=${API_KEY}`;
    } else {
        // Otherwise use the /top-headlines endpoint
        url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&apikey=${API_KEY}`;
    }
    
    if (country && country !== 'undefined') {
        url += `&country=${country}`;
    }

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`GNews API Error: ${response.status}`);
            return res.status(response.status).json({ error: `GNews API Error: ${response.status}` });
        }
        
        const data = await response.json();
        
        // Save fresh data to the cache
        cache[cacheKey] = {
            data: data,
            timestamp: now
        };
        
        res.json(data);
    } catch (error) {
        console.error("Error fetching from GNews:", error);
        res.status(500).json({ error: 'Failed to fetch news data from upstream.' });
    }
});

// Fallback to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(staticFolder, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Morning Digest server is running on port ${PORT}`);
    if (!API_KEY) {
        console.warn("WARNING: No GNEWS_API_KEY found! API requests will fail.");
    }
});
