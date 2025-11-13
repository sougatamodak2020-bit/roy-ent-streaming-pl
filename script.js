// ========================================
// MAIN SCRIPT - FULLY ASYNC
// Roy Entertainment
// ========================================

document.addEventListener('DOMContentLoaded', () => {

    /* --- PRELOADER --- */
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                document.body.classList.remove('hidden');
            }, 300);
        }, 1000);
    }

    /* --- 1. SLIDER FUNCTIONALITY (for index.html) --- */
    const slider = document.querySelector('.hero-slider');
    if (slider) {
        const slides = Array.from(document.querySelectorAll('.slide'));
        const prevButton = document.getElementById('slide-prev');
        const nextButton = document.getElementById('slide-next');
        const dotsContainer = document.getElementById('slider-dots');
        let currentSlideIndex = 0;
        let autoScrollInterval = null;

        // =========================================================
        // FIX: Check if slides exist before accessing them
        // =========================================================
        if (slides.length > 0) {
            let slideWidth = slides[0].clientWidth; // Now it's safe

            // Create dots
            slides.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.classList.add('dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    currentSlideIndex = i;
                    updateSlider();
                    resetAutoScroll();
                });
                if(dotsContainer) dotsContainer.appendChild(dot);
            });

            const dots = document.querySelectorAll('.dot');

            function updateSlider() {
                // Recalculate width on update
                slideWidth = slides[0].clientWidth;
                slider.style.transform = `translateX(-${currentSlideIndex * slideWidth}px)`;
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentSlideIndex);
                });
            }

            function nextSlide() {
                currentSlideIndex = (currentSlideIndex + 1) % slides.length;
                updateSlider();
            }

            function prevSlide() {
                currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
                updateSlider();
            }

            function startAutoScroll() {
                stopAutoScroll();
                autoScrollInterval = setInterval(nextSlide, 5000);
            }

            function stopAutoScroll() {
                clearInterval(autoScrollInterval);
            }

            function resetAutoScroll() {
                stopAutoScroll();
                startAutoScroll();
            }
            
            window.addEventListener('resize', () => {
                updateSlider();
            });

            if(nextButton) nextButton.addEventListener('click', () => {
                nextSlide();
                resetAutoScroll();
            });
            
            if(prevButton) prevButton.addEventListener('click', () => {
                prevSlide();
                resetAutoScroll();
            });

            // Pause on hover
            slider.addEventListener('mouseenter', stopAutoScroll);
            slider.addEventListener('mouseleave', startAutoScroll);

            startAutoScroll();
        }
    }

    
    /* --- 2. HAMBURGER MENU TOGGLE --- */
    // Handled by mobile-menu.js


    /* --- 3. GENRE DROPDOWN LOADER --- */
    const genreMenu = document.getElementById('genre-menu');
    
    async function loadGenres() {
        if (!genreMenu) return;
        if (genreMenu.children.length > 0) return;
        genreMenu.innerHTML = '<a href="#">Loading...</a>';
        
        if (!window.supabaseClient) {
            console.warn('Supabase not ready for genre loading, retrying...');
            setTimeout(loadGenres, 100);
            return;
        }

        try {
            // First try to get genres from movies table
            const { data: movies, error: moviesError } = await window.supabaseClient
                .from('movies')
                .select('genre');

            if (moviesError) throw moviesError;

            // Extract unique genres
            const genresSet = new Set();
            movies.forEach(movie => {
                if (movie.genre) {
                    if (Array.isArray(movie.genre)) {
                        movie.genre.forEach(g => genresSet.add(g));
                    } else if (typeof movie.genre === 'string') {
                        genresSet.add(movie.genre);
                    }
                }
            });

            const uniqueGenres = Array.from(genresSet).filter(Boolean).sort();

            if (uniqueGenres.length > 0) {
                genreMenu.innerHTML = uniqueGenres
                    .map(genre => `<a href="movies.html?genre=${encodeURIComponent(genre)}">${genre}</a>`)
                    .join('');
            } else {
                genreMenu.innerHTML = '<a href="#">No genres found</a>';
            }
        } catch (error) {
            console.error('Error loading genres:', error);
            // Fallback to hardcoded genres
            const fallbackGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller'];
            genreMenu.innerHTML = fallbackGenres
                .map(genre => `<a href="movies.html?genre=${encodeURIComponent(genre)}">${genre}</a>`)
                .join('');
        }
    }
    loadGenres();


    /* --- 4. SEARCH FUNCTIONALITY --- */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.toLowerCase().trim();
                if (!searchTerm || !window.supabaseClient) return;
                
                try {
                    const { data: movie, error } = await window.supabaseClient
                        .from('movies')
                        .select('id, title')
                        .ilike('title', `%${searchTerm}%`)
                        .limit(1)
                        .single();

                    if (error) {
                        console.warn('Search: No movie found', error);
                        if (window.showNotification) {
                            window.showNotification('Movie not found!', 'error');
                        }
                        return;
                    }
                    
                    if (movie) {
                        if (window.authService && !window.authService.isLoggedIn()) {
                            if (window.showLoginRequired) {
                                window.showLoginRequired(movie.id);
                            } else {
                                window.location.href = `login.html?redirect=watch.html?movie=${movie.id}`;
                            }
                        } else {
                            window.location.href = `watch.html?movie=${movie.id}`;
                        }
                    } 
                } catch (error) {
                    console.error('Search error:', error);
                    if (window.showNotification) {
                        window.showNotification('Error during search.', 'error');
                    }
                }
            }
        });
    }
});