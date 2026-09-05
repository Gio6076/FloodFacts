// script.js - Add these at the TOP of the file
let storiesInitialized = false;
let isSubmittingStory = false;


// script.js - Enhanced with Firebase
const CHECKLIST_KEY_PREFIX = 'flood-checklist-';
const STORIES_STORAGE_KEY = 'flood-stories';

// Keep these storage keys stable for existing browser and Firestore data.
// The old duplicate before-checklist IDs were inherently ambiguous; check2 and
// check3 remain attached to their first items while renamed items use new keys.

// Firebase services
function getAuth() {
    return firebase.auth();
}

function getFirestore() {
    return firebase.firestore();
}

// Questions array
const questions = [
    {
        question: "What should you do first during a flood?",
        options: ["Move to higher ground", "Call friends", "Turn on lights", "Drive through water"],
        answer: 0
    },
    {
        question: "Which item is essential in an emergency kit?",
        options: ["Extra clothes", "Water and food", "Books", "Candles"],
        answer: 1
    },
    {
        question: "What should you avoid during a flood?",
        options: ["Boiling water", "Using electrical appliances in water", "Elevating valuables", "Preparing a plan"],
        answer: 1
    },
    {
        question: "How can you stay informed about floods?",
        options: ["Ignore news", "Check weather apps", "Sleep", "Go outside"],
        answer: 1
    },
    {
        question: "After a flood, what should you do with contaminated water?",
        options: ["Drink it", "Boil it first", "Throw it away", "Ignore it"],
        answer: 1
    },
    {
        question: "How much water should you store per person per day for emergency preparedness?",
        options: ["1/2 gallon", "1 gallon", "2 gallons", "5 gallons"],
        answer: 1
    },
    {
        question: "What is the safest action if you're caught in floodwaters in a car?",
        options: ["Drive faster through the water", "Abandon the car and swim", "Stay in the car and call for help", "Turn on the headlights"],
        answer: 2
    },
    {
        question: "When preparing your home before a flood, where should you elevate your appliances?",
        options: ["In the attic", "Above ground level", "In the basement", "On the first floor"],
        answer: 1
    },
    {
        question: "What type of documents should you keep in waterproof storage?",
        options: ["Junk mail", "Receipts", "Insurance and property documents", "Newspapers"],
        answer: 2
    },
    {
        question: "What should you do with electrical equipment that has been in contact with flood water?",
        options: ["Dry it immediately and use it", "Do not touch or use it", "Clean it with soap and water", "Store it in a humid place"],
        answer: 1
    },
    {
        question: "How long should non-perishable food last in your emergency kit?",
        options: ["At least 3 days", "At least 1 week", "At least 2 weeks", "At least 1 month"],
        answer: 2
    },
    {
        question: "During a flood evacuation, what is the best escape route?",
        options: ["Any main road", "Pre-planned evacuation routes", "Flooded roads if shorter", "Through water bodies"],
        answer: 1
    },
    {
        question: "What should you do if you discover mold after a flood?",
        options: ["Ignore it", "Use protective gear and clean with bleach solution", "Leave the area immediately", "Paint over it"],
        answer: 1
    },
    {
        question: "Before a flood occurs, what should your family establish?",
        options: ["A vacation plan", "A communication plan and meeting point", "A shopping list", "Nothing is necessary"],
        answer: 1
    },
    {
        question: "What is the safest place to be during a flood?",
        options: ["Basement", "Ground floor", "Higher ground or upper floors", "Outside observing the water"],
        answer: 2
    }
];

let currentQuestion = 0;
let score = 0;

function getAuthInfo() {
    const auth = getAuth();
    const user = auth.currentUser;
    return {
        loggedIn: !!user,
        username: user ? user.displayName || user.email.split('@')[0] : ''
    };
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId) return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function displayWelcomeMessage() {
    const welcomeDiv = document.getElementById('welcome-message');
    if (!welcomeDiv) return;
    
    const { loggedIn, username } = getAuthInfo();
    if (!loggedIn) {
        welcomeDiv.style.display = 'none';
        welcomeDiv.replaceChildren();
        return;
    }
    
    const message = document.createElement('p');
    message.className = 'lead text-success';
    const icon = document.createElement('i');
    icon.className = 'fas fa-user-check';
    icon.setAttribute('aria-hidden', 'true');
    message.append(icon, ` Welcome, ${username}!`);
    welcomeDiv.replaceChildren(message);
    welcomeDiv.style.display = 'block';
}

