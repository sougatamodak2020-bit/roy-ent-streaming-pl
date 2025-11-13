// ========================================
// MAIN SCRIPT - FINAL FIXED VERSION
// Roy Entertainment
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Main script loaded');

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

    /* --- HERO SLIDER - FIXED VERSION --- */
    function initializeSlider() {
        const slider = document.querySelector('.hero-slider');
        const dotsContainer = document.getElementById('slider-dots');
        
        // Exit if no slider
        if (!slider) {
            console.log('No slider on this page');
            return;
        }

        // Exit if no dots container
        if (!dotsContainer) {
            console.log('No dots container found');
            return;
        }

        // Get slides
        const slides = Array.from(slider.children).filter(el => el.classList.contains('slide'));
        
        if (slides.length === 0) {
            console.log('No slides found');
            return;
        }

        let currentSlideIndex = 0;
        let autoScrollInterval = null;

        // Create dots
        dotsContainer.innerHTML = '';
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentSlideIndex = i;
                updateSlider();
                restartAutoScroll();
            });
            dotsContainer.appendChild(dot);
        });

        const dots = Array.from(dotsContainer.children);

        function updateSlider() {
            // Get first slide width safely
            const firstSlide = slides[0];
            if (!firstSlide) return;
            
            const slideWidth = firstSlide.offsetWidth || window.innerWidth;
            
            if (slider) {
                slider.scrollTo({
                    left: currentSlideIndex * slideWidth,
                    behavior: 'smooth'
                });
            }
            
            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlideIndex);
            });
        }

        function nextSlide() {
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            updateSlider();
        }

        function startAutoScroll() {
            stopAutoScroll();
            autoScrollInterval = setInterval(nextSlide, 5000);
        }

        function stopAutoScroll() {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
            }
        }

        function restartAutoScroll() {
            stopAutoScroll();
            startAutoScroll();
        }

        // Events
        slider.addEventListener('mouseenter', stopAutoScroll);
        slider.addEventListener('mouseleave', startAutoScroll);
        window.addEventListener('resize', updateSlider);

        // Start
        startAutoScroll();
        console.log('✅ Slider initialized');
    }

    // Run slider init after delay
    setTimeout(initializeSlider, 100);

    /* --- SEARCH --- */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.trim();
                if (searchTerm) {
                    window.location.href = `movies.html?search=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }

    /* --- FILM CARDS --- */
    document.body.addEventListener('click', (e) => {
        const filmCard = e.target.closest('.film-card[data-movie-id]');
        if (filmCard && !e.target.closest('a')) {
            const movieId = filmCard.dataset.movieId;
            if (movieId) {
                window.location.href = `watch.html?movie=${movieId}`;
            }
        }
    });

    /* --- SMOOTH SCROLL --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
});

/* --- GLOBAL FUNCTIONS --- */
window.showLoginRequired = function(movieId = null) {
    const popup = document.createElement('div');
    popup.className = 'login-required-overlay';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    let redirect = movieId ? `login.html?redirect=watch.html?movie=${movieId}` : 'login.html';
    
    popup.innerHTML = `
        <div class="login-required-card" style="background: var(--bg-card); padding: 30px; border-radius: 10px;">
            <i class="fas fa-lock" style="font-size: 3rem; color: var(--accent-primary);"></i>
            <h2>Login Required</h2>
            <p>Please login to watch this content</p>
            <div class="popup-actions" style="margin-top: 20px;">
                <a href="${redirect}" class="btn-primary" style="margin-right: 10px;">Login / Sign Up</a>
                <button onclick="this.closest('.login-required-overlay').remove()" class="btn-secondary">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
};

window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateX(400px);
        transition: transform 0.3s;
    `;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

window.showConfirmation = function(message, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    if (modal) {
        document.getElementById('custom-confirm-message').textContent = message;
        modal.classList.add('show');
        document.getElementById('custom-confirm-ok').onclick = () => {
            modal.classList.remove('show');
            if (onConfirm) onConfirm();
        };
        document.getElementById('custom-confirm-cancel').onclick = () => {
            modal.classList.remove('show');
        };
    } else if (confirm(message) && onConfirm) {
        onConfirm();
    }
};

// Modal functions
window.openAvatarSelector = () => document.getElementById('avatar-modal')?.classList.add('show');
window.closeAvatarSelector = () => document.getElementById('avatar-modal')?.classList.remove('show');
window.openUploadPhoto = () => document.getElementById('upload-modal')?.classList.add('show');
window.closeUploadPhoto = () => document.getElementById('upload-modal')?.classList.remove('show');
window.closeAppDownload = () => document.getElementById('app-download-modal')?.classList.remove('show');
window.downloadApp = () => document.getElementById('app-download-modal')?.classList.add('show');

window.selectAvatar = (url) => {
    if (window.profileManager) window.profileManager.updateAvatar(url);
    closeAvatarSelector();
};

window.uploadFromGallery = () => document.getElementById('file-input')?.click();
window.uploadFromGoogleDrive = () => window.showNotification('Coming soon!', 'info');

window.handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (window.profileManager) {
                window.profileManager.updateAvatar(e.target.result);
                closeUploadPhoto();
            }
        };
        reader.readAsDataURL(file);
    }
};

window.openWatchHistory = () => window.location.href = 'watch-history.html';
window.openSettings = () => window.showNotification('Settings coming soon!', 'info');
window.changeLanguage = (lang) => window.showNotification(`Language: ${lang}`, 'success');
window.handleLogout = () => {
    window.showConfirmation('Log out?', () => {
        if (window.authService) window.authService.signOut();
    });
};