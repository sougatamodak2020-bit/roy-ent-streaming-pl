// ========================================\r\n// MAIN SCRIPT - FULLY ASYNC\r\n// Roy Entertainment\r\n// ========================================

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
        // THIS IS THE FIX:
        // We check if slides.length > 0 before trying to run the code.
        // This stops the 'clientWidth' crash on other pages.
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
                // Recalculate width on update, just in case
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
                stopAutoScroll(); // Clear any existing
                autoScrollInterval = setInterval(nextSlide, 5000); // 5 seconds
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
    // THIS SECTION IS INTENTIONALLY LEFT BLANK.
    // The file "mobile-menu.js" now handles all mobile navigation.
    // Keeping this empty prevents JavaScript conflicts.


    /* --- 3. GENRE DROPDOWN LOADER --- */
    const genreMenu = document.getElementById('genre-menu');
    
    async function loadGenres() {
        if (!genreMenu) return; // Only run if the element exists
        if (genreMenu.children.length > 0) return;
        genreMenu.innerHTML = '<a href="#">Loading...</a>';
        
        if (!window.supabaseClient) {
            console.warn('Supabase not ready for genre loading, retrying...');
            setTimeout(loadGenres, 100);
            return;
        }

        try {
            const { data, error } = await supabaseClient.rpc('get_all_genres');

            if (error) throw error;

            if (data && data.length > 0) {
                genreMenu.innerHTML = data
                    .sort() 
                    .map(genre => {
                        if (!genre) return ''; // Skip null/empty genres
                        return `<a href="movies.html?genre=${encodeURIComponent(genre)}">${genre}</a>`;
                    })
                    .join('');
            } else {
                genreMenu.innerHTML = '<a href="#">No genres found</a>';
            }
        } catch (error) {
            console.error('Error loading genres:', error);
            genreMenu.innerHTML = '<a href="#">Error loading genres</a>';
        }
    }
    loadGenres();


    /* --- 4. SEARCH FUNCTIONALITY --- */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', async (e) => { // <-- Made async
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.toLowerCase().trim();
                if (!searchTerm || !window.supabaseClient) return;
                
                try {
                    const { data: movie, error } = await supabaseClient
                        .from('movies')
                        .select('id, title') // Select id and title
                        .ilike('title', `%${searchTerm}%`) // Case-insensitive "contains" search
                        .limit(1)
                        .single(); // Get the first match

                    if (error) {
                        console.warn('Search: No movie found', error);
                        window.showNotification('Movie not found!', 'error');
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
                    window.showNotification('Error during search.', 'error');
                }
            }
        });
    }
});