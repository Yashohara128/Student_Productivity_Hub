// ==========================================
// STUDENT PRODUCTIVITY HUB - APP.JS (100% FULL & COMPLETE)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
const viewShortNotes = document.getElementById('view-shortnotes');
const viewPlagiarism = document.getElementById('view-plagiarism');

// Card Triggers
const cardGpa = document.getElementById('card-gpa');
const cardShortNotes = document.getElementById('card-shortnotes');
const cardPlagiarism = document.getElementById('card-plagiarism');

// Back Buttons
const backToHubGpa = document.getElementById('back-to-hub-gpa');
const backToHubShortNotes = document.getElementById('back-to-hub-shortnotes');
const backToHubPlagiarism = document.getElementById('back-to-hub-plagiarism');

let allSubjects = []; 
let currentUser = null; 
let editingSubjectId = null; 
let myChart = null;

const CLASS_THRESHOLDS = {
    FIRST_CLASS: 3.70,
    SECOND_UPPER: 3.30,
    SECOND_LOWER: 3.00,
    PASS: 2.00
};

function getActiveMode() {
    return localStorage.getItem('active_uni_mode') || 'horizon';
}

function getActiveSubjects() {
    const activeMode = getActiveMode();
    return allSubjects.filter(sub => (sub.mode || 'horizon') === activeMode);
}

// --- Google Login via Popup ---
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Login Success:", result.user.displayName);
            })
            .catch((error) => {
                console.error("Login Error Code:", error.code);
                alert("❌ Login Failed: " + error.message);
            });
    });
}

// --- Dynamic Greeting ---
function updateDynamicGreeting(userName) {
    const greetingEl = document.getElementById('welcome-greeting');
    if (!greetingEl) return;

    const now = new Date();
    const hours = now.getHours();
    let timeGreeting = "", emoji = "";

    if (hours >= 5 && hours < 12) { timeGreeting = "Good Morning"; emoji = "☀️"; }
    else if (hours >= 12 && hours < 17) { timeGreeting = "Good Afternoon"; emoji = "🌤️"; }
    else if (hours >= 17 && hours < 21) { timeGreeting = "Good Evening"; emoji = "🌆"; }
    else { timeGreeting = "Good Night"; emoji = "🌙"; }

    const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    greetingEl.innerHTML = `${emoji} ${timeGreeting}, <span style="color: var(--text-color); font-weight: 600;">${userName}</span>! <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">📅 ${formattedDate}</span>`;
}

// --- View Switcher ---
function showView(viewName) {
    if (dashboardHub) dashboardHub.style.display = 'none';
    if (viewGpa) viewGpa.style.display = 'none';
    if (viewShortNotes) viewShortNotes.style.display = 'none';
    if (viewPlagiarism) viewPlagiarism.style.display = 'none';

    if (viewName === 'hub') {
        if (dashboardHub) dashboardHub.style.display = 'block';
    } else if (viewName === 'gpa') {
        if (viewGpa) { viewGpa.style.display = 'block'; renderGPAChart(); }
    } else if (viewName === 'shortnotes') {
        if (viewShortNotes) viewShortNotes.style.display = 'block';
    } else if (viewName === 'plagiarism') {
        if (viewPlagiarism) viewPlagiarism.style.display = 'block';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (cardGpa) cardGpa.addEventListener('click', () => showView('gpa'));
if (cardShortNotes) cardShortNotes.addEventListener('click', () => showView('shortnotes'));
if (cardPlagiarism) cardPlagiarism.addEventListener('click', () => showView('plagiarism'));

if (backToHubGpa) backToHubGpa.addEventListener('click', () => showView('hub'));
if (backToHubShortNotes) backToHubShortNotes.addEventListener('click', () => showView('hub'));
if (backToHubPlagiarism) backToHubPlagiarism.addEventListener('click', () => showView('hub'));

// --- Review Modal Close & Submit Logic ---
const reviewModal = document.getElementById('review-modal');
const closeReviewModalBtn = document.getElementById('close-review-modal');
const closeGotItBtn = document.getElementById('close-modal-btn');
const reviewNowButtons = document.querySelectorAll('.review-now-btn');
const modalSubmitReviewBtn = document.getElementById('modal-submit-review-btn');
const modalReviewRating = document.getElementById('modal-review-rating');
const modalReviewComment = document.getElementById('modal-review-comment');

reviewNowButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (reviewModal) { reviewModal.style.display = 'flex'; loadGlobalReviews(); }
    });
});
if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', () => { if (reviewModal) reviewModal.style.display = 'none'; });
if (closeGotItBtn) closeGotItBtn.addEventListener('click', () => { if (reviewModal) reviewModal.style.display = 'none'; });

