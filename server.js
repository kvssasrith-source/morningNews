const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoding the API key as fallback
const API_KEY = process.env.GNEWS_API_KEY || '62ad37735139e96fcc35a803936072a4';

// Detect if files are in 'public' or in the root directory (handles GitHub upload edge cases)
const staticFolder = fs.existsSync(path.join(__dirname, 'public')) 
    ? path.join(__dirname, 'public') 
    : __dirname;

app.use(express.static(staticFolder));

// API Route to proxy GNews
app.get('/api/news', async (req, res) => {
    const { category = 'general', country = 'in', lang = 'en', q } = req.query;
    
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
    console.log(`Morning Digest server is running on http://localhost:${PORT}`);
    console.log(`Serving static files from ${staticFolder}`);
});
