
// --- GLOBAL DATE VARIABLES (FIX APPLIED HERE) ---
    // Moved outside of DOMContentLoaded so they can be accessed when 
    // renderCalendar is called from showPage.
    let selectedDate = null;
    let currentDate = new Date();
    const checkedInDays = [5, 6, 8, 9, 10, 12, 13, 15, 16, 17, 20, 21, 23, 24, 25]; // Mock data for streak
    let streakDate = new Date();

    /**
     * Utility function to convert raw text with line breaks (from the AI) 
     * into HTML that the browser can render with proper spacing (paragraphs/breaks).
     */
    function formatTextToHtml(text) {
        // Split text by intended paragraph breaks (\n\n)
        let paragraphs = text.split('\n\n');
        
        let html = paragraphs.map(p => {
            let content = p.trim();
            if (content.length === 0) return '';
            
            // 1. Handle single newlines within the paragraph (for lists/breaks)
            content = content.replace(/\n/g, '<br>');
            
            // 2. Handle bolding markdown **text**
            content = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

            // 3. Add margin-bottom (mb-4) to create a visible space after each paragraph
            // 'last:mb-0' ensures the final paragraph doesn't add unnecessary space at the bottom of the bubble
            return `<p class="mb-4 last:mb-0">${content}</p>`; 
        }).join('');
        
        // Wrap the result in a div for structural integrity
        return `<div>${html}</div>`;
    }

    // --- PHQ-9 and GAD-7 SCORING LOGIC ---
    function getPHQ9Interpretation(score) {
        if (score >= 20) return { severity: "Severe depression", color: "text-red-600", action: "Immediate initiation of pharmacotherapy and expedited referral to a mental health specialist." };
        if (score >= 15) return { severity: "Moderately severe depression", color: "text-red-500", action: "Active treatment with pharmacotherapy and/or psychotherapy is recommended." }; 
        if (score >= 10) return { severity: "Moderate depression", color: "text-yellow-600", action: "Treatment plan, considering counseling, follow-up and/or pharmacotherapy." };
        if (score >= 5) return { severity: "Mild depression", color: "text-green-500", action: "Watchful waiting; repeat screening at follow-up." };
        return { severity: "Minimal depression", color: "text-gray-500", action: "Treatment may not be clinically indicated." };
    }

    function getGAD7Interpretation(score) {
        if (score >= 15) return { severity: "Severe Anxiety", color: "text-red-600", action: "Often warrants treatment using medication, therapy, or both. Interventions target specific symptoms." };
        if (score >= 10) return { severity: "Moderate Anxiety", color: "text-red-500", action: "Treatment goals and interventions target the specific symptoms indicated by client's answers." }; 
        if (score >= 5) return { severity: "Mild Anxiety", color: "text-green-500", action: "Therapist uses clinical judgement about treatment needs." };
        return { severity: "Minimal Anxiety", color: "text-gray-500", action: "Treatment may not be clinically indicated." };
    }
    // --- END SCORING LOGIC ---

    function renderCalendar(elementId, date, checkedDays = []) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const container = document.getElementById(elementId);
        // Safely determine the month/year display element ID
        const monthYearDisplayId = elementId.replace('calendar-days', 'current-month-year').replace('streak-calendar-days', 'streak-current-month-year');
        const monthYearDisplay = document.getElementById(monthYearDisplayId);
        
        // Safety check before updating textContent
        if (monthYearDisplay) {
            monthYearDisplay.textContent = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
        }
        
        container.innerHTML = '';

        const startingDayOfWeek = firstDay.getDay();
        for(let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            container.appendChild(emptyDay);
        }

        for(let i = 1; i <= lastDay.getDate(); i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day bg-gray-100';
            dayEl.textContent = i;

            if (checkedDays.includes(i)) {
                dayEl.classList.add('checked-in-day');
            } else {
                dayEl.classList.add('clickable');
            }
            
            if (elementId === 'calendar-days') {
                const dayDate = new Date(date.getFullYear(), date.getMonth(), i);
                dayEl.addEventListener('click', () => {
                    selectedDate = dayDate;
                    document.getElementById('booking-date').value = selectedDate.toDateString();
                    document.querySelectorAll(`#${elementId} .calendar-day`).forEach(d => d.classList.remove('selected'));
                    dayEl.classList.add('selected');
                });
            }
            container.appendChild(dayEl);
        }
    }


    document.addEventListener('DOMContentLoaded', () => {
        // FIX APPLIED: This selector was changed from '#sidebar .nav-link' to just '.nav-link'.
        const navLinks = document.querySelectorAll('.nav-link'); 
        const pages = document.querySelectorAll('#main-content .page');
        const aiChatForm = document.getElementById('ai-chat-form');
        const chatContainer = document.getElementById('chat-container');
        const chatInput = document.getElementById('chat-input');
        const messageBox = document.getElementById('message-box');
        const emergencyHelpButton = document.getElementById('emergency-help-button');
        const toggleMenuBtn = document.getElementById('toggle-menu');
        const navMenu = document.getElementById('nav-menu');
        
        // Buttons on the main page (for quick access links)
        const startChatBtn = document.getElementById('start-chat-btn');
        const bookSessionBtn = document.getElementById('book-session-btn');
        const exploreResourcesBtn = document.getElementById('explore-resources-btn');
        const accountBtn = document.getElementById('account-btn');
        const checkinNowBtn = document.getElementById('checkin-now-btn');

        const dailyCheckinEmojis = document.querySelectorAll('.checkin-emoji');
        const dailyCheckinNote = document.getElementById('checkin-note');
        const submitCheckinBtn = document.getElementById('submit-checkin-btn');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const showSignupLink = document.getElementById('show-signup');
        const showLoginLink = document.getElementById('show-login-link');
        const showLoginBtn = document.getElementById('show-login');
        const loginTitle = document.getElementById('login-title');
        const voiceInputButton = document.getElementById('voice-input-button');
        const phq9Form = document.getElementById('phq9-form');
        const gad7Form = document.getElementById('gad7-form');
        let recognition;
        let isListening = false;
        
        // --- Quote Generator Functionality ---
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
        const newQuoteBtn = document.getElementById("new-quote-btn");
        const quoteDisplay = document.getElementById("quote");

        function newQuote() {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            quoteDisplay.innerText = quotes[randomIndex];
        }

        newQuoteBtn.addEventListener("click", newQuote);
        newQuote();
        
        // --- End Quote Generator Functionality ---

        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                chatInput.value = transcript;
                voiceInputButton.classList.remove('bg-purple-500', 'text-white');
                isListening = false;
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                voiceInputButton.classList.remove('bg-purple-500', 'text-white');
                isListening = false;
            };

            recognition.onend = () => {
                voiceInputButton.classList.remove('bg-purple-500', 'text-white');
                isListening = false;
            };

            voiceInputButton.addEventListener('click', () => {
                if (isListening) {
                    recognition.stop();
                } else {
                    recognition.start();
                    voiceInputButton.classList.add('bg-purple-500', 'text-white');
                    isListening = true;
                }
            });
        } else {
            voiceInputButton.style.display = 'none';
            console.warn('Speech Recognition API not supported in this browser.');
        }

        toggleMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('hidden');
        });

        function showPage(pageId) {
            pages.forEach(page => {
                page.classList.add('hidden');
            });
            document.getElementById(pageId).classList.remove('hidden');
            if (window.innerWidth < 768) {
                navMenu.classList.add('hidden');
            }
            // Scroll to top when changing pages
            document.getElementById('main-content').scrollTop = 0;

            // FIX APPLIED HERE: Re-render calendars on page switch to ensure visibility
            if (pageId === 'book-session-page') {
                renderCalendar('calendar-days', currentDate);
            }
            if (pageId === 'daily-checkin-page') {
                renderCalendar('streak-calendar-days', streakDate, checkedInDays);
            }
        }

        // FIX APPLIED HERE: The new selector '.nav-link' is used.
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = e.currentTarget.dataset.page;
                showPage(pageId);
            });
        });
        
        // Event listeners for quick navigation buttons
        startChatBtn.addEventListener('click', () => showPage('ai-chat-page'));
        bookSessionBtn.addEventListener('click', () => showPage('book-session-page'));
        exploreResourcesBtn.addEventListener('click', () => showPage('resource-hub-page'));
        accountBtn.addEventListener('click', () => showPage('login-page'));
        checkinNowBtn.addEventListener('click', () => showPage('daily-checkin-page'));

        aiChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userMessage = chatInput.value.trim();
            if (userMessage) {
                const userMessageDiv = document.createElement('div');
                // Increased vertical margin to mb-5
                userMessageDiv.className = 'flex justify-end mb-5 chat-entry-animation'; 
                // Increased max width to max-w-xl
                userMessageDiv.innerHTML = `<div class="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-xl">${userMessage}</div>`;
                chatContainer.appendChild(userMessageDiv);

                const aiLoadingDiv = document.createElement('div');
                // Increased vertical margin to mb-5
                aiLoadingDiv.className = 'flex justify-start mb-5';
                // Increased max width to max-w-xl
                aiLoadingDiv.innerHTML = `<div class="main-bg text-white p-3 rounded-lg max-w-xl animate-pulse">Thinking...</div>`;
                chatContainer.appendChild(aiLoadingDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;

                try {
                    const systemPrompt = "You are a supportive and empathetic AI assistant for a student wellness platform. Your goal is to provide helpful, general advice and guidance on topics like stress, time management, and mental well-being. Always maintain a kind and encouraging tone. Do not give medical advice.";
                    const userQuery = userMessage;
                    const apiKey = "AIzaSyBDxbls9VC6LyLSErX3gyCd7nkv1jMlDi4";
                    // CORRECT MODEL: gemini-2.5-flash
                    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`; 
                    const payload = {
                        contents: [{ parts: [{ text: userQuery }] }],
                        systemInstruction: {
                            parts: [{ text: systemPrompt }]
                        },
                    };

                    let retryCount = 0;
                    const maxRetries = 3;
                    let response;
                    while(retryCount < maxRetries) {
                        try {
                            response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            // Stop retrying if successful or a non-rate-limit error (like 503)
                            if (response.status !== 429) break; 
                            retryCount++;
                            const delay = Math.pow(2, retryCount) * 1000;
                            await new Promise(resolve => setTimeout(resolve, delay));
                        } catch(e) {
                            retryCount++;
                            const delay = Math.pow(2, retryCount) * 1000;
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }

                    if (!response || !response.ok) {
                        const errorData = await response.json();
                        console.error("API Error Response:", errorData);
                        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorData.error.message}`);
                    }

                    const data = await response.json();
                    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn’t generate a response.";
                    
                    // Format the raw text reply into readable HTML
                    const formattedReply = formatTextToHtml(reply);

                    aiLoadingDiv.remove();
                    const aiMessageDiv = document.createElement('div');
                    // Added chat-entry-animation class
                    aiMessageDiv.className = 'flex justify-start mb-5 chat-entry-animation';
                    
                    // Use innerHTML to render the formatted text, increased max width to max-w-xl
                    aiMessageDiv.innerHTML = `<div class="main-bg text-white p-3 rounded-lg max-w-xl">${formattedReply}</div>`; 
                    
                    chatContainer.appendChild(aiMessageDiv);
                    chatContainer.scrollTop = chatContainer.scrollHeight;

                } catch (error) {
                    console.error("Gemini API Error:", error);
                    aiLoadingDiv.remove();
                    const aiMessageDiv = document.createElement('div');
                    // Added chat-entry-animation class
                    aiMessageDiv.className = 'flex justify-start mb-5 chat-entry-animation';
                    // Increased max width to max-w-xl
                    aiMessageDiv.innerHTML = `<div class="main-bg text-white p-3 rounded-lg max-w-xl">I'm sorry, I'm having trouble connecting right now. Please try again in a moment. Error: ${error.message}</div>`;
                    chatContainer.appendChild(aiMessageDiv);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }

                chatInput.value = '';
            }
        });

        // UPDATED: Emergency Help button now uses showPage('emergency-page')
        emergencyHelpButton.addEventListener('click', () => {
            showPage('emergency-page');
        });

        // --- PHQ-9 Form Submission ---
        phq9Form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(phq9Form);
            let totalScore = 0;
            
            // Collect and sum scores
            for (let i = 1; i <= 9; i++) {
                const questionName = `phq9_q${i}`;
                const value = formData.get(questionName);
                if (value === null) {
                    document.getElementById('phq9-result').innerHTML = `<p class="text-red-500">Please answer all 9 questions.</p>`;
                    document.getElementById('phq9-result').classList.remove('hidden');
                    return;
                }
                totalScore += parseInt(value, 10);
            }

            const interpretation = getPHQ9Interpretation(totalScore);
            const resultDiv = document.getElementById('phq9-result');
            
            // Updated result display for clean text formatting
            resultDiv.innerHTML = `
                <h3 class="text-xl font-bold ${interpretation.color} mb-2">Your PHQ-9 Score: ${totalScore}</h3>
                <p class="text-lg font-semibold">Depression Severity: ${interpretation.severity}</p>
                <p class="mt-2 text-sm text-gray-600"><b>Action Guideline:</b> ${interpretation.action}</p>
            `;
            resultDiv.classList.remove('hidden');
        });

        // --- GAD-7 Form Submission ---
        gad7Form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(gad7Form);
            let totalScore = 0;
            
            // Collect and sum scores
            for (let i = 1; i <= 7; i++) {
                const questionName = `gad7_q${i}`;
                const value = formData.get(questionName);
                if (value === null) {
                    document.getElementById('gad7-result').innerHTML = `<p class="text-red-500">Please answer all 7 questions.</p>`;
                    document.getElementById('gad7-result').classList.remove('hidden');
                    return;
                }
                totalScore += parseInt(value, 10);
            }

            const interpretation = getGAD7Interpretation(totalScore);
            const resultDiv = document.getElementById('gad7-result');
            
            // Updated result display for clean text formatting
            resultDiv.innerHTML = `
                <h3 class="text-xl font-bold ${interpretation.color} mb-2">Your GAD-7 Score: ${totalScore}</h3>
                <p class="text-lg font-semibold">Anxiety Severity: ${interpretation.severity}</p>
                <p class="mt-2 text-sm text-gray-600"><b>Action Guideline:</b> ${interpretation.action}</p>
            `;
            resultDiv.classList.remove('hidden');
        });

        // Generic modal handlers
        const closeSuccessModal = document.getElementById('close-success-modal');
        const closeErrorModal = document.getElementById('close-error-modal');
        const successModal = document.getElementById('success-modal');
        const errorModal = document.getElementById('error-modal');
        closeSuccessModal.addEventListener('click', () => successModal.classList.add('hidden'));
        closeErrorModal.addEventListener('click', () => errorModal.classList.add('hidden'));


        closeMessageBox.addEventListener('click', () => {
            messageBox.classList.add('hidden');
        });

        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            loginTitle.textContent = "Account Signup";
            showSignupLink.classList.add('hidden');
            showLoginLink.classList.remove('hidden');
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            loginTitle.textContent = "Account Login";
            showSignupLink.classList.remove('hidden');
            showLoginLink.classList.add('hidden');
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.querySelector('input[name="role"]:checked').value;
            const email = document.getElementById('login-email').value;
            document.getElementById('success-message').textContent = `Login as a ${role} with email ${email} is a success! (This is a front-end demo; no data has been saved.)`;
            successModal.classList.remove('hidden');
            loginForm.reset();
        });

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const role = document.querySelector('input[name="role"]:checked').value;
            const email = document.getElementById('signup-email').value;
            document.getElementById('success-message').textContent = `Account created for ${email} as a ${role}! (This is a front-end demo; no data has been saved.)`;
            successModal.classList.remove('hidden');
            signupForm.reset();
            showLoginBtn.click();
        });

        // --- Booking & Calendar Logic (Existing) ---
        const bookingForm = document.getElementById('booking-form');
        const calendarDays = document.getElementById('calendar-days');
        const currentMonthYear = document.getElementById('current-month-year');
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        const bookingDateInput = document.getElementById('booking-date');
        const upcomingSessionsContainer = document.getElementById('upcoming-sessions');

        // Note: selectedDate, currentDate, checkedInDays, and streakDate are now declared globally
        // at the very top of the script.

        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar('calendar-days', currentDate);
        });

        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar('calendar-days', currentDate);
        });

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const bookingTime = document.getElementById('booking-time').value;
            const bookingNote = document.getElementById('booking-note').value;

            if (!selectedDate || !bookingTime) {
                document.getElementById('error-message').textContent = "Please select a date and time for your session.";
                errorModal.classList.remove('hidden');
                return;
            }

            document.getElementById('success-message').textContent = `Booking for ${selectedDate.toDateString()} at ${bookingTime} is confirmed. This is a front-end demo; no data has been saved.)`;
            successModal.classList.remove('hidden');
            bookingForm.reset();
            selectedDate = null;
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            renderCalendar('calendar-days', currentDate);
        });

        upcomingSessionsContainer.innerHTML = '<p class="text-gray-500 italic">No upcoming sessions. Book your first one!</p>';

        let selectedEmoji = null;
        dailyCheckinEmojis.forEach(btn => {
            btn.addEventListener('click', () => {
                dailyCheckinEmojis.forEach(emojiBtn => emojiBtn.classList.remove('bg-gray-200'));
                btn.classList.add('bg-gray-200');
                selectedEmoji = btn.dataset.emoji;
            });
        });

        document.getElementById('streak-prev-month').addEventListener('click', () => {
            streakDate.setMonth(streakDate.getMonth() - 1);
            renderCalendar('streak-calendar-days', streakDate, checkedInDays);
        });

        document.getElementById('streak-next-month').addEventListener('click', () => {
            streakDate.setMonth(streakDate.getMonth() + 1);
            renderCalendar('streak-calendar-days', streakDate, checkedInDays);
        });

        submitCheckinBtn.addEventListener('click', () => {
            const note = dailyCheckinNote.value.trim();
            if (selectedEmoji || note) {
                document.getElementById('success-message').textContent = 'Your daily check-in has been submitted!';
                successModal.classList.remove('hidden');
                console.log('Daily Check-in Submitted:', {
                    emoji: selectedEmoji,
                    note: note,
                    date: new Date().toISOString()
                });
                dailyCheckinNote.value = '';
                dailyCheckinEmojis.forEach(btn => btn.classList.remove('bg-gray-200'));
                selectedEmoji = null;
                checkedInDays.push(new Date().getDate());
                renderCalendar('streak-calendar-days', streakDate, checkedInDays);
            } else {
                document.getElementById('error-message').textContent = "Please select an emoji or write a note to check in.";
                errorModal.classList.remove('hidden');
            }
        });

        // The only initial calendar render is called via showPage('home-page') below 
        // to ensure all other necessary listeners/initializations are complete first.
        showPage('home-page'); 
    });
    //peer the call support 
    document.querySelectorAll(".peer-card").forEach(card => {

    const phone = card.querySelector(".phone").innerText;

    const callBtn = card.querySelector(".call");
    const whatsappBtn = card.querySelector(".whatsapp");
    const videoBtn = card.querySelector(".video");

    callBtn.addEventListener("click", () => {
        window.location.href = "tel:" + phone;
    });

    whatsappBtn.addEventListener("click", () => {
        window.open("https://wa.me/" + phone, "_blank");
    });

    videoBtn.addEventListener("click", () => {
        window.open("https://meet.google.com", "_blank");
    });

});


