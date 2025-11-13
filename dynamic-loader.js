/* ========================================
DYNAMIC CONTENT LOADER - FIXED VERSION
Roy Entertainment
======================================== */

// Wait for DOM and Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Dynamic loader starting...');
    
    // Wait for Supabase with better timing
    async function waitForSupabase() {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase not initialized after 10 seconds');
            showErrorState();
            return false;
        }
        
        console.log('✅ Supabase ready for dynamic loader');
        return true;
    }
    
    // Show error state in UI
    function showErrorState() {
        const container = document.querySelector('#our-productions .film-grid');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--accent-primary);"></i>
                    <p style="margin-top: 10px;">Unable to load movies. Please refresh the page.</p>
                    <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">Refresh</button>
                </div>
            `;
        }
    }

    // Helper function to truncate text
    function truncateText(text, maxLength = 100) {
        if (!text) return 'No description available.';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // Helper function to format runtime
    function formatRuntime(runtime) {
        if (!runtime) return 'N/A';
        // If runtime is already formatted (like "5:01 min"), return as is
        if (runtime.includes(':') || runtime.includes('h') || runtime.includes('m')) {
            return runtime;
        }
        // If it's a number, format it
        const minutes = parseInt(runtime);
        if (isNaN(minutes)) return runtime;
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
        return `${minutes}m`;
    }

    // Load Hero Slider
    async function loadHeroSlides() {
        const slider = document.querySelector('.hero-slider');
        if (!slider) return;

        try {
            console.log('📥 Loading hero slides...');
            
            // Fetch top rated movies for hero
            const { data: movies, error } = await window.supabaseClient
                .from('movies')
                .select('*')
                .order('rating', { ascending: false })
                .limit(3);

            if (error) throw error;

            if (movies && movies.length > 0) {
                // Save gradient overlay
                const overlay = slider.querySelector('.hero-gradient-overlay');
                
                // Clear and rebuild slider
                slider.innerHTML = '';
                
                movies.forEach(movie => {
                    const backdrop = movie.banner || movie.poster || 'https://placehold.co/1920x1080/1a1a1a/eee?text=No+Image';
                    const rating = movie.rating || 0;
                    const year = movie.release || 'N/A';
                    const runtime = formatRuntime(movie.runtime);
                    
                    const slide = document.createElement('div');
                    slide.className = 'slide';
                    slide.style.backgroundImage = `url('${backdrop}')`;
                    slide.dataset.movieId = movie.id;
                    slide.innerHTML = `
                        <div class="slide-content">
                            <h2>${movie.title}</h2>
                            <div class="slide-metadata">
                                <span class="slide-rating"><i class="fas fa-star"></i> ${parseFloat(rating).toFixed(1)}</span>
                                <span class="slide-separator">|</span>
                                <span>${year}</span>
                                <span class="slide-separator">|</span>
                                <span>${runtime}</span>
                            </div>
                            <a href="watch.html?movie=${movie.id}" class="btn-primary">Watch Now</a>
                        </div>
                    `;
                    slider.appendChild(slide);
                });

                // Re-add gradient overlay
                if (overlay) {
                    slider.appendChild(overlay);
                } else {
                    const newOverlay = document.createElement('div');
                    newOverlay.className = 'hero-gradient-overlay';
                    slider.appendChild(newOverlay);
                }

                // Setup slider functionality
                setupHeroSlider();
                console.log(`✅ Loaded ${movies.length} hero slides`);
            }
        } catch (error) {
            console.error('Error loading hero slides:', error);
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

        const scrollToSlide = () => slider.scrollTo({ 
            left: currentIndex * slider.clientWidth, 
            behavior: 'smooth' 
        });

        const startAutoScroll = () => {
            clearInterval(autoScrollInterval); 
            autoScrollInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % slides.length; 
                scrollToSlide(); 
                updateDots();
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
        if (!container) return;

        try {
            console.log('📥 Loading productions...');
            
            // Fetch all movies
            const { data: movies, error } = await window.supabaseClient
                .from('movies')
                .select('*')
                .order('release', { ascending: false });

            if (error) throw error;

            if (movies && movies.length > 0) {
                container.innerHTML = movies.map(movie => {
                    const poster = movie.poster || 'https://placehold.co/380x214/1a1a1a/eee?text=No+Poster';
                    const rating = movie.rating || 0;
                    const year = movie.release || 'N/A';
                    const runtime = formatRuntime(movie.runtime);
                    const description = truncateText(movie.description, 100);
                    
                    return `
                        <article class="film-card" data-movie-id="${movie.id}">
                            <div class="rating-display">
                                <i class="fas fa-star"></i>
                                <span>${parseFloat(rating).toFixed(1)}</span>
                            </div>
                            <img src="${poster}" alt="${movie.title}" 
                                 onerror="this.onerror=null; this.src='https://placehold.co/380x214/1a1a1a/eee?text=No+Poster'" />
                            <div class="card-content">
                                <h3>${movie.title}</h3>
                                <div class="film-card-meta">
                                    <span class="rating"><i class="fas fa-star"></i> ${parseFloat(rating).toFixed(1)}</span>
                                    <span>${year}</span>
                                    <span>${runtime}</span>
                                </div>
                                <p>${description}</p>
                            </div>
                        </article>
                    `;
                }).join('');

                console.log(`✅ Loaded ${movies.length} productions`);
            } else {
                container.innerHTML = `
                    <p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">
                        No movies available.
                    </p>
                `;
            }
        } catch (error) {
            console.error('❌ Error loading productions:', error);
            container.innerHTML = `
                <p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">
                    Failed to load movies. Please refresh the page.
                </p>
            `;
        }
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
                                const poster = movie.poster || 'https://placehold.co/380x214/1a1a1a/eee?text=No+Poster';
                                const rating = movie.rating || 0;
                                const year = movie.release || 'N/A';
                                const runtime = formatRuntime(movie.runtime);
                                const description = truncateText(movie.description, 100);
                                
                                return `
                                    <article class="film-card" data-movie-id="${movie.id}">
                                        <div class="rating-display">
                                            <i class="fas fa-star"></i>
                                            <span>${parseFloat(rating).toFixed(1)}</span>
                                        </div>
                                        <img src="${poster}" alt="${movie.title}" 
                                             onerror="this.onerror=null; this.src='https://placehold.co/380x214/1a1a1a/eee?text=No+Poster'" />
                                        <div class="card-content">
                                            <h3>${movie.title}</h3>
                                            <div class="film-card-meta">
                                                <span class="rating"><i class="fas fa-star"></i> ${parseFloat(rating).toFixed(1)}</span>
                                                <span>${year}</span>
                                                <span>${runtime}</span>
                                            </div>
                                            <p>${description}</p>
                                        </div>
                                    </article>
                                `;
                            }).join('');
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

    // Click handler for movie cards
    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('[data-movie-id]');
        if (card && !e.target.closest('.btn-primary')) {
            e.preventDefault();
            const movieId = card.dataset.movieId;
            window.location.href = `watch.html?movie=${movieId}`;
        }
    });

    // Main initialization
    async function initialize() {
        try {
            // Wait for Supabase
            const supabaseReady = await waitForSupabase();
            if (!supabaseReady) return;

            // Load all content in parallel
            await Promise.all([
                loadHeroSlides(),
                loadOurProductions()
            ]);
            
            // Setup search
            setupSearch();
            
            console.log('✅ All dynamic content loaded successfully');
        } catch (error) {
            console.error('❌ Error initializing dynamic content:', error);
            showErrorState();
        } finally {
            // Hide preloader
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                    document.body.classList.remove('hidden');
                }, 300);
            }
        }
    }

    // Start initialization
    initialize();
});