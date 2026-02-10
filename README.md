# AZF Exam Study App ✈️

An interactive study application for the AZF (Allgemeines Sprechfunkzeugnis für den Flugfunkdienst) aviation radio examination.

## Features

- **Practice Mode**: Answers are shuffled randomly to prevent memorizing positions
- **Study Mode**: Answers shown in original order (A is always correct) for learning
- **Progress Tracking**: Track your correct/incorrect answers and accuracy in real-time
- **Session Statistics**: See your final score at the end of each session
- **Review Mistakes**: Option to review only the questions you got wrong
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No Server Required**: Runs entirely in your browser

## How to Use

### Option 1: GitHub Pages (Recommended)

1. Create a new repository on GitHub
2. Upload these files:
   - `index.html`
   - `style.css`
   - `app.js`
   - `questions.json`
3. Go to Settings → Pages
4. Select "main" branch as source
5. Your app will be available at `https://yourusername.github.io/repository-name`

### Option 2: Local Usage

1. Download all files to a folder
2. Open `index.html` in your web browser
3. Start studying!

## Files Included

- `index.html` - Main application page
- `style.css` - Styling and layout
- `app.js` - Application logic and functionality
- `questions.json` - Question database (sample with 20 questions)
- `README.md` - This file

## Expanding the Question Database

The current `questions.json` contains a sample of 20 questions. To add more questions:

1. Open `questions.json` in a text editor
2. Add questions following this format:

```json
{
  "id": 1,
  "question": "Your question text here?",
  "answers": [
    {"letter": "A", "text": "Correct answer", "correct": true},
    {"letter": "B", "text": "Wrong answer", "correct": false},
    {"letter": "C", "text": "Wrong answer", "correct": false},
    {"letter": "D", "text": "Wrong answer", "correct": false}
  ]
}
```

**Important**: The correct answer should ALWAYS have `"correct": true` and should ALWAYS be in the "A" position in the JSON file. The app will shuffle them during practice mode.

## Extracting All Questions from PDF

A Python script is included to help extract all 289 questions from the official PDF:

```python
# See extract_questions.py for the parser
python3 extract_questions.py
```

You'll need to paste the full document text into the script to extract all questions.

## Tips for Effective Study

1. **Start with Study Mode** to learn the correct answers
2. **Switch to Practice Mode** to test yourself with shuffled answers
3. **Use the Review Feature** to focus on questions you got wrong
4. **Track Your Progress** session by session to see improvement
5. **Take Multiple Sessions** rather than one long session for better retention

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Technical Details

- Pure HTML/CSS/JavaScript (no frameworks required)
- LocalStorage could be added for persistent progress tracking
- Questions are shuffled client-side for privacy
- No data is sent to any server

## Customization

### Changing Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --primary-color: #2563eb;
    --success-color: #16a34a;
    --danger-color: #dc2626;
    /* etc. */
}
```

### Adding Timer

You can add a timer feature by modifying `app.js` to track time per question.

### Adding Bookmarks

Add a bookmark feature to mark difficult questions for later review.

## License

This is a study tool created for personal educational use. The examination questions are from the official AZF examination materials published by Bundesnetzagentur.

## Contributing

To add all 289 questions, you can:
1. Manually add them to `questions.json`
2. Use the Python extraction script
3. Import from a spreadsheet

## Support

For issues or improvements, please check the code or modify as needed. This is open-source educational software.

---

**Good luck with your AZF examination! 🛫**
