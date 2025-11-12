// ========================================
// WATCH PAGE - ASYNC (FIXED PLAYER & UI)
// Roy Entertainment
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    let currentMovieId = null;

    /**
     * =================================================================
     * FIX: Robust YouTube URL parser
     * This new function will get the video ID from any common YouTube link
     * and correctly build the embed URL.
     * =================================================================
     */
    function getYouTubeEmbedUrl(url) {
        if (!url) return null;

        let videoId = null;
        try {
            // Try to parse as a full URL
            const urlObj = new URL(url);
            
            if (urlObj.hostname.includes('youtube.com')) {
                // Standard link: https://www.youtube.com/watch?v=VIDEO_ID
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                // Short link: https://youtu.be/VIDEO_ID
                videoId = urlObj.pathname.slice(1);
            } else if (urlObj.hostname.includes('youtube-nocookie.com') || url.includes('/embed/')) {
                // Embed link: https://.../embed/VIDEO_ID
                const parts = urlObj.pathname.split('/');
                videoId = parts[parts.length - 1];
            }
        } catch (e) {
            // It's not a full URL, so it's probably just the ID
            // Simple check: 11-12 characters, no spaces or slashes
            if (url.length >= 11 && url.length <= 12 && !url.includes(' ') && !url.includes('/')) {
                videoId = url;
            }
        }

        // Return the full embed URL with recommended parameters
        return videoId 
            ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&loop=1&playlist=${videoId}` 
            : null;
    }


    /**
     * Helper to get URL parameters
     */
    const getQueryParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };

    /**
     * Main function to load movie details
     */
    async function loadMovie() {
        // Wait for supabaseClient
        if (!window.supabaseClient) {
            setTimeout(loadMovie, 50);
            return;
        }

        currentMovieId = getQueryParam('movie');
        if (!currentMovieId) {
            document.body.innerHTML = '<h1>Movie not found.</h1>';
            return;
        }

        try {
            // 1. Fetch movie details
            const { data: movie, error } = await supabaseClient
                .from('movies')
                .select('*')
                .eq('id', currentMovieId)
                .single();

            if (error) throw error;
            if (!movie) throw new Error('Movie not found in database.');

            // 2. Populate UI elements
            populateUI(movie);
            
            // 3. Load recommendations
            // --- FIX: Pass the singular 'genre' column ---
            loadRecommendations(movie.genre); 
            
            // 4. Update watch history (if user is logged in)
            if (window.authService && authService.isLoggedIn()) {
                await updateWatchHistory(movie.id);
            }

        } catch (error) {
            console.error('Error loading movie:', error);
            document.getElementById('streaming-section').innerHTML = `<p class="error-message">Could not load movie details.</p>`;
        } finally {
            // Hide preloader
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => { preloader.style.display = 'none'; }, 300);
            }
        }
    }

    /**
     * Fill all UI elements with movie data
     */
    function populateUI(movie) {
        // Page Title
        document.title = `${movie.title} - Roy Entertainment`;

        // Breadcrumb
        const breadcrumbNav = document.querySelector('.breadcrumb-nav');
        breadcrumbNav.innerHTML = `
            <a href="index.html">Home</a>
            <span class="separator">/</span>
            <a href="movies.html">Movies</a>
            <span class="separator">/</span>
            <span class="current-page">${movie.title}</span>
        `;

        // Banner
        const banner = document.getElementById('watch-area-banner');
        if (banner && movie.backdrop_url) {
            banner.style.backgroundImage = `
                linear-gradient(to right, var(--overlay) 20%, transparent 80%),
                linear-gradient(to top, var(--bg-primary) 5%, transparent 30%),
                url(${movie.backdrop_url})
            `;
        }

        // Details Panel
        const detailsPanel = document.querySelector('.movie-details-panel');
        detailsPanel.innerHTML = `
            <div class="poster-container">
                <img src="${movie.poster_url}" alt="${movie.title} Poster">
            </div>
            <div class="info-container">
                <h1>${movie.title}</h1>
                <p class="plot-summary">${movie.description}</p>
                
                <div class="metadata-grid">
                    <div>
                        <span>Starring</span>
                        <span>${movie.actors.join(', ')}</span>
                    </div>
                    <div>
                        <span>Genre</span>
                        <span>${movie.genre.join(', ')}</span>
                    </div>
                    <div>
                        <span>Release</span>
                        <span>${new Date(movie.release_date).getFullYear()}</span>
                    </div>
                    <div>
                        <span>Rating</span>
                        <span>
                            <i class="fas fa-star" style="color: #FFC107;"></i> ${movie.rating.toFixed(1)}/10
                        </span>
                    </div>
                </div>
                
                <div class="actions-bar">
                    <button id="share-btn" class="action-btn">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    <button id="watchlist-btn" class="action-btn">
                        <i class="fas fa-plus"></i> Add to Watchlist
                    </button>
                </div>
            </div>
        `;

        // 5. Setup Player
        const player = document.getElementById('movie-player');
        const streamingSection = document.getElementById('streaming-section');
        
        // Use our new robust function
        const embedUrl = getYouTubeEmbedUrl(movie.trailer_url);
        
        if (embedUrl) {
            player.src = embedUrl;
        } else {
            // Hide player and show a message
            streamingSection.innerHTML = `
                <h2 class="player-title">Trailer Not Available</h2>
                <p class="error-message">We're sorry, but the trailer for this movie is currently not available.</p>
            `;
        }
    }

    /**
     * Load "You May Also Like"
     */
    async function loadRecommendations(genres) {
        const grid = document.getElementById('recommendations-grid');
        if (!grid || !genres || genres.length === 0) return;

        try {
            // Fetch 6 movies that share at least one genre, are not the current movie
            const { data, error } = await supabaseClient
                .from('movies')
                .select('*')
                // --- FIX: Use singular 'genre' column for query ---
                .or(`genre.cs.{${genres.join(',')}}`) // 'cs' = contains (for array)
                .neq('id', currentMovieId)
                .limit(6);

            if (error) throw error;
            
            grid.innerHTML = data.map(m => `
                <div class="film-card" data-movie-id="${m.id}">
                    <div class="card-thumbnail">
                        <img src="${m.poster_url}" alt="${m.title}">
                    </div>
                    <div class="card-info">
                        <h3>${m.title}</h3>
                        <p>${new Date(m.release_date).getFullYear()} • ${m.rating.toFixed(1)}/10</p>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading recommendations:', error);
            grid.innerHTML = '<p class="error-message">Could not load recommendations.</p>';
        }
    }

    /**
     * Add to watch history
     */
    async function updateWatchHistory(movieId) {
        if (!authService) return;
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            // 'upsert' will insert or update if 'user_id' and 'movie_id' match
            const { error } = await supabaseClient
                .from('watch_history')
                .upsert({
                    user_id: user.id,
                    movie_id: movieId,
                    timestamp: new Date().toISOString()
                }, { onConflict: 'user_id, movie_id' });

            if (error) throw error;
            console.log('Watch history updated.');
            
        } catch (error) {
            console.error('Error updating watch history:', error);
        }
    }

    /**
     * Event Listeners
     */
    
    // Share button
    document.body.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('#share-btn');
        if (shareBtn) {
            const shareUrl = window.location.href;
            const movieTitle = document.querySelector('.info-container h1').textContent;
            
            // Use modern Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: `${movieTitle} - Roy Entertainment`,
                    text: `Check out ${movieTitle} on Roy Entertainment!`,
                    url: shareUrl,
                }).catch(err => console.error('Share error:', err));
            } else {
                // Fallback for clipboard
                try {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        window.showNotification('Link copied to clipboard!', 'success');
                    }).catch(() => { // Fallback for http or older browsers
                        const tempInput = document.createElement('input');
                        tempInput.value = shareUrl;
                        document.body.appendChild(tempInput);
                        tempInput.select();
                        document.execCommand('copy');
                        document.body.removeChild(tempInput);
                        window.showNotification('Link copied to clipboard!', 'success');
                    });
                } catch (e) {
                     window.showNotification('Failed to copy link.', 'error');
                }
            }
        }
    });
    
    // Handle clicks on recommendation cards
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if(recommendationsGrid) {
        recommendationsGrid.addEventListener('click', (e) => {
             const card = e.target.closest('.film-card');
            if (card && card.dataset.movieId) {
                // Go to the new movie page
                window.location.href = `watch.html?movie=${card.dataset.movieId}`;
            }
        });
    }

    // Initial load
    loadMovie();
});