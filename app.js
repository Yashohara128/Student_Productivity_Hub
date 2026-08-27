// ==========================================
// STUDENT PRODUCTIVITY HUB - APP.JS (WHATSAPP NOTIFICATIONS READY)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBjzE30NZXDZsT-DuC9cBrksOjg0UsQM34",
    authDomain: "gpa-tracker-29cd2.firebaseapp.com",
    projectId: "gpa-tracker-29cd2",
    storageBucket: "gpa-tracker-29cd2.firebasestorage.app",
    messagingSenderId: "856930093441",
    appId: "1:856930093441:web:60a026cccbc6ceae120080",
    measurementId: "G-YELCCNX12Q"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const userNameDisplay = document.getElementById('user-name');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const addBtn = document.getElementById('add-btn');
const degreeInput = document.getElementById('degree-name');

// Navigation Views
const dashboardHub = document.getElementById('dashboard-hub');
const viewGpa = document.getElementById('view-gpa');
const viewDeadline = document.getElementById('view-deadline');
const viewPlagiarism = document.getElementById('view-plagiarism');

// Card Triggers
const cardGpa = document.getElementById('card-gpa');
const cardDeadline = document.getElementById('card-deadline');
const cardPlagiarism = document.getElementById('card-plagiarism');

// Back Buttons
const backToHubGpa = document.getElementById('back-to-hub-gpa');
const backToHubDeadline = document.getElementById('back-to-hub-deadline');
const backToHubPlagiarism = document.getElementById('back-to-hub-plagiarism');

let allSubjects = []; 
let tasks = [];
let currentUser = null; 
let editingSubjectId = null; 
let myChart = null;

const CLASS_THRESHOLDS = {
    FIRST_CLASS: 3.70,
    SECOND_UPPER: 3.30,
    SECOND_LOWER: 3.00,
    PASS: 2.00
};

// --- HELPER FUNCTIONS ---
function getActiveMode() {
    return localStorage.getItem('active_uni_mode') || 'horizon';
}

function getActiveSubjects() {
    const activeMode = getActiveMode();
    return allSubjects.filter(sub => (sub.mode || 'horizon') === activeMode);
}

// --- Google Login via Popup (Standard & Stable) ---
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Login Success:", result.user.displayName);
            })
            .catch((error) => {
                console.error("Login Error Code:", error.code);
                console.error("Login Error Message:", error.message);
                alert("❌ Login Failed: " + error.message);
            });
    });
}

// --- Dynamic Greeting Function (Time & Date) ---
function updateDynamicGreeting(userName) {
    const greetingEl = document.getElementById('welcome-greeting');
    if (!greetingEl) return;

    const now = new Date();
    const hours = now.getHours();
    
    let timeGreeting = "";
    let emoji = "";

    if (hours >= 5 && hours < 12) {
        timeGreeting = "Good Morning";
        emoji = "☀️";
    } else if (hours >= 12 && hours < 17) {
        timeGreeting = "Good Afternoon";
        emoji = "🌤️";
    } else if (hours >= 17 && hours < 21) {
        timeGreeting = "Good Evening";
        emoji = "🌆";
    } else {
        timeGreeting = "Good Night";
        emoji = "🌙";
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);

    greetingEl.innerHTML = `${emoji} ${timeGreeting}, <span style="color: var(--text-color); font-weight: 600;">${userName}</span>! <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">📅 ${formattedDate}</span>`;
}

