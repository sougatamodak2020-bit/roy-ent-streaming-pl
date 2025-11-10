// ========================================
// MOVIES PAGE - FIXED DISPLAY
// Roy Entertainment
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    // Preloader handling
    const hidePreloader = () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 300);
        }
    };

    // Movie Database
    const movieDatabase = {
        'asur': { 
            title: 'Asur', 
            poster: 'img/movie-banner-1.png', 
            genre: ['Mystery', 'Thriller', 'Crime'], 
            release: 2025, 
            rating: 9.5,
            runtime: '5m',
            description: 'A forensic expert and a criminal investigator pursue a serial killer terrorizing the city.'
        },
        'lazy-assassin': { 
            title: 'Lazy Assassin', 
            poster: 'img/movie-banner-2.webp', 
            genre: ['Action', 'Comedy', 'Crime'], 
            release: 2025, 
            rating: 9.5,
            runtime: '1h 27m',
            description: 'Meet the world\'s most unconventional hitman - lazy, sarcastic, but surprisingly effective.'
        },
        'rudrapur': { 
            title: 'Rudrapur', 
            poster: 'img/movie-banner-3.png', 
            genre: ['Horror', 'Mystery', 'Supernatural'], 
            release: 2024, 
            rating: 9.5,
            runtime: '31m',
            description: 'In the cursed village of Rudrapur, ancient secrets awaken.'
        },
        'predictor': { 
            title: 'Predictor', 
            poster: 'img/movie-banner-4.jpg', 
            genre: ['Sci-Fi', 'Thriller', 'Mystery'], 
            release: 2024, 
            rating: 9.5,
            runtime: '30m',
            description: 'A brilliant mathematician discovers an algorithm that can predict future events.'
        },
        'niladri': { 
            title: 'Niladri', 
            poster: 'img/movie-banner-5.webp', 
            genre: ['Adventure', 'Drama', 'Mystery'], 
            release: 2024, 
            rating: 9.5,
            runtime: '15:30m',
            description: 'Set against the backdrop of the majestic Nilgiri mountains.'
        },
        'celcius': { 
            title: 'Celcius', 
            poster: 'img/movie-banner-6.jpg', 
            genre: ['Thriller', 'Drama', 'Mystery'], 
            release: 2024, 
            rating: 9.5,
            runtime: '21:45m',
            description: 'Explores the depths of human endurance and survival in extreme conditions.'
        },
        '12-am': { 
            title: '12 AM', 
            poster: 'img/movie-banner-7.png', 
            genre: ['Horror', 'Thriller', 'Supernatural'], 
            release: 2024, 
            rating: 9.5,
            runtime: '17m',
            description: 'Every night at midnight, something sinister awakens in an old apartment building.'
        }
    };

    // Create movie card
    const createMovieCard = (id, movie) => {
        return `
            <article class="film-card" data-movie-id="${id}" style="cursor: pointer;">
                <div class="rating-display" style="opacity: 1;">
                    <i class="fas fa-star"></i>
                    <span>${movie.rating}</span>
                </div>
                <img src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/380x214/1a1a1a/ffffff?text=${movie.title}'"/>
                <div class="card-content">
                    <h3>${movie.title}</h3>
                    <div class="film-card-meta">
                        <span class="rating"><i class="fas fa-star"></i> ${movie.rating}</span>
                        <span>${movie.release}</span>
                        <span>${movie.runtime}</span>
                    </div>
                    <p>${movie.description}</p>
                </div>
            </article>
        `;
    };

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const genre = urlParams.get('genre');
    const movieGrid = document.getElementById('movie-grid');
    const pageTitle = document.getElementById('page-title');

    // Default: show all movies
    let filteredMovies = Object.entries(movieDatabase);
    let title = "All Movies";

    // Filter by category
    if (category) {
        title = category.charAt(0).toUpperCase() + category.slice(1) + " Movies";
        
        switch(category) {
            case 'latest':
                filteredMovies = Object.entries(movieDatabase)
                    .filter(([id, movie]) => movie.release >= 2024)
                    .sort((a, b) => b[1].release - a[1].release);
                break;
                
            case 'popular':
                filteredMovies = Object.entries(movieDatabase)
                    .sort((a, b) => b[1].rating - a[1].rating);
                break;
                
            case 'upcoming':
                filteredMovies = Object.entries(movieDatabase)
                    .filter(([id, movie]) => movie.release >= 2025);
                break;
        }
    } 
    // Filter by genre
    else if (genre) {
        title = genre + " Movies";
        filteredMovies = Object.entries(movieDatabase)
            .filter(([id, movie]) => movie.genre.includes(genre));
    }

    // Update page title
    if (pageTitle) {
        pageTitle.textContent = title;
    }
    document.title = title + " - Roy Entertainment";
    
    // Render movie cards
    if (movieGrid) {
        if (filteredMovies.length > 0) {
            movieGrid.innerHTML = filteredMovies
                .map(([id, movie]) => createMovieCard(id, movie))
                .join('');
        } else {
            movieGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-film" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3; color: var(--text-secondary);"></i>
                    <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: var(--text-primary);">No Movies Found</h2>
                    <p style="font-size: 1.1rem; color: var(--text-secondary);">No movies found in this category. Try browsing other categories.</p>
                    <a href="movies.html" style="
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: var(--accent-primary);
                        color: #fff;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    ">Browse All Movies</a>
                </div>
            `;
        }
    }

    // Add click handlers for movie cards
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.film-card');
        if (card && card.dataset.movieId) {
            window.location.href = `watch.html?movie=${card.dataset.movieId}`;
        }
    });

    // Search functionality
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
                    alert('Movie not found! Try: Asur, Lazy Assassin, Rudrapur, Predictor, Niladri, Celcius, or 12 AM');
                }
            }
        });
    }

    // Add fade-in animation
    const filmCards = document.querySelectorAll('.film-card');
    filmCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });

    // Hide preloader after content loads
    setTimeout(hidePreloader, 500);
});