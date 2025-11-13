// ========================================
// MOVIES PAGE - PRODUCTION VERSION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Movies page initializing...');
    
    // State Management
    const state = {
        allMovies: [],
        filteredMovies: [],
        displayedMovies: [],
        currentPage: 1,
        moviesPerPage: 12,
        viewMode: 'grid',
        filters: {
            search: '',
            category: 'all',
            genre: 'all',
            year: 'all',
            rating: 'all',
            sort: 'newest'
        }
    };

    // Available Genres
    const GENRES = [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
        'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
        'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
        'TV Movie', 'Thriller', 'War', 'Western'
    ];

    // DOM Elements
    const elements = {
        movieGrid: document.getElementById('movie-grid'),
        searchBar: document.getElementById('movie-search'),
        categoryFilter: document.getElementById('category-filter'),
        genreFilter: document.getElementById('genre-filter'),
        yearFilter: document.getElementById('year-filter'),
        ratingFilter: document.getElementById('rating-filter'),
        sortFilter: document.getElementById('sort-filter'),
        loadMoreBtn: document.getElementById('load-more'),
        resultsCount: document.getElementById('results-count'),
        totalMovies: document.getElementById('total-movies'),
        noResults: document.getElementById('no-results'),
        loadingState: document.getElementById('loading-state'),
        activeFilters: document.getElementById('active-filters'),
        clearFiltersBtn: document.getElementById('clear-filters'),
        genreMenuNav: document.getElementById('genre-menu-nav'),
        viewModeButtons: document.querySelectorAll('.view-mode')
    };

    /**
     * Truncate text helper
     */
    function truncateText(text, maxLength = 100) {
        if (!text) return 'No description available.';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // Wait for Supabase to initialize
    async function waitForSupabase() {
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized');
        }
        
        console.log('✅ Supabase client ready');
        return true;
    }

    // Initialize
    async function init() {
        try {
            showLoading();
            await waitForSupabase();
            await loadMovies();
            populateFilters();
            attachEventListeners();
            checkURLParams();
            filterAndDisplayMovies();
        } catch (error) {
            console.error('❌ Initialization error:', error);
            showError('Failed to load movies. Please refresh the page.');
        } finally {
            hideLoading();
        }
    }

    // Load movies from Supabase
    async function loadMovies() {
        console.log('📥 Loading movies from database...');
        
        try {
            const { data, error } = await window.supabaseClient
                .from('movies')
                .select('*');

            if (error) {
                console.error('Database error:', error);
                throw error;
            }

            if (!data) {
                console.log('No data received from database');
                state.allMovies = [];
                return;
            }

            // Process movies data
            state.allMovies = data.map(movie => ({
                ...movie,
                genre: Array.isArray(movie.genre) ? movie.genre : 
                      (movie.genre ? [movie.genre] : []),
                rating: parseFloat(movie.rating || 0),
                release_date: movie.release || new Date().getFullYear()
            }));

            console.log(`✅ Loaded ${state.allMovies.length} movies`);
            
            if (elements.totalMovies) {
                elements.totalMovies.textContent = state.allMovies.length;
            }
        } catch (error) {
            console.error('❌ Error loading movies:', error);
            state.allMovies = [];
            throw error;
        }
    }

    // Populate filter dropdowns
    function populateFilters() {
        // Populate genres
        if (elements.genreFilter) {
            const genreOptions = GENRES.map(genre => 
                `<option value="${genre}">${genre}</option>`
            ).join('');
            elements.genreFilter.innerHTML = `
                <option value="all">All Genres</option>
                ${genreOptions}
            `;
        }

        // Populate genre navigation menu
        if (elements.genreMenuNav) {
            const genreColumns = [];
            const itemsPerColumn = 5;
            for (let i = 0; i < GENRES.length; i += itemsPerColumn) {
                const columnGenres = GENRES.slice(i, i + itemsPerColumn);
                const columnHTML = columnGenres.map(genre =>
                    `<a href="movies.html?genre=${encodeURIComponent(genre)}">${genre}</a>`
                ).join('');
                genreColumns.push(`<div class="column">${columnHTML}</div>`);
            }
            elements.genreMenuNav.innerHTML = genreColumns.join('');
        }

        // Populate years
        if (elements.yearFilter) {
            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
            const yearOptions = years.map(year =>
                `<option value="${year}">${year}</option>`
            ).join('');
            elements.yearFilter.innerHTML = `
                <option value="all">All Years</option>
                ${yearOptions}
            `;
        }
    }

    // Check URL parameters
    function checkURLParams() {
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('genre')) {
            state.filters.genre = params.get('genre');
            if (elements.genreFilter) {
                elements.genreFilter.value = state.filters.genre;
            }
        }
        
        if (params.has('category')) {
            state.filters.category = params.get('category');
            if (elements.categoryFilter) {
                elements.categoryFilter.value = state.filters.category;
            }
        }
        
        if (params.has('search')) {
            state.filters.search = params.get('search');
            if (elements.searchBar) {
                elements.searchBar.value = state.filters.search;
            }
        }
    }

    // Filter movies
    function filterMovies() {
        console.log('🔍 Filtering movies with:', state.filters);
        let filtered = [...state.allMovies];

        // Search filter
        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            filtered = filtered.filter(movie => {
                const title = (movie.title || '').toLowerCase();
                const description = (movie.description || '').toLowerCase();
                const director = (movie.director || '').toLowerCase();
                
                return title.includes(searchLower) ||
                       description.includes(searchLower) ||
                       director.includes(searchLower);
            });
        }

        // Category filter
        if (state.filters.category !== 'all') {
            const currentYear = new Date().getFullYear();
            switch (state.filters.category) {
                case 'latest':
                    filtered = filtered.filter(movie => {
                        const year = parseInt(movie.release) || 0;
                        return year === currentYear;
                    });
                    break;
                case 'popular':
                    filtered = filtered.filter(movie => movie.rating >= 8);
                    break;
                case 'upcoming':
                    filtered = filtered.filter(movie => {
                        const year = parseInt(movie.release) || 0;
                        return year > currentYear;
                    });
                    break;
            }
        }

        // Genre filter
        if (state.filters.genre !== 'all') {
            filtered = filtered.filter(movie => {
                const genres = movie.genre || [];
                return genres.includes(state.filters.genre);
            });
        }

        // Year filter
        if (state.filters.year !== 'all') {
            filtered = filtered.filter(movie => {
                const year = parseInt(movie.release) || 0;
                return year === parseInt(state.filters.year);
            });
        }

        // Rating filter
        if (state.filters.rating !== 'all') {
            const minRating = parseFloat(state.filters.rating);
            filtered = filtered.filter(movie => movie.rating >= minRating);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (state.filters.sort) {
                case 'newest':
                    return (parseInt(b.release) || 0) - (parseInt(a.release) || 0);
                case 'oldest':
                    return (parseInt(a.release) || 0) - (parseInt(b.release) || 0);
                case 'rating-high':
                    return (b.rating || 0) - (a.rating || 0);
                case 'rating-low':
                    return (a.rating || 0) - (b.rating || 0);
                case 'title-az':
                    return (a.title || '').localeCompare(b.title || '');
                case 'title-za':
                    return (b.title || '').localeCompare(a.title || '');
                default:
                    return 0;
            }
        });

        state.filteredMovies = filtered;
        console.log(`📊 Filtered to ${filtered.length} movies`);
        updateActiveFilters();
    }

    // Create movie card
    function createMovieCard(movie) {
        const card = document.createElement('article');
        card.className = 'film-card';
        card.dataset.movieId = movie.id;
        
        const year = movie.release || 'TBA';
        const posterUrl = movie.poster || 'https://via.placeholder.com/380x214?text=No+Poster';
        const rating = movie.rating || 0;
        const title = movie.title || 'Untitled';
        const description = truncateText(movie.description, 100);
        const runtime = movie.runtime || 'N/A';
        
        card.innerHTML = `
            <div class="rating-display">
                <i class="fas fa-star"></i>
                <span>${rating.toFixed(1)}</span>
            </div>
            <img src="${posterUrl}" alt="${title}" onerror="this.src='https://via.placeholder.com/380x214?text=No+Poster'">
            <div class="card-content">
                <h3>${title}</h3>
                <div class="film-card-meta">
                    <span class="rating"><i class="fas fa-star"></i> ${rating.toFixed(1)}</span>
                    <span>${year}</span>
                    <span>${runtime}</span>
                </div>
                <p>${description}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `watch.html?movie=${movie.id}`;
        });
        
        return card;
    }

    // Display movies
    function displayMovies(append = false) {
        const start = append ? state.displayedMovies.length : 0;
        const end = start + state.moviesPerPage;
        const moviesToShow = state.filteredMovies.slice(0, end);
        
        state.displayedMovies = moviesToShow;

        if (!append) {
            if (elements.movieGrid) {
                elements.movieGrid.innerHTML = '';
                elements.movieGrid.className = 'film-grid';
            }
        }

        const newMovies = moviesToShow.slice(start, end);
        newMovies.forEach((movie, index) => {
            const movieCard = createMovieCard(movie);
            if (movieCard) {
                movieCard.style.opacity = '0';
                movieCard.style.animation = `fadeInUp 0.5s ease forwards`;
                movieCard.style.animationDelay = `${index * 0.1}s`;
                if (elements.movieGrid) {
                    elements.movieGrid.appendChild(movieCard);
                }
            }
        });

        // Update UI
        if (elements.resultsCount) {
            elements.resultsCount.textContent = state.filteredMovies.length;
        }
        
        if (elements.noResults) {
            elements.noResults.style.display = state.filteredMovies.length === 0 ? 'block' : 'none';
        }
        
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.style.display = 
                state.displayedMovies.length < state.filteredMovies.length ? 'block' : 'none';
        }
    }

    // Update active filters display
    function updateActiveFilters() {
        const activeFilters = [];
        
        if (state.filters.search) {
            activeFilters.push({ type: 'search', value: state.filters.search });
        }
        if (state.filters.category !== 'all') {
            activeFilters.push({ type: 'category', value: state.filters.category });
        }
        if (state.filters.genre !== 'all') {
            activeFilters.push({ type: 'genre', value: state.filters.genre });
        }
        if (state.filters.year !== 'all') {
            activeFilters.push({ type: 'year', value: state.filters.year });
        }
        if (state.filters.rating !== 'all') {
            activeFilters.push({ type: 'rating', value: `${state.filters.rating}+⭐` });
        }

        if (elements.activeFilters) {
            elements.activeFilters.innerHTML = activeFilters.map(filter => `
                <span class="filter-tag">
                    ${filter.value}
                    <button onclick="removeFilter('${filter.type}')" aria-label="Remove filter">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `).join('');
        }

        if (elements.clearFiltersBtn) {
            elements.clearFiltersBtn.style.display = activeFilters.length > 0 ? 'block' : 'none';
        }
    }

    // Remove filter
    window.removeFilter = function(type) {
        state.filters[type] = type === 'search' ? '' : 'all';
        
        // Update UI
        switch(type) {
            case 'search':
                if (elements.searchBar) elements.searchBar.value = '';
                break;
            case 'category':
                if (elements.categoryFilter) elements.categoryFilter.value = 'all';
                break;
            case 'genre':
                if (elements.genreFilter) elements.genreFilter.value = 'all';
                break;
            case 'year':
                if (elements.yearFilter) elements.yearFilter.value = 'all';
                break;
            case 'rating':
                if (elements.ratingFilter) elements.ratingFilter.value = 'all';
                break;
        }
        
        filterAndDisplayMovies();
    };

    // Filter and display movies
    function filterAndDisplayMovies() {
        filterMovies();
        displayMovies();
    }

    // Event Listeners
    function attachEventListeners() {
        // Search with debounce
        let searchTimeout;
        if (elements.searchBar) {
            elements.searchBar.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    state.filters.search = e.target.value;
                    filterAndDisplayMovies();
                }, 300);
            });
        }

        // All filter change events
        ['categoryFilter', 'genreFilter', 'yearFilter', 'ratingFilter', 'sortFilter'].forEach(filterName => {
            if (elements[filterName]) {
                elements[filterName].addEventListener('change', (e) => {
                    const filterKey = filterName.replace('Filter', '');
                    state.filters[filterKey] = e.target.value;
                    filterAndDisplayMovies();
                });
            }
        });

        // Load more
        if (elements.loadMoreBtn) {
            elements.loadMoreBtn.addEventListener('click', () => {
                displayMovies(true);
            });
        }

        // Clear filters
        if (elements.clearFiltersBtn) {
            elements.clearFiltersBtn.addEventListener('click', () => {
                state.filters = {
                    search: '',
                    category: 'all',
                    genre: 'all',
                    year: 'all',
                    rating: 'all',
                    sort: 'newest'
                };
                
                // Reset UI
                Object.keys(elements).forEach(key => {
                    if (key.includes('Filter') && elements[key]) {
                        elements[key].value = 'all';
                    }
                });
                if (elements.searchBar) elements.searchBar.value = '';
                
                filterAndDisplayMovies();
            });
        }

        // Search from header
        const headerSearchBar = document.getElementById('search-bar');
        if (headerSearchBar) {
            headerSearchBar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    window.location.href = `movies.html?search=${encodeURIComponent(e.target.value)}`;
                }
            });
        }
    }

    // Loading states
    function showLoading() {
        console.log('⏳ Showing loading state...');
        if (elements.loadingState) {
            elements.loadingState.style.display = 'grid';
        }
        if (elements.movieGrid) {
            elements.movieGrid.style.display = 'none';
        }
    }

    function hideLoading() {
        console.log('✅ Hiding loading state...');
        if (elements.loadingState) {
            elements.loadingState.style.display = 'none';
        }
        if (elements.movieGrid) {
            elements.movieGrid.style.display = '';
        }
        
        // Hide preloader
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }
    }

    function showError(message) {
        console.error('🚨 Showing error:', message);
        if (elements.noResults) {
            elements.noResults.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">
                    Refresh Page
                </button>
            `;
            elements.noResults.style.display = 'block';
        }
        hideLoading();
    }

    // Initialize with delay to ensure Supabase is ready
    setTimeout(init, 500);
});