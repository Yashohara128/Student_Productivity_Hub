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

const svgs = {
    sun: `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    cloud: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    sunset: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M12 10V2"/><path d="m4.93 10.93 1.41-1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41-1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`,
    moon: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    user: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    bot: `<svg class="icon-sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`,
    folder: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    check: `<svg class="icon-sm" style="stroke:#22c55e;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
    checkAll: `<svg class="icon-sm" style="stroke:#22c55e;" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    target: `<svg class="icon-sm" style="stroke:#38bdf8;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    photo: `<svg class="icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    doc: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    mic: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    edit: `<svg class="icon-sm" style="stroke:currentColor; width:14px; height:14px;" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg class="icon-sm" style="stroke:currentColor; width:14px; height:14px;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    reply: `<svg class="icon-sm" style="stroke:currentColor; width:14px; height:14px;" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
    send: `<svg class="icon-sm" viewBox="0 0 24 24" id="send-btn-icon"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
    star: `<svg class="icon-sm" style="stroke:#fbbf24; fill:#fbbf24;" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    info: `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="12" y1="8" x2="12" y2="12"/></svg>`
};

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const userNameDisplay = document.getElementById('user-name');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mainLogoutBtn = document.getElementById('main-logout-btn');
const addBtn = document.getElementById('add-btn');
const degreeInput = document.getElementById('degree-name');

const dashboardHub = document.getElementById('dashboard-hub');
const viewGpa = document.getElementById('view-gpa');
const viewShortNotes = document.getElementById('view-shortnotes');
const viewPlagiarism = document.getElementById('view-plagiarism');
const viewIeee = document.getElementById('view-ieee');
const viewVirtualRoom = document.getElementById('view-virtual-room');

let allSubjects = []; 
let currentUser = null; 
let editingSubjectId = null; 
let myChart = null;

const CLASS_THRESHOLDS = { FIRST_CLASS: 3.70, SECOND_UPPER: 3.30, SECOND_LOWER: 3.00, PASS: 2.00 };

function getStudentFirstName() {
    if (currentUser && currentUser.displayName) return currentUser.displayName.split(" ")[0];
    else if (currentUser && currentUser.email) return currentUser.email.split('@')[0];
    return "Student";
}

function getActiveMode() { return localStorage.getItem('active_uni_mode') || 'horizon'; }
function getActiveSubjects() {
    const activeMode = getActiveMode();
    return allSubjects.filter(sub => (sub.mode || 'horizon') === activeMode);
}

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch((error) => { alert("❌ Login Failed: " + error.message); });
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
    if (dashboardHub) dashboardHub.style.display = 'none';
    if (viewGpa) viewGpa.style.display = 'none';
    if (viewShortNotes) viewShortNotes.style.display = 'none';
    if (viewPlagiarism) viewPlagiarism.style.display = 'none';
    if (viewIeee) viewIeee.style.display = 'none';
    if (viewVirtualRoom) viewVirtualRoom.style.display = 'none';

    if (viewName === 'hub') {
        if (dashboardHub) dashboardHub.style.display = 'block';
    } else if (viewName === 'gpa') {
        if (viewGpa) { viewGpa.style.display = 'block'; renderGPAChart(); }
    } else if (viewName === 'shortnotes') {
        if (viewShortNotes) viewShortNotes.style.display = 'block';
    } else if (viewName === 'plagiarism') {
        if (viewPlagiarism) viewPlagiarism.style.display = 'block';
    } else if (viewName === 'ieee') {
        if (viewIeee) viewIeee.style.display = 'block';
    } else if (viewName === 'virtualroom') {
        if (viewVirtualRoom) viewVirtualRoom.style.display = 'flex'; 
    }
    
    if (viewName !== 'virtualroom') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

if (document.getElementById('card-gpa')) document.getElementById('card-gpa').addEventListener('click', () => showView('gpa'));
if (document.getElementById('card-shortnotes')) document.getElementById('card-shortnotes').addEventListener('click', () => showView('shortnotes'));
if (document.getElementById('card-plagiarism')) document.getElementById('card-plagiarism').addEventListener('click', () => showView('plagiarism'));
if (document.getElementById('card-ieee')) document.getElementById('card-ieee').addEventListener('click', () => showView('ieee'));

document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => showView('hub'));
});

// ==========================================
// 🎓 VIRTUAL ROOM & FACULTY VERIFICATION
// ==========================================
let currentStudentFaculty = null;
let editingMessageId = null;
let replyingToMessageData = null;
let selectedMessagesToDelete = new Set();
let pressTimer;

// Robust Event Delegation for Virtual Room Card Trigger
document.addEventListener('click', async (e) => {
    const virtualCard = e.target.closest('#card-virtual-room');
    if (!virtualCard) return;

    if (!currentUser) { alert("Please login first!"); return; }

    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        const roomGuidelinesModal = document.getElementById('room-guidelines-modal');
        const studentIdModal = document.getElementById('student-id-modal');

        if (userSnap.exists() && userSnap.data().faculty && userSnap.data().studentId) {
            currentStudentFaculty = userSnap.data().faculty;
            if (roomGuidelinesModal) roomGuidelinesModal.style.display = 'flex';
            openChatRoom(currentStudentFaculty);
        } else {
            if (studentIdModal) studentIdModal.style.display = 'flex'; 
        }
    } catch (err) {
        console.error("Error opening virtual room:", err);
        alert("Error opening virtual room: " + err.message);
    }
});

const verifyIdBtn = document.getElementById('verify-id-btn');
if (verifyIdBtn) {
    verifyIdBtn.addEventListener('click', async () => {
        const studentId = document.getElementById('student-id-input').value.trim().toUpperCase();
        if (!studentId) { alert("Please enter your Student ID."); return; }

        verifyIdBtn.innerText = "Verifying...";
        verifyIdBtn.disabled = true;

        try {
            const q = query(collection(db, "users"), where("studentId", "==", studentId));
            const querySnapshot = await getDocs(q);

            let isIdAlreadyTaken = false;
            querySnapshot.forEach((doc) => {
                if (doc.id !== currentUser.uid) isIdAlreadyTaken = true;
            });

            if (isIdAlreadyTaken) {
                alert("SECURITY ALERT: This Student ID is already registered!");
                verifyIdBtn.innerText = "Verify & Join Room ➔";
                verifyIdBtn.disabled = false;
                return;
            }

            let assignedFaculty = "";
            if (studentId.startsWith("IT")) assignedFaculty = "Faculty of IT";
            else if (studentId.startsWith("EDU")) assignedFaculty = "Faculty of Education";
            else if (studentId.startsWith("MGT")) assignedFaculty = "Faculty of Management";
            else if (studentId.startsWith("SCI")) assignedFaculty = "Faculty of Science";
            else { alert("Invalid Student ID prefix!"); verifyIdBtn.innerText = "Verify & Join Room ➔"; verifyIdBtn.disabled = false; return; }

            await setDoc(doc(db, "users", currentUser.uid), { studentId, faculty: assignedFaculty }, { merge: true });
            document.getElementById('student-id-modal').style.display = 'none';
            currentStudentFaculty = assignedFaculty;
            document.getElementById('room-guidelines-modal').style.display = 'flex';
            openChatRoom(assignedFaculty);
            verifyIdBtn.innerText = "Verify & Join Room ➔";
            verifyIdBtn.disabled = false;
        } catch (e) {
            alert("Verification Error: " + e.message);
            verifyIdBtn.innerText = "Verify & Join Room ➔";
            verifyIdBtn.disabled = false;
        }
    });
}

const acceptGuidelinesBtn = document.getElementById('accept-guidelines-btn');
if (acceptGuidelinesBtn) {
    acceptGuidelinesBtn.addEventListener('click', () => {
        document.getElementById('room-guidelines-modal').style.display = 'none';
    });
}

const closeIdModal = document.getElementById('close-id-modal');
if (closeIdModal) {
    closeIdModal.addEventListener('click', () => {
        document.getElementById('student-id-modal').style.display = 'none';
    });
}

const leaveRoomBtn = document.getElementById('leave-room-btn');
if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        if (confirm("Are you sure you want to log out from this Virtual Room?")) {
            await updateDoc(doc(db, "users", currentUser.uid), { studentId: "", faculty: "" });
            currentStudentFaculty = null;
            showView('hub');
        }
    });
}

const clearMyChatBtn = document.getElementById('clear-my-chat-btn');
if (clearMyChatBtn) {
    clearMyChatBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        if (confirm("Are you sure you want to clear the chat view for yourself?")) {
            try {
                await setDoc(doc(db, "users", currentUser.uid), { chatClearedAt: new Date().toISOString() }, { merge: true });
                if (currentStudentFaculty) openChatRoom(currentStudentFaculty); 
            } catch (e) { alert("Failed to clear chat"); }
        }
    });
}

function filterSensitiveData(text) {
    let safeText = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ` ${svgs.trash} <i>[Hidden]</i> `);
    safeText = safeText.replace(/(?:\+94|0)[0-9]{9}/g, ` ${svgs.trash} <i>[Hidden]</i> `);
    return safeText;
}

const chatInputText = document.getElementById('chat-input-text');
const chatSendBtn = document.getElementById('chat-send-btn');
const actionBar = document.getElementById('chat-action-bar');
const actionBarTitle = document.getElementById('action-bar-title');
const actionBarText = document.getElementById('action-bar-text');
const cancelActionBtn = document.getElementById('cancel-action-btn');

if (cancelActionBtn) {
    cancelActionBtn.addEventListener('click', () => {
        editingMessageId = null;
        replyingToMessageData = null;
        if (actionBar) actionBar.style.display = 'none';
        if (chatInputText) chatInputText.value = '';
        if (chatSendBtn) chatSendBtn.innerHTML = svgs.send;
    });
}

if (chatSendBtn) {
    chatSendBtn.addEventListener('click', async () => {
        const text = chatInputText.value.trim();
        if (!text || !currentStudentFaculty) return;

        const cleanedText = filterSensitiveData(text);
        chatInputText.value = '';

        if (editingMessageId) {
            try { await updateDoc(doc(db, "virtual_rooms", editingMessageId), { text: cleanedText }); } catch(e) {}
            editingMessageId = null;
            if (actionBar) actionBar.style.display = 'none';
            chatSendBtn.innerHTML = svgs.send;
        } else {
            let messagePayload = {
                faculty: currentStudentFaculty, senderName: getStudentFirstName(), senderId: currentUser.uid,
                text: cleanedText, type: 'text', timestamp: new Date().toISOString()
            };

            if (replyingToMessageData) {
                messagePayload.replyTo = replyingToMessageData;
                replyingToMessageData = null;
                if (actionBar) actionBar.style.display = 'none';
            }

            try { await addDoc(collection(db, "virtual_rooms"), messagePayload); } catch (e) {}
        }
    });
}

if (chatInputText) {
    chatInputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { }
    });
}

window.setEditMessage = function(msgId, currentText) {
    editingMessageId = msgId;
    replyingToMessageData = null;
    chatInputText.value = decodeURIComponent(currentText);
    if(actionBar) {
        actionBar.style.display = 'flex';
        actionBarTitle.innerHTML = `${svgs.edit} Editing Message`;
        actionBarTitle.style.color = "#38bdf8";
        actionBarText.innerText = chatInputText.value;
    }
    chatSendBtn.innerHTML = svgs.checkAll;
    chatInputText.focus();
};

window.setReplyMessage = function(senderName, currentText) {
    editingMessageId = null;
    const decodedText = decodeURIComponent(currentText);
    replyingToMessageData = { senderName, text: decodedText };
    if(actionBar) {
        actionBar.style.display = 'flex';
        actionBarTitle.innerHTML = `${svgs.reply} Replying to ${senderName}`;
        actionBarTitle.style.color = "#a855f7";
        actionBarText.innerText = decodedText;
    }
    chatSendBtn.innerHTML = svgs.send; 
    chatInputText.focus();
};

window.startLongPress = function(msgId, isMe) {
    if (!isMe) return; 
    pressTimer = window.setTimeout(() => {
        if (!selectedMessagesToDelete.has(msgId)) selectedMessagesToDelete.add(msgId);
        updateMultiDeleteBar();
        document.querySelectorAll('.msg-row.me').forEach(row => row.classList.add('multi-select-mode'));
        document.querySelectorAll('.chat-checkbox').forEach(cb => {
            if(cb.getAttribute('onchange').includes(msgId)) cb.checked = true;
        });
    }, 500); 
};

window.cancelLongPress = function() {
    if (pressTimer) clearTimeout(pressTimer);
};

window.toggleMessageSelection = function(msgId, checkbox) {
    if (checkbox.checked) selectedMessagesToDelete.add(msgId);
    else selectedMessagesToDelete.delete(msgId);
    updateMultiDeleteBar();
};

const multiDeleteBar = document.getElementById('multi-delete-bar');
const multiDeleteCount = document.getElementById('multi-delete-count');
const confirmMultiDeleteBtn = document.getElementById('confirm-multi-delete');
const cancelMultiDeleteBtn = document.getElementById('cancel-multi-delete');

function updateMultiDeleteBar() {
    if (!multiDeleteBar) return;
    if (selectedMessagesToDelete.size > 0) {
        multiDeleteBar.style.display = 'flex';
        multiDeleteCount.innerText = `${selectedMessagesToDelete.size} message(s) selected`;
    } else {
        multiDeleteBar.style.display = 'none';
        document.querySelectorAll('.msg-row').forEach(row => row.classList.remove('multi-select-mode'));
    }
}

if(cancelMultiDeleteBtn){
    cancelMultiDeleteBtn.addEventListener('click', () => {
        selectedMessagesToDelete.clear();
        document.querySelectorAll('.chat-checkbox').forEach(cb => cb.checked = false);
        updateMultiDeleteBar();
    });
}

if(confirmMultiDeleteBtn){
    confirmMultiDeleteBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete ${selectedMessagesToDelete.size} message(s)?`)) {
            for (let msgId of selectedMessagesToDelete) {
                try { await deleteDoc(doc(db, "virtual_rooms", msgId)); } catch (e) {}
            }
            selectedMessagesToDelete.clear();
            updateMultiDeleteBar();
        }
    });
}

