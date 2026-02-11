# Question Extraction Guide

## How to Extract All 289 Questions from the AZF PDF

This guide will help you extract all questions from the official AZF examination PDF.

---

## Method 1: Direct PDF Extraction (Easiest)

### Prerequisites

Install the PDF library:

```bash
pip install pypdf
```

Or alternatively:

```bash
pip install PyPDF2
```

### Steps

1. **Get the PDF file**
   - Download the official AZF exam PDF: `2024Pruefungsfragen_AZF_pdf.pdf`
   - Make sure it's in the same directory as `extract_questions.py`

2. **Run the script**
   
   ```bash
   python3 extract_questions.py 2024Pruefungsfragen_AZF_pdf.pdf
   ```

3. **Done!**
   - The script creates `questions.json` with all 289 questions
   - Upload this file to your GitHub repository

### Example Output

```
AZF Question Extractor
==================================================
PDF support: ✓ (pypdf)

📄 Reading PDF file: 2024Pruefungsfragen_AZF_pdf.pdf
   PDF has 55 pages
   Extracting text...
   Processed 10 pages...
   Processed 20 pages...
   Processed 30 pages...
   Processed 40 pages...
   Processed 50 pages...
   Extraction complete!
   Extracted 125,432 characters

🔍 Parsing document...

✓ Extracted question 1
✓ Extracted question 2
✓ Extracted question 3
...
✓ Extracted question 289

==================================================
✅ Extraction complete: 289 questions found

💾 Saved to: questions.json
   File size: 458,921 bytes

📋 Sample question:
--------------------------------------------------
ID: 1
Q:  Select the correct definition for "ESTIMATED TIME OF ARRIVAL"...
A:  The time at which it is estimated that the aircraft will arr... [correct]
--------------------------------------------------

🎉 Done! You can now use questions.json in your study app.
```

---

## Method 2: Text File Extraction (Alternative)

If you can't install the PDF library or prefer to work with text:

### Steps

1. **Extract text from PDF manually**
   - Open the PDF in a PDF reader
   - Select all text (Ctrl+A / Cmd+A)
   - Copy and paste into a text file
   - Save as `azf_document.txt`

2. **Run the script**
   
   ```bash
   python3 extract_questions.py azf_document.txt
   ```

3. **Done!**
   - The script creates `questions.json`

---

## Custom Output File

To specify a different output filename:

```bash
python3 extract_questions.py 2024Pruefungsfragen_AZF_pdf.pdf my_questions.json
```

---

## Troubleshooting

### "No PDF library installed"

Install the required library:

```bash
pip install pypdf
```

If that doesn't work, try:

```bash
pip3 install pypdf
```

Or:

```bash
python -m pip install pypdf
```

### "File not found"

Make sure:
- The PDF file is in the current directory
- The filename is spelled correctly (case-sensitive on Linux/Mac)
- You're running the command from the correct directory

### Script extracts fewer than 289 questions

This usually means:
- The PDF format is different from expected
- Some questions are malformed
- Check the output to see which questions were skipped

The script will show warnings for any skipped questions.

---

## Understanding the Extraction Log

The script creates an extraction log file (e.g., `questions_extraction_log.txt`) that contains:

### What's in the Log

1. **Summary Statistics**
   - Total questions extracted
   - Questions skipped
   - Expected vs actual count

2. **Skipped Questions**
   - Question ID
   - Reason for skipping (e.g., "found 3 answers instead of 4")
   - What was found (question text, number of answers)

3. **Missing Question IDs**
   - Complete list of question numbers not found
   - Helps identify gaps in extraction

### Example Log Output

```
AZF Question Extraction Log
==================================================

Total questions extracted: 268
Questions skipped: 21
Expected total: 289
Missing: 21

Skipped Questions:
--------------------------------------------------
Question 45: found 3 answers instead of 4
  - Has question text: True
  - Answers found: 3/4

Question 127: no question text, found 2 answers instead of 4
  - Has question text: False
  - Answers found: 2/4

Missing Question IDs:
--------------------------------------------------
[45, 67, 89, 127, 156, ...]

Total missing: 21
```

### What to Do About Missing Questions

If questions are missing:

1. **Check the log** - See which specific questions failed and why
2. **Review the PDF** - Look at those question numbers in the original PDF
3. **Common issues**:
   - Formatting differences (tables, special characters)
   - Page breaks in the middle of questions
   - Multi-line answers that confused the parser
4. **Manual addition** - Add missing questions manually to `questions.json`

---

## Verifying the Output

After extraction, check the generated `questions.json`:

```bash
# Count questions (should be 289)
python3 -c "import json; data = json.load(open('questions.json')); print(f'Total questions: {len(data)}')"

# View first question
python3 -c "import json; data = json.load(open('questions.json')); print(json.dumps(data[0], indent=2))"
```

---

## Using the Generated File

1. **For GitHub Pages deployment:**
   - Upload `questions.json` to your repository
   - Commit and push the changes
   - The app will automatically use the new questions

2. **For local testing:**
   - Place `questions.json` in the same directory as `index.html`
   - Open `index.html` in your browser

---

## Need Help?

If you encounter issues:

1. Check that the PDF file is the official AZF exam PDF
2. Ensure Python 3.6+ is installed: `python3 --version`
3. Verify the PDF library is installed: `python3 -c "import pypdf"`
4. Try the text file method instead

---

**Happy studying! ✈️**
