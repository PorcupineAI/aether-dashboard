// verify.js
class AetherVerifier {
    constructor() {
        this.sheetId = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your sheet ID
        this.apiUrl = `https://opensheet.elk.sh/${this.sheetId}/PROCESSED_Scores`;
    }

    async init() {
        const params = new URLSearchParams(window.location.search);
        const hash = params.get('hash');
        const demo = params.get('demo');

        if (demo === 'true') {
            this.showDemoScore();
            return;
        }

        if (!hash) {
            this.showError('No verification hash provided');
            return;
        }

        await this.verifyScore(hash);
    }

    async verifyScore(hash) {
        try {
            // Show loading
            document.getElementById('loading').style.display = 'block';
            document.getElementById('scoreDisplay').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';

            // Fetch from Google Sheets
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch scores');
            }

            const data = await response.json();
            
            // Find score by verification hash (column index 5 in PROCESSED_Scores)
            const scoreData = this.findScoreByHash(data, hash);

            if (!scoreData) {
                this.showError('Score not found. The verification link may have expired.');
                return;
            }

            // Display the score
            this.displayScore(scoreData);

        } catch (error) {
            console.error('Verification error:', error);
            this.showError('Could not verify score. Please try again.');
        }
    }

    findScoreByHash(data, hash) {
        // Map sheet columns to our data structure
        // PROCESSED_Scores columns: Date,
