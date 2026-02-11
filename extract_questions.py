#!/usr/bin/env python3
"""
AZF Question Extractor
Extracts all questions from the AZF exam PDF document into questions.json format

Usage:
    python3 extract_questions.py <input_file.pdf> [output_file.json]

Example:
    python3 extract_questions.py 2024Pruefungsfragen_AZF_pdf.pdf questions.json

Requirements:
    pip install pypdf
    (or: pip install PyPDF2)
"""

import json
import re
import sys
import os

# Try to import PDF library
PDF_LIBRARY = None
try:
    import pypdf
    PDF_LIBRARY = 'pypdf'
except ImportError:
    try:
        import PyPDF2
        PDF_LIBRARY = 'PyPDF2'
    except ImportError:
        pass

if PDF_LIBRARY is None:
    print("Error: No PDF library is installed.")
    print("Please install one with:")
    print("  pip install pypdf")
    print("  or: pip install PyPDF2")
    print()
    print("After installing, you can extract questions from PDF files directly.")
    print("Alternatively, you can provide a .txt file with the extracted text.")
    # Don't exit - allow text file processing
    PDF_AVAILABLE = False
else:
    PDF_AVAILABLE = True
    print(f"Using PDF library: {PDF_LIBRARY}")

def read_pdf_file(pdf_path):
    """
    Extract text from a PDF file using available PDF library.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text as a string
    """
    if not PDF_AVAILABLE:
        print("Error: Cannot read PDF files - no PDF library installed")
        print("Please install: pip install pypdf")
        return None
    
    try:
        with open(pdf_path, 'rb') as file:
            if PDF_LIBRARY == 'pypdf':
                pdf_reader = pypdf.PdfReader(file)
            else:  # PyPDF2
                pdf_reader = PyPDF2.PdfReader(file)
            
            print(f"   PDF has {len(pdf_reader.pages)} pages")
            print("   Extracting text...")
            
            text = ""
            for i, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += page_text + "\n"
                if (i + 1) % 10 == 0:
                    print(f"   Processed {i + 1} pages...")
            
            print(f"   Extraction complete!")
            return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None


