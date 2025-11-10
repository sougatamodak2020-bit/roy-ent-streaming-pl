// ========================================
// AUTHENTICATION CHECK
// ========================================

// Check if user is logged in
const getCurrentUser = () => {
    const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};

// Show login required popup
function showLoginRequired() {
    const popup = document.createElement('div');
    popup.className = 'login-required-overlay';
    popup.innerHTML = `
        <div class="login-required-card">
            <i class="fas fa-lock"></i>
            <h2>Login Required</h2>
            <p>Please login to watch this content</p>
            <div class="popup-actions">
                <a href="login.html" class="popup-btn primary">Login / Sign Up</a>
                <button class="popup-btn" id="close-popup">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add('show'), 10);

    document.getElementById('close-popup').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }
    });
}

// Add login required popup styles
const popupStyles = document.createElement('style');
popupStyles.textContent = `
    .login-required-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .login-required-overlay.show {
        opacity: 1;
    }

    .login-required-card {
        background: var(--bg-secondary);
        border-radius: 20px;
        padding: 50px 40px;
        max-width: 450px;
        width: 90%;
        text-align: center;
        border: 2px solid var(--accent-primary);
        box-shadow: 0 20px 60px var(--shadow);
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }

    .login-required-overlay.show .login-required-card {
        transform: scale(1);
    }

    .login-required-card i {
        font-size: 4rem;
        color: var(--accent-primary);
        margin-bottom: 20px;
    }

    .login-required-card h2 {
        font-size: 2rem;
        color: var(--text-accent);
        margin-bottom: 15px;
    }

    .login-required-card p {
        font-size: 1.1rem;
        color: var(--text-secondary);
        margin-bottom: 30px;
    }

    .popup-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
    }

    .popup-btn {
        padding: 15px 30px;
        border: 2px solid var(--border-color);
        background: var(--bg-card);
        color: var(--text-primary);
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
        font-family: var(--font);
    }

    .popup-btn:hover {
        background: var(--bg-primary);
        transform: translateY(-2px);
    }

    .popup-btn.primary {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: #fff;
    }

    .popup-btn.primary:hover {
        background: #b8032a;
        box-shadow: 0 10px 30px rgba(210, 4, 45, 0.4);
    }
