# Word Scramble Game

A modern, engaging web-based word scramble game built with vanilla HTML, CSS, and JavaScript. Unscramble letters to form words and earn points!

## Features

- **Three Difficulty Levels**: Easy, Medium, and Hard with appropriate word lists
- **Scoring System**: Points based on word length, speed, and streak multipliers
- **Timer**: Optional timer to track your solving speed
- **Hint System**: Reveal letters one at a time when stuck
- **Streak Counter**: Track consecutive correct answers
- **Statistics**: View your final score, words solved, best streak, and time played
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Ad-Ready**: Structured with placeholder ad slots for easy monetization

## How to Play

1. Choose your difficulty level (Easy, Medium, or Hard)
2. Optionally enable/disable the timer
3. Click "Start Game"
4. Unscramble the letters to form a word
5. Type your answer and click "Submit" or press Enter
6. Earn points for correct answers - faster answers and longer streaks earn more points!
7. Use the "Get Hint" button if you need help (reveals letters one at a time)

## Scoring

- **Base Points**: Word length × 10
- **Speed Bonus**: Up to 60 points for solving quickly (if timer enabled)
- **Streak Multiplier**: 10% bonus per consecutive correct answer

## File Structure

```
Website/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── script.js           # Game logic and mechanics
├── words.json          # Word list database (organized by difficulty)
└── README.md           # Project documentation
```

## Getting Started

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Start playing!

No build tools or dependencies required - just open the HTML file in any modern browser.

## Ad Integration

The website is structured with placeholder ad containers ready for monetization:

- **Header Banner**: 728×90 (desktop) / 320×50 (mobile)
- **Sidebar**: 300×250 (desktop only)
- **Footer Banner**: 728×90 (desktop) / 320×50 (mobile)

To add ads:

1. Sign up with an ad network (Google AdSense, Media.net, etc.)
2. Replace the placeholder divs in `index.html` with your ad code
3. The ad containers are already styled and responsive

## Browser Support

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge
- Opera

## License

Free to use and modify for personal or commercial projects.

## Future Enhancements

Potential features to add:
- High score leaderboard (localStorage or backend)
- More word categories
- Daily challenges
- Multiplayer mode
- Sound effects and music
- Achievement system

