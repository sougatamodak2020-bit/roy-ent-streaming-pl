// ========================================\
// MAIN SCRIPT - FULLY ASYNC
// Roy Entertainment
// ========================================


// Add this at the very beginning of your main script
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 Debugging movie access on page load...');
    
    if (window.supabaseClient) {
        // Test immediate access
        const { data, error } = await window.supabaseClient
            .from('movies')
            .select('id, title')
            .limit(1);
        
        if (error) {
            console.error('❌ CRITICAL: Movies not accessible!', error);
            alert('Movies cannot be loaded. Error: ' + error.message);
        } else {
            console.log('✅ Movies are accessible:', data);
        }
    }
});

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
        const slides = document.querySelectorAll('.slide');
        const prevButton = document.getElementById('slide-prev');
        const nextButton = document.getElementById('slide-next');
        const dotsContainer = document.getElementById('slider-dots');
        let currentSlideIndex = 0;
        let slideWidth = slides[0].clientWidth;
        let autoScrollInterval = null;

        // Create dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentSlideIndex = i;
                updateSlider();
            });
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        function updateSlider() {
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
            autoScrollInterval = setInterval(nextSlide, 5000);
        }

        function stopAutoScroll() {
            clearInterval(autoScrollInterval);
        }

        if (nextButton) nextButton.addEventListener('click', () => {
            nextSlide();
            stopAutoScroll();
            startAutoScroll();
        });
        
        if (prevButton) prevButton.addEventListener('click', () => {
            prevSlide();
            stopAutoScroll();
            startAutoScroll();
        });

        slider.addEventListener('mouseenter', stopAutoScroll);
        slider.addEventListener('mouseleave', startAutoScroll);
        window.addEventListener('resize', updateSlider);

        startAutoScroll();
    }

    /* --- 2. LOGIN REQUIRED POPUP (if profile.js doesn't load it) --- */
    if (typeof window.showLoginRequired === 'undefined') {
        window.showLoginRequired = (movieId = null) => {
            const popup = document.createElement('div');
            popup.className = 'login-required-overlay';
            let redirect = 'login.html';
            if (movieId) {
                redirect = `login.html?redirect=watch.html?movie=${movieId}`;
            }
            
            popup.innerHTML = `
                <div class="login-required-card">
                    <i class="fas fa-lock"></i>
                    <h2>Login Required</h2>
                    <p>Please login to watch this content</p>
                    <div class="popup-actions">
                        <a href="${redirect}" class="popup-btn primary">Login / Sign Up</a>
                        <button class="popup-btn" id="close-popup">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
            setTimeout(() => popup.classList.add('show'), 10);

            popup.addEventListener('click', (e) => {
                if (e.target.id === 'close-popup' || e.target === popup) {
                    popup.classList.remove('show');
                    setTimeout(() => popup.remove(), 300);
                }
            });
        };
    }

    /* --- 3. SEARCH FUNCTIONALITY (NOW ASYNC) --- */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', async (e) => { // <-- Made async
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.toLowerCase().trim();
                if (!searchTerm) return;
                
                try {
                    // NEW: Query Supabase database
                    const { data: movie, error } = await supabaseClient
                        .from('movies')
                        .select('id')
                        .ilike('title', `%${searchTerm}%`) // Case-insensitive search
                        .limit(1)
                        .single();

                    if (error) throw error;
                    
                    if (movie) {
                        // Check login status using authService
                        if (window.authService && !window.authService.isLoggedIn()) {
                            window.showLoginRequired(movie.id);
                        } else {
                            window.location.href = `watch.html?movie=${movie.id}`;
                        }
                    } else {
                        window.showNotification('Movie not found!', 'error');
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    window.showNotification('Movie not found!', 'error');
                }
            }
        });
    }
});