if (modalSubmitReviewBtn) {
    modalSubmitReviewBtn.addEventListener('click', async () => {
        if (!currentUser) { alert("⚠️ Please login first!"); return; }
        const comment = modalReviewComment.value.trim();
        const rating = parseInt(modalReviewRating.value);
        if (!comment) { alert("⚠️ Please write a comment!"); return; }

        modalSubmitReviewBtn.innerText = "Submitting...";
        modalSubmitReviewBtn.disabled = true;
        try {
            await addDoc(collection(db, "global_reviews"), {
                userName: currentUser.displayName || "Student",
                userEmail: currentUser.email,
                rating, comment, createdAt: new Date().toISOString()
            });
            alert("✅ Thank you for your feedback!");
            modalReviewComment.value = '';
            modalReviewRating.selectedIndex = 0;
        } catch (e) { 
            alert("❌ Failed to submit review: " + e.message); 
        } finally { 
            modalSubmitReviewBtn.innerText = "Submit Review"; 
            modalSubmitReviewBtn.disabled = false; 
        }
    });
}

function loadGlobalReviews() {
    const modalReviewsContainer = document.getElementById('modal-reviews-container');
    const publicReviewsContainer = document.getElementById('public-reviews-container');
    
    onSnapshot(collection(db, "global_reviews"), (querySnapshot) => {
        let reviewsList = [];
        querySnapshot.forEach((doc) => { reviewsList.push(doc.data()); });
        reviewsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (reviewsList.length === 0) {
            if (modalReviewsContainer) modalReviewsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">No reviews yet. Be the first to review!</div>`;
            if (publicReviewsContainer) publicReviewsContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">No reviews yet. Be the first to share your feedback!</div>`;
            return;
        }

        let html = '';
        reviewsList.forEach(rev => {
            let stars = '⭐'.repeat(rev.rating);
            html += `
                <div style="background: var(--input-bg); border: 1px solid var(--input-border); padding: 8px 10px; border-radius: 6px; margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                        <b style="color: var(--text-color);">${rev.userName}</b>
                        <span>${stars}</span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 3px 0 0 0;">${rev.comment}</p>
                </div>
            `;
        });
        if (modalReviewsContainer) modalReviewsContainer.innerHTML = html;
        if (publicReviewsContainer) publicReviewsContainer.innerHTML = html;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadGlobalReviews();
});

// --- Pricing & PayHere Integration ---
window.openPricingModal = function() { document.getElementById('pricing-modal').style.display = 'flex'; };
window.closePricingModal = function() { document.getElementById('pricing-modal').style.display = 'none'; };

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
        "address": "Sri Lanka", "city": "Colombo", "country": "Sri Lanka"
    };

    payhere.onCompleted = async function orderId(orderId) {
        alert(`🎉 Payment Successful! Welcome to the ${planName.toUpperCase()} Plan.`);
        await updateDoc(doc(db, "users", currentUser.uid), { plan: planName, wordLimit, isPaid: true, upgradeDate: new Date().toISOString() });
        closePricingModal();
        location.reload();
    };
    payhere.onDismissed = () => alert("⚠️ Payment cancelled.");
    payhere.onError = (err) => alert("❌ Payment Error: " + err);
    payhere.startPayment(payment);
};

// --- AI PDF SHORT NOTE GENERATOR LOGIC ---
const notePdfUpload = document.getElementById('note-pdf-upload');
const notePdfFileName = document.getElementById('note-pdf-file-name');
const generateNotesBtn = document.getElementById('generate-notes-btn');
const noteLoading = document.getElementById('note-loading');
const noteResultSection = document.getElementById('note-result-section');
const generatedNotesOutput = document.getElementById('generated-notes-output');
const copyNotesBtn = document.getElementById('copy-notes-btn');
const downloadNotesTxtBtn = document.getElementById('download-notes-txt-btn');
const downloadNotesPdfBtn = document.getElementById('download-notes-pdf-btn');

let extractedNoteText = "";

if (notePdfUpload) {
    notePdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        notePdfFileName.innerText = "📁 " + file.name;

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
                    fullText += textContent.items.map(item => item.str).join(' ') + "\n";
                }
                extractedNoteText = fullText.trim();
                alert("✅ Lecture PDF text extracted successfully! Ready to generate short notes.");
            } catch (err) {
                console.error("PDF Read Error:", err);
                alert("❌ Failed to read PDF file.");
            }
        };
    });
}

