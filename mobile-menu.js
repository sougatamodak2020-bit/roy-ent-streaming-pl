/* ========================================
   MOBILE MENU HANDLER
   Roy Entertainment
======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Create mobile menu HTML and inject it
    function createMobileMenu() {
        const mobileMenuHTML = `
            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle" id="mobile-menu-toggle">
                <i class="fas fa-bars"></i>
            </button>
            
            <!-- Mobile Search Toggle -->
            <button class="mobile-search-toggle" id="mobile-search-toggle">
                <i class="fas fa-search"></i>
            </button>
            
            <!-- Mobile Menu Overlay -->
            <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
            
            <!-- Mobile Menu -->
            <nav class="mobile-menu" id="mobile-menu">
                <div class="mobile-menu-header">
                    <span>Menu</span>
                    <button class="mobile-menu-close" id="mobile-menu-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mobile-menu-content">
                    <a href="index.html" class="mobile-menu-item">
                        <i class="fas fa-home"></i> Home
                    </a>
                    
                    <div class="mobile-menu-dropdown" id="movies-dropdown">
                        <button class="mobile-menu-dropdown-toggle">
                            Movies <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="mobile-menu-dropdown-content">
                            <a href="movies.html?category=latest">Latest</a>
                            <a href="movies.html?category=popular">Popular</a>
                            <a href="movies.html?category=upcoming">Upcoming</a>
                        </div>
                    </div>
                    
                    <div class="mobile-menu-dropdown" id="genre-dropdown">
                        <button class="mobile-menu-dropdown-toggle">
                            Genre <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="mobile-menu-dropdown-content">
                            <a href="movies.html?genre=Action">Action</a>
                            <a href="movies.html?genre=Adventure">Adventure</a>
                            <a href="movies.html?genre=Animation">Animation</a>
                            <a href="movies.html?genre=Comedy">Comedy</a>
                            <a href="movies.html?genre=Crime">Crime</a>
                            <a href="movies.html?genre=Drama">Drama</a>
                            <a href="movies.html?genre=Horror">Horror</a>
                            <a href="movies.html?genre=Romance">Romance</a>
                            <a href="movies.html?genre=Thriller">Thriller</a>
                            <a href="movies.html?genre=Science%20Fiction">Sci-Fi</a>
                        </div>
                    </div>
                    
                    <a href="index.html#our-productions" class="mobile-menu-item">
                        <i class="fas fa-film"></i> Our Productions
                    </a>
                    
                    <a href="downloads.html" class="mobile-menu-item">
                        <i class="fas fa-download"></i> Downloads
                    </a>
                </div>
            </nav>
        `;

        // Insert mobile menu elements
        const navRight = document.querySelector('.nav-right');
        if (navRight) {
            navRight.insertAdjacentHTML('afterbegin', mobileMenuHTML.match(/<button class="mobile-menu-toggle"[^>]*>.*?<\/button>/s)[0]);
            navRight.insertAdjacentHTML('afterbegin', mobileMenuHTML.match(/<button class="mobile-search-toggle"[^>]*>.*?<\/button>/s)[0]);
        }
        
        document.body.insertAdjacentHTML('beforeend', mobileMenuHTML.match(/<div class="mobile-menu-overlay"[^>]*>.*?<\/div>/s)[0]);
        document.body.insertAdjacentHTML('beforeend', mobileMenuHTML.match(/<nav class="mobile-menu"[^>]*>.*?<\/nav>/s)[0]);
    }

    // Initialize mobile menu
    createMobileMenu();

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');

    function openMobileMenu() {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', openMobileMenu);
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }

    // Mobile dropdown toggles
    document.querySelectorAll('.mobile-menu-dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const dropdown = toggle.parentElement;
            dropdown.classList.toggle('active');
        });
    });

    // Mobile search toggle
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    const searchContainer = document.querySelector('.search-container');
    
    if (mobileSearchToggle && searchContainer) {
        // Clone search container for mobile
        const mobileSearchContainer = searchContainer.cloneNode(true);
        mobileSearchContainer.classList.add('mobile-search');
        document.body.appendChild(mobileSearchContainer);
        
        mobileSearchToggle.addEventListener('click', () => {
            mobileSearchContainer.classList.toggle('active');
            if (mobileSearchContainer.classList.contains('active')) {
                mobileSearchContainer.querySelector('input').focus();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                mobileSearchContainer.classList.remove('active');
                closeMobileMenu();
            }
        });
    }

    // Close menu on navigation
    document.querySelectorAll('.mobile-menu-item, .mobile-menu-dropdown-content a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        }, 250);
    });
});