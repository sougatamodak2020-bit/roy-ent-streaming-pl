/* ========================================
   DYNAMIC CONTENT LOADER - COMPLETE FIXED VERSION
   Roy Entertainment
   ======================================== */

console.log('🎬 Dynamic loader starting...');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM Ready, initializing loader...');
    await initializeMovieLoader();
});

async function initializeMovieLoader() {
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabaseClient && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabaseClient) {
        console.error('❌ Supabase failed to initialize after 5 seconds');
        showErrorMessage();
        return;
    }
    
    console.log('✅ Supabase ready, loading content...');
    
    // Test database connection
    try {
        const { data: testData, error: testError } = await window.supabaseClient
            .from('movies')
            .select('id')
            .limit(1);
        
        if (testError) {
            console.error('❌ Database test failed:', testError);
            console.log('Check RLS policies in Supabase dashboard');
        } else {
            console.log('✅ Database connection successful');
        }
    } catch (err) {
        console.error('Connection test error:', err);
    }
    
    // Load all sections
    await Promise.all([
        loadHeroSlides(),
        loadOurProductions()
    ]);
    
    // Setup search and clicks
    setupSearch();
    setupMovieCardClicks();
    
    // Hide preloader
    hidePreloader();
}

// Load Hero Slider
async function loadHeroSlides() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) {
        console.log('Hero slider element not found');
        return;
    }
    
    try {
        console.log('📥 Loading hero slides...');
        
        // Get top rated movies for hero
        const { data: movies, error } = await window.supabaseClient
            .from('movies')
            .select('*')
            .order('rating', { ascending: false })
            .limit(3);
        
        if (error) {
            console.error('Hero slider database error:', error);
            return;
        }
        
        console.log('Hero movies fetched:', movies);
        
        if (!movies || movies.length === 0) {
            console.log('No movies available for hero slider');
            // Try to get any movies
            const { data: anyMovies } = await window.supabaseClient
                .from('movies')
                .select('*')
                .limit(3);
            
            if (anyMovies && anyMovies.length > 0) {
                movies = anyMovies;
            } else {
                return;
            }
        }
        
        // Save gradient overlay
        const gradient = slider.querySelector('.hero-gradient-overlay');
        
        // Clear slider
        slider.innerHTML = '';
        
        // Add slides
        movies.forEach((movie, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            
            // Handle image paths
            const backgroundImage = movie.banner || movie.poster || 'img/placeholder.jpg';
            slide.style.backgroundImage = `url('${backgroundImage}')`;
            slide.dataset.movieId = movie.id;
            
            // Handle genre array
            const genres = Array.isArray(movie.genre) 
                ? movie.genre.join(' | ') 
                : movie.genre || '';
            
            slide.innerHTML = `
                <div class="slide-content">
                    <h2>${movie.title || 'Untitled'}</h2>
                    <div class="slide-metadata">
                        <span class="slide-rating">
                            <i class="fas fa-star"></i> ${movie.rating || '0'}
                        </span>
                        <span class="slide-separator">|</span>
                        <span>${movie.release || 'N/A'}</span>
                        <span class="slide-separator">|</span>
                        <span>${movie.runtime || 'N/A'}</span>
                        ${genres ? `
                            <span class="slide-separator">|</span>
                            <span>${genres}</span>
                        ` : ''}
                    </div>
                    ${movie.description ? `
                        <p class="slide-description">${truncateText(movie.description, 150)}</p>
                    ` : ''}
                    <a href="watch.html?movie=${movie.id}" class="btn-primary">
                        <i class="fas fa-play"></i> Watch Now
                    </a>
                </div>
            `;
            slider.appendChild(slide);
        });
        
        // Re-add gradient overlay
        if (gradient) {
            slider.appendChild(gradient);
        } else {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'hero-gradient-overlay';
            slider.appendChild(newOverlay);
        }
        
        // Setup slider functionality
        setupHeroSlider();
        console.log(`✅ Hero slider loaded with ${movies.length} slides`);
        
    } catch (error) {
        console.error('❌ Hero slider error:', error);
    }
}