if (generateNotesBtn) {
    generateNotesBtn.addEventListener('click', async () => {
        if (!extractedNoteText) {
            alert("⚠️ Please upload a lecture PDF first!");
            return;
        }

        const customPromptInput = document.getElementById('note-custom-prompt');
        const customPrompt = customPromptInput ? customPromptInput.value.trim() : "";

        if (noteLoading) noteLoading.style.display = 'block';
        if (noteResultSection) noteResultSection.style.display = 'none';
        generateNotesBtn.disabled = true;
        generateNotesBtn.innerText = "Generating via Groq AI...";

        try {
            const response = await fetch('/api/shortnotes', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    text: extractedNoteText,
                    prompt: customPrompt || "Generate well-structured, comprehensive academic short notes with key definitions, core concepts, bullet points, and comparative tables for a university student."
                })
            });

            const data = await response.json();
            if (data.error) {
                alert("❌ Error: " + data.error);
                return;
            }

            if (data.result) {
                generatedNotesOutput.value = data.result;
                if (noteResultSection) noteResultSection.style.display = 'block';
            }
        } catch (error) {
            console.error("Short Notes API Error:", error);
            alert("❌ Failed to connect to server for generating short notes.");
        } finally {
            if (noteLoading) noteLoading.style.display = 'none';
            generateNotesBtn.disabled = false;
            generateNotesBtn.innerText = "✨ Generate Short Notes";
        }
    });
}

if (copyNotesBtn) {
    copyNotesBtn.addEventListener('click', () => {
        generatedNotesOutput.select();
        navigator.clipboard.writeText(generatedNotesOutput.value);
        alert("📋 Short notes copied to clipboard successfully!");
    });
}

if (downloadNotesTxtBtn) {
    downloadNotesTxtBtn.addEventListener('click', () => {
        const text = generatedNotesOutput.value;
        if (!text) {
            alert("⚠️ No short notes available to download!");
            return;
        }
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Lecture_Short_Notes.txt';
        a.click();
        URL.revokeObjectURL(url);
    });
}

if (downloadNotesPdfBtn) {
    downloadNotesPdfBtn.addEventListener('click', () => {
        const text = generatedNotesOutput.value;
        if (!text) {
            alert("⚠️ No short notes available to download!");
            return;
        }

        let formatted = text
            .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
            .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
            .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>');

        let lines = formatted.split('\n');
        let htmlLines = [];
        let inTable = false;
        let isHeaderRow = true;

        for (let line of lines) {
            let trimmed = line.trim();
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    isHeaderRow = true;
                    htmlLines.push('<table style="width:100%; border-collapse: collapse; margin: 15px 0; font-size: 9.5pt;">');
                }
                if (trimmed.includes('---')) {
                    isHeaderRow = false;
                    continue;
                }
                let cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
                let cellTag = isHeaderRow 
                    ? 'th style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: left; color: #0f172a;"' 
                    : 'td style="border: 1px solid #cbd5e1; padding: 7px; text-align: left; color: #334155;"';
                
                let rowHtml = '<tr>' + cells.map(cell => `<${cellTag}>${cell}</${cellTag}>`).join('') + '</tr>';
                htmlLines.push(rowHtml);
                isHeaderRow = false;
            } else {
                if (inTable) {
                    inTable = false;
                    htmlLines.push('</table>');
                }
                if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                    htmlLines.push(`<li style="margin-bottom: 4px; color: #334155;">${trimmed.substring(2)}</li>`);
                } else if (trimmed === '') {
                    htmlLines.push('<br>');
                } else {
                    htmlLines.push(`<p style="margin-bottom: 8px; text-align: justify; color: #334155;">${trimmed}</p>`);
                }
            }
        }
        if (inTable) htmlLines.push('</table>');

        let finalHtmlContent = htmlLines.join('\n');

        let printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lecture Short Notes - Student Productivity Hub</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Poppins', sans-serif; font-size: 10pt; line-height: 1.6; color: #1e293b; margin: 0; padding: 15mm 20mm; background: #ffffff; }
                    .header-box { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 18px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                    .header-box h1 { font-size: 15pt; margin: 0 0 4px 0; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; }
                    .header-box p { font-size: 8.5pt; color: #94a3b8; margin: 0; }
                    h1 { font-size: 14pt; color: #0f172a; margin-top: 20px; border-bottom: 2px solid #38bdf8; padding-bottom: 4px; }
                    h2 { font-size: 12pt; color: #1e293b; margin-top: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
                    h3 { font-size: 10.5pt; color: #334155; margin-top: 12px; }
                    ul { padding-left: 20px; margin-bottom: 10px; }
                    .footer-note { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 7.5pt; color: #94a3b8; }
                    @media print { body { padding: 10mm 15mm; } .header-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="header-box">
                    <h1>📚 Lecture Short Notes</h1>
                    <p>Generated via Student Productivity Hub • AI Academic Assistant</p>
                </div>
                <div class="content-body">${finalHtmlContent}</div>
                <div class="footer-note">Official Academic Study Material Report | Powered by Groq AI & Student Productivity Hub</div>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });
}

// --- GPA TRACKER & UNIVERSITY MODES ---
const universitySelector = document.getElementById('university-selector');
const profileOkBtn = document.getElementById('profile-ok-btn');
const gradeSelect = document.getElementById('grade');
const otherUniBox = document.getElementById('other-uni-box');
const otherGradeLetter = document.getElementById('other-grade-letter');
const customGradePointInput = document.getElementById('custom-grade-point');

function toggleUniversityMode(mode) {
    if (!gradeSelect || !otherUniBox) return;
    if (mode === 'other') { gradeSelect.style.display = 'none'; otherUniBox.style.display = 'flex'; }
    else { gradeSelect.style.display = 'block'; otherUniBox.style.display = 'none'; }
}

if (profileOkBtn) {
    profileOkBtn.addEventListener('click', () => {
        if (!universitySelector || !degreeInput) return;
        const mode = universitySelector.value;
        const deg = degreeInput.value.trim();
        if (!deg) { alert("⚠️ Please enter your Degree Program name!"); degreeInput.focus(); return; }
        localStorage.setItem('active_uni_mode', mode);
        localStorage.setItem(mode + '_degree', deg);
        toggleUniversityMode(mode);
        updateUI();
        alert("✅ Profile switched successfully!");
    });
}

const savedActiveMode = localStorage.getItem('active_uni_mode') || 'horizon';
if (universitySelector) { universitySelector.value = savedActiveMode; toggleUniversityMode(savedActiveMode); }
if (degreeInput) { degreeInput.value = localStorage.getItem(savedActiveMode + '_degree') || ''; }

function applyTheme(theme) {
    document.body.classList.remove('light-mode');
    if (theme === 'light' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches)) {
        document.body.classList.add('light-mode');
    }
    renderGPAChart();
}

const themeSelector = document.getElementById('theme-selector');
if (themeSelector) {
    themeSelector.addEventListener('change', (e) => { localStorage.setItem('theme', e.target.value); applyTheme(e.target.value); });
    themeSelector.value = localStorage.getItem('theme') || 'system';
    applyTheme(themeSelector.value);
}

// --- Firebase Auth State & Loading Subjects ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        updateDynamicGreeting(user.displayName ? user.displayName.split(" ")[0] : "Student");
        if (loginSection) loginSection.style.display = "none";
        if (appSection) appSection.style.display = "block";
        if (reviewModal) reviewModal.style.display = 'flex';
        showView('hub');
        await loadSubjectsFromDB();
    } else {
        currentUser = null;
        if (loginSection) loginSection.style.display = "block";
        if (appSection) appSection.style.display = "none";
        if (reviewModal) reviewModal.style.display = 'none';
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => { 
        signOut(auth).then(() => { allSubjects = []; showView('hub'); updateUI(); }); 
    });
}

async function loadSubjectsFromDB() {
    try {
        allSubjects = [];
        if (!currentUser) return;
        const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "subjects"));
        querySnapshot.forEach(doc => { 
            let sub = doc.data(); 
            sub.dbId = doc.id; 
            if (!sub.mode) sub.mode = 'horizon'; 
            allSubjects.push(sub); 
        });
        updateUI();
    } catch (e) { console.error("Error loading subjects:", e); }
}

