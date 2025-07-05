// Emotion icons mapping
const emotionIcons = {
    'happy': '😊',
    'sad': '😢',
    'angry': '😤',
    'cringe': '😬',
    'excited': '🤩',
    'anxious': '😰',
    'confused': '😵',
    'neutral': '😐'
};

// Emotion colors mapping
const emotionColors = {
    'happy': '#4ecdc4',
    'sad': '#667eea',
    'angry': '#ff6b6b',
    'cringe': '#feca57',
    'excited': '#ff9ff3',
    'anxious': '#54a0ff',
    'confused': '#5f27cd',
    'neutral': '#95a5a6'
};

// DOM elements
const messageInput = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');
const classifyBtn = document.getElementById('classifyBtn');

// Prolific Integration Variables
let currentStudyId = null;
let resultsChart = null;
let resultsUpdateInterval = null;

// Add a global variable to store the current intent
window.currentIntent = '';

// Character counter
messageInput.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = count;
    
    // Change color when approaching limit
    if (count > 180) {
        charCount.style.color = '#ff6b6b';
    } else if (count > 150) {
        charCount.style.color = '#feca57';
    } else {
        charCount.style.color = '#999';
    }
    
    // Update launch button state
    updateLaunchButton();
});

// Example buttons functionality removed as elements don't exist in current template

// Classify button
classifyBtn.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent form submission
    classifyEmotion();
});

// Enter key to classify
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        classifyEmotion();
    }
});

async function classifyEmotion() {
    const text = messageInput.value.trim();
    
    if (!text) {
        showNotification('Please enter a message to classify!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayResults(data);
        } else {
            throw new Error(data.error || 'Classification failed');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to classify emotion. Please try again.', 'error');
    }
}

function displayResults(data) {
    // Store the intent globally
    window.currentIntent = data.intent;
    
    // Render the intent result in the same way as the server
    let intentResult = document.querySelector('.intent-result-compact');
    if (!intentResult) {
        intentResult = document.createElement('div');
        intentResult.className = 'intent-result-compact';
        // Insert after the classify button
        const classifyBtn = document.getElementById('classifyBtn');
        classifyBtn.parentNode.insertBefore(intentResult, classifyBtn.nextSibling);
    }
    intentResult.innerHTML = `Intent: <strong>${data.intent}</strong>`;
    
    // Update launch button state after a short delay to ensure DOM is updated
    setTimeout(updateLaunchButton, 50);
}

// Function removed as emotionScores element doesn't exist in current template

// Function removed as humanFeedback and prolificStatus elements don't exist in current template

async function updateStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        
        // Update stats with animation
        animateNumber('totalClassifications', stats.total_classifications);
        animateNumber('humanFeedbackRequests', stats.human_feedback_requests);
        animateNumber('accuracyRate', stats.accuracy_rate, '%');
        
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Prolific Integration Functions
function updateLaunchButton() {
    const launchBtn = document.getElementById('launchStudyBtn');
    if (!launchBtn) return;
    const userMessage = document.getElementById('messageInput').value.trim();
    
    // Check for intent from multiple sources
    let intent = window.currentIntent || '';
    
    // If no intent from window.currentIntent, check for server-side rendered intent
    if (!intent) {
        const intentElement = document.querySelector('.intent-result-compact strong');
        if (intentElement) {
            intent = intentElement.textContent;
            // Also update window.currentIntent for consistency
            window.currentIntent = intent;
        }
    }
    
    launchBtn.disabled = !userMessage || !intent;
}

function initializeProlificIntegration() {
    const launchBtn = document.getElementById('launchStudyBtn');
    if (!launchBtn) return;

    // Launch study button handler
    launchBtn.addEventListener('click', async function() {
        await launchStudy();
    });
}

async function launchStudy() {
    const userMessage = document.getElementById('messageInput').value.trim();
    const intentElement = document.querySelector('.intent-result-compact strong');
    const aiIntent = intentElement ? intentElement.textContent : '';
    
    if (!userMessage || !aiIntent) {
        showNotification('Please classify a message first!', 'error');
        return;
    }
    
    // Get study configuration
    const ageMin = parseInt(document.getElementById('ageMin').value);
    const ageMax = parseInt(document.getElementById('ageMax').value);
    const studyConfig = {
        age_range: `${ageMin}-${ageMax}`,
        countries: Array.from(document.getElementById('countries').selectedOptions).map(opt => opt.value),
        participants: parseInt(document.getElementById('participants').value),
        reward: parseFloat(document.getElementById('reward').value),
        estimated_time: 2,
        max_time: 10
    };
    
    // Show loading
    const launchBtn = document.getElementById('launchStudyBtn');
    const originalText = launchBtn.innerHTML;
    launchBtn.disabled = true;
    launchBtn.innerHTML = '<span class="btn-text">Creating Study...</span><span class="btn-icon">⏳</span>';
    
    try {
        const response = await fetch('/api/create_prolific_study', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_message: userMessage,
                ai_intent: aiIntent,
                study_config: studyConfig
            })
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store the study ID for results tracking
            currentStudyId = data.study_id;
            
            // Show success notification
            showNotification(`Study created successfully! Study ID: ${data.study_id}`, 'success');
            
            // Show study status in the right column
            showStudyResults();
            
            // Update completion code with the actual one from the response
            const completionCodeElement = document.getElementById('completionCode');
            if (completionCodeElement && data.completion_code) {
                completionCodeElement.textContent = data.completion_code;
            }
            
        } else {
            throw new Error(data.error || 'Failed to create study');
        }
    } catch (error) {
        console.error('Error creating study:', error);
        showNotification('Failed to create study. Please try again.', 'error');
    } finally {
        launchBtn.disabled = false;
        launchBtn.innerHTML = originalText;
    }
}

