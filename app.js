// --- GLOBAL DATE VARIABLES ---
let selectedDate = null;
let currentDate = new Date();
const checkedInDays = [5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 20, 21, 23, 24, 25];
let streakDate = new Date();

/**
 * Convert AI text into HTML
 */
function formatTextToHtml(text) {
    let paragraphs = text.split('\n\n');

    let html = paragraphs.map(p => {
        let content = p.trim();
        if (content.length === 0) return '';

        content = content.replace(/\n/g, '<br>');
        content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        return `<p class="mb-4 last:mb-0">${content}</p>`;
    }).join('');

    return `<div>${html}</div>`;
}

// --- PHQ-9 SCORING ---
function getPHQ9Interpretation(score) {
    if (score >= 20) return {
        severity: "Severe depression",
        color: "text-red-600",
        action: "Immediate initiation of pharmacotherapy and expedited referral to a mental health specialist."
    };

    if (score >= 15) return {
        severity: "Moderately severe depression",
        color: "text-red-500",
        action: "Active treatment with pharmacotherapy and/or psychotherapy is recommended."
    };

    if (score >= 10) return {
        severity: "Moderate depression",
        color: "text-yellow-600",
        action: "Treatment plan, considering counseling, follow-up and/or pharmacotherapy."
    };

    if (score >= 5) return {
        severity: "Mild depression",
        color: "text-green-500",
        action: "Watchful waiting; repeat screening at follow-up."
    };

    return {
        severity: "Minimal depression",
        color: "text-gray-500",
        action: "Treatment may not be clinically indicated."
    };
}

// --- GAD-7 SCORING ---
function getGAD7Interpretation(score) {
    if (score >= 15) return {
        severity: "Severe Anxiety",
        color: "text-red-600",
        action: "Often warrants treatment using medication, therapy, or both."
    };

    if (score >= 10) return {
        severity: "Moderate Anxiety",
        color: "text-red-500",
        action: "Treatment goals and interventions target the specific symptoms indicated by client's answers."
    };

    if (score >= 5) return {
        severity: "Mild Anxiety",
        color: "text-green-500",
        action: "Therapist uses clinical judgement about treatment needs."
    };

    return {
        severity: "Minimal Anxiety",
        color: "text-gray-500",
        action: "Treatment may not be clinically indicated."
    };
}

// --- CALENDAR ---
function renderCalendar(elementId, date, checkedDays = []) {

    const firstDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
    );

    const lastDay = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    );

    const container = document.getElementById(elementId);

    if (!container) return;

    const monthYearDisplayId = elementId
        .replace('calendar-days', 'current-month-year')
        .replace(
            'streak-calendar-days',
            'streak-current-month-year'
        );

    const monthYearDisplay =
        document.getElementById(monthYearDisplayId);

    if (monthYearDisplay) {
        monthYearDisplay.textContent =
            firstDay.toLocaleString('default', {
                month: 'long',
                year: 'numeric'
            });
    }

    container.innerHTML = '';

    const startingDayOfWeek = firstDay.getDay();

    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        container.appendChild(emptyDay);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {

        const dayEl = document.createElement('div');

        dayEl.className = 'calendar-day bg-gray-100';
        dayEl.textContent = i;

        if (checkedDays.includes(i)) {
            dayEl.classList.add('checked-in-day');
        } else {
            dayEl.classList.add('clickable');
        }

        if (elementId === 'calendar-days') {

            const dayDate = new Date(
                date.getFullYear(),
                date.getMonth(),
                i
            );

            dayEl.addEventListener('click', () => {

                selectedDate = dayDate;

                const bookingDate =
                    document.getElementById('booking-date');

                if (bookingDate) {
                    bookingDate.value =
                        selectedDate.toDateString();
                }

                document
                    .querySelectorAll(
                        `#${elementId} .calendar-day`
                    )
                    .forEach(d =>
                        d.classList.remove('selected')
                    );

                dayEl.classList.add('selected');
            });
        }

        container.appendChild(dayEl);
    }
}