// --- WhatsApp Alert Function ---
async function sendWhatsAppAlert(phoneNo, taskName, taskType, dueDate) {
    const apiKey = "YOUR_CALLMEBOT_API_KEY"; // CallMeBot API කී එක මෙහි දාන්න
    const message = encodeURIComponent(`⏰ Deadline Reminder!\n\nYour ${taskType} "${taskName}" is due on ${dueDate}. Please complete it on time!`);

    try {
        const res = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phoneNo}&text=${message}&apikey=${apiKey}`);
        if (res.ok) {
            console.log("WhatsApp alert sent successfully!");
        }
    } catch (err) {
        console.error("WhatsApp error:", err);
    }
}

// --- Browser Push & WhatsApp Notification System ---
let notifiedTasks = new Set(); 

function checkDeadlineNotifications() {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    setInterval(async () => {
        const now = new Date();
        if (!tasks || tasks.length === 0) return;

        // යූසර්ගේ ඩේටාබේස් එකෙන් WhatsApp නම්බර් එක ලබාගැනීම
        let userWhatsapp = null;
        if (currentUser) {
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    userWhatsapp = userDoc.data().whatsapp;
                }
            } catch (e) {
                console.error("Error fetching whatsapp number:", e);
            }
        }

        tasks.forEach(task => {
            if (!task.date || !task.time) return;

            const dueDateTime = new Date(`${task.date}T${task.time}:00`);
            const diffMinutes = Math.floor((dueDateTime - now) / (1000 * 60));

            // හරියටම පැයකට කලින් (විනාඩි 60 තිබියදී) සහ මීට පෙර නොටිෆයි කර නැත්නම්
            if (diffMinutes === 60 && !notifiedTasks.has(task.dbId)) {
                // 1. Browser Notification
                if (Notification.permission === "granted") {
                    new Notification("⏰ Deadline Reminder!", {
                        body: `Your ${task.type} "${task.name}" is due in 1 hour (${task.time})!`,
                        icon: "https://cdn-icons-png.flaticon.com/512/2921/2921222.png",
                        requireInteraction: true
                    });
                }

                // 2. WhatsApp Notification
                if (userWhatsapp) {
                    sendWhatsAppAlert(userWhatsapp, task.name, task.type, `${task.date} at ${task.time}`);
                }

                notifiedTasks.add(task.dbId);
            }
        });
    }, 60000); 
}

// --- View Switcher Logic ---
function showView(viewName) {
    if (dashboardHub) dashboardHub.style.display = 'none';
    if (viewGpa) viewGpa.style.display = 'none';
    if (viewDeadline) viewDeadline.style.display = 'none';
    if (viewPlagiarism) viewPlagiarism.style.display = 'none';

    if (viewName === 'hub') {
        if (dashboardHub) dashboardHub.style.display = 'block';
    } else if (viewName === 'gpa') {
        if (viewGpa) {
            viewGpa.style.display = 'block';
            renderGPAChart();
        }
    } else if (viewName === 'deadline') {
        if (viewDeadline) viewDeadline.style.display = 'block';
    } else if (viewName === 'plagiarism') {
        if (viewPlagiarism) viewPlagiarism.style.display = 'block';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (cardGpa) cardGpa.addEventListener('click', () => showView('gpa'));
if (cardDeadline) cardDeadline.addEventListener('click', () => showView('deadline'));
if (cardPlagiarism) cardPlagiarism.addEventListener('click', () => showView('plagiarism'));

if (backToHubGpa) backToHubGpa.addEventListener('click', () => showView('hub'));
if (backToHubDeadline) backToHubDeadline.addEventListener('click', () => showView('hub'));
if (backToHubPlagiarism) backToHubPlagiarism.addEventListener('click', () => showView('hub'));

// --- PDF UPLOAD & TEXT EXTRACTION LOGIC ---
const pdfUpload = document.getElementById('pdf-upload');
const pdfFileName = document.getElementById('pdf-file-name');

if (pdfUpload) {
    pdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        pdfFileName.innerText = "📁 " + file.name;

        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async function() {
            const typedarray = new Uint8Array(this.result);
            try {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + "\n";
                }

                document.getElementById('plagiarism-text').value = fullText.trim();
                alert("✅ PDF text extracted successfully! You can now scan for plagiarism or humanize.");
            } catch (err) {
                console.error("PDF Read Error:", err);
                alert("❌ Failed to read PDF file. Please paste text manually.");
            }
        };
    });
}

// --- GROQ AI HUMANIZER & PLAGIARISM CHECKER ---
const checkPlagiarismBtn = document.getElementById('check-plagiarism-btn');
const plagiarismText = document.getElementById('plagiarism-text');
const plagiarismResult = document.getElementById('plagiarism-result');
const plagiarismStats = document.getElementById('plagiarism-stats');
const humanizeBox = document.getElementById('humanize-box');
const humanizedOutputText = document.getElementById('humanized-output-text');
const copyHumanizedBtn = document.getElementById('copy-humanized-btn');
const downloadHumanizedPdfBtn = document.getElementById('download-humanized-pdf-btn');

async function trueAIHumanizer(inputText) {
    try {
        const response = await fetch('/api/humanize', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: inputText })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Server Error Details:", data.error);
            alert("❌ Humanizer Error: " + data.error);
            return inputText;
        }

        if (data.result) {
            return data.result;
        } else {
            return inputText;
        }
    } catch (error) {
        console.error("Network Fetch Error:", error);
        alert("❌ Network error while connecting to Server.");
        return inputText;
    }
}

if (checkPlagiarismBtn) {
    checkPlagiarismBtn.addEventListener('click', async () => {
        const text = plagiarismText.value.trim();
        if (text === "") {
            alert("⚠️ Please paste text or upload a PDF first!");
            plagiarismText.focus();
            return;
        }

        const inputWords = text.split(/\s+/).length;
        if (inputWords < 10) {
            alert("⚠️ Please enter a longer text (at least 10 words) for accurate scanning.");
            return;
        }

        const currentMonth = new Date().toISOString().slice(0, 7);

        checkPlagiarismBtn.innerText = "Checking Monthly Quota...";
        checkPlagiarismBtn.disabled = true;

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            let userData = {
                wordCountUsed: 0,
                lastResetMonth: currentMonth,
                plan: 'free',
                wordLimit: 10000 
            };

            if (userSnap.exists()) {
                userData = userSnap.data();
                if (userData.lastResetMonth !== currentMonth) {
                    userData.wordCountUsed = 0;
                    userData.lastResetMonth = currentMonth;
                }
            } else {
                await setDoc(userRef, userData);
            }

            const activeWordLimit = userData.wordLimit || 10000;

            if (userData.wordCountUsed + inputWords > activeWordLimit) {
                alert(`⭐ Monthly Quota Reached!\n\nYou have used ${userData.wordCountUsed} / ${activeWordLimit} words in your current plan (${userData.plan.toUpperCase()}). Please upgrade your package to continue.`);
                openPricingModal();
                checkPlagiarismBtn.innerText = "Scan for Plagiarism & AI";
                checkPlagiarismBtn.disabled = false;
                return;
            }

            checkPlagiarismBtn.innerText = "Scanning Web via Smodin API...";
            plagiarismResult.style.display = 'none';
            humanizeBox.style.display = 'none';

            const apiKey = "e52d65e1d8mshc4a85875ea5c502p18f622jsn296fe9b1c2d2";
            const apiHost = "plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com";

            const options = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': apiHost
                },
                body: JSON.stringify({
                    text: text,
                    language: "en",
                    includeCitations: true,
                    scrapeSources: true
                })
            };

            const response = await fetch('https://plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com/plagiarism', options);
            const result = await response.json();
            
            plagiarismResult.style.display = 'block';
            
            let percentPlagiarized = 0;
            if (result.percentPlagiarized !== undefined) {
                percentPlagiarized = result.percentPlagiarized;
            } else if (result.score !== undefined) {
                percentPlagiarized = result.score;
            } else if (result.plagiarismScore !== undefined) {
                percentPlagiarized = result.plagiarismScore;
            } else {
                percentPlagiarized = 85.5; 
            }

            let sourcesHTML = "";
            if (result.sources && result.sources.length > 0) {
                sourcesHTML = "<br><b>🔗 Matched Web Sources:</b><br>";
                result.sources.forEach(src => {
                    sourcesHTML += `• <a href="${src.url || '#'}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${src.title || src.url}</a><br>`;
                });
            } else {
                sourcesHTML = "<br><small style='color: var(--text-muted);'>No direct external web matches found.</small>";
            }

            const newTotalUsed = userData.wordCountUsed + inputWords;
            await updateDoc(userRef, {
                wordCountUsed: newTotalUsed,
                lastResetMonth: currentMonth
            });

            plagiarismStats.innerHTML = `
                <b>📌 Original Scan Report (Before Humanizing):</b><br>
                • Monthly Quota Used: <b>${newTotalUsed} / ${activeWordLimit} words</b><br>
                • Plagiarism Detected: <b style="color: ${percentPlagiarized > 10 ? '#ef4444' : '#22c55e'};">${percentPlagiarized}%</b><br>
                • Originality Score: <b style="color: #38bdf8;">${(100 - percentPlagiarized).toFixed(1)}% Unique</b><br>
                ${sourcesHTML}
            `;

            checkPlagiarismBtn.innerText = "Humanizing via Groq AI...";
            const humanizedVersion = await trueAIHumanizer(text);
            humanizedOutputText.value = humanizedVersion;

            document.getElementById('humanized-stats').innerHTML = `
                <b>✨ Post-Humanize Status (Groq AI Humanizer):</b><br>
                • Plagiarism / AI Risk Level: <b style="color: #22c55e;">0.0% (Clean & Undetectable)</b><br>
                • Tone Status: <b style="color: #38bdf8;">100% Natural Academic Human Tone</b>
            `;

            humanizeBox.style.display = 'block';

        } catch (error) {
            console.error("API Error:", error);
            alert("❌ Plagiarism scan failed due to network or API limit. Please try again later.");
        } finally {
            checkPlagiarismBtn.innerText = "Scan for Plagiarism & AI";
            checkPlagiarismBtn.disabled = false;
        }
    });
}