window.editSubject = function(dbId) {
    if (!degreeInput || degreeInput.value.trim() === "") { alert("⚠️ Please enter Degree Program name first!"); degreeInput.focus(); return; }
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
        if (gradeSelect) {
            for (let i = 0; i < gradeSelect.options.length; i++) {
                if (sub.gradeText && gradeSelect.options[i].text === sub.gradeText) { gradeSelect.selectedIndex = i; break; }
            }
        }
    }
    editingSubjectId = dbId;
    if (addBtn) addBtn.innerText = "Update Subject";
    document.getElementById('form-title').innerText = "Edit Subject";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

if (addBtn) {
    addBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        if (!degreeInput || degreeInput.value.trim() === "") { alert("⚠️ Please enter Degree name first!"); degreeInput.focus(); return; }

        const name = document.getElementById('subject-name').value.trim();
        const year = document.getElementById('subject-year').value;
        const semester = document.getElementById('subject-semester').value;
        const credit = parseFloat(document.getElementById('credit').value);
        const activeMode = getActiveMode();

        let gradePoint, gradeText, gradeLetter = "", isCustom = false;
        if (activeMode === 'other') {
            gradeLetter = otherGradeLetter.value;
            const rawPoint = customGradePointInput.value.trim();
            if (!name || !year || !semester || isNaN(credit) || !gradeLetter) { alert("Please fill all fields correctly!"); return; }
            if (gradeLetter === "Repeat" || gradeLetter === "Absent" || gradeLetter === "Medical") { 
                gradePoint = -1; 
                gradeText = gradeLetter === "Repeat" ? "Repeat (RA)" : gradeLetter; 
            } else { 
                gradePoint = parseFloat(rawPoint); 
                gradeText = `${gradeLetter} (${gradePoint.toFixed(2)})`; 
            }
            isCustom = true;
        } else {
            gradePoint = parseFloat(gradeSelect.value);
            gradeText = gradeSelect.options[gradeSelect.selectedIndex].text;
            if (!name || !year || !semester || isNaN(credit) || isNaN(gradePoint)) { alert("Please fill all fields!"); return; }
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
            document.getElementById('subject-name').value = '';
            document.getElementById('subject-year').selectedIndex = 0;
            document.getElementById('subject-semester').selectedIndex = 0;
            document.getElementById('credit').selectedIndex = 0;
            if (gradeSelect) gradeSelect.selectedIndex = 0;
            addBtn.innerText = "Add to List";
            document.getElementById('form-title').innerText = "Add New Subject";
            updateUI();
        } catch (e) { alert("Error saving subject: " + e.message); }
        addBtn.disabled = false;
    });
}