// Create a new professional community post
function createPost() {
    const text = document.getElementById('postInput').value;
    const mood = document.getElementById('moodSelect').value;
    const isAnon = document.getElementById('anonCheck').checked;

    if (!text.trim()) return alert("Please type something first!");

    const feed = document.getElementById('postFeed');
    const postHTML = `
        <div class="pa-card">
            <div style="display:flex; justify-content:space-between;">
                <strong>${isAnon ? 'Anonymous' : 'Student'}</strong>
                <span style="font-size: 0.8rem; color: #6c47ff;">${mood}</span>
            </div>
            <p style="margin: 15px 0;">${text}</p>
            <div style="border-top: 1px solid #eee; padding-top: 10px; display:flex; gap: 15px;">
                <button style="background:none; border:none; color:#6c47ff; cursor:pointer;"><i class="fas fa-thumbs-up"></i> Support (0)</button>
                <button style="background:none; border:none; color:#777; cursor:pointer;"><i class="fas fa-comment"></i> Reply</button>
            </div>
        </div>
    `;
    
    feed.insertAdjacentHTML('afterbegin', postHTML);
    document.getElementById('postInput').value = "";
}
// --- WELLNESS MODULE: ALL-IN-ONE BLOCK ---

// 1. Variable Declarations (Memory)
let breathingInterval = null; 
let waterGlasses = 0; 

