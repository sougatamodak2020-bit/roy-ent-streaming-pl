// ========================================
// WATCH PAGE - ASYNC (FIXED PLAYER & UI)
// Roy Entertainment
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    let currentMovieId = null;

    /**
     * FIX #1: Robust YouTube URL parser
     */
    function getYouTubeEmbedUrl(url) {
        if (!url) return null;

        let videoId = null;
        try {
            // Try to parse as a full URL
            const urlObj = new URL(url);
            
            if (urlObj.hostname.includes('youtube.com')) {
                videoId = urlObj.searchParams.get('v');
            } else if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.slice(1);
            } else if (urlObj.hostname.includes('youtube-nocookie.com') || url.includes('/embed/')) {
                const parts = urlObj.pathname.split('/');
                videoId = parts[parts.length - 1];
            }
        } catch (e) {
            // It's not a full URL, so it's probably just the ID
            if (url.length >= 11 && url.length <= 12 && !url.includes(' ') && !url.includes('/')) {
                videoId = url;
            }
        }
        // Return the full embed URL
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
                // FIX #2: Use .ilike() for case-insensitive text ID match
                .ilike('id', currentMovieId) 
                .single();

            if (error) throw error;
            if (!movie) throw new Error('Movie not found in database.');

            // 2. Populate UI (This is where the error was)
            populateUI(movie);
            
            // 3. Load recommendations
            loadRecommendations(movie.genre, movie.id); 
            
            // 4. Update watch history
            if (window.authService && authService.isLoggedIn()) {
                await updateWatchHistory(movie.id);
            }

        } catch (error) {
            console.error('Error loading movie:', error); // This is the error you are seeing
            document.getElementById('streaming-section').innerHTML = `
                <h2 class="player-title">Movie Data Error</h2>
                <p class="error-message">The movie you're looking for (ID: ${currentMovieId}) cound not be loaded. 
                This is likely because the 'genre' or 'actors' field is empty in the database. Please update the movie data.</p>
                <a href="index.html" class="btn-primary" style="margin-top: 20px; display: inline-block;">Go Home</a>
            `;
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
        document.title = `${movie.title} - Roy Entertainment`;

        const breadcrumbNav = document.querySelector('.breadcrumb-nav');
        breadcrumbNav.innerHTML = `
            <a href="index.html">Home</a>
            <span class="separator">/</span>
            <a href="movies.html">Movies</a>
            <span class="separator">/</span>
            <span class="current-page">${movie.title}</span>
        `;

        const banner = document.getElementById('watch-area-banner');
        if (banner && movie.backdrop_url) {
            banner.style.backgroundImage = `
                linear-gradient(to right, var(--overlay) 20%, transparent 80%),
                linear-gradient(to top, var(--bg-primary) 5%, transparent 30%),
                url(${movie.backdrop_url})
            `;
        }

        const detailsPanel = document.querySelector('.movie-details-panel');
        
        // =================================================================
        // FINAL FIX: Check for null arrays before using .join()
        // This stops the crash.
        // =================================================================
        const actorsList = (movie.actors && Array.isArray(movie.actors)) 
                           ? movie.actors.join(', ') 
                           : 'N/A';
                           
        const genreList = (movie.genre && Array.isArray(movie.genre))
                          ? movie.genre.join(', ')
                          : 'N/A';
        // =================================================================

        detailsPanel.innerHTML = `
            <div class="poster-container">
                <img src="${movie.poster_url}" alt="${movie.title} Poster">
            </div>
            <div class="info-container">
                <h1>${movie.title}</h1>
                <p class="plot-summary">${movie.description || 'No description available.'}</p>
                
                <div class="metadata-grid">
                    <div>
                        <span>Starring</span>
                        <span>${actorsList}</span>
                    </div>
                    <div>
                        <span>Genre</span>
                        <span>${genreList}</span>
                    </div>
                    <div>
                        <span>Release</span>
                        <span>${new Date(movie.release_date).getFullYear() || 'N/A'}</span>
                    </div>
                    <div>
                        <span>Rating</span>
                        <span>
                            <i class="fas fa-star" style="color: #FFC107;"></i> 
                            ${(movie.rating || 0).toFixed(1)}/10
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

        // Setup Player
        const player = document.getElementById('movie-player');
        const streamingSection = document.getElementById('streaming-section');
        const embedUrl = getYouTubeEmbedUrl(movie.trailer_url);
        
        if (embedUrl) {
            player.src = embedUrl;
        } else {
            streamingSection.innerHTML = `
                <h2 class="player-title">Trailer Not Available</h2>
                <p class="error-message">We're sorry, but the trailer for this movie is currently not available.</p>
            `;
        }
    }

    /**
     * Load "You May Also Like"
     */
    async function loadRecommendations(genres, currentMovieId) {
        const grid = document.getElementById('recommendations-grid');
        // FIX: Check for null or empty genres
        if (!grid || !genres || genres.length === 0) {
            grid.innerHTML = '<p class="error-message" style="text-align: center; grid-column: 1 / -1;">No recommendations available.</p>';
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('movies')
                .select('*')
                .or(`genre.cs.{${genres.join(',')}}`)
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
            grid.innerHTML = '<p class="error-message" style="text-align: center; grid-column: 1 / -1;">Could not load recommendations.</p>';
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
    document.body.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('#share-btn');
        if (shareBtn) {
            const shareUrl = window.location.href;
            const movieTitle = document.querySelector('.info-container h1').textContent;
            
            if (navigator.share) {
                navigator.share({
                    title: `${movieTitle} - Roy Entertainment`,
                    text: `Check out ${movieTitle} on Roy Entertainment!`,
                    url: shareUrl,
                }).catch(err => console.error('Share error:', err));
            } else {
                try {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        window.showNotification('Link copied to clipboard!', 'success');
                    }).catch(() => {
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
    
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if(recommendationsGrid) {
        recommendationsGrid.addEventListener('click', (e) => {
             const card = e.target.closest('.film-card');
            if (card && card.dataset.movieId) {
                window.location.href = `watch.html?movie=${card.dataset.movieId}`;
            }
        });
    }

    // Initial load
    loadMovie();
});