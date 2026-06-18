const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GNEWS_API_KEY || '62ad37735139e96fcc35a803936072a4';

// Detect if files are in 'public' or in the root directory
const staticFolder = fs.existsSync(path.join(__dirname, 'public')) 
    ? path.join(__dirname, 'public') 
    : __dirname;

app.use(express.static(staticFolder));

// API Route to proxy GNews
app.get('/api/news', async (req, res) => {
    const { category = 'general', country = 'in', lang = 'en' } = req.query;
    
    let url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&apikey=${API_KEY}`;
    
    if (country && country !== 'undefined') {
        url += `&country=${country}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return res.status(response.status).json({ error: `API Error: ${response.status}` });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news data' });
    }
});

// Fallback to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(staticFolder, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