// --- MAIN APPLICATION ---
document.addEventListener('DOMContentLoaded', () => {

    const navLinks =
        document.querySelectorAll('.nav-link');

    const pages =
        document.querySelectorAll('#main-content .page');

    const aiChatForm =
        document.getElementById('ai-chat-form');

    const chatContainer =
        document.getElementById('chat-container');

    const chatInput =
        document.getElementById('chat-input');

    const messageBox =
        document.getElementById('message-box');

    const closeMessageBox =
        document.getElementById('close-message-box');

    const emergencyHelpButton =
        document.getElementById('emergency-help-button');

    const toggleMenuBtn =
        document.getElementById('toggle-menu');

    const navMenu =
        document.getElementById('nav-menu');

    const startChatBtn =
        document.getElementById('start-chat-btn');

    const bookSessionBtn =
        document.getElementById('book-session-btn');

    const exploreResourcesBtn =
        document.getElementById('explore-resources-btn');

    const accountBtn =
        document.getElementById('account-btn');

    const checkinNowBtn =
        document.getElementById('checkin-now-btn');

    const dailyCheckinEmojis =
        document.querySelectorAll('.checkin-emoji');

    const dailyCheckinNote =
        document.getElementById('checkin-note');

    const submitCheckinBtn =
        document.getElementById('submit-checkin-btn');

    const loginForm =
        document.getElementById('login-form');

    const signupForm =
        document.getElementById('signup-form');

    const showSignupLink =
        document.getElementById('show-signup');

    const showLoginLink =
        document.getElementById('show-login-link');

    const showLoginBtn =
        document.getElementById('show-login');

    const loginTitle =
        document.getElementById('login-title');

    const voiceInputButton =
        document.getElementById('voice-input-button');

    const phq9Form =
        document.getElementById('phq9-form');

    const gad7Form =
        document.getElementById('gad7-form');

    let recognition;
    let isListening = false;

    // --- QUOTE GENERATOR ---
    const quotes = [
        "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
        "It’s okay to not be okay, but it’s not okay to stay that way.",
        "Healing takes time, and asking for help is a courageous step.",
        "You are not your illness. You have an individual story to tell.",
        "Self-care is how you take your power back.",
        "Every day may not be good, but there is something good in every day.",
        "Talking about mental health does not make you weak. It makes you human.",
        "Be kind to your mind. Rest is productive too."
    ];

    const newQuoteBtn =
        document.getElementById("new-quote-btn");

    const quoteDisplay =
        document.getElementById("quote");

    function newQuote() {
        if (!quoteDisplay) return;

        const randomIndex =
            Math.floor(Math.random() * quotes.length);

        quoteDisplay.innerText =
            quotes[randomIndex];
    }

    if (newQuoteBtn) {
        newQuoteBtn.addEventListener(
            "click",
            newQuote
        );
    }

    newQuote();

    // --- VOICE INPUT ---
    if (
        'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in window
    ) {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {

            const transcript =
                event.results[0][0].transcript;

            chatInput.value = transcript;

            voiceInputButton.classList.remove(
                'bg-purple-500',
                'text-white'
            );

            isListening = false;
        };

        recognition.onerror = (event) => {

            console.error(
                'Speech recognition error',
                event.error
            );

            voiceInputButton.classList.remove(
                'bg-purple-500',
                'text-white'
            );

            isListening = false;
        };

        recognition.onend = () => {

            voiceInputButton.classList.remove(
                'bg-purple-500',
                'text-white'
            );

            isListening = false;
        };

        if (voiceInputButton) {

            voiceInputButton.addEventListener(
                'click',
                () => {

                    if (isListening) {

                        recognition.stop();

                    } else {

                        recognition.start();

                        voiceInputButton.classList.add(
                            'bg-purple-500',
                            'text-white'
                        );

                        isListening = true;
                    }
                }
            );
        }

    } else if (voiceInputButton) {

        voiceInputButton.style.display = 'none';

        console.warn(
            'Speech Recognition API not supported.'
        );
    }

    // --- MOBILE MENU ---
    if (toggleMenuBtn && navMenu) {

        toggleMenuBtn.addEventListener(
            'click',
            () => {
                navMenu.classList.toggle('hidden');
            }
        );
    }

    // --- PAGE NAVIGATION ---
    function showPage(pageId) {

        pages.forEach(page => {
            page.classList.add('hidden');
        });

        const selectedPage =
            document.getElementById(pageId);

        if (selectedPage) {
            selectedPage.classList.remove('hidden');
        }

        if (window.innerWidth < 768 && navMenu) {
            navMenu.classList.add('hidden');
        }

        const mainContent =
            document.getElementById('main-content');

        if (mainContent) {
            mainContent.scrollTop = 0;
        }

        if (pageId === 'book-session-page') {
            renderCalendar(
                'calendar-days',
                currentDate
            );
        }

        if (pageId === 'daily-checkin-page') {
            renderCalendar(
                'streak-calendar-days',
                streakDate,
                checkedInDays
            );
        }
    }

    navLinks.forEach(link => {

        link.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                const pageId =
                    e.currentTarget.dataset.page;

                showPage(pageId);
            }
        );
    });

    // --- QUICK ACCESS BUTTONS ---
    if (startChatBtn) {
        startChatBtn.addEventListener(
            'click',
            () => showPage('ai-chat-page')
        );
    }

    if (bookSessionBtn) {
        bookSessionBtn.addEventListener(
            'click',
            () => showPage('book-session-page')
        );
    }

    if (exploreResourcesBtn) {
        exploreResourcesBtn.addEventListener(
            'click',
            () => showPage('resource-hub-page')
        );
    }

    if (accountBtn) {
        accountBtn.addEventListener(
            'click',
            () => showPage('login-page')
        );
    }

    if (checkinNowBtn) {
        checkinNowBtn.addEventListener(
            'click',
            () => showPage('daily-checkin-page')
        );
    }

    // =====================================================
    // GROQ AI CHAT
    // =====================================================

    if (aiChatForm) {

        aiChatForm.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                const userMessage =
                    chatInput.value.trim();

                if (!userMessage) return;

                // User message
                const userMessageDiv =
                    document.createElement('div');

                userMessageDiv.className =
                    'flex justify-end mb-5 chat-entry-animation';

                userMessageDiv.innerHTML =
                    `<div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xl">
                        ${userMessage}
                    </div>`;

                chatContainer.appendChild(
                    userMessageDiv
                );

                // Loading message
                const aiLoadingDiv =
                    document.createElement('div');

                aiLoadingDiv.className =
                    'flex justify-start mb-5';

                aiLoadingDiv.innerHTML =
                    `<div class="main-bg text-white p-3 rounded-lg max-w-xl animate-pulse">
                        Thinking...
                    </div>`;

                chatContainer.appendChild(
                    aiLoadingDiv
                );

                chatContainer.scrollTop =
                    chatContainer.scrollHeight;

                try {

                    const systemPrompt =
                        "You are a supportive and empathetic AI assistant for a student wellness platform. Your goal is to provide helpful, general advice and guidance on topics like stress, time management, and mental well-being. Always maintain a kind and encouraging tone. Do not give medical advice.";

                    const apiKey =
                        "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";

                    const apiUrl =
                        "https://api.groq.com/openai/v1/chat/completions";

                    const payload = {

                        model:
                            "openai/gpt-oss-20b",

                        messages: [

                            {
                                role: "system",
                                content: systemPrompt
                            },

                            {
                                role: "user",
                                content: userMessage
                            }

                        ]
                    };

                    const response =
                        await fetch(
                            apiUrl,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${apiKey}`
                                },

                                body:
                                    JSON.stringify(payload)
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {

                        throw new Error(
                            data.error?.message ||
                            "Groq API error"
                        );
                    }

                    const reply =
                        data.choices[0].message.content;

                    const formattedReply =
                        formatTextToHtml(reply);

                    aiLoadingDiv.remove();

                    const aiMessageDiv =
                        document.createElement('div');

                    aiMessageDiv.className =
                        'flex justify-start mb-5 chat-entry-animation';

                    aiMessageDiv.innerHTML =
                        `<div class="main-bg text-white p-3 rounded-lg max-w-xl">
                            ${formattedReply}
                        </div>`;

                    chatContainer.appendChild(
                        aiMessageDiv
                    );

                    chatContainer.scrollTop =
                        chatContainer.scrollHeight;

                } catch (error) {

                    console.error(
                        "Groq API Error:",
                        error
                    );

                    aiLoadingDiv.remove();

                    const aiMessageDiv =
                        document.createElement('div');

                    aiMessageDiv.className =
                        'flex justify-start mb-5 chat-entry-animation';

                    aiMessageDiv.innerHTML =
                        `<div class="main-bg text-white p-3 rounded-lg max-w-xl">
                            I'm sorry, I'm having trouble connecting right now.
                            Please try again in a moment.
                            Error: ${error.message}
                        </div>`;

                    chatContainer.appendChild(
                        aiMessageDiv
                    );

                    chatContainer.scrollTop =
                        chatContainer.scrollHeight;
                }

                chatInput.value = '';
            }
        );
    }

    // --- EMERGENCY HELP ---
    if (emergencyHelpButton) {

        emergencyHelpButton.addEventListener(
            'click',
            () => showPage('emergency-page')
        );
    }

    // --- PHQ-9 ---
    if (phq9Form) {

        phq9Form.addEventListener(
            'submit',
            (e) => {

                e.preventDefault();

                const formData =
                    new FormData(phq9Form);

                let totalScore = 0;

                for (let i = 1; i <= 9; i++) {

                    const value =
                        formData.get(`phq9_q${i}`);

                    if (value === null) {

                        const result =
                            document.getElementById(
                                'phq9-result'
                            );

                        result.innerHTML =
                            `<p class="text-red-500">
                                Please answer all 9 questions.
                            </p>`;

                        result.classList.remove('hidden');

                        return;
                    }

                    totalScore +=
                        parseInt(value, 10);
                }

                const interpretation =
                    getPHQ9Interpretation(
                        totalScore
                    );

                const resultDiv =
                    document.getElementById(
                        'phq9-result'
                    );

                resultDiv.innerHTML = `
                    <h3 class="text-xl font-bold ${interpretation.color} mb-2">
                        Your PHQ-9 Score: ${totalScore}
                    </h3>

                    <p class="text-lg font-semibold">
                        Depression Severity: ${interpretation.severity}
                    </p>

                    <p class="mt-2 text-sm text-gray-600">
                        <b>Action Guideline:</b>
                        ${interpretation.action}
                    </p>
                `;

                resultDiv.classList.remove('hidden');
            }
        );
    }

    // --- GAD-7 ---
    if (gad7Form) {

        gad7Form.addEventListener(
            'submit',
            (e) => {

                e.preventDefault();

                const formData =
                    new FormData(gad7Form);

                let totalScore = 0;

                for (let i = 1; i <= 7; i++) {

                    const value =
                        formData.get(`gad7_q${i}`);

                    if (value === null) {

                        const result =
                            document.getElementById(
                                'gad7-result'
                            );

                        result.innerHTML =
                            `<p class="text-red-500">
                                Please answer all 7 questions.
                            </p>`;

                        result.classList.remove('hidden');

                        return;
                    }

                    totalScore +=
                        parseInt(value, 10);
                }

                const interpretation =
                    getGAD7Interpretation(
                        totalScore
                    );

                const resultDiv =
                    document.getElementById(
                        'gad7-result'
                    );

                resultDiv.innerHTML = `
                    <h3 class="text-xl font-bold ${interpretation.color} mb-2">
                        Your GAD-7 Score: ${totalScore}
                    </h3>

                    <p class="text-lg font-semibold">
                        Anxiety Severity: ${interpretation.severity}
                    </p>

                    <p class="mt-2 text-sm text-gray-600">
                        <b>Action Guideline:</b>
                        ${interpretation.action}
                    </p>
                `;

                resultDiv.classList.remove('hidden');
            }
        );
    }

    // --- MODALS ---
    const closeSuccessModal =
        document.getElementById(
            'close-success-modal'
        );

    const closeErrorModal =
        document.getElementById(
            'close-error-modal'
        );

    const successModal =
        document.getElementById(
            'success-modal'
        );

    const errorModal =
        document.getElementById(
            'error-modal'
        );

    if (closeSuccessModal && successModal) {

        closeSuccessModal.addEventListener(
            'click',
            () =>
                successModal.classList.add('hidden')
        );
    }

    if (closeErrorModal && errorModal) {

        closeErrorModal.addEventListener(
            'click',
            'click',
            () =>
                errorModal.classList.add('hidden')
        );
    }

    if (closeMessageBox && messageBox) {

        closeMessageBox.addEventListener(
            'click',
            () =>
                messageBox.classList.add('hidden')
        );
    }

    // --- LOGIN / SIGNUP ---
    if (showSignupLink) {

        showSignupLink.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                loginForm.classList.add('hidden');
                signupForm.classList.remove('hidden');

                loginTitle.textContent =
                    "Account Signup";

                showSignupLink.classList.add('hidden');
                showLoginLink.classList.remove('hidden');
            }
        );
    }

    if (showLoginBtn) {

        showLoginBtn.addEventListener(
            'click',
            (e) => {

                e.preventDefault();

                signupForm.classList.add('hidden');
                loginForm.classList.remove('hidden');

                loginTitle.textContent =
                    "Account Login";

                showSignupLink.classList.remove('hidden');
                showLoginLink.classList.add('hidden');
            }
        );
    }

    if (loginForm) {

        loginForm.addEventListener(
            'submit',
            (e) => {

                e.preventDefault();

                const roleElement =
                    document.querySelector(
                        'input[name="role"]:checked'
                    );

                const role =
                    roleElement ?
                    roleElement.value :
                    'student';

                const email =
                    document.getElementById(
                        'login-email'
                    ).value;

                document.getElementById(
                    'success-message'
                ).textContent =
                    `Login as a ${role} with email ${email} is a success! (This is a front-end demo; no data has been saved.)`;

                successModal.classList.remove(
                    'hidden'
                );

                loginForm.reset();
            }
        );
    }

    if (signupForm) {

        signupForm.addEventListener(
            'submit',
            (e) => {

                e.preventDefault();

                const roleElement =
                    document.querySelector(
                        'input[name="role"]:checked'
                    );

                const role =
                    roleElement ?
                    roleElement.value :
                    'student';

                const email =
                    document.getElementById(
                        'signup-email'
                    ).value;

                document.getElementById(
                    'success-message'
                ).textContent =
                    `Account created for ${email} as a ${role}! (This is a front-end demo; no data has been saved.)`;

                successModal.classList.remove(
                    'hidden'
                );

                signupForm.reset();

                if (showLoginBtn) {
                    showLoginBtn.click();
                }
            }
        );
    }

    // --- BOOKING & CALENDAR ---
    const bookingForm =
        document.getElementById(
            'booking-form'
        );

    const prevMonthBtn =
        document.getElementById(
            'prev-month'
        );

    const nextMonthBtn =
        document.getElementById(
            'next-month'
        );

    const upcomingSessionsContainer =
        document.getElementById(
            'upcoming-sessions'
        );

    if (prevMonthBtn) {

        prevMonthBtn.addEventListener(
            'click',
            () => {

                currentDate.setMonth(
                    currentDate.getMonth() - 1
                );

                renderCalendar(
                    'calendar-days',
                    currentDate
                );
            }
        );
    }

    if (nextMonthBtn) {

        nextMonthBtn.addEventListener(
            'click',
            () => {

                currentDate.setMonth(
                    currentDate.getMonth() + 1
                );

                renderCalendar(
                    'calendar-days',
                    currentDate
                );
            }
        );
    }

    if (bookingForm) {

        bookingForm.addEventListener(
            'submit',
            (e) => {

                e.preventDefault();

                const bookingTime =
                    document.getElementById(
                        'booking-time'
                    ).value;

                if (!selectedDate || !bookingTime) {

                    document.getElementById(
                        'error-message'
                    ).textContent =
                        "Please select a date and time for your session.";

                    errorModal.classList.remove(
                        'hidden'
                    );

                    return;
                }

                document.getElementById(
                    'success-message'
                ).textContent =
                    `Booking for ${selectedDate.toDateString()} at ${bookingTime} is confirmed. This is a front-end demo; no data has been saved.`;

                successModal.classList.remove(
                    'hidden'
                );

                bookingForm.reset();

                selectedDate = null;

                document
                    .querySelectorAll('.calendar-day')
                    .forEach(d =>
                        d.classList.remove(
                            'selected'
                        )
                    );

                renderCalendar(
                    'calendar-days',
                    currentDate
                );
            }
        );
    }

    if (upcomingSessionsContainer) {

        upcomingSessionsContainer.innerHTML =
            '<p class="text-gray-500 italic">No upcoming sessions. Book your first one!</p>';
    }

    // --- DAILY CHECK-IN ---
    let selectedEmoji = null;

    dailyCheckinEmojis.forEach(btn => {

        btn.addEventListener(
            'click',
            () => {

                dailyCheckinEmojis.forEach(
                    emojiBtn =>
                        emojiBtn.classList.remove(
                            'bg-gray-200'
                        )
                );

                btn.classList.add(
                    'bg-gray-200'
                );

                selectedEmoji =
                    btn.dataset.emoji;
            }
        );
    });

    const streakPrevMonth =
        document.getElementById(
            'streak-prev-month'
        );

    const streakNextMonth =
        document.getElementById(
            'streak-next-month'
        );

    if (streakPrevMonth) {

        streakPrevMonth.addEventListener(
            'click',
            () => {

                streakDate.setMonth(
                    streakDate.getMonth() - 1
                );

                renderCalendar(
                    'streak-calendar-days',
                    streakDate,
                    checkedInDays
                );
            }
        );
    }

    if (streakNextMonth) {

        streakNextMonth.addEventListener(
            'click',
            () => {

                streakDate.setMonth(
                    streakDate.getMonth() + 1
                );

                renderCalendar(
                    'streak-calendar-days',
                    streakDate,
                    checkedInDays
                );
            }
        );
    }

    if (submitCheckinBtn) {

        submitCheckinBtn.addEventListener(
            'click',
            () => {

                const note =
                    dailyCheckinNote.value.trim();

                if (selectedEmoji || note) {

                    document.getElementById(
                        'success-message'
                    ).textContent =
                        'Your daily check-in has been submitted!';

                    successModal.classList.remove(
                        'hidden'
                    );

                    console.log(
                        'Daily Check-in Submitted:',
                        {
                            emoji: selectedEmoji,
                            note: note,
                            date:
                                new Date().toISOString()
                        }
                    );

                    dailyCheckinNote.value = '';

                    dailyCheckinEmojis.forEach(
                        btn =>
                            btn.classList.remove(
                                'bg-gray-200'
                            )
                    );

                    selectedEmoji = null;

                    checkedInDays.push(
                        new Date().getDate()
                    );

                    renderCalendar(
                        'streak-calendar-days',
                        streakDate,
                        checkedInDays
                    );

                } else {

                    document.getElementById(
                        'error-message'
                    ).textContent =
                        "Please select an emoji or write a note to check in.";

                    errorModal.classList.remove(
                        'hidden'
                    );
                }
            }
        );
    }

    // Initial page
    showPage('home-page');
});

// --- PEER SUPPORT ---
document.querySelectorAll('.peer-card')
    .forEach(card => {

        const phoneElement =
            card.querySelector('.phone');

        const callBtn =
            card.querySelector('.call');

        const whatsappBtn =
            card.querySelector('.whatsapp');

        const videoBtn =
            card.querySelector('.video');

        if (!phoneElement) return;

        const phone =
            phoneElement.innerText;

        if (callBtn) {

            callBtn.addEventListener(
                'click',
                () => {
                    window.location.href =
                        "tel:" + phone;
                }
            );
        }

        if (whatsappBtn) {

            whatsappBtn.addEventListener(
                'click',
                () => {
                    window.open(
                        "https://wa.me/" + phone,
                        "_blank"
                    );
                }
            );
        }

        if (videoBtn) {

            videoBtn.addEventListener(
                'click',
                () => {
                    window.open(
                        "https://meet.google.com",
                        "_blank"
                    );
                }
            );
        }
    });

// --- COMMUNITY POSTS ---
function createPost() {

    const postInput =
        document.getElementById('postInput');

    const moodSelect =
        document.getElementById('moodSelect');

    const anonCheck =
        document.getElementById('anonCheck');

    const feed =
        document.getElementById('postFeed');

    if (!postInput || !moodSelect || !anonCheck || !feed) {
        return;
    }

    const text =
        postInput.value;

    const mood =
        moodSelect.value;

    const isAnon =
        anonCheck.checked;

    if (!text.trim()) {
        alert("Please type something first!");
        return;
    }

    const postHTML = `
        <div class="pa-card">

            <div style="display:flex; justify-content:space-between;">

                <strong>
                    ${isAnon ? 'Anonymous' : 'Student'}
                </strong>

                <span style="font-size: 0.8rem; color: #6c47ff;">
                    ${mood}
                </span>

            </div>

            <p style="margin: 15px 0;">
                ${text}
            </p>

            <div style="border-top: 1px solid #eee; padding-top: 10px; display:flex; gap: 15px;">

                <button style="background:none; border:none; color:#6c47ff; cursor:pointer;">
                    <i class="fas fa-thumbs-up"></i>
                    Support (0)
                </button>

                <button style="background:none; border:none; color:#777; cursor:pointer;">
                    <i class="fas fa-comment"></i>
                    Reply
                </button>

            </div>

        </div>
    `;

    feed.insertAdjacentHTML(
        'afterbegin',
        postHTML
    );

    postInput.value = "";
}

// --- WELLNESS MODULE ---
let breathingInterval = null;
let waterGlasses = 0;

document.addEventListener(
    'click',
    (e) => {

        const navLink =
            e.target.closest('.nav-link');

        if (!navLink) return;

        const pageId =
            navLink.getAttribute(
                'data-page'
            );

        if (pageId === 'wellness-page') {

            if (!breathingInterval) {
                startBreathingLogic();
            }

        } else {

            if (breathingInterval) {

                clearInterval(
                    breathingInterval
                );

                breathingInterval = null;
            }
        }
    }
);

function startBreathingLogic() {

    const circle =
        document.getElementById(
            'breathing-circle'
        );

    const instruction =
        document.getElementById(
            'breathing-instruction'
        );

    if (!circle) return;

    breathingInterval =
        setInterval(
            () => {

                if (circle.classList.contains('grow')) {

                    circle.classList.remove(
                        'grow'
                    );

                    circle.innerText =
                        "Exhale";

                    if (instruction) {
                        instruction.innerText =
                            "Slowly release your breath...";
                    }

                } else {

                    circle.classList.add(
                        'grow'
                    );

                    circle.innerText =
                        "Inhale";

                    if (instruction) {
                        instruction.innerText =
                            "Fill your lungs with air...";
                    }
                }

            },
            4000
        );
}

function addWater() {

    const dailyGoal = 8;

    const progressBar =
        document.getElementById(
            'water-progress'
        );

    const textCount =
        document.getElementById(
            'water-count'
        );

    if (waterGlasses < dailyGoal) {

        waterGlasses++;

        const progress =
            (waterGlasses / dailyGoal) * 100;

        if (progressBar) {
            progressBar.style.width =
                progress + "%";
        }

        if (textCount) {
            textCount.innerText =
                `${waterGlasses}/${dailyGoal}`;
        }
    }
}