const mainAttachBtn = document.getElementById('main-attach-btn');
const attachmentMenu = document.getElementById('attachment-menu');
const menuImageBtn = document.getElementById('menu-image-btn');
const menuDocBtn = document.getElementById('menu-doc-btn');
const menuMicBtn = document.getElementById('menu-mic-btn');
const chatImageInput = document.getElementById('chat-image-input');
const chatDocInput = document.getElementById('chat-doc-input');

if (mainAttachBtn && attachmentMenu) {
    mainAttachBtn.addEventListener('click', (e) => {
        if (isRecording && mediaRecorder) {
            e.stopPropagation();
            mediaRecorder.stop();
            return;
        }
        e.stopPropagation();
        attachmentMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!mainAttachBtn.contains(e.target) && !attachmentMenu.contains(e.target)) {
            attachmentMenu.classList.remove('show');
        }
    });
}

if(menuImageBtn && chatImageInput) {
    menuImageBtn.addEventListener('click', () => { chatImageInput.click(); attachmentMenu.classList.remove('show'); });
    chatImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !currentStudentFaculty) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    uploadMediaToFirebase(new File([blob], file.name, { type: 'image/jpeg' }), file.name, 'image');
                }, 'image/jpeg', 0.7);
            };
        };
    });
}

if(menuDocBtn && chatDocInput) {
    menuDocBtn.addEventListener('click', () => { chatDocInput.click(); attachmentMenu.classList.remove('show'); });
    chatDocInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !currentStudentFaculty) return;
        uploadMediaToFirebase(file, file.name, 'document');
    });
}

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let recordedAudioBlob = null;
const voicePreviewBar = document.getElementById('voice-preview-bar');
const previewAudioElement = document.getElementById('preview-audio-element');
const cancelVoiceBtn = document.getElementById('cancel-voice-btn');
const sendVoiceBtn = document.getElementById('send-voice-btn');
const normalInputControls = document.getElementById('normal-input-controls');
const recordingIndicator = document.getElementById('recording-indicator');

