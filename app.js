/**
 * SocialGL - Main Application
 */

class SocialGLApp {
    constructor() {
        this.posts = [];
        this.renderers = new Map();
        this.currentScene = 'cube';
        this.previewRenderer = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupCreateForm();
        this.loadSamplePosts();
        this.renderFeed();
    }

    // Navigation between views
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const views = document.querySelectorAll('.view');

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const viewName = btn.dataset.view;

                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                views.forEach(v => v.classList.remove('active'));
                const targetView = document.getElementById(`${viewName}View`);
                if (targetView) {
                    targetView.classList.add('active');

                    // Initialize preview when switching to create view
                    if (viewName === 'create') {
                        this.initPreview();
                    }
                }
            });
        });
    }

    // Setup create post form
    setupCreateForm() {
        const form = document.getElementById('createForm');
        const sceneButtons = document.querySelectorAll('.scene-btn');

        // Scene selection
        sceneButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sceneButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentScene = btn.dataset.scene;

                if (this.previewRenderer) {
                    this.previewRenderer.initScene(this.currentScene);
                }
            });
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPost();
        });
    }

    // Initialize preview canvas
    initPreview() {
        const canvas = document.getElementById('previewCanvas');
        if (!this.previewRenderer) {
            this.previewRenderer = new WebGLRenderer(canvas);
        }
        this.previewRenderer.initScene(this.currentScene);
    }

    // Create a new post
    createPost() {
        const caption = document.getElementById('postCaption').value.trim();

        const post = {
            id: Date.now(),
            author: this.getRandomName(),
            caption: caption || 'Check out this cool WebGL scene!',
            scene: this.currentScene,
            timestamp: Date.now(),
            likes: 0,
            liked: false
        };

        this.posts.unshift(post);
        this.renderFeed();

        // Switch to feed view
        document.querySelector('[data-view="feed"]').click();

        // Reset form
        document.getElementById('postCaption').value = '';

        // Show success feedback
        this.showNotification('Post created successfully!');
    }

    // Render the feed
    renderFeed() {
        const feedContainer = document.getElementById('feed');
        feedContainer.innerHTML = '';

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            feedContainer.appendChild(postElement);
        });

        // Initialize renderers for visible posts
        requestAnimationFrame(() => this.initPostRenderers());
    }

    // Create post DOM element
    createPostElement(post) {
        const article = document.createElement('article');
        article.className = 'post';
        article.dataset.postId = post.id;

        const timeAgo = this.getTimeAgo(post.timestamp);

        article.innerHTML = `
            <div class="post-header">
                <div class="post-avatar">${post.author[0].toUpperCase()}</div>
                <div class="post-info">
                    <div class="post-author">${post.author}</div>
                    <div class="post-time">${timeAgo}</div>
                </div>
            </div>
            <div class="post-canvas-container">
                <canvas class="post-canvas" width="800" height="533" data-scene="${post.scene}"></canvas>
            </div>
            <div class="post-body">
                <p class="post-caption">${this.escapeHtml(post.caption)}</p>
                <div class="post-actions">
                    <button class="action-btn like-btn ${post.liked ? 'liked' : ''}" data-action="like">
                        <svg viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>${post.likes > 0 ? post.likes : ''}</span>
                    </button>
                    <button class="action-btn" data-action="share">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        Share
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const likeBtn = article.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => this.toggleLike(post.id));

        const shareBtn = article.querySelector('[data-action="share"]');
        shareBtn.addEventListener('click', () => this.sharePost(post));

        return article;
    }

    // Initialize WebGL renderers for posts
    initPostRenderers() {
        const canvases = document.querySelectorAll('.post-canvas');

        canvases.forEach(canvas => {
            const scene = canvas.dataset.scene;
            const postId = canvas.closest('.post').dataset.postId;
            const rendererId = `post-${postId}`;

            // Clean up existing renderer
            if (this.renderers.has(rendererId)) {
                this.renderers.get(rendererId).destroy();
            }

            // Create new renderer
            const renderer = new WebGLRenderer(canvas);
            renderer.initScene(scene);
            this.renderers.set(rendererId, renderer);
        });
    }

    // Toggle like on post
    toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            post.liked = !post.liked;
            post.likes += post.liked ? 1 : -1;

            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            const likeBtn = postElement.querySelector('.like-btn');
            const likeIcon = likeBtn.querySelector('svg');
            const likeCount = likeBtn.querySelector('span');

            likeBtn.classList.toggle('liked', post.liked);
            likeIcon.setAttribute('fill', post.liked ? 'currentColor' : 'none');
            likeCount.textContent = post.likes > 0 ? post.likes : '';
        }
    }

    // Share post
    sharePost(post) {
        const url = `${window.location.origin}${window.location.pathname}#post-${post.id}`;

        if (navigator.share) {
            navigator.share({
                title: 'SocialGL Post',
                text: post.caption,
                url: url
            }).catch(() => {
                this.copyToClipboard(url);
            });
        } else {
            this.copyToClipboard(url);
        }
    }

    // Copy to clipboard
    copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showNotification('Link copied to clipboard!');
    }

    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Load sample posts
    loadSamplePosts() {
        const samplePosts = [
            {
                id: 1,
                author: 'Alex Chen',
                caption: 'Playing around with rotating cubes! The rainbow colors look amazing 🎨',
                scene: 'cube',
                timestamp: Date.now() - 3600000,
                likes: 42,
                liked: false
            },
            {
                id: 2,
                author: 'Sarah Johnson',
                caption: 'Created this pulsing sphere with dynamic lighting. Love how it glows!',
                scene: 'sphere',
                timestamp: Date.now() - 7200000,
                likes: 87,
                liked: true
            },
            {
                id: 3,
                author: 'Mike Rodriguez',
                caption: 'Particle systems are so mesmerizing to watch 🌟',
                scene: 'particles',
                timestamp: Date.now() - 10800000,
                likes: 156,
                liked: false
            },
            {
                id: 4,
                author: 'Emma Davis',
                caption: 'Wave simulation using WebGL shaders. So smooth!',
                scene: 'wave',
                timestamp: Date.now() - 14400000,
                likes: 203,
                liked: true
            }
        ];

        this.posts = samplePosts;
    }

    // Helper: Get random name
    getRandomName() {
        const names = [
            'Alex Chen', 'Sarah Johnson', 'Mike Rodriguez', 'Emma Davis',
            'James Wilson', 'Lisa Anderson', 'Chris Taylor', 'Maya Patel',
            'David Kim', 'Sophie Martin', 'Ryan Cooper', 'Nina Sharma'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    // Helper: Get time ago string
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    // Helper: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Clean up all renderers
    destroy() {
        this.renderers.forEach(renderer => renderer.destroy());
        if (this.previewRenderer) {
            this.previewRenderer.destroy();
        }
    }
}

// Add slide animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.socialGLApp = new SocialGLApp();
    });
} else {
    window.socialGLApp = new SocialGLApp();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.socialGLApp) {
        window.socialGLApp.destroy();
    }
});
