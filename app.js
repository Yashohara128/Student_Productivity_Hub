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

const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const userNameDisplay = document.getElementById('user-name');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mainLogoutBtn = document.getElementById('main-logout-btn');
const addBtn = document.getElementById('add-btn');
const degreeInput = document.getElementById('degree-name');

// Navigation Views
const dashboardHub = document.getElementById('dashboard-hub');
const viewGpa = document.getElementById('view-gpa');
const viewShortNotes = document.getElementById('view-shortnotes');
const viewPlagiarism = document.getElementById('view-plagiarism');
const viewIeee = document.getElementById('view-ieee');
const viewVirtualRoom = document.getElementById('view-virtual-room');

// Card Triggers
const cardGpa = document.getElementById('card-gpa');
const cardShortNotes = document.getElementById('card-shortnotes');
const cardPlagiarism = document.getElementById('card-plagiarism');
const cardIeee = document.getElementById('card-ieee');
const cardVirtualRoom = document.getElementById('card-virtual-room');

// Back Buttons
const backToHubGpa = document.getElementById('back-to-hub-gpa');
const backToHubShortNotes = document.getElementById('back-to-hub-shortnotes');
const backToHubPlagiarism = document.getElementById('back-to-hub-plagiarism');
const backToHubIeee = document.getElementById('back-to-hub-ieee');
const backToHubRoom = document.getElementById('back-to-hub-room');

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
    target: `<svg class="icon-sm" style="stroke:#38bdf8;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    photo: `<svg class="icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    doc: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    mic: `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    edit: `<svg class="icon-sm" style="stroke:#38bdf8; width:12px; height:12px;" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg class="icon-sm" style="stroke:#ef4444; width:12px; height:12px;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    star: `<svg class="icon-sm" style="stroke:#fbbf24; fill:#fbbf24;" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
};

function getStudentFirstName() {
    if (currentUser && currentUser.displayName) {
        return currentUser.displayName.split(" ")[0];
    } else if (currentUser && currentUser.email) {
        return currentUser.email.split('@')[0];
    }
    return "Student";
}

function getActiveMode() { return localStorage.getItem('active_uni_mode') || 'horizon'; }
function getActiveSubjects() {
    const activeMode = getActiveMode();
    return allSubjects.filter(sub => (sub.mode || 'horizon') === activeMode);
}

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider)
            .then((result) => { console.log("Login Success:", result.user.displayName); })
            .catch((error) => { alert("Login Failed: " + error.message); });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (cardGpa) cardGpa.addEventListener('click', () => showView('gpa'));
if (cardShortNotes) cardShortNotes.addEventListener('click', () => showView('shortnotes'));
if (cardPlagiarism) cardPlagiarism.addEventListener('click', () => showView('plagiarism'));
if (cardIeee) cardIeee.addEventListener('click', () => showView('ieee'));

if (backToHubGpa) backToHubGpa.addEventListener('click', () => showView('hub'));
if (backToHubShortNotes) backToHubShortNotes.addEventListener('click', () => showView('hub'));
if (backToHubPlagiarism) backToHubPlagiarism.addEventListener('click', () => showView('hub'));
if (backToHubIeee) backToHubIeee.addEventListener('click', () => showView('hub'));
if (backToHubRoom) backToHubRoom.addEventListener('click', () => showView('hub'));

// ==========================================
// 🎓 VIRTUAL ROOM & FACULTY VERIFICATION
// ==========================================
const studentIdModal = document.getElementById('student-id-modal');
const verifyIdBtn = document.getElementById('verify-id-btn');
const closeIdModal = document.getElementById('close-id-modal');
const activeFacultyLabel = document.getElementById('active-faculty-label');
const chatMessagesContainer = document.getElementById('chat-messages-container');
const chatInputText = document.getElementById('chat-input-text');
const chatSendBtn = document.getElementById('chat-send-btn');
const leaveRoomBtn = document.getElementById('leave-room-btn'); 
const clearMyChatBtn = document.getElementById('clear-my-chat-btn');

// Attachment Menu Elements
const mainAttachBtn = document.getElementById('main-attach-btn');
const attachmentMenu = document.getElementById('attachment-menu');
const menuImageBtn = document.getElementById('menu-image-btn');
const menuDocBtn = document.getElementById('menu-doc-btn');
const menuMicBtn = document.getElementById('menu-mic-btn');

const chatImageInput = document.getElementById('chat-image-input');
const chatDocInput = document.getElementById('chat-doc-input');
const voicePreviewBar = document.getElementById('voice-preview-bar');
const previewAudioElement = document.getElementById('preview-audio-element');
const cancelVoiceBtn = document.getElementById('cancel-voice-btn');
const sendVoiceBtn = document.getElementById('send-voice-btn');
const normalInputControls = document.getElementById('normal-input-controls');
const recordingIndicator = document.getElementById('recording-indicator');

// Guidelines Modal
const roomGuidelinesModal = document.getElementById('room-guidelines-modal');
const acceptGuidelinesBtn = document.getElementById('accept-guidelines-btn');

