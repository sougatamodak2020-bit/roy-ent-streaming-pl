// Prevent script errors if certain elements don't exist
document.addEventListener('DOMContentLoaded', () => {
    // Only run preloader code if preloader exists
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
});

/* --- script.js --- */

document.addEventListener('DOMContentLoaded', () => {

    /* --- PRELOADER --- */
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
            document.body.classList.remove('hidden');
        }
    }, 1500);

    /* --- 1. SLIDER FUNCTIONALITY (for index.html) --- */
    const slider = document.querySelector('.hero-slider');

    // Check if we are on a page with the slider
    if (slider) {
        const slides = document.querySelectorAll('.slide');
        const prevButton = document.getElementById('slide-prev');
        const nextButton = document.getElementById('slide-next');
        const dotsContainer = document.getElementById('slider-dots');

        let currentSlideIndex = 0;
        let slideWidth = slides[0].clientWidth;

        // --- Create Navigation Dots ---
        slides.forEach((slide, index) => {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            if (index === 0) {
                dot.classList.add('active');
            }
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => {
                scrollToSlide(index);
            });
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        // --- Function to scroll to a specific slide ---
        function scrollToSlide(index) {
            slider.scrollTo({
                left: index * slideWidth,
                behavior: 'smooth'
            });
            currentSlideIndex = index;
            updateActiveDot();
        }

        // --- Function to update which dot is active ---
        function updateActiveDot() {
            dots.forEach((dot, index) => {
                if (index === currentSlideIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        // --- Arrow Button Event Listeners ---
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                let nextIndex = (currentSlideIndex + 1) % slides.length;
                scrollToSlide(nextIndex);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                let prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
                scrollToSlide(prevIndex);
            });
        }

        // --- Update slide width on window resize ---
        window.addEventListener('resize', () => {
            slideWidth = slides[0].clientWidth;
            scrollToSlide(currentSlideIndex);
        });

        // --- ADVANCED: Update dots on user scroll ---
        const observerOptions = {
            root: slider,
            rootMargin: '0px',
            threshold: 0.51
        };

        const slideObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const intersectingSlide = entry.target;
                    currentSlideIndex = Array.from(slides).indexOf(intersectingSlide);
                    updateActiveDot();
                }
            });
        }, observerOptions);

        slides.forEach(slide => {
            slideObserver.observe(slide);
        });
    }

    /* --- 2. FILM CARD NAVIGATION --- */
    const filmCards = document.querySelectorAll('.film-card');

    filmCards.forEach(card => {
        card.addEventListener('click', function() {
            const movieId = this.getAttribute('data-movie-id');
            if (movieId) {
                window.location.href = `watch.html?movie=${movieId}`;
            }
        });
    });

    /* --- 3. LOGIN STATUS CHECK --- */
    const authBtn = document.getElementById('auth-btn');
    const isLoggedIn = localStorage.getItem('isLoggedIn') || sessionStorage.getItem('isLoggedIn');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');

    if (isLoggedIn === 'true' && authBtn) {
        // Get first letter of name or email
        const initial = userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase();
        
        // Replace login button with user profile
        authBtn.className = 'user-profile-btn';
        authBtn.innerHTML = `
            <div class="user-avatar">${initial}</div>
            <span>${userName || 'User'}</span>
        `;
        
        // Add dropdown menu
        authBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // FIXED: Using showConfirmation instead of confirm
            window.showConfirmation('Do you want to logout?', () => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                sessionStorage.clear();
                window.location.reload();
            });
        });
    }

    /* --- 4. SEARCH FUNCTIONALITY --- */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.toLowerCase().trim();
                
                // Define searchable movies
                const movies = {
                    'asur': 'asur',
                    'lazy assassin': 'lazy-assassin',
                    'lazy-assassin': 'lazy-assassin',
                    'rudrapur': 'rudrapur',
                    'predictor': 'predictor',
                    'niladri': 'niladri',
                    'celcius': 'celcius',
                    '12 am': '12-am',
                    '12am': '12-am'
                };
                
                const movieId = movies[searchTerm];
                
                if (movieId) {
                    window.location.href = `watch.html?movie=${movieId}`;
                } else {
                    // FIXED: Using showNotification instead of alert
                    window.showNotification('Movie not found! Try: Asur, Lazy Assassin, Rudrapur, Predictor, Niladri, Celcius, or 12 AM', 'error');
                }
            }
        });
    }
});

/* --- script.js --- */ // This is the second part of your file

