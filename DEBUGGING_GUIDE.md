# Extraction Debugging Guide

## Why Questions Fail to Extract

If you're getting fewer than 289 questions, here's how to debug:

---

## Step 1: Check the Extraction Log

After running the extraction, open `questions_extraction_log.txt`:

```
Question 45:
  Reason: found 3 answers instead of 4
  Has question text: True
  Answers found: 3/4
  Answer letters found: A, B, D
  Question preview: What does the term "CLEARANCE LIMIT" mean...
```

This tells you:
- ✅ Question text was found
- ❌ Only 3 answers (A, B, D) - missing C
- 🔍 Preview shows the actual question

---

## Step 2: Understand Common Causes

### Cause 1: Page Breaks
**Symptom:** Question text found, but only 1-2 answers

**Why:** PDF page break splits the question across pages, parser stops at page boundary

**Fix:** The parser now handles this better, but some edge cases remain

---

### Cause 2: Footer Contamination (NOW FIXED ✅)
**Symptom:** Last answer on page has extra text

**Example:**
```
D Final answer Stand / As at:: 2024 richtige Antwort immer A
```

**Fix:** Footer filtering now removes:
- `Stand / As at:: 2024`
- `richtige Antwort immer A`
- `correct answer always A`
- `Seite / page X von / of 55`

---

### Cause 3: Special Formatting
**Symptom:** Question text too short or missing

**Why:** Question uses tables, images, or special layout

**Example:** Questions with diagrams or complex formatting

**Fix:** May need manual extraction for these questions

---

### Cause 4: Encoding Issues
**Symptom:** Random skips, garbled text

**Why:** PDF uses special characters or non-standard encoding

**Fix:** Try different PDF extraction tools or save as text manually

---

### Cause 5: Multi-line Answers
**Symptom:** Found 3 answers instead of 4

**Why:** Parser misidentifies where one answer ends and next begins

**Example:**
```
A This is a long answer
that continues on the next line
B This is answer B
```

Parser might think "that continues" is a separate line, not part of A

**Fix:** Improved parser now handles this better

---

## Step 3: Inspect the PDF Manually

For each missing question ID:

1. **Open the PDF** and go to that question number
2. **Check the format:**
   - Does it have exactly 4 answers (A, B, C, D)?
   - Is the question text normal or in a table/box?
   - Is there a page break in the middle?
3. **Note special cases** for manual addition

---

## Step 4: Manual Addition

If specific questions can't be auto-extracted, add them manually to `questions.json`:

```json
{
  "id": 45,
  "question": "What does the term CLEARANCE LIMIT mean?",
  "answers": [
    {"letter": "A", "text": "The point to which an aircraft is granted an air traffic control clearance", "correct": true},
    {"letter": "B", "text": "Wrong answer", "correct": false},
    {"letter": "C", "text": "Wrong answer", "correct": false},
    {"letter": "D", "text": "Wrong answer", "correct": false}
  ]
}
```

Add it in the appropriate position in the array (questions are ordered by ID).

---

## Step 5: Verify Your Fix

After manually adding questions:

```bash
# Check question count
python3 -c "import json; data = json.load(open('questions.json')); print(f'Total: {len(data)}')"

# Check for duplicates
python3 -c "import json; data = json.load(open('questions.json')); ids = [q['id'] for q in data]; print(f'Duplicates: {len(ids) - len(set(ids))}')"

# Check for gaps
python3 -c "import json; data = json.load(open('questions.json')); ids = sorted([q['id'] for q in data]); gaps = [i for i in range(1, 290) if i not in ids]; print(f'Missing: {gaps}')"
```

---

## Quick Reference: Parser Improvements

### ✅ Now Handles:
- Footer text removal
- Multi-line question text
- Multi-line answers
- Page headers/footers
- Common formatting variations

### ⚠️ May Still Struggle With:
- Tables and diagrams
- Image-based questions
- Extreme encoding issues
- Very unusual layouts

---

## When to Give Up on Auto-Extraction

If you're getting:
- **280+ questions (97%+)** → Good enough! Manually add the rest
- **250-280 questions (87-97%)** → Review logs, add critical ones manually
- **<250 questions (<87%)** → PDF might have serious formatting issues

For most cases, getting 268/289 (93%) is excellent, and you can manually add the remaining 21 questions.

---

## Tips for Best Results

1. **Use the official PDF** - scanned/converted PDFs may have issues
2. **Check PDF version** - newer PDFs may have better text extraction
3. **Try different PDF readers** - some extract text better than others
4. **Save as text** - if PDF extraction fails, copy/paste to .txt
5. **Report patterns** - if many questions fail for same reason, parser can be improved

---

**Remember:** 100% auto-extraction is hard. 95%+ is excellent. The remaining 5% can be added manually in a few minutes.