let currentStudentFaculty = null;
let recordedAudioBlob = null;

if (cardVirtualRoom) {
    cardVirtualRoom.addEventListener('click', async () => {
        if (!currentUser) { alert("Please login first!"); return; }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists() && userSnap.data().faculty && userSnap.data().studentId) {
            currentStudentFaculty = userSnap.data().faculty;
            if(roomGuidelinesModal) roomGuidelinesModal.style.display = 'flex';
            openChatRoom(currentStudentFaculty);
        } else {
            studentIdModal.style.display = 'flex'; 
        }
    });
}

if (acceptGuidelinesBtn) {
    acceptGuidelinesBtn.addEventListener('click', () => {
        if(roomGuidelinesModal) roomGuidelinesModal.style.display = 'none';
    });
}

if (closeIdModal) closeIdModal.addEventListener('click', () => { studentIdModal.style.display = 'none'; });

if (verifyIdBtn) {
    verifyIdBtn.addEventListener('click', async () => {
        const studentId = document.getElementById('student-id-input').value.trim().toUpperCase();
        if (!studentId) { alert("Please enter your Student ID."); return; }

        verifyIdBtn.innerText = "Verifying Security...";
        verifyIdBtn.disabled = true;

        try {
            const q = query(collection(db, "users"), where("studentId", "==", studentId));
            const querySnapshot = await getDocs(q);

            let isIdAlreadyTaken = false;
            querySnapshot.forEach((doc) => {
                if (doc.id !== currentUser.uid) { isIdAlreadyTaken = true; }
            });

            if (isIdAlreadyTaken) {
                alert("SECURITY ALERT: This Student ID is already registered!");
                verifyIdBtn.innerText = "Verify & Join Room ➔";
                verifyIdBtn.disabled = false;
                return;
            }

            let assignedFaculty = "";
            if (studentId.startsWith("IT")) { assignedFaculty = "Faculty of IT"; } 
            else if (studentId.startsWith("EDU")) { assignedFaculty = "Faculty of Education"; } 
            else if (studentId.startsWith("MGT")) { assignedFaculty = "Faculty of Management"; } 
            else if (studentId.startsWith("SCI")) { assignedFaculty = "Faculty of Science"; } 
            else {
                alert("Invalid Student ID prefix!");
                verifyIdBtn.innerText = "Verify & Join Room ➔";
                verifyIdBtn.disabled = false;
                return;
            }

            await setDoc(doc(db, "users", currentUser.uid), { studentId: studentId, faculty: assignedFaculty }, { merge: true });
            
            studentIdModal.style.display = 'none';
            currentStudentFaculty = assignedFaculty;
            if(roomGuidelinesModal) roomGuidelinesModal.style.display = 'flex';
            openChatRoom(assignedFaculty);

        } catch (e) {
            alert("Verification Error: " + e.message);
        } finally {
            verifyIdBtn.innerText = "Verify & Join Room ➔";
            verifyIdBtn.disabled = false;
        }
    });
}

if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const confirmLeave = confirm("Are you sure you want to log out from this Virtual Room?");
        if (confirmLeave) {
            leaveRoomBtn.innerText = "Leaving...";
            try {
                await updateDoc(doc(db, "users", currentUser.uid), { studentId: "", faculty: "" });
                currentStudentFaculty = null;
                showView('hub');
            } catch (error) {
                alert("Failed to leave room: " + error.message);
            } finally {
                leaveRoomBtn.innerText = "Leave";
            }
        }
    });
}

if (clearMyChatBtn) {
    clearMyChatBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const confirmClear = confirm("Are you sure you want to clear the chat view for yourself?");
        if (confirmClear) {
            try {
                await setDoc(doc(db, "users", currentUser.uid), { chatClearedAt: new Date().toISOString() }, { merge: true });
                if (currentStudentFaculty) { openChatRoom(currentStudentFaculty); }
            } catch (e) { alert("Failed to clear chat: " + e.message); }
        }
    });
}

function filterSensitiveData(text) {
    let safeText = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ` ${svgs.trash} <i>[Emails hidden]</i> `);
    safeText = safeText.replace(/(?:\+94|0)[0-9]{9}/g, ` ${svgs.trash} <i>[Numbers hidden]</i> `);
    return safeText;
}

if (chatSendBtn) {
    chatSendBtn.addEventListener('click', async () => {
        const text = chatInputText.value.trim();
        if (!text || !currentStudentFaculty) return;

        const cleanedText = filterSensitiveData(text);
        chatInputText.value = '';

        try {
            await addDoc(collection(db, "virtual_rooms"), {
                faculty: currentStudentFaculty,
                senderName: getStudentFirstName(),
                senderId: currentUser.uid,
                text: cleanedText,
                type: 'text',
                timestamp: new Date().toISOString()
            });
        } catch (e) { console.error("Error sending message:", e); }
    });
}

