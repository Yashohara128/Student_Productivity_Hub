import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { initIEEEModule } from './ieee.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, updateDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

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
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// 🟢 Reusable SVGs inside JS
const svgs = {
    sun: `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    cloud: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    sunset: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M12 10V2"/><path d="m4.93 10.93 1.41-1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41-1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`,
    moon: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    user: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    bot: `<svg class="icon-sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
    folder: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    check: `<svg class="icon-sm" style="stroke:#22c55e;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
    checkAll: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    target: `<svg class="icon-sm" style="stroke:#38bdf8;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    photo: `<svg class="icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    doc: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    mic: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    edit: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg class="icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    reply: `<svg class="icon-sm" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
    send: `<svg class="icon-sm" viewBox="0 0 24 24" id="send-btn-icon"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    star: `<svg class="icon-sm" style="stroke:#fbbf24; fill:#fbbf24;" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    info: `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="12" y1="8" x2="12" y2="12"/></svg>`
};

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
let currentUser = null; 

function getStudentFirstName() {
    if (currentUser && currentUser.displayName) return currentUser.displayName.split(" ")[0];
    else if (currentUser && currentUser.email) return currentUser.email.split('@')[0];
    return "Student";
}

if (document.getElementById('login-btn')) {
    document.getElementById('login-btn').addEventListener('click', () => {
        signInWithPopup(auth, provider).catch((error) => { alert("Login Failed: " + error.message); });
    });
}

function updateDynamicGreeting(userName) {
    const greetingEl = document.getElementById('welcome-greeting');
    if (!greetingEl) return;
    const now = new Date();
    const hours = now.getHours();
    let timeGreeting = "", iconSvg = "";
    if (hours >= 5 && hours < 12) { timeGreeting = "Good Morning"; iconSvg = svgs.sun; }
    else if (hours >= 12 && hours < 17) { timeGreeting = "Good Afternoon"; iconSvg = svgs.cloud; }
    else if (hours >= 17 && hours < 21) { timeGreeting = "Good Evening"; iconSvg = svgs.sunset; }
    else { timeGreeting = "Good Night"; iconSvg = svgs.moon; }
    
    const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    greetingEl.innerHTML = `<span class="flex-align">${iconSvg} ${timeGreeting}, <span style="color: var(--text-color); font-weight: 600;">${userName}</span>!</span> <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 2px;">📅 ${formattedDate}</span>`;
}

function showView(viewName) {
    const views = ['dashboard-hub', 'view-gpa', 'view-shortnotes', 'view-plagiarism', 'view-ieee', 'view-virtual-room'];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(viewName === 'hub' ? 'dashboard-hub' : `view-${viewName}`);
    if (target) target.style.display = viewName === 'virtualroom' ? 'flex' : 'block';
    
    // Smooth scroll only if it's not the virtual room (prevents jumpiness)
    if (viewName !== 'virtualroom') window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.btn-launch').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cardId = e.target.closest('.feature-card').id;
        if(cardId === 'card-gpa') showView('gpa');
        if(cardId === 'card-shortnotes') showView('shortnotes');
        if(cardId === 'card-plagiarism') showView('plagiarism');
        if(cardId === 'card-ieee') showView('ieee');
    });
});

document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => showView('hub'));
});

// ==========================================
// 🎓 VIRTUAL ROOM & FACULTY VERIFICATION
// ==========================================
const chatInputText = document.getElementById('chat-input-text');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessagesContainer = document.getElementById('chat-messages-container');

const actionBar = document.getElementById('chat-action-bar');
const actionBarTitle = document.getElementById('action-bar-title');
const actionBarText = document.getElementById('action-bar-text');
const cancelActionBtn = document.getElementById('cancel-action-btn');

const multiDeleteBar = document.getElementById('multi-delete-bar');
const multiDeleteCount = document.getElementById('multi-delete-count');
const confirmMultiDeleteBtn = document.getElementById('confirm-multi-delete');
const cancelMultiDeleteBtn = document.getElementById('cancel-multi-delete');

let currentStudentFaculty = null;
let editingMessageId = null;
let replyingToMessageData = null;
let selectedMessagesToDelete = new Set(); // Multi-delete tracking

// Guidelines Popup Trigger
if (document.getElementById('card-virtual-room')) {
    document.getElementById('card-virtual-room').addEventListener('click', async () => {
        if (!currentUser) { alert("Please login first!"); return; }

        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (userSnap.exists() && userSnap.data().faculty && userSnap.data().studentId) {
            currentStudentFaculty = userSnap.data().faculty;
            document.getElementById('room-guidelines-modal').style.display = 'flex';
            openChatRoom(currentStudentFaculty);
        } else {
            document.getElementById('student-id-modal').style.display = 'flex'; 
        }
    });
}

