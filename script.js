// ========================================
// MAIN SCRIPT - FIXED VERSION
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

    /* --- 1. SLIDER FUNCTIONALITY (FIXED) --- */
    const slider = document.querySelector('.hero-slider');
    const dotsContainer = document.getElementById('slider-dots');
    
    if (slider && dotsContainer) {
        const slides = [...slider.children].filter(el => el.classList.contains('slide'));
        
        if (slides.length > 0) {
            let currentSlideIndex = 0;
            let autoScrollInterval = null;

            // Create dots
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

            const dots = [...dotsContainer.children];

            function updateSlider() {
                // Check if slider has clientWidth before using it
                if (slider && slider.clientWidth) {
                    const slideWidth = slider.clientWidth;
                    slider.scrollTo({
                        left: currentSlideIndex * slideWidth,
                        behavior: 'smooth'
                    });
                    
                    // Update dots
                    dots.forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentSlideIndex);
                    });
                }
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
                    autoScrollInterval = null;
                }
            }

            function restartAutoScroll() {
                stopAutoScroll();
                startAutoScroll();
            }

            // Setup intersection observer for smooth scrolling
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const index = slides.indexOf(entry.target);
                            if (index !== -1) {
                                currentSlideIndex = index;
                                dots.forEach((dot, i) => {
                                    dot.classList.toggle('active', i === currentSlideIndex);
                                });
                            }
                        }
                    });
                }, { root: slider, threshold: 0.51 });

                slides.forEach(slide => observer.observe(slide));
            }

            // Event listeners
            slider.addEventListener('mouseenter', stopAutoScroll);
            slider.addEventListener('mouseleave', startAutoScroll);
            window.addEventListener('resize', updateSlider);

            // Start auto scroll
            startAutoScroll();
        }
    }

    /* --- 2. LOGIN REQUIRED POPUP --- */
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

    /* --- 3. SEARCH FUNCTIONALITY --- */
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchBar.value.trim();
                if (searchTerm) {
                    // Redirect to movies page with search query
                    window.location.href = `movies.html?search=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }

    /* --- 4. NOTIFICATION SYSTEM --- */
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    /* --- 5. CONFIRMATION DIALOG --- */
    window.showConfirmation = function(message, onConfirm) {
        const modal = document.getElementById('custom-confirm-modal');
        const messageEl = document.getElementById('custom-confirm-message');
        const okBtn = document.getElementById('custom-confirm-ok');
        const cancelBtn = document.getElementById('custom-confirm-cancel');
        
        if (!modal || !messageEl || !okBtn || !cancelBtn) return;
        
        messageEl.textContent = message;
        modal.classList.add('show');
        
        const handleOk = () => {
            modal.classList.remove('show');
            if (onConfirm) onConfirm();
            cleanup();
        };
        
        const handleCancel = () => {
            modal.classList.remove('show');
            cleanup();
        };
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
    };

    /* --- 6. SMOOTH SCROLL --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    /* --- 7. FILM CARD CLICKS --- */
    document.body.addEventListener('click', (e) => {
        const filmCard = e.target.closest('.film-card[data-movie-id]');
        if (filmCard && !e.target.closest('a')) {
            const movieId = filmCard.dataset.movieId;
            window.location.href = `watch.html?movie=${movieId}`;
        }
    });
});

/* --- GLOBAL MODAL FUNCTIONS --- */
window.openAvatarSelector = function() {
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.classList.add('show');
};

window.closeAvatarSelector = function() {
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.classList.remove('show');
};

window.selectAvatar = function(avatarUrl) {
    if (window.profileManager) {
        window.profileManager.updateAvatar(avatarUrl);
    }
    closeAvatarSelector();
};

window.openUploadPhoto = function() {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.add('show');
};

window.closeUploadPhoto = function() {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.remove('show');
};

window.uploadFromGallery = function() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.click();
};

window.uploadFromGoogleDrive = function() {
    alert('Google Drive integration coming soon!');
};

window.handleFileUpload = function(event) {
    const file = event.target.files[0];
    if (file && window.profileManager) {
        const reader = new FileReader();
        reader.onload = function(e) {
            window.profileManager.updateAvatar(e.target.result);
            closeUploadPhoto();
        };
        reader.readAsDataURL(file);
    }
};

window.openWatchHistory = function() {
    window.location.href = 'watch-history.html';
};

window.openSettings = function() {
    alert('Settings page coming soon!');
};

window.changeLanguage = function(lang) {
    console.log('Language changed to:', lang);
};

window.downloadApp = function() {
    const modal = document.getElementById('app-download-modal');
    if (modal) modal.classList.add('show');
};

window.closeAppDownload = function() {
    const modal = document.getElementById('app-download-modal');
    if (modal) modal.classList.remove('show');
};

/* --- DATABASE TEST --- */
window.addEventListener('load', async () => {
    // Wait a bit for Supabase to initialize
    setTimeout(async () => {
        if (window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('movies')
                    .select('id')
                    .limit(1);
                
                if (error) {
                    console.error('❌ Movies access test failed:', error);
                    console.log('Check your Supabase RLS policies');
                } else {
                    console.log('✅ Movies are accessible to users');
                }
            } catch (err) {
                console.error('Database test error:', err);
            }
        }
    }, 1000);
});