// AZF Exam Study App - Main Application
class StudyApp {
    constructor() {
        this.storageKey = 'azf-flagged-question-ids';
        this.preferencesKey = 'azf-study-preferences';
        this.sessionKey = 'azf-study-session';
        this.autoAdvanceDelayMs = 450;

        this.questions = [];
        this.activeQuestions = [];
        this.currentQuestionIndex = 0;
        this.sessionStats = this.getEmptySessionStats();
        this.studyMode = false;
        this.currentAnswerOrder = [];
        this.flaggedQuestionIds = new Set();
        this.showFlaggedOnly = false;
        this.autoFlagIncorrect = true;
        this.sessionCompleted = false;

        this.init();
    }

    getEmptySessionStats() {
        return {
            correct: 0,
            incorrect: 0,
            answersByQuestionId: {},
            skippedQuestionIds: []
        };
    }

    async init() {
        this.loadFlaggedQuestionsFromStorage();
        this.loadPreferencesFromStorage();
        await this.loadQuestions();
        this.loadSessionStateFromStorage();
        this.setupEventListeners();
        this.rebuildActiveQuestions();
        this.syncPreferenceControls();
        this.updateFlaggedCount();
        this.updateStats();
        this.displayQuestion();

        if (this.sessionCompleted) {
            this.finishSession(false);
        } else {
            this.saveSessionState();
        }
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
        localStorage.setItem(this.storageKey, JSON.stringify(this.getSortedFlaggedIds()));
    }

    loadPreferencesFromStorage() {
        try {
            const saved = localStorage.getItem(this.preferencesKey);
            if (!saved) {
                return;
            }

            const parsed = JSON.parse(saved);
            if (typeof parsed.autoFlagIncorrect === 'boolean') {
                this.autoFlagIncorrect = parsed.autoFlagIncorrect;
            }
        } catch (error) {
            console.warn('Could not load study preferences:', error);
        }
    }

    savePreferencesToStorage() {
        localStorage.setItem(
            this.preferencesKey,
            JSON.stringify({
                autoFlagIncorrect: this.autoFlagIncorrect
            })
        );
    }

    loadSessionStateFromStorage() {
        try {
            const saved = localStorage.getItem(this.sessionKey);
            if (!saved) {
                return;
            }

            const parsed = JSON.parse(saved);
            const validQuestionIds = new Set(this.questions.map(question => question.id));

            if (typeof parsed.studyMode === 'boolean') {
                this.studyMode = parsed.studyMode;
            }

            if (typeof parsed.showFlaggedOnly === 'boolean') {
                this.showFlaggedOnly = parsed.showFlaggedOnly && this.flaggedQuestionIds.size > 0;
            }

            if (typeof parsed.currentQuestionIndex === 'number' && parsed.currentQuestionIndex >= 0) {
                this.currentQuestionIndex = parsed.currentQuestionIndex;
            }

            if (typeof parsed.sessionCompleted === 'boolean') {
                this.sessionCompleted = parsed.sessionCompleted;
            }

            const nextStats = this.getEmptySessionStats();
            const answersByQuestionId = parsed.sessionStats?.answersByQuestionId || {};
            const skippedQuestionIds = parsed.sessionStats?.skippedQuestionIds || [];

            Object.entries(answersByQuestionId).forEach(([questionId, answer]) => {
                const numericId = Number(questionId);
                if (!validQuestionIds.has(numericId) || !answer) {
                    return;
                }

                nextStats.answersByQuestionId[numericId] = answer;
                if (answer.correct) {
                    nextStats.correct++;
                } else {
                    nextStats.incorrect++;
                }
            });

            nextStats.skippedQuestionIds = skippedQuestionIds
                .filter(id => Number.isInteger(id) && validQuestionIds.has(id) && !nextStats.answersByQuestionId[id]);

            this.sessionStats = nextStats;
        } catch (error) {
            console.warn('Could not restore session state:', error);
        }
    }