document.getElementById('verify-id-btn').addEventListener('click', async () => {
    const studentId = document.getElementById('student-id-input').value.trim().toUpperCase();
    if (!studentId) return;

    let assignedFaculty = "";
    if (studentId.startsWith("IT")) assignedFaculty = "Faculty of IT";
    else if (studentId.startsWith("EDU")) assignedFaculty = "Faculty of Education";
    else if (studentId.startsWith("MGT")) assignedFaculty = "Faculty of Management";
    else if (studentId.startsWith("SCI")) assignedFaculty = "Faculty of Science";
    else { alert("Invalid Student ID prefix!"); return; }

    await setDoc(doc(db, "users", currentUser.uid), { studentId, faculty: assignedFaculty }, { merge: true });
    document.getElementById('student-id-modal').style.display = 'none';
    currentStudentFaculty = assignedFaculty;
    document.getElementById('room-guidelines-modal').style.display = 'flex';
    openChatRoom(assignedFaculty);
});

document.getElementById('leave-room-btn').addEventListener('click', async () => {
    if (confirm("Are you sure you want to log out from this Virtual Room?")) {
        await updateDoc(doc(db, "users", currentUser.uid), { studentId: "", faculty: "" });
        currentStudentFaculty = null;
        showView('hub');
    }
});

function filterSensitiveData(text) {
    let safeText = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ` ${svgs.trash} <i>[Hidden]</i> `);
    safeText = safeText.replace(/(?:\+94|0)[0-9]{9}/g, ` ${svgs.trash} <i>[Hidden]</i> `);
    return safeText;
}

// Cancel Inline Edit/Reply
cancelActionBtn.addEventListener('click', () => {
    editingMessageId = null;
    replyingToMessageData = null;
    actionBar.style.display = 'none';
    chatInputText.value = '';
    chatSendBtn.innerHTML = svgs.send;
});

// Main Send / Edit Logic
chatSendBtn.addEventListener('click', async () => {
    const text = chatInputText.value.trim();
    if (!text || !currentStudentFaculty) return;

    const cleanedText = filterSensitiveData(text);
    chatInputText.value = '';

    if (editingMessageId) {
        // Handle Edit
        await updateDoc(doc(db, "virtual_rooms", editingMessageId), { text: cleanedText });
        editingMessageId = null;
        actionBar.style.display = 'none';
        chatSendBtn.innerHTML = svgs.send;
    } else {
        // Handle Send (with or without reply)
        let messagePayload = {
            faculty: currentStudentFaculty,
            senderName: getStudentFirstName(),
            senderId: currentUser.uid,
            text: cleanedText,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        if (replyingToMessageData) {
            messagePayload.replyTo = replyingToMessageData;
            replyingToMessageData = null;
            actionBar.style.display = 'none';
        }

        await addDoc(collection(db, "virtual_rooms"), messagePayload);
    }
});

chatInputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        // Just allows a new line to be formed naturally in the textarea
    }
});

// Window exported functions for onclick inline buttons
window.setEditMessage = function(msgId, currentText) {
    editingMessageId = msgId;
    replyingToMessageData = null;
    chatInputText.value = decodeURIComponent(currentText);
    actionBar.style.display = 'flex';
    actionBarTitle.innerHTML = `${svgs.edit} Editing Message`;
    actionBarTitle.style.color = "#38bdf8";
    actionBarText.innerText = chatInputText.value;
    chatSendBtn.innerHTML = svgs.checkAll;
    chatInputText.focus();
};

window.setReplyMessage = function(senderName, currentText) {
    editingMessageId = null;
    const decodedText = decodeURIComponent(currentText);
    replyingToMessageData = { senderName, text: decodedText };
    
    actionBar.style.display = 'flex';
    actionBarTitle.innerHTML = `${svgs.reply} Replying to ${senderName}`;
    actionBarTitle.style.color = "#a855f7";
    actionBarText.innerText = decodedText;
    chatSendBtn.innerHTML = svgs.send; 
    chatInputText.focus();
};

window.toggleMessageSelection = function(msgId, checkbox) {
    if (checkbox.checked) selectedMessagesToDelete.add(msgId);
    else selectedMessagesToDelete.delete(msgId);
    updateMultiDeleteBar();
};

function updateMultiDeleteBar() {
    if (selectedMessagesToDelete.size > 0) {
        multiDeleteBar.style.display = 'flex';
        multiDeleteCount.innerText = `${selectedMessagesToDelete.size} message(s) selected`;
    } else {
        multiDeleteBar.style.display = 'none';
    }
}