def parse_azf_document(text):
    """
    Parse the full AZF examination document and extract all questions.
    
    Expected format:
    - Question number (1-289)
    - Question text
    - A [correct answer]
    - B [wrong answer]
    - C [wrong answer]
    - D [wrong answer]
    """
    
    questions = []
    skipped_questions = []
    
    # Clean up the text first - remove footers
    # Footer pattern: "Stand / As at:: 2024" or similar
    text = re.sub(r'Stand / As at::.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'richtige Antwort immer A /.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'correct answer always A.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Seite / page \d+ von / of \d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'Prüfungsfragen im Prüfungsteil.*?(?=\n|$)', '', text, flags=re.IGNORECASE)
    
    # Split by question numbers
    # Pattern: newline followed by digit(s) and space
    parts = re.split(r'\n(\d+)\s+', text)
    
    # Process each question block
    for i in range(1, len(parts), 2):
        if i + 1 >= len(parts):
            break
        
        try:
            q_num = int(parts[i].strip())
            q_block = parts[i + 1]
            
            # Additional cleanup for this block - remove any remaining footer fragments
            q_block = re.sub(r'Stand / As at::.*', '', q_block, flags=re.IGNORECASE | re.DOTALL)
            q_block = re.sub(r'Seite / page.*', '', q_block, flags=re.IGNORECASE)
            
            # Split into lines and clean
            lines = [line.strip() for line in q_block.split('\n') if line.strip()]
            
            # Remove any lines that are just page numbers or headers
            lines = [line for line in lines if not re.match(r'^(Seite|page|\d+\s*/\s*\d+)', line, re.IGNORECASE)]
            
            # Separate question text from answers
            question_lines = []
            answer_lines = []
            in_answers = False
            
            for line in lines:
                # Skip header/footer lines
                if re.match(r'(Stand|richtige|correct|Prüfungsfragen)', line, re.IGNORECASE):
                    continue
                    
                # Check if this line starts with A, B, C, or D followed by space
                if re.match(r'^[ABCD]\s+', line):
                    in_answers = True
                    answer_lines.append(line)
                elif in_answers:
                    # If we see another answer letter, it's a new answer
                    if re.match(r'^[ABCD]\s+', line):
                        answer_lines.append(line)
                    else:
                        # Continuation of previous answer (unless it's footer junk)
                        if not re.match(r'(Stand|richtige|correct|Seite|page)', line, re.IGNORECASE):
                            answer_lines.append(line)
                else:
                    question_lines.append(line)
            
            # Build question text
            question_text = ' '.join(question_lines).strip()
            
            # Parse answers
            answers = []
            current_answer = None
            
            for line in answer_lines:
                match = re.match(r'^([ABCD])\s+(.+)', line)
                if match:
                    # Save previous answer
                    if current_answer:
                        answers.append(current_answer)
                    
                    # Start new answer
                    letter = match.group(1)
                    text_part = match.group(2)
                    current_answer = {
                        'letter': letter,
                        'text': text_part,
                        'correct': letter == 'A'  # A is always correct
                    }
                elif current_answer:
                    # Continue current answer text (skip if it's header/footer)
                    if not re.match(r'(Stand|richtige|correct|Seite|page)', line, re.IGNORECASE):
                        current_answer['text'] += ' ' + line
            
            # Add last answer
            if current_answer:
                answers.append(current_answer)
            
            # Clean up answer texts - remove any trailing footer fragments
            for ans in answers:
                ans['text'] = re.sub(r'\s*(Stand / As at::.*|richtige Antwort.*|correct answer.*|Seite.*|page.*)$', 
                                    '', ans['text'], flags=re.IGNORECASE).strip()
            
            # Validate: should have exactly 4 answers and question text
            if len(answers) == 4 and question_text and len(question_text) > 10:
                questions.append({
                    'id': q_num,
                    'question': question_text,
                    'answers': answers
                })
                print(f"✓ Extracted question {q_num}")
            else:
                reason = []
                if not question_text or len(question_text) <= 10:
                    reason.append(f"question text too short ({len(question_text)} chars)")
                if len(answers) != 4:
                    reason.append(f"found {len(answers)} answers instead of 4")
                
                reason_str = ", ".join(reason)
                skipped_questions.append({
                    'id': q_num,
                    'reason': reason_str,
                    'answers_found': len(answers),
                    'has_question': bool(question_text),
                    'question_preview': question_text[:100] if question_text else "N/A",
                    'answer_letters': [a['letter'] for a in answers]
                })
                print(f"⚠ Skipped question {q_num} ({reason_str})")
        
        except Exception as e:
            q_num_val = q_num if 'q_num' in locals() else 'unknown'
            print(f"✗ Error processing question {q_num_val}: {e}")
            skipped_questions.append({
                'id': q_num_val,
                'reason': f"Exception: {str(e)}",
                'answers_found': 0,
                'has_question': False,
                'question_preview': "N/A",
                'answer_letters': []
            })
            continue
    
    return questions, skipped_questions


def main():
    print("AZF Question Extractor")
    print("=" * 50)
    if PDF_AVAILABLE:
        print(f"PDF support: ✓ ({PDF_LIBRARY})")
    else:
        print("PDF support: ✗ (text files only)")
    print()
    
    # Check if input file is provided
    if len(sys.argv) < 2:
        print("Error: Please provide an input file")
        print()
        print("Usage:")
        print(f"  python3 {sys.argv[0]} <input_file.pdf> [output_file.json]")
        print(f"  python3 {sys.argv[0]} <input_file.txt> [output_file.json]")
        print()
        print("Example:")
        print(f"  python3 {sys.argv[0]} 2024Pruefungsfragen_AZF_pdf.pdf")
        print(f"  python3 {sys.argv[0]} azf_document.txt my_questions.json")
        print()
        print("The script accepts both PDF files and text files.")
        if not PDF_AVAILABLE:
            print("Note: Install 'pypdf' to enable PDF support: pip install pypdf")
        print("If no output file is specified, 'questions.json' will be used.")
        return 1
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'questions.json'
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found")
        return 1
    
    # Determine file type and read content
    file_ext = os.path.splitext(input_file)[1].lower()
    
    try:
        if file_ext == '.pdf':
            if not PDF_AVAILABLE:
                print("Error: Cannot read PDF files - no PDF library installed")
                print("Please install: pip install pypdf")
                print("Or convert your PDF to text and provide a .txt file")
                return 1
            print(f"📄 Reading PDF file: {input_file}")
            document_text = read_pdf_file(input_file)
            if document_text is None:
                return 1
        else:
            # Assume text file
            print(f"📄 Reading text file: {input_file}")
            with open(input_file, 'r', encoding='utf-8') as f:
                document_text = f.read()
        
        print(f"   Extracted {len(document_text)} characters")
    except Exception as e:
        print(f"Error reading file: {e}")
        return 1
    
    print()
    print("🔍 Parsing document...")
    print()
    
    # Extract questions
    questions, skipped_questions = parse_azf_document(document_text)
    
    print()
    print("=" * 50)
    print(f"✅ Extraction complete: {len(questions)} questions found")
    
    # Report on expected vs actual
    expected_total = 289
    if len(questions) < expected_total:
        missing_count = expected_total - len(questions)
        print(f"⚠️  Warning: {missing_count} questions missing (expected {expected_total})")
    
    print()
    
    # Save to JSON
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Saved to: {output_file}")
        print(f"   File size: {os.path.getsize(output_file)} bytes")
    except Exception as e:
        print(f"Error saving file: {e}")
        return 1
    
    # Save extraction log
    log_file = output_file.replace('.json', '_extraction_log.txt')
    try:
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write("AZF Question Extraction Log\n")
            f.write("=" * 70 + "\n\n")
            f.write(f"Total questions extracted: {len(questions)}\n")
            f.write(f"Questions skipped: {len(skipped_questions)}\n")
            f.write(f"Expected total: {expected_total}\n")
            f.write(f"Missing: {expected_total - len(questions)}\n\n")
            
            if skipped_questions:
                f.write("Skipped Questions (Detailed):\n")
                f.write("=" * 70 + "\n\n")
                for skip in skipped_questions:
                    f.write(f"Question {skip['id']}:\n")
                    f.write(f"  Reason: {skip['reason']}\n")
                    f.write(f"  Has question text: {skip['has_question']}\n")
                    f.write(f"  Answers found: {skip['answers_found']}/4\n")
                    if skip.get('answer_letters'):
                        f.write(f"  Answer letters found: {', '.join(skip['answer_letters'])}\n")
                    if skip.get('question_preview'):
                        f.write(f"  Question preview: {skip['question_preview']}\n")
                    f.write("\n")
            
            # Find missing question IDs
            extracted_ids = set(q['id'] for q in questions)
            expected_ids = set(range(1, expected_total + 1))
            missing_ids = expected_ids - extracted_ids
            
            if missing_ids:
                f.write("\nMissing Question IDs:\n")
                f.write("=" * 70 + "\n")
                missing_list = sorted(list(missing_ids))
                
                # Group consecutive IDs for readability
                ranges = []
                start = missing_list[0]
                end = missing_list[0]
                
                for num in missing_list[1:]:
                    if num == end + 1:
                        end = num
                    else:
                        if start == end:
                            ranges.append(str(start))
                        else:
                            ranges.append(f"{start}-{end}")
                        start = num
                        end = num
                
                # Add last range
                if start == end:
                    ranges.append(str(start))
                else:
                    ranges.append(f"{start}-{end}")
                
                f.write(f"{', '.join(ranges)}\n\n")
                f.write(f"Total missing: {len(missing_list)}\n\n")
                
                # Add helpful notes
                f.write("\nTroubleshooting Tips:\n")
                f.write("-" * 70 + "\n")
                f.write("If questions are missing:\n")
                f.write("1. Check the PDF for special formatting (tables, images, etc.)\n")
                f.write("2. Look for page breaks in the middle of questions\n")
                f.write("3. Verify the question has exactly 4 answers (A, B, C, D)\n")
                f.write("4. Check if footer text is interfering with parsing\n")
                f.write("5. Manually add missing questions to questions.json if needed\n")
        
        print(f"📋 Extraction log saved to: {log_file}")
    except Exception as e:
        print(f"Warning: Could not save log file: {e}")
    
    print()
    
    # Show sample
    if questions:
        print("📋 Sample question:")
        print("-" * 50)
        sample = questions[0]
        print(f"ID: {sample['id']}")
        print(f"Q:  {sample['question'][:100]}...")
        print(f"A:  {sample['answers'][0]['text'][:60]}... [correct]")
        print("-" * 50)
    
    print()
    
    # Show summary
    if skipped_questions:
        print(f"⚠️  {len(skipped_questions)} question(s) were skipped during extraction")
        print(f"   Check {log_file} for details")
        print()
    
    print(f"🎉 Done! You can now use {output_file} in your study app.")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
