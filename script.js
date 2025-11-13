// ========================================
// MAIN SCRIPT - COMPLETELY FIXED
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

    /* --- HERO SLIDER - COMPLETELY FIXED --- */
    function initializeSlider() {
        const slider = document.querySelector('.hero-slider');
        const dotsContainer = document.getElementById('slider-dots');
        
        // Check if both elements exist
        if (!slider || !dotsContainer) {
            console.log('Slider elements not found');
            return;
        }

        // Get only slide elements (not the gradient overlay)
        const slides = Array.from(slider.children).filter(el => el.classList.contains('slide'));
        
        if (slides.length === 0) {
            console.log('No slides found');
            return;
        }

        let currentSlideIndex = 0;
        let autoScrollInterval = null;

        // Clear existing dots and create new ones
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
            // Use scrollWidth instead of clientWidth and add null check
            const slideWidth = slides[0]?.offsetWidth || window.innerWidth;
            
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
                autoScrollInterval = null;
            }
        }

        function restartAutoScroll() {
            stopAutoScroll();
            startAutoScroll();
        }

        // Setup intersection observer for smooth scrolling
        if ('IntersectionObserver' in window && slider) {
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
        if (slider) {
            slider.addEventListener('mouseenter', stopAutoScroll);
            slider.addEventListener('mouseleave', startAutoScroll);
        }
        
        window.addEventListener('resize', updateSlider);

        // Start auto scroll
        startAutoScroll();
        
        console.log('✅ Slider initialized successfully');
    }

    // Initialize slider after a small delay to ensure DOM is ready
    setTimeout(initializeSlider, 100);

    /* --- LOGIN REQUIRED POPUP --- */
    window.showLoginRequired = function(movieId = null) {
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

    /* --- SEARCH FUNCTIONALITY --- */
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

    /* --- NOTIFICATION SYSTEM --- */
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    /* --- CONFIRMATION DIALOG --- */
    window.showConfirmation = function(message, onConfirm) {
        const modal = document.getElementById('custom-confirm-modal');
        const messageEl = document.getElementById('custom-confirm-message');
        const okBtn = document.getElementById('custom-confirm-ok');
        const cancelBtn = document.getElementById('custom-confirm-cancel');
        
        if (!modal || !messageEl || !okBtn || !cancelBtn) {
            // Fallback to native confirm
            if (confirm(message) && onConfirm) {
                onConfirm();
            }
            return;
        }
        
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

    /* --- SMOOTH SCROLL --- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    /* --- FILM CARD CLICKS --- */
    document.body.addEventListener('click', (e) => {
        const filmCard = e.target.closest('.film-card[data-movie-id]');
        if (filmCard && !e.target.closest('a') && !e.target.closest('button')) {
            const movieId = filmCard.dataset.movieId;
            if (movieId) {
                window.location.href = `watch.html?movie=${movieId}`;
            }
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
    window.showNotification('Google Drive integration coming soon!', 'info');
};

window.handleFileUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            window.showNotification('Please select an image file', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            window.showNotification('Image size must be less than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            if (window.profileManager) {
                window.profileManager.updateAvatar(e.target.result);
                closeUploadPhoto();
            }
        };
        reader.readAsDataURL(file);
    }
};

window.openWatchHistory = function() {
    window.location.href = 'watch-history.html';
};

window.openSettings = function() {
    window.showNotification('Settings page coming soon!', 'info');
};

window.changeLanguage = function(lang) {
    console.log('Language changed to:', lang);
    window.showNotification(`Language changed to ${lang}`, 'success');
};

window.downloadApp = function() {
    const modal = document.getElementById('app-download-modal');
    if (modal) modal.classList.add('show');
};

window.closeAppDownload = function() {
    const modal = document.getElementById('app-download-modal');
    if (modal) modal.classList.remove('show');
};

window.handleLogout = function() {
    window.showConfirmation('Are you sure you want to log out?', async () => {
        if (window.authService) {
            await window.authService.signOut();
        }
    });
};

/* --- DATABASE CONNECTION TEST --- */
window.addEventListener('load', () => {
    // Test database connection after everything loads
    setTimeout(async () => {
        if (window.supabaseClient) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('movies')
                    .select('id, title')
                    .limit(1);
                
                if (error) {
                    console.error('❌ Database access error:', error);
                    console.log('Movies table might not be accessible. Check RLS policies.');
                } else if (data && data.length > 0) {
                    console.log('✅ Database connected! Sample movie:', data[0].title);
                } else {
                    console.log('⚠️ Database connected but no movies found');
                }
            } catch (err) {
                console.error('Database connection test failed:', err);
            }
        } else {
            console.log('⚠️ Supabase client not initialized yet');
        }
    }, 2000);
});