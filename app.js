// AZF Exam Study App - Main Application
class StudyApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.sessionStats = {
            correct: 0,
            incorrect: 0,
            answered: []
        };
        this.studyMode = false; // false = shuffled answers, true = original order
        this.currentAnswerOrder = [];
        
        this.init();
    }
    
    async init() {
        await this.loadQuestions();
        this.setupEventListeners();
        this.displayQuestion();
        this.updateStats();
    }
    
    async loadQuestions() {
        try {
            const response = await fetch('questions.json');
            this.questions = await response.json();
            console.log(`Loaded ${this.questions.length} questions`);
        } catch (error) {
            console.error('Error loading questions:', error);
            // Fallback to embedded questions if fetch fails
            this.questions = this.getFallbackQuestions();
        }
    }
    
    getFallbackQuestions() {
        // Fallback questions in case JSON loading fails
        return [
            {
                "id": 1,
                "question": "Select the correct definition for \"ESTIMATED TIME OF ARRIVAL\" in respect to IFR flights:",
                "answers": [
                    {"letter": "A", "text": "The time at which it is estimated that the aircraft will arrive over that designated point defined by reference to navigation aids, from which it is intended, that an instrument approach will be commenced", "correct": true},
                    {"letter": "B", "text": "The time at which the aircraft will actually arrive over that designated point defined by reference to navigation aids, from which it is intended, that a visual approach will be commenced", "correct": false},
                    {"letter": "C", "text": "The time at which it is estimated that the aircraft will arrive over that designated point defined by reference to visual aids, from which it is intended, that an approach will be commenced", "correct": false},
                    {"letter": "D", "text": "In any case that time at which the aircraft will arrive over the aerodrome", "correct": false}
                ]
            }
        ];
    }
    
    setupEventListeners() {
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('finish-btn').addEventListener('click', () => this.finishSession());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartSession());
        document.getElementById('review-btn').addEventListener('click', () => this.reviewMistakes());
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffleCurrentAnswers());
        document.getElementById('study-mode-toggle').addEventListener('change', (e) => this.toggleStudyMode(e.target.checked));
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    getAnswerOrder() {
        const question = this.questions[this.currentQuestionIndex];
        if (this.studyMode) {
            // Study mode: show answers in original order (A always correct)
            return question.answers;
        } else {
            // Practice mode: shuffle answers
            return this.shuffleArray(question.answers);
        }
    }
    
    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        
        // Update question number
        document.getElementById('question-number').textContent = 
            `Question ${this.currentQuestionIndex + 1} of ${this.questions.length}`;
        
        // Update question text
        document.getElementById('question-text').textContent = question.question;
        
        // Get answer order (shuffled or original)
        this.currentAnswerOrder = this.getAnswerOrder();
        
        // Create answer options
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        
        this.currentAnswerOrder.forEach((answer, index) => {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-option';
            answerDiv.dataset.correct = answer.correct;
            answerDiv.dataset.index = index;
            
            answerDiv.innerHTML = `
                <span class="answer-letter">${answer.letter}</span>
                <span class="answer-text">${answer.text}</span>
            `;
            
            answerDiv.addEventListener('click', () => this.selectAnswer(index));
            answersContainer.appendChild(answerDiv);
        });
        
        // Hide feedback
        document.getElementById('feedback').style.display = 'none';
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }
    
    selectAnswer(index) {
        const answersContainer = document.getElementById('answers-container');
        const answerOptions = answersContainer.querySelectorAll('.answer-option');
        
        // Check if already answered
        if (answerOptions[0].classList.contains('disabled')) {
            return;
        }
        
        const selectedAnswer = this.currentAnswerOrder[index];
        const isCorrect = selectedAnswer.correct;
        
        // Mark all as disabled
        answerOptions.forEach(option => option.classList.add('disabled'));
        
        // Mark selected
        answerOptions[index].classList.add('selected');
        
        // Show correct/incorrect
        answerOptions.forEach((option, i) => {
            if (this.currentAnswerOrder[i].correct) {
                option.classList.add('correct');
            } else if (i === index && !isCorrect) {
                option.classList.add('incorrect');
            }
        });
        
        // Show feedback
        const feedback = document.getElementById('feedback');
        feedback.style.display = 'block';
        
        if (isCorrect) {
            feedback.className = 'feedback correct';
            feedback.textContent = '✅ Correct! Well done!';
            this.sessionStats.correct++;
        } else {
            feedback.className = 'feedback incorrect';
            const correctAnswer = this.currentAnswerOrder.find(a => a.correct);
            feedback.textContent = `❌ Incorrect. The correct answer is ${correctAnswer.letter}.`;
            this.sessionStats.incorrect++;
        }
        
        // Record answer
        this.sessionStats.answered[this.currentQuestionIndex] = {
            questionId: this.questions[this.currentQuestionIndex].id,
            correct: isCorrect,
            selectedAnswer: selectedAnswer.letter,
            correctAnswer: this.currentAnswerOrder.find(a => a.correct).letter
        };
        
        // Enable next button
        document.getElementById('next-btn').disabled = false;
        
        // Update stats
        this.updateStats();
        
        // Show finish button on last question
        if (this.currentQuestionIndex === this.questions.length - 1) {
            document.getElementById('finish-btn').style.display = 'inline-flex';
        }
    }
    
    shuffleCurrentAnswers() {
        if (!this.studyMode) {
            this.displayQuestion();
        }
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        // Next button disabled until answer is selected
        const answered = this.sessionStats.answered[this.currentQuestionIndex];
        nextBtn.disabled = !answered;
    }
    
    updateStats() {
        const totalAnswered = this.sessionStats.correct + this.sessionStats.incorrect;
        const accuracy = totalAnswered > 0 
            ? Math.round((this.sessionStats.correct / totalAnswered) * 100) 
            : 0;
        
        document.getElementById('progress').textContent = 
            `${totalAnswered} / ${this.questions.length}`;
        document.getElementById('correct-count').textContent = this.sessionStats.correct;
        document.getElementById('incorrect-count').textContent = this.sessionStats.incorrect;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }
    
    toggleStudyMode(enabled) {
        this.studyMode = enabled;
        
        const modeText = document.getElementById('mode-text');
        const modeDescription = document.getElementById('mode-description');
        const shuffleBtn = document.getElementById('shuffle-btn');
        
        if (enabled) {
            modeText.textContent = 'Study Mode';
            modeDescription.textContent = '(Answer A always correct)';
            shuffleBtn.style.display = 'none';
        } else {
            modeText.textContent = 'Practice Mode';
            modeDescription.textContent = '(Answers shuffled)';
            shuffleBtn.style.display = 'block';
        }
        
        // Redisplay current question with new mode
        this.displayQuestion();
    }
    
    finishSession() {
        // Hide question card and controls
        document.getElementById('question-card').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.mode-toggle').style.display = 'none';
        
        // Show results
        const resultsPanel = document.getElementById('results-panel');
        resultsPanel.style.display = 'block';
        
        const totalAnswered = this.sessionStats.correct + this.sessionStats.incorrect;
        const percentage = totalAnswered > 0 
            ? Math.round((this.sessionStats.correct / totalAnswered) * 100) 
            : 0;
        
        document.getElementById('result-total').textContent = this.questions.length;
        document.getElementById('result-correct').textContent = this.sessionStats.correct;
        document.getElementById('result-incorrect').textContent = this.sessionStats.incorrect;
        document.getElementById('result-percentage').textContent = `${percentage}%`;
    }
    
    restartSession() {
        // Reset stats
        this.sessionStats = {
            correct: 0,
            incorrect: 0,
            answered: []
        };
        this.currentQuestionIndex = 0;
        
        // Hide results
        document.getElementById('results-panel').style.display = 'none';
        
        // Show question card and controls
        document.getElementById('question-card').style.display = 'block';
        document.querySelector('.controls').style.display = 'flex';
        document.querySelector('.mode-toggle').style.display = 'flex';
        document.getElementById('finish-btn').style.display = 'none';
        
        // Display first question
        this.displayQuestion();
        this.updateStats();
    }
    
    reviewMistakes() {
        // Filter questions that were answered incorrectly
        const mistakes = this.sessionStats.answered
            .map((answer, index) => ({ ...answer, index }))
            .filter(answer => answer && !answer.correct);
        
        if (mistakes.length === 0) {
            alert('Great job! You didn\'t make any mistakes! 🎉');
            return;
        }
        
        // Create a review session with just the mistakes
        alert(`You will review ${mistakes.length} question(s) that were answered incorrectly.`);
        
        // Reset and start review
        this.sessionStats = {
            correct: 0,
            incorrect: 0,
            answered: []
        };
        
        // Set current question to first mistake
        this.currentQuestionIndex = mistakes[0].index;
        
        // Hide results
        document.getElementById('results-panel').style.display = 'none';
        
        // Show question card and controls
        document.getElementById('question-card').style.display = 'block';
        document.querySelector('.controls').style.display = 'flex';
        document.querySelector('.mode-toggle').style.display = 'flex';
        document.getElementById('finish-btn').style.display = 'none';
        
        this.displayQuestion();
        this.updateStats();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyApp();
});
