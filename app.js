// ==========================================
// STUDENT PRODUCTIVITY HUB - APP.JS (COMPLETE & UPDATED WITH TABLE PARSER)
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

function showView(viewName) {
    if (dashboardHub) dashboardHub.style.display = 'none';
    if (viewGpa) viewGpa.style.display = 'none';
    if (viewShortNotes) viewShortNotes.style.display = 'none';
    if (viewPlagiarism) viewPlagiarism.style.display = 'none';

    if (viewName === 'hub') {
        if (dashboardHub) dashboardHub.style.display = 'block';
    } else if (viewName === 'gpa') {
        if (viewGpa) {
            viewGpa.style.display = 'block';
            renderGPAChart();
        }
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
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + "\n";
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
                    prompt: customPrompt || "Generate well-structured, comprehensive academic short notes with key definitions, core concepts, bullet points, and comparative tables[cite: 1] for a university student."
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

// Markdown Table Parser & PDF Print Logic
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
                    body {
                        font-family: 'Poppins', sans-serif;
                        font-size: 10pt;
                        line-height: 1.6;
                        color: #1e293b;
                        margin: 0;
                        padding: 15mm 20mm;
                        background: #ffffff;
                    }
                    .header-box {
                        background: linear-gradient(135deg, #0f172a, #1e293b);
                        color: white;
                        padding: 18px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .header-box h1 {
                        font-size: 15pt;
                        margin: 0 0 4px 0;
                        color: #38bdf8;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .header-box p {
                        font-size: 8.5pt;
                        color: #94a3b8;
                        margin: 0;
                    }
                    h1 { font-size: 14pt; color: #0f172a; margin-top: 20px; border-bottom: 2px solid #38bdf8; padding-bottom: 4px; }
                    h2 { font-size: 12pt; color: #1e293b; margin-top: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
                    h3 { font-size: 10.5pt; color: #334155; margin-top: 12px; }
                    ul { padding-left: 20px; margin-bottom: 10px; }
                    .footer-note {
                        margin-top: 30px;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 10px;
                        text-align: center;
                        font-size: 7.5pt;
                        color: #94a3b8;
                    }
                    @media print {
                        body { padding: 10mm 15mm; }
                        .header-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="header-box">
                    <h1>📚 Lecture Short Notes</h1>
                    <p>Generated via Student Productivity Hub • AI Academic Assistant</p>
                </div>
                
                <div class="content-body">
                    ${finalHtmlContent}
                </div>

                <div class="footer-note">
                    Official Academic Study Material Report | Powered by Groq AI & Student Productivity Hub
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
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + "\n";
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

// --- REAL-TIME COMMUNITY REVIEWS (FOOTER & MODAL) ---
function loadPublicReviews() {
    const container = document.getElementById('public-reviews-container');
    if (!container) return;

    onSnapshot(collection(db, "global_reviews"), (querySnapshot) => {
        let reviewsList = [];
        querySnapshot.forEach((doc) => {
            reviewsList.push(doc.data());
        });

        reviewsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (reviewsList.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">No reviews yet. Be the first to share your feedback!</div>`;
            return;
        }

        let html = '';
        reviewsList.forEach(rev => {
            let stars = '⭐'.repeat(rev.rating);
            html += `
                <div style="background: var(--input-bg); border: 1px solid var(--input-border); padding: 10px 14px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                        <b style="color: var(--text-color);">${rev.userName}</b>
                        <span>${stars}</span>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 0 0; line-height: 1.4;">${rev.comment}</p>
                </div>
            `;
        });

        container.innerHTML = html;
    }, (error) => {
        console.error("Error loading public reviews:", error);
        container.innerHTML = `<div style="text-align: center; color: #ef4444; font-size: 0.8rem;">Failed to load reviews.</div>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPublicReviews();
});

const reviewModal = document.getElementById('review-modal');
const closeReviewModalBtn = document.getElementById('close-review-modal');
const closeGotItBtn = document.getElementById('close-modal-btn');
const reviewNowButtons = document.querySelectorAll('.review-now-btn');

reviewNowButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (reviewModal) { reviewModal.style.display = 'flex'; }
    });
});
if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', () => reviewModal.style.display = 'none');
if (closeGotItBtn) closeGotItBtn.addEventListener('click', () => reviewModal.style.display = 'none');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        updateDynamicGreeting(user.displayName ? user.displayName.split(" ")[0] : "Student");
        if (loginSection) loginSection.style.display = "none";
        if (appSection) appSection.style.display = "block";
    } else {
        currentUser = null;
        if (loginSection) loginSection.style.display = "block";
        if (appSection) appSection.style.display = "none";
    }
});
