// ========================================
// WATCH PAGE - FIXED VERSION
// Roy Entertainment
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
     * Ensure array format for genres
     */
    function ensureArray(value) {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            // Handle comma-separated strings
            if (value.includes(',')) {
                return value.split(',').map(g => g.trim());
            }
            return [value];
        }
        return [];
    }

    /**
     * Main function to load movie details
     */
    async function loadMovie() {
        // Wait for supabaseClient with timeout
        let attempts = 0;
        while (!window.supabaseClient && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 50));
            attempts++;
        }

        if (!window.supabaseClient) {
            console.error('Supabase client not initialized');
            showError('Database connection failed. Please refresh the page.');
            return;
        }

        currentMovieId = getQueryParam('movie');
        if (!currentMovieId) {
            showError('No movie specified in URL.');
            return;
        }

        try {
            console.log('Loading movie with ID:', currentMovieId);
            
            // Fetch movie details - try both exact match and ilike
            let { data: movie, error } = await supabaseClient
                .from('movies')
                .select('*')
                .eq('id', currentMovieId)
                .single();

            // If exact match fails, try case-insensitive
            if (error || !movie) {
                const result = await supabaseClient
                    .from('movies')
                    .select('*')
                    .ilike('id', currentMovieId)
                    .single();
                
                movie = result.data;
                error = result.error;
            }

            if (error) {
                console.error('Database error:', error);
                throw error;
            }
            
            if (!movie) {
                throw new Error('Movie not found in database.');
            }

            console.log('Movie loaded:', movie);

            // Populate UI elements
            populateUI(movie);
            
            // IMPORTANT: Show the streaming section
            const streamingSection = document.getElementById('streaming-section');
            if (streamingSection) {
                streamingSection.classList.add('active');
                streamingSection.style.display = 'block'; // Force display
            }
            
            // Load recommendations
            const genres = ensureArray(movie.genre);
            if (genres.length > 0) {
                loadRecommendations(genres, movie.id);
            }
            
            // Update watch history
            if (window.authService && authService.isLoggedIn()) {
                await updateWatchHistory(movie.id);
            }

        } catch (error) {
            console.error('Error loading movie:', error);
            showError(`Could not load movie (ID: ${currentMovieId}). ${error.message}`);
        } finally {
            hidePreloader();
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
     * Hide preloader
     */
    function hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => { 
                preloader.style.display = 'none'; 
            }, 300);
        }
    }

    /**
     * Fill all UI elements with movie data
     */
    function populateUI(movie) {
        try {
            // Page Title
            document.title = `${movie.title} - Roy Entertainment`;

            // Breadcrumb
            const breadcrumbNav = document.querySelector('.breadcrumb-nav');
            if (breadcrumbNav) {
                breadcrumbNav.innerHTML = `
                    <a href="index.html">Home</a>
                    <span class="separator">/</span>
                    <a href="movies.html">Movies</a>
                    <span class="separator">/</span>
                    <span class="current-page">${movie.title}</span>
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

            // Ensure genres and actors are arrays
            const genres = ensureArray(movie.genre);
            const actors = ensureArray(movie.actors || movie.actor || []);

            // Details Panel
            const detailsPanel = document.querySelector('.movie-details-panel');
            if (detailsPanel) {
                detailsPanel.innerHTML = `
                    <div class="poster-container">
                        <img src="${movie.poster_url || 'img/placeholder-poster.jpg'}" 
                             alt="${movie.title} Poster"
                             onerror="this.src='img/placeholder-poster.jpg'">
                    </div>
                    <div class="info-container">
                        <h1>${movie.title}</h1>
                        <p class="plot-summary">${movie.description || 'No description available.'}</p>
                        
                        <div class="metadata-grid">
                            ${actors.length > 0 ? `
                                <div>
                                    <span>Starring</span>
                                    <span>${actors.join(', ')}</span>
                                </div>
                            ` : ''}
                            ${genres.length > 0 ? `
                                <div>
                                    <span>Genre</span>
                                    <span>${genres.join(', ')}</span>
                                </div>
                            ` : ''}
                            ${movie.release_date ? `
                                <div>
                                    <span>Release</span>
                                    <span>${new Date(movie.release_date).getFullYear()}</span>
                                </div>
                            ` : ''}
                            ${movie.rating ? `
                                <div>
                                    <span>Rating</span>
                                    <span>
                                        <i class="fas fa-star" style="color: #FFC107;"></i> 
                                        ${parseFloat(movie.rating).toFixed(1)}/10
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
            const player = document.getElementById('movie-player');
            const streamingSection = document.getElementById('streaming-section');
            
            if (movie.trailer_url) {
                const embedUrl = getYouTubeEmbedUrl(movie.trailer_url);
                
                if (embedUrl && player) {
                    player.src = embedUrl;
                    console.log('Player URL set:', embedUrl);
                } else if (streamingSection) {
                    streamingSection.innerHTML = `
                        <h2 class="player-title">Trailer Not Available</h2>
                        <p class="error-message">The trailer URL is invalid or not properly formatted.</p>
                        <p style="color: var(--text-secondary); font-size: 0.9em;">URL provided: ${movie.trailer_url}</p>
                    `;
                }
            } else if (streamingSection) {
                streamingSection.innerHTML = `
                    <h2 class="player-title">Trailer Not Available</h2>
                    <p class="error-message">No trailer is available for this movie yet.</p>
                `;
            }
        } catch (error) {
            console.error('Error populating UI:', error);
            showError('Error displaying movie information.');
        }
    }

    /**
     * Load "You May Also Like"
     */
    async function loadRecommendations(genres, currentMovieId) {
        const grid = document.getElementById('recommendations-grid');
        if (!grid || !genres || genres.length === 0) {
            console.log('Cannot load recommendations: no genres or grid element');
            return;
        }

        try {
            // Build query for movies with similar genres
            let query = supabaseClient
                .from('movies')
                .select('*')
                .neq('id', currentMovieId)
                .limit(6);

            // If genre is stored as array in database
            if (genres.length > 0) {
                query = query.contains('genre', genres);
            }

            const { data, error } = await query;

            if (error) throw error;
            
            if (data && data.length > 0) {
                grid.innerHTML = data.map(m => `
                    <div class="film-card" data-movie-id="${m.id}" style="cursor: pointer;">
                        <div class="card-thumbnail">
                            <img src="${m.poster_url || 'img/placeholder-poster.jpg'}" 
                                 alt="${m.title}"
                                 onerror="this.src='img/placeholder-poster.jpg'">
                        </div>
                        <div class="card-info">
                            <h3>${m.title}</h3>
                            <p>${m.release_date ? new Date(m.release_date).getFullYear() : 'TBA'} 
                               ${m.rating ? `• ${parseFloat(m.rating).toFixed(1)}/10` : ''}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = '<p class="error-message">No recommendations available.</p>';
            }
            
        } catch (error) {
            console.error('Error loading recommendations:', error);
            if (grid) {
                grid.innerHTML = '<p class="error-message">Could not load recommendations.</p>';
            }
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
            const { error } = await supabaseClient
                .from('watch_history')
                .upsert({
                    user_id: user.id,
                    movie_id: movieId,
                    watched_at: new Date().toISOString()
                }, { 
                    onConflict: 'user_id,movie_id' 
                });

            if (error) {
                console.error('Watch history error:', error);
            } else {
                console.log('Watch history updated successfully');
            }
            
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
            const movieTitle = document.querySelector('.info-container h1')?.textContent || 'Movie';
            
            if (navigator.share) {
                navigator.share({
                    title: `${movieTitle} - Roy Entertainment`,
                    text: `Check out ${movieTitle} on Roy Entertainment!`,
                    url: shareUrl,
                }).catch(err => console.log('Share cancelled'));
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    if (window.showNotification) {
                        window.showNotification('Link copied to clipboard!', 'success');
                    } else {
                        alert('Link copied to clipboard!');
                    }
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