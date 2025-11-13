// ========================================
// WATCH PAGE - COMPLETE WITH DESCRIPTIONS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    let currentMovieId = null;

    // Default fallback images
    const FALLBACK_POSTER = 'https://placehold.co/300x450/1a1a1a/eee?text=No+Poster';
    const FALLBACK_BACKDROP = 'https://placehold.co/1920x1080/1a1a1a/eee?text=No+Backdrop';

    /**
     * Robust YouTube URL parser
     */
    function getYouTubeEmbedUrl(url) {
        if (!url) return null;
        
        console.log('Processing YouTube URL:', url);
        let videoId = null;
        
        try {
            // Handle different YouTube URL formats
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
                /^([a-zA-Z0-9_-]{11})$/
            ];
            
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    videoId = match[1];
                    break;
                }
            }
            
            // If still no match, try URL parsing
            if (!videoId) {
                try {
                    const urlObj = new URL(url);
                    if (urlObj.hostname.includes('youtube.com')) {
                        videoId = urlObj.searchParams.get('v');
                    } else if (urlObj.hostname.includes('youtu.be')) {
                        videoId = urlObj.pathname.slice(1).split('?')[0];
                    }
                } catch (e) {
                    // URL parsing failed, might be just an ID
                    if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
                        videoId = url;
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing YouTube URL:', e);
        }
        
        const embedUrl = videoId 
            ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1` 
            : null;
        
        console.log('Generated embed URL:', embedUrl);
        return embedUrl;
    }

    /**
     * Helper to get URL parameters
     */
    const getQueryParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };

    /**
     * Truncate description for cards
     */
    function truncateText(text, maxLength = 100) {
        if (!text) return 'No description available.';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

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
            showError('Movie not found.');
            return;
        }

        console.log(`📽️ Loading movie: ${currentMovieId}`);

        try {
            // Fetch movie data from Supabase
            const { data: movie, error } = await supabaseClient
                .from('movies')
                .select('*')
                .eq('id', currentMovieId)
                .single();

            if (error) throw error;
            if (!movie) throw new Error('Movie not found in database.');

            console.log(`✅ Movie loaded successfully:`, movie);
            
            // 1. Fill in all the UI elements
            populateUI(movie);
            
            // 2. Setup video playback
            setupVideoPlayback(movie);

            // 3. Load recommendations
            loadRecommendations(movie);
            
            // 4. Update watch history
            if (window.authService && window.authService.isLoggedIn()) {
                updateWatchHistory(movie.id).catch(err => {
                    console.log('Watch history update skipped');
                });
            }

        } catch (error) {
            console.error('Error loading movie:', error);
            showError(`Failed to load movie: ${error.message}`);
        } finally {
            hidePreloader();
        }
    }

    /**
     * Fill all UI elements with movie data
     */
    function populateUI(movie) {
        document.title = `${movie.title} - Roy Entertainment`;

        // Update breadcrumb
        const breadcrumbNav = document.querySelector('.breadcrumb-nav');
        breadcrumbNav.innerHTML = `
            <a href="index.html">Home</a>
            <span class="separator">/</span>
            <a href="movies.html">Movies</a>
            <span class="separator">/</span>
            <span class="current-page">${movie.title}</span>
        `;

        // Set banner background using the correct field name
        const banner = document.getElementById('watch-area-banner');
        const backdropUrl = movie.banner || movie.poster || FALLBACK_BACKDROP;
        
        console.log('Setting banner background with URL:', backdropUrl);
        
        if (banner) {
            banner.style.backgroundImage = `
                linear-gradient(to right, rgba(0,0,0,0.8) 20%, transparent 80%),
                linear-gradient(to top, var(--bg-primary) 5%, transparent 30%),
                url('${backdropUrl}')
            `;
        }

        // Populate movie details panel
        const detailsPanel = document.querySelector('.movie-details-panel');
        
        // Use correct field names from your database
        const posterUrl = movie.poster || FALLBACK_POSTER;
        const genres = Array.isArray(movie.genre) ? movie.genre : 
                      (movie.genre ? [movie.genre] : ['Unknown']);
        const actors = movie.actors || 'N/A';
        const director = movie.director || 'N/A';
        const releaseYear = movie.release || 'N/A';
        const rating = movie.rating || 0;
        const runtime = movie.runtime || 'N/A';
        const description = movie.description || 'No description available.';
        const youtubeLink = movie.youtube_link || '#';
        const country = movie.country || 'N/A';

        detailsPanel.innerHTML = `
            <div class="poster-container">
                <img src="${posterUrl}" alt="${movie.title} Poster" 
                     onerror="this.onerror=null; this.src='${FALLBACK_POSTER}'">
            </div>
            <div class="info-container">
                <h1>${movie.title}</h1>
                <p class="plot-summary">${description}</p>
                
                <div class="metadata-grid">
                    ${actors !== 'N/A' && actors !== 'null' ? `
                        <div>
                            <span>Starring</span>
                            <span>${actors}</span>
                        </div>
                    ` : ''}
                    <div>
                        <span>Director</span>
                        <span>${director}</span>
                    </div>
                    <div>
                        <span>Genre</span>
                        <span>${genres.join(', ')}</span>
                    </div>
                    <div>
                        <span>Release</span>
                        <span>${releaseYear}</span>
                    </div>
                    <div>
                        <span>Duration</span>
                        <span>${runtime}</span>
                    </div>
                    <div>
                        <span>Country</span>
                        <span>${country}</span>
                    </div>
                    <div>
                        <span>Rating</span>
                        <span>
                            <i class="fas fa-star" style="color: #FFC107;"></i> 
                            ${parseFloat(rating).toFixed(1)}/10
                        </span>
                    </div>
                </div>
                
                <div class="actions-bar">
                    <button id="watch-now-btn" class="action-btn btn-primary">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    ${youtubeLink && youtubeLink !== '#' ? `
                        <a href="${youtubeLink}" target="_blank" class="action-btn btn-secondary" id="youtube-btn">
                            <i class="fab fa-youtube"></i> Play on YouTube
                        </a>
                    ` : ''}
                    <button id="share-btn" class="action-btn btn-secondary">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
        
        console.log('✅ UI populated successfully');
    }

    /**
     * Setup click-to-play functionality
     */
    function setupVideoPlayback(movie) {
        const playBannerBtn = document.getElementById('play-banner-btn');
        const watchNowBtn = document.getElementById('watch-now-btn');
        const container = document.getElementById('video-banner-container');
        const player = document.getElementById('movie-player');
        
        // Use the correct field name
        const trailerUrl = movie.youtube_link;
        console.log('YouTube URL from database:', trailerUrl);
        
        // Get the embed URL
        const embedUrl = getYouTubeEmbedUrl(trailerUrl);

        function startVideoPlayback() {
            if (embedUrl) {
                console.log('Setting iframe src to:', embedUrl);
                player.src = embedUrl;
                container.classList.add('video-active');
                console.log('▶️ Video playback started');
            } else {
                console.log('❌ No valid embed URL found');
                showNotification('Trailer not available for this movie.', 'error');
            }
        }

        // Attach handlers
        if (playBannerBtn) {
            playBannerBtn.addEventListener('click', startVideoPlayback);
        }
        if (watchNowBtn) {
            watchNowBtn.addEventListener('click', startVideoPlayback);
        }
    }

    /**
     * Load recommendations - WITH DESCRIPTIONS
     */
    async function loadRecommendations(currentMovie) {
        const grid = document.getElementById('recommendations-grid');
        
        if (!grid) return;

        try {
            // Extract genres from current movie
            const genres = Array.isArray(currentMovie.genre) ? currentMovie.genre : 
                          (currentMovie.genre ? [currentMovie.genre] : []);

            console.log('Looking for movies with genres:', genres);

            // Get all movies except current one
            const { data: allMovies, error } = await supabaseClient
                .from('movies')
                .select('*')
                .neq('id', currentMovie.id)
                .limit(20);

            if (error) throw error;

            let recommendations = [];

            // Filter movies with matching genres
            if (genres.length > 0 && allMovies) {
                recommendations = allMovies.filter(movie => {
                    const movieGenres = Array.isArray(movie.genre) ? movie.genre : 
                                      (movie.genre ? [movie.genre] : []);
                    
                    return movieGenres.some(g => genres.includes(g));
                });
            }

            // If not enough recommendations, add random movies
            if (recommendations.length < 6 && allMovies) {
                const randomMovies = allMovies.filter(m => !recommendations.find(r => r.id === m.id));
                recommendations = [...recommendations, ...randomMovies].slice(0, 6);
            }
            
            if (recommendations.length > 0) {
                grid.innerHTML = recommendations.map(movie => {
                    const poster = movie.poster || FALLBACK_POSTER;
                    const rating = movie.rating || 0;
                    const year = movie.release || 'N/A';
                    const runtime = movie.runtime || 'N/A';
                    const description = truncateText(movie.description, 100);
                    
                    // Use exact homepage structure with description
                    return `
                        <article class="film-card" data-movie-id="${movie.id}">
                            <div class="rating-display">
                                <i class="fas fa-star"></i>
                                <span>${parseFloat(rating).toFixed(1)}</span>
                            </div>
                            <img src="${poster}" alt="${movie.title}" 
                                 onerror="this.onerror=null; this.src='${FALLBACK_POSTER}'" />
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
                
                console.log(`✅ Loaded ${recommendations.length} recommendations`);
            } else {
                grid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-secondary);">No recommendations found.</p>';
            }
            
        } catch (error) {
            console.error('Error loading recommendations:', error);
            grid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-secondary);">No recommendations available.</p>';
        }
    }

    /**
     * Update watch history
     */
    async function updateWatchHistory(movieId) {
        if (!window.authService) return;
        const user = window.authService.getCurrentUser();
        if (!user) return;

        try {
            // Insert or update watch history
            const { error } = await supabaseClient
                .from('watch_history')
                .insert({
                    user_id: user.id,
                    movie_id: movieId,
                    watched_at: new Date().toISOString()
                }, { ignoreDuplicates: true });

            if (!error) {
                console.log('✅ Watch history updated.');
            }
            
        } catch (error) {
            console.log('Watch history update skipped');
        }
    }

    /**
     * Helper functions
     */
    function showError(message) {
        const container = document.getElementById('video-banner-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 50px; color: var(--text-primary);">
                <h2>Error</h2>
                <p>${message}</p>
                <a href="index.html" class="btn-primary" style="margin-top: 20px; display: inline-block;">Go Home</a>
            </div>
        `;
    }

    function hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => { 
                preloader.style.display = 'none'; 
            }, 300);
        }
    }

    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Event Listeners
     */
    
    // Share functionality
    document.addEventListener('click', (e) => {
        if (e.target.closest('#share-btn')) {
            const shareUrl = window.location.href;
            const movieTitle = document.querySelector('.info-container h1')?.textContent || 'Movie';
            
            if (navigator.share) {
                navigator.share({
                    title: `${movieTitle} - Roy Entertainment`,
                    text: `Check out ${movieTitle} on Roy Entertainment!`,
                    url: shareUrl,
                }).catch(err => console.log('Share cancelled'));
            } else {
                // Fallback to clipboard
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showNotification('Link copied to clipboard!', 'success');
                }).catch(() => {
                    showNotification('Failed to copy link.', 'error');
                });
            }
        }
    });
    
    // Recommendations click handler
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if (recommendationsGrid) {
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