// ========================================
// SUPABASE PROFILE MANAGER - FULLY FIXED
// Roy Entertainment - User Profile Management
// ========================================

class ProfileManager {
    constructor() {
        this.authService = null;
        this.waitForAuthService();
    }

    waitForAuthService() {
        const checkInterval = setInterval(() => {
            if (window.authService) {
                this.authService = window.authService;
                clearInterval(checkInterval);
                this.init();
            }
        }, 100);
    }

    init() {
        this.setupEventListeners();
        this.setupModalHandlers();
        console.log('%c👤 Profile Manager Initialized', 'color: #3ECF8E; font-weight: bold; font-size: 14px');
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const profileDropdown = document.querySelector('.profile-dropdown');
            const profileMenu = document.querySelector('.profile-menu');
            
            if (profileDropdown && profileMenu && !profileDropdown.contains(e.target)) {
                // Let CSS handle the closing via :hover
            }
        });
    }

    setupModalHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.show').forEach(modal => {
                    modal.classList.remove('show');
                });
            }
        });
    }

    // Update all avatar images in the UI
    updateAvatarImages(avatarUrl) {
        // Update all avatar elements
        const avatarElements = [
            'profile-avatar',
            'profile-menu-avatar'
        ];
        
        avatarElements.forEach(id => {
            const elements = document.querySelectorAll(`#${id}`);
            elements.forEach(el => {
                if (el && el.tagName === 'IMG') {
                    el.src = avatarUrl;
                }
            });
        });

        // Also update by class names
        document.querySelectorAll('.profile-avatar').forEach(img => {
            img.src = avatarUrl;
        });
        
        document.querySelectorAll('.profile-menu-avatar').forEach(img => {
            img.src = avatarUrl;
        });
    }
}

let profileManager = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        profileManager = new ProfileManager();
    });
} else {
    profileManager = new ProfileManager();
}

// GLOBAL FUNCTIONS
window.openAvatarSelector = function() {
    const modal = document.getElementById('avatar-modal');
    if (modal) {
        modal.classList.add('show');
    }
};

window.closeAvatarSelector = function() {
    const modal = document.getElementById('avatar-modal');
    if (modal) {
        modal.classList.remove('show');
    }
};

window.selectAvatar = async function(avatarUrl) {
    console.log('Selecting avatar:', avatarUrl);
    
    if (!window.authService) {
        window.showNotification('Authentication service not ready', 'error');
        return;
    }
    
    if (!authService.isLoggedIn()) {
        window.showNotification('Please login first!', 'error');
        return;
    }

    try {
        window.showNotification('Updating avatar...', 'info');
        
        // Immediately update UI (optimistic update)
        if (profileManager) {
            profileManager.updateAvatarImages(avatarUrl);
        }
        
        // Update all avatar images immediately
        document.querySelectorAll('#profile-avatar, .profile-avatar').forEach(img => {
            img.src = avatarUrl;
        });
        
        document.querySelectorAll('#profile-menu-avatar, .profile-menu-avatar').forEach(img => {
            img.src = avatarUrl;
        });
        
        // Update in Supabase
        const result = await authService.updateProfile({
            avatar: avatarUrl
        });

        if (result.success) {
            closeAvatarSelector();
            window.showNotification('Avatar updated successfully!', 'success');
            
            // Force auth service UI update
            if (authService.updateUIForLoggedInUser) {
                setTimeout(() => {
                    authService.updateUIForLoggedInUser();
                }, 100);
            }
        } else {
            // Revert on error
            const oldAvatar = authService.getUserProfile()?.avatar || 'img/avatars/avatar1.png';
            if (profileManager) {
                profileManager.updateAvatarImages(oldAvatar);
            }
            throw new Error(result.error || 'Failed to update avatar');
        }
    } catch (error) {
        console.error('Avatar update error:', error);
        window.showNotification('Failed to update avatar: ' + error.message, 'error');
        
        // Revert avatar on error
        const oldAvatar = authService.getUserProfile()?.avatar || 'img/avatars/avatar1.png';
        document.querySelectorAll('#profile-avatar, .profile-avatar, #profile-menu-avatar, .profile-menu-avatar').forEach(img => {
            img.src = oldAvatar;
        });
    }
};

window.openUploadPhoto = function() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.add('show');
    }
};

window.closeUploadPhoto = function() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
        modal.classList.remove('show');
    }
};

window.uploadFromGallery = function() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.click();
    }
};

window.uploadFromGoogleDrive = function() {
    window.showNotification('Google Drive integration coming soon!', 'info');
};

window.handleFileUpload = async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.authService || !authService.isLoggedIn()) {
        window.showNotification('Please login first!', 'error');
        return;
    }

    try {
        const result = await authService.uploadProfilePicture(file);
        
        if (result.success && result.url) {
            // Immediately update all avatar images
            if (profileManager) {
                profileManager.updateAvatarImages(result.url);
            }
            
            document.querySelectorAll('#profile-avatar, .profile-avatar, #profile-menu-avatar, .profile-menu-avatar').forEach(img => {
                img.src = result.url;
            });
            
            closeUploadPhoto();
            event.target.value = '';
            
            // Force auth service UI update
            if (authService.updateUIForLoggedInUser) {
                setTimeout(() => {
                    authService.updateUIForLoggedInUser();
                }, 100);
            }
        }
    } catch (error) {
        console.error('Upload error:', error);
        window.showNotification('Failed to upload photo', 'error');
    }
};

