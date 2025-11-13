// ========================================
// WATCH PAGE - FINAL VERSION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    let currentMovieId = null;

    // Default fallback images
    const FALLBACK_POSTER = 'https://placehold.co/300x450/1a1a1a/eee?text=No+Poster';
    const FALLBACK_BACKDROP = 'https://placehold.co/1400x788/1a1a1a/eee?text=No+Backdrop';

    /**
     * Robust YouTube URL parser
     */
    function getYouTubeEmbedUrl(url) {
        if (!url) return null;
        let videoId = null;
        try {
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
            if (url.length >= 11 && url.length <= 12 && !url.includes(' ') && !url.includes('/')) {
                videoId = url;
            }
        }
        // Add autoplay=1 to make it play immediately on click
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
        console.log(`📽️ Loading movie: ${currentMovieId}`);

        try {
            const { data: movie, error } = await supabaseClient
                .from('movies')
                .select('*')
                .ilike('id', currentMovieId) 
                .single();

            if (error) throw error;
            if (!movie) throw new Error('Movie not found in database.');

            console.log(`✅ Movie loaded successfully: ${movie.title}`);
            console.log('📊 Movie data:', movie);
            
            populateUI(movie);
            setupVideoPlayback(movie);
            loadRecommendations(movie.genre, movie.id); 
            
            if (window.authService && authService.isLoggedIn()) {
                await updateWatchHistory(movie.id);
            }

        } catch (error) {
            console.error('Error loading movie:', error);
            document.getElementById('video-banner-container').innerHTML = `
                <h2 class="player-title" style="color:white; text-align:center; padding-top: 50px;">Movie Data Error</h2>
                <p class="error-message" style="color:white; text-align:center;">The movie (ID: ${currentMovieId}) cound not be loaded. 
                This is likely because the 'genre' or 'actors' field is empty in the database. Please update the movie data.</p>
                <a href="index.html" class="btn-primary" style="margin-top: 20px; display: inline-block;">Go Home</a>
            `;
        } finally {
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
        const bannerUrl = movie.backdrop_url || FALLBACK_BACKDROP;
        if (banner) {
            banner.style.backgroundImage = `
                linear-gradient(to right, var(--overlay) 20%, transparent 80%),
                linear-gradient(to top, var(--bg-primary) 5%, transparent 30%),
                url(${bannerUrl})
            `;
        }

        const detailsPanel = document.querySelector('.movie-details-panel');
        
        const actorsList = (movie.actors && Array.isArray(movie.actors)) 
                           ? movie.actors.join(', ') 
                           : 'N/A';
                           
        const genreList = (movie.genre && Array.isArray(movie.genre))
                          ? movie.genre.join(', ')
                          : 'N/A';
        
        const posterUrl = movie.poster_url || FALLBACK_POSTER;
        const youtubeUrl = movie.trailer_url || '#';

        detailsPanel.innerHTML = `
            <div class="poster-container">
                <img src="${posterUrl}" alt="${movie.title} Poster" onerror="this.src='${FALLBACK_POSTER}'">
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
                    <button id="watch-now-btn" class="action-btn btn-primary">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <a href="${youtubeUrl}" target="_blank" class="action-btn btn-secondary" id="youtube-btn">
                        <i class="fab fa-youtube"></i> Play on YouTube
                    </a>
                </div>

            </div>
        `;
        
        console.log('✅ UI populated successfully');
    }

    /**
     * NEW: Setup click-to-play
     */
    function setupVideoPlayback(movie) {
        const playBannerBtn = document.getElementById('play-banner-btn');
        const watchNowBtn = document.getElementById('watch-now-btn');
        const container = document.getElementById('video-banner-container');
        const player = document.getElementById('movie-player');
        
        const embedUrl = getYouTubeEmbedUrl(movie.trailer_url);

        function startVideoPlayback() {
            if (embedUrl) {
                player.src = embedUrl; 
                container.classList.add('video-active');
            } else {
                if (window.showNotification) {
                    window.showNotification('Trailer not available for this movie.', 'error');
                } else {
                    alert('Trailer not available for this movie.');
                }
            }
        }

        if (playBannerBtn) {
            playBannerBtn.addEventListener('click', startVideoPlayback);
        }
        if (watchNowBtn) {
            watchNowBtn.addEventListener('click', startVideoPlayback);
        }
    }


    /**
     * Load "You May Also Like"
     */
    async function loadRecommendations(genres, currentMovieId) {
        const grid = document.getElementById('recommendations-grid');
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
            
            // --- FIX for 404 "undefined" error ---
            grid.innerHTML = data.map(m => {
                const poster = m.poster_url || FALLBACK_POSTER; // Define poster here
                return `
                <div class="film-card" data-movie-id="${m.id}">
                    <div class="card-thumbnail">
                        <img src="${poster}" alt="${m.title}" onerror="this.src='${FALLBACK_POSTER}'">
                    </div>
                    <div class="card-info">
                        <h3>${m.title}</h3>
                        <p>${new Date(m.release_date).getFullYear()} • ${m.rating.toFixed(1)}/10</p>
                    </div>
                </div>
            `}).join('');
            console.log(`✅ Loaded ${data.length} recommendations`);
            
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
            // --- FIX for 400 "timestamp" error ---
            // Only upsert the columns that exist.
            // You should add a 'timestamp' column in Supabase for full functionality.
            const { error } = await supabaseClient
                .from('watch_history')
                .upsert({
                    user_id: user.id,
                    movie_id: movieId
                    // timestamp: new Date().toISOString() // This line caused the error
                }, { onConflict: 'user_id, movie_id' }); 

            if (error) {
                console.error('Error updating watch history:', error);
            } else {
                console.log('✅ Watch history updated.');
            }
            
        } catch (error) {
            console.error('Critical error in updateWatchHistory:', error);
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