// 2. The Auto-Trigger (Navigation Listener)
// This watches for clicks on .nav-link and starts/stops tools automatically
document.addEventListener('click', (e) => {
    const navLink = e.target.closest('.nav-link');
    if (!navLink) return;

    const pageId = navLink.getAttribute('data-page');

    if (pageId === 'wellness-page') {
        if (!breathingInterval) {
            startBreathingLogic();
        }
    } else {
        // Automatically turns off the timer when you leave the wellness page
        if (breathingInterval) {
            clearInterval(breathingInterval);
            breathingInterval = null;
        }
    }
});

// 3. The Logic Functions
function startBreathingLogic() {
    const circle = document.getElementById('breathing-circle');
    const instruction = document.getElementById('breathing-instruction');
    if (!circle) return;

    breathingInterval = setInterval(() => {
        if (circle.classList.contains('grow')) {
            circle.classList.remove('grow');
            circle.innerText = "Exhale";
            if (instruction) instruction.innerText = "Slowly release your breath...";
        } else {
            circle.classList.add('grow');
            circle.innerText = "Inhale";
            if (instruction) instruction.innerText = "Fill your lungs with air...";
        }
    }, 4000); 
}

function addWater() {
    const dailyGoal = 8;
    const progressBar = document.getElementById('water-progress');
    const textCount = document.getElementById('water-count');

    if (waterGlasses < dailyGoal) {
        waterGlasses++;
        const progress = (waterGlasses / dailyGoal) * 100;
        if (progressBar) progressBar.style.width = progress + "%";
        if (textCount) textCount.innerText = `${waterGlasses}/${dailyGoal}`;
    }
}
/* Splash Screen */

#splash{
position:fixed;
width:100%;
height:100vh;
background:#6A4CFF;
display:flex;
justify-content:center;
align-items:center;
z-index:9999;
}

.logo-container{
text-align:center;
color:white;
animation: smash 1.8s ease;
}

.logo-circle{
width:120px;
height:120px;
background:white;
color:#6A4CFF;
border-radius:50%;
display:flex;
justify-content:center;
align-items:center;
font-size:40px;
font-weight:bold;
margin:auto;
}

@keyframes smash{

0%{transform:scale(0);}
40%{transform:scale(1.3);}
60%{transform:scale(0.9);}
80%{transform:scale(1.1);}
100%{transform:scale(1);}

}

#main-content{
display:none;
}