    saveSessionState() {
        localStorage.setItem(
            this.sessionKey,
            JSON.stringify({
                studyMode: this.studyMode,
                showFlaggedOnly: this.showFlaggedOnly,
                currentQuestionIndex: this.currentQuestionIndex,
                sessionCompleted: this.sessionCompleted,
                sessionStats: this.sessionStats
            })
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
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion(true));
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
        document.getElementById('auto-flag-incorrect-toggle').addEventListener('change', (e) => this.toggleAutoFlagIncorrect(e.target.checked));
        document.addEventListener('keydown', (event) => this.handleKeydown(event));
    }

    syncPreferenceControls() {
        document.getElementById('auto-flag-incorrect-toggle').checked = this.autoFlagIncorrect;
        document.getElementById('study-mode-toggle').checked = this.studyMode;
        this.updateModeText();
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

    getAnswerRecord(questionId) {
        return this.sessionStats.answersByQuestionId[questionId] || null;
    }

    isQuestionSkipped(questionId) {
        return this.sessionStats.skippedQuestionIds.includes(questionId);
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
        this.sessionCompleted = false;
        document.getElementById('results-panel').style.display = 'none';
        document.getElementById('question-card').style.display = 'block';
        document.querySelector('.controls').style.display = 'flex';
        document.querySelector('.mode-toggle').style.display = 'flex';
        document.getElementById('finish-btn').style.display = 'none';
        this.saveSessionState();
    }

    getAnswerOrder() {
        const question = this.getCurrentQuestion();
        if (!question) {
            return [];
        }

        const savedAnswer = this.getAnswerRecord(question.id);
        if (savedAnswer?.answerOrderTexts?.length === question.answers.length) {
            return savedAnswer.answerOrderTexts
                .map(answerText => question.answers.find(answer => answer.text === answerText))
                .filter(Boolean);
        }

        if (this.studyMode) {
            return [...question.answers];
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
        const flaggedOnlyToggle = document.getElementById('flagged-only-toggle');

        flaggedOnlyToggle.checked = this.showFlaggedOnly;

        if (!question) {
            questionNumber.textContent = this.showFlaggedOnly ? 'Flagged Study List' : 'No Questions Available';
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

        const savedAnswer = this.getAnswerRecord(question.id);
        const isSkipped = this.isQuestionSkipped(question.id);
        const isAlreadyAnswered = Boolean(savedAnswer);
        this.currentAnswerOrder = this.getAnswerOrder();
        answersContainer.innerHTML = '';

        this.currentAnswerOrder.forEach((answer, index) => {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-option';
            answerDiv.dataset.correct = String(answer.correct);
            answerDiv.dataset.index = String(index);

            if (isAlreadyAnswered) {
                answerDiv.classList.add('disabled');

                if (savedAnswer.selectedAnswerText === answer.text) {
                    answerDiv.classList.add('selected');
                    if (!savedAnswer.correct) {
                        answerDiv.classList.add('incorrect');
                    }
                }

                if (savedAnswer.correctAnswerText === answer.text) {
                    answerDiv.classList.add('correct');
                }
            }

            answerDiv.innerHTML = `
                <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
                <span class="answer-text">${answer.text}</span>
            `;

            if (!isAlreadyAnswered) {
                answerDiv.addEventListener('click', () => this.selectAnswer(index));
            }

            answersContainer.appendChild(answerDiv);
        });

        if (isAlreadyAnswered) {
            feedback.style.display = 'block';
            feedback.className = savedAnswer.correct ? 'feedback correct' : 'feedback incorrect';
            feedback.textContent = savedAnswer.correct
                ? 'Correct! Well done!'
                : 'Incorrect. Review the highlighted correct answer.';
        } else if (isSkipped) {
            feedback.style.display = 'block';
            feedback.className = 'feedback info';
            feedback.textContent = 'This question was skipped earlier. You can answer it now or keep moving.';
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
        finishBtn.style.display = this.currentQuestionIndex === this.activeQuestions.length - 1 ? 'inline-flex' : 'none';
    }

    selectAnswer(index) {
        const question = this.getCurrentQuestion();
        if (!question) {
            return;
        }

        if (this.getAnswerRecord(question.id)) {
            return;
        }

        const selectedAnswer = this.currentAnswerOrder[index];
        if (!selectedAnswer) {
            return;
        }

        const correctAnswer = this.currentAnswerOrder.find(answer => answer.correct);
        const isCorrect = selectedAnswer.correct;

        this.sessionStats.answersByQuestionId[question.id] = {
            questionId: question.id,
            correct: isCorrect,
            selectedAnswerText: selectedAnswer.text,
            correctAnswerText: correctAnswer ? correctAnswer.text : '',
            answerOrderTexts: this.currentAnswerOrder.map(answer => answer.text)
        };

        if (this.isQuestionSkipped(question.id)) {
            this.sessionStats.skippedQuestionIds = this.sessionStats.skippedQuestionIds.filter(id => id !== question.id);
        }

        if (isCorrect) {
            this.sessionStats.correct++;
        } else {
            this.sessionStats.incorrect++;
            if (this.autoFlagIncorrect) {
                this.addFlag(question.id);
                this.setMemoryStatus(`Question ${question.id} was answered incorrectly and added to your flagged list.`);
            }
        }

        this.updateStats();
        this.displayQuestion();
        this.saveSessionState();

        if (isCorrect && this.currentQuestionIndex < this.activeQuestions.length - 1) {
            const currentQuestionId = question.id;
            window.setTimeout(() => {
                const stillOnSameQuestion = this.getCurrentQuestion()?.id === currentQuestionId;
                if (stillOnSameQuestion && !this.sessionCompleted) {
                    this.nextQuestion(false);
                }
            }, this.autoAdvanceDelayMs);
        }
    }

    shuffleCurrentAnswers() {
        if (!this.studyMode && this.getCurrentQuestion() && !this.getAnswerRecord(this.getCurrentQuestion().id)) {
            this.displayQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.sessionCompleted = false;
            this.displayQuestion();
            this.saveSessionState();
        }
    }

    nextQuestion(markSkippedIfNeeded = true) {
        const question = this.getCurrentQuestion();
        if (!question) {
            return;
        }

        if (markSkippedIfNeeded && !this.getAnswerRecord(question.id) && !this.isQuestionSkipped(question.id)) {
            this.sessionStats.skippedQuestionIds.push(question.id);
        }

        if (this.currentQuestionIndex < this.activeQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.sessionCompleted = false;
            this.updateStats();
            this.displayQuestion();
            this.saveSessionState();
        } else {
            this.updateStats();
            this.displayQuestion();
            this.saveSessionState();
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const hasQuestion = this.activeQuestions.length > 0;

        prevBtn.disabled = !hasQuestion || this.currentQuestionIndex === 0;
        nextBtn.disabled = !hasQuestion || this.currentQuestionIndex >= this.activeQuestions.length - 1;
    }

    getActiveSessionSummary() {
        const activeQuestionIds = new Set(this.activeQuestions.map(question => question.id));
        const answers = Object.values(this.sessionStats.answersByQuestionId)
            .filter(answer => answer && activeQuestionIds.has(answer.questionId));
        const skippedCount = this.sessionStats.skippedQuestionIds
            .filter(id => activeQuestionIds.has(id))
            .length;

        return {
            answeredCount: answers.length,
            skippedCount,
            correctCount: answers.filter(answer => answer.correct).length,
            incorrectCount: answers.filter(answer => !answer.correct).length
        };
    }

    updateStats() {
        const summary = this.getActiveSessionSummary();
        const answeredCount = summary.answeredCount;
        const skippedCount = summary.skippedCount;
        const totalProgress = answeredCount + skippedCount;
        const totalQuestions = this.activeQuestions.length;
        const accuracy = answeredCount > 0
            ? Math.round((summary.correctCount / answeredCount) * 100)
            : 0;

        document.getElementById('progress').textContent = `${totalProgress} / ${totalQuestions}`;
        document.getElementById('correct-count').textContent = summary.correctCount;
        document.getElementById('incorrect-count').textContent = summary.incorrectCount;
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

    updateModeText() {
        const modeText = document.getElementById('mode-text');
        const modeDescription = document.getElementById('mode-description');
        const shuffleBtn = document.getElementById('shuffle-btn');

        if (this.studyMode) {
            modeText.textContent = 'Study Mode';
            modeDescription.textContent = '(Answer A always correct)';
            shuffleBtn.style.display = 'none';
        } else {
            modeText.textContent = 'Practice Mode';
            modeDescription.textContent = '(Answers shuffled)';
            shuffleBtn.style.display = 'block';
        }
    }

    toggleStudyMode(enabled) {
        this.studyMode = enabled;
        this.updateModeText();
        this.displayQuestion();
        this.saveSessionState();
    }

    toggleCurrentQuestionFlag() {
        const question = this.getCurrentQuestion();
        if (!question) {
            return;
        }

        if (this.flaggedQuestionIds.has(question.id)) {
            this.removeFlag(question.id);
            this.setMemoryStatus(`Question ${question.id} removed from your flagged list.`);
        } else {
            this.addFlag(question.id);
            this.setMemoryStatus(`Question ${question.id} added to your flagged list.`);
        }

        if (this.showFlaggedOnly) {
            this.rebuildActiveQuestions();
            if (this.currentQuestionIndex >= this.activeQuestions.length) {
                this.currentQuestionIndex = Math.max(this.activeQuestions.length - 1, 0);
            }
            if (this.activeQuestions.length === 0) {
                this.sessionCompleted = false;
            }
            this.updateStats();
        }

        this.displayQuestion();
        this.saveSessionState();
    }

    addFlag(questionId) {
        this.flaggedQuestionIds.add(questionId);
        this.saveFlaggedQuestionsToStorage();
        this.updateFlaggedCount();
        this.updateModeAvailability();
    }

    removeFlag(questionId) {
        this.flaggedQuestionIds.delete(questionId);
        this.saveFlaggedQuestionsToStorage();
        this.updateFlaggedCount();
        this.updateModeAvailability();
    }

    toggleAutoFlagIncorrect(enabled) {
        this.autoFlagIncorrect = enabled;
        this.savePreferencesToStorage();
        this.setMemoryStatus(
            enabled
                ? 'Auto-flagging for incorrect answers is on.'
                : 'Auto-flagging for incorrect answers is off.'
        );
    }

    handleKeydown(event) {
        if (this.shouldIgnoreShortcut(event)) {
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.previousQuestion();
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            this.nextQuestion(true);
            return;
        }

        if (event.key.toLowerCase() === 'r') {
            event.preventDefault();
            this.toggleCurrentQuestionFlag();
        }
    }

    shouldIgnoreShortcut(event) {
        const target = event.target;
        if (!target) {
            return false;
        }

        const tagName = target.tagName ? target.tagName.toLowerCase() : '';
        return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select' || event.metaKey || event.ctrlKey || event.altKey;
    }

    toggleFlaggedOnlyMode(enabled) {
        if (enabled && this.flaggedQuestionIds.size === 0) {
            document.getElementById('flagged-only-toggle').checked = false;
            this.setMemoryStatus('Flag at least one question or import a flagged file before using flagged-only study mode.', true);
            return;
        }

        this.showFlaggedOnly = enabled;
        this.rebuildActiveQuestions();
        this.currentQuestionIndex = 0;
        this.sessionCompleted = false;
        this.updateStats();

        if (enabled) {
            this.setMemoryStatus(`Flagged-only mode is on. Studying ${this.activeQuestions.length} flagged question(s).`);
        } else {
            this.setMemoryStatus('Showing the full question bank again. Your flagged list is still saved.');
        }

        this.displayQuestion();
        this.saveSessionState();
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
            const importedIds = Array.isArray(parsed) ? parsed : parsed.flaggedQuestionIds;

            if (!Array.isArray(importedIds)) {
                throw new Error('Missing flaggedQuestionIds array');
            }

            const validQuestionIds = new Set(this.questions.map(question => question.id));
            const cleanedIds = importedIds.filter(id => Number.isInteger(id) && validQuestionIds.has(id));

            this.flaggedQuestionIds = new Set(cleanedIds);
            this.saveFlaggedQuestionsToStorage();
            this.updateFlaggedCount();
            this.updateModeAvailability();

            if (this.showFlaggedOnly) {
                this.rebuildActiveQuestions();
                this.currentQuestionIndex = 0;
            }

            this.setMemoryStatus(`Imported ${cleanedIds.length} flagged question(s) from ${file.name}.`);
            this.displayQuestion();
            this.saveSessionState();
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
            this.currentQuestionIndex = 0;
        }

        this.updateModeAvailability();
        this.setMemoryStatus('Cleared all flagged questions from this browser.');
        this.displayQuestion();
        this.saveSessionState();
    }

    finishSession(shouldSave = true) {
        this.sessionCompleted = true;

        document.getElementById('question-card').style.display = 'none';
        document.querySelector('.controls').style.display = 'none';
        document.querySelector('.mode-toggle').style.display = 'none';

        const resultsPanel = document.getElementById('results-panel');
        resultsPanel.style.display = 'block';

        const summary = this.getActiveSessionSummary();
        const answeredCount = summary.answeredCount;
        const percentage = answeredCount > 0
            ? Math.round((summary.correctCount / answeredCount) * 100)
            : 0;

        document.getElementById('result-total').textContent = this.activeQuestions.length;
        document.getElementById('result-correct').textContent = summary.correctCount;
        document.getElementById('result-incorrect').textContent = summary.incorrectCount;
        document.getElementById('result-percentage').textContent = `${percentage}%`;

        if (shouldSave) {
            this.saveSessionState();
        }
    }

    restartSession() {
        this.sessionStats = this.getEmptySessionStats();
        this.currentQuestionIndex = 0;
        this.sessionCompleted = false;

        document.getElementById('results-panel').style.display = 'none';
        document.getElementById('question-card').style.display = 'block';
        document.querySelector('.controls').style.display = 'flex';
        document.querySelector('.mode-toggle').style.display = 'flex';
        document.getElementById('finish-btn').style.display = 'none';

        this.updateStats();
        this.displayQuestion();
        this.saveSessionState();
    }

    reviewMistakes() {
        const mistakeIds = Object.values(this.sessionStats.answersByQuestionId)
            .filter(answer => answer && !answer.correct)
            .map(answer => answer.questionId);

        if (mistakeIds.length === 0) {
            alert("Great job! You didn't make any mistakes!");
            return;
        }

        this.flaggedQuestionIds = new Set([...this.flaggedQuestionIds, ...mistakeIds]);
        this.saveFlaggedQuestionsToStorage();
        this.updateFlaggedCount();
        this.updateModeAvailability();

        this.showFlaggedOnly = true;
        document.getElementById('flagged-only-toggle').checked = true;
        this.rebuildActiveQuestions();
        this.currentQuestionIndex = 0;
        this.sessionCompleted = false;
        this.sessionStats = this.getEmptySessionStats();
        this.setMemoryStatus(`Moved ${mistakeIds.length} mistake(s) into your flagged study list and started a flagged-only session.`);
        this.updateStats();

        document.getElementById('results-panel').style.display = 'none';
        document.getElementById('question-card').style.display = 'block';
        document.querySelector('.controls').style.display = 'flex';
        document.querySelector('.mode-toggle').style.display = 'flex';

        this.displayQuestion();
        this.saveSessionState();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyApp();
});
