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
    recentWords: [], // Track recently used words to avoid repetition
    soundEnabled: true,
    soundVolume: 0.5,
    ambientPlaying: false
};

// Audio Context
let audioContext = null;
let ambientGainNode = null;
let ambientOscillator = null;

// Initialize Audio Context
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Create gain node for ambient sound
        ambientGainNode = audioContext.createGain();
        ambientGainNode.gain.value = 0.08; // Very quiet ambient
        ambientGainNode.connect(audioContext.destination);
    } catch (error) {
        console.log('Audio not supported:', error);
    }
}

// Sound Generation Functions
function playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!audioContext || !gameState.soundEnabled) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * gameState.soundVolume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        // Silently fail if audio fails
    }
}

function playTypingSound() {
    if (!gameState.soundEnabled) return;
    // Quick, subtle typing sound
    const freq = 800 + Math.random() * 200; // Random pitch variation
    playTone(freq, 0.05, 'sine', 0.15);
}

function playCorrectSound() {
    if (!gameState.soundEnabled) return;
    // Pleasant ascending chord
    playTone(523.25, 0.1, 'sine', 0.4); // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.4), 50); // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.4), 100); // G5
}

function playIncorrectSound() {
    if (!gameState.soundEnabled) return;
    // Lower, descending tone
    playTone(300, 0.2, 'sawtooth', 0.3);
    setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.3), 100);
}

function startAmbientSound() {
    if (!elements.backgroundMusic || !gameState.soundEnabled || gameState.ambientPlaying) return;
    
    try {
        // Set volume to be quiet (20% volume)
        elements.backgroundMusic.volume = 0.2;
        elements.backgroundMusic.loop = true;
        
        // Play the background music
        const playPromise = elements.backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                gameState.ambientPlaying = true;
            }).catch(error => {
                // Autoplay was prevented, user interaction required
                console.log('Background music requires user interaction');
            });
        }
    } catch (error) {
        console.log('Background music error:', error);
    }
}

function stopAmbientSound() {
    if (elements.backgroundMusic) {
        try {
            elements.backgroundMusic.pause();
            elements.backgroundMusic.currentTime = 0;
            gameState.ambientPlaying = false;
        } catch (error) {
            // Ignore errors
        }
    }
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    if (gameState.soundEnabled) {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        startAmbientSound();
    } else {
        stopAmbientSound();
    }
    updateSoundButton();
}

function updateSoundButton() {
    if (elements.soundBtn) {
        elements.soundBtn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
        elements.soundBtn.title = gameState.soundEnabled ? 'Sound On' : 'Sound Off';
    }
}

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
    streakBonus: document.getElementById('streak-bonus'),
    soundBtn: document.getElementById('sound-btn'),
    backgroundMusic: document.getElementById('background-music')
};

