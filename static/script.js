// DOM Elements
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');
const crackTimeEl = document.getElementById('crack-time');
const warningEl = document.getElementById('warning');
const suggestionsEl = document.getElementById('suggestions');
const leakStatusEl = document.getElementById('leak-status');
const generatedPasswordEl = document.getElementById('generated-password');
const copyPasswordBtn = document.getElementById('copy-password');
const generateBtn = document.getElementById('generate-btn');
const eyeIcon = togglePasswordBtn.querySelector('i');

// Toggle password visibility
togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
});

// Analyze password as user types (with debounce)
let analyzeTimeout;
passwordInput.addEventListener('input', () => {
    clearTimeout(analyzeTimeout);
    const password = passwordInput.value;
    
    if (password.length > 0) {
        // Show loading states
        strengthText.textContent = 'Analyzing...';
        crackTimeEl.textContent = 'Calculating...';
        leakStatusEl.textContent = 'Checking...';
        leakStatusEl.className = '';
        
        analyzeTimeout = setTimeout(() => {
            analyzePassword(password);
            checkLeak(password);
        }, 300); // Debounce for better performance
    } else {
        resetAnalysis();
    }
});

// Generate password
generateBtn.addEventListener('click', async () => {
    try {
        // Add visual feedback
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;
        
        const response = await fetch('/generate_password');
        const data = await response.json();
        generatedPasswordEl.value = data.password;
        
        // Reset button
        setTimeout(() => {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }, 1000);
    } catch (error) {
        console.error('Error generating password:', error);
        generatedPasswordEl.placeholder = 'Error generating password';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Password';
    }
});

// Copy generated password
copyPasswordBtn.addEventListener('click', () => {
    if (generatedPasswordEl.value) {
        generatedPasswordEl.select();
        document.execCommand('copy');
        
        // Show feedback
        const originalIcon = copyPasswordBtn.innerHTML;
        copyPasswordBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyPasswordBtn.style.background = '#4ade80';
        
        setTimeout(() => {
            copyPasswordBtn.innerHTML = originalIcon;
            copyPasswordBtn.style.background = '';
        }, 2000);
    }
});

// Analyze password strength
async function analyzePassword(password) {
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        // Update strength meter with animation
        const percentage = (data.score / 4) * 100;
        strengthBar.style.width = `${percentage}%`;
        strengthBar.className = `bar score-${data.score}`;
        
        // Update strength text
        const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        strengthText.textContent = strengthLabels[data.score];
        strengthText.className = `strength-score score-${data.score}-text`;
        
        // Update crack time
        crackTimeEl.textContent = data.crack_time;
        
        // Update warning
        warningEl.textContent = data.warning || 'No security concerns detected';
        
        // Update suggestions
        suggestionsEl.innerHTML = '';
        if (data.suggestions && data.suggestions.length > 0) {
            data.suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.textContent = suggestion;
                suggestionsEl.appendChild(li);
            });
        } else if (!data.warning) {
            const li = document.createElement('li');
            li.textContent = 'Your password meets current security standards';
            suggestionsEl.appendChild(li);
        }
    } catch (error) {
        console.error('Error analyzing password:', error);
        strengthText.textContent = 'Error';
        crackTimeEl.textContent = 'Unable to calculate';
    }
}

// Check if password has been leaked
async function checkLeak(password) {
    try {
        const response = await fetch('/check_leak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.compromised) {
            leakStatusEl.textContent = `COMPROMISED! Found in ${data.count} data breaches.`;
            leakStatusEl.className = 'leak-compromised';
        } else {
            leakStatusEl.textContent = 'Safe - Not found in known data breaches';
            leakStatusEl.className = 'leak-safe';
        }
    } catch (error) {
        console.error('Error checking leaks:', error);
        leakStatusEl.textContent = 'Error checking data breaches';
        leakStatusEl.className = '';
    }
}

// Reset analysis results
function resetAnalysis() {
    strengthBar.style.width = '0%';
    strengthBar.className = 'bar';
    strengthText.textContent = '-';
    strengthText.className = 'strength-score';
    crackTimeEl.textContent = '-';
    warningEl.textContent = '-';
    suggestionsEl.innerHTML = '';
    leakStatusEl.textContent = 'Not checked yet';
    leakStatusEl.className = '';
}

// Initialize with empty state
document.addEventListener('DOMContentLoaded', () => {
    resetAnalysis();
});