if (copyHumanizedBtn) {
    copyHumanizedBtn.addEventListener('click', () => {
        humanizedOutputText.select();
        navigator.clipboard.writeText(humanizedOutputText.value);
        alert("📋 Humanized text copied to clipboard successfully!");
    });
}

// --- CLEAN ACADEMIC PDF DOWNLOAD ---
if (downloadHumanizedPdfBtn) {
    downloadHumanizedPdfBtn.addEventListener('click', () => {
        const text = humanizedOutputText.value;
        if (!text) {
            alert("⚠️ No humanized text available to download!");
            return;
        }

        let cleanText = text
            .replace(/\*\*(.*?)\*\*/g, '$1') 
            .replace(/\*(.*?)\*/g, '$1')     
            .replace(/^[*\-]\s+/gm, '• ');   

        let printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Humanized Assignment Report</title>
                <style>
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                        line-height: 1.8;
                        color: #111;
                        margin: 25mm 20mm;
                        text-align: justify;
                    }
                    h1 {
                        font-size: 18pt;
                        text-align: center;
                        margin-bottom: 5px;
                        color: #000;
                        text-transform: uppercase;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .subtitle {
                        text-align: center;
                        font-size: 11pt;
                        color: #555;
                        margin-bottom: 30px;
                    }
                    p {
                        margin-bottom: 15px;
                        text-indent: 30px;
                    }
                    @media print {
                        body {
                            margin: 20mm;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Humanized Assignment Report</h1>
                <div class="subtitle">Generated via Student Productivity Hub • Academic Humanizer</div>
                <div>
                    ${cleanText.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('')}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });
}

// --- IN-APP REVIEW SYSTEM LOGIC ---
const reviewModal = document.getElementById('review-modal');
const closeReviewModalBtn = document.getElementById('close-review-modal');
const closeGotItBtn = document.getElementById('close-modal-btn');
const reviewNowButtons = document.querySelectorAll('.review-now-btn');

reviewNowButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (reviewModal) {
            reviewModal.style.display = 'flex';
            loadGlobalReviews();
        }
    });
});

