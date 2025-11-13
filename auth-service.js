// ========================================
// SUPABASE AUTHENTICATION SERVICE - FIXED
// Roy Entertainment
// ========================================

class AuthService {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.sessionCheckInterval = null;
        this.initialized = false;
        
        // Don't initialize immediately, wait for Supabase
        this.waitForSupabase();
    }

    // Wait for Supabase to be ready
    async waitForSupabase() {
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase client not available after 10 seconds');
            return;
        }
        
        console.log('🔐 Auth service found Supabase client, initializing...');
        await this.initializeAuth();
    }

    // Initialize authentication state listener
    async initializeAuth() {
        try {
            // Check if supabaseClient and its auth property exist
            if (!window.supabaseClient || !window.supabaseClient.auth) {
                console.error('Supabase auth not available');
                return;
            }

            // Handle OAuth callback if present
            await this.handleOAuthCallback();
            
            // Get initial session
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Session error:', error);
                this.updateUIForLoggedOutUser();
                return;
            }
            
            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                this.updateUIForLoggedInUser();
                console.log('User already logged in:', this.currentUser.email);
            } else {
                this.updateUIForLoggedOutUser();
                console.log('No active session');
            }

            // Listen for auth state changes
            window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth event:', event);
                
                switch (event) {
                    case 'SIGNED_IN':
                        this.currentUser = session.user;
                        await this.loadUserProfile();
                        this.updateUIForLoggedInUser();
                        this.showNotification('Successfully logged in!', 'success');
                        break;
                        
                    case 'SIGNED_OUT':
                        this.currentUser = null;
                        this.userProfile = null;
                        this.updateUIForLoggedOutUser();
                        break;
                        
                    case 'TOKEN_REFRESHED':
                        console.log('Session token refreshed');
                        break;
                        
                    case 'USER_UPDATED':
                        this.currentUser = session.user;
                        await this.loadUserProfile();
                        this.updateUIForLoggedInUser();
                        break;
                }
            });

            // Setup session refresh check
            this.setupSessionCheck();
            this.initialized = true;
            console.log('🔐 Supabase Auth Service Ready');
            
        } catch (error) {
            console.error('Auth initialization error:', error);
            this.updateUIForLoggedOutUser();
        }
    }

    // Handle OAuth callback
    async handleOAuthCallback() {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        if (hashParams.get('access_token') || searchParams.get('code')) {
            try {
                window.history.replaceState({}, document.title, window.location.pathname);
                
                const { data: { session }, error } = await window.supabaseClient.auth.getSession();
                
                if (error) throw error;
                
                if (session) {
                    console.log('OAuth login successful');
                    return true;
                }
            } catch (error) {
                console.error('OAuth callback error:', error);
                this.showNotification('Login failed: ' + error.message, 'error');
                return false;
            }
        }
        return false;
    }

    // Setup periodic session check
    setupSessionCheck() {
        this.sessionCheckInterval = setInterval(async () => {
            if (!window.supabaseClient) return;
            
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Session check error:', error);
                return;
            }
            
            if (session?.user?.id !== this.currentUser?.id) {
                if (session) {
                    this.currentUser = session.user;
                    await this.loadUserProfile();
                    this.updateUIForLoggedInUser();
                } else {
                    this.currentUser = null;
                    this.userProfile = null;
                    this.updateUIForLoggedOutUser();
                }
            }
        }, 30000);
    }

    // Load user profile from database
    async loadUserProfile() {
        if (!this.currentUser || !window.supabaseClient) return;

        try {
            let { data, error } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error && error.code === 'PGRST116') {
                await this.createUserProfile();
                return;
            }
            
            if (error) throw error;
            
            if (data) {
                this.userProfile = data;
                console.log('Profile loaded:', this.userProfile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    // Create user profile
    async createUserProfile() {
        if (!this.currentUser || !window.supabaseClient) return;

        const metadata = this.currentUser.user_metadata || {};
        
        const profile = {
            id: this.currentUser.id,
            email: this.currentUser.email,
            name: metadata.full_name || metadata.name || this.currentUser.email?.split('@')[0] || 'User',
            avatar: metadata.avatar_url || metadata.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.name || 'User')}&background=FF6F00&color=fff&size=200`,
            provider: this.currentUser.app_metadata?.provider || 'email',
            created_at: new Date().toISOString()
        };

        try {
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .insert([profile])
                .select()
                .single();

            if (error) throw error;
            
            this.userProfile = data;
            console.log('Profile created:', this.userProfile);
        } catch (error) {
            console.error('Error creating profile:', error);
        }
    }

    // Sign up with email
    async signUpWithEmail(email, password, name) {
        if (!window.supabaseClient) return { success: false, error: 'Service not ready' };

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        name: name,
                        full_name: name,
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6F00&color=fff&size=200`
                    }
                }
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    throw new Error('This email is already registered. Please sign in instead.');
                }
                throw error;
            }

            if (data?.user?.identities?.length === 0) {
                return {
                    success: true,
                    message: 'Account already exists. Please sign in instead.',
                    requiresEmailConfirmation: false
                };
            }

            return {
                success: true,
                message: 'Account created successfully! Please check your email for verification link.',
                user: data.user,
                requiresEmailConfirmation: true
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Sign in with email
    async signInWithEmail(email, password) {
        if (!window.supabaseClient) return { success: false, error: 'Service not ready' };

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            if (data.user) {
                await window.supabaseClient
                    .from('profiles')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', data.user.id);
            }

            return {
                success: true,
                user: data.user,
                session: data.session
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        if (!window.supabaseClient) return { success: false, error: 'Service not ready' };

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Sign out
    async signOut() {
        if (!window.supabaseClient) return { success: false, error: 'Service not ready' };

        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;

            if (this.sessionCheckInterval) {
                clearInterval(this.sessionCheckInterval);
            }

            this.currentUser = null;
            this.userProfile = null;
            this.updateUIForLoggedOutUser();
            
            this.showNotification('Logged out successfully', 'success');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get watch history
    async getWatchHistory() {
        if (!this.currentUser || !window.supabaseClient) return [];

        try {
            const { data, error } = await window.supabaseClient
                .from('watch_history')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('watched_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting watch history:', error);
            return [];
        }
    }

    // Update UI for logged in user
    updateUIForLoggedInUser() {
        if (!this.currentUser) return;

        const profile = this.userProfile || {};
        const metadata = this.currentUser.user_metadata || {};
        
        const elements = {
            'profile-avatar': profile.avatar || metadata.avatar_url || metadata.picture || 'img/avatars/avatar1.png',
            'profile-menu-avatar': profile.avatar || metadata.avatar_url || metadata.picture || 'img/avatars/avatar1.png',
            'profile-name': profile.name || metadata.full_name || metadata.name || 'User',
            'profile-menu-name': profile.name || metadata.full_name || metadata.name || 'User',
            'profile-menu-email': this.currentUser.email
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'IMG') {
                    element.src = value;
                    element.onerror = function() {
                        this.src = 'img/avatars/avatar1.png';
                    };
                } else {
                    element.textContent = value;
                }
            }
        });

        document.querySelectorAll('#login-btn').forEach(btn => {
            if (btn) btn.style.display = 'none';
        });

        document.querySelectorAll('#profile-dropdown').forEach(dropdown => {
            if (dropdown) dropdown.style.display = 'block';
        });
    }

    // Update UI for logged out user
    updateUIForLoggedOutUser() {
        document.querySelectorAll('#login-btn').forEach(btn => {
            if (btn) btn.style.display = 'flex';
        });

        document.querySelectorAll('#profile-dropdown').forEach(dropdown => {
            if (dropdown) dropdown.style.display = 'none';
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}]: ${message}`);
        }
    }

    // Get error message
    getErrorMessage(error) {
        if (typeof error === 'string') return error;
        
        const errorMessages = {
            'Invalid login credentials': 'Invalid email or password. Please try again.',
            'Email not confirmed': 'Please verify your email address first. Check your inbox.',
            'User already registered': 'This email is already registered. Please sign in instead.',
            'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
            'User not found': 'No account found with this email address.',
            'Invalid email': 'Please enter a valid email address.',
            'Signup requires a valid password': 'Please enter a valid password.',
            'Auth session missing': 'Your session has expired. Please login again.'
        };

        return errorMessages[error.message] || error.message || 'An unexpected error occurred. Please try again.';
    }

    // Check if logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get user profile
    getUserProfile() {
        return this.userProfile;
    }
}

// Initialize auth service
let authService = null;

// Wait for Supabase CLIENT to be ready
const initializeAuthService = () => {
    if (typeof window !== 'undefined' && window.supabaseClient) {
        authService = new AuthService();
        window.authService = authService;
    } else {
        setTimeout(initializeAuthService, 100);
    }
};

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthService);
} else {
    initializeAuthService();
}

// Global functions for HTML handlers
window.handleLogout = async function() {
    window.showConfirmation('Are you sure you want to log out?', async () => {
        if (window.authService) {
            await window.authService.signOut();
        }
    });
}