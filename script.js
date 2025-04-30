document.addEventListener('DOMContentLoaded', () => {
    const vocabListContainer = document.getElementById('vocabulary-list');
    const navigationContainer = document.getElementById('set-navigation');
    const themeToggle = document.getElementById('theme-toggle');
    const recallButton = document.getElementById('recall-button');
    const currentSetTitle = document.getElementById('current-set-title');
    const prevSetButton = document.getElementById('prev-set');
    const nextSetButton = document.getElementById('next-set');

    const TOTAL_SETS = 20;
    let currentSet = 1;
    let isRecallMode = false;
    let progressData = {}; // { 1: true, 5: true } means sets 1 and 5 viewed

    // --- Initialization ---
    function init() {
        loadProgress();
        setupTheme();
        createNavigation();
        displaySet(currentSet); // Load initial set or last viewed set
        setupEventListeners();
    }

    // --- Theme Management ---
    function setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        updateThemeToggleButton();
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        updateThemeToggleButton();
    }

     function updateThemeToggleButton() {
        // The actual icon change is handled by CSS pseudo-element (:before)
        // We just ensure the class is correct
        // You could add aria-pressed state changes here if needed.
    }

    // --- Navigation ---
    function createNavigation() {
        navigationContainer.innerHTML = ''; // Clear existing
        for (let i = 1; i <= TOTAL_SETS; i++) {
            const button = document.createElement('button');
            button.classList.add('nav-button');
            button.textContent = `Set ${i}`;
            button.dataset.set = i;
            if (progressData[i]) {
                button.classList.add('viewed');
            }
            button.addEventListener('click', () => displaySet(i));
            navigationContainer.appendChild(button);
        }
        updateNavigationHighlight();
        updatePaginationButtons();
    }

    function updateNavigationHighlight() {
        const buttons = navigationContainer.querySelectorAll('.nav-button');
        buttons.forEach(button => {
            button.classList.remove('active');
            if (parseInt(button.dataset.set) === currentSet) {
                button.classList.add('active');
            }
            // Ensure viewed status is also up-to-date
             button.classList.toggle('viewed', !!progressData[button.dataset.set]);
        });
    }

     function updatePaginationButtons() {
        prevSetButton.disabled = currentSet <= 1;
        nextSetButton.disabled = currentSet >= TOTAL_SETS;
    }


    // --- Display Vocabulary ---
    function displaySet(setNumber) {
        if (setNumber < 1 || setNumber > TOTAL_SETS) return; // Basic validation

        currentSet = setNumber;
        isRecallMode = false; // Reset recall mode when changing sets
        updateRecallButton(); // Update button text

        currentSetTitle.textContent = `Set ${currentSet}`;
        vocabListContainer.innerHTML = ''; // Clear previous cards
        vocabListContainer.classList.remove('recall-active'); // Ensure recall class is removed

        const words = getWordsForSet(currentSet);

        if (!words || words.length === 0) {
            vocabListContainer.innerHTML = '<p>No words found for this set.</p>';
            return;
        }

        words.forEach(wordData => {
            const card = createVocabCard(wordData);
            vocabListContainer.appendChild(card);
        });

        markSetViewed(currentSet);
        updateNavigationHighlight();
        updatePaginationButtons();

         // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function createVocabCard(wordData) {
        const card = document.createElement('div');
        card.classList.add('vocab-card');
        card.dataset.wordId = wordData.id; // Optional: for potential future features

        // Word Number
        const numberSpan = document.createElement('span');
        numberSpan.classList.add('word-number');
        // Calculate number within the set (e.g., 1-20)
        const numberInSet = (wordData.id - 1) % 20 + 1;
        numberSpan.textContent = `#${numberInSet}`;
        card.appendChild(numberSpan);


        // Word
        const wordHeading = document.createElement('h3');
        wordHeading.textContent = wordData.word;
        card.appendChild(wordHeading);

        // Meaning
        const meaningPara = document.createElement('p');
        meaningPara.classList.add('meaning');
        meaningPara.textContent = wordData.meaning;
        card.appendChild(meaningPara);

         // Sentence (Optional)
        if (wordData.sentence) {
            const sentencePara = document.createElement('p');
            sentencePara.classList.add('sentence');
            sentencePara.textContent = `E.g., ${wordData.sentence}`;
            card.appendChild(sentencePara);
        }


        // Image
        const image = document.createElement('img');
        image.classList.add('word-image');
        image.src = wordData.image || `https://via.placeholder.com/300x200.png?text=${wordData.word}`; // Use provided image or placeholder
        image.alt = `Illustration for ${wordData.word}`;
        image.loading = 'lazy'; // Lazy load images
        card.appendChild(image);

        // Add click listener for recall mode reveal
        card.addEventListener('click', () => {
            if (isRecallMode) {
                revealCardContent(card);
            }
        });

        return card;
    }

    // --- Recall Mode ---
    function toggleRecallMode() {
        isRecallMode = !isRecallMode;
        vocabListContainer.classList.toggle('recall-active', isRecallMode);
        updateRecallButton();

        // Reset visibility if turning recall mode off
        if (!isRecallMode) {
            resetCardVisibility();
        }
    }

    function updateRecallButton() {
        recallButton.textContent = isRecallMode ? 'Reveal Mode (Click Cards)' : 'Recall Mode';
    }

    function revealCardContent(cardElement) {
         // Toggle visibility only for the clicked card's hidden elements
         cardElement.querySelectorAll('.meaning, .word-image, .sentence').forEach(el => {
             // Only toggle if it was previously hidden by recall mode
             if (el.classList.contains('visible')) {
                 el.classList.remove('visible'); // Hide again if clicked again
             } else {
                 el.classList.add('visible'); // Show if hidden
             }
         });
    }


    function resetCardVisibility() {
        // Ensure all content is visible when recall mode is off
        vocabListContainer.querySelectorAll('.meaning, .word-image, .sentence').forEach(el => {
            el.classList.remove('visible'); // Remove any lingering visible class from recall
        });
    }


    // --- Progress Tracking ---
    function loadProgress() {
        const savedProgress = localStorage.getItem('vocabularyProgress');
        progressData = savedProgress ? JSON.parse(savedProgress) : {};
        // Load last viewed set if available
        const lastSet = localStorage.getItem('lastVocabularySet');
        currentSet = lastSet ? parseInt(lastSet) : 1;
    }

    function saveProgress() {
        localStorage.setItem('vocabularyProgress', JSON.stringify(progressData));
        localStorage.setItem('lastVocabularySet', currentSet.toString());
    }

    function markSetViewed(setNumber) {
        if (!progressData[setNumber]) {
            progressData[setNumber] = true;
            saveProgress();
             // Update the specific button's class immediately
             const button = navigationContainer.querySelector(`.nav-button[data-set="${setNumber}"]`);
             if (button) button.classList.add('viewed');
        }
    }


    // --- Event Listeners ---
    function setupEventListeners() {
        themeToggle.addEventListener('click', toggleTheme);
        recallButton.addEventListener('click', toggleRecallMode);

         prevSetButton.addEventListener('click', () => {
            if (currentSet > 1) {
                displaySet(currentSet - 1);
            }
        });

        nextSetButton.addEventListener('click', () => {
            if (currentSet < TOTAL_SETS) {
                displaySet(currentSet + 1);
            }
        });
    }

    // --- Start the application ---
    init();
});