document.addEventListener('DOMContentLoaded', () => {

    /* --- PRELOADER --- */
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.display = 'none';
            document.body.classList.remove('hidden');
        }
    }, 1500);

    /* --- AUTHENTICATION CHECK & WELCOME MESSAGE --- */
    const getCurrentUser = () => {
        const user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    };

    const currentUser = getCurrentUser();
    const authBtn = document.getElementById('auth-btn');

    // Show welcome message
    if (currentUser) {
        showWelcomeMessage(currentUser.name);
        
        // Update auth button to show user profile
        if (authBtn) {
            const initial = currentUser.name.charAt(0).toUpperCase();
            authBtn.className = 'user-profile-btn';
            authBtn.href = '#';
            authBtn.innerHTML = `
                <div class="user-avatar">${initial}</div>
                <span>${currentUser.name}</span>
            `;
            
            // Add logout on click
            authBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showUserMenu();
            });
        }
    }

    // Show welcome message function
    function showWelcomeMessage(userName) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Welcome back, <strong>${userName}</strong>!
        `;
        document.body.appendChild(welcomeMsg);

        setTimeout(() => {
            welcomeMsg.classList.add('show');
        }, 500);

        setTimeout(() => {
            welcomeMsg.classList.remove('show');
            setTimeout(() => welcomeMsg.remove(), 500);
        }, 4000);
    }

    // User menu function
    function showUserMenu() {
        const menu = document.createElement('div');
        menu.className = 'user-menu-overlay';
        menu.innerHTML = `
            <div class="user-menu-card">
                <div class="user-menu-header">
                    <div class="user-avatar-large">${currentUser.name.charAt(0).toUpperCase()}</div>
                    <h3>${currentUser.name}</h3>
                    <p>${currentUser.email}</p>
                </div>
                <div class="user-menu-actions">
                    <button class="menu-btn" id="close-menu">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <button class="menu-btn logout-btn" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(menu);

        setTimeout(() => menu.classList.add('show'), 10);

        // Close menu
        document.getElementById('close-menu').addEventListener('click', () => {
            menu.classList.remove('show');
            setTimeout(() => menu.remove(), 300);
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('currentUser');
            window.location.reload();
        });

        // Close on overlay click
        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                menu.classList.remove('show');
                setTimeout(() => menu.remove(), 300);
            }
        });
    }

    /* --- SLIDER FUNCTIONALITY --- */
    const slider = document.querySelector('.hero-slider');

    if (slider) {
        const slides = document.querySelectorAll('.slide');
        const prevButton = document.getElementById('slide-prev');
        const nextButton = document.getElementById('slide-next');
        const dotsContainer = document.getElementById('slider-dots');

        let currentSlideIndex = 0;
        let slideWidth = slides[0].clientWidth;

        // Create dots
        slides.forEach((slide, index) => {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => scrollToSlide(index));
            dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        function scrollToSlide(index) {
            slider.scrollTo({
                left: index * slideWidth,
                behavior: 'smooth'
            });
            currentSlideIndex = index;
            updateActiveDot();
        }

        function updateActiveDot() {
            dots.forEach((dot, index) => {
                if (index === currentSlideIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                let nextIndex = (currentSlideIndex + 1) % slides.length;
                scrollToSlide(nextIndex);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                let prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
                scrollToSlide(prevIndex);
            });
        }

        window.addEventListener('resize', () => {
            slideWidth = slides[0].clientWidth;
            scrollToSlide(currentSlideIndex);
        });

        const observerOptions = {
            root: slider,
            rootMargin: '0px',
            threshold: 0.51
        };

        const slideObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const intersectingSlide = entry.target;
                    currentSlideIndex = Array.from(slides).indexOf(intersectingSlide);
                    updateActiveDot();
                }
            });
        }, observerOptions);

        slides.forEach(slide => slideObserver.observe(slide));
    }

    /* --- FILM CARD NAVIGATION WITH LOGIN CHECK --- */
    const filmCards = document.querySelectorAll('.film-card');

    filmCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const movieId = this.getAttribute('data-movie-id');
            
            if (!currentUser) {
                showLoginRequired(movieId);
            } else {
                window.location.href = `watch.html?movie=${movieId}`;
            }
        });
    });

    // Show login required popup
    function showLoginRequired(movieId) {
        const popup = document.createElement('div');
        popup.className = 'login-required-overlay';
        popup.innerHTML = `
            <div class="login-required-card">
                <i class="fas fa-lock"></i>
                <h2>Login Required</h2>
                <p>Please login to watch this content</p>
                <div class="popup-actions">
                    <a href="login.html" class="popup-btn primary">Login</a>
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

    /* --- SEARCH FUNCTIONALITY --- */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.toLowerCase().trim();
                
                const movies = {
                    'asur': 'asur',
                    'lazy assassin': 'lazy-assassin',
                    'lazy-assassin': 'lazy-assassin',
                    'rudrapur': 'rudrapur',
                    'predictor': 'predictor',
                    'niladri': 'niladri',
                    'celcius': 'celcius',
                    '12 am': '12-am',
                    '12am': '12-am'
                };
                
                const movieId = movies[searchTerm];
                
                if (movieId) {
                    if (!currentUser) {
                        showLoginRequired(movieId);
                    } else {
                        window.location.href = `watch.html?movie=${movieId}`;
                    }
                } else {
                    // FIXED: Using showNotification instead of alert
                    window.showNotification('Movie not found! Try: Asur, Lazy Assassin, Rudrapur, Predictor, Niladri, Celcius, or 12 AM', 'error');
                }
            }
        });
    }
});