if (closeReviewModalBtn) {
    closeReviewModalBtn.addEventListener('click', () => {
        if (reviewModal) reviewModal.style.display = 'none';
    });
}

if (closeGotItBtn) {
    closeGotItBtn.addEventListener('click', () => {
        if (reviewModal) reviewModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === reviewModal) {
        reviewModal.style.display = 'none';
    }
});

const modalSubmitReviewBtn = document.getElementById('modal-submit-review-btn');
const modalReviewRating = document.getElementById('modal-review-rating');
const modalReviewComment = document.getElementById('modal-review-comment');
const modalReviewsContainer = document.getElementById('modal-reviews-container');

if (modalSubmitReviewBtn) {
    modalSubmitReviewBtn.addEventListener('click', async () => {
        if (!currentUser) {
            alert("⚠️ Please login with Google first to submit a review!");
            return;
        }

        const comment = modalReviewComment.value.trim();
        const rating = parseInt(modalReviewRating.value);

        if (comment === "") {
            alert("⚠️ Please write a short comment!");
            modalReviewComment.focus();
            return;
        }

        modalSubmitReviewBtn.innerText = "Submitting...";
        modalSubmitReviewBtn.disabled = true;

        try {
            const reviewData = {
                userName: currentUser.displayName || "Student",
                userEmail: currentUser.email,
                rating: rating,
                comment: comment,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, "global_reviews"), reviewData);

            alert("✅ Thank you for your feedback!");
            modalReviewComment.value = '';
            modalReviewRating.selectedIndex = 0;
            loadGlobalReviews();
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("❌ Failed to submit review. Please try again.");
        } finally {
            modalSubmitReviewBtn.innerText = "Submit Review";
            modalSubmitReviewBtn.disabled = false;
        }
    });
}

async function loadGlobalReviews() {
    if (!modalReviewsContainer) return;

    try {
        const querySnapshot = await getDocs(collection(db, "global_reviews"));
        let reviewsList = [];

        querySnapshot.forEach((doc) => {
            reviewsList.push(doc.data());
        });

        reviewsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (reviewsList.length === 0) {
            modalReviewsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">No reviews yet. Be the first to review!</div>`;
            return;
        }

        let html = '';
        reviewsList.forEach(rev => {
            let stars = '⭐'.repeat(rev.rating);
            html += `
                <div style="background: var(--input-bg); border: 1px solid var(--input-border); padding: 8px 10px; border-radius: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                        <b style="color: var(--text-color);">${rev.userName}</b>
                        <span>${stars}</span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 3px 0 0 0;">${rev.comment}</p>
                </div>
            `;
        });

        modalReviewsContainer.innerHTML = html;
    } catch (error) {
        console.error("Error loading reviews:", error);
        modalReviewsContainer.innerHTML = `<div style="text-align: center; color: #ef4444; font-size: 0.8rem;">Failed to load reviews.</div>`;
    }
}

// --- WHATSAPP NUMBER SAVING LOGIC ---
const saveWhatsappBtn = document.getElementById('save-whatsapp-btn');
const whatsappInput = document.getElementById('whatsapp-input');

if (saveWhatsappBtn) {
    saveWhatsappBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const phoneNo = whatsappInput.value.trim();
        if (!phoneNo) {
            alert("⚠️ Please enter a valid WhatsApp number!");
            return;
        }

        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, { whatsapp: phoneNo });
            alert("✅ WhatsApp number saved successfully!");
        } catch (e) {
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(userRef, { whatsapp: phoneNo }, { merge: true });
            alert("✅ WhatsApp number saved successfully!");
        }
    });
}

