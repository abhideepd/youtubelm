// Main application logic for YT Learner

class YTLearnerApp {
    constructor() {
        this.trackedVideos = [];
        this.filteredVideos = [];
        this.quizResults = [];
        this.currentVideoId = null;
        this.init();
    }

    async init() {
        // Initialize event listeners
        this.setupEventListeners();
        
        // Load dashboard if logged in
        if (Auth.isLoggedIn()) {
            await this.loadDashboard();
        }
    }

    setupEventListeners() {
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tab));
        });

        // Search and sort
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterVideos());
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.sortVideos());
        }

        // Modal close button
        const closeBtn = document.querySelector('.close-btn');
        const modal = document.getElementById('videoModal');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // Close modal when clicking outside
        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    switchTab(tabName) {
        // Update active button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update active panel
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');

        // Update stats if switching to stats tab
        if (tabName === 'stats') {
            this.updateStatistics();
        }
    }

    async loadDashboard() {
        try {
            // Show loading state
            document.getElementById('loadingState').style.display = 'flex';
            document.getElementById('videosGrid').innerHTML = '';

            const currentUser = Auth.getCurrentUser();
            if (!currentUser) {
                this.showEmptyState();
                return;
            }

            // Get tracked videos from the backend
            // First, we need to add an endpoint to get tracked videos
            // For now, we'll use a workaround with quiz results to infer tracked videos
            await this.fetchTrackedVideos(currentUser);
            
            // Render videos
            this.renderVideos();
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showEmptyState();
        } finally {
            document.getElementById('loadingState').style.display = 'none';
        }
    }

    async fetchTrackedVideos(currentUser) {
        try {
            // Try to get quiz results which contain video info
            const username = currentUser.displayName || currentUser.email || 'guest';
            
            const quizResults = await API.get(`${CONFIG.API_ENDPOINTS.QUIZ_RESULTS}/${username}`);
            
            if (quizResults && Array.isArray(quizResults)) {
                this.quizResults = quizResults;
                
                // Extract unique videos from quiz results
                const videoMap = new Map();
                quizResults.forEach(result => {
                    if (result.videoId && !videoMap.has(result.videoId)) {
                        videoMap.set(result.videoId, {
                            videoId: result.videoId,
                            title: result.videoTitle || result.videoId,
                            channel: 'Unknown Channel',
                            duration: 'Unknown',
                            trackedAt: new Date()
                        });
                    }
                });
                
                this.trackedVideos = Array.from(videoMap.values());
                this.filteredVideos = [...this.trackedVideos];
            } else {
                this.trackedVideos = [];
                this.filteredVideos = [];
            }

            // Try to get tracked videos endpoint (needs to be added to backend)
            // For now, we'll make a fallback request
            try {
                const trackedResponse = await API.get(`${CONFIG.API_ENDPOINTS.TRACKED_VIDEOS}/${username}`);
                if (trackedResponse && trackedResponse.videos) {
                    this.trackedVideos = trackedResponse.videos;
                    this.filteredVideos = [...this.trackedVideos];
                }
            } catch (e) {
                // Endpoint may not exist yet, continue with quiz results data
            }

        } catch (error) {
            console.error('Failed to fetch tracked videos:', error);
            this.trackedVideos = [];
            this.filteredVideos = [];
        }
    }

    renderVideos() {
        const grid = document.getElementById('videosGrid');
        grid.innerHTML = '';

        if (this.filteredVideos.length === 0) {
            this.showEmptyState();
            return;
        }

        this.filteredVideos.forEach(video => {
            const card = this.createVideoCard(video);
            grid.appendChild(card);
        });
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        
        const thumbnail = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
        
        card.innerHTML = `
            <div class="video-card-image">
                <img src="${thumbnail}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/320x180?text=Video'">
                <div class="video-card-overlay">
                    <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" class="btn btn-small btn-primary">
                        Watch on YouTube
                    </a>
                </div>
            </div>
            <div class="video-card-content">
                <h3 class="video-card-title">${this.escapeHtml(video.title)}</h3>
                <p class="video-card-channel">${this.escapeHtml(video.channel || 'Unknown Channel')}</p>
                <div class="video-card-meta">
                    <span class="meta-badge">📺 ${video.duration || 'Unknown'}</span>
                </div>
                <div class="video-card-actions">
                    <button class="btn btn-small btn-secondary" onclick="app.openVideoModal('${video.videoId}', '${this.escapeHtml(video.title)}', '${this.escapeHtml(video.channel || 'Unknown')}')">
                        Details
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    openVideoModal(videoId, title, channel) {
        this.currentVideoId = videoId;
        
        document.getElementById('modalVideoTitle').textContent = title;
        document.getElementById('modalVideoChannel').textContent = channel;
        document.getElementById('modalVideoThumb').src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        // Setup action buttons
        document.getElementById('viewOnYoutubeBtn').onclick = () => {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        };
        
        document.getElementById('removeVideoBtn').onclick = () => {
            if (confirm('Remove this video from your tracked list?')) {
                this.removeTrackedVideo(videoId);
                document.getElementById('videoModal').style.display = 'none';
            }
        };

        document.getElementById('videoModal').style.display = 'block';
    }

    removeTrackedVideo(videoId) {
        // Remove from local list
        this.trackedVideos = this.trackedVideos.filter(v => v.videoId !== videoId);
        this.filteredVideos = this.filteredVideos.filter(v => v.videoId !== videoId);
        
        // Optional: notify backend (if you add this endpoint)
        // this.notifyBackendVideoRemoved(videoId);
        
        // Re-render
        this.renderVideos();
        
        // Show notification
        this.showNotification('Video removed from tracked list');
    }

    filterVideos() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        this.filteredVideos = this.trackedVideos.filter(video => {
            const title = (video.title || '').toLowerCase();
            const channel = (video.channel || '').toLowerCase();
            
            return title.includes(searchTerm) || channel.includes(searchTerm);
        });
        
        this.renderVideos();
    }

    sortVideos() {
        const sortValue = document.getElementById('sortSelect').value;
        
        switch (sortValue) {
            case 'recent':
                this.filteredVideos.sort((a, b) => {
                    const dateA = new Date(a.trackedAt || 0);
                    const dateB = new Date(b.trackedAt || 0);
                    return dateB - dateA;
                });
                break;
            case 'oldest':
                this.filteredVideos.sort((a, b) => {
                    const dateA = new Date(a.trackedAt || 0);
                    const dateB = new Date(b.trackedAt || 0);
                    return dateA - dateB;
                });
                break;
            case 'title':
                this.filteredVideos.sort((a, b) => {
                    return (a.title || '').localeCompare(b.title || '');
                });
                break;
        }
        
        this.renderVideos();
    }

    updateStatistics() {
        const currentUser = Auth.getCurrentUser();
        const username = currentUser.displayName || currentUser.email || 'guest';

        // Update stats
        document.getElementById('statVideos').textContent = this.trackedVideos.length;
        document.getElementById('statQuizzes').textContent = this.quizResults.length;

        // Calculate average score
        if (this.quizResults.length > 0) {
            const avgScore = Math.round(
                this.quizResults.reduce((sum, result) => {
                    const score = result.score && result.total 
                        ? (result.score / result.total) * 100 
                        : 0;
                    return sum + score;
                }, 0) / this.quizResults.length
            );
            document.getElementById('statAvgScore').textContent = avgScore + '%';
        }

        // Summaries would need to be tracked separately
        document.getElementById('statSummaries').textContent = '0';
    }

    showEmptyState() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('videosGrid').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }

    showNotification(message) {
        // Simple notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new YTLearnerApp();
});