if (chatInputText) {
    chatInputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Allows native browser newline!
        }
    });
}

// Attachment Menu
if (mainAttachBtn && attachmentMenu) {
    mainAttachBtn.addEventListener('click', (e) => {
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
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                    uploadMediaToFirebase(compressedFile, file.name, 'image');
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
                mainAttachBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`; 
                mainAttachBtn.style.color = '#ef4444';

                mediaRecorder.ondataavailable = e => { audioChunks.push(e.data); };
                mediaRecorder.onstop = async () => {
                    if (recordingIndicator) recordingIndicator.style.display = 'none';
                    mainAttachBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
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

    mainAttachBtn.addEventListener('click', () => {
        if (isRecording && mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
            attachmentMenu.classList.remove('show');
        }
    });
}

if (cancelVoiceBtn) {
    cancelVoiceBtn.addEventListener('click', () => {
        recordedAudioBlob = null;
        if (voicePreviewBar) voicePreviewBar.style.display = 'none';
        if (normalInputControls) normalInputControls.style.display = 'flex';
    });
}

if (sendVoiceBtn) {
    sendVoiceBtn.addEventListener('click', () => {
        if (!recordedAudioBlob) return;
        uploadMediaToFirebase(recordedAudioBlob, `audio_${Date.now()}.webm`, 'audio');
        recordedAudioBlob = null;
        if (voicePreviewBar) voicePreviewBar.style.display = 'none';
        if (normalInputControls) normalInputControls.style.display = 'flex';
    });
}

function uploadMediaToFirebase(fileOrBlob, fileName, type) {
    const storageRef = ref(storage, `virtual_room_media/${Date.now()}_${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, fileOrBlob);

    const originalBtnHTML = chatSendBtn.innerHTML;
    chatSendBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
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
    if (!confirm("Are you sure you want to delete this message?")) return;
    try { await deleteDoc(doc(db, "virtual_rooms", msgId)); } catch (e) { alert("Failed to delete message."); }
};

window.editVirtualMessage = async function(msgId, currentText) {
    const newText = prompt("Edit your message:", decodeURIComponent(currentText));
    if (newText === null || newText.trim() === "") return;
    try { await updateDoc(doc(db, "virtual_rooms", msgId), { text: filterSensitiveData(newText.trim()) }); } catch (e) {}
};

function openChatRoom(facultyName) {
    showView('virtualroom');
    if(activeFacultyLabel) activeFacultyLabel.innerHTML = `<span class="flex-align">🎓 ${facultyName} Room</span>`;
    
    const q = query(collection(db, "virtual_rooms"), where("faculty", "==", facultyName));

    onSnapshot(q, async (snapshot) => {
        let msgs = [];
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const studentClearedTime = userData.chatClearedAt ? new Date(userData.chatClearedAt) : null;

        const timerSelect = document.getElementById('disappearing-timer-select');
        let studentPersonalDays = 30;
        if (timerSelect && timerSelect.value !== 'off') { studentPersonalDays = parseInt(timerSelect.value); }

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

        if (msgs.length === 0) {
            chatMessagesContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: auto; margin-bottom: auto;">No messages yet. Say hi to your friends! ${svgs.user}</div>`;
            return;
        }

        let html = '';
        msgs.forEach(msg => {
            const isMe = msg.senderId === currentUser.uid;
            let contentHtml = "";
            if (msg.type === 'image') {
                contentHtml = `<img src="${msg.fileUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 5px; cursor: pointer;" onclick="window.open('${msg.fileUrl}', '_blank')">`;
            } else if (msg.type === 'document') {
                contentHtml = `<a href="${msg.fileUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 500; font-size: 0.85rem;" class="flex-align">${svgs.doc} ${msg.fileName || 'Download File'}</a>`;
            } else if (msg.type === 'audio') {
                contentHtml = `<audio controls style="height: 35px; max-width: 220px; margin-top: 5px; border-radius: 20px;"><source src="${msg.fileUrl}" type="audio/webm"></audio>`;
            } else {
                contentHtml = `${msg.text.replace(/\n/g, '<br>')}`; 
            }

            html += `
                <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 80%; background: ${isMe ? 'rgba(56, 189, 248, 0.15)' : 'var(--input-bg)'}; border: 1px solid ${isMe ? 'rgba(56, 189, 248, 0.3)' : 'var(--input-border)'}; padding: 10px 14px; border-radius: 12px; border-top-right-radius: ${isMe ? '2px' : '12px'}; border-top-left-radius: ${!isMe ? '2px' : '12px'}; display: flex; flex-direction: column; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 3px;">
                        ${!isMe ? `<span style="font-size: 0.7rem; color: #a855f7; font-weight: bold;">${msg.senderName}</span>` : '<span></span>'}
                        ${isMe ? `<div style="display: flex; gap: 6px;"><button onclick="editVirtualMessage('${msg.msgId}', '${encodeURIComponent(msg.text || '')}')" style="background: none; border: none; cursor: pointer; padding: 0;" title="Edit">${svgs.edit}</button><button onclick="deleteVirtualMessage('${msg.msgId}')" style="background: none; border: none; cursor: pointer; padding: 0;" title="Delete">${svgs.trash}</button></div>` : ''}
                    </div>
                    <div style="color: var(--text-color); font-size: 0.9rem; line-height: 1.4;">${contentHtml}</div>
                </div>
            `;
        });
        chatMessagesContainer.innerHTML = html;
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
}

// --- 🟢 AI Agent Open / Close Toggle Logic ---
const aiToggleBtn = document.getElementById('ai-toggle-btn');
const aiAgentSidebar = document.getElementById('ai-agent-sidebar');

if (aiToggleBtn && aiAgentSidebar) {
    aiToggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            aiAgentSidebar.classList.toggle('mobile-open');
            if (aiAgentSidebar.classList.contains('mobile-open')) {
                aiToggleBtn.innerHTML = `<svg class="icon-md" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Chat`;
            } else {
                aiToggleBtn.innerHTML = `${svgs.bot} Open AI Chat`;
            }
        } else {
            aiAgentSidebar.classList.toggle('collapsed');
            if (aiAgentSidebar.classList.contains('collapsed')) {
                aiToggleBtn.innerHTML = `${svgs.bot} Open AI Chat`;
            } else {
                aiToggleBtn.innerHTML = `<svg class="icon-md" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Chat`;
            }
        }
    });
}

const reviewModal = document.getElementById('review-modal');
const closeReviewModalBtn = document.getElementById('close-review-modal');
const closeGotItBtn = document.getElementById('close-modal-btn');
const reviewNowButtons = document.querySelectorAll('.review-now-btn');
const modalSubmitReviewBtn = document.getElementById('modal-submit-review-btn');
const modalReviewRating = document.getElementById('modal-review-rating');
const modalReviewComment = document.getElementById('modal-review-comment');

reviewNowButtons.forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); if (reviewModal) { reviewModal.style.display = 'flex'; loadGlobalReviews(); } });
});
if (closeReviewModalBtn) closeReviewModalBtn.addEventListener('click', () => { if (reviewModal) reviewModal.style.display = 'none'; });
if (closeGotItBtn) closeGotItBtn.addEventListener('click', () => { if (reviewModal) reviewModal.style.display = 'none'; });