function showStudyResults() {
    const studyStatus = document.getElementById('studyStatus');
    const studyId = document.getElementById('studyId');
    const studyStatusText = document.getElementById('studyStatusText');
    const completionCode = document.getElementById('completionCode');
    const showStatusBtn = document.getElementById('showStudyStatusBtn');
    if (studyStatus && studyId && studyStatusText && completionCode && showStatusBtn) {
        studyStatus.style.display = 'none'; // Hide by default
        showStatusBtn.style.display = 'block'; // Show the button
        studyId.textContent = currentStudyId || '-';
        studyStatusText.textContent = 'Active';
        completionCode.textContent = 'INTENT_' + new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    }
}

// Show study status and update elapsed time and responses
async function showAndUpdateStudyStatus() {
    const studyStatus = document.getElementById('studyStatus');
    const showStatusBtn = document.getElementById('showStudyStatusBtn');
    if (studyStatus && showStatusBtn) {
        // Fetch study results from backend
        if (!currentStudyId) return;
        const response = await fetch(`/api/study_results/${currentStudyId}`);
        const data = await response.json();
        // Get launch time from backend (if available) or use JS fallback
        let launchedAgo = '-';
        if (data && data.launched_at) {
            const launched = new Date(data.launched_at);
            const now = new Date();
            const diffMs = now - launched;
            const diffMin = Math.floor(diffMs / 60000);
            const diffSec = Math.floor((diffMs % 60000) / 1000);
            launchedAgo = `${diffMin} min ${diffSec} sec ago`;
        }
        document.getElementById('studyElapsed').textContent = launchedAgo;
        document.getElementById('studyResponses').textContent = data.total_participants || 0;
        studyStatus.style.display = 'block';
        // showStatusBtn.style.display = 'none'; // Keep the button visible
    }
}

// Add event listener for the Show Study Status button
window.addEventListener('DOMContentLoaded', function() {
    const showStatusBtn = document.getElementById('showStudyStatusBtn');
    if (showStatusBtn) {
        showStatusBtn.addEventListener('click', showAndUpdateStudyStatus);
    }
});

// Chart functionality removed as chart element doesn't exist in current template
// function initializeResultsChart() {
//     // Chart initialization code would go here
// }

function startResultsPolling() {
    if (resultsUpdateInterval) {
        clearInterval(resultsUpdateInterval);
    }
    
    // Poll for results every 10 seconds
    resultsUpdateInterval = setInterval(async () => {
        if (currentStudyId) {
            await updateStudyResults();
        }
    }, 10000);
    
    // Initial update
    updateStudyResults();
}

async function updateStudyResults() {
    if (!currentStudyId) return;
    
    try {
        const response = await fetch(`/api/study_results/${currentStudyId}`);
        const data = await response.json();
        
        if (response.ok) {
            updateResultsDisplay(data);
        }
    } catch (error) {
        console.error('Error updating results:', error);
    }
}

// Results display functionality removed as elements don't exist in current template
// function updateResultsDisplay(data) {
//     // Results display code would go here
// }

// Results table functionality removed as table element doesn't exist in current template
// function updateResultsTable(submissions) {
//     // Results table update code would go here
// }

// Study status update functionality removed as element doesn't exist in current template
// function updateStudyStatus() {
//     // Study status update code would go here
// }

function animateNumber(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - startValue) / 20;
    let currentValue = startValue;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if ((increment > 0 && currentValue >= targetValue) || 
            (increment < 0 && currentValue <= targetValue)) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.textContent = Math.round(currentValue) + suffix;
    }, 50);
}

function showLoading(show) {
    // Loading functionality removed as loadingOverlay element doesn't exist in current template
    // Could be re-implemented if needed
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#4ecdc4' : '#667eea'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize character counter
    if (messageInput) {
        charCount.textContent = messageInput.value.length;
    }
    
    // Prevent form submission and use AJAX instead
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            classifyEmotion();
        });
    }
    
    // Initialize Prolific integration
    initializeProlificIntegration();
    
    // Check for server-side rendered intent and update launch button
    setTimeout(updateLaunchButton, 100);
    
    // Add typewriter effect to tagline
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const originalText = tagline.textContent;
        tagline.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                tagline.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        setTimeout(typeWriter, 1000);
    }
    
    // Confetti effect removed as it was causing issues with button functionality
});

function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: confetti-fall 3s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            if (document.body.contains(confetti)) {
                document.body.removeChild(confetti);
            }
        }, 3000);
    }
}

// Add confetti animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(style); 