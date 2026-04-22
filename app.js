// AZF Exam Study App - Main Application
class StudyApp {
    constructor() {
        this.storageKey = 'azf-flagged-question-ids';
        this.questions = [];
        this.activeQuestions = [];
        this.currentQuestionIndex = 0;
        this.sessionStats = this.getEmptySessionStats();
        this.studyMode = false; // false = shuffled answers, true = original order
        this.currentAnswerOrder = [];
        this.flaggedQuestionIds = new Set();
        this.showFlaggedOnly = false;

        this.init();
    }

    getEmptySessionStats() {
        return {
            correct: 0,
            incorrect: 0,
            answered: []
        };
    }

    async init() {
        this.loadFlaggedQuestionsFromStorage();
        await this.loadQuestions();
        this.setupEventListeners();
        this.rebuildActiveQuestions();
        this.updateFlaggedCount();
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
            this.questions = this.getFallbackQuestions();
        }
    }

    loadFlaggedQuestionsFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                return;
            }

            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                this.flaggedQuestionIds = new Set(parsed.filter(id => Number.isInteger(id)));
            }
        } catch (error) {
            console.warn('Could not load saved flagged questions:', error);
        }
    }

    saveFlaggedQuestionsToStorage() {
        localStorage.setItem(
            this.storageKey,
            JSON.stringify(this.getSortedFlaggedIds())
        );
    }

    getSortedFlaggedIds() {
        return [...this.flaggedQuestionIds].sort((a, b) => a - b);
    }

    getFallbackQuestions() {
        return [
            {
                id: 1,
                question: 'Select the correct definition for "ESTIMATED TIME OF ARRIVAL" in respect to IFR flights:',
                answers: [
                    { letter: 'A', text: 'The time at which it is estimated that the aircraft will arrive over that designated point defined by reference to navigation aids, from which it is intended, that an instrument approach will be commenced', correct: true },
                    { letter: 'B', text: 'The time at which the aircraft will actually arrive over that designated point defined by reference to navigation aids, from which it is intended, that a visual approach will be commenced', correct: false },
                    { letter: 'C', text: 'The time at which it is estimated that the aircraft will arrive over that designated point defined by reference to visual aids, from which it is intended, that an approach will be commenced', correct: false },
                    { letter: 'D', text: 'In any case that time at which the aircraft will arrive over the aerodrome', correct: false }
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
        document.getElementById('flag-btn').addEventListener('click', () => this.toggleCurrentQuestionFlag());
        document.getElementById('flagged-only-toggle').addEventListener('change', (e) => this.toggleFlaggedOnlyMode(e.target.checked));
        document.getElementById('export-flags-btn').addEventListener('click', () => this.exportFlaggedQuestions());
        document.getElementById('import-flags-input').addEventListener('change', (e) => this.importFlaggedQuestions(e));
        document.getElementById('clear-flags-btn').addEventListener('click', () => this.clearFlaggedQuestions());
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getCurrentQuestion() {
        return this.activeQuestions[this.currentQuestionIndex] || null;
    }

    rebuildActiveQuestions() {
        this.activeQuestions = this.showFlaggedOnly
            ? this.questions.filter(question => this.flaggedQuestionIds.has(question.id))
            : [...this.questions];

        if (this.currentQuestionIndex >= this.activeQuestions.length) {
            this.currentQuestionIndex = Math.max(this.activeQuestions.length - 1, 0);
        }
    }

    resetSessionForCurrentQuestionSet() {
        this.sessionStats = this.getEmptySessionStats();
        this.currentQuestionIndex = 0;
        document.getElementById('results-panel').style.display = 'none';
        document.getElementById('question-card').style.display = 'block';
        document.querySelector('.controls').style.display = 'flex';
        document.querySelector('.mode-toggle').style.display = 'flex';
        document.getElementById('finish-btn').style.display = 'none';
    }

    getAnswerOrder() {
        const question = this.getCurrentQuestion();
        if (!question) {
            return [];
        }

        if (this.studyMode) {
            return question.answers;
        }

        return this.shuffleArray(question.answers);
    }

    displayQuestion() {
        const question = this.getCurrentQuestion();
        const questionText = document.getElementById('question-text');
        const questionNumber = document.getElementById('question-number');
        const answersContainer = document.getElementById('answers-container');
        const feedback = document.getElementById('feedback');
        const flagBtn = document.getElementById('flag-btn');
        const flagBtnText = document.getElementById('flag-btn-text');
        const finishBtn = document.getElementById('finish-btn');

        if (!question) {
            questionNumber.textContent = this.showFlaggedOnly
                ? 'Flagged Study List'
                : 'No Questions Available';
            questionText.textContent = this.showFlaggedOnly
                ? 'You do not have any flagged questions yet. Flag questions during a normal session, or import a saved flagged file to focus on them here.'
                : 'No questions could be loaded.';
            answersContainer.innerHTML = '';
            feedback.style.display = 'block';
            feedback.className = 'feedback info';
            feedback.textContent = this.showFlaggedOnly
                ? 'Tip: use the star button to build your difficult-question list.'
                : 'Please check that questions.json is available.';
            flagBtn.disabled = true;
            flagBtn.setAttribute('aria-pressed', 'false');
            flagBtnText.textContent = 'Flag';
            finishBtn.style.display = 'none';
            this.updateNavigationButtons();
            this.updateModeAvailability();
            return;
        }

        questionNumber.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.activeQuestions.length}`;
        questionText.textContent = question.question;

        this.currentAnswerOrder = this.getAnswerOrder();
        answersContainer.innerHTML = '';

        const displayLetters = ['A', 'B', 'C', 'D'];
        const previousAnswer = this.sessionStats.answered[this.currentQuestionIndex];
        const isAlreadyAnswered = previousAnswer !== undefined;

        this.currentAnswerOrder.forEach((answer, index) => {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-option';
            answerDiv.dataset.correct = String(answer.correct);
            answerDiv.dataset.index = String(index);

            if (isAlreadyAnswered) {
                answerDiv.classList.add('disabled');

                if (previousAnswer.selectedAnswer === displayLetters[index]) {
                    answerDiv.classList.add('selected');
                    if (!previousAnswer.correct) {
                        answerDiv.classList.add('incorrect');
                    }
                }

                if (answer.correct) {
                    answerDiv.classList.add('correct');
                }
            }

            answerDiv.innerHTML = `
                <span class="answer-letter">${displayLetters[index]}</span>
                <span class="answer-text">${answer.text}</span>
            `;

            if (!isAlreadyAnswered) {
                answerDiv.addEventListener('click', () => this.selectAnswer(index));
            }

            answersContainer.appendChild(answerDiv);
        });

        if (isAlreadyAnswered) {
            feedback.style.display = 'block';
            if (previousAnswer.correct) {
                feedback.className = 'feedback correct';
                feedback.textContent = 'Correct! Well done!';
            } else {
                feedback.className = 'feedback incorrect';
                feedback.textContent = `Incorrect. The correct answer is ${previousAnswer.correctAnswer}.`;
            }
        } else {
            feedback.style.display = 'none';
        }

        const isFlagged = this.flaggedQuestionIds.has(question.id);
        flagBtn.disabled = false;
        flagBtn.classList.toggle('active', isFlagged);
        flagBtn.setAttribute('aria-pressed', String(isFlagged));
        flagBtn.querySelector('.flag-icon').textContent = isFlagged ? '★' : '☆';
        flagBtnText.textContent = isFlagged ? 'Flagged' : 'Flag';

        this.updateNavigationButtons();
        this.updateModeAvailability();

        if (this.currentQuestionIndex === this.activeQuestions.length - 1) {
            finishBtn.style.display = 'inline-flex';
        } else {
            finishBtn.style.display = 'none';
        }
    }

    selectAnswer(index) {
        const question = this.getCurrentQuestion();
        if (!question) {
            return;
        }

        const answersContainer = document.getElementById('answers-container');
        const answerOptions = answersContainer.querySelectorAll('.answer-option');

        if (this.sessionStats.answered[this.currentQuestionIndex] !== undefined) {
            return;
        }

        if (answerOptions.length > 0 && answerOptions[0].classList.contains('disabled')) {
            return;
        }

        const selectedAnswer = this.currentAnswerOrder[index];
        const isCorrect = selectedAnswer.correct;
        const displayLetters = ['A', 'B', 'C', 'D'];

        answerOptions.forEach(option => option.classList.add('disabled'));
        answerOptions[index].classList.add('selected');

        let correctIndex = -1;
        answerOptions.forEach((option, i) => {
            if (this.currentAnswerOrder[i].correct) {
                option.classList.add('correct');
                correctIndex = i;
            } else if (i === index && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        const feedback = document.getElementById('feedback');
        feedback.style.display = 'block';

        if (isCorrect) {
            feedback.className = 'feedback correct';
            feedback.textContent = 'Correct! Well done!';
            this.sessionStats.correct++;
        } else {
            feedback.className = 'feedback incorrect';
            feedback.textContent = `Incorrect. The correct answer is ${displayLetters[correctIndex]}.`;
            this.sessionStats.incorrect++;
        }

        this.sessionStats.answered[this.currentQuestionIndex] = {
            questionId: question.id,
            correct: isCorrect,
            selectedAnswer: displayLetters[index],
            correctAnswer: displayLetters[correctIndex]
        };

        document.getElementById('next-btn').disabled = false;
        this.updateStats();

        if (this.currentQuestionIndex === this.activeQuestions.length - 1) {
            document.getElementById('finish-btn').style.display = 'inline-flex';
        }
    }

    shuffleCurrentAnswers() {
        if (!this.studyMode && this.getCurrentQuestion()) {
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
        if (this.currentQuestionIndex < this.activeQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const hasQuestion = this.activeQuestions.length > 0;
        const answered = this.sessionStats.answered[this.currentQuestionIndex];

        prevBtn.disabled = !hasQuestion || this.currentQuestionIndex === 0;
        nextBtn.disabled = !hasQuestion || !answered;
    }

    updateStats() {
        const totalAnswered = this.sessionStats.correct + this.sessionStats.incorrect;
        const totalQuestions = this.activeQuestions.length;
        const accuracy = totalAnswered > 0
            ? Math.round((this.sessionStats.correct / totalAnswered) * 100)
            : 0;

        document.getElementById('progress').textContent = `${totalAnswered} / ${totalQuestions}`;
        document.getElementById('correct-count').textContent = this.sessionStats.correct;
        document.getElementById('incorrect-count').textContent = this.sessionStats.incorrect;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }

    updateFlaggedCount() {
        document.getElementById('flagged-count').textContent = this.flaggedQuestionIds.size;
    }

    updateModeAvailability() {
        const flaggedOnlyToggle = document.getElementById('flagged-only-toggle');
        flaggedOnlyToggle.disabled = this.flaggedQuestionIds.size === 0 && !this.showFlaggedOnly;
    }

    setMemoryStatus(message, isError = false) {
        const status = document.getElementById('memory-status');
        status.textContent = message;
        status.classList.toggle('error', isError);
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

        this.displayQuestion();
    }

    toggleCurrentQuestionFlag() {
        const question = this.getCurrentQuestion();
        if (!question) {
            return;
        }

        if (this.flaggedQuestionIds.has(question.id)) {
            this.flaggedQuestionIds.delete(question.id);
            this.setMemoryStatus(`Question ${question.id} removed from your flagged list.`);
        } else {
            this.flaggedQuestionIds.add(question.id);
            this.setMemoryStatus(`Question ${question.id} added to your flagged list.`);
        }

        this.saveFlaggedQuestionsToStorage();
        this.updateFlaggedCount();
        this.updateModeAvailability();

        if (this.showFlaggedOnly) {
            this.rebuildActiveQuestions();
            this.resetSessionForCurrentQuestionSet();
            this.updateStats();
        }

        this.displayQuestion();
    }

    toggleFlaggedOnlyMode(enabled) {
        if (enabled && this.flaggedQuestionIds.size === 0) {
            document.getElementById('flagged-only-toggle').checked = false;
            this.setMemoryStatus('Flag at least one question or import a flagged file before using flagged-only study mode.', true);
            return;
        }

        this.showFlaggedOnly = enabled;
        this.rebuildActiveQuestions();
        this.resetSessionForCurrentQuestionSet();
        this.updateStats();

        if (enabled) {
            this.setMemoryStatus(`Flagged-only mode is on. Studying ${this.activeQuestions.length} flagged question(s).`);
        } else {
            this.setMemoryStatus('Showing the full question bank again. Your flagged list is still saved.');
        }

        this.displayQuestion();
    }

    exportFlaggedQuestions() {
        const flaggedIds = this.getSortedFlaggedIds();
        if (flaggedIds.length === 0) {
            this.setMemoryStatus('There are no flagged questions to export yet.', true);
            return;
        }

        const payload = {
            exportedAt: new Date().toISOString(),
            flaggedQuestionIds: flaggedIds
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'azf-flagged-questions.json';
        link.click();
        URL.revokeObjectURL(url);

        this.setMemoryStatus(`Exported ${flaggedIds.length} flagged question(s) to a JSON file.`);
    }

    async importFlaggedQuestions(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const importedIds = Array.isArray(parsed)
                ? parsed
                : parsed.flaggedQuestionIds;

            if (!Array.isArray(importedIds)) {
                throw new Error('Missing flaggedQuestionIds array');
            }

            const validQuestionIds = new Set(this.questions.map(question => question.id));
            const cleanedIds = importedIds
                .filter(id => Number.isInteger(id) && validQuestionIds.has(id));

            this.flaggedQuestionIds = new Set(cleanedIds);
            this.saveFlaggedQuestionsToStorage();
            this.updateFlaggedCount();
            this.updateModeAvailability();

            if (this.showFlaggedOnly) {
                this.rebuildActiveQuestions();
                this.resetSessionForCurrentQuestionSet();
                this.updateStats();
            }

            this.setMemoryStatus(`Imported ${cleanedIds.length} flagged question(s) from ${file.name}.`);
            this.displayQuestion();
        } catch (error) {
            console.error('Error importing flagged questions:', error);
            this.setMemoryStatus('Could not import that file. Please use a valid flagged-question JSON export.', true);
        } finally {
            event.target.value = '';
        }
    }

    clearFlaggedQuestions() {
        if (this.flaggedQuestionIds.size === 0) {
            this.setMemoryStatus('Your flagged list is already empty.');
            return;
        }

        const confirmed = window.confirm('Clear all flagged questions from this browser?');
        if (!confirmed) {
            return;
        }

        this.flaggedQuestionIds.clear();
        this.saveFlaggedQuestionsToStorage();
        this.updateFlaggedCount();

        if (this.showFlaggedOnly) {
            this.showFlaggedOnly = false;
            document.getElementById('flagged-only-toggle').checked = false;
            this.rebuildActiveQuestions();
            this.resetSessionForCurrentQuestionSet();
            this.updateStats();
        }

        this.updateModeAvailability();
        this.setMemoryStatus('Cleared all flagged questions from this browser.');
        this.displayQuestion();
    }

    finishSession() {
        document.getElementById('question-card').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.mode-toggle').style.display = 'none';

        const resultsPanel = document.getElementById('results-panel');
        resultsPanel.style.display = 'block';

        const totalAnswered = this.sessionStats.correct + this.sessionStats.incorrect;
        const percentage = totalAnswered > 0
            ? Math.round((this.sessionStats.correct / totalAnswered) * 100)
            : 0;

        document.getElementById('result-total').textContent = this.activeQuestions.length;
        document.getElementById('result-correct').textContent = this.sessionStats.correct;
        document.getElementById('result-incorrect').textContent = this.sessionStats.incorrect;
        document.getElementById('result-percentage').textContent = `${percentage}%`;
    }

    restartSession() {
        this.resetSessionForCurrentQuestionSet();
        this.displayQuestion();
        this.updateStats();
    }

    reviewMistakes() {
        const mistakeIds = this.sessionStats.answered
            .filter(answer => answer && !answer.correct)
            .map(answer => answer.questionId);

        if (mistakeIds.length === 0) {
            alert("Great job! You didn't make any mistakes!");
            return;
        }

        this.flaggedQuestionIds = new Set([
            ...this.flaggedQuestionIds,
            ...mistakeIds
        ]);
        this.saveFlaggedQuestionsToStorage();
        this.updateFlaggedCount();
        this.updateModeAvailability();

        document.getElementById('flagged-only-toggle').checked = true;
        this.showFlaggedOnly = true;
        this.rebuildActiveQuestions();
        this.resetSessionForCurrentQuestionSet();
        this.setMemoryStatus(`Moved ${mistakeIds.length} mistake(s) into your flagged study list and started a flagged-only session.`);
        this.displayQuestion();
        this.updateStats();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyApp();
});