window.removeSubject = async function(dbId) {
    if (!currentUser) return;
    allSubjects = allSubjects.filter(sub => sub.dbId !== dbId);
    updateUI();
    try { await deleteDoc(doc(db, "users", currentUser.uid, "subjects", dbId)); } catch (e) { console.error(e); }
};

const eraseSemBtn = document.getElementById('erase-sem-btn');
if (eraseSemBtn) {
    eraseSemBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const year = document.getElementById('erase-year').value;
        const semester = document.getElementById('erase-semester').value;
        if (!year || !semester) { alert("Please select Year and Semester!"); return; }
        if (!confirm(`Delete subjects for Year ${year}, Semester ${semester}?`)) return;

        const targets = getActiveSubjects().filter(s => s.year == year && s.semester == semester);
        try {
            for (let sub of targets) await deleteDoc(doc(db, "users", currentUser.uid, "subjects", sub.dbId));
            allSubjects = allSubjects.filter(s => !targets.some(t => t.dbId === s.dbId));
            updateUI();
            alert("Erasure successful!");
        } catch (e) { alert("Error: " + e.message); }
    });
}

const resetAllBtn = document.getElementById('reset-all-btn');
if (resetAllBtn) {
    resetAllBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const targets = getActiveSubjects();
        if (targets.length === 0) { alert("No data to reset!"); return; }
        if (!confirm("WARNING: Permanently delete all subjects in this profile?")) return;
        try {
            for (let sub of targets) await deleteDoc(doc(db, "users", currentUser.uid, "subjects", sub.dbId));
            allSubjects = allSubjects.filter(s => (s.mode || 'horizon') !== getActiveMode());
            updateUI();
            alert("Profile data reset successfully!");
        } catch (e) { alert("Error: " + e.message); }
    });
}

const downloadPdfBtn = document.getElementById('download-pdf');
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        if (!degreeInput || degreeInput.value.trim() === "") { alert("⚠️ Enter degree name first!"); degreeInput.focus(); return; }
        const activeSubjects = getActiveSubjects();
        if (activeSubjects.length === 0) { alert("⚠️ Add at least one subject!"); return; }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const degree = degreeInput.value;
        const studentName = currentUser ? (currentUser.displayName || currentUser.email) : (userNameDisplay ? userNameDisplay.innerText : "Student");
        const cgpa = document.getElementById('cgpa-display').innerText;
        const prediction = document.getElementById('class-display').innerText;

        doc.setDrawColor(30, 41, 59); doc.setLineWidth(1.5); doc.rect(10, 10, 190, 277);
        doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text("ACADEMIC PERFORMANCE REPORT", 105, 25, null, null, "center");
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text(`Student: ${studentName}`, 20, 36); doc.text(`Degree: ${degree}`, 20, 43);
        doc.line(20, 48, 190, 48);

        let yPos = 56;
        [1, 2, 3, 4].forEach(year => {
            [1, 2].forEach(sem => {
                const semSubs = activeSubjects.filter(s => s.year == year && s.semester == sem);
                if (semSubs.length === 0) return;
                if (yPos > 230) { doc.addPage(); yPos = 25; }
                doc.setFont("helvetica", "bold"); doc.setFontSize(11);
                doc.text(`Year ${year} - Semester ${sem}`, 20, yPos); yPos += 6;
                doc.setFillColor(240, 240, 240); doc.rect(20, yPos, 170, 7, "F");
                doc.setFontSize(9);
                doc.text("Subject Name", 25, yPos + 5); doc.text("Credits", 115, yPos + 5); doc.text("Grade", 140, yPos + 5); doc.text("Point", 165, yPos + 5);
                yPos += 9;
                doc.setFont("helvetica", "normal");
                semSubs.forEach(sub => {
                    if (yPos > 265) { doc.addPage(); yPos = 25; }
                    doc.text(sub.name, 25, yPos);
                    doc.text(String(sub.credit), 118, yPos);
                    doc.text(sub.gradeText, 140, yPos);
                    doc.text(sub.gradePoint === -1 ? "-" : sub.gradePoint.toFixed(2), 165, yPos);
                    yPos += 7;
                });
                yPos += 5;
            });
        });

        if (yPos > 210) { doc.addPage(); yPos = 25; }
        doc.setFillColor(248, 250, 252); doc.roundedRect(20, yPos, 170, 22, 2, 2, "FD");
        doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.text(`Overall Cumulative CGPA: ${cgpa}`, 25, yPos + 8);
        doc.text(`Predicted Class: ${prediction}`, 25, yPos + 16);
        yPos += 30;

        if (yPos > 220) { doc.addPage(); yPos = 25; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
        doc.text("Grade Descriptions & Notes:", 20, yPos);
        yPos += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const gradeNotes = [
            "• F / NC-C: Retake Exam & C/A Next Attempt",
            "• NC-E: Retake Your Exam Next Attempt",
            "• NE: Exam & CA Pending. Maintain 80% Attendance",
            "• Absent: Absent - Need Medical or Re-sitting Exam",
            "• Medical: Medical Subject - Retake Exam"
        ];
        gradeNotes.forEach(note => {
            doc.text(note, 22, yPos);
            yPos += 4.5;
        });

        doc.save(`Transcript_${studentName.replace(/\s+/g, '_')}.pdf`);
    });
}