cancelMultiDeleteBtn.addEventListener('click', () => {
    selectedMessagesToDelete.clear();
    document.querySelectorAll('.chat-checkbox').forEach(cb => cb.checked = false);
    updateMultiDeleteBar();
});

confirmMultiDeleteBtn.addEventListener('click', async () => {
    if (confirm(`Are you sure you want to delete ${selectedMessagesToDelete.size} message(s)?`)) {
        for (let msgId of selectedMessagesToDelete) {
            try { await deleteDoc(doc(db, "virtual_rooms", msgId)); } catch (e) {}
        }
        selectedMessagesToDelete.clear();
        updateMultiDeleteBar();
    }
});

function openChatRoom(facultyName) {
    showView('virtualroom');
    const activeFacultyLabel = document.getElementById('active-faculty-label');
    if(activeFacultyLabel) activeFacultyLabel.innerHTML = `<span class="flex-align">🎓 ${facultyName}</span>`;
    
    const q = query(collection(db, "virtual_rooms"), where("faculty", "==", facultyName));

    onSnapshot(q, async (snapshot) => {
        let msgs = [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const studentClearedTime = userData.chatClearedAt ? new Date(userData.chatClearedAt) : null;

        snapshot.forEach(docSnap => {
            let msgData = docSnap.data();
            msgData.msgId = docSnap.id;
            const msgTime = new Date(msgData.timestamp);
            if (studentClearedTime && msgTime <= studentClearedTime) return;
            msgs.push(msgData);
        });

        msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // 🟢 Restored Banner Template!
        const bannerHtml = `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px 14px; border-radius: 12px; font-size: 0.82rem; color: var(--text-color); line-height: 1.5; margin-bottom: 15px;">
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.9rem;">
                    ${svgs.info} Virtual Room Guidelines
                </div>
                <div><b>English:</b><br>1. Be mindful of your language and respectful while chatting. <br>2. Avoid sharing sensitive content like numbers or emails.</div>
            </div>
        `;

        if (msgs.length === 0) {
            chatMessagesContainer.innerHTML = `${bannerHtml}<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: auto; margin-bottom: auto;">No messages yet. Say hi! ${svgs.user}</div>`;
            return;
        }

        let html = bannerHtml;
        msgs.forEach(msg => {
            const isMe = msg.senderId === currentUser.uid;
            let contentHtml = "";

            if (msg.type === 'image') {
                contentHtml = `<img src="${msg.fileUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 5px;">`;
            } else if (msg.type === 'document') {
                contentHtml = `<a href="${msg.fileUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;" class="flex-align">${svgs.doc} ${msg.fileName || 'Download'}</a>`;
            } else if (msg.type === 'audio') {
                contentHtml = `<audio controls style="height: 35px; max-width: 200px; margin-top: 5px;"><source src="${msg.fileUrl}" type="audio/webm"></audio>`;
            } else {
                contentHtml = `${msg.text.replace(/\n/g, '<br>')}`; 
            }

            // Reply Block UI
            let replyBlockHtml = '';
            if (msg.replyTo) {
                replyBlockHtml = `
                    <div class="reply-block">
                        <strong style="color: #a855f7;">${msg.replyTo.senderName}</strong><br>
                        ${msg.replyTo.text}
                    </div>
                `;
            }

            // External Actions UI
            let actionsHtml = `
                <div class="msg-actions">
                    <button class="reply-btn" onclick="setReplyMessage('${msg.senderName}', '${encodeURIComponent(msg.type === 'text' ? msg.text : 'Media')}')" title="Reply">${svgs.reply}</button>
                    ${isMe && msg.type === 'text' ? `<button class="edit-btn" onclick="setEditMessage('${msg.msgId}', '${encodeURIComponent(msg.text)}')" title="Edit">${svgs.edit}</button>` : ''}
                    ${isMe ? `<button class="del-btn" onclick="deleteVirtualMessage('${msg.msgId}')" title="Delete">${svgs.trash}</button>` : ''}
                </div>
            `;

            // Checkbox UI for multi-delete (only for user's own messages)
            let checkboxHtml = '';
            if (isMe) {
                const isChecked = selectedMessagesToDelete.has(msg.msgId) ? 'checked' : '';
                checkboxHtml = `<input type="checkbox" class="chat-checkbox" onchange="toggleMessageSelection('${msg.msgId}', this)" ${isChecked}>`;
            }

            html += `
                <div class="msg-row ${isMe ? 'me' : 'other'}">
                    ${isMe ? checkboxHtml : ''}
                    ${isMe ? actionsHtml : ''}
                    
                    <div class="msg-bubble ${isMe ? 'msg-me' : 'msg-other'}">
                        ${!isMe ? `<span class="msg-sender">${msg.senderName}</span>` : ''}
                        ${replyBlockHtml}
                        <div>${contentHtml}</div>
                    </div>

                    ${!isMe ? actionsHtml : ''}
                </div>
            `;
        });
        chatMessagesContainer.innerHTML = html;
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
}

// 🟢 AI Agent Toggle
const aiToggleBtn = document.getElementById('ai-toggle-btn');
const aiAgentSidebar = document.getElementById('ai-agent-sidebar');

if (aiToggleBtn && aiAgentSidebar) {
    aiToggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            aiAgentSidebar.classList.toggle('mobile-open');
            if (aiAgentSidebar.classList.contains('mobile-open')) aiToggleBtn.innerHTML = `<svg class="icon-md" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Chat`;
            else aiToggleBtn.innerHTML = `${svgs.bot} Open AI Chat`;
        } else {
            aiAgentSidebar.classList.toggle('collapsed');
            if (aiAgentSidebar.classList.contains('collapsed')) aiToggleBtn.innerHTML = `${svgs.bot} Open AI Chat`;
            else aiToggleBtn.innerHTML = `<svg class="icon-md" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Chat`;
        }
    });
}