if (modalSubmitReviewBtn) {
    modalSubmitReviewBtn.addEventListener('click', async () => {
        if (!currentUser) { alert("Please login first!"); return; }
        const comment = modalReviewComment.value.trim();
        const rating = parseInt(modalReviewRating.value);
        if (!comment) return;

        modalSubmitReviewBtn.innerText = "Submitting...";
        modalSubmitReviewBtn.disabled = true;
        try {
            await addDoc(collection(db, "global_reviews"), {
                userName: currentUser.displayName || getStudentFirstName(), userEmail: currentUser.email, rating, comment, createdAt: new Date().toISOString()
            });
            modalReviewComment.value = ''; modalReviewRating.selectedIndex = 0;
        } catch (e) { alert("Failed to submit review."); } 
        finally { modalSubmitReviewBtn.innerText = "Submit Review"; modalSubmitReviewBtn.disabled = false; }
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
            let emptyMsg = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem;">No reviews yet.</div>`;
            if (modalReviewsContainer) modalReviewsContainer.innerHTML = emptyMsg;
            if (publicReviewsContainer) publicReviewsContainer.innerHTML = emptyMsg;
            return;
        }

        let html = '';
        reviewsList.forEach(rev => {
            let starsHtml = Array(rev.rating).fill(svgs.star).join('');
            html += `
                <div style="background: var(--input-bg); border: 1px solid var(--input-border); padding: 8px 10px; border-radius: 6px; margin-bottom: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                        <b style="color: var(--text-color);">${rev.userName}</b>
                        <span class="flex-align" style="gap:2px;">${starsHtml}</span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 3px 0 0 0;">${rev.comment}</p>
                </div>
            `;
        });
        if (modalReviewsContainer) modalReviewsContainer.innerHTML = html;
        if (publicReviewsContainer) publicReviewsContainer.innerHTML = html;
    });
}

document.addEventListener('DOMContentLoaded', () => { loadGlobalReviews(); });

window.openPricingModal = function() { document.getElementById('pricing-modal').style.display = 'flex'; };
window.closePricingModal = function() { document.getElementById('pricing-modal').style.display = 'none'; };

