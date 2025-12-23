// Game State
let gameState = {
    difficulty: 'easy',
    score: 0,
    streak: 0,
    bestStreak: 0,
    wordsSolved: 0,
    currentWord: '',
    scrambledWord: '',
    hintRevealed: 0,
    timerEnabled: true,
    startTime: null,
    elapsedTime: 0,
    timerInterval: null,
    words: null,
    recentWords: [] // Track recently used words to avoid repetition
};

// DOM Elements
const elements = {
    startScreen: document.getElementById('start-screen'),
    gameScreen: document.getElementById('game-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    score: document.getElementById('score'),
    streak: document.getElementById('streak'),
    timer: document.getElementById('timer'),
    scrambledWord: document.getElementById('scrambled-word'),
    answerInput: document.getElementById('answer-input'),
    hintBtn: document.getElementById('hint-btn'),
    hintDisplay: document.getElementById('hint-display'),
    feedback: document.getElementById('feedback'),
    currentDifficulty: document.getElementById('current-difficulty'),
    startBtn: document.getElementById('start-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    timerToggle: document.getElementById('timer-toggle'),
    finalScore: document.getElementById('final-score'),
    wordsSolved: document.getElementById('words-solved'),
    bestStreak: document.getElementById('best-streak'),
    timePlayed: document.getElementById('time-played'),
    difficultyButtons: document.querySelectorAll('.btn-difficulty'),
    tutorialBtn: document.getElementById('tutorial-btn'),
    tutorialModal: document.getElementById('tutorial-modal'),
    tutorialClose: document.getElementById('tutorial-close'),
    streakBonus: document.getElementById('streak-bonus')
};

// Load words from API or JSON file
async function loadWords() {
    // First try to load from JSON file
    try {
        const response = await fetch('words.json');
        gameState.words = await response.json();
    } catch (error) {
        console.error('Error loading words from JSON:', error);
        gameState.words = null;
    }
    
    // If JSON failed or we want more words, fetch from API
    if (!gameState.words) {
        gameState.words = {
            easy: [],
            medium: [],
            hard: []
        };
    }
    
    // Fetch additional words from free API
    await fetchWordsFromAPI();
}

// Fetch words from Random Words API
async function fetchWordsFromAPI() {
    try {
        // Using a free word API - Random Words API
        // Fetch multiple words for each difficulty
        const easyWords = await fetchRandomWords(30, 3, 6); // 30 words, 3-6 letters
        const mediumWords = await fetchRandomWords(30, 7, 10); // 30 words, 7-10 letters
        const hardWords = await fetchRandomWords(20, 11, 15); // 20 words, 11-15 letters
        
        // Merge with existing words
        if (easyWords.length > 0) {
            gameState.words.easy = [...(gameState.words.easy || []), ...easyWords];
        }
        if (mediumWords.length > 0) {
            gameState.words.medium = [...(gameState.words.medium || []), ...mediumWords];
        }
        if (hardWords.length > 0) {
            gameState.words.hard = [...(gameState.words.hard || []), ...hardWords];
        }
    } catch (error) {
        console.error('Error fetching words from API:', error);
        // Use fallback if API fails
        if (!gameState.words || Object.keys(gameState.words).length === 0) {
            gameState.words = {
                easy: ['CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'BOOK', 'BALL', 'FISH', 'BIRD', 'HOME', 'LOVE', 'TIME', 'FIRE', 'WATER', 'EARTH', 'WIND', 'SNOW', 'RAIN', 'CLOUD'],
                medium: ['COMPUTER', 'ELEPHANT', 'MOUNTAIN', 'OCEAN', 'LIBRARY', 'BUTTERFLY', 'ADVENTURE', 'JOURNEY', 'WONDER', 'MAGIC', 'BEAUTIFUL', 'HAPPINESS', 'FRIENDSHIP', 'KNOWLEDGE', 'EDUCATION'],
                hard: ['EXTRAORDINARY', 'PHENOMENON', 'SOPHISTICATED', 'ARCHITECTURE', 'PHILOSOPHY', 'REVOLUTIONARY', 'EXTRAVAGANT', 'MAGNIFICENT', 'TREMENDOUS', 'FANTASTIC']
            };
        }
    }
}

// Fetch random words from API
async function fetchRandomWords(count, minLength, maxLength) {
    const words = [];
    const attempts = Math.min(count, 50); // Limit API calls
    
    for (let i = 0; i < attempts; i++) {
        try {
            // Using Random Words API (free, no key required)
            const response = await fetch(`https://random-word-api.herokuapp.com/word?length=${Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength}`);
            const data = await response.json();
            
            if (data && data[0]) {
                const word = data[0].toUpperCase();
                // Filter out words with special characters or numbers
                if (/^[A-Z]+$/.test(word) && word.length >= minLength && word.length <= maxLength) {
                    if (!words.includes(word)) {
                        words.push(word);
                        if (words.length >= count) break;
                    }
                }
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.warn('Error fetching word from API:', error);
            // Continue with next word
        }
    }
    
    return words;
}

// Initialize game
async function init() {
    // Load words - start with JSON, then fetch API words in background
    loadWords().then(() => {
        console.log('Words loaded successfully');
    }).catch(err => {
        console.error('Error loading words:', err);
    });
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Difficulty selection
    elements.difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.difficulty = btn.dataset.difficulty;
        });
    });

    // Set default difficulty
    document.querySelector('[data-difficulty="easy"]').classList.add('active');

    // Start game
    elements.startBtn.addEventListener('click', startGame);

    // Auto-submit when word length matches
    elements.answerInput.addEventListener('input', (e) => {
        const input = e.target.value.toUpperCase();
        // Only allow letters and limit to current word length
        const filtered = input.replace(/[^A-Z]/g, '').slice(0, gameState.currentWord ? gameState.currentWord.length : 20);
        e.target.value = filtered;
        
        // Auto-submit when length matches current word
        if (gameState.currentWord && filtered.length === gameState.currentWord.length) {
            setTimeout(() => checkAnswer(), 50);
        }
    });
    
    // Backspace clears entire input
    elements.answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && elements.answerInput.value.length > 0) {
            e.preventDefault();
            elements.answerInput.value = '';
        } else if (e.key === 'Enter') {
            e.preventDefault();
            checkAnswer();
        }
    });

    // Hint button
    elements.hintBtn.addEventListener('click', revealHint);

    // Play again
    elements.playAgainBtn.addEventListener('click', () => {
        showScreen('start');
        resetGame();
    });

    // Timer toggle
    elements.timerToggle.addEventListener('change', (e) => {
        gameState.timerEnabled = e.target.checked;
    });
    
    // Tutorial
    elements.tutorialBtn.addEventListener('click', () => {
        elements.tutorialModal.classList.remove('hidden');
    });
    
    elements.tutorialClose.addEventListener('click', () => {
        elements.tutorialModal.classList.add('hidden');
    });
    
    // Close tutorial on outside click
    elements.tutorialModal.addEventListener('click', (e) => {
        if (e.target === elements.tutorialModal) {
            elements.tutorialModal.classList.add('hidden');
        }
    });
}

