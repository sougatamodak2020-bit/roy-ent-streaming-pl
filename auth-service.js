// ========================================
// SUPABASE AUTHENTICATION SERVICE
// Roy Entertainment - Production Ready
// ========================================

class AuthService {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.sessionCheckInterval = null;
        this.initializeAuth();
    }

    // Initialize authentication state listener
    async initializeAuth() {
        try {
            // Handle OAuth callback if present
            await this.handleOAuthCallback();
            
            // Get initial session - FIX: Use supabaseClient
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Session error:', error);
                return;
            }
            
            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                this.updateUIForLoggedInUser();
            } else {
                this.updateUIForLoggedOutUser();
            }

            // Listen for auth state changes - FIX: Use supabaseClient
            supabaseClient.auth.onAuthStateChange(async (event, session) => {
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
            
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    }

    // Handle OAuth callback
    async handleOAuthCallback() {
        // Check if we're returning from an OAuth flow
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        if (hashParams.get('access_token') || searchParams.get('code')) {
            try {
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Get session - FIX: Use supabaseClient
                const { data: { session }, error } = await supabaseClient.auth.getSession();
                
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
        // Check session every 30 seconds
        this.sessionCheckInterval = setInterval(async () => {
            // FIX: Use supabaseClient
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Session check error:', error);
                return;
            }
            
            // Update current user if session changed
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
        if (!this.currentUser) return;

        try {
            // FIX: Use supabaseClient
            let { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error && error.code === 'PGRST116') {
                // Profile doesn't exist, create it
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
        if (!this.currentUser) return;

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
            // FIX: Use supabaseClient
            const { data, error } = await supabaseClient
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
        try {
            // Check if email already exists - FIX: Use supabaseClient
            const { data: existingUser } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: 'dummy_check_password'
            });

            // FIX: Use supabaseClient
            const { data, error } = await supabaseClient.auth.signUp({
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

            // Check if email confirmation is required
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
        try {
            // FIX: Use supabaseClient
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Update last login in profile
            if (data.user) {
                // FIX: Use supabaseClient
                await supabaseClient
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
        try {
            // FIX: Use supabaseClient
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
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

            // The browser will redirect to Google
            return { success: true };
        } catch (error) {
            console.error('Google sign-in error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Sign in with GitHub
    async signInWithGitHub() {
        try {
            // FIX: Use supabaseClient
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: window.location.origin,
                    scopes: 'read:user user:email'
                }
            });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Sign in with Facebook
    async signInWithFacebook() {
        try {
            // FIX: Use supabaseClient
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: window.location.origin,
                    scopes: 'email public_profile'
                }
            });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            // FIX: Use supabaseClient
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Password reset email sent! Please check your inbox.'
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Update password
    async updatePassword(newPassword) {
        try {
            // FIX: Use supabaseClient
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            return {
                success: true,
                message: 'Password updated successfully!'
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    // Update profile
    async updateProfile(updates) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            // Update user metadata if name or avatar changed
            if (updates.name || updates.avatar) {
                // FIX: Use supabaseClient
                const { error: authError } = await supabaseClient.auth.updateUser({
                    data: {
                        name: updates.name || this.userProfile?.name,
                        full_name: updates.name || this.userProfile?.name,
                        avatar_url: updates.avatar || this.userProfile?.avatar
                    }
                });
                
                if (authError) throw authError;
            }

            // Update profile in database - FIX: Use supabaseClient
            const { data, error } = await supabaseClient
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;

            this.userProfile = data;
            this.updateUIForLoggedInUser();

            return { success: true };
        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Upload profile picture
    async uploadProfilePicture(file) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file');
            }

            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Image size must be less than 5MB');
            }

            // Show upload progress
            this.showNotification('Uploading photo...', 'info');

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUser.id}/${Date.now()}.${fileExt}`;
            
            // First, create the bucket if it doesn't exist - FIX: Use supabaseClient
            const { data: buckets } = await supabaseClient.storage.listBuckets();
            const profilesBucket = buckets?.find(b => b.name === 'profiles');
            
            if (!profilesBucket) {
                // FIX: Use supabaseClient
                await supabaseClient.storage.createBucket('profiles', {
                    public: true,
                    fileSizeLimit: 5242880 // 5MB
                });
            }

            // Upload to Supabase Storage - FIX: Use supabaseClient
            const { data, error } = await supabaseClient.storage
                .from('profiles')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get public URL - FIX: Use supabaseClient
            const { data: { publicUrl } } = supabaseClient.storage
                .from('profiles')
                .getPublicUrl(fileName);

            // Update profile with new avatar URL
            await this.updateProfile({ avatar: publicUrl });

            this.showNotification('Photo uploaded successfully!', 'success');

            return {
                success: true,
                url: publicUrl
            };
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Upload failed: ' + error.message, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Save watch history
    async saveWatchHistory(movieId, currentTime, duration) {
        if (!this.currentUser) return;

        try {
            const progress = (currentTime / duration) * 100;
            
            // FIX: Use supabaseClient
            const { error } = await supabaseClient
                .from('watch_history')
                .upsert({
                    user_id: this.currentUser.id,
                    movie_id: movieId,
                    current_time: currentTime,
                    duration: duration,
                    progress: progress,
                    timestamp: new Date().toISOString()
                }, {
                    onConflict: 'user_id,movie_id'
                });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error saving watch history:', error);
            return { success: false, error: error.message };
        }
    }

    // Get watch history
    async getWatchHistory() {
        if (!this.currentUser) return [];

        try {
            // FIX: Use supabaseClient
            const { data, error } = await supabaseClient
                .from('watch_history')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('timestamp', { ascending: false })
                .limit(20);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting watch history:', error);
            return [];
        }
    }

    // Add to favorites
    async addToFavorites(movieId) {
        if (!this.currentUser) {
            this.showNotification('Please login to add favorites', 'error');
            return;
        }

        try {
            // Get current favorites - FIX: Use supabaseClient
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('favorites')
                .eq('id', this.currentUser.id)
                .single();

            const currentFavorites = profile?.favorites || [];
            
            if (currentFavorites.includes(movieId)) {
                this.showNotification('Already in favorites', 'info');
                return;
            }

            // Add to favorites - FIX: Use supabaseClient
            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    favorites: [...currentFavorites, movieId]
                })
                .eq('id', this.currentUser.id);

            if (error) throw error;

            this.showNotification('Added to favorites!', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error adding to favorites:', error);
            this.showNotification('Failed to add to favorites', 'error');
            return { success: false, error: error.message };
        }
    }

    // Remove from favorites
    async removeFromFavorites(movieId) {
        if (!this.currentUser) return;

        try {
            // Get current favorites - FIX: Use supabaseClient
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('favorites')
                .eq('id', this.currentUser.id)
                .single();

            const currentFavorites = profile?.favorites || [];
            const newFavorites = currentFavorites.filter(id => id !== movieId);

            // Update favorites - FIX: Use supabaseClient
            const { error } = await supabaseClient
                .from('profiles')
                .update({
                    favorites: newFavorites
                })
                .eq('id', this.currentUser.id);

            if (error) throw error;

            this.showNotification('Removed from favorites', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error removing from favorites:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            // FIX: Use supabaseClient
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            // Clear session check interval
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

    // Update UI for logged in user
    updateUIForLoggedInUser() {
        if (!this.currentUser) return;

        const profile = this.userProfile || {};
        const metadata = this.currentUser.user_metadata || {};
        
        // Update all profile elements
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

        // Update language selector if exists
        const languageSelect = document.getElementById('language-select');
        if (languageSelect && profile.preferences?.language) {
            languageSelect.value = profile.preferences.language;
        }

        // Show/hide elements
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
    // FIX: Wait for supabaseClient, not the base supabase library
    if (typeof supabaseClient !== 'undefined') {
        authService = new AuthService();
        window.authService = authService;
        console.log('%c🔐 Supabase Auth Service Ready', 'color: #3ECF8E; font-weight: bold; font-size: 14px');
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
    // Use the new custom confirmation
    window.showConfirmation('Are you sure you want to log out?', async () => {
        // FIX: The function is named signOut(), not logout()
        await authService.signOut();
    });
}