if(menuMicBtn) {
    menuMicBtn.addEventListener('click', async () => {
        attachmentMenu.classList.remove('show');
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                isRecording = true;
                
                if (recordingIndicator) recordingIndicator.style.display = 'flex';
                mainAttachBtn.innerHTML = `🛑`; 
                mainAttachBtn.style.color = '#ef4444';

                mediaRecorder.ondataavailable = e => { audioChunks.push(e.data); };
                mediaRecorder.onstop = async () => {
                    isRecording = false;
                    if (recordingIndicator) recordingIndicator.style.display = 'none';
                    mainAttachBtn.innerHTML = `<svg class="icon-lg" viewBox="0 0 24 24"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
                    mainAttachBtn.style.color = 'var(--text-muted)';
                    
                    recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    audioChunks = [];

                    if (previewAudioElement && voicePreviewBar && normalInputControls) {
                        previewAudioElement.src = URL.createObjectURL(recordedAudioBlob);
                        voicePreviewBar.style.display = 'flex';
                        normalInputControls.style.display = 'none';
                    }
                };
            } catch (err) { alert("Microphone access denied!"); }
        }
    });
}

if (cancelVoiceBtn) {
    cancelVoiceBtn.addEventListener('click', () => {
        recordedAudioBlob = null;
        isRecording = false;
        if (voicePreviewBar) voicePreviewBar.style.display = 'none';
        if (normalInputControls) normalInputControls.style.display = 'flex';
    });
}

if (sendVoiceBtn) {
    sendVoiceBtn.addEventListener('click', () => {
        if (!recordedAudioBlob) return;
        const blobToSend = recordedAudioBlob;
        recordedAudioBlob = null;
        isRecording = false;
        if (voicePreviewBar) voicePreviewBar.style.display = 'none';
        if (normalInputControls) normalInputControls.style.display = 'flex';
        uploadMediaToFirebase(blobToSend, `audio_${Date.now()}.webm`, 'audio');
    });
}

function uploadMediaToFirebase(fileOrBlob, fileName, type) {
    const storageRef = ref(storage, `virtual_room_media/${Date.now()}_${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, fileOrBlob);

    const originalBtnHTML = chatSendBtn.innerHTML;
    chatSendBtn.innerHTML = "⏳";
    chatSendBtn.disabled = true;

    uploadTask.on('state_changed', () => {}, 
        (error) => { alert("Upload failed: " + error.message); chatSendBtn.innerHTML = originalBtnHTML; chatSendBtn.disabled = false; }, 
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            let displayTxt = type === 'audio' ? `${svgs.mic} Voice Message` : (type === 'image' ? `${svgs.photo} Photo` : `${svgs.doc} Document`);
            
            await addDoc(collection(db, "virtual_rooms"), {
                faculty: currentStudentFaculty, senderName: getStudentFirstName(), senderId: currentUser.uid,
                text: displayTxt, type: type, fileName: fileName, fileUrl: downloadURL, timestamp: new Date().toISOString()
            });

            chatSendBtn.innerHTML = originalBtnHTML;
            chatSendBtn.disabled = false;
        }
    );
}

window.deleteVirtualMessage = async function(msgId) {
    if (!confirm("Are you sure?")) return;
    try { await deleteDoc(doc(db, "virtual_rooms", msgId)); } catch (e) {}
};

function openChatRoom(facultyName) {
    showView('virtualroom');
    if(activeFacultyLabel) activeFacultyLabel.innerHTML = `<span class="flex-align">🎓 ${facultyName}</span>`;
    
    const q = query(collection(db, "virtual_rooms"), where("faculty", "==", facultyName));

    onSnapshot(q, async (snapshot) => {
        let msgs = [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const studentClearedTime = userData.chatClearedAt ? new Date(userData.chatClearedAt) : null;

        const timerSelect = document.getElementById('disappearing-timer-select');
        let studentPersonalDays = 30;
        if (timerSelect && timerSelect.value !== 'off') studentPersonalDays = parseInt(timerSelect.value);

        const personalCutoffDate = new Date();
        personalCutoffDate.setDate(personalCutoffDate.getDate() - studentPersonalDays);
        const absoluteMaxDate = new Date();
        absoluteMaxDate.setDate(absoluteMaxDate.getDate() - 30);

        snapshot.forEach(docSnap => {
            let msgData = docSnap.data();
            msgData.msgId = docSnap.id;
            const msgTime = new Date(msgData.timestamp);
            if (msgTime < absoluteMaxDate || msgTime < personalCutoffDate || (studentClearedTime && msgTime <= studentClearedTime)) return;
            msgs.push(msgData);
        });

        msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const bannerHtml = `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px 14px; border-radius: 12px; font-size: 0.82rem; color: var(--text-color); line-height: 1.5; margin-bottom: 15px;">
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.9rem;">
                    ${svgs.info} Virtual Room Guidelines
                </div>
                <div><b>English:</b><br>1. Be respectful while chatting.<br><b style="color:#ef4444;">2. Do not share nudity or explicit content.</b><br><b style="color:#a855f7;">3. Please upload media with smaller file sizes.</b></div>
            </div>
        `;

        if (msgs.length === 0) {
            chatMessagesContainer.innerHTML = `${bannerHtml}<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: auto; margin-bottom: auto;">No messages yet. Say hi! 👋</div>`;
            return;
        }

        let html = bannerHtml;
        msgs.forEach(msg => {
            const isMe = msg.senderId === currentUser.uid;
            let contentHtml = "";

            if (msg.type === 'image') contentHtml = `<img src="${msg.fileUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 5px; cursor: pointer;" onclick="window.open('${msg.fileUrl}', '_blank')">`;
            else if (msg.type === 'document') contentHtml = `<a href="${msg.fileUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;" class="flex-align">${svgs.doc} ${msg.fileName || 'Download'}</a>`;
            else if (msg.type === 'audio') contentHtml = `<audio controls style="height: 35px; max-width: 200px; margin-top: 5px;"><source src="${msg.fileUrl}" type="audio/webm"></audio>`;
            else contentHtml = `${msg.text.replace(/\n/g, '<br>')}`;

            let replyBlockHtml = msg.replyTo ? `<div class="reply-block"><strong style="color: #a855f7;">${msg.replyTo.senderName}</strong><br>${msg.replyTo.text}</div>` : '';
            let actionsHtml = `<div class="msg-actions"><button class="reply-btn" onclick="setReplyMessage('${msg.senderName}', '${encodeURIComponent(msg.type === 'text' ? msg.text : 'Media')}')" title="Reply">${svgs.reply}</button>${isMe && msg.type === 'text' ? `<button class="edit-btn" onclick="setEditMessage('${msg.msgId}', '${encodeURIComponent(msg.text)}')" title="Edit">${svgs.edit}</button>` : ''}</div>`;
            let checkboxHtml = isMe ? `<input type="checkbox" class="chat-checkbox" onchange="toggleMessageSelection('${msg.msgId}', this)">` : '';

            html += `
                <div class="msg-row ${isMe ? 'me' : 'other'} ${selectedMessagesToDelete.size > 0 && isMe ? 'multi-select-mode' : ''}"
                     onmousedown="startLongPress('${msg.msgId}', ${isMe})" onmouseup="cancelLongPress()" onmouseleave="cancelLongPress()" ontouchstart="startLongPress('${msg.msgId}', ${isMe})" ontouchend="cancelLongPress()">
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

// AI Agent Sidebar Toggle & Auth State Handler
const aiToggleBtn = document.getElementById('ai-toggle-btn');
const aiAgentSidebar = document.getElementById('ai-agent-sidebar');

if (aiToggleBtn && aiAgentSidebar) {
    aiToggleBtn.addEventListener('click', () => {
        aiAgentSidebar.classList.toggle('collapsed');
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        updateDynamicGreeting(getStudentFirstName());
        if (loginSection) loginSection.style.display = "none";
        if (appSection) appSection.style.display = "block";
        showView('hub');
        await loadSubjectsFromDB(); 
    } else {
        currentUser = null;
        if (loginSection) loginSection.style.display = "block";
        if (appSection) appSection.style.display = "none";
    }
});

const performLogout = () => { 
    signOut(auth).then(() => { 
        allSubjects = []; 
        currentStudentFaculty = null;
        if (loginSection) loginSection.style.display = "block";
        if (appSection) appSection.style.display = "none";
        showView('hub'); 
    }).catch((error) => {
        alert("Logout Failed: " + error.message);
    }); 
};

if (logoutBtn) logoutBtn.addEventListener('click', performLogout);
if (mainLogoutBtn) mainLogoutBtn.addEventListener('click', performLogout);

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
    } catch (e) {}
}

function updateUI() {}
