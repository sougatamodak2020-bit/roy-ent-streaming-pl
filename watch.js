// ========================================
// WATCH PAGE - FIXED VERSION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    let currentMovieId = null;

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
     * Safe array converter - handles null, undefined, strings, arrays
     */
    function toArray(value) {
        // Handle null or undefined
        if (value == null) return [];
        
        // Already an array
        if (Array.isArray(value)) return value;
        
        // String that looks like JSON array
        if (typeof value === 'string') {
            // Try to parse as JSON
            if (value.startsWith('[')) {
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    // Not valid JSON, continue
                }
            }
            // Comma-separated string
            if (value.includes(',')) {
                return value.split(',').map(item => item.trim()).filter(item => item);
            }
            // Single string value
            return value.trim() ? [value.trim()] : [];
        }
        
        // Other types
        return [];
    }

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
            // Fetch movie details
            const { data: movie, error } = await supabaseClient
                .from('movies')
                .select('*')
                .eq('id', currentMovieId)
                .single();

            if (error) throw error;
            if (!movie) throw new Error('Movie not found in database.');

            console.log('Movie loaded:', movie);

            // Populate UI elements
            populateUI(movie);
            
            // Load recommendations
            loadRecommendations(movie);
            
            // Update watch history (if user is logged in)
            if (window.authService && authService.isLoggedIn()) {
                await updateWatchHistory(movie.id);
            }

        } catch (error) {
            console.error('Error loading movie:', error);
            showError(`Could not load movie: ${error.message}`);
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
     * Show error message
     */
    function showError(message) {
        const streamingSection = document.getElementById('streaming-section');
        if (streamingSection) {
            streamingSection.style.display = 'block';
            streamingSection.innerHTML = `
                <h2 class="player-title">Error Loading Movie</h2>
                <p class="error-message">${message}</p>
                <a href="index.html" class="action-btn primary" style="margin-top: 20px; display: inline-block;">
                    <i class="fas fa-home"></i> Go to Homepage
                </a>
            `;
        }
    }

    /**
     * Fill all UI elements with movie data
     */
    function populateUI(movie) {
        try {
            // Page Title
            document.title = `${movie.title || 'Watch'} - Roy Entertainment`;

            // Breadcrumb
            const breadcrumbNav = document.querySelector('.breadcrumb-nav');
            if (breadcrumbNav) {
                breadcrumbNav.innerHTML = `
                    <a href="index.html">Home</a>
                    <span class="separator">/</span>
                    <a href="movies.html">Movies</a>
                    <span class="separator">/</span>
                    <span class="current-page">${movie.title || 'Unknown'}</span>
                `;
            }

            // Banner
            const banner = document.getElementById('watch-area-banner');
            if (banner && movie.backdrop_url) {
                banner.style.backgroundImage = `
                    linear-gradient(to right, rgba(0,0,0,0.7) 20%, transparent 80%),
                    linear-gradient(to top, rgba(0,0,0,0.5) 5%, transparent 30%),
                    url('${movie.backdrop_url}')
                `;
            }

            // SAFE CONVERSION: Convert all fields to arrays safely
            const actors = toArray(movie.actors || movie.cast);
            const genres = toArray(movie.genre || movie.genres);
            const title = movie.title || 'Untitled';
            const description = movie.description || movie.overview || 'No description available.';
            const posterUrl = movie.poster_url || movie.poster || 'https://via.placeholder.com/300x450?text=No+Poster';
            const releaseDate = movie.release_date || movie.released || '';
            const rating = movie.rating || movie.vote_average || 0;

            console.log('Processed data:', { actors, genres });

            // Details Panel
            const detailsPanel = document.querySelector('.movie-details-panel');
            if (detailsPanel) {
                detailsPanel.innerHTML = `
                    <div class="poster-container">
                        <img src="${posterUrl}" 
                             alt="${title} Poster"
                             onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                    </div>
                    <div class="info-container">
                        <h1>${title}</h1>
                        <p class="plot-summary">${description}</p>
                        
                        <div class="metadata-grid">
                            ${actors.length > 0 ? `
                                <div>
                                    <span>Starring</span>
                                    <span>${actors.slice(0, 3).join(', ')}</span>
                                </div>
                            ` : ''}
                            ${genres.length > 0 ? `
                                <div>
                                    <span>Genre</span>
                                    <span>${genres.join(', ')}</span>
                                </div>
                            ` : ''}
                            ${releaseDate ? `
                                <div>
                                    <span>Release</span>
                                    <span>${new Date(releaseDate).getFullYear()}</span>
                                </div>
                            ` : ''}
                            ${rating ? `
                                <div>
                                    <span>Rating</span>
                                    <span>
                                        <i class="fas fa-star" style="color: #FFC107;"></i> 
                                        ${parseFloat(rating).toFixed(1)}/10
                                    </span>
                                </div>
                            ` : ''}
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
            }

            // Setup Player
            const streamingSection = document.getElementById('streaming-section');
            if (streamingSection) {
                streamingSection.style.display = 'block';
                streamingSection.classList.add('active');
                
                const trailerUrl = movie.trailer_url || movie.trailer || movie.video_url || '';
                const embedUrl = getYouTubeEmbedUrl(trailerUrl);
                
                if (embedUrl) {
                    streamingSection.innerHTML = `
                        <h2 class="player-title">Now Playing: ${title}</h2>
                        <div class="player-wrapper">
                            <iframe 
                                src="${embedUrl}"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowfullscreen>
                            </iframe>
                        </div>
                    `;
                } else if (trailerUrl) {
                    streamingSection.innerHTML = `
                        <h2 class="player-title">${title}</h2>
                        <div style="padding: 40px; text-align: center; background: var(--bg-card); border-radius: 12px;">
                            <i class="fas fa-video-slash" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                            <p>Invalid trailer URL format</p>
                            <small style="color: var(--text-secondary);">URL: ${trailerUrl}</small>
                        </div>
                    `;
                } else {
                    streamingSection.innerHTML = `
                        <h2 class="player-title">${title}</h2>
                        <div style="padding: 40px; text-align: center; background: var(--bg-card); border-radius: 12px;">
                            <i class="fas fa-film" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                            <p>No trailer available yet</p>
                        </div>
                    `;
                }
            }
            
        } catch (error) {
            console.error('Error populating UI:', error);
            showError('Error displaying movie information.');
        }
    }

    /**
     * Load "You May Also Like"
     */
    async function loadRecommendations(currentMovie) {
        const grid = document.getElementById('recommendations-grid');
        if (!grid) return;

        try {
            // Just get any 6 other movies for now
            const { data, error } = await supabaseClient
                .from('movies')
                .select('*')
                .neq('id', currentMovie.id)
                .limit(6);

            if (error) throw error;
            
            if (data && data.length > 0) {
                grid.innerHTML = data.map(m => {
                    const poster = m.poster_url || m.poster || 'https://via.placeholder.com/200x300?text=No+Poster';
                    const year = m.release_date ? new Date(m.release_date).getFullYear() : 'TBA';
                    const rating = m.rating ? parseFloat(m.rating).toFixed(1) : 'N/A';
                    
                    return `
                        <div class="film-card" data-movie-id="${m.id}" style="cursor: pointer;">
                            <div class="card-thumbnail">
                                <img src="${poster}" 
                                     alt="${m.title}"
                                     onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">
                            </div>
                            <div class="card-info">
                                <h3>${m.title}</h3>
                                <p>${year} • ${rating}/10</p>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                grid.innerHTML = '<p class="error-message">No recommendations available.</p>';
            }
            
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    /**
     * Add to watch history
     */
    async function updateWatchHistory(movieId) {
        if (!window.authService) return;
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            await supabaseClient
                .from('watch_history')
                .upsert({
                    user_id: user.id,
                    movie_id: movieId,
                    watched_at: new Date().toISOString()
                });
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
        if (e.target.closest('#share-btn')) {
            const shareUrl = window.location.href;
            const movieTitle = document.querySelector('.info-container h1')?.textContent || 'Movie';
            
            if (navigator.share) {
                navigator.share({
                    title: `${movieTitle} - Roy Entertainment`,
                    text: `Check out ${movieTitle} on Roy Entertainment!`,
                    url: shareUrl,
                }).catch(() => {});
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('Link copied to clipboard!');
                }).catch(() => {
                    alert('Could not copy link');
                });
            }
        }
    });
    
    // Handle clicks on recommendation cards
    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('.film-card');
        if (card && card.dataset.movieId) {
            window.location.href = `watch.html?movie=${card.dataset.movieId}`;
        }
    });

    // Initial load
    loadMovie();
});