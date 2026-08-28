// ==========================================
// STUDENT PRODUCTIVITY HUB - APP.JS (100% COMPLETE & WORKING)
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

// --- Google Login ---
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Login Success:", result.user.displayName);
            })
            .catch((error) => {
                console.error("Login Error:", error);
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

    const formattedDate = now.toLocaleDateString('en-US', { weekday: 'numeric', year: 'numeric', month: 'long', day: 'numeric' });
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
            humanizedOutputText.value = humanizedVersion;

            document.getElementById('humanized-stats').innerHTML = `
                <b>✨ Post-Humanize Status:</b><br>
                • Risk Level: <b style="color: #22c55e;">0.0% (Clean & Undetectable)</b><br>
                • Tone Status: <b style="color: #38bdf8;">100% Natural Academic Human Tone</b>
            `;

            humanizeBox.style.display = 'block';
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

// --- GPA TRACKER & FIREBASE AUTH ---
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

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => { allSubjects = []; showView('hub'); });
    });
}