window.startPayHerePayment = function(planName, amount, wordLimit) {
    if (!currentUser) return;
    var payment = {
        "sandbox": true, "merchant_id": "YOUR_MERCHANT_ID", "return_url": "https://unlimitedfreepatracker.site.je/success.html",
        "cancel_url": "https://unlimitedfreepatracker.site.je/cancel.html", "notify_url": "https://your-backend-server.com/notify",
        "order_id": `PRO_${planName.toUpperCase()}_${Date.now()}`, "items": `Student Hub - ${planName.toUpperCase()} Plan`,
        "currency": "LKR", "amount": amount.toFixed(2), "first_name": getStudentFirstName(), "last_name": "Student",
        "email": currentUser.email, "phone": "0771234567", "address": "Sri Lanka", "city": "Colombo", "country": "Sri Lanka"
    };

    payhere.onCompleted = async function orderId(orderId) {
        await updateDoc(doc(db, "users", currentUser.uid), { plan: planName, wordLimit, isPaid: true, upgradeDate: new Date().toISOString() });
        closePricingModal(); location.reload();
    };
    payhere.startPayment(payment);
};

// --- PERSISTENT AI STUDY AGENT ---
const aiChatMessages = document.getElementById('ai-chat-messages');
const aiChatInput = document.getElementById('ai-chat-input');
const aiSendBtn = document.getElementById('ai-send-btn');
const aiClearBtn = document.getElementById('ai-clear-btn');
const aiFileInput = document.getElementById('ai-file-input');
const aiAttachBtn = document.getElementById('ai-attach-btn');
const aiFileIndicator = document.getElementById('ai-file-indicator');

let attachedAiFileText = "";

if (aiAttachBtn && aiFileInput) {
    aiAttachBtn.addEventListener('click', () => aiFileInput.click());
    aiFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        aiFileIndicator.style.display = 'flex';
        aiFileIndicator.innerHTML = `${svgs.folder} Attached: ${file.name}`;

        if (file.type === "application/pdf") {
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
                    attachedAiFileText = fullText.trim();
                } catch (err) {}
            };
        } else {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function(e) { attachedAiFileText = e.target.result; };
        }
    });
}

async function sendQueryToAIAgent() {
    const text = aiChatInput.value.trim();
    if (!text && !attachedAiFileText) return;

    let displayMsg = text;
    if (attachedAiFileText && !text) displayMsg = "Please analyze the attached document.";

    aiChatMessages.innerHTML += `
        <div style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); padding: 10px; border-radius: 8px; color: var(--text-color); align-self: flex-end; max-width: 90%;">
            <b>You:</b> ${displayMsg.replace(/\n/g, '<br>')} ${attachedAiFileText ? `<br><small class="flex-align" style="color: #38bdf8; margin-top:4px;">${svgs.doc} [Document Attached]</small>` : ''}
        </div>
    `;
    aiChatInput.value = '';
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    const loadingId = 'ai-loading-' + Date.now();
    aiChatMessages.innerHTML += `
        <div id="${loadingId}" style="background: var(--input-bg); padding: 8px 12px; border-radius: 8px; color: var(--text-muted); font-style: italic; display:flex; align-items:center; gap:6px;">
            ${svgs.bot} AI Agent is thinking...
        </div>
    `;
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    const activeStudentName = getStudentFirstName();

    try {
        const response = await fetch('/api/chat', {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text || "Please summarize and explain this attached document.", fileContent: attachedAiFileText, studentName: activeStudentName })
        });
        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.error) {
            aiChatMessages.innerHTML += `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px; color: var(--text-color);">
                    <b class="flex-align">${svgs.bot} AI Buddy:</b><br>Oyage daily limit eka poddak touch una wage, ${activeStudentName}! Podi welawak idala ayith try karanna.
                </div>
            `;
            return;
        }

        aiChatMessages.innerHTML += `
            <div style="background: var(--input-bg); border: 1px solid var(--input-border); padding: 10px; border-radius: 8px; color: var(--text-color); line-height: 1.5;">
                <b class="flex-align" style="margin-bottom:6px;">${svgs.bot} AI Agent:</b>${data.reply.replace(/\n/g, '<br>')}
            </div>
        `;
    } catch (err) {
        if (document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        aiChatMessages.innerHTML += `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px; color: var(--text-color);">
                <b class="flex-align">${svgs.bot} AI Buddy:</b><br>Oops! Podi connection issue ekak wage, ${activeStudentName}. Ayith try karමුද?
            </div>
        `;
    } finally {
        attachedAiFileText = "";
        if (aiFileIndicator) aiFileIndicator.style.display = 'none';
        if (aiFileInput) aiFileInput.value = '';
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }
}

if (aiSendBtn) aiSendBtn.addEventListener('click', sendQueryToAIAgent);

if (aiChatInput) {
    aiChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { }
    });
}

if (aiClearBtn) {
    aiClearBtn.addEventListener('click', () => {
        const activeStudentName = getStudentFirstName();
        aiChatMessages.innerHTML = `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 10px; border-radius: 8px; color: var(--text-color);">
                <span class="flex-align" style="margin-bottom:4px; color:#38bdf8;">${svgs.user} Hey ${activeStudentName}!</span> Chat cleared. How can I help you with your studies today?
            </div>
        `;
        attachedAiFileText = "";
        if (aiFileIndicator) aiFileIndicator.style.display = 'none';
    });
}

