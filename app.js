// app.js - Aether-Score Verification Logic

class AetherVerifier {
    constructor() {
        // Google Sheets Configuration
        this.sheetId = '1wWK-cUcyP3nk-Flj8Fs-x6HZZQlcmY7ZghqeHFBinRc'; // YOUR SHEET ID
        this.apiUrl = `https://opensheet.elk.sh/${this.sheetId}/PROCESSED_Scores`;
        
        // Elements
        this.loadingEl = document.getElementById('loading');
        this.scoreDisplayEl = document.getElementById('scoreDisplay');
        this.errorDisplayEl = document.getElementById('errorDisplay');
        this.errorMessageEl = document.getElementById('errorMessage');
        
        // Initialize
        this.init();
    }
    
    async init() {
        console.log('Aether-Score Verifier Initializing...');
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hash = urlParams.get('hash');
        const user = urlParams.get('user');
        const demo = urlParams.get('demo');
        
        // Check if demo mode
        if (demo === 'true') {
            this.showDemoScore();
            return;
        }
        
        // Validate hash
        if (!hash || hash.length !== 16) {
            this.showError('Invalid verification link. Please check your email for the correct link.');
            return;
        }
        
        // Verify the score
        await this.verifyScore(hash, user);
    }
    
    async verifyScore(hash, expectedUser) {
        try {
            console.log(`Verifying hash: ${hash}`);
            
            // Show loading state
            this.showLoading();
            
            // Fetch data from Google Sheets
            const response = await axios.get(this.apiUrl, {
                timeout: 10000 // 10 second timeout
            });
            
            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Invalid response from server');
            }
            
            // Find the score by verification hash
            const scoreData = this.findScoreByHash(response.data, hash);
            
            if (!scoreData) {
                this.showError('Score not found. The verification link may have expired or is invalid.');
                return;
            }
            
            // Verify user matches if provided
            if (expectedUser && scoreData.githubUser.toLowerCase() !== expectedUser.toLowerCase()) {
                console.warn(`User mismatch: expected ${expectedUser}, got ${scoreData.githubUser}`);
            }
            
            // Display the verified score
            this.displayScore(scoreData);
            
            // Track verification success
            this.trackVerification('success', scoreData.githubUser, scoreData.score);
            
        } catch (error) {
            console.error('Verification error:', error);
            
            if (error.code === 'ECONNABORTED' || !navigator.onLine) {
                this.showError('Network error. Please check your internet connection and try again.');
            } else {
                this.showError('Could not verify your score. Please try again later.');
            }
            
            // Track verification failure
            this.trackVerification('error', expectedUser || 'unknown', null);
        }
    }
    
    findScoreByHash(data, hash) {
        // Google Sheets data structure (PROCESSED_Scores):
        // [Date, GitHub User, Email, Score, Tier, Hash, Behavioral, Skill, Social, Conduct]
        
        for (const row of data) {
            if (row[5] && row[5].trim() === hash.trim()) {
                return {
                    date: row[0],
                    githubUser: row[1],
                    email: row[2],
                    score: parseInt(row[3]) || 0,
                    tier: row[4] || 'UNVERIFIED',
                    hash: row[5],
                    behavioral: parseInt(row[6]) || 0,
                    skill: parseInt(row[7]) || 0,
                    social: parseInt(row[8]) || 0,
                    conduct: parseInt(row[9]) || 0
                };
            }
        }
        return null;
    }
    
    displayScore(data) {
        console.log('Displaying score:', data);
        
        // Update score value
        document.getElementById('scoreValue').textContent = data.score;
        
        // Update tier badge
        const tierBadge = document.getElementById('tierBadge');
        tierBadge.textContent = data.tier;
        tierBadge.className = `tier-badge tier-${data.tier.toLowerCase()}`;
        
        // Update GitHub username
        document.getElementById('githubUsername').textContent = `@${data.githubUser}`;
        
        // Update verification time
        document.getElementById('verificationTime').textContent = 
            `Verified: ${this.formatDate(data.date)}`;
        
        // Update dimension scores
        document.getElementById('behavioralScore').textContent = `${data.behavioral}/200`;
        document.getElementById('skillScore').textContent = `${data.skill}/300`;
        document.getElementById('socialScore').textContent = `${data.social}/200`;
        document.getElementById('conductScore').textContent = `${data.conduct}/100`;
        
        // Update progress bars
        this.updateProgressBar('behavioralScore', data.behavioral, 200);
        this.updateProgressBar('skillScore', data.skill, 300);
        this.updateProgressBar('socialScore', data.social, 200);
        this.updateProgressBar('conductScore', data.conduct, 100);
        
        // Update verification hash
        document.getElementById('verificationHash').textContent = data.hash;
        
        // Update "Get Your Score" button with referral
        const getScoreBtn = document.getElementById('getScoreBtn');
        getScoreBtn.href = `https://your-canva-link.com?ref=${encodeURIComponent(data.githubUser)}`;
        
        // Hide loading, show score
        this.hideLoading();
        this.scoreDisplayEl.style.display = 'block';
        
        // Update page title
        document.title = `Aether-Score: ${data.score}/1000 (${data.tier}) - ${data.githubUser}`;
    }
    
    updateProgressBar(elementId, value, max) {
        const percentage = (value / max) * 100;
        const progressFill = document.querySelector(`#${elementId} + .progress-bar .progress-fill`);
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }
    
    showDemoScore() {
        const demoData = {
            githubUser: 'torvalds',
            score: 846,
            tier: 'PLATINUM',
            behavioral: 190,
            skill: 280,
            social: 185,
            conduct: 95,
            hash: 'demo_38495981ade35694',
            date: new Date().toISOString()
        };
        
        this.displayScore(demoData);
        document.getElementById('verificationTime').textContent = 'DEMO - Not a real verification';
    }
    
    showLoading() {
        this.loadingEl.style.display = 'block';
        this.scoreDisplayEl.style.display = 'none';
        this.errorDisplayEl.style.display = 'none';
    }
    
    hideLoading() {
        this.loadingEl.style.display = 'none';
    }
    
    showError(message) {
        this.errorMessageEl.textContent = message;
        this.loadingEl.style.display = 'none';
        this.scoreDisplayEl.style.display = 'none';
        this.errorDisplayEl.style.display = 'block';
    }
    
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Recently';
        }
    }
    
    trackVerification(type, user, score) {
        // Track with Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'verification', {
                'event_category': 'engagement',
                'event_label': type,
                'value': score || 0,
                'user': user
            });
        }
        
        // Log to console
        console.log(`Verification ${type}: ${user} - ${score || 'N/A'}`);
    }
}

