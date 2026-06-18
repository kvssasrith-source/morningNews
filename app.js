
class MorningDigest {
    constructor() {
        this.currentCategory = 'top';
        this.gridElement = document.getElementById('news-grid');
        this.loaderElement = document.getElementById('loader');
        
        this.init();
    }

    init() {
        this.setDate();
        this.setupEventListeners();
        this.loadNews(this.currentCategory);
    }

    setDate() {
        const dateElement = document.getElementById('current-date');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-IN', options);
    }

    setupEventListeners() {
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                
                // Ignore clicks on elements without data-category (like the States dropdown toggle itself)
                if (!category) return;
                
                // Remove active class from all
                categoryBtns.forEach(b => b.classList.remove('active'));
                
                // If it's a state, we might also want to highlight the main dropdown button, 
                // but for simplicity, we just highlight the specific state button clicked.
                e.target.classList.add('active');
                
                if (this.currentCategory !== category) {
                    this.currentCategory = category;
                    this.loadNews(category);
                }
            });
        });
    }

    async loadNews(category) {
        this.showLoader();
        try {
            const newsData = await fetchNews(category);
            this.renderNews(newsData);
        } catch (error) {
            console.error("Failed to fetch news:", error);
            this.gridElement.innerHTML = `<p style="text-align: center; grid-column: 1/-1;">Failed to load news. Error: ${error.message || error.toString()}. Please check your internet connection or API key.</p>`;
            this.gridElement.classList.remove('hidden');
        } finally {
            this.hideLoader();
        }
    }

    renderNews(newsItems) {
        if (!newsItems || newsItems.length === 0) {
            this.gridElement.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No news available for this category.</p>';
            return;
        }

        const newsHtml = newsItems.map(item => this.createNewsCard(item)).join('');
        this.gridElement.innerHTML = newsHtml;
        
        // Add a small delay before showing the grid to allow images to start loading
        // and to make the transition smoother
        setTimeout(() => {
            this.gridElement.classList.remove('hidden');
        }, 50);
    }

    createNewsCard(item) {
        return `
            <article class="news-card" onclick="window.open('${item.url}', '_blank')">
                <div class="news-image-container">
                    <img src="${item.image}" alt="${item.title}" class="news-image" loading="lazy">
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-source">${item.source}</span>
                        <span class="news-time">${item.time}</span>
                    </div>
                    <h2 class="news-title">${item.title}</h2>
                    <p class="news-description">${item.description}</p>
                    <div class="read-more">
                        Read full story
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </div>
            </article>
        `;
    }

    showLoader() {
        this.gridElement.classList.add('hidden');
        this.loaderElement.classList.remove('hidden');
    }

    hideLoader() {
        this.loaderElement.classList.add('hidden');
    }
}

// Initialize the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new MorningDigest();
});