// Default fallback words (always available)
const defaultWords = {
    easy: ['CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'BOOK', 'BALL', 'FISH', 'BIRD', 'HOME', 'LOVE', 'TIME', 'FIRE', 'WATER', 'EARTH', 'WIND', 'SNOW', 'RAIN', 'CLOUD', 'FLOWER', 'GARDEN', 'RIVER', 'OCEAN', 'MOUNTAIN', 'FOREST', 'BEACH', 'ISLAND', 'CITY', 'HOUSE', 'SCHOOL', 'FRIEND', 'FAMILY', 'MUSIC', 'DANCE', 'SING', 'PLAY', 'GAME', 'TOY', 'CAKE', 'COOKIE', 'PIZZA', 'APPLE', 'BANANA', 'ORANGE', 'CAR', 'BIKE', 'TRAIN', 'PLANE', 'SHIP'],
    medium: ['COMPUTER', 'ELEPHANT', 'MOUNTAIN', 'LIBRARY', 'BUTTERFLY', 'ADVENTURE', 'JOURNEY', 'WONDER', 'MAGIC', 'BEAUTIFUL', 'HAPPINESS', 'FRIENDSHIP', 'KNOWLEDGE', 'EDUCATION', 'TEACHER', 'STUDENT', 'SCIENCE', 'NATURE', 'OCEAN', 'WEATHER', 'SEASON', 'HOLIDAY', 'CELEBRATION', 'BIRTHDAY', 'WEDDING', 'TRAVEL', 'VACATION', 'EXPLORE', 'DISCOVER', 'CREATIVE', 'ARTISTIC', 'MUSICAL', 'INSTRUMENT', 'CONCERT', 'PERFORMANCE', 'THEATER', 'MOVIE', 'STORY', 'NOVEL', 'CHARACTER', 'PLOT', 'SETTING', 'AUTHOR', 'WRITER', 'POETRY', 'POEM', 'RHYME', 'VERSE', 'STANZA', 'METAPHOR'],
    hard: ['EXTRAORDINARY', 'PHENOMENON', 'SOPHISTICATED', 'ARCHITECTURE', 'PHILOSOPHY', 'REVOLUTIONARY', 'EXTRAVAGANT', 'MAGNIFICENT', 'TREMENDOUS', 'FANTASTIC', 'SPECTACULAR', 'REMARKABLE', 'EXCEPTIONAL', 'OUTSTANDING', 'IMPRESSIVE', 'BRILLIANT', 'GENIUS', 'INTELLIGENT', 'KNOWLEDGEABLE', 'EDUCATED', 'PROFESSIONAL', 'EXPERIENCED', 'QUALIFIED', 'COMPETENT', 'CAPABLE', 'ACCOMPLISHED', 'ACHIEVEMENT', 'SUCCESSFUL', 'TRIUMPHANT', 'VICTORIOUS', 'CHAMPION', 'WINNER', 'CHALLENGE', 'DIFFICULTY', 'OBSTACLE', 'OPPORTUNITY', 'POSSIBILITY', 'POTENTIAL', 'PROMISING', 'ENCOURAGING', 'INSPIRING', 'MOTIVATING', 'ENCOURAGEMENT', 'INSPIRATION', 'MOTIVATION', 'DETERMINATION', 'PERSEVERANCE', 'DEDICATION', 'COMMITMENT', 'DEVOTION']
};

// Load words from API or JSON file
async function loadWords() {
    // Initialize with default words first (so game can start immediately)
    gameState.words = JSON.parse(JSON.stringify(defaultWords));
    
    // Try to load from JSON file (only works with http/https, not file://)
    try {
        // Check if we're in a browser environment that supports fetch
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            const response = await fetch('words.json');
            if (response.ok) {
                const jsonWords = await response.json();
                // Merge JSON words with defaults
                if (jsonWords.easy) gameState.words.easy = [...defaultWords.easy, ...jsonWords.easy];
                if (jsonWords.medium) gameState.words.medium = [...defaultWords.medium, ...jsonWords.medium];
                if (jsonWords.hard) gameState.words.hard = [...defaultWords.hard, ...jsonWords.hard];
            }
        }
    } catch (error) {
        // Silently fail - we have default words
        console.log('Using default words (JSON not available)');
    }
    
    // Try to fetch additional words from API (only if online)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        try {
            await fetchWordsFromAPI();
        } catch (error) {
            // Silently fail - we have default words
            console.log('Using default words (API not available)');
        }
    }
}