function highlightActiveNav() {
    const page = document.body.dataset.page;
    if (!page) return;
    const activeLink = document.querySelector(`.navbar-nav .nav-link[data-nav="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function initLoginLink() {
    const loginLink = document.getElementById('login-link');
    if (!loginLink) return;

    const auth = getAuth();
    
    auth.onAuthStateChanged((user) => {
        loginLink.textContent = user ? 'Logout' : 'Login';
        loginLink.href = user ? '#' : 'login.html';
        displayWelcomeMessage();
    });

    loginLink.addEventListener('click', (event) => {
        const auth = getAuth();
        if (auth.currentUser) {
            event.preventDefault();
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        }
    });
}

function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (event) => {
        window.handleLogin(event);
    });
}

function initChecklist({ itemSelector, countId, barId, storageSuffix }) {
    const items = document.querySelectorAll(itemSelector);
    const countEl = document.getElementById(countId);
    const barEl = document.getElementById(barId);

    if (!items.length || !countEl || !barEl) return;

    function updateProgress() {
        const checkedCount = document.querySelectorAll(`${itemSelector}:checked`).length;
        const totalCount = items.length;
        const progressPercentage = totalCount === 0 ? 0 : (checkedCount / totalCount) * 100;

        countEl.textContent = checkedCount;
        barEl.style.width = `${progressPercentage}%`;
        barEl.setAttribute('aria-valuenow', checkedCount);
        barEl.setAttribute('aria-valuemax', totalCount);

        const auth = getAuth();
        const db = getFirestore();
        if (auth.currentUser) {
            const checklistData = {};
            items.forEach(item => {
                checklistData[item.id] = item.checked;
            });
            
            db.collection('users').doc(auth.currentUser.uid).update({
                [`checklistProgress.${storageSuffix}`]: checklistData
            }).catch(error => {
                console.log('Failed to save to Firebase, using localStorage as fallback');
            });
        }
    }

    function loadChecklistProgress() {
        const auth = getAuth();
        const db = getFirestore();
        const user = auth.currentUser;
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const savedProgress = data.checklistProgress?.[storageSuffix] || {};
                    
                    items.forEach(item => {
                        if (savedProgress[item.id] !== undefined) {
                            item.checked = savedProgress[item.id];
                        }
                    });
                }
                updateProgress();
            }).catch(() => {
                loadFromLocalStorage();
            });
        } else {
            loadFromLocalStorage();
        }
    }

    function loadFromLocalStorage() {
        items.forEach(item => {
            const storageKey = `${CHECKLIST_KEY_PREFIX}${storageSuffix}-${item.id}`;
            const savedValue = localStorage.getItem(storageKey);
            if (savedValue === 'true') {
                item.checked = true;
            }
        });
        updateProgress();
    }

    items.forEach(item => {
        item.addEventListener('change', () => {
            const storageKey = `${CHECKLIST_KEY_PREFIX}${storageSuffix}-${item.id}`;
            localStorage.setItem(storageKey, item.checked);
            updateProgress();
        });
    });

    loadChecklistProgress();
}

function initQuiz() {
    const startScreen = document.getElementById('quiz-start');
    const quizContainer = document.getElementById('quiz-container');
    const resultContainer = document.getElementById('result');
    const startButton = document.getElementById('start-quiz-btn');
    const loginNotice = document.getElementById('quiz-login-notice');

    if (!startScreen || !quizContainer || !resultContainer) return;

    function updateStartState() {
        const authInfo = getAuthInfo();
        if (startButton) {
            startButton.disabled = !authInfo.loggedIn;
            startButton.classList.toggle('disabled', !authInfo.loggedIn);
        }
        if (loginNotice) {
            loginNotice.style.display = authInfo.loggedIn ? 'none' : 'block';
        }
    }

    async function saveQuizScore(score, totalQuestions) {
        const auth = getAuth();
        const db = getFirestore();
        const user = auth.currentUser;
        if (!user) return;

        const quizResult = {
            score: score,
            total: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('users').doc(user.uid).update({
                quizScores: firebase.firestore.FieldValue.arrayUnion(quizResult)
            });
        } catch (error) {
            console.error('Error saving quiz score:', error);
        }
    }

    function loadQuestion() {
        const q = questions[currentQuestion];
        const questionNumber = currentQuestion + 1;
        const totalQuestions = questions.length;

        const questionNumberEl = document.getElementById('question-number');
        const questionEl = document.getElementById('question');
        const optionsEl = document.getElementById('options');
        const progressBar = document.getElementById('quiz-progress-bar');
        const scoreDisplay = document.getElementById('score-display');

        if (!questionNumberEl || !questionEl || !optionsEl || !progressBar) {
            return;
        }

        questionNumberEl.textContent = `Question ${questionNumber}/${totalQuestions}`;
        questionEl.innerHTML = `<h3 class="mb-4">${q.question}</h3>`;

        optionsEl.innerHTML = q.options.map((opt, i) =>
            `<button class="btn btn-outline-primary btn-lg w-100 mb-3 text-start quiz-option" data-answer="${i}" style="padding: 15px; font-size: 1.1rem;">${opt}</button>`
        ).join('');

        const progressPercentage = (currentQuestion / totalQuestions) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}`;
        }

        document.querySelectorAll('.quiz-option').forEach(button => {
            button.addEventListener('click', () => {
                const selected = Number(button.getAttribute('data-answer'));
                if (selected === questions[currentQuestion].answer) {
                    score++;
                }
                currentQuestion++;
                if (currentQuestion < questions.length) {
                    loadQuestion();
                } else {
                    showResult();
                }
            });
        });
    }

    function showResult() {
        quizContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        const totalQuestions = questions.length;
        const percentage = Math.round((score / totalQuestions) * 100);

        const scoreEl = document.getElementById('score');
        const percentageEl = document.getElementById('percentage');
        const feedbackEl = document.getElementById('feedback');

        if (scoreEl) scoreEl.textContent = score;
        if (percentageEl) percentageEl.textContent = `${percentage}%`;

        let feedback = '';
        let feedbackClass = '';

        if (percentage === 100) {
            feedback = "Perfect! You're a flood safety expert!";
            feedbackClass = 'text-success';
        } else if (percentage >= 80) {
            feedback = "Excellent! You're very well-prepared for flood safety.";
            feedbackClass = 'text-success';
        } else if (percentage >= 60) {
            feedback = "Good! You have solid flood safety knowledge. Review the tips to improve.";
            feedbackClass = 'text-info';
        } else if (percentage >= 40) {
            feedback = "You're on the right track. Review the before, during, and after sections to strengthen your knowledge.";
            feedbackClass = 'text-warning';
        } else {
            feedback = "Keep learning! Review all the flood safety sections on this website to better prepare yourself.";
            feedbackClass = 'text-danger';
        }

        if (feedbackEl) {
            feedbackEl.textContent = feedback;
            feedbackEl.className = feedbackClass;
        }

        saveQuizScore(score, totalQuestions);
    }

    window.startQuiz = function startQuiz() {
        const authInfo = getAuthInfo();
        if (!authInfo.loggedIn) {
            alert('Please log in to take the quiz.');
            updateStartState();
            return;
        }
        currentQuestion = 0;
        score = 0;
        startScreen.style.display = 'none';
        quizContainer.style.display = 'block';
        resultContainer.style.display = 'none';
        loadQuestion();
    };

    window.retryQuiz = function retryQuiz() {
        window.startQuiz();
    };

    const auth = getAuth();
    auth.onAuthStateChanged(updateStartState);
    updateStartState();
}