// Setup hero slider functionality
function setupHeroSlider() {
    const slider = document.querySelector('.hero-slider');
    if (!slider) return;
    
    const slides = [...slider.children].filter(el => el.classList.contains('slide'));
    const dotsContainer = document.getElementById('slider-dots');
    let currentIndex = 0;
    let autoScrollInterval;
    
    if (!dotsContainer || slides.length === 0) return;
    
    // Clear and create dots
    dotsContainer.innerHTML = '';
    
    slides.forEach((slide, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        if (i === 0) dot.classList.add('active');
        dot.dataset.index = i;
        dot.onclick = () => {
            clearInterval(autoScrollInterval);
            currentIndex = i;
            scrollToSlide();
            startAutoScroll();
        };
        dotsContainer.appendChild(dot);
    });
    
    const dots = [...dotsContainer.children];
    
    const updateDots = () => {
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    };
    
    const scrollToSlide = () => {
        slider.scrollTo({
            left: currentIndex * slider.clientWidth,
            behavior: 'smooth'
        });
        updateDots();
    };
    
    const startAutoScroll = () => {
        clearInterval(autoScrollInterval);
        autoScrollInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % slides.length;
            scrollToSlide();
        }, 5000);
    };
    
    // Setup intersection observer
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                currentIndex = slides.indexOf(entry.target);
                updateDots();
            }
        });
    }, { root: slider, threshold: 0.51 });
    
    slides.forEach(slide => observer.observe(slide));
    
    // Event listeners
    slider.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
    slider.addEventListener('mouseleave', startAutoScroll);
    window.addEventListener('resize', scrollToSlide);
    
    startAutoScroll();
}