// Fetch words from Random Words API
async function fetchWordsFromAPI() {
    // Using a free word API - Random Words API
    // Fetch multiple words for each difficulty
    const easyWords = await fetchRandomWords(30, 3, 6); // 30 words, 3-6 letters
    const mediumWords = await fetchRandomWords(30, 7, 10); // 30 words, 7-10 letters
    const hardWords = await fetchRandomWords(20, 11, 15); // 20 words, 11-15 letters
    
    // Merge with existing words (avoid duplicates)
    if (easyWords.length > 0) {
        const uniqueEasy = easyWords.filter(word => !gameState.words.easy.includes(word));
        gameState.words.easy = [...gameState.words.easy, ...uniqueEasy];
    }
    if (mediumWords.length > 0) {
        const uniqueMedium = mediumWords.filter(word => !gameState.words.medium.includes(word));
        gameState.words.medium = [...gameState.words.medium, ...uniqueMedium];
    }
    if (hardWords.length > 0) {
        const uniqueHard = hardWords.filter(word => !gameState.words.hard.includes(word));
        gameState.words.hard = [...gameState.words.hard, ...uniqueHard];
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
    // Initialize audio
    initAudio();
    
    // Initialize words immediately with defaults (so game works right away)
    gameState.words = JSON.parse(JSON.stringify(defaultWords));
    
    // Load additional words in background (JSON + API)
    loadWords().then(() => {
        console.log('Words loaded successfully');
    }).catch(err => {
        console.log('Using default words only');
    });
    
    setupEventListeners();
    updateSoundButton();
    
    // Initialize background music volume (quiet - 20%)
    if (elements.backgroundMusic) {
        elements.backgroundMusic.volume = 0.2; // Quiet background music
        elements.backgroundMusic.loop = true;
    }
    
    // Start ambient sound when page loads (if sound is enabled)
    if (gameState.soundEnabled) {
        // Wait for user interaction before starting audio
        document.addEventListener('click', () => {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }
            if (gameState.soundEnabled && !gameState.ambientPlaying) {
                startAmbientSound();
            }
        }, { once: true });
    }
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
    let lastInputLength = 0;
    elements.answerInput.addEventListener('input', (e) => {
        const input = e.target.value.toUpperCase();
        // Only allow letters and limit to current word length
        const filtered = input.replace(/[^A-Z]/g, '').slice(0, gameState.currentWord ? gameState.currentWord.length : 20);
        
        // Play typing sound if a new character was added
        if (filtered.length > lastInputLength) {
            playTypingSound();
        }
        lastInputLength = filtered.length;
        
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
    
    // Sound toggle
    elements.soundBtn.addEventListener('click', toggleSound);
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
    stopAmbientSound(); // Stop ambient when resetting
    updateUI();
    clearFeedback();
    elements.hintDisplay.textContent = '';
    elements.answerInput.value = '';
    elements.answerInput.focus();
}

// Load new word
function loadWord(difficulty) {
    // Ensure words are initialized
    if (!gameState.words) {
        gameState.words = JSON.parse(JSON.stringify(defaultWords));
    }
    
    if (!gameState.words[difficulty] || gameState.words[difficulty].length === 0) {
        // Fallback to default words if difficulty list is empty
        gameState.words[difficulty] = [...defaultWords[difficulty]];
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
        // Last resort: use any word from the list
        if (wordList.length > 0) {
            const randomIndex = Math.floor(Math.random() * wordList.length);
            return wordList[randomIndex].toUpperCase();
        }
    }
    
    // Select from available words
    if (availableWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        return availableWords[randomIndex].toUpperCase();
    }
    
    return null;
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
        playCorrectSound();
        
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
        playIncorrectSound();
        
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
    
    // Get the next letter to reveal
    const nextLetterIndex = gameState.hintRevealed;
    const nextLetter = gameState.currentWord[nextLetterIndex];
    
    // Add the revealed letter to the input box at the correct position
    const currentInput = elements.answerInput.value.toUpperCase();
    const inputArray = currentInput.split('');
    
    // Ensure the input array is the right length
    while (inputArray.length < gameState.currentWord.length) {
        inputArray.push('');
    }
    
    // Place the revealed letter at its correct position
    inputArray[nextLetterIndex] = nextLetter;
    
    // Update the input value
    elements.answerInput.value = inputArray.join('');
    
    // Update hint display
    gameState.hintRevealed++;
    const hintArray = gameState.currentWord.split('').map((letter, index) => {
        if (index <= gameState.hintRevealed - 1) {
            return letter;
        }
        return '_';
    });
    elements.hintDisplay.textContent = hintArray.join(' ');
    
    if (gameState.hintRevealed >= gameState.currentWord.length) {
        elements.hintBtn.disabled = true;
    }
    
    // Focus back on input
    elements.answerInput.focus();
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