`;
document.head.appendChild(popupStyles);

// ========================================
// MOVIE DATABASE - FIXED CELCIUS
// ========================================

const movieDatabase = {
    'asur': {
        title: 'Asur',
        youtubeId: '34K1ouwt8Hs',
        thumbnail: 'img/movie-banner-1.png',
        poster: 'img/movie-banner-1.png',
        genre: ['Mystery', 'Thriller', 'Crime'],
        release: '2025',
        rating: 9.5,
        actors: 'Arjun Rampal, Barun Sobti, Anupriya Goenka',
        director: 'Oni Sen',
        country: 'India',
        quality: '4K HDR',
        runtime: '5m',
        description: 'A forensic expert and a criminal investigator pursue a serial killer terrorizing the city. As they decode cryptic clues, they realize the killer follows ancient mythology, making this a riveting cat-and-mouse game between good and evil.',
        youtubeLink: 'https://youtu.be/34K1ouwt8Hs'
    },
    'lazy-assassin': {
        title: 'Lazy Assassin',
        youtubeId: '3hZOAp5qFGI',
        thumbnail: 'img/movie-banner-2.webp',
        poster: 'img/movie-banner-2.webp',
        genre: ['Action', 'Comedy', 'Crime'],
        release: '2025',
        rating: 9.5,
        actors: 'Rajesh Kumar, Priya Sharma, Amit Singh',
        director: 'Sun Roy',
        country: 'India',
        quality: 'HD',
        runtime: '1h 27m',
        description: 'Meet the world\'s most unconventional hitman - lazy, sarcastic, but surprisingly effective. When he\'s forced to take on his biggest contract yet, his laid-back approach leads to hilarious chaos and unexpected heroism.',
        youtubeLink: 'https://youtu.be/3hZOAp5qFGI'
    },
    'rudrapur': {
        title: 'Rudrapur',
        youtubeId: 'U2-k108cTyE',
        thumbnail: 'img/movie-banner-3.png',
        poster: 'img/movie-banner-3.png',
        genre: ['Horror', 'Mystery', 'Supernatural'],
        release: '2024',
        rating: 9.5,
        actors: 'Vikram Singh, Shraddha Kapoor, Nawazuddin Siddiqui',
        director: 'Sun Roy',
        country: 'India',
        quality: 'HD',
        runtime: '31m',
        description: 'In the cursed village of Rudrapur, ancient secrets awaken when a group of friends stumble upon a forbidden temple. As supernatural forces unleash terror, they must uncover the dark history before becoming its next victims.',
        youtubeLink: 'https://youtu.be/U2-k108cTyE'
    },
    'predictor': {
        title: 'Predictor',
        youtubeId: '_ZdXj0fkva8',
        thumbnail: 'img/movie-banner-4.jpg',
        poster: 'img/movie-banner-4.jpg',
        genre: ['Sci-Fi', 'Thriller', 'Mystery'],
        release: '2024',
        rating: 9.5,
        actors: 'Rajkummar Rao, Taapsee Pannu, Pankaj Tripathi',
        director: 'Sun Roy',
        country: 'India',
        quality: 'HD',
        runtime: '30m',
        description: 'A brilliant mathematician discovers an algorithm that can predict future events with startling accuracy. But when powerful forces seek to exploit this technology, he must race against time to prevent catastrophic consequences.',
        youtubeLink: 'https://youtu.be/_ZdXj0fkva8'
    },
    'niladri': {
        title: 'Niladri',
        youtubeId: '9uNwFrt6Wfw',
        thumbnail: 'img/movie-banner-5.webp',
        poster: 'img/movie-banner-5.webp',
        genre: ['Adventure', 'Drama', 'Mystery'],
        release: '2024',
        rating: 9.5,
        actors: 'Randeep Hooda, Tillotama Shome, Adil Hussain',
        director: 'Sun Roy',
        country: 'India',
        quality: 'HD',
        runtime: '15:30m',
        description: 'Set against the backdrop of the majestic Nilgiri mountains, this gripping tale follows a group of trekkers who discover an ancient civilization. Their adventure turns into a fight for survival as they uncover secrets that were meant to stay buried.',
        youtubeLink: 'https://youtu.be/9uNwFrt6Wfw'
    },
    'celcius': {
        title: 'Celcius',
        youtubeId: 'mcYxoyb07pg', // Fixed: Removed tracking parameters
        thumbnail: 'img/movie-banner-6.jpg',
        poster: 'img/movie-banner-6.jpg',
        genre: ['Thriller', 'Drama', 'Mystery'],
        release: '2024',
        rating: 9.5,
        actors: 'John Doe, Jane Smith, Robert Kumar',
        director: 'Sun Roy',
        country: 'India',
        quality: 'HD',
        runtime: '21:45m',
        description: 'Set against the backdrop of the majestic Nilgiri mountains, Celcius explores the depths of human endurance and survival in extreme conditions. A gripping thriller that will keep you on the edge of your seat.',
        youtubeLink: 'https://youtu.be/mcYxoyb07pg' // Fixed: Removed tracking parameters
        // Removed embedRestricted flag - let it try to play first
    },
    '12-am': {
        title: '12 AM',
        youtubeId: 'W1-EAIPP5ks',
        thumbnail: 'img/movie-banner-7.png',
        poster: 'img/movie-banner-7.png',
        genre: ['Horror', 'Thriller', 'Supernatural'],
        release: '2024',
        rating: 9.5,
        actors: 'Abhay Deol, Radhika Apte, Gulshan Devaiah',
        director: 'Sun Roy',
        country: 'India',
        quality: 'HD',
        runtime: '17m',
        description: 'Every night at midnight, something sinister awakens in an old apartment building. When a journalist investigates a series of mysterious deaths, she uncovers a terrifying pattern that threatens her own life. Time is running out, and midnight is approaching.',
        youtubeLink: 'https://youtu.be/W1-EAIPP5ks'
    }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get YouTube Thumbnail
function getYouTubeThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Get thumbnail - uses custom if available, otherwise YouTube
function getMovieThumbnail(movieData) {
    if (movieData.thumbnail) {
        return movieData.thumbnail;
    }
    return getYouTubeThumbnail(movieData.youtubeId);
}

// Get poster - uses custom if available, otherwise thumbnail
function getMoviePoster(movieData) {
    if (movieData.poster) {
        return movieData.poster;
    }
    return getMovieThumbnail(movieData);
}

// Get movie ID from URL
function getMovieIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('movie');
}

// Create movie card for recommendations
function createMovieCard(movieId, movieData) {
    const thumbnail = getMovieThumbnail(movieData);
    const ytFallback = getYouTubeThumbnail(movieData.youtubeId);

    return `
        <article class="film-card" onclick="window.location.href='watch.html?movie=${movieId}'">
            <div class="rating-display">
                <i class="fas fa-star"></i>
                <span>${movieData.rating}</span>
            </div>
            <img src="${thumbnail}" 
                 alt="${movieData.title}"
                 onerror="this.src='${ytFallback}'" />
            <div class="card-content">
                <h3>${movieData.title}</h3>
                <div class="film-card-meta">
                    <span class="rating"><i class="fas fa-star"></i> ${movieData.rating}</span>
                    <span>${movieData.release}</span>
                    <span>${movieData.runtime}</span>
                </div>
                <p>${movieData.description.substring(0, 70)}...</p>
            </div>
        </article>
    `;
}

// Load YouTube video in iframe - IMPROVED EMBEDDING CHECK
function loadYouTubeVideo(movieData) {
    const currentUser = getCurrentUser();
    
    // Check if user is logged in
    if (!currentUser) {
        showLoginRequired();
        return;
    }
    
    const streamingSection = document.getElementById('streaming-section');
    const iframe = document.getElementById('movie-player');
    
    if (!streamingSection || !iframe) {
        console.error('Streaming section or iframe not found');
        return;
    }
    
    // Show streaming section
    streamingSection.classList.add('active');
    streamingSection.style.display = 'block';
    
    // Build YouTube embed URL
    const videoUrl = `https://www.youtube.com/embed/${movieData.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    
    console.log('Loading video:', movieData.title, 'with ID:', movieData.youtubeId);
    
    // Clear any previous content
    iframe.src = '';
    
    // Set up a timeout to check if video loads
    let embedCheckTimeout = setTimeout(() => {
        // If we reach here and haven't detected successful load, assume restriction
        console.log('Video may have embedding restrictions');
        // Only show restriction message if specifically marked or after timeout
        if (movieData.embedRestricted === true) {
            showEmbedRestrictedMessage(movieData);
        }
    }, 5000); // Wait 5 seconds before assuming restriction
    
    // Load video
    iframe.src = videoUrl;
    
    // Clear timeout if iframe loads successfully
    iframe.onload = function() {
        clearTimeout(embedCheckTimeout);
        console.log('Video iframe loaded successfully');
        
        // Only show restriction if explicitly marked as restricted
        if (movieData.embedRestricted === true) {
            // Give it a moment to see if video actually plays
            setTimeout(() => {
                // You could add additional checks here
                console.log('Video marked as embed restricted');
            }, 1000);
        }
    };
    
    // Handle iframe error
    iframe.onerror = function() {
        clearTimeout(embedCheckTimeout);
        console.error('Video iframe error');
        showEmbedError(movieData);
    };
    
    // Scroll to player
    setTimeout(() => {
        streamingSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
    }, 400);
}