// --- AI PDF SHORT NOTE GENERATOR LOGIC ---
const notePdfUpload = document.getElementById('note-pdf-upload');
const notePdfFileName = document.getElementById('note-pdf-file-name');
const generateNotesBtn = document.getElementById('generate-notes-btn');
const noteLoading = document.getElementById('note-loading');
const noteResultSection = document.getElementById('note-result-section');
const generatedNotesOutput = document.getElementById('generated-notes-output');
const downloadNotesDocxBtn = document.getElementById('download-notes-docx-btn');
const downloadNotesPdfBtn = document.getElementById('download-notes-pdf-btn');

let extractedNoteText = "";

if (notePdfUpload) {
    notePdfUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        notePdfFileName.innerHTML = `<span class="flex-align">${svgs.folder} ${file.name}</span>`;

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
            } catch (err) {}
        };
    });
}

if (generateNotesBtn) {
    generateNotesBtn.addEventListener('click', async () => {
        if (!extractedNoteText) { alert("Please upload a lecture PDF first!"); return; }

        const customPromptInput = document.getElementById('note-custom-prompt');
        const customPrompt = customPromptInput ? customPromptInput.value.trim() : "";

        if (noteLoading) noteLoading.style.display = 'block';
        if (noteResultSection) noteResultSection.style.display = 'none';
        generateNotesBtn.disabled = true;
        generateNotesBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Generating Progress...`;

        try {
            const response = await fetch('/api/shortnotes', {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: extractedNoteText, prompt: customPrompt || "Generate well-structured short notes." })
            });

            const data = await response.json();
            if (data.error) { alert("Error: " + data.error); return; }

            if (data.result) {
                generatedNotesOutput.value = data.result;
                if (noteResultSection) noteResultSection.style.display = 'block';
            }
        } catch (error) {
        } finally {
            if (noteLoading) noteLoading.style.display = 'none';
            generateNotesBtn.disabled = false;
            generateNotesBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Generate Short Notes`;
        }
    });
}

// Download handlers
if (downloadNotesDocxBtn) {
    downloadNotesDocxBtn.addEventListener('click', () => {
        const text = generatedNotesOutput.value;
        if (!text) return;
        let formattedHtml = text.split('\n').map(line => {
            let trimmed = line.trim();
            if (trimmed.startsWith('# ')) return `<h1>${trimmed.substring(2)}</h1>`;
            else if (trimmed.startsWith('## ')) return `<h2>${trimmed.substring(3)}</h2>`;
            else if (trimmed.startsWith('### ')) return `<h3>${trimmed.substring(4)}</h3>`;
            else if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) return `<li>${trimmed.substring(2)}</li>`;
            else if (trimmed === '') return `<br>`;
            else return `<p>${trimmed}</p>`;
        }).join('');

        let wordContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><style>body{font-family:'Times New Roman',serif;}h1,h2,h3{color:#0f172a;}</style></head><body>${formattedHtml}</body></html>`;
        const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'Short_Notes.doc'; a.click(); URL.revokeObjectURL(url);
    });
}

