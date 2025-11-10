// ========================================
// SUPABASE LOGIN SYSTEM
// Roy Entertainment - Production Ready
// ========================================

// Utility Functions
const showError = (elementId, message) => {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        }, 5000);
    }
};

const showSuccess = (elementId, message) => {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        setTimeout(() => {
            if (successEl) {
                successEl.style.display = 'none';
            }
        }, 3000);
    }
};

const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    return strength;
};

// Wait for auth service to be available
const waitForAuthService = () => {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.authService) {
                clearInterval(checkInterval);
                resolve(window.authService);
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve(null);
        }, 10000);
    });
};

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');

    // Wait for auth service to be ready
    const authService = await waitForAuthService();
    
    if (!authService) {
        console.error('Authentication service failed to load');
        showError('login-error', 'Authentication service is not available. Please refresh the page.');
        showError('signup-error', 'Authentication service is not available. Please refresh the page.');
        return;
    }

    // Check if user is already logged in (with delay for session to load)
    setTimeout(() => {
        if (authService && authService.isLoggedIn()) {
            const user = authService.getCurrentUser();
            if (user && window.location.pathname.includes('login.html')) {
                // Show a more friendly message
                const existingUser = user.email || 'current user';
                const notification = document.createElement('div');
                notification.className = 'notification notification-info';
                notification.innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    <span>You are already logged in as ${existingUser}</span>
                `;
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #2196F3, #1976D2);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    z-index: 10001;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 600;
                    animation: slideInRight 0.3s ease;
                    max-width: 350px;
                `;
                document.body.appendChild(notification);
                
                // Add click to redirect functionality
                notification.style.cursor = 'pointer';
                notification.addEventListener('click', () => {
                    window.location.href = 'index.html';
                });
                
                // Auto redirect after 3 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
        }
    }, 1500);

    // Form toggle animations
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.classList.remove('active');
            if (signupForm) signupForm.classList.add('active');
            
            // Clear all error and success messages
            document.querySelectorAll('.error-message').forEach(el => {
                if (el) el.style.display = 'none';
            });
            document.querySelectorAll('.success-message').forEach(el => {
                if (el) el.style.display = 'none';
            });
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupForm) signupForm.classList.remove('active');
            if (loginForm) loginForm.classList.add('active');
            
            // Clear all error and success messages
            document.querySelectorAll('.error-message').forEach(el => {
                if (el) el.style.display = 'none';
            });
            document.querySelectorAll('.success-message').forEach(el => {
                if (el) el.style.display = 'none';
            });
        });
    }

    // ========================================
    // PASSWORD VISIBILITY TOGGLE
    // ========================================
    
    const setupPasswordToggle = (toggleId, inputId) => {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        
        if (toggle && input) {
            // Remove any existing listeners
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);
            
            newToggle.addEventListener('click', () => {
                const currentInput = document.getElementById(inputId);
                if (currentInput) {
                    if (currentInput.type === 'password') {
                        currentInput.type = 'text';
                        newToggle.classList.remove('fa-eye');
                        newToggle.classList.add('fa-eye-slash');
                    } else {
                        currentInput.type = 'password';
                        newToggle.classList.remove('fa-eye-slash');
                        newToggle.classList.add('fa-eye');
                    }
                }
            });
        }
    };

    // Setup password toggles
    setupPasswordToggle('toggle-login-password', 'login-password');
    setupPasswordToggle('toggle-signup-password', 'signup-password');
    setupPasswordToggle('toggle-confirm-password', 'signup-confirm-password');

    // ========================================
    // GOOGLE SIGN IN
    // ========================================
    
    const handleGoogleSignIn = async (buttonElement, errorElementId) => {
        if (!authService) {
            showError(errorElementId, 'Authentication service not ready. Please refresh the page.');
            return;
        }

        const originalContent = buttonElement.innerHTML;
        
        try {
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fab fa-google"></i><span>Redirecting to Google...</span>';
            
            const result = await authService.signInWithGoogle();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to sign in with Google');
            }
            
            // OAuth will redirect automatically
            buttonElement.innerHTML = '<i class="fas fa-check"></i><span>Redirecting...</span>';
            
        } catch (error) {
            console.error('Google sign-in error:', error);
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalContent;
            showError(errorElementId, error.message || 'Failed to sign in with Google');
        }
    };

    // Setup Google sign-in buttons
    const googleButtons = document.querySelectorAll('#google-login, #google-signup');
    googleButtons.forEach(btn => {
        if (btn) {
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const errorId = newBtn.id.includes('login') ? 'login-error' : 'signup-error';
                handleGoogleSignIn(newBtn, errorId);
            });
        }
    });

    // ========================================
    // FACEBOOK SIGN IN
    // ========================================
    
    const handleFacebookSignIn = async (buttonElement, errorElementId) => {
        if (!authService) {
            showError(errorElementId, 'Authentication service not ready. Please refresh the page.');
            return;
        }

        const originalContent = buttonElement.innerHTML;
        
        try {
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fab fa-facebook-f"></i><span>Redirecting to Facebook...</span>';
            
            const result = await authService.signInWithFacebook();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to sign in with Facebook');
            }
            
            buttonElement.innerHTML = '<i class="fas fa-check"></i><span>Redirecting...</span>';
            
        } catch (error) {
            console.error('Facebook sign-in error:', error);
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalContent;
            showError(errorElementId, error.message || 'Failed to sign in with Facebook');
        }
    };

    // Setup Facebook sign-in buttons
    const facebookButtons = document.querySelectorAll('#facebook-login, #facebook-signup');
    facebookButtons.forEach(btn => {
        if (btn) {
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const errorId = newBtn.id.includes('login') ? 'login-error' : 'signup-error';
                handleFacebookSignIn(newBtn, errorId);
            });
        }
    });

    // ========================================
    // GITHUB SIGN IN
    // ========================================
    
    const handleGitHubSignIn = async (buttonElement, errorElementId) => {
        if (!authService) {
            showError(errorElementId, 'Authentication service not ready. Please refresh the page.');
            return;
        }

        const originalContent = buttonElement.innerHTML;
        
        try {
            buttonElement.disabled = true;
            buttonElement.innerHTML = '<i class="fab fa-github"></i><span>Redirecting to GitHub...</span>';
            
            const result = await authService.signInWithGitHub();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to sign in with GitHub');
            }
            
            buttonElement.innerHTML = '<i class="fas fa-check"></i><span>Redirecting...</span>';
            
        } catch (error) {
            console.error('GitHub sign-in error:', error);
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalContent;
            showError(errorElementId, error.message || 'Failed to sign in with GitHub');
        }
    };

    // Setup GitHub sign-in buttons
    const githubButtons = document.querySelectorAll('#github-login, #github-signup');
    githubButtons.forEach(btn => {
        if (btn) {
            // Remove existing listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const errorId = newBtn.id.includes('login') ? 'login-error' : 'signup-error';
                handleGitHubSignIn(newBtn, errorId);
            });
        }
    });

    // ========================================
    // SIGNUP FORM SUBMISSION
    // ========================================
    
    const signupFormElement = document.getElementById('signupForm');
    if (signupFormElement) {
        // Remove existing listeners
        const newForm = signupFormElement.cloneNode(true);
        signupFormElement.parentNode.replaceChild(newForm, signupFormElement);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('signup-name')?.value.trim() || '';
            const email = document.getElementById('signup-email')?.value.trim() || '';
            const password = document.getElementById('signup-password')?.value || '';
            const confirmPassword = document.getElementById('signup-confirm-password')?.value || '';
            const submitBtn = e.target.querySelector('.submit-btn');

            // Clear previous errors
            const errorEl = document.getElementById('signup-error');
            if (errorEl) errorEl.style.display = 'none';

            // Validation
            if (name.length < 3) {
                showError('signup-error', 'Name must be at least 3 characters long');
                return;
            }

            if (!isValidEmail(email)) {
                showError('signup-error', 'Please enter a valid email address');
                return;
            }

            if (password.length < 6) {
                showError('signup-error', 'Password must be at least 6 characters long');
                return;
            }

            const passwordStrength = checkPasswordStrength(password);
            if (passwordStrength < 2) {
                showError('signup-error', 'Password is too weak. Use a mix of letters, numbers and special characters');
                return;
            }

            if (password !== confirmPassword) {
                showError('signup-error', 'Passwords do not match!');
                return;
            }

            // Disable button and show loading
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }

            try {
                // Check auth service again
                if (!authService) {
                    throw new Error('Authentication service not ready. Please refresh the page.');
                }

                const result = await authService.signUpWithEmail(email, password, name);

                if (result.success) {
                    showSuccess('signup-success', result.message || 'Account created successfully!');
                    if (submitBtn) submitBtn.textContent = 'Success!';
                    
                    // Clear form
                    newForm.reset();

                    // Handle redirect based on email confirmation requirement
                    if (!result.requiresEmailConfirmation) {
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                    } else {
                        if (submitBtn) {
                            submitBtn.textContent = 'Create Account';
                            submitBtn.disabled = false;
                        }
                        
                        // Show resend option after delay
                        setTimeout(() => {
                            showSuccess('signup-success', 'Check your email for verification link. Didn\'t receive it? Refresh the page and try logging in.');
                        }, 10000);
                    }
                } else {
                    throw new Error(result.error || 'Failed to create account');
                }
            } catch (error) {
                console.error('Signup error:', error);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Account';
                }
                showError('signup-error', error.message || 'Failed to create account. Please try again.');
            }
        });
    }

    // ========================================
    // LOGIN FORM SUBMISSION
    // ========================================
    
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) {
        // Remove existing listeners
        const newForm = loginFormElement.cloneNode(true);
        loginFormElement.parentNode.replaceChild(newForm, loginFormElement);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email')?.value.trim() || '';
            const password = document.getElementById('login-password')?.value || '';
            const rememberMe = document.getElementById('remember')?.checked || false;
            const submitBtn = e.target.querySelector('.submit-btn');

            // Clear previous errors
            const errorEl = document.getElementById('login-error');
            if (errorEl) errorEl.style.display = 'none';

            // Validation
            if (!isValidEmail(email)) {
                showError('login-error', 'Please enter a valid email address');
                return;
            }

            if (!password) {
                showError('login-error', 'Please enter your password');
                return;
            }

            // Disable button and show loading
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            }

            try {
                // Check auth service again
                if (!authService) {
                    throw new Error('Authentication service not ready. Please refresh the page.');
                }

                const result = await authService.signInWithEmail(email, password);

                if (result.success) {
                    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-check"></i> Success! Redirecting...';
                    
                    // Get redirect URL or default to homepage
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectUrl = urlParams.get('redirect') || 'index.html';
                    
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    throw new Error(result.error || 'Failed to sign in');
                }
            } catch (error) {
                console.error('Login error:', error);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Sign In';
                }
                showError('login-error', error.message || 'Failed to sign in. Please check your credentials.');
            }
        });
    }

    // ========================================
    // FORGOT PASSWORD
    // ========================================
    
    const forgotPasswordLinks = document.querySelectorAll('.forgot-password');
    forgotPasswordLinks.forEach(link => {
        if (link) {
            // Remove existing listeners
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            newLink.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Create a custom modal for email input
                const modalHTML = `
                    <div id="forgot-password-modal" class="modal show">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Reset Password</h3>
                                <button class="modal-close" onclick="document.getElementById('forgot-password-modal').remove()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div style="padding: 20px 0;">
                                <p style="color: var(--text-secondary); margin-bottom: 20px;">Enter your email address to receive a password reset link.</p>
                                <input type="email" id="reset-email" placeholder="Enter your email" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; font-size: 16px;">
                                <button id="send-reset" class="submit-btn" style="width: 100%; margin-top: 20px;">Send Reset Email</button>
                                <div id="reset-message" style="margin-top: 15px; display: none;"></div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                
                const sendButton = document.getElementById('send-reset');
                const emailInput = document.getElementById('reset-email');
                const messageDiv = document.getElementById('reset-message');
                
                // Pre-fill with login email if available
                const loginEmail = document.getElementById('login-email');
                if (loginEmail && loginEmail.value) {
                    emailInput.value = loginEmail.value;
                }
                
                sendButton.addEventListener('click', async () => {
                    const email = emailInput.value.trim();
                    
                    if (!isValidEmail(email)) {
                        messageDiv.style.display = 'block';
                        messageDiv.style.color = '#ff6b6b';
                        messageDiv.textContent = 'Please enter a valid email address';
                        return;
                    }
                    
                    sendButton.disabled = true;
                    sendButton.textContent = 'Sending...';
                    
                    try {
                        if (!authService) {
                            throw new Error('Authentication service not ready');
                        }

                        const result = await authService.resetPassword(email);
                        
                        if (result.success) {
                            messageDiv.style.display = 'block';
                            messageDiv.style.color = '#51cf66';
                            messageDiv.textContent = result.message || 'Password reset email sent! Please check your inbox.';
                            
                            setTimeout(() => {
                                document.getElementById('forgot-password-modal').remove();
                            }, 3000);
                        } else {
                            throw new Error(result.error || 'Failed to send reset email');
                        }
                    } catch (error) {
                        console.error('Password reset error:', error);
                        messageDiv.style.display = 'block';
                        messageDiv.style.color = '#ff6b6b';
                        messageDiv.textContent = error.message || 'Failed to send reset email. Please try again.';
                        sendButton.disabled = false;
                        sendButton.textContent = 'Send Reset Email';
                    }
                });
            });
        }
    });

    // ========================================
    // REAL-TIME PASSWORD STRENGTH INDICATOR
    // ========================================
    
    const passwordInput = document.getElementById('signup-password');
    if (passwordInput && passwordInput.parentElement) {
        // Check if indicator already exists
        let strengthIndicator = passwordInput.parentElement.querySelector('.password-strength');
        
        if (!strengthIndicator) {
            strengthIndicator = document.createElement('div');
            strengthIndicator.className = 'password-strength';
            strengthIndicator.style.cssText = `
                margin-top: 5px;
                height: 4px;
                border-radius: 2px;
                transition: all 0.3s ease;
                width: 0%;
            `;
            passwordInput.parentElement.appendChild(strengthIndicator);
        }

        // Add event listener for password strength
        passwordInput.addEventListener('input', (e) => {
            const strength = checkPasswordStrength(e.target.value);
            const strengthColors = ['#f44336', '#ff9800', '#ffc107', '#4caf50', '#2196f3'];
            const strengthWidths = ['20%', '40%', '60%', '80%', '100%'];
            
            if (strengthIndicator) {
                strengthIndicator.style.width = e.target.value ? (strengthWidths[strength] || '20%') : '0%';
                strengthIndicator.style.background = strengthColors[strength] || 'transparent';
            }
            
            // Update border color
            passwordInput.style.borderColor = e.target.value ? (strengthColors[strength] || '#ccc') : '';
        });
    }
});

// Add necessary styles for the forgot password modal
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification {
        font-family: 'Montserrat', sans-serif !important;
    }
    
    .notification-info {
        cursor: pointer;
    }
    
    .fa-spinner.fa-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(modalStyles);

// Log initialization
console.log('%c===================================', 'color: #3ECF8E');
console.log('%c🔒 Supabase Login System Ready', 'color: #3ECF8E; font-weight: bold; font-size: 14px');
console.log('%c===================================', 'color: #3ECF8E');
console.log('%c✅ Email Authentication: Enabled', 'color: #3ECF8E; font-size: 12px');
console.log('%c✅ Social Login: Enabled', 'color: #3ECF8E; font-size: 12px');
console.log('%c✅ Password Reset: Enabled', 'color: #3ECF8E; font-size: 12px');
console.log('%c===================================', 'color: #3ECF8E');

// Export utilities for external use if needed
window.loginUtils = {
    showError,
    showSuccess,
    isValidEmail,
    checkPasswordStrength,
    waitForAuthService
};