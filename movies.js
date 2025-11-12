// ========================================
// MOVIES PAGE - ASYNC (FIXED FILTERS)
// Roy Entertainment
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // Helper to get URL parameters
    const getQueryParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };

    // Main function to fetch and display movies
    async function displayMovies() {
        // Wait for supabaseClient to be available
        if (!window.supabaseClient) {
            setTimeout(displayMovies, 50);
            return;
        }

        const grid = document.getElementById('movie-grid');
        const titleElement = document.getElementById('movie-category-title');
        if (!grid || !titleElement) return;

        grid.innerHTML = '<div class="spinner" id="preloader-spinner" style="display: flex; opacity: 1; position: relative; background: transparent; height: 200px; grid-column: 1 / -1; justify-content: center;"></div>'; // Show a loading spinner
        
        const category = getQueryParam('category');
        const genre = getQueryParam('genre'); // Get the genre from URL
        const currentYear = new Date().getFullYear();

        try {
            // This is the backend call!
            let query = supabaseClient.from('movies').select('*');

            // =================================================================
            // --- FIXED FILTERING LOGIC ---
            // =================================================================
            
            if (genre) {
                // FIX: Handle genre filtering FIRST
                // 'cs' means "contains" - it checks if the 'genre' array column contains the genre
                // This assumes your 'genre' column in Supabase is an array (e..g, text[])
                query = query.cs('genre', [genre]); // <-- FIXED: Was 'genres'
                titleElement.textContent = `Genre: ${genre}`;
                
            } else if (category === 'latest') {
                // Handle category filtering
                query = query.order('release_date', { ascending: false });
                titleElement.textContent = 'Latest Movies';
            } else if (category === 'popular') {
                query = query.order('rating', { ascending: false });
                titleElement.textContent = 'Popular Movies';
            } else if (category === 'upcoming') {
                query = query.order('release_date', { ascending: true }).gt('release_date', new Date().toISOString());
                titleElement.textContent = 'Upcoming Movies';
            } else {
                // Default case if no category or genre
                query = query.order('title', { ascending: true });
                titleElement.textContent = 'All Movies';
            }
            
            // --- END OF FIXED LOGIC ---


            // Add pagination (e.g., 50 movies per page)
            query = query.limit(50);

            // Execute the query
            const { data: movies, error } = await query;

            if (error) {
                throw error;
            }

            // Render movie cards
            if (movies && movies.length > 0) {
                grid.innerHTML = movies.map(movie => `
                    <div class="film-card" data-movie-id="${movie.id}">
                        <div class="card-thumbnail">
                            <img src="${movie.poster_url}" alt="${movie.title}">
                        </div>
                        <div class="card-info">
                            <h3>${movie.title}</h3>
                            <p>${new Date(movie.release_date).getFullYear()} • ${movie.rating.toFixed(1)}/10</p>
                        </div>
                    </div>
                `).join('');
                
                // Trigger card animation
                addCardAnimations();
                
            } else {
                grid.innerHTML = `<p class="error-message" style="grid-column: 1 / -1; text-align: center;">No movies found for this category.</p>`;
            }

        } catch (error) {
            console.error('Error fetching movies:', error.message);
            grid.innerHTML = `<p class="error-message" style="grid-column: 1 / -1; text-align: center;">Could not load movies. Please try again later.</p>`;
        } finally {
            // Hide preloader
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 300);
            }
            const preloaderSpinner = document.getElementById('preloader-spinner');
            if (preloaderSpinner) preloaderSpinner.remove();
        }
    }

    // Click handler for movie cards
    const movieGrid = document.getElementById('movie-grid');
    if (movieGrid) {
        movieGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.film-card');
            if (card && card.dataset.movieId) {
                window.location.href = `watch.html?movie=${card.dataset.movieId}`;
            }
        });
    }
    
    // Animate cards on load
    function addCardAnimations() {
        const filmCards = document.querySelectorAll('.film-card');
        filmCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100); // Staggered animation
        });
    }

    // Initial load
    displayMovies();
});