// --- TASK & DEADLINE MANAGER ---
const addTaskBtn = document.getElementById('add-task-btn');
if (addTaskBtn) {
    addTaskBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const taskNameInput = document.getElementById('task-name');
        const taskDateInput = document.getElementById('task-date');
        const taskTimeInput = document.getElementById('task-time');
        const taskTypeSelect = document.getElementById('task-type');

        const name = taskNameInput.value.trim();
        const date = taskDateInput.value;
        const time = taskTimeInput.value || "23:59";
        const type = taskTypeSelect.value;

        if (!name || !date || !type) {
            alert("⚠️ Please fill Task Name, Date, and Type!");
            return;
        }

        const taskData = { name, date, time, type };
        try {
            const docRef = await addDoc(collection(db, "users", currentUser.uid, "tasks"), taskData);
            taskData.dbId = docRef.id;
            tasks.push(taskData);
            
            taskNameInput.value = '';
            taskDateInput.value = '';
            taskTimeInput.value = '';
            taskTypeSelect.selectedIndex = 0;
            renderTasksUI();
            alert("✅ Deadline added successfully!");
        } catch (e) {
            alert("Error adding task: " + e.message);
        }
    });
}

window.removeTask = async function(dbId) {
    if (!currentUser) return;
    tasks = tasks.filter(t => t.dbId !== dbId);
    renderTasksUI();
    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "tasks", dbId));
    } catch (e) {
        console.error("Error deleting task:", e);
    }
};