// Show embedding restriction message
function showEmbedRestrictedMessage(movieData) {
    const streamingSection = document.getElementById('streaming-section');
    const playerWrapper = streamingSection.querySelector('.player-wrapper');
    
    if (!playerWrapper) return;
    
    playerWrapper.innerHTML = `
        <div style="
            position: absolute;
            inset: 0;
            background: var(--bg-secondary);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
        ">
            <i class="fab fa-youtube" style="font-size: 5rem; color: #ff0000; margin-bottom: 20px;"></i>
            <h3 style="font-size: 1.8rem; color: var(--text-accent); margin-bottom: 15px;">
                Video Embedding Restricted
            </h3>
            <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 30px; max-width: 500px;">
                This video cannot be played here due to YouTube embedding restrictions.
                Please watch it directly on YouTube.
            </p>
            <a href="${movieData.youtubeLink}" 
               target="_blank" 
               style="
                   display: inline-flex;
                   align-items: center;
                   gap: 10px;
                   padding: 15px 30px;
                   background: #ff0000;
                   color: white;
                   text-decoration: none;
                   border-radius: 8px;
                   font-weight: 600;
                   font-size: 1.1rem;
                   transition: all 0.3s ease;
               "
               onmouseover="this.style.background='#cc0000'; this.style.transform='translateY(-2px)'"
               onmouseout="this.style.background='#ff0000'; this.style.transform='translateY(0)'">
                <i class="fab fa-youtube"></i>
                Watch on YouTube
            </a>
        </div>
    `;
}

