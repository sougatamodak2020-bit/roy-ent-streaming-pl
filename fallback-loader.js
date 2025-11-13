// fallback-loader.js - Load static content if database fails
window.FALLBACK_MOVIES = [
    {
        id: 'asur',
        title: 'Asur',
        poster: 'img/movie-banner-1.png',
        rating: 9.5,
        release: '2025',
        runtime: '5m',
        description: 'A forensic expert and a criminal investigator pursue a serial killer...'
    },
    {
        id: 'lazy-assassin',
        title: 'Lazy Assassin',
        poster: 'img/movie-banner-2.webp',
        rating: 9.5,
        release: '2025',
        runtime: '1h 27m',
        description: 'Meet the world\'s most unconventional hitman - lazy, sarcastic...'
    }
    // Add more fallback movies
];

window.loadFallbackMovies = function() {
    console.log('Loading fallback movies...');
    const grid = document.querySelector('#our-productions .film-grid');
    if (grid && window.FALLBACK_MOVIES) {
        grid.innerHTML = window.FALLBACK_MOVIES.map(movie => `
            <article class="film-card" data-movie-id="${movie.id}">
                <div class="rating-display">
                    <i class="fas fa-star"></i>
                    <span>${movie.rating}</span>
                </div>
                <img src="${movie.poster}" alt="${movie.title}" />
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
        `).join('');
    }
};