// Show specific screen
function showScreen(screen) {
    elements.startScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    elements.gameOverScreen.classList.add('hidden');

    if (screen === 'start') {
        elements.startScreen.classList.remove('hidden');
    } else if (screen === 'game') {
        elements.gameScreen.classList.remove('hidden');
    } else if (screen === 'gameOver') {
        elements.gameOverScreen.classList.remove('hidden');
    }
}

// Start game
function startGame() {
    resetGame();
    showScreen('game');
    loadNewWord();
    startTimer();
}

// Reset game state
function resetGame() {
    gameState.score = 0;
    gameState.streak = 0;
    gameState.wordsSolved = 0;
    gameState.elapsedTime = 0;
    gameState.hintRevealed = 0;
    gameState.startTime = null;
    gameState.recentWords = []; // Reset recent words for new game
    stopTimer();
    updateUI();
    clearFeedback();
    elements.hintDisplay.textContent = '';
    elements.answerInput.value = '';
    elements.answerInput.focus();
}

// Load new word
function loadWord(difficulty) {
    if (!gameState.words || !gameState.words[difficulty]) {
        return null;
    }
    
    const wordList = gameState.words[difficulty];
    
    // Filter out recently used words
    const availableWords = wordList.filter(word => {
        const upperWord = word.toUpperCase();
        return !gameState.recentWords.includes(upperWord);
    });
    
    // If we've used all words, reset the recent words list (but keep current word)
    if (availableWords.length === 0) {
        const currentWord = gameState.currentWord;
        gameState.recentWords = currentWord ? [currentWord] : [];
        // Retry with full list
        const retryWords = wordList.filter(word => {
            const upperWord = word.toUpperCase();
            return !gameState.recentWords.includes(upperWord);
        });
        if (retryWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * retryWords.length);
            return retryWords[randomIndex].toUpperCase();
        }
    }
    
    // Select from available words
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    return availableWords[randomIndex].toUpperCase();
}