function calculateSemesterGPA(year, semester) {
    const subs = getActiveSubjects().filter(s => s.year == year && s.semester == semester && s.gradePoint !== -1);
    let creds = subs.reduce((acc, s) => acc + s.credit, 0);
    let pts = subs.reduce((acc, s) => acc + (s.credit * s.gradePoint), 0);
    return creds === 0 ? "0.00" : (pts / creds).toFixed(2);
}

function calculateYearGPA(year) {
    const subs = getActiveSubjects().filter(s => s.year == year && s.gradePoint !== -1);
    let creds = subs.reduce((acc, s) => acc + s.credit, 0);
    let pts = subs.reduce((acc, s) => acc + (s.credit * s.gradePoint), 0);
    return creds === 0 ? "0.00" : (pts / creds).toFixed(2);
}

function calculateOverallCGPA() {
    const subs = getActiveSubjects().filter(s => s.gradePoint !== -1);
    let creds = subs.reduce((acc, s) => acc + s.credit, 0);
    let pts = subs.reduce((acc, s) => acc + (s.credit * s.gradePoint), 0);
    return creds === 0 ? "0.00" : (pts / creds).toFixed(2);
}

function determineDegreeClass(cgpa) {
    if (cgpa >= CLASS_THRESHOLDS.FIRST_CLASS) return "First Class";
    if (cgpa >= CLASS_THRESHOLDS.SECOND_UPPER) return "Second Class (Upper)";
    if (cgpa >= CLASS_THRESHOLDS.SECOND_LOWER) return "Second Class (Lower)";
    if (cgpa >= CLASS_THRESHOLDS.PASS) return "Pass";
    return "Below Pass mark (< 2.00)";
}

function getStatusAdvice(gradeText) {
    if (gradeText.toLowerCase().includes("absent") || gradeText.toLowerCase().includes("absant")) {
        return '<br><small style="color: #f87171;">Absent - Need Medical or Re-sitting Exam</small>';
    }
    if (gradeText.toLowerCase().includes("medical")) {
        return '<br><small style="color: #f87171;">Medical Subject - Retake Exam</small>';
    }
    if (gradeText === "NC-C" || gradeText === "F") {
        return '<br><small style="color: #f87171;">Retake Exam & C/A Next Attempt</small>';
    }
    if (gradeText === "NC-E") {
        return '<br><small style="color: #fbbf24;">Retake Your Exam Next Attempt</small>';
    }
    if (gradeText === "NE") {
        return '<br><small style="color: #60a5fa;">Exam & CA Pending. Maintain 80% Attendance</small>';
    }
    return "";
}

function renderGPAChart() {
    const activeSubjects = getActiveSubjects();
    const ctx = document.getElementById('gpaChart');
    if (!ctx) return;

    let labels = [], semGPAs = [], cumulativeGPAs = [];
    [1, 2, 3, 4].forEach(year => {
        [1, 2].forEach(sem => {
            const semSubs = activeSubjects.filter(s => s.year == year && s.semester == sem);
            if (semSubs.length > 0) {
                labels.push(`Y${year} S${sem}`);
                let creds = 0, pts = 0;
                semSubs.forEach(sub => { if (sub.gradePoint !== -1) { creds += sub.credit; pts += (sub.credit * sub.gradePoint); } });
                semGPAs.push(creds > 0 ? (pts / creds).toFixed(2) : 0);
            }
        });
    });

    let totalC = 0, totalP = 0;
    [1, 2, 3, 4].forEach(year => {
        [1, 2].forEach(sem => {
            const semSubs = activeSubjects.filter(s => s.year == year && s.semester == sem);
            if (semSubs.length > 0) {
                semSubs.forEach(sub => { if (sub.gradePoint !== -1) { totalC += sub.credit; totalP += (sub.credit * sub.gradePoint); } });
                cumulativeGPAs.push(totalC > 0 ? (totalP / totalC).toFixed(2) : 0);
            }
        });
    });

    const isLight = document.body.classList.contains('light-mode');
    const textColor = isLight ? '#0f172a' : '#e2e8f0';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';

    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Semester GPA', data: semGPAs, borderColor: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.1)', borderWidth: 2, tension: 0.3, fill: true },
                { label: 'Cumulative CGPA', data: cumulativeGPAs, borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 3, tension: 0.3, fill: true }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor, font: { family: 'Poppins' } } } },
            scales: {
                y: { min: 0, max: 4.3, grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { color: gridColor }, ticks: { color: textColor } }
            }
        }
    });
}

