# Changelog - Bug Fixes

## Version 1.1 - Bug Fixes and Improvements

### Fixed Issues

#### 1. ✅ Question Answer Persistence (Critical Bug Fix)

**Problem:** Users could answer the same question multiple times, and each answer would count toward the session statistics, inflating scores.

**Solution:** 
- Questions now remember if they've been answered in the current session
- Once answered, a question cannot be re-answered
- When navigating back to an answered question:
  - The selected answer is highlighted
  - The correct answer is shown in green
  - The feedback is displayed
  - Click events are disabled
- Session stats only count the first answer for each question

**Code Changes:**
- `app.js` - `displayQuestion()`: Now checks if question was previously answered
- `app.js` - `selectAnswer()`: Added guard clause to prevent re-answering

**Testing:**
- Answer question #5, go to question #6, return to question #5
- Expected: Question #5 shows your previous answer, cannot be clicked
- Result: ✅ Working correctly

---

#### 2. ✅ Extraction Logging and Missing Question Reporting

**Problem:** 
- Script extracted 268/289 questions but didn't report which ones were missing
- No way to know why questions failed to extract
- Difficult to troubleshoot extraction issues

**Solution:**
- Added comprehensive extraction logging
- Creates `*_extraction_log.txt` file alongside the JSON output
- Reports:
  - Total extracted vs expected (268/289)
  - Complete list of missing question IDs
  - Detailed reasons for each skipped question
  - What was found (question text, number of answers)

**Log File Contains:**
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

Missing Question IDs:
--------------------------------------------------
[45, 67, 89, ...]
```

**Code Changes:**
- `extract_questions.py` - `parse_azf_document()`: Now returns tuple (questions, skipped_questions)
- `extract_questions.py` - `main()`: Creates extraction log file
- Enhanced error reporting with specific reasons

**Benefits:**
- Users can see exactly which questions failed
- Easier to identify patterns in extraction failures
- Can manually add missing questions if needed
- Better debugging for PDF format issues

---

### Additional Improvements

#### Enhanced User Experience
- Previous answers are preserved when navigating
- Visual feedback shows answered vs unanswered questions
- Stats remain accurate throughout session

#### Better Error Reporting
- Extraction log provides actionable information
- Clear distinction between different failure types
- Missing question IDs listed for easy reference

---

## Files Modified

1. **app.js** (2 changes)
   - `displayQuestion()` - Added answer persistence logic
   - `selectAnswer()` - Added re-answer prevention

2. **extract_questions.py** (2 changes)
   - `parse_azf_document()` - Added skipped question tracking
   - `main()` - Added extraction log generation

3. **README.md** - Added extraction log documentation

4. **EXTRACTION_GUIDE.md** - Added section on understanding extraction logs

---

## Testing Completed

### App Testing
- ✅ Answer persistence across navigation
- ✅ Stats accuracy (correct/incorrect/total)
- ✅ Session completion with all questions
- ✅ Review mistakes feature

### Extraction Testing
- ✅ Log file creation
- ✅ Missing question ID reporting
- ✅ Skipped question reasons
- ✅ Summary statistics

---

## Known Limitations

### Extraction
- Some questions may still fail due to:
  - Complex formatting (tables, special layouts)
  - PDF encoding issues
  - Page breaks within questions
- These can be manually added to questions.json

### App
- Session data is not persisted between page refreshes
- Future enhancement: Add localStorage for session persistence

---

## Usage Notes

### For Users
1. Go through all questions in one session
2. Navigate freely - answers are remembered
3. Check your final score
4. Use "Review Mistakes" to study errors

### For Developers
1. Check extraction log after running script
2. Review missing questions in original PDF
3. Manually add any critical missing questions
4. Consider improving parser for specific edge cases

---

**All critical bugs fixed and ready for use!** ✅
