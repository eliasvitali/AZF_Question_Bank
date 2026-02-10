# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Set Up on GitHub Pages

1. Create a new GitHub repository (e.g., `azf-study-app`)
2. Upload these files:
   - `index.html`
   - `style.css`
   - `app.js`
   - `questions.json`

3. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Select "main" branch
   - Click Save

4. Access your app at: `https://yourusername.github.io/azf-study-app`

### Step 2: Add All 289 Questions (Optional)

The current `questions.json` contains 20 sample questions. To add all 289:

**Method 1: Extract from PDF (Recommended)**

1. Install the PDF library:
   ```bash
   pip install pypdf
   ```

2. Run the extraction script with your PDF:
   ```bash
   python3 extract_questions.py 2024Pruefungsfragen_AZF_pdf.pdf
   ```

3. Upload the generated `questions.json` to your GitHub repository

**Method 2: Extract from Text File**

1. Copy text from the PDF and save as `azf_document.txt`
2. Run:
   ```bash
   python3 extract_questions.py azf_document.txt
   ```

**Method 3: Manual Addition**

Edit `questions.json` and add questions in this format:
```json
{
  "id": 1,
  "question": "Question text?",
  "answers": [
    {"letter": "A", "text": "Correct answer", "correct": true},
    {"letter": "B", "text": "Wrong answer", "correct": false},
    {"letter": "C", "text": "Wrong answer", "correct": false},
    {"letter": "D", "text": "Wrong answer", "correct": false}
  ]
}
```

Note: The "letter" field is only used internally. The app reassigns display letters based on shuffled positions.

### Step 3: Start Studying!

Open the app and choose your mode:
- **Practice Mode** (default): Answers shuffled randomly
- **Study Mode**: Answers in order (A always correct)

## 📱 Features

✅ Randomized answer positions (like real exam)  
✅ Real-time progress tracking  
✅ Session statistics  
✅ Review wrong answers  
✅ Mobile-friendly  
✅ No server needed  

## 🎯 Study Tips

1. Start with **Study Mode** to learn content
2. Switch to **Practice Mode** to test yourself
3. Use **Review Mistakes** to focus on weak areas
4. Take multiple short sessions instead of one long one
5. Track your accuracy improvement over time

## 🛠️ Files Included

```
azf-study-app/
├── index.html              # Main app page
├── style.css              # Styling
├── app.js                 # Application logic
├── questions.json         # Question database (20 samples)
├── extract_questions.py   # Python extraction script
├── README.md             # Full documentation
└── QUICKSTART.md         # This file
```

## 💡 Tips

- The app works offline once loaded
- All progress is session-based (no data saved)
- Refresh page to start a new session
- Use shuffle button (🔀) to re-randomize current question

## 🐛 Troubleshooting

**Questions not loading?**
- Check that `questions.json` is in the same directory
- Open browser console (F12) to see errors

**App not working on GitHub Pages?**
- Wait a few minutes after enabling Pages
- Check that all files are uploaded
- Verify the URL is correct

## 📚 Next Steps

- Add all 289 questions using the extraction script
- Customize colors in `style.css`
- Add localStorage for persistent progress
- Share with fellow students!

---

**Good luck with your AZF exam! ✈️**