// Show general embed error
function showEmbedError(movieData) {
    const streamingSection = document.getElementById('streaming-section');
    const playerWrapper = streamingSection.querySelector('.player-wrapper');
    
    if (!playerWrapper) return;
    
    playerWrapper.innerHTML = `
        <div style="
            position: absolute;
            inset: 0;
            background: var(--bg-secondary);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
        ">
            <i class="fas fa-exclamation-triangle" style="font-size: 5rem; color: var(--accent-primary); margin-bottom: 20px;"></i>
            <h3 style="font-size: 1.8rem; color: var(--text-accent); margin-bottom: 15px;">
                Unable to Load Video
            </h3>
            <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 30px; max-width: 500px;">
                There was an error loading this video. Please try watching it on YouTube.
            </p>
            <a href="${movieData.youtubeLink}" 
               target="_blank" 
               style="
                   display: inline-flex;
                   align-items: center;
                   gap: 10px;
                   padding: 15px 30px;
                   background: #ff0000;
                   color: white;
                   text-decoration: none;
                   border-radius: 8px;
                   font-weight: 600;
                   font-size: 1.1rem;
                   transition: all 0.3s ease;
               "
               onmouseover="this.style.background='#cc0000'"
               onmouseout="this.style.background='#ff0000'">
                <i class="fab fa-youtube"></i>
                Open in YouTube
            </a>
        </div>
    `;
}

