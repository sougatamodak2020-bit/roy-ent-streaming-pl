// ========================================
// WATCH PAGE - COMPLETE DEBUG VERSION
// ========================================

// Global variable for debugging
window.DEBUG = true;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== WATCH PAGE STARTING ===');
    console.log('Page URL:', window.location.href);
    
    // Get movie ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('movie');
    console.log('Requested Movie ID:', movieId);
    
    if (!movieId) {
        showError('No movie ID provided in URL');
        return;
    }
    
    // Initialize the page
    await initializePage(movieId);
});

async function initializePage(movieId) {
    // Step 1: Check for Supabase
    console.log('\n--- Step 1: Checking Supabase Connection ---');
    
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library not loaded');
        showError('Database library not loaded. Please refresh.');
        return;
    }
    console.log('✅ Supabase library loaded');
    
    // Wait for supabaseClient to be initialized
    let attempts = 0;
    while (!window.supabaseClient && attempts < 30) {
        console.log('⏳ Waiting for supabaseClient initialization...');
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabaseClient) {
        console.error('❌ supabaseClient not initialized after 3 seconds');
        showError('Database connection failed. Please check your configuration.');
        return;
    }
    
    console.log('✅ supabaseClient initialized');
    
    // Step 2: Test database connection
    console.log('\n--- Step 2: Testing Database Connection ---');
    try {
        const { data, error } = await window.supabaseClient
            .from('movies')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Database connection test failed:', error);
            showError(`Database error: ${error.message}`);
            return;
        }
        console.log('✅ Database connection successful');
    } catch (err) {
        console.error('❌ Database connection error:', err);
        showError(`Connection error: ${err.message}`);
        return;
    }
    
    // Step 3: Fetch the movie
    console.log('\n--- Step 3: Fetching Movie Data ---');
    console.log(`Looking for movie with id: "${movieId}"`);
    
    try {
        // First, let's see what columns are available
        const { data: sampleMovie, error: sampleError } = await window.supabaseClient
            .from('movies')
            .select('*')
            .limit(1)
            .single();
            
        if (!sampleError && sampleMovie) {
            console.log('📊 Available columns in movies table:', Object.keys(sampleMovie));
            console.log('📊 Sample movie structure:', sampleMovie);
        }
        
        // Now fetch the requested movie
        let { data: movie, error } = await window.supabaseClient
            .from('movies')
            .select('*')
            .eq('id', movieId)
            .maybeSingle();
            
        if (error) {
            console.error('❌ Error fetching movie:', error);
            
            // Try to list all available movies
            const { data: allMovies } = await window.supabaseClient
                .from('movies')
                .select('id, title')
                .limit(10);
                
            if (allMovies) {
                console.log('📋 Available movies (first 10):');
                allMovies.forEach(m => console.log(`   - id: "${m.id}" | title: "${m.title}"`));
            }
            
            showError(`Movie fetch error: ${error.message}`);
            return;
        }
        
        if (!movie) {
            console.error(`❌ No movie found with id: "${movieId}"`);
            
            // Try case-insensitive search
            console.log('🔍 Trying case-insensitive search...');
            const { data: moviesLike } = await window.supabaseClient
                .from('movies')
                .select('id, title')
                .ilike('id', `%${movieId}%`)
                .limit(5);
                
            if (moviesLike && moviesLike.length > 0) {
                console.log('📋 Similar movie IDs found:');
                moviesLike.forEach(m => console.log(`   - id: "${m.id}" | title: "${m.title}"`));
                showError(`Movie "${movieId}" not found. Did you mean: ${moviesLike[0].id}?`);
            } else {
                showError(`Movie "${movieId}" not found in database.`);
            }
            return;
        }
        
        console.log('✅ Movie found!', movie);
        
        // Step 4: Display the movie
        console.log('\n--- Step 4: Displaying Movie ---');
        displayMovie(movie);
        
        // Step 5: Load recommendations
        console.log('\n--- Step 5: Loading Recommendations ---');
        await loadRecommendations(movie);
        
    } catch (err) {
        console.error('❌ Unexpected error:', err);
        showError(`Unexpected error: ${err.message}`);
    }
    
    // Hide preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'none';
    }
}

