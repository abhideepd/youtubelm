// Configuration for YT Learner Frontend

// IMPORTANT: Replace with your Google OAuth Client ID
// Get it from: https://console.cloud.google.com/
const CONFIG = {
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE',
    API_BASE_URL: 'http://localhost:8080',
    API_ENDPOINTS: {
        AUTH_LOGIN: '/api/auth/login',
        AUTH_ME: '/api/auth/me',
        AUTH_LOGOUT: '/api/auth/logout',
        TRACKED_VIDEOS: '/api/trivia/tracked',
        QUIZ_RESULTS: '/api/quiz/results',
        QUIZ_SAVE: '/api/quiz/results',
    }
};

// LocalStorage keys
const STORAGE_KEYS = {
    JWT_TOKEN: 'ytlearner_jwt_token',
    USER_DATA: 'ytlearner_user_data',
    CURRENT_USER: 'ytlearner_current_user'
};

// API helper functions
class API {
    static async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add JWT token if available
        const token = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Token expired or invalid
                this.clearAuth();
                window.location.reload();
                return null;
            }

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            ...options
        });
    }

    static async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    static clearAuth() {
        localStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
}