window.changeLanguage = async function(language) {
    if (!window.authService || !authService.isLoggedIn()) {
        window.showNotification('Please login first!', 'error');
        return;
    }

    try {
        const userProfile = authService.getUserProfile();
        const result = await authService.updateProfile({
            preferences: {
                ...(userProfile?.preferences || {}),
                language: language
            }
        });

        if (result.success) {
            window.showNotification(`Language changed to ${language}`, 'success');
        }
    } catch (error) {
        console.error('Language change error:', error);
        window.showNotification('Failed to change language', 'error');
    }
};

window.openWatchHistory = function() {
    if (!window.authService || !authService.isLoggedIn()) {
        window.showNotification('Please login to view watch history!', 'error');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=watch-history.html';
        }, 1500);
        return;
    }
    window.location.href = 'watch-history.html';
};

window.openSettings = function() {
    if (!window.authService || !authService.isLoggedIn()) {
        window.showNotification('Please login to access settings!', 'error');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=settings.html';
        }, 1500);
        return;
    }
    window.location.href = 'settings.html';
};

window.downloadApp = function() {
    const modal = document.getElementById('app-download-modal');
    if (modal) {
        modal.classList.add('show');
    }
};

window.closeAppDownload = function() {
    const modal = document.getElementById('app-download-modal');
    if (modal) {
        modal.classList.remove('show');
    }
};

// FIXED LOGOUT FUNCTION - COMPLETELY REWRITTEN
window.handleLogout = function() {
    console.log('=== LOGOUT INITIATED ===');
    
    // Get modal elements
    const modal = document.getElementById('custom-confirm-modal');
    const messageEl = document.getElementById('custom-confirm-message');
    const okBtn = document.getElementById('custom-confirm-ok');
    const cancelBtn = document.getElementById('custom-confirm-cancel');
    
    if (!modal) {
        console.error('Confirmation modal not found, performing direct logout');
        performDirectLogout();
        return;
    }
    
    // Set message
    if (messageEl) {
        messageEl.textContent = 'Are you sure you want to log out?';
    }
    
    // Show modal
    modal.classList.add('show');
    
    // Remove any existing event listeners by cloning
    const newOkBtn = okBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Add new event listeners
    newOkBtn.onclick = function() {
        console.log('User confirmed logout');
        modal.classList.remove('show');
        performDirectLogout();
    };
    
    newCancelBtn.onclick = function() {
        console.log('User cancelled logout');
        modal.classList.remove('show');
    };
};

// Direct logout function
function performDirectLogout() {
    console.log('Performing logout...');
    
    // Show loading notification
    const loadingNotif = window.showLoadingNotification('Logging out...');
    
    // Attempt Supabase signout
    if (window.authService && typeof window.authService.signOut === 'function') {
        window.authService.signOut().then(() => {
            console.log('Supabase signOut successful');
        }).catch(error => {
            console.error('Supabase signOut error:', error);
        });
    }
    
    // Clear all storage immediately
    setTimeout(() => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            
            // Remove specific items
            localStorage.removeItem('roy-entertainment-auth');
            localStorage.removeItem('currentUser');
            sessionStorage.removeItem('roy-entertainment-auth');
            sessionStorage.removeItem('currentUser');
            
            console.log('Storage cleared');
        } catch (e) {
            console.error('Storage clear error:', e);
        }
        
        // Hide loading and show success
        if (loadingNotif && loadingNotif.remove) {
            loadingNotif.remove();
        }
        
        window.showNotification('Logged out successfully', 'success');
        
        // Redirect to homepage
        setTimeout(() => {
            window.location.href = 'index.html';
            window.location.reload(true);
        }, 500);
    }, 100);
}

// Make it globally available as fallback
window.performDirectLogout = performDirectLogout;

// NOTIFICATION SYSTEM
window.showNotification = function(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification:not(.notification-loading)');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    let icon = 'fa-check-circle';
    let gradient = 'linear-gradient(135deg, #3ECF8E, #21c074)';

    switch (type) {
        case 'error':
            icon = 'fa-exclamation-circle';
            gradient = 'linear-gradient(135deg, #f44336, #d32f2f)';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            gradient = 'linear-gradient(135deg, #ff9800, #f57c00)';
            break;
        case 'info':
            icon = 'fa-info-circle';
            gradient = 'linear-gradient(135deg, #2196F3, #1976D2)';
            break;
    }

    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: ${gradient};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        font-family: 'Montserrat', sans-serif;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// Loading notification that persists
window.showLoadingNotification = function(message) {
    const existingLoadingNotifications = document.querySelectorAll('.notification-loading');
    existingLoadingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-loading`;

    notification.innerHTML = `
        <div class="spinner-small"></div>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: linear-gradient(135deg, #FF6F00, #FFAB40);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        font-family: 'Montserrat', sans-serif;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
    `;

    document.body.appendChild(notification);

    return {
        remove: () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    };
};

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }

    .notification { font-family: 'Montserrat', sans-serif !important; }
    .notification i { font-size: 20px; }
    
    .spinner-small {
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    @media(max-width: 768px) {
        .notification {
            right: 15px !important;
            left: 15px !important;
            max-width: calc(100% - 30px) !important;
            font-size: 14px;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Alternative confirmation function
window.showConfirmation = function(message, onConfirmCallback) {
    const modal = document.getElementById('custom-confirm-modal');
    const messageEl = document.getElementById('custom-confirm-message');
    const okBtn = document.getElementById('custom-confirm-ok');
    const cancelBtn = document.getElementById('custom-confirm-cancel');

    if (!modal || !messageEl || !okBtn || !cancelBtn) {
        if (confirm(message)) {
            onConfirmCallback();
        }
        return;
    }

    messageEl.textContent = message;

    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newOkBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        onConfirmCallback();
    });

    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    modal.classList.add('show');
}

window.profileManager = profileManager;

console.log('%c💾 Profile Manager Ready with Fixed Logout', 'color: #3ECF8E; font-size: 12px');