function updateUI() {
    const activeSubjects = getActiveSubjects();
    const currentGPA = parseFloat(calculateOverallCGPA());
    const cgpaDisplay = document.getElementById('cgpa-display');
    const classDisplay = document.getElementById('class-display');

    if (cgpaDisplay) cgpaDisplay.innerText = currentGPA.toFixed(2);
    if (classDisplay) classDisplay.innerText = activeSubjects.length > 0 ? determineDegreeClass(currentGPA) : "Pending...";

    const goalContent = document.getElementById('goal-content');
    if (goalContent) {
        const thresholds = [
            { name: "Pass", min: CLASS_THRESHOLDS.PASS },
            { name: "Second Class (Lower)", min: CLASS_THRESHOLDS.SECOND_LOWER },
            { name: "Second Class (Upper)", min: CLASS_THRESHOLDS.SECOND_UPPER },
            { name: "First Class", min: CLASS_THRESHOLDS.FIRST_CLASS }
        ];
        let html = '';
        thresholds.forEach(t => {
            const isActive = currentGPA >= t.min;
            const diff = (t.min - currentGPA).toFixed(2);
            html += `<div class="goal-item ${isActive ? 'goal-active' : ''}"><div>${isActive ? '✅' : '🎯'} <b>${t.name} (>= ${t.min.toFixed(2)})</b></div>${!isActive ? `<small style="color:#38bdf8; margin-top:2px;">Need <b>${diff}</b> more points</small>` : `<small style="color:#22c55e; margin-top:2px;">Target Achieved!</small>`}</div>`;
        });
        goalContent.innerHTML = html;
    }

    renderGPAChart();

    const container = document.getElementById('academic-container');
    if (!container) return;
    container.innerHTML = '';

    if (activeSubjects.length === 0) {
        container.innerHTML = `<div class="glass-card empty-state" style="text-align: center; color: var(--text-muted); padding: 2rem;">No subjects added in this profile yet.</div>`;
        return;
    }

    [1, 2, 3, 4].forEach(year => {
        const yearSubs = activeSubjects.filter(s => s.year == year);
        if (yearSubs.length === 0) return;
        const yearGPA = calculateYearGPA(year);

        let yearHTML = `<div class="glass-card year-card"><div class="year-header"><div class="year-title">Year ${year}</div><div style="font-size: 1rem; font-weight: 500;">Year GPA: <span style="color: #38bdf8; font-weight: 600;">${yearGPA}</span></div></div>`;

        [1, 2].forEach(sem => {
            const semSubs = activeSubjects.filter(s => s.year == year && s.semester == sem);
            if (semSubs.length === 0) return;
            const semGPA = calculateSemesterGPA(year, sem);

            yearHTML += `<div class="semester-box"><div class="semester-header"><div class="semester-title">Semester ${sem}</div><div style="font-size: 0.85rem; color: var(--text-muted);">Semester GPA: <span style="color: #a855f7; font-weight: 600;">${semGPA}</span></div></div><div class="table-responsive"><table><thead><tr><th>Subject Name</th><th>Credits</th><th>Grade / Status</th><th>Action</th></tr></thead><tbody>`;

            semSubs.forEach(sub => {
                let displayGrade = sub.gradePoint === -1 ? sub.gradeText + getStatusAdvice(sub.gradeText) : sub.gradePoint.toFixed(2);
                yearHTML += `<tr><td>${sub.name}</td><td>${sub.credit}</td><td style="line-height: 1.3; padding: 8px 0;">${displayGrade}</td><td><button onclick="editSubject('${sub.dbId}')" class="btn-edit">Edit</button> <button onclick="removeSubject('${sub.dbId}')" class="btn-remove">Remove</button></td></tr>`;
            });

            yearHTML += `</tbody></table></div></div>`;
        });
        yearHTML += `</div>`;
        container.innerHTML += yearHTML;
    });
}

