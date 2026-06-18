const categoryMap = {
    'top': { category: 'general', country: 'in' },
    'india': { category: 'nation', country: 'in' },
    'world': { category: 'world' }, // No country for world
    'technology': { category: 'technology', country: 'in' },
    'business': { category: 'business', country: 'in' }
};

function formatTime(dateString) {
    const date = new Date(dateString);
    const today = new Intl.DateTimeFormat('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    
    // Calculate relative time (e.g., "2 hours ago")
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInHours = Math.floor(diffInSeconds / 3600);
    const diffInMinutes = Math.floor(diffInSeconds / 60);

    let relativeTime = '';
    if (diffInHours > 24) {
        const days = Math.floor(diffInHours / 24);
        relativeTime = `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
        relativeTime = `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
        relativeTime = `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
        relativeTime = 'Just now';
    }

    return `${today} • ${relativeTime}`;
}

const fetchNews = async (uiCategory = 'top') => {
    try {
        const apiParams = categoryMap[uiCategory] || categoryMap['top'];
        
        // Fetch from our own secure backend proxy instead of GNews directly
        let url = `/api/news?category=${apiParams.category}`;
        if (apiParams.country) {
            url += `&country=${apiParams.country}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();

        // Map the GNews data structure to our app's expected structure
        return data.articles.map((article, index) => ({
            id: `${uiCategory}-${index}`,
            title: article.title,
            description: article.description || 'Click to read the full story.',
            source: article.source.name,
            time: formatTime(article.publishedAt),
            image: article.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800', // Fallback image
            url: article.url
        }));

    } catch (error) {
        console.error("Error fetching from our API proxy:", error);
        throw error;
    }
};
