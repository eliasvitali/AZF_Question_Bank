#!/usr/bin/env python3
"""
AZF Question Extractor
Extracts all questions from the AZF exam PDF document into questions.json format
"""

import json
import re
import sys

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
            
            # Split into lines
            lines = [line.strip() for line in q_block.split('\n') if line.strip()]
            
            # Separate question text from answers
            question_lines = []
            answer_lines = []
            in_answers = False
            
            for line in lines:
                # Check if this line starts with A, B, C, or D followed by space
                if re.match(r'^[ABCD]\s+', line):
                    in_answers = True
                    answer_lines.append(line)
                elif in_answers:
                    # Continue current answer or start new one
                    if re.match(r'^[ABCD]\s+', line):
                        answer_lines.append(line)
                    else:
                        # Continuation of previous answer
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
                    text = match.group(2)
                    current_answer = {
                        'letter': letter,
                        'text': text,
                        'correct': letter == 'A'  # A is always correct
                    }
                elif current_answer:
                    # Continue current answer text
                    current_answer['text'] += ' ' + line
            
            # Add last answer
            if current_answer:
                answers.append(current_answer)
            
            # Validate: should have exactly 4 answers
            if len(answers) == 4 and question_text:
                questions.append({
                    'id': q_num,
                    'question': question_text,
                    'answers': answers
                })
                print(f"✓ Extracted question {q_num}")
            else:
                print(f"⚠ Skipped question {q_num} (incomplete: {len(answers)} answers)")
        
        except Exception as e:
            print(f"✗ Error processing question block: {e}")
            continue
    
    return questions


def main():
    print("AZF Question Extractor")
    print("=" * 50)
    print()
    
    # Check if document text is provided
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        print(f"Reading from file: {input_file}")
        with open(input_file, 'r', encoding='utf-8') as f:
            document_text = f.read()
    else:
        print("Reading from stdin...")
        print("Paste the document text and press Ctrl+D (Unix) or Ctrl+Z (Windows) when done:")
        print()
        document_text = sys.stdin.read()
    
    print()
    print("Parsing document...")
    print()
    
    # Extract questions
    questions = parse_azf_document(document_text)
    
    print()
    print("=" * 50)
    print(f"Extraction complete: {len(questions)} questions found")
    print()
    
    # Save to JSON
    output_file = 'questions.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved to {output_file}")
    print()
    
    # Show sample
    if questions:
        print("Sample question:")
        print(json.dumps(questions[0], indent=2, ensure_ascii=False))
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