// Load Our Productions
async function loadOurProductions() {
    const container = document.querySelector('#our-productions .film-grid');
    if (!container) {
        console.log('Productions container not found');
        return;
    }
    
    try {
        console.log('📥 Loading productions...');
        
        // Show loading state
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-secondary);">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                <p style="margin-top: 10px;">Loading movies...</p>
            </div>
        `;
        
        // Fetch all movies
        const { data: movies, error } = await window.supabaseClient
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        console.log(`Fetched ${movies ? movies.length : 0} movies from database`);
        
        if (!movies || movies.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-secondary);">
                    <i class="fas fa-film" style="font-size: 3rem; opacity: 0.5;"></i>
                    <p style="margin-top: 10px;">No movies available yet.</p>
                </div>
            `;
            return;
        }
        
        // Render movies
        container.innerHTML = movies.map(movie => {
            // Handle genre array
            const genres = Array.isArray(movie.genre) 
                ? movie.genre.join(', ') 
                : movie.genre || 'N/A';
            
            // Ensure poster path is correct
            const posterPath = movie.poster || 'img/placeholder.jpg';
            const rating = parseFloat(movie.rating || 0).toFixed(1);
            
            return `
                <article class="film-card" data-movie-id="${movie.id}">
                    <div class="rating-display">
                        <i class="fas fa-star"></i>
                        <span>${rating}</span>
                    </div>
                    <img src="${posterPath}" 
                         alt="${movie.title}"
                         onerror="this.onerror=null; this.src='img/placeholder.jpg'" />
                    <div class="card-content">
                        <h3>${movie.title || 'Untitled'}</h3>
                        <div class="film-card-meta">
                            <span class="rating">
                                <i class="fas fa-star"></i> ${rating}
                            </span>
                            <span>${movie.release || 'N/A'}</span>
                            <span>${movie.runtime || 'N/A'}</span>
                        </div>
                        ${genres !== 'N/A' ? `<p class="genres"><small>Genre: ${genres}</small></p>` : ''}
                        <p class="description">${truncateText(movie.description, 100)}</p>
                        ${movie.director ? `<p class="director"><small>Director: ${movie.director}</small></p>` : ''}
                    </div>
                </article>
            `;
        }).join('');
        
        console.log(`✅ Successfully loaded ${movies.length} productions`);
        
        // Add hover effect
        addMovieCardEffects();
        
    } catch (error) {
        console.error('❌ Error loading productions:', error);
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-secondary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--accent-primary);"></i>
                <p style="margin-top: 10px;">Failed to load movies</p>
                <p style="margin-top: 5px; font-size: 0.9em; opacity: 0.7;">Error: ${error.message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Add movie card hover effects
function addMovieCardEffects() {
    const cards = document.querySelectorAll('.film-card');
    cards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Setup search functionality
function setupSearch() {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar) return;
    
    let searchTimeout;
    
    searchBar.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        clearTimeout(searchTimeout);
        
        if (searchTerm.length < 2) {
            if (searchTerm.length === 0) {
                await loadOurProductions();
            }
            return;
        }
        
        searchTimeout = setTimeout(async () => {
            try {
                const { data: movies, error } = await window.supabaseClient
                    .from('movies')
                    .select('*')
                    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                    .limit(20);
                
                if (error) throw error;
                
                const container = document.querySelector('#our-productions .film-grid');
                if (container && movies) {
                    if (movies.length > 0) {
                        container.innerHTML = movies.map(movie => {
                            const genres = Array.isArray(movie.genre) 
                                ? movie.genre.join(', ') 
                                : movie.genre || 'N/A';
                            const posterPath = movie.poster || 'img/placeholder.jpg';
                            const rating = parseFloat(movie.rating || 0).toFixed(1);
                            
                            return `
                                <article class="film-card" data-movie-id="${movie.id}">
                                    <div class="rating-display">
                                        <i class="fas fa-star"></i>
                                        <span>${rating}</span>
                                    </div>
                                    <img src="${posterPath}" 
                                         alt="${movie.title}"
                                         onerror="this.onerror=null; this.src='img/placeholder.jpg'" />
                                    <div class="card-content">
                                        <h3>${movie.title || 'Untitled'}</h3>
                                        <div class="film-card-meta">
                                            <span class="rating">
                                                <i class="fas fa-star"></i> ${rating}
                                            </span>
                                            <span>${movie.release || 'N/A'}</span>
                                            <span>${movie.runtime || 'N/A'}</span>
                                        </div>
                                        ${genres !== 'N/A' ? `<p class="genres"><small>Genre: ${genres}</small></p>` : ''}
                                        <p class="description">${truncateText(movie.description, 100)}</p>
                                    </div>
                                </article>
                            `;
                        }).join('');
                        addMovieCardEffects();
                    } else {
                        container.innerHTML = `
                            <p style="text-align: center; grid-column: 1/-1; color: var(--text-secondary);">
                                No movies found for "${searchTerm}"
                            </p>
                        `;
                    }
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);
    });
    
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            window.location.href = `movies.html?search=${encodeURIComponent(e.target.value)}`;
        }
    });
}

// Setup movie card clicks
function setupMovieCardClicks() {
    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('.film-card');
        if (card && !e.target.closest('a')) {
            e.preventDefault();
            const movieId = card.dataset.movieId;
            if (movieId) {
                window.location.href = `watch.html?movie=${movieId}`;
            }
        }
    });
}

// Helper function to truncate text
function truncateText(text, maxLength = 100) {
    if (!text) return 'No description available.';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Hide preloader
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                document.body.classList.remove('hidden');
            }, 300);
        }, 500);
    }
}

// Show error message
function showErrorMessage() {
    const container = document.querySelector('#our-productions .film-grid');
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-secondary);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--accent-primary);"></i>
                <p style="margin-top: 10px;">Unable to initialize movie database</p>
                <p style="margin-top: 5px; font-size: 0.9em; opacity: 0.7;">Please check your connection and refresh</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i> Refresh Page
                </button>
            </div>
        `;
    }
}

// Export for debugging
window.debugMovieLoader = {
    loadHeroSlides,
    loadOurProductions,
    reloadAll: async () => {
        await loadHeroSlides();
        await loadOurProductions();
    }
};

console.log('✅ Dynamic loader script loaded. Use window.debugMovieLoader.reloadAll() to reload movies.');