// ========================================
// MAIN PAGE INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Hide preloader
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
        }
    }, 1000);

    // Get movie ID from URL
    const movieId = getMovieIdFromURL();

    if (!movieId || !movieDatabase[movieId]) {
        alert('Movie not found!');
        window.location.href = 'index.html';
        return;
    }

    const movieData = movieDatabase[movieId];
    const thumbnail = getMovieThumbnail(movieData);
    const poster = getMoviePoster(movieData);
    const ytThumbnail = getYouTubeThumbnail(movieData.youtubeId);

    console.log('Movie:', movieData.title);
    console.log('YouTube ID:', movieData.youtubeId);
    console.log('Thumbnail path:', thumbnail);

    // ========================================
    // CHECK USER AUTHENTICATION
    // ========================================
    const currentUser = getCurrentUser();
    const authBtn = document.getElementById('login-btn');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (currentUser) {
        if (authBtn) authBtn.style.display = 'none';
        if (profileDropdown) {
            profileDropdown.style.display = 'block';
            // Profile manager will handle the rest
        }
    }

    // ========================================
    // POPULATE PAGE WITH MOVIE DATA
    // ========================================

    // Update breadcrumb
    const breadcrumbTitle = document.getElementById('breadcrumb-movie-title');
    if (breadcrumbTitle) {
        breadcrumbTitle.textContent = movieData.title;
    }

    // Update banner background WITH FALLBACK
    const banner = document.getElementById('watch-area-banner');
    if (banner) {
        banner.style.backgroundImage = `url('${thumbnail}')`;

        // Test if custom image loads, if not use YouTube thumbnail
        const testBannerImage = new Image();
        testBannerImage.onerror = function () {
            console.log('Custom banner failed, using YouTube thumbnail');
            banner.style.backgroundImage = `url('${ytThumbnail}')`;
        };
        testBannerImage.src = thumbnail;
    }

    // Update poster with fallback
    const posterImg = document.getElementById('movie-poster');
    if (posterImg) {
        posterImg.src = poster;
        posterImg.alt = movieData.title;
        posterImg.onerror = function () {
            console.log('Custom poster failed, using YouTube thumbnail');
            this.src = ytThumbnail;
        };
    }

    // Update movie details - with null checks
    const updateElement = (id, content, isHTML = false) => {
        const element = document.getElementById(id);
        if (element) {
            if (isHTML) {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
    };

    updateElement('movie-title', movieData.title);
    updateElement('movie-genre', movieData.genre.join(', '));
    updateElement('movie-actors', movieData.actors);
    updateElement('movie-director', movieData.director);
    updateElement('movie-country', movieData.country);
    updateElement('movie-quality', movieData.quality);
    updateElement('movie-runtime', movieData.runtime);
    updateElement('movie-release', movieData.release);
    updateElement('movie-rating', `<i class="fas fa-star"></i> ${movieData.rating}`, true);
    updateElement('movie-description', movieData.description);

    // Update page title
    document.title = `${movieData.title} - Roy Entertainment`;

    // ========================================
    // BUTTON EVENT LISTENERS
    // ========================================

    // Watch Now button
    const watchNowBtn = document.getElementById('watch-now-btn');
    if (watchNowBtn) {
        watchNowBtn.addEventListener('click', () => {
            loadYouTubeVideo(movieData);
        });
    }

    // Play on YouTube button
    const playYouTubeBtn = document.getElementById('play-on-youtube-btn');
    if (playYouTubeBtn) {
        playYouTubeBtn.addEventListener('click', () => {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                showLoginRequired();
            } else {
                window.open(movieData.youtubeLink, '_blank');
            }
        });
    }

    // Banner click - play video
    if (banner) {
        banner.addEventListener('click', () => {
            loadYouTubeVideo(movieData);
        });
    }

    // ========================================
    // RECOMMENDATIONS SECTION
    // ========================================

    const recommendationsGrid = document.getElementById('recommendations-grid');

    // Get all movies except current one
    const recommendations = Object.keys(movieDatabase)
        .filter(id => id !== movieId)
        .slice(0, 6);

    if (recommendations.length > 0 && recommendationsGrid) {
        let cardsHTML = recommendations
            .map(id => createMovieCard(id, movieDatabase[id]))
            .join('');
        recommendationsGrid.innerHTML = cardsHTML;
    }

    // ========================================
    // SHARE FUNCTIONALITY
    // ========================================

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareUrl = window.location.href;
            const shareText = `Check out ${movieData.title} on Roy Entertainment!`;

            if (navigator.share) {
                navigator.share({
                    title: movieData.title,
                    text: shareText,
                    url: shareUrl
                }).catch(err => console.log('Error sharing:', err));
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('Link copied to clipboard!');
                }).catch(() => {
                    const tempInput = document.createElement('input');
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    alert('Link copied to clipboard!');
                });
            }
        });
    }

    // ========================================
    // SEARCH FUNCTIONALITY
    // ========================================

    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.toLowerCase().trim();
                const foundMovie = Object.keys(movieDatabase).find(id =>
                    movieDatabase[id].title.toLowerCase().includes(searchTerm)
                );

                if (foundMovie) {
                    window.location.href = `watch.html?movie=${foundMovie}`;
                } else {
                    alert('Movie not found!');
                }
            }
        });
    }
});