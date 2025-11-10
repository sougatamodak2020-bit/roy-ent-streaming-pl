/* ========================================
   THEME MANAGER - Light/Dark Mode
   Roy Entertainment
======================================== */

class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getPreferredTheme();
        this.themeToggle = null;
        this.init();
    }

    /**
     * Get theme from localStorage
     */
    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    /**
     * Get user's system preference
     */
    getPreferredTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
        return 'dark';
    }

    /**
     * Initialize theme manager
     */
    init() {
        this.applyTheme(this.theme);
        this.setupToggle();
        this.watchSystemPreference();
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        localStorage.setItem('theme', theme);
        
        // Update checkbox state
        const checkbox = document.getElementById('theme-checkbox');
        if (checkbox) {
            checkbox.checked = theme === 'light';
        }

        // Dispatch custom event for other scripts
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // Add transition effect
        this.addTransitionClass();
    }

    /**
     * Setup toggle event listener
     */
    setupToggle() {
        const checkbox = document.getElementById('theme-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                this.toggleTheme();
            });
        }
    }

    /**
     * Watch for system preference changes
     */
    watchSystemPreference() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            
            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', (e) => {
                    if (!this.getStoredTheme()) {
                        const newTheme = e.matches ? 'light' : 'dark';
                        this.applyTheme(newTheme);
                    }
                });
            } 
            // Legacy browsers
            else if (mediaQuery.addListener) {
                mediaQuery.addListener((e) => {
                    if (!this.getStoredTheme()) {
                        const newTheme = e.matches ? 'light' : 'dark';
                        this.applyTheme(newTheme);
                    }
                });
            }
        }
    }

    /**
     * Add smooth transition when switching themes
     */
    addTransitionClass() {
        document.documentElement.classList.add('theme-transitioning');
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 300);
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.theme;
    }

    /**
     * Set specific theme
     */
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }

    /**
     * Reset to system preference
     */
    resetToSystemPreference() {
        localStorage.removeItem('theme');
        const systemTheme = this.getPreferredTheme();
        this.applyTheme(systemTheme);
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Add smooth color transitions during theme change
const style = document.createElement('style');
style.textContent = `
    .theme-transitioning,
    .theme-transitioning *,
    .theme-transitioning *:before,
    .theme-transitioning *:after {
        transition: background-color 0.3s ease, 
                    color 0.3s ease, 
                    border-color 0.3s ease !important;
        transition-delay: 0s !important;
    }
`;
document.head.appendChild(style);

// Expose globally for debugging and external access
window.themeManager = themeManager;

// Log current theme (can be removed in production)
console.log(`%c🎨 Theme Manager Initialized`, 'color: #FF6F00; font-weight: bold; font-size: 14px;');
console.log(`%cCurrent Theme: ${themeManager.getCurrentTheme()}`, 'color: #4CAF50; font-size: 12px;');