function loadNewWord() {
    gameState.currentWord = loadWord(gameState.difficulty);
    if (!gameState.currentWord) {
        showFeedback('Error loading word. Please refresh the page.', 'incorrect');
        return;
    }
    
    // Add word to recent words list (keep last 20 words)
    gameState.recentWords.push(gameState.currentWord);
    if (gameState.recentWords.length > 20) {
        gameState.recentWords.shift(); // Remove oldest word
    }
    
    gameState.scrambledWord = shuffleWord(gameState.currentWord);
    gameState.hintRevealed = 0;
    
    // Quick update with minimal animation for fast pace
    elements.scrambledWord.style.opacity = '0.5';
    setTimeout(() => {
        elements.scrambledWord.textContent = gameState.scrambledWord;
        elements.scrambledWord.style.opacity = '1';
    }, 50);
    
    elements.currentDifficulty.textContent = gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1);
    elements.hintDisplay.textContent = '';
    elements.hintBtn.disabled = false;
    clearFeedback();
    elements.answerInput.value = '';
    elements.answerInput.maxLength = gameState.currentWord.length;
    elements.answerInput.focus();
}

// Shuffle word
function shuffleWord(word) {
    if (word.length <= 1) return word;
    
    let shuffled = word.split('');
    let attempts = 0;
    const maxAttempts = 50;
    
    // Multiple shuffle passes to ensure good scrambling
    do {
        // Fisher-Yates shuffle with multiple passes for better randomization
        for (let pass = 0; pass < 3; pass++) {
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
        }
        
        // Ensure it's not the same as original
        if (shuffled.join('') === word) {
            attempts++;
            if (attempts >= maxAttempts) break;
            continue;
        }
        
        // For short words, ensure first and last letters are different
        if (word.length <= 4) {
            if (shuffled[0] === word[0] && shuffled[shuffled.length - 1] === word[word.length - 1]) {
                // Swap first and last if they match original positions
                [shuffled[0], shuffled[shuffled.length - 1]] = [shuffled[shuffled.length - 1], shuffled[0]];
            }
        }
        
        // Check if result is different enough (at least 2 positions different)
        let differences = 0;
        for (let i = 0; i < word.length; i++) {
            if (shuffled[i] !== word[i]) differences++;
        }
        
        // If less than 2 positions are different, reshuffle
        if (differences < 2 && word.length > 2) {
            attempts++;
            if (attempts >= maxAttempts) break;
            continue;
        }
        
        break;
    } while (attempts < maxAttempts);
    
    return shuffled.join('');
}

// Check answer
function checkAnswer() {
    const userInput = elements.answerInput.value.trim().toUpperCase();
    
    if (!userInput) {
        showFeedback('Please enter an answer!', 'incorrect');
        return;
    }

    if (userInput === gameState.currentWord) {
        // Correct answer
        gameState.streak += 1;
        gameState.wordsSolved += 1;
        
        if (gameState.streak > gameState.bestStreak) {
            gameState.bestStreak = gameState.streak;
        }
        
        const points = calculateScore(gameState.currentWord.length, gameState.elapsedTime);
        gameState.score += points;
        
        // Show streak bonus effect
        if (gameState.streak > 1) {
            showStreakBonus(gameState.streak);
        }
        
        showFeedback(`Correct! +${points} points`, 'correct');
        updateUI();
        
        // Load next word immediately
        loadNewWord();
    } else {
        // Incorrect answer
        gameState.streak = 0;
        showFeedback('Incorrect! Try again.', 'incorrect');
        updateUI();
        elements.answerInput.value = '';
        elements.answerInput.focus();
    }
}

// Show streak bonus animation
function showStreakBonus(streak) {
    const bonusElement = elements.streakBonus;
    const multiplier = (1 + (streak * 0.5)).toFixed(1);
    bonusElement.textContent = `${multiplier}x STREAK!`;
    bonusElement.classList.remove('hidden');
    bonusElement.style.animation = 'none';
    
    // Trigger animation
    setTimeout(() => {
        bonusElement.style.animation = 'streakPulse 0.6s ease-out';
    }, 10);
    
    // Hide after animation
    setTimeout(() => {
        bonusElement.classList.add('hidden');
    }, 600);
}

// Calculate score
function calculateScore(wordLength, timeElapsed) {
    // Base points from word length
    let basePoints = wordLength * 10;
    
    // Bonus for speed (if timer enabled)
    if (gameState.timerEnabled) {
        const timeBonus = Math.max(0, 30 - timeElapsed) * 2;
        basePoints += timeBonus;
    }
    
    // Streak multiplier - increases more dramatically for video game feel
    // 1x, 1.5x, 2x, 2.5x, 3x, etc.
    const streakMultiplier = 1 + (gameState.streak * 0.5);
    
    return Math.floor(basePoints * streakMultiplier);
}

// Reveal hint
function revealHint() {
    if (gameState.hintRevealed >= gameState.currentWord.length) {
        elements.hintBtn.disabled = true;
        return;
    }
    
    const hintArray = gameState.currentWord.split('').map((letter, index) => {
        if (index <= gameState.hintRevealed) {
            return letter;
        }
        return '_';
    });
    
    gameState.hintRevealed++;
    elements.hintDisplay.textContent = hintArray.join(' ');
    
    if (gameState.hintRevealed >= gameState.currentWord.length) {
        elements.hintBtn.disabled = true;
    }
}

// Show feedback
function showFeedback(message, type) {
    elements.feedback.textContent = message;
    elements.feedback.className = `feedback ${type}`;
    
    if (type === 'correct') {
        // Clear feedback quickly for fast-paced gameplay
        setTimeout(() => {
            clearFeedback();
        }, 500);
    }
}

// Clear feedback
function clearFeedback() {
    elements.feedback.textContent = '';
    elements.feedback.className = 'feedback';
}

// Update UI
function updateUI() {
    elements.score.textContent = gameState.score.toLocaleString();
    elements.streak.textContent = gameState.streak;
    
    // Highlight stats with pulse effect
    highlightStat('score');
    highlightStat('streak');
    highlightStat('timer');
    
    if (gameState.timerEnabled) {
        const minutes = Math.floor(gameState.elapsedTime / 60);
        const seconds = Math.floor(gameState.elapsedTime % 60);
        elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        elements.timer.textContent = '--:--';
    }
}

// Highlight stat with pulse effect
function highlightStat(statName) {
    const statElement = elements[statName].closest('.stat-item');
    if (statElement) {
        statElement.classList.add('pulse');
        setTimeout(() => {
            statElement.classList.remove('pulse');
        }, 300);
    }
}

// Timer functions
function startTimer() {
    if (!gameState.timerEnabled) return;
    
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
        updateUI();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// Game over
function gameOver() {
    stopTimer();
    showScreen('gameOver');
    
    elements.finalScore.textContent = gameState.score;
    elements.wordsSolved.textContent = gameState.wordsSolved;
    elements.bestStreak.textContent = gameState.bestStreak;
    
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = Math.floor(gameState.elapsedTime % 60);
    elements.timePlayed.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize on page load
init();