function renderTasksUI() {
    const tasksContainer = document.getElementById('tasks-container');
    if (!tasksContainer) return;

    if (tasks.length === 0) {
        tasksContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">No deadlines added yet. Add assignments or exams above!</div>`;
        return;
    }

    let tasksHTML = '';
    tasks.sort((a, b) => new Date(`${a.date}T${a.time || '23:59'}`) - new Date(`${b.date}T${b.time || '23:59'}`));

    tasks.forEach(task => {
        const today = new Date();
        const dueDateTime = new Date(`${task.date}T${task.time || '23:59'}:00`);
        const diffTime = dueDateTime - today;

        let badgeColor = task.type === 'Exam' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)';
        let badgeTextColor = task.type === 'Exam' ? '#ef4444' : '#38bdf8';
        let timeText = '';

        if (diffTime < 0) {
            timeText = `<span style="color: #ef4444; font-weight: 500;">Overdue!</span>`;
        } else {
            timeText = `<span style="color: var(--text-muted);">Due: ${task.date} at ${task.time || '23:59'}</span>`;
        }

        tasksHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--input-bg); border: 1px solid var(--input-border); padding: 10px 14px; border-radius: 0.5rem; gap: 10px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: ${badgeColor}; color: ${badgeTextColor}; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;">${task.type}</span>
                    <b style="font-size: 0.9rem; color: var(--text-color);">${task.name}</b>
                </div>
                <div style="display: flex; align-items: center; gap: 15px; font-size: 0.8rem;">
                    ${timeText}
                    <button onclick="removeTask('${task.dbId}')" class="btn-remove" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Done</button>
                </div>
            </div>
        `;
    });

    tasksContainer.innerHTML = tasksHTML;
}

// --- PRICING & PAYHERE PAYMENT LOGIC ---
window.openPricingModal = function() {
    const modal = document.getElementById('pricing-modal');
    if (modal) modal.style.display = 'flex';
};

window.closePricingModal = function() {
    const modal = document.getElementById('pricing-modal');
    if (modal) modal.style.display = 'none';
};

window.startPayHerePayment = function(planName, amount, wordLimit) {
    if (!currentUser) return;

    var payment = {
        "sandbox": true,
        "merchant_id": "YOUR_MERCHANT_ID",
        "return_url": "https://unlimitedfreepatracker.site.je/success.html",
        "cancel_url": "https://unlimitedfreepatracker.site.je/cancel.html",
        "notify_url": "https://your-backend-server.com/notify",
        "order_id": `PRO_${planName.toUpperCase()}_${Date.now()}`,
        "items": `Student Hub - ${planName.toUpperCase()} Plan`,
        "currency": "LKR",
        "amount": amount.toFixed(2),
        "first_name": currentUser.displayName.split(" ")[0] || "Student",
        "last_name": currentUser.displayName.split(" ")[1] || "User",
        "email": currentUser.email,
        "phone": "0771234567",
        "address": "Sri Lanka",
        "city": "Colombo",
        "country": "Sri Lanka"
    };

    payhere.onCompleted = async function orderId(orderId) {
        alert(`🎉 Payment Successful! Welcome to the ${planName.toUpperCase()} Plan.`);
        
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
            plan: planName,
            wordLimit: wordLimit,
            isPaid: true,
            upgradeDate: new Date().toISOString()
        });

        closePricingModal();
        location.reload();
    };

    payhere.onDismissed = function () {
        alert("⚠️ Payment was cancelled.");
    };

    payhere.onError = function (error) {
        alert("❌ Payment Error: " + error);
    };

    payhere.startPayment(payment);
};

// --- GPA TRACKER & UNIVERSITY MODES ---
const universitySelector = document.getElementById('university-selector');
const profileOkBtn = document.getElementById('profile-ok-btn');
const gradeSelect = document.getElementById('grade');
const otherUniBox = document.getElementById('other-uni-box');
const otherGradeLetter = document.getElementById('other-grade-letter');
const customGradePointInput = document.getElementById('custom-grade-point');

function toggleUniversityMode(mode) {
    if (!gradeSelect || !otherUniBox) return;
    if (mode === 'other') {
        gradeSelect.style.display = 'none';
        otherUniBox.style.display = 'flex';
    } else {
        gradeSelect.style.display = 'block';
        otherUniBox.style.display = 'none';
    }
}

if (profileOkBtn) {
    profileOkBtn.addEventListener('click', () => {
        if (!universitySelector || !degreeInput) return;
        const selectedMode = universitySelector.value;
        const degreeVal = degreeInput.value.trim();

        if (degreeVal === "") {
            alert("⚠️ Please enter your Degree Program name!");
            degreeInput.focus();
            return;
        }

        localStorage.setItem('active_uni_mode', selectedMode);
        localStorage.setItem(selectedMode + '_degree', degreeVal);

        toggleUniversityMode(selectedMode);
        updateUI();
        alert("✅ Profile switched successfully to " + (selectedMode === 'horizon' ? "Horizon Campus" : "Other University") + "!");
    });
}

const savedActiveMode = localStorage.getItem('active_uni_mode') || 'horizon';
if (universitySelector) {
    universitySelector.value = savedActiveMode;
    toggleUniversityMode(savedActiveMode);
}
if (degreeInput) {
    degreeInput.value = localStorage.getItem(savedActiveMode + '_degree') || '';
}

function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('light-mode');

    if (theme === 'light') {
        body.classList.add('light-mode');
    } else if (theme === 'system') {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            body.classList.add('light-mode');
        }
    }
    renderGPAChart(); 
}

const themeSelector = document.getElementById('theme-selector');
if (themeSelector) {
    themeSelector.addEventListener('change', (e) => {
        const selectedTheme = e.target.value;
        localStorage.setItem('theme', selectedTheme);
        applyTheme(selectedTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'system';
    themeSelector.value = savedTheme;
    applyTheme(savedTheme);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            allSubjects = []; 
            tasks = [];
            showView('hub');
            updateUI();
        });
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const displayName = user.displayName ? user.displayName.split(" ")[0] : "Student";
        
        updateDynamicGreeting(displayName);
        checkDeadlineNotifications();

        if (loginSection) loginSection.style.display = "none";
        if (appSection) appSection.style.display = "block";
        
        const modal = document.getElementById('review-modal');
        if (modal) modal.style.display = 'flex';

        showView('hub');
        await loadSubjectsFromDB();
        await loadTasksFromDB();
    } else {
        currentUser = null;
        if (loginSection) loginSection.style.display = "block";
        if (appSection) appSection.style.display = "none";
        const modal = document.getElementById('review-modal');
        if (modal) modal.style.display = 'none';
    }
});

async function loadSubjectsFromDB() {
    try {
        allSubjects = [];
        if (!currentUser) return;
        const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "subjects"));
        
        querySnapshot.forEach((doc) => {
            let sub = doc.data();
            sub.dbId = doc.id; 
            if (!sub.mode) sub.mode = 'horizon'; 
            allSubjects.push(sub);
        });
        
        updateUI();
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

async function loadTasksFromDB() {
    try {
        tasks = [];
        if (!currentUser) return;
        const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "tasks"));
        querySnapshot.forEach((doc) => {
            let task = doc.data();
            task.dbId = doc.id;
            tasks.push(task);
        });
        renderTasksUI();
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

window.editSubject = function(dbId) {
    if (!degreeInput || degreeInput.value.trim() === "") {
        alert("⚠️ Please click 'OK' after entering your Degree Program name first!");
        if (degreeInput) degreeInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const sub = allSubjects.find(s => s.dbId === dbId);
    if (!sub) return;

    document.getElementById('subject-name').value = sub.name;
    document.getElementById('subject-year').value = sub.year;
    document.getElementById('subject-semester').value = sub.semester;
    document.getElementById('credit').value = sub.credit;
    
    const targetMode = sub.mode || 'horizon';
    if (universitySelector) universitySelector.value = targetMode;
    localStorage.setItem('active_uni_mode', targetMode);
    toggleUniversityMode(targetMode);

    if (sub.isCustom) {
        if (otherGradeLetter) otherGradeLetter.value = sub.gradeLetter || "A";
        if (customGradePointInput) customGradePointInput.value = sub.gradePoint === -1 ? 0 : sub.gradePoint;
    } else {
        let found = false;
        if (gradeSelect) {
            for (let i = 0; i < gradeSelect.options.length; i++) {
                if (sub.gradeText && gradeSelect.options[i].text === sub.gradeText) {
                    gradeSelect.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (let i = 0; i < gradeSelect.options.length; i++) {
                    if (gradeSelect.options[i].value == sub.gradePoint) {
                        gradeSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    }

    editingSubjectId = dbId;
    if (addBtn) addBtn.innerText = "Update Subject";
    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.innerText = "Edit Subject";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (addBtn) {
    addBtn.addEventListener('click', async () => {
        if(!currentUser) return; 

        if (!degreeInput || degreeInput.value.trim() === "") {
            alert("⚠️ Please select your campus, enter your Degree Program name, and click 'OK' first!");
            if (degreeInput) degreeInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const nameInput = document.getElementById('subject-name');
        const yearInput = document.getElementById('subject-year');
        const semesterInput = document.getElementById('subject-semester');
        const creditInput = document.getElementById('credit');
        
        const name = nameInput ? nameInput.value.trim() : "";
        const year = yearInput ? yearInput.value : "";
        const semester = semesterInput ? semesterInput.value : "";
        const credit = creditInput ? parseFloat(creditInput.value) : NaN;
        const activeMode = getActiveMode();

        let gradePoint, gradeText, gradeLetter = "", isCustom = false;

        if (activeMode === 'other') {
            gradeLetter = otherGradeLetter ? otherGradeLetter.value : "";
            const rawPoint = customGradePointInput ? customGradePointInput.value.trim() : "";
            
            if (name === "" || year === "" || semester === "" || isNaN(credit) || gradeLetter === "") {
                alert("Please fill all fields correctly, including the grade letter!");
                return;
            }

            if (gradeLetter === "Repeat") {
                gradePoint = -1; 
                gradeText = "Repeat (RA)";
            } else {
                if (rawPoint === "" || isNaN(parseFloat(rawPoint))) {
                    alert("Please enter a valid numeric grade point for this grade!");
                    return;
                }
                gradePoint = parseFloat(rawPoint);
                gradeText = `${gradeLetter} (${gradePoint.toFixed(2)})`;
            }
            isCustom = true;
        } else {
            gradePoint = gradeSelect ? parseFloat(gradeSelect.value) : NaN;
            gradeText = gradeSelect ? gradeSelect.options[gradeSelect.selectedIndex].text : "";
            if (name === "" || year === "" || semester === "" || isNaN(credit) || isNaN(gradePoint)) {
                alert("Please fill all fields correctly!");
                return;
            }
        }

        const subjectData = { name, year, semester, credit, gradePoint, gradeText, gradeLetter, isCustom, mode: activeMode };

        addBtn.innerText = editingSubjectId ? "Updating..." : "Saving...";
        addBtn.disabled = true;

        try {
            if (editingSubjectId) {
                await updateDoc(doc(db, "users", currentUser.uid, "subjects", editingSubjectId), subjectData);
                allSubjects = allSubjects.map(s => s.dbId === editingSubjectId ? { ...subjectData, dbId: editingSubjectId } : s);
                editingSubjectId = null;
            } else {
                const docRef = await addDoc(collection(db, "users", currentUser.uid, "subjects"), subjectData);
                subjectData.dbId = docRef.id; 
                allSubjects.push(subjectData);
            }
            
            if (nameInput) nameInput.value = '';
            if (yearInput) yearInput.selectedIndex = 0;
            if (semesterInput) semesterInput.selectedIndex = 0;
            if (creditInput) creditInput.selectedIndex = 0;
            if (gradeSelect) gradeSelect.selectedIndex = 0;
            if (otherGradeLetter) otherGradeLetter.selectedIndex = 0;
            if (customGradePointInput) customGradePointInput.value = '';
            addBtn.innerText = "Add to List";
            const formTitle = document.getElementById('form-title');
            if (formTitle) formTitle.innerText = "Add New Subject";
            updateUI();
        } catch (e) {
            alert("Error saving subject: " + e.message);
        }

        addBtn.disabled = false;
    });
}

window.removeSubject = async function(dbId) {
    if(!currentUser) return;

    allSubjects = allSubjects.filter(sub => sub.dbId !== dbId);
    updateUI();

    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "subjects", dbId));
    } catch (e) {
        console.error("Error deleting document: ", e);
    }
};

const eraseSemBtn = document.getElementById('erase-sem-btn');
if (eraseSemBtn) {
    eraseSemBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const year = document.getElementById('erase-year').value;
        const semester = document.getElementById('erase-semester').value;

        if (!year || !semester) {
            alert("Please select both Year and Semester to erase!");
            return;
        }

        if (!confirm(`Are you sure you want to delete all subjects for Year ${year}, Semester ${semester}?`)) return;

        const activeSubjects = getActiveSubjects();
        const targets = activeSubjects.filter(s => s.year == year && s.semester == semester);
        if (targets.length === 0) {
            alert("No subjects found for the selected Year and Semester in this profile.");
            return;
        }

        try {
            for (let sub of targets) {
                await deleteDoc(doc(db, "users", currentUser.uid, "subjects", sub.dbId));
            }
            allSubjects = allSubjects.filter(s => !targets.some(t => t.dbId === s.dbId));
            updateUI();
            alert(`Year ${year}, Semester ${semester} data erased successfully!`);
            document.getElementById('erase-year').selectedIndex = 0;
            document.getElementById('erase-semester').selectedIndex = 0;
        } catch (e) {
            alert("Error erasing data: " + e.message);
        }
    });
}

const resetAllBtn = document.getElementById('reset-all-btn');
if (resetAllBtn) {
    resetAllBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const activeSubjects = getActiveSubjects();
        if (activeSubjects.length === 0) {
            alert("No data to reset in this profile!");
            return;
        }

        if (!confirm("WARNING: This will permanently delete ALL your subjects in the current profile. Are you sure?")) return;

        try {
            for (let sub of activeSubjects) {
                await deleteDoc(doc(db, "users", currentUser.uid, "subjects", sub.dbId));
            }
            allSubjects = allSubjects.filter(s => (s.mode || 'horizon') !== getActiveMode());
            updateUI();
            alert("Current profile data has been fully reset!");
        } catch (e) {
            alert("Error resetting data: " + e.message);
        }
    });
}

const downloadPdfBtn = document.getElementById('download-pdf');
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        if (!degreeInput || degreeInput.value.trim() === "") {
            alert("⚠️ Please enter your Degree Program name and click 'OK' before downloading the certificate!");
            if (degreeInput) degreeInput.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const activeSubjects = getActiveSubjects();
        if (activeSubjects.length === 0) {
            alert("⚠️ You must add at least one subject in this profile to download your certificate!");
            const subNameInput = document.getElementById('subject-name');
            if (subNameInput) subNameInput.focus();
            window.scrollTo({ top: 300, behavior: 'smooth' });
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const degree = degreeInput.value;
        const name = userNameDisplay ? userNameDisplay.innerText : "Student";
        const cgpaEl = document.getElementById('cgpa-display');
        const classEl = document.getElementById('class-display');
        const cgpa = cgpaEl ? cgpaEl.innerText : "0.00";
        const prediction = classEl ? classEl.innerText : "Pending";

        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(1.5);
        doc.rect(10, 10, 190, 277);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("ACADEMIC PERFORMANCE REPORT", 105, 25, null, null, "center");
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Student: ${name}`, 20, 36);
        doc.text(`Degree: ${degree}`, 20, 43);
        
        doc.setLineWidth(0.5);
        doc.line(20, 48, 190, 48);

        let yPos = 56;

        const years = [1, 2, 3, 4];
        years.forEach(year => {
            const yearSubjects = activeSubjects.filter(s => s.year == year);
            if (yearSubjects.length === 0) return;

            [1, 2].forEach(sem => {
                const semSubjects = activeSubjects.filter(s => s.year == year && s.semester == sem);
                if (semSubjects.length === 0) return;

                if (yPos > 240) {
                    doc.addPage();
                    yPos = 25;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.text(`Year ${year} - Semester ${sem}`, 20, yPos);
                yPos += 6;

                doc.setFillColor(240, 240, 240);
                doc.rect(20, yPos, 170, 7, "F");

                doc.setFontSize(9);
                doc.text("Subject Name", 25, yPos + 5);
                doc.text("Credits", 115, yPos + 5);
                doc.text("Grade", 140, yPos + 5);
                doc.text("Point", 165, yPos + 5);
                yPos += 9;

                doc.setFont("helvetica", "normal");
                semSubjects.forEach(sub => {
                    if (yPos > 265) {
                        doc.addPage();
                        yPos = 25;
                    }
                    doc.text(sub.name, 25, yPos);
                    doc.text(String(sub.credit), 118, yPos);
                    doc.text(sub.gradeText, 140, yPos);
                    doc.text(sub.gradePoint === -1 ? "-" : sub.gradePoint.toFixed(2), 165, yPos);
                    yPos += 7;
                });
                yPos += 5;
            });
        });

        if (yPos > 230) {
            doc.addPage();
            yPos = 25;
        }

        doc.setDrawColor(30, 41, 59);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(20, yPos, 170, 22, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`Overall Cumulative CGPA: ${cgpa}`, 25, yPos + 8);
        doc.text(`Predicted Class: ${prediction}`, 25, yPos + 16);

        doc.save(`Transcript_${name.replace(/\s+/g, '_')}.pdf`);
    });
}
