// Authentication module for YT Learner

class Auth {
    // Handle Google OAuth callback
    static async handleGoogleLogin(response) {
        try {
            const idToken = response.credential;
            
            // Send token to backend for verification and JWT generation
            const authResponse = await API.post(CONFIG.API_ENDPOINTS.AUTH_LOGIN, {
                idToken: idToken
            });

            if (authResponse && authResponse.token) {
                // Store JWT token
                localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, authResponse.token);
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authResponse));
                
                // Decode JWT to get user info (without verification, since backend already did it)
                const userData = this.parseJwt(authResponse.token);
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
                
                // Redirect to dashboard
                this.showDashboard();
                await app.loadDashboard();
            }
        } catch (error) {
            console.error('Google login failed:', error);
            alert('Login failed. Please try again.');
        }
    }

    // Manual login (guest or username-based)
    static async handleManualLogin(username) {
        try {
            if (!username || username.trim() === '') {
                alert('Please enter a username');
                return;
            }

            // For manual login, create a simple JWT with the username
            // In production, you'd validate against backend
            const userData = {
                email: `${username}@ytlearner.local`,
                displayName: username,
                sub: username
            };

            // Create a simple JWT token
            const token = this.createSimpleJWT(userData);
            
            localStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userData));
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
                token: token,
                email: userData.email,
                displayName: userData.displayName
            }));

            this.showDashboard();
            await app.loadDashboard();
        } catch (error) {
            console.error('Manual login failed:', error);
            alert('Login failed. Please try again.');
        }
    }

    // Check if user is logged in
    static isLoggedIn() {
        return !!localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    }

    // Get current user data
    static getCurrentUser() {
        const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Logout
    static logout() {
        API.clearAuth();
        this.showLoginPage();
    }

    // Show dashboard
    static showDashboard() {
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('dashboardPage').classList.add('active');
    }

    // Show login page
    static showLoginPage() {
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('dashboardPage').classList.remove('active');
    }

    // Parse JWT token (without verification - done by backend)
    static parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Failed to parse JWT:', e);
            return null;
        }
    }

    // Create a simple JWT for manual login (for demo purposes)
    // In production, you should validate against backend
    static createSimpleJWT(userData) {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const now = Math.floor(Date.now() / 1000);
        const payload = btoa(JSON.stringify({
            ...userData,
            iat: now,
            exp: now + (24 * 60 * 60) // 24 hours
        }));
        // Note: This is NOT cryptographically signed (no signature)
        // The backend should validate the user
        return `${header}.${payload}.demo`;
    }
}

// Global handler for Google OAuth callback
function handleCredentialResponse(response) {
    Auth.handleGoogleLogin(response);
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (Auth.isLoggedIn()) {
        Auth.showDashboard();
    } else {
        Auth.showLoginPage();
    }

    // Manual login button
    const manualLoginBtn = document.getElementById('manualLoginBtn');
    const manualUsername = document.getElementById('manualUsername');
    
    if (manualLoginBtn) {
        manualLoginBtn.addEventListener('click', () => {
            Auth.handleManualLogin(manualUsername.value);
        });

        // Allow Enter key
        manualUsername.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                Auth.handleManualLogin(manualUsername.value);
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                Auth.logout();
            }
        });
    }

    // Update user info in header
    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.displayName || 'User';
        document.getElementById('userEmail').textContent = currentUser.email || '';
        
        // Set avatar if available
        if (currentUser.picture) {
            document.getElementById('userAvatar').src = currentUser.picture;
        }
    }
});