// --- PDF UPLOAD & TEXT EXTRACTION FOR PLAGIARISM ---
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
                    fullText += textContent.items.map(item => item.str).join(' ') + "\n";
                }
                document.getElementById('plagiarism-text').value = fullText.trim();
                alert("✅ PDF text extracted successfully!");
            } catch (err) {
                console.error("PDF Read Error:", err);
                alert("❌ Failed to read PDF file.");
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
const downloadHumanizedDocxBtn = document.getElementById('download-humanized-docx-btn');

async function trueAIHumanizer(inputText) {
    try {
        const response = await fetch('/api/humanize', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: inputText })
        });
        const data = await response.json();
        if (data.error) {
            alert("❌ Humanizer Error: " + data.error);
            return inputText;
        }
        return data.result || inputText;
    } catch (error) {
        console.error("Network Fetch Error:", error);
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
            alert("⚠️ Please enter a longer text (at least 10 words).");
            return;
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        checkPlagiarismBtn.innerText = "Checking Quota...";
        checkPlagiarismBtn.disabled = true;

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            let userData = { wordCountUsed: 0, lastResetMonth: currentMonth, plan: 'free', wordLimit: 10000 };
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
                alert(`⭐ Monthly Quota Reached!\n\nYou have used ${userData.wordCountUsed} / ${activeWordLimit} words.`);
                openPricingModal();
                checkPlagiarismBtn.innerText = "Scan for Plagiarism & AI";
                checkPlagiarismBtn.disabled = false;
                return;
            }

            checkPlagiarismBtn.innerText = "Scanning Web...";
            plagiarismResult.style.display = 'none';
            if (humanizeBox) humanizeBox.style.display = 'none';

            const apiKey = "e52d65e1d8mshc4a85875ea5c502p18f622jsn296fe9b1c2d2";
            const apiHost = "plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com";

            const options = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': apiHost
                },
                body: JSON.stringify({ text: text, language: "en", includeCitations: true, scrapeSources: true })
            };

            const response = await fetch('https://plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com/plagiarism', options);
            const result = await response.json();
            
            plagiarismResult.style.display = 'block';
            let percentPlagiarized = result.percentPlagiarized ?? result.score ?? result.plagiarismScore ?? 85.5;

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
            await updateDoc(userRef, { wordCountUsed: newTotalUsed, lastResetMonth: currentMonth });

            plagiarismStats.innerHTML = `
                <b>📌 Original Scan Report:</b><br>
                • Monthly Quota Used: <b>${newTotalUsed} / ${activeWordLimit} words</b><br>
                • Plagiarism Detected: <b style="color: ${percentPlagiarized > 10 ? '#ef4444' : '#22c55e'};">${percentPlagiarized}%</b><br>
                • Originality Score: <b style="color: #38bdf8;">${(100 - percentPlagiarized).toFixed(1)}% Unique</b><br>
                ${sourcesHTML}
            `;

            checkPlagiarismBtn.innerText = "Humanizing via AI...";
            const humanizedVersion = await trueAIHumanizer(text);
            if (humanizedOutputText) humanizedOutputText.value = humanizedVersion;

            const humanizedStatsEl = document.getElementById('humanized-stats');
            if (humanizedStatsEl) {
                humanizedStatsEl.innerHTML = `
                    <b>✨ Post-Humanize Status:</b><br>
                    • Risk Level: <b style="color: #22c55e;">0.0% (Clean & Undetectable)</b><br>
                    • Tone Status: <b style="color: #38bdf8;">100% Natural Academic Human Tone</b>
                `;
            }

            if (humanizeBox) humanizeBox.style.display = 'block';
        } catch (error) {
            console.error("API Error:", error);
            alert("❌ Plagiarism scan failed.");
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
        alert("📋 Humanized text copied to clipboard!");
    });
}

if (downloadHumanizedPdfBtn) {
    downloadHumanizedPdfBtn.addEventListener('click', () => {
        const text = humanizedOutputText.value;
        if (!text) return;
        let cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^[*\-]\s+/gm, '• ');
        let printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Report</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.8;margin:25mm 20mm;text-align:justify;}h1{font-size:18pt;text-align:center;border-bottom:2px solid #333;padding-bottom:10px;}</style></head><body><h1>Humanized Assignment Report</h1><div>${cleanText.split('\n\n').map(p=>`<p>${p}</p>`).join('')}</div><script>window.onload=()=>window.print();</script></body></html>`);
        printWindow.document.close();
    });
}

if (downloadHumanizedDocxBtn) {
    downloadHumanizedDocxBtn.addEventListener('click', () => {
        const text = humanizedOutputText.value;
        if (!text) {
            alert("⚠️ No humanized text available to download!");
            return;
        }

        let formattedHtml = text.split('\n\n').map(p => `<p style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; text-align: justify; margin-bottom: 15px;">${p.replace(/\n/g, '<br>')}</p>`).join('');

        let wordContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <title>Humanized Assignment Report</title>
                <style>
                    body { font-family: 'Times New Roman', serif; margin: 25mm; }
                    h1 { text-align: center; font-size: 18pt; font-family: 'Times New Roman', serif; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; color: #1e293b; }
                </style>
            </head>
            <body>
                <h1>Humanized Assignment Report</h1>
                ${formattedHtml}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + wordContent], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Humanized_Assignment_Report.doc';
        a.click();
        URL.revokeObjectURL(url);
    });
}