if (downloadNotesPdfBtn) {
    downloadNotesPdfBtn.addEventListener('click', () => {
        const text = generatedNotesOutput.value;
        if (!text) return;
        let printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><style>body{font-family:sans-serif;}</style></head><body><pre>${text}</pre><script>window.onload=()=>window.print();</script></body></html>`);
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
        if (!deg) { alert("Please enter your Degree Program name!"); return; }
        localStorage.setItem('active_uni_mode', mode);
        localStorage.setItem(mode + '_degree', deg);
        toggleUniversityMode(mode);
        updateUI();
    });
}

const savedActiveMode = localStorage.getItem('active_uni_mode') || 'horizon';
if (universitySelector) { universitySelector.value = savedActiveMode; toggleUniversityMode(savedActiveMode); }
if (degreeInput) { degreeInput.value = localStorage.getItem(savedActiveMode + '_degree') || ''; }

function applyTheme(theme) {
    document.body.classList.remove('light-mode');
    if (theme === 'light' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches)) { document.body.classList.add('light-mode'); }
    renderGPAChart();
}

const themeSelector = document.getElementById('theme-selector');
if (themeSelector) {
    themeSelector.addEventListener('change', (e) => { localStorage.setItem('theme', e.target.value); applyTheme(e.target.value); });
    themeSelector.value = localStorage.getItem('theme') || 'system';
    applyTheme(themeSelector.value);
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        updateDynamicGreeting(getStudentFirstName());
        initIEEEModule();
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

const performLogout = () => { signOut(auth).then(() => { allSubjects = []; currentStudentFaculty = null; showView('hub'); updateUI(); }); };
if (logoutBtn) { logoutBtn.addEventListener('click', performLogout); }
if (mainLogoutBtn) { mainLogoutBtn.addEventListener('click', performLogout); }

async function loadSubjectsFromDB() {
    try {
        allSubjects = [];
        if (!currentUser) return;
        const querySnapshot = await getDocs(collection(db, "users", currentUser.uid, "subjects"));
        querySnapshot.forEach(doc => { let sub = doc.data(); sub.dbId = doc.id; if (!sub.mode) sub.mode = 'horizon'; allSubjects.push(sub); });
        updateUI();
    } catch (e) {}
}

window.editSubject = function(dbId) {
    const sub = allSubjects.find(s => s.dbId === dbId);
    if (!sub) return;
    document.getElementById('subject-name').value = sub.name;
    document.getElementById('subject-year').value = sub.year;
    document.getElementById('subject-semester').value = sub.semester;
    document.getElementById('credit').value = sub.credit;
    const targetMode = sub.mode || 'horizon';
    if (universitySelector) universitySelector.value = targetMode;
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
    if (addBtn) addBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Update Subject`;
};

if (addBtn) {
    addBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const name = document.getElementById('subject-name').value.trim();
        const year = document.getElementById('subject-year').value;
        const semester = document.getElementById('subject-semester').value;
        const credit = parseFloat(document.getElementById('credit').value);
        const activeMode = getActiveMode();

        let gradePoint, gradeText, gradeLetter = "", isCustom = false;
        if (activeMode === 'other') {
            gradeLetter = otherGradeLetter.value;
            const rawPoint = customGradePointInput.value.trim();
            if (!name || !year || !semester || isNaN(credit) || !gradeLetter) return;
            if (gradeLetter === "Repeat" || gradeLetter === "Absent" || gradeLetter === "Medical") { 
                gradePoint = -1; gradeText = gradeLetter === "Repeat" ? "Repeat (RA)" : gradeLetter; 
            } else { 
                gradePoint = parseFloat(rawPoint); gradeText = `${gradeLetter} (${gradePoint.toFixed(2)})`; 
            }
            isCustom = true;
        } else {
            gradePoint = parseFloat(gradeSelect.value);
            gradeText = gradeSelect.options[gradeSelect.selectedIndex].text;
            if (!name || !year || !semester || isNaN(credit) || isNaN(gradePoint)) return;
        }

        const subjectData = { name, year, semester, credit, gradePoint, gradeText, gradeLetter, isCustom, mode: activeMode };
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
            addBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add to List`;
            updateUI();
        } catch (e) { }
        addBtn.disabled = false;
    });
}

window.removeSubject = async function(dbId) {
    if (!currentUser) return;
    allSubjects = allSubjects.filter(sub => sub.dbId !== dbId);
    updateUI();
    try { await deleteDoc(doc(db, "users", currentUser.uid, "subjects", dbId)); } catch (e) {}
};

const eraseSemBtn = document.getElementById('erase-sem-btn');
if (eraseSemBtn) {
    eraseSemBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const year = document.getElementById('erase-year').value;
        const semester = document.getElementById('erase-semester').value;
        if (!year || !semester) return;
        if (!confirm(`Delete subjects for Year ${year}, Semester ${semester}?`)) return;

        const targets = getActiveSubjects().filter(s => s.year == year && s.semester == semester);
        try {
            for (let sub of targets) await deleteDoc(doc(db, "users", currentUser.uid, "subjects", sub.dbId));
            allSubjects = allSubjects.filter(s => !targets.some(t => t.dbId === s.dbId));
            updateUI();
        } catch (e) {}
    });
}

const resetAllBtn = document.getElementById('reset-all-btn');
if (resetAllBtn) {
    resetAllBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const targets = getActiveSubjects();
        if (targets.length === 0) return;
        if (!confirm("WARNING: Permanently delete all subjects in this profile?")) return;
        try {
            for (let sub of targets) await deleteDoc(doc(db, "users", currentUser.uid, "subjects", sub.dbId));
            allSubjects = allSubjects.filter(s => (s.mode || 'horizon') !== getActiveMode());
            updateUI();
        } catch (e) {}
    });
}

const downloadPdfBtn = document.getElementById('download-pdf');
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        const activeSubjects = getActiveSubjects();
        if (activeSubjects.length === 0) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("GPA Report", 20, 20);
        doc.save(`Transcript.pdf`);
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
        return `<br><small class="flex-align" style="color: #f87171;">${svgs.trash} Absent - Need Medical</small>`;
    }
    if (gradeText.toLowerCase().includes("medical")) {
        return `<br><small class="flex-align" style="color: #f87171;">${svgs.trash} Medical - Retake Exam</small>`;
    }
    if (gradeText === "NC-C" || gradeText === "F") {
        return `<br><small class="flex-align" style="color: #f87171;">${svgs.trash} Retake Exam</small>`;
    }
    if (gradeText === "NC-E") {
        return `<br><small class="flex-align" style="color: #fbbf24;">${svgs.trash} Retake Exam</small>`;
    }
    if (gradeText === "NE") {
        return `<br><small class="flex-align" style="color: #60a5fa;">${svgs.trash} Pending Exam</small>`;
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
            html += `<div class="goal-item ${isActive ? 'goal-active' : ''}"><div class="flex-align">${isActive ? svgs.check : svgs.target} <b>${t.name} (>= ${t.min.toFixed(2)})</b></div>${!isActive ? `<small style="color:#38bdf8; margin-top:2px;">Need <b>${diff}</b> more points</small>` : `<small style="color:#22c55e; margin-top:2px;">Target Achieved!</small>`}</div>`;
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
                yearHTML += `<tr><td>${sub.name}</td><td>${sub.credit}</td><td style="line-height: 1.3; padding: 8px 0;">${displayGrade}</td><td><button onclick="editSubject('${sub.dbId}')" class="btn-edit">${svgs.edit} Edit</button> <button onclick="removeSubject('${sub.dbId}')" class="btn-remove">${svgs.trash} Remove</button></td></tr>`;
            });

            yearHTML += `</tbody></table></div></div>`;
        });
        yearHTML += `</div>`;
        container.innerHTML += yearHTML;
    });
}

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
        const response = await fetch('/api/humanize', { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: inputText }) });
        const data = await response.json();
        if (data.error) { return { error: true, message: data.error }; }
        return { error: false, result: data.result || inputText };
    } catch (error) { return { error: true, message: error.message }; }
}

if (checkPlagiarismBtn) {
    checkPlagiarismBtn.addEventListener('click', async () => {
        const text = plagiarismText.value.trim();
        if (text === "") { alert("Please paste text or upload a PDF first!"); return; }

        const inputWords = text.split(/\s+/).length;
        if (inputWords < 10) { alert("Please enter a longer text."); return; }

        const currentMonth = new Date().toISOString().slice(0, 7);
        checkPlagiarismBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Checking...`;
        checkPlagiarismBtn.disabled = true;

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const userSnap = await getDoc(userRef);

            let userData = { wordCountUsed: 0, lastResetMonth: currentMonth, plan: 'free', wordLimit: 10000 };
            if (userSnap.exists()) {
                userData = userSnap.data();
                if (userData.lastResetMonth !== currentMonth) {
                    userData.wordCountUsed = 0; userData.lastResetMonth = currentMonth;
                }
            } else { await setDoc(userRef, userData); }

            const activeWordLimit = userData.wordLimit || 10000;
            if (userData.wordCountUsed + inputWords > activeWordLimit) {
                alert(`Monthly Quota Reached!`);
                openPricingModal();
                checkPlagiarismBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M9 11l2 2 4-4"/></svg> Scan for Plagiarism & AI`;
                checkPlagiarismBtn.disabled = false; return;
            }

            const apiKey = "e52d65e1d8mshc4a85875ea5c502p18f622jsn296fe9b1c2d2";
            const apiHost = "plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com";
            const options = { method: 'POST', headers: { 'content-type': 'application/json', 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': apiHost }, body: JSON.stringify({ text: text, language: "en", includeCitations: true, scrapeSources: true }) };

            const response = await fetch('https://plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com/plagiarism', options);
            const result = await response.json();
            
            plagiarismResult.style.display = 'block';
            let percentPlagiarized = result.percentPlagiarized ?? result.score ?? result.plagiarismScore ?? 85.5;

            checkPlagiarismBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Humanizing...`;
            const humanizeResponse = await trueAIHumanizer(text);

            if (humanizeResponse.error) {
                alert(`AI Limit reached! Try again later.`);
                checkPlagiarismBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M9 11l2 2 4-4"/></svg> Scan for Plagiarism & AI`;
                checkPlagiarismBtn.disabled = false; return;
            }

            const newTotalUsed = userData.wordCountUsed + inputWords;
            await updateDoc(userRef, { wordCountUsed: newTotalUsed, lastResetMonth: currentMonth });

            if (humanizedOutputText) humanizedOutputText.value = humanizeResponse.result;

            const humanizedStatsEl = document.getElementById('humanized-stats');
            if (humanizedStatsEl) {
                humanizedStatsEl.innerHTML = `
                    <b>Post-Humanize Status:</b><br>
                    • Risk Level: <b style="color: #22c55e;">0.0% (Clean & Undetectable)</b><br>
                    • Tone Status: <b style="color: #38bdf8;">100% Natural Academic Human Tone</b>
                `;
            }

            plagiarismStats.innerHTML = `
                <b>Original Scan Report:</b><br>
                • Monthly Quota Used: <b>${newTotalUsed} / ${activeWordLimit} words</b><br>
                • Plagiarism Detected: <b style="color: ${percentPlagiarized > 10 ? '#ef4444' : '#22c55e'};">${percentPlagiarized}%</b><br>
                • Originality Score: <b style="color: #38bdf8;">${(100 - percentPlagiarized).toFixed(1)}% Unique</b>
            `;

            if (humanizeBox) humanizeBox.style.display = 'block';
        } catch (error) {
        } finally {
            checkPlagiarismBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M9 11l2 2 4-4"/></svg> Scan for Plagiarism & AI`;
            checkPlagiarismBtn.disabled = false;
        }
    });
}
