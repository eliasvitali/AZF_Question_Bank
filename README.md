# AZF Exam Study App ✈️

An interactive study application for the AZF (Allgemeines Sprechfunkzeugnis für den Flugfunkdienst) aviation radio examination.

## Features

- **Practice Mode**: Answers are shuffled randomly to prevent memorizing positions
- **Study Mode**: Answers shown in original order (A is always correct) for learning
- **Progress Tracking**: Track your correct/incorrect answers and accuracy in real-time
- **Session Statistics**: See your final score at the end of each session
- **Review Mistakes**: Option to review only the questions you got wrong
- **Question Memory**: Flag difficult questions and save that list in your browser
- **Import/Export Flags**: Download a small JSON file of flagged question IDs and reuse it on another device or browser
- **Keyboard Shortcuts**: Use arrow keys to move between questions and `R` to flag/unflag
- **Smart Flow**: Correct answers auto-advance, incorrect answers stay visible for review
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

## New: Flagged Question Memory

The app now has a built-in lightweight memory system designed for exactly the "focus on what I still miss" workflow.

- Use the `Flag` button on any question to add it to your difficult-question list
- Flags are saved automatically in your browser using `localStorage`
- Turn on `Study flagged only` to work through just those questions
- Incorrect answers are auto-flagged by default, and this can be switched off in the app
- Export your flagged list as a JSON file if you want to move it to another browser/device
- Import a previously exported JSON file to restore your saved flagged list

This gives you persistence without requiring logins, accounts, or a backend database.

### Important: How Answer Letters Work

In the `questions.json` file, the correct answer is always marked with `"correct": true` and is typically in the "A" position in the data. **However, in the app:**

- **Practice Mode**: Answers are shuffled and display letters A-D are assigned based on their position after shuffling
- **Study Mode**: Answers stay in original order with A-D assigned by position

This means the letter "A" you see in the app may not be the same as the letter "A" in the JSON file - the app reassigns letters based on display position. This prevents you from memorizing "A is always correct" and forces you to actually read and understand each answer.

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

**Important**: In the JSON file, keep the correct answer with `"correct": true`. The `"letter"` field is only used internally - the app will reassign display letters A-D based on the shuffled position, so users can't just memorize "A is always correct."

## Extracting All Questions from PDF

The included Python script can extract all 289 questions **directly from the PDF file**:

### Quick Start

```bash
# Install PDF library (if needed)
pip install pypdf

# Extract questions from PDF
python3 extract_questions.py 2024Pruefungsfragen_AZF_pdf.pdf
```

That's it! The script will create `questions.json` with all 289 questions.

### Detailed Usage

```
python3 extract_questions.py <input_file> [output_file.json]

Arguments:
  input_file       - PDF file (.pdf) or text file (.txt) with AZF exam questions
  output_file.json - Output JSON file (default: questions.json)

Examples:
  # Extract from PDF
  python3 extract_questions.py 2024Pruefungsfragen_AZF_pdf.pdf
  
  # Extract from PDF with custom output name
  python3 extract_questions.py 2024Pruefungsfragen_AZF_pdf.pdf all_questions.json
  
  # Extract from text file (if you prefer)
  python3 extract_questions.py azf_document.txt
```

### What the Script Does

The script will:
- ✅ Read PDF files directly (or text files)
- ✅ Extract all pages and parse questions
- ✅ Identify question numbers (1-289)
- ✅ Extract question text and all 4 answers
- ✅ Mark the correct answer (A in source)
- ✅ Generate properly formatted JSON for the app
- ✅ Generate CSV file for easy review in Excel/Sheets
- ✅ Show progress and statistics
- ✅ Create extraction log showing any missing/skipped questions
- ✅ Report which questions couldn't be extracted and why

The script creates three files:
1. **questions.json** - For the study app
2. **questions.csv** - For review/editing in spreadsheet software
3. **questions_extraction_log.txt** - Detailed extraction report

### Extraction Log

The script automatically creates an extraction log file (e.g., `questions_extraction_log.txt`) that shows:
- Total questions extracted
- Questions that were skipped and why
- Complete list of missing question IDs
- Detailed reasons for each skipped question

This helps you identify which questions may need manual review.

### Installation

The script requires the `pypdf` library:

```bash
pip install pypdf
```

Or alternatively:

```bash
pip install PyPDF2
```

The script will work with either library.

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
- Flagged-question memory is stored in `localStorage`
- Flagged questions can also be exported/imported as JSON
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

### Adjusting Saved Flag Behavior

The browser memory uses the key `azf-flagged-question-ids` in `localStorage`. Exported files contain a `flaggedQuestionIds` array and timestamp.

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
