const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoding the API key as fallback, but typically it belongs in a .env file securely on your server
const API_KEY = process.env.GNEWS_API_KEY || '62ad37735139e96fcc35a803936072a4';

// Serve the static frontend files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Route to proxy GNews
app.get('/api/news', async (req, res) => {
    const { category = 'general', country = 'in', lang = 'en' } = req.query;
    
    let url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&apikey=${API_KEY}`;
    
    // Some categories like 'world' might not use a country filter in our frontend setup
    if (country && country !== 'undefined') {
        url += `&country=${country}`;
    }

    try {
        // Native fetch is available in Node.js >= 18
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

// Start the server
app.listen(PORT, () => {
    console.log(`Morning Digest server is running on http://localhost:${PORT}`);
    console.log(`Serving static files from ${path.join(__dirname, 'public')}`);
});