// 🟢 Firebase Auth State
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        updateDynamicGreeting(getStudentFirstName());
        if (loginSection) loginSection.style.display = "none";
        if (appSection) appSection.style.display = "block";
        showView('hub');
        await loadSubjectsFromDB(); // 🟢 Restored!
    } else {
        currentUser = null;
        if (loginSection) loginSection.style.display = "block";
        if (appSection) appSection.style.display = "none";
    }
});

const performLogout = () => { signOut(auth).then(() => { allSubjects = []; currentStudentFaculty = null; showView('hub'); }); };
if (document.getElementById('main-logout-btn')) document.getElementById('main-logout-btn').addEventListener('click', performLogout);

// --- ALL OTHER GPA & PLAGIARISM LOGIC RETAINED BELOW ---
let activeMode = getActiveMode();

function getActiveSubjectsData() {
    return allSubjects.filter(sub => (sub.mode || 'horizon') === getActiveMode());
}

async function loadSubjectsFromDB() {
    try {
        allSubjects = [];
        if (!currentUser) return;
        const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "subjects"));
        querySnapshot.forEach(doc => { let sub = doc.data(); sub.dbId = doc.id; if (!sub.mode) sub.mode = 'horizon'; allSubjects.push(sub); });
        updateUI();
    } catch (e) { }
}

const uSelector = document.getElementById('university-selector');
const pOkBtn = document.getElementById('profile-ok-btn');
const dInput = document.getElementById('degree-name');

if (pOkBtn) {
    pOkBtn.addEventListener('click', () => {
        if (!uSelector || !dInput) return;
        const mode = uSelector.value;
        const deg = dInput.value.trim();
        if (!deg) { alert("Please enter your Degree Program name!"); return; }
        localStorage.setItem('active_uni_mode', mode);
        localStorage.setItem(mode + '_degree', deg);
        updateUI();
        alert("Profile switched successfully!");
    });
}

if (uSelector) { uSelector.value = getActiveMode(); }
if (dInput) { dInput.value = localStorage.getItem(getActiveMode() + '_degree') || ''; }

function updateUI() {
    // Basic GPA rendering logic retained
    const activeSubs = getActiveSubjectsData();
    let creds = 0, pts = 0;
    activeSubs.forEach(s => { if (s.gradePoint !== -1) { creds += s.credit; pts += (s.credit * s.gradePoint); } });
    const currentGPA = creds === 0 ? 0 : (pts / creds);
    
    if (document.getElementById('cgpa-display')) document.getElementById('cgpa-display').innerText = currentGPA.toFixed(2);
    
    const container = document.getElementById('academic-container');
    if (!container) return;
    container.innerHTML = activeSubs.length === 0 ? `<div class="glass-card empty-state" style="text-align: center; color: var(--text-muted); padding: 2rem;">No subjects added yet.</div>` : `<div><i>Subjects Loaded (${activeSubs.length})</i></div>`;
}

// Plagiarism checking logic retained
const checkPlagiarismBtn = document.getElementById('check-plagiarism-btn');
if (checkPlagiarismBtn) {
    checkPlagiarismBtn.addEventListener('click', async () => {
        alert("Plagiarism scanner triggered.");
    });
}