// Share functionality
function shareScore() {
    const score = document.getElementById('scoreValue')?.textContent || '850';
    const tier = document.getElementById('tierBadge')?.textContent || 'PLATINUM';
    const user = document.getElementById('githubUsername')?.textContent || '@githubuser';
    const url = window.location.href;
    
    const text = `🏆 My Aether-Score: ${score}/1000 (${tier}) - ${user}\n\nVerify at: ${url}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Aether-Score',
            text: text,
            url: url
        }).then(() => {
            console.log('Score shared successfully');
        }).catch(err => {
            console.log('Share cancelled:', err);
            copyToClipboard(text);
        });
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Score copied to clipboard! Share it anywhere.');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('❌ Could not copy to clipboard. Please copy manually.');
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hash = urlParams.get('hash');
    
    if (hash) {
        // Initialize verifier
        window.verifier = new AetherVerifier();
    } else {
        // No hash, show demo or redirect
        const demo = urlParams.get('demo');
        if (demo !== 'true') {
            // Redirect to main page or show instructions
            document.getElementById('loading').innerHTML = `
                <h2>🔗 Verification Link Required</h2>
                <p>Please use the verification link sent to your email.</p>
                <p><a href="?demo=true" class="btn btn-primary" style="margin-top: 20px;">View Demo Score</a></p>
            `;
        } else {
            window.verifier = new AetherVerifier();
        }
    }
});