function displayMovie(movie) {
    console.log('🎬 Displaying movie:', movie.title);
    
    // Update page title
    document.title = `${movie.title} - Roy Entertainment`;
    
    // Update breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb-nav');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <a href="index.html">Home</a>
            <span class="separator"> / </span>
            <a href="movies.html">Movies</a>
            <span class="separator"> / </span>
            <span class="current-page">${movie.title}</span>
        `;
    }
    
    // Update banner
    const banner = document.getElementById('watch-area-banner');
    if (banner) {
        const backdropUrl = movie.backdrop_url || movie.backdrop || movie.banner || movie.poster_url || movie.poster;
        if (backdropUrl) {
            banner.style.cssText = `
                background-image: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${backdropUrl}');
                background-size: cover;
                background-position: center;
                min-height: 400px;
            `;
        }
    }
    
    // Process data with multiple fallbacks
    const posterUrl = movie.poster_url || movie.poster || movie.image || 'https://via.placeholder.com/300x450?text=No+Poster';
    const description = movie.description || movie.overview || movie.plot || 'No description available.';
    const releaseDate = movie.release_date || movie.released || movie.year || '';
    const rating = movie.rating || movie.vote_average || movie.imdb_rating || 0;
    const trailerUrl = movie.trailer_url || movie.trailer || movie.video_url || movie.youtube_url || '';
    
    // Handle actors - could be array, string, or JSON string
    let actorsArray = [];
    if (movie.actors) {
        if (Array.isArray(movie.actors)) {
            actorsArray = movie.actors;
        } else if (typeof movie.actors === 'string') {
            if (movie.actors.startsWith('[')) {
                try {
                    actorsArray = JSON.parse(movie.actors);
                } catch (e) {
                    actorsArray = movie.actors.split(',').map(a => a.trim());
                }
            } else {
                actorsArray = movie.actors.split(',').map(a => a.trim());
            }
        }
    } else if (movie.cast) {
        // Same logic for 'cast' field
        if (Array.isArray(movie.cast)) {
            actorsArray = movie.cast;
        } else if (typeof movie.cast === 'string') {
            actorsArray = movie.cast.split(',').map(a => a.trim());
        }
    }
    
    // Handle genres - could be array, string, or JSON string
    let genresArray = [];
    if (movie.genre || movie.genres) {
        const genreData = movie.genre || movie.genres;
        if (Array.isArray(genreData)) {
            genresArray = genreData;
        } else if (typeof genreData === 'string') {
            if (genreData.startsWith('[')) {
                try {
                    genresArray = JSON.parse(genreData);
                } catch (e) {
                    genresArray = genreData.split(',').map(g => g.trim());
                }
            } else {
                genresArray = genreData.split(',').map(g => g.trim());
            }
        }
    }
    
    console.log('📊 Processed data:', { actorsArray, genresArray, trailerUrl });
    
    // Update movie details panel
    const detailsPanel = document.querySelector('.movie-details-panel');
    if (detailsPanel) {
        detailsPanel.innerHTML = `
            <div class="poster-container">
                <img src="${posterUrl}" alt="${movie.title}" 
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
            </div>
            <div class="info-container">
                <h1>${movie.title}</h1>
                <p class="plot-summary">${description}</p>
                
                <div class="metadata-grid">
                    ${actorsArray.length > 0 ? `
                        <div>
                            <span>Starring:</span>
                            <span>${actorsArray.slice(0, 3).join(', ')}</span>
                        </div>
                    ` : ''}
                    ${genresArray.length > 0 ? `
                        <div>
                            <span>Genre:</span>
                            <span>${genresArray.join(', ')}</span>
                        </div>
                    ` : ''}
                    ${releaseDate ? `
                        <div>
                            <span>Release:</span>
                            <span>${new Date(releaseDate).getFullYear()}</span>
                        </div>
                    ` : ''}
                    ${rating ? `
                        <div>
                            <span>Rating:</span>
                            <span>⭐ ${parseFloat(rating).toFixed(1)}/10</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="actions-bar">
                    <button class="action-btn primary" onclick="playTrailer()">
                        <i class="fas fa-play"></i> Play Trailer
                    </button>
                    <button class="action-btn" onclick="shareMovie()">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
    }
    
    // Update streaming section
    const streamingSection = document.getElementById('streaming-section');
    if (streamingSection) {
        streamingSection.style.display = 'block';
        
        if (trailerUrl) {
            const videoId = extractYouTubeId(trailerUrl);
            if (videoId) {
                streamingSection.innerHTML = `
                    <h2 class="player-title">Now Playing: ${movie.title}</h2>
                    <div class="player-wrapper">
                        <iframe 
                            src="https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                        </iframe>
                    </div>
                `;
                console.log('✅ Trailer loaded with ID:', videoId);
            } else {
                streamingSection.innerHTML = `
                    <h2 class="player-title">${movie.title}</h2>
                    <div style="padding: 40px; text-align: center;">
                        <p>⚠️ Invalid trailer URL format</p>
                        <small style="opacity: 0.7;">URL: ${trailerUrl}</small>
                    </div>
                `;
            }
        } else {
            streamingSection.innerHTML = `
                <h2 class="player-title">${movie.title}</h2>
                <div style="padding: 40px; text-align: center;">
                    <i class="fas fa-film" style="font-size: 3rem; opacity: 0.5;"></i>
                    <p>No trailer available yet</p>
                </div>
            `;
        }
    }
}

function extractYouTubeId(url) {
    if (!url) return null;
    
    // Various YouTube URL patterns
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

async function loadRecommendations(currentMovie) {
    const grid = document.getElementById('recommendations-grid');
    if (!grid) return;
    
    try {
        const { data: recommendations, error } = await window.supabaseClient
            .from('movies')
            .select('*')
            .neq('id', currentMovie.id)
            .limit(6);
            
        if (error) {
            console.error('❌ Error loading recommendations:', error);
            return;
        }
        
        if (recommendations && recommendations.length > 0) {
            grid.innerHTML = recommendations.map(movie => {
                const poster = movie.poster_url || movie.poster || 'https://via.placeholder.com/200x300?text=No+Poster';
                const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA';
                const rating = movie.rating ? parseFloat(movie.rating).toFixed(1) : 'N/A';
                
                return `
                    <div class="film-card" onclick="window.location.href='watch.html?movie=${movie.id}'" style="cursor: pointer;">
                        <div class="card-thumbnail">
                            <img src="${poster}" alt="${movie.title}" 
                                 onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">
                        </div>
                        <div class="card-info">
                            <h3>${movie.title}</h3>
                            <p>${year} • ⭐ ${rating}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            console.log(`✅ Loaded ${recommendations.length} recommendations`);
        }
    } catch (err) {
        console.error('❌ Failed to load recommendations:', err);
    }
}

function showError(message) {
    console.error('🚨 ERROR:', message);
    
    const streamingSection = document.getElementById('streaming-section');
    if (streamingSection) {
        streamingSection.style.display = 'block';
        streamingSection.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff4444; margin-bottom: 20px;"></i>
                <h2>Error Loading Movie</h2>
                <p style="margin: 20px 0; color: var(--text-primary);">${message}</p>
                <a href="index.html" class="action-btn primary" style="display: inline-block;">
                    <i class="fas fa-home"></i> Go to Homepage
                </a>
            </div>
        `;
    }
    
    // Hide preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.display = 'none';
    }
}

// Global functions for button clicks
window.playTrailer = function() {
    const player = document.querySelector('#streaming-section iframe');
    if (player) {
        player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

window.shareMovie = function() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Link copied to clipboard!');
        });
    }
}