function initStories() {
    // Prevent multiple initialization
    if (storiesInitialized) {
        return;
    }
    storiesInitialized = true;

    const storyForm = document.getElementById('story-form');
    const storiesList = document.getElementById('stories-list');
    const usernameDisplay = document.getElementById('story-username-display');
    const loginNotice = document.getElementById('story-login-notice');

    if (!storyForm || !storiesList) return;

    function renderStories(stories) {
        if (!stories.length) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'text-muted text-center';
            emptyMessage.textContent = 'No stories shared yet. Be the first to share your experience.';
            storiesList.replaceChildren(emptyMessage);
            return;
        }
        const storyElements = stories.map(story => {
            const severity = ['critical', 'severe', 'moderate'].includes(story.severity)
                ? story.severity
                : 'moderate';
            const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
            const card = document.createElement('div');
            card.className = 'story-card card shadow-sm mb-3 p-3';

            const severityPill = document.createElement('div');
            severityPill.className = 'severity-pill';
            const severityBadge = document.createElement('span');
            severityBadge.className = `severity-badge severity-${severity}`;
            const severityIcon = document.createElement('i');
            severityIcon.className = 'fas fa-exclamation-triangle';
            severityIcon.setAttribute('aria-hidden', 'true');
            severityBadge.append(severityIcon, ` ${severityLabel}`);
            severityPill.append(severityBadge);

            const name = document.createElement('h5');
            name.textContent = story.name || 'Community Member';
            const location = document.createElement('small');
            const locationIcon = document.createElement('i');
            locationIcon.className = 'fas fa-map-marker-alt';
            locationIcon.setAttribute('aria-hidden', 'true');
            location.append(locationIcon, ` ${story.location || 'Location not provided'}`);
            const submittedAt = document.createElement('small');
            submittedAt.className = 'd-block';
            const dateIcon = document.createElement('i');
            dateIcon.className = 'fas fa-clock';
            dateIcon.setAttribute('aria-hidden', 'true');
            const rawDate = story.submittedAt?.toDate?.() || story.submittedAt;
            const date = rawDate ? new Date(rawDate).toLocaleDateString() : 'Date unavailable';
            submittedAt.append(dateIcon, ` ${date}`);
            const storyText = document.createElement('p');
            storyText.className = 'mt-3 mb-0';
            storyText.textContent = story.story || '';

            card.append(severityPill, name, location, submittedAt, storyText);
            return card;
        });
        storiesList.replaceChildren(...storyElements);
    }

    function toggleFormState(loggedIn, username) {
        if (usernameDisplay) {
            usernameDisplay.textContent = loggedIn && username ? username : 'Guest';
        }

        const controls = storyForm.querySelectorAll('input, textarea, button');
        controls.forEach(control => {
            control.disabled = !loggedIn || !username;
        });

        if (loginNotice) {
            loginNotice.style.display = (!loggedIn || !username) ? 'block' : 'none';
        }
    }

    // Use get() instead of onSnapshot to avoid multiple listeners
    function loadStories() {
        const db = getFirestore();
        db.collection('stories')
            .orderBy('submittedAt', 'desc')
            .limit(50)
            .get()
            .then((snapshot) => {
                const stories = [];
                snapshot.forEach(doc => {
                    stories.push({ id: doc.id, ...doc.data() });
                });
                renderStories(stories);
            })
            .catch((error) => {
                console.error('Error loading stories:', error);
                try {
                    const storedStories = localStorage.getItem(STORIES_STORAGE_KEY);
                    const localStories = storedStories ? JSON.parse(storedStories) : [];
                    renderStories(localStories);
                } catch (e) {
                    renderStories([]);
                }
            });
    }

    // Single event listener with proper prevention
    storyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (isSubmittingStory) {
            console.log('Already submitting, skipping...');
            return;
        }
        
        isSubmittingStory = true;

        const auth = getAuth();
        const db = getFirestore();
        const user = auth.currentUser;
        
        if (!user) {
            alert('Please log in to share your story.');
            isSubmittingStory = false;
            return;
        }

        const location = document.getElementById('story-location')?.value.trim();
        const storyText = document.getElementById('story-text')?.value.trim();
        const severity = document.getElementById('story-severity')?.value || 'moderate';

        if (!location || !storyText) {
            alert('Please complete all fields before submitting your story.');
            isSubmittingStory = false;
            return;
        }

        if (location.length > 100 || storyText.length > 2000) {
            alert('Location must be 100 characters or fewer, and your story must be 2,000 characters or fewer.');
            isSubmittingStory = false;
            return;
        }

        // Disable the form during submission
        const submitButton = storyForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitButton.disabled = true;

        const newStory = {
            name: user.displayName || user.email.split('@')[0],
            location,
            story: storyText,
            severity,
            userId: user.uid,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            console.log('Submitting story...');
            await db.collection('stories').add(newStory);
            console.log('Story submitted successfully');
            
            // Reset form
            storyForm.reset();
            
            // Reload stories to show the new one
            loadStories();
            
            // Show success message
            alert('Story submitted successfully!');
            
        } catch (error) {
            console.error('Error submitting story:', error);
            alert('Error submitting story: ' + error.message);
        } finally {
            // Re-enable form
            isSubmittingStory = false;
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    });

    // Wire up severity dropdown inside the story form
    const severityDropdownItems = storyForm.querySelectorAll('.dropdown-item');
    const selectedSeverityEl = document.getElementById('selected-severity');
    const storySeverityInput = document.getElementById('story-severity');
    if (severityDropdownItems && selectedSeverityEl && storySeverityInput) {
        severityDropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sev = item.getAttribute('data-severity');
                if (!sev) return;
                storySeverityInput.value = sev;
                const label = sev.charAt(0).toUpperCase() + sev.slice(1);
                const badge = document.createElement('span');
                badge.className = `severity-badge severity-${sev}`;
                const icon = document.createElement('i');
                icon.className = 'fas fa-exclamation-triangle';
                icon.setAttribute('aria-hidden', 'true');
                badge.append(icon, ` ${label}`);
                selectedSeverityEl.replaceChildren(badge);
            });
        });
    }

    const auth = getAuth();
    auth.onAuthStateChanged((user) => {
        toggleFormState(!!user, user ? user.displayName || user.email.split('@')[0] : '');
    });

    loadStories();
}

// Handle registration
window.handleRegister = async function handleRegister(event) {
    event.preventDefault();
    const auth = getAuth();
    const db = getFirestore();
    
    const fullname = document.getElementById('fullname')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;

    // Validation
    if (!fullname || !email || !username || !password || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }

    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Update user profile with display name
        await user.updateProfile({
            displayName: username
        });

        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            fullName: fullname,
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            quizScores: [],
            checklistProgress: {},
            stories: []
        });

        // Notify the user of successful registration and ask to return to login
        try {
            const goToLogin = confirm('Your account was created successfully. Would you like to go to the login page now?');
            if (goToLogin) {
                window.location.href = 'login.html';
            } else {
                alert('Account created. You can log in anytime from the login page.');
            }
        } catch (e) {
            // In case confirm/alert are blocked for some reason, fallback to redirecting to login
            window.location.href = 'login.html';
        }


    } catch (error) {
        console.error('Registration error:', error);
        
        // User-friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            alert('This email is already registered. Please use a different email or login.');
        } else if (error.code === 'auth/invalid-email') {
            alert('Please enter a valid email address.');
        } else if (error.code === 'auth/weak-password') {
            alert('Password is too weak. Please choose a stronger password.');
        } else {
            alert('Error creating account: ' + error.message);
        }
    }
};

function initRegistrationForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    registerForm.addEventListener('submit', (event) => {
        window.handleRegister(event);
    });

    // Real-time password confirmation validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('Passwords do not match');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        });
    }
}

window.handleLogin = async function handleLogin(event) {
    event.preventDefault();
    const auth = getAuth();
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    try {
        await auth.signInWithEmailAndPassword(email, password);
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.code === 'auth/user-not-found') {
            alert('No account found with this email. Please register first.');
        } else if (error.code === 'auth/wrong-password') {
            alert('Incorrect password. Please try again.');
        } else if (error.code === 'auth/invalid-email') {
            alert('Please enter a valid email address.');
        } else {
            alert('Login error: ' + error.message);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    displayWelcomeMessage();
    highlightActiveNav();
    initLoginLink();
    initLoginForm();
    initRegistrationForm();
    initChecklist({
        itemSelector: '.checklist-item',
        countId: 'checked-count',
        barId: 'progress-bar',
        storageSuffix: 'before'
    });
    initChecklist({
        itemSelector: '.during-checklist-item',
        countId: 'during-checked-count',
        barId: 'during-progress-bar',
        storageSuffix: 'during'
    });
    initQuiz();
    initStories();
});
