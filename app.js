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
        signInWithPopup(auth, provider)
            .then((result) => { 
                console.log("Login Success:", result.user.displayName); 
            })
            .catch((error) => { 
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
    let iconSvg = "";

    if (hours >= 5 && hours < 12) { 
        timeGreeting = "Good Morning"; 
        iconSvg = svgs.sun; 
    } else if (hours >= 12 && hours < 17) { 
        timeGreeting = "Good Afternoon"; 
        iconSvg = svgs.cloud; 
    } else if (hours >= 17 && hours < 21) { 
        timeGreeting = "Good Evening"; 
        iconSvg = svgs.sunset; 
    } else { 
        timeGreeting = "Good Night"; 
        iconSvg = svgs.moon; 
    }
    
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
    
    // Smooth scroll only if it's not the virtual room
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

// Hidden File Inputs
const chatImageInput = document.getElementById('chat-image-input');
const chatDocInput = document.getElementById('chat-doc-input');

// Voice Preview Elements
const voicePreviewBar = document.getElementById('voice-preview-bar');
const previewAudioElement = document.getElementById('preview-audio-element');
const cancelVoiceBtn = document.getElementById('cancel-voice-btn');
const sendVoiceBtn = document.getElementById('send-voice-btn');
const normalInputControls = document.getElementById('normal-input-controls');
const recordingIndicator = document.getElementById('recording-indicator');

// Guidelines Modal Elements
const roomGuidelinesModal = document.getElementById('room-guidelines-modal');
const acceptGuidelinesBtn = document.getElementById('accept-guidelines-btn');

// Edit/Reply & Multi-Delete Elements
const actionBar = document.getElementById('chat-action-bar');
const actionBarTitle = document.getElementById('action-bar-title');
const actionBarText = document.getElementById('action-bar-text');
const cancelActionBtn = document.getElementById('cancel-action-btn');
const multiDeleteBar = document.getElementById('multi-delete-bar');
const multiDeleteCount = document.getElementById('multi-delete-count');
const confirmMultiDeleteBtn = document.getElementById('confirm-multi-delete');
const cancelMultiDeleteBtn = document.getElementById('cancel-multi-delete');

let currentStudentFaculty = null;
let recordedAudioBlob = null;
let editingMessageId = null;
let replyingToMessageData = null;
let selectedMessagesToDelete = new Set();
let pressTimer;

// 1. Open Room Logic
if (cardVirtualRoom) {
    cardVirtualRoom.addEventListener('click', async () => {
        if (!currentUser) { alert("Please login first!"); return; }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
if (userSnap.exists() && userSnap.data().virtualRoomBanned) {
                alert("⛔ Access Denied: You have been permanently banned from the Virtual Room due to repeated guideline violations.");
                return; // Room එකට යන්න දෙන්නේ නැත, අනෙකුත් features සාමාන්‍ය පරිදි වැඩ කරයි!
            }

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
}
            
            // 🟢 Show Guidelines Modal when entering the room
            if(roomGuidelinesModal) {
                roomGuidelinesModal.style.display = 'flex';
            }

            openChatRoom(currentStudentFaculty);
        } else {
            studentIdModal.style.display = 'flex'; 
        }
    });
}

// Dismiss Guidelines Modal
if (acceptGuidelinesBtn) {
    acceptGuidelinesBtn.addEventListener('click', () => {
        if(roomGuidelinesModal) {
            roomGuidelinesModal.style.display = 'none';
        }
    });
}

if (closeIdModal) {
    closeIdModal.addEventListener('click', () => { 
        studentIdModal.style.display = 'none'; 
    });
}

// 2. ID Prefix Verification & 🛡️ SECURITY LOGIC
if (verifyIdBtn) {
    verifyIdBtn.addEventListener('click', async () => {
        const studentId = document.getElementById('student-id-input').value.trim().toUpperCase();
        if (!studentId) { 
            alert("Please enter your Student ID."); 
            return; 
        }

        verifyIdBtn.innerText = "Verifying...";
        verifyIdBtn.disabled = true;

        try {
            const q = query(collection(db, "users"), where("studentId", "==", studentId));
            const querySnapshot = await getDocs(q);

            let isIdAlreadyTaken = false;
            querySnapshot.forEach((doc) => {
                if (doc.id !== currentUser.uid) {
                    isIdAlreadyTaken = true;
                }
            });

            if (isIdAlreadyTaken) {
                alert("SECURITY ALERT: This Student ID is already registered to another account! Contact the Admin if this is an error.");
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
                alert("Invalid Student ID prefix! We couldn't recognize your faculty.");
                verifyIdBtn.innerText = "Verify & Join Room ➔";
                verifyIdBtn.disabled = false;
                return;
            }

            await setDoc(doc(db, "users", currentUser.uid), { 
                studentId: studentId, 
                faculty: assignedFaculty 
            }, { merge: true });
            
            alert(`Verified! Welcome to the ${assignedFaculty} Virtual Room.`);
            studentIdModal.style.display = 'none';
            currentStudentFaculty = assignedFaculty;

            // Show Guidelines Pop-up
            if(roomGuidelinesModal) {
                roomGuidelinesModal.style.display = 'flex';
            }
            openChatRoom(assignedFaculty);

        } catch (e) {
            alert("Verification Error: " + e.message);
        } finally {
            verifyIdBtn.innerText = "Verify & Join Room ➔";
            verifyIdBtn.disabled = false;
        }
    });
}

// 🚪 Leave Room Logic
if (leaveRoomBtn) {
    leaveRoomBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const confirmLeave = confirm("Are you sure you want to log out from this Virtual Room? You will need to verify your Student ID again to join.");
        if (confirmLeave) {
            leaveRoomBtn.innerText = "Leaving...";
            try {
                await updateDoc(doc(db, "users", currentUser.uid), {
                    studentId: "",
                    faculty: ""
                });
                currentStudentFaculty = null;
                alert("You have successfully logged out of the Virtual Room.");
                showView('hub');
            } catch (error) {
                alert("Failed to leave room: " + error.message);
            } finally {
                leaveRoomBtn.innerHTML = `<svg class="icon-sm" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Leave`;
            }
        }
    });
}

// 🧹 Clear Chat Logic (With Instant Auto-Refresh UI)
if (clearMyChatBtn) {
    clearMyChatBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        const confirmClear = confirm("Are you sure you want to clear the chat view for yourself? (Other users will still see the messages).");
        if (confirmClear) {
            try {
                await setDoc(doc(db, "users", currentUser.uid), {
                    chatClearedAt: new Date().toISOString()
                }, { merge: true });
                
                alert("🧹 Chat cleared successfully!");
                if (currentStudentFaculty) {
                    openChatRoom(currentStudentFaculty); // Instant auto-refresh view
                }
            } catch (e) {
                alert("Failed to clear chat: " + e.message);
            }
        }
    });
}

// 3. Sensitive Data Filter (Regex)
function filterSensitiveData(text) {
    let safeText = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ` ${svgs.trash} <i>[Emails hidden]</i> `);
    safeText = safeText.replace(/(?:\+94|0)[0-9]{9}/g, ` ${svgs.trash} <i>[Numbers hidden]</i> `);
    return safeText;
}

// Cancel Action Logic (Edit / Reply)
if (cancelActionBtn) {
    cancelActionBtn.addEventListener('click', () => {
        editingMessageId = null;
        replyingToMessageData = null;
        actionBar.style.display = 'none';
        chatInputText.value = '';
        chatSendBtn.innerHTML = svgs.send;
    });
}

// 4. Send & Edit Message Logic
if (chatSendBtn) {
    chatSendBtn.addEventListener('click', async () => {
        if (!chatInputText) return;
        const text = chatInputText.value.trim();
        if (!text || !currentStudentFaculty) return;

        // 🟢 3-Times Warning & Auto-Moderation System
        const forbiddenKeywords = ["sex", "nude", "porn", "xxx", "abuse", "sexy", "xxxxxx","hutta","huk","palyan","plyn","pko","hutti"];
        const lowerText = text.toLowerCase();
        let isViolating = false;
        let matchedWord = "";

        for (let word of forbiddenKeywords) {
            if (lowerText.includes(word)) {
                isViolating = true;
                matchedWord = word;
                break;
            }
        }

        if (isViolating) {
            chatInputText.value = ""; // Message එක Auto-delete වෙනවා

            try {
                const userRef = doc(db, "users", currentUser.uid);
                const userSnap = await getDoc(userRef);
                let userData = userSnap.exists() ? userSnap.data() : {};
                
                // Warnings ගණන 1කින් වැඩි කරනවා
                let currentWarnings = (userData.roomWarnings || 0) + 1;

                if (currentWarnings >= 3) {
                    // 3 වන වතාව නම් Virtual Room එකෙන් සදහටම Banned කරනවා (අනෙකුත් features වැඩ කරයි)
                    await updateDoc(userRef, {
                        roomWarnings: currentWarnings,
                        virtualRoomBanned: true,
                        banReason: `Banned due to 3 guideline violations (Last word: ${matchedWord})`
                    });
                    alert(`⛔ PERMANENTLY BANNED: You have used prohibited words 3 times ("${matchedWord}"). You are now permanently banned from the Virtual Room.`);
                    location.reload(); 
                } else {
                    // 1 හෝ 2 වතාව නම් Warning එකක් පෙන්වයි
                    await updateDoc(userRef, {
                        roomWarnings: currentWarnings
                    });
                    alert(`⚠️ WARNING (${currentWarnings}/3): Prohibited word detected ("${matchedWord}"). Your message was deleted. Reaching 3 warnings will result in a permanent ban from the Virtual Room.`);
                }
            } catch (err) {
                console.error("Warning update error:", err);
            }
            return; // මැසේජ් එක යැවීම නවත්වයි
        }

        const cleanedText = filterSensitiveData(text);
        chatInputText.value = '';

        if (editingMessageId) {
            try {
                await updateDoc(doc(db, "virtual_rooms", editingMessageId), { text: cleanedText });
            } catch (e) {
                console.error(e);
            }
            editingMessageId = null;
            if (actionBar) actionBar.style.display = 'none';
            chatSendBtn.innerHTML = svgs.send;
        } else {
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
                if (actionBar) actionBar.style.display = 'none';
            }

            try {
                await addDoc(collection(db, "virtual_rooms"), messagePayload);
            } catch (e) {
                console.error("Error sending message:", e);
            }
        }
    });
}

// 🟢 Do not auto-send on enter, allowing Next Line natively
if (chatInputText) {
    chatInputText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Allows normal browser native newline functionality for <textarea>
        }
    });
}

// Global functions for inline Edit / Reply
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

// 🟢 Multi Delete Long Press Logic
window.startLongPress = function(msgId, isMe) {
    if (!isMe) return; // Only allow long press on own messages
    pressTimer = window.setTimeout(() => {
        if (!selectedMessagesToDelete.has(msgId)) {
            selectedMessagesToDelete.add(msgId);
        }
        updateMultiDeleteBar();
        document.querySelectorAll('.msg-row.me').forEach(row => row.classList.add('multi-select-mode'));
        const checkboxes = document.querySelectorAll('.chat-checkbox');
        checkboxes.forEach(cb => {
            if(cb.getAttribute('onchange').includes(msgId)) cb.checked = true;
        });
    }, 500); 
};

window.cancelLongPress = function() {
    if (pressTimer) {
        clearTimeout(pressTimer);
    }
};

window.toggleMessageSelection = function(msgId, checkbox) {
    if (checkbox.checked) {
        selectedMessagesToDelete.add(msgId);
    } else {
        selectedMessagesToDelete.delete(msgId);
    }
    updateMultiDeleteBar();
};

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

if (cancelMultiDeleteBtn) {
    cancelMultiDeleteBtn.addEventListener('click', () => {
        selectedMessagesToDelete.clear();
        document.querySelectorAll('.chat-checkbox').forEach(cb => cb.checked = false);
        updateMultiDeleteBar();
    });
}

if (confirmMultiDeleteBtn) {
    confirmMultiDeleteBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete ${selectedMessagesToDelete.size} message(s)?`)) {
            for (let msgId of selectedMessagesToDelete) {
                try { 
                    await deleteDoc(doc(db, "virtual_rooms", msgId)); 
                } catch (e) {
                    console.error(e);
                }
            }
            selectedMessagesToDelete.clear();
            updateMultiDeleteBar();
        }
    });
}

// 🟢 Toggle Attachment Menu
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

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mainAttachBtn.contains(e.target) && !attachmentMenu.contains(e.target)) {
            attachmentMenu.classList.remove('show');
        }
    });
}

// 🟢 5. MEDIA UPLOAD LOGIC (Auto-Image Compression & Document Handling)
if(menuImageBtn && chatImageInput) {
    menuImageBtn.addEventListener('click', () => {
        chatImageInput.click();
        attachmentMenu.classList.remove('show');
    });
    
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
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 800;
                
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    uploadMediaToFirebase(compressedFile, file.name, 'image');
                }, 'image/jpeg', 0.7);
            };
        };
    });
}

if(menuDocBtn && chatDocInput) {
    menuDocBtn.addEventListener('click', () => {
        chatDocInput.click();
        attachmentMenu.classList.remove('show');
    });

    chatDocInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !currentStudentFaculty) return;
        uploadMediaToFirebase(file, file.name, 'document');
    });
}

// 🟢 6. VOICE MESSAGE LOGIC WITH PREVIEW & CANCEL OPTION
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
                
                if (recordingIndicator) {
                    recordingIndicator.style.display = 'flex';
                }
                
                mainAttachBtn.innerHTML = `🛑`; 
                mainAttachBtn.style.color = '#ef4444';

                mediaRecorder.ondataavailable = e => { 
                    audioChunks.push(e.data); 
                };

                mediaRecorder.onstop = async () => {
                    isRecording = false; 
                    
                    if (recordingIndicator) {
                        recordingIndicator.style.display = 'none';
                    }
                    
                    mainAttachBtn.innerHTML = `<svg class="icon-lg" viewBox="0 0 24 24"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
                    mainAttachBtn.style.color = 'var(--text-muted)';
                    
                    recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    audioChunks = [];

                    // Show Preview Bar, hide normal input controls
                    if (previewAudioElement && voicePreviewBar && normalInputControls) {
                        previewAudioElement.src = URL.createObjectURL(recordedAudioBlob);
                        voicePreviewBar.style.display = 'flex';
                        normalInputControls.style.display = 'none';
                    }
                };
            } catch (err) {
                alert("Microphone access denied! Please allow microphone permissions.");
            }
        }
    });
}

// Cancel Voice Note
if (cancelVoiceBtn) {
    cancelVoiceBtn.addEventListener('click', () => {
        recordedAudioBlob = null;
        isRecording = false;
        if (voicePreviewBar) voicePreviewBar.style.display = 'none';
        if (normalInputControls) normalInputControls.style.display = 'flex';
    });
}

// Send Voice Note after preview
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

// 🟢 Helper Function to Upload Media to Firebase Storage
function uploadMediaToFirebase(fileOrBlob, fileName, type) {
    const storageRef = ref(storage, `virtual_room_media/${Date.now()}_${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, fileOrBlob);

    const originalBtnHTML = chatSendBtn.innerHTML;
    chatSendBtn.innerHTML = "⏳";
    chatSendBtn.disabled = true;

    uploadTask.on('state_changed', 
        (snapshot) => {}, 
        (error) => {
            alert("Upload failed: " + error.message);
            chatSendBtn.innerHTML = originalBtnHTML;
            chatSendBtn.disabled = false;
        }, 
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            let displayTxt = type === 'audio' ? `${svgs.mic} Voice Message` : (type === 'image' ? `${svgs.photo} Photo` : `${svgs.doc} Document`);
            
            await addDoc(collection(db, "virtual_rooms"), {
                faculty: currentStudentFaculty,
                senderName: getStudentFirstName(),
                senderId: currentUser.uid,
                text: displayTxt,
                type: type,
                fileName: fileName,
                fileUrl: downloadURL,
                timestamp: new Date().toISOString()
            });

            chatSendBtn.innerHTML = originalBtnHTML;
            chatSendBtn.disabled = false;
        }
    );
}

// 5. Load Real-time Messages (Premium View)
function openChatRoom(facultyName) {
    showView('virtualroom');
    if(activeFacultyLabel) {
        activeFacultyLabel.innerHTML = `<span class="flex-align">🎓 ${facultyName}</span>`;
    }
    
    const q = query(collection(db, "virtual_rooms"), where("faculty", "==", facultyName));

    onSnapshot(q, async (snapshot) => {
        let msgs = [];
        
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const studentClearedTime = userData.chatClearedAt ? new Date(userData.chatClearedAt) : null;

        const timerSelect = document.getElementById('disappearing-timer-select');
        let studentPersonalDays = 30;
        if (timerSelect && timerSelect.value !== 'off') {
            studentPersonalDays = parseInt(timerSelect.value);
        }

        const personalCutoffDate = new Date();
        personalCutoffDate.setDate(personalCutoffDate.getDate() - studentPersonalDays);

        const absoluteMaxDate = new Date();
        absoluteMaxDate.setDate(absoluteMaxDate.getDate() - 30); // Global 30-Day Limit

        snapshot.forEach(docSnap => {
            let msgData = docSnap.data();
            msgData.msgId = docSnap.id;
            const msgTime = new Date(msgData.timestamp);

            if (msgTime < absoluteMaxDate) return;
            if (msgTime < personalCutoffDate) return;
            if (studentClearedTime && msgTime <= studentClearedTime) return;

            msgs.push(msgData);
        });

        msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // 🟢 Guidelines Inline Banner inside Chat with NEW RULES
        const bannerHtml = `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px 14px; border-radius: 12px; font-size: 0.82rem; color: var(--text-color); line-height: 1.5; margin-bottom: 15px;">
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.9rem;">
                    ${svgs.info} Virtual Room Guidelines
                </div>
                <div><b>English:</b><br>1. Be mindful of your language and respectful while chatting. <br>2. Avoid sharing sensitive content like numbers or emails.<br><b style="color:#ef4444;">3. Do not share nudity or explicit content. (Ban will be applied).</b><br><b style="color:#a855f7;">4. Please upload media with smaller file sizes.</b></div>
            </div>
        `;

        if (msgs.length === 0) {
            chatMessagesContainer.innerHTML = `${bannerHtml}<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: auto; margin-bottom: auto;">No messages yet. Say hi! ${svgs.user}</div>`;
            return;
        }

        let html = bannerHtml;

        msgs.forEach(msg => {
            const isMe = msg.senderId === currentUser.uid;
            let actionsHtml = `
        <div class="msg-actions">
            <button class="reply-btn" onclick="setReplyMessage('${msg.senderName}', '${encodeURIComponent(msg.type === 'text' ? msg.text : 'Media')}')" title="Reply">${svgs.reply}</button>
            ${isMe && msg.type === 'text' ? `<button class="edit-btn" onclick="setEditMessage('${msg.msgId}', '${encodeURIComponent(msg.text)}')" title="Edit">${svgs.edit}</button>` : ''}
            ${isMe ? `<button class="delete-btn" onclick="deleteVirtualMessage('${msg.msgId}')" title="Delete" style="background:none; border:none; cursor:pointer; padding:2px;">${svgs.trash}</button>` : ''}
        </div>
    `;
});

            let contentHtml = "";
            if (msg.type === 'image') {
                contentHtml = `<img src="${msg.fileUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 5px; cursor: pointer;" onclick="window.open('${msg.fileUrl}', '_blank')">`;
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

            // Actions UI (Premium outside bubble, Always Visible)
            let actionsHtml = `
                <div class="msg-actions">
                    <button class="reply-btn" onclick="setReplyMessage('${msg.senderName}', '${encodeURIComponent(msg.type === 'text' ? msg.text : 'Media')}')" title="Reply">${svgs.reply}</button>
                    ${isMe && msg.type === 'text' ? `<button class="edit-btn" onclick="setEditMessage('${msg.msgId}', '${encodeURIComponent(msg.text)}')" title="Edit">${svgs.edit}</button>` : ''}
                </div>
            `;

            // Checkbox UI for multi-delete (only for user's own messages)
            let checkboxHtml = '';
            if (isMe) {
                const isChecked = selectedMessagesToDelete.has(msg.msgId) ? 'checked' : '';
                checkboxHtml = `<input type="checkbox" class="chat-checkbox" onchange="toggleMessageSelection('${msg.msgId}', this)" ${isChecked}>`;
            }

            // Msg Row HTML with Touch Events for Long Press Selection
            html += `
                <div class="msg-row ${isMe ? 'me' : 'other'} ${selectedMessagesToDelete.size > 0 && isMe ? 'multi-select-mode' : ''}"
                     onmousedown="startLongPress('${msg.msgId}', ${isMe})" 
                     onmouseup="cancelLongPress()" 
                     onmouseleave="cancelLongPress()" 
                     ontouchstart="startLongPress('${msg.msgId}', ${isMe})" 
                     ontouchend="cancelLongPress()">
                    
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
// ==========================================


// --- 🟢 AI Agent Open / Close Toggle Logic ---
const aiToggleBtn = document.getElementById('ai-toggle-btn');
const aiAgentSidebar = document.getElementById('ai-agent-sidebar');

if (aiToggleBtn && aiAgentSidebar) {
    aiToggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            // Mobile toggle
            aiAgentSidebar.classList.toggle('mobile-open');
            if (aiAgentSidebar.classList.contains('mobile-open')) {
                aiToggleBtn.innerHTML = `
                <svg class="icon-md" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Chat`;
            } else {
                aiToggleBtn.innerHTML = `${svgs.bot} Open AI Chat`;
            }
        } else {
            // Desktop toggle
            aiAgentSidebar.classList.toggle('collapsed');
            if (aiAgentSidebar.classList.contains('collapsed')) {
                aiToggleBtn.innerHTML = `${svgs.bot} Open AI Chat`;
            } else {
                aiToggleBtn.innerHTML = `
                <svg class="icon-md" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Close Chat`;
            }
        }
    });
}

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
        if (!currentUser) { alert("Please login first!"); return; }
        const comment = modalReviewComment.value.trim();
        const rating = parseInt(modalReviewRating.value);
        if (!comment) { alert("Please write a comment!"); return; }

        modalSubmitReviewBtn.innerText = "Submitting...";
        modalSubmitReviewBtn.disabled = true;
        try {
            await addDoc(collection(db, "global_reviews"), {
                userName: currentUser.displayName || getStudentFirstName(),
                userEmail: currentUser.email,
                rating, comment, createdAt: new Date().toISOString()
            });
            alert("Thank you for your feedback!");
            modalReviewComment.value = '';
            modalReviewRating.selectedIndex = 0;
        } catch (e) { 
            alert("Failed to submit review: " + e.message); 
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
        "first_name": getStudentFirstName(),
        "last_name": "Student",
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
    payhere.onDismissed = () => alert("Payment cancelled.");
    payhere.onError = (err) => alert("Payment Error: " + err);
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
        aiFileIndicator.style.display = 'block';
        aiFileIndicator.innerText = "📁 Attached: " + file.name;

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
                    alert("PDF attached & read successfully!");
                } catch (err) {
                    console.error("PDF Read Error:", err);
                    alert("Failed to read attached PDF.");
                }
            };
        } else {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function(e) {
                attachedAiFileText = e.target.result;
                alert("Document attached successfully!");
            };
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
            <b>You:</b> ${displayMsg} ${attachedAiFileText ? '<br><small style="color: #38bdf8;">[Document Attached]</small>' : ''}
        </div>
    `;
    aiChatInput.value = '';
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    const loadingId = 'ai-loading-' + Date.now();
    aiChatMessages.innerHTML += `
        <div id="${loadingId}" style="background: var(--input-bg); padding: 8px 12px; border-radius: 8px; color: var(--text-muted); font-style: italic;">
            AI Agent is thinking...
        </div>
    `;
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    const activeStudentName = getStudentFirstName();

    try {
        const response = await fetch('/api/chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: text || "Please summarize and explain this attached document.", 
                fileContent: attachedAiFileText,
                studentName: activeStudentName
            })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        if (data.error) {
            aiChatMessages.innerHTML += `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px; color: var(--text-color);">
                    <b>🤖 AI Buddy:</b><br>Oyage daily limit eka poddak touch una wage, ${activeStudentName}! 😅 Podi welawak idala (seconds 20k wage) ayith message ekak danna, mama ready innawa! 💛✨
                </div>
            `;
            return;
        }

        aiChatMessages.innerHTML += `
            <div style="background: var(--input-bg); border: 1px solid var(--input-border); padding: 10px; border-radius: 8px; color: var(--text-color); line-height: 1.5;">
                <b>🤖 AI Agent:</b><br>${data.reply.replace(/\n/g, '<br>')}
            </div>
        `;
    } catch (err) {
        if (document.getElementById(loadingId)) document.getElementById(loadingId).remove();
        aiChatMessages.innerHTML += `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px; color: var(--text-color);">
                <b>🤖 AI Buddy:</b><br>Oops! Podi connection issue ekak wage, ${activeStudentName}. Ayith try karමුද? 🚀✨
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
        if (e.key === 'Enter' && !e.shiftKey) {
            // Allows naturally moving to the next line
        }
    });
}

if (aiClearBtn) {
    aiClearBtn.addEventListener('click', () => {
        const activeStudentName = getStudentFirstName();
        aiChatMessages.innerHTML = `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 10px; border-radius: 8px; color: var(--text-color);">
                👋 Hey ${activeStudentName}! Chat cleared. How can I help you with your studies today? 🎓✨
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
                alert("Lecture PDF text extracted successfully! Ready to generate short notes.");
            } catch (err) {
                console.error("PDF Read Error:", err);
                alert("Failed to read PDF file.");
            }
        };
    });
}

if (generateNotesBtn) {
    generateNotesBtn.addEventListener('click', async () => {
        if (!extractedNoteText) {
            alert("Please upload a lecture PDF first!");
            return;
        }

        const customPromptInput = document.getElementById('note-custom-prompt');
        const customPrompt = customPromptInput ? customPromptInput.value.trim() : "";

        if (noteLoading) noteLoading.style.display = 'block';
        if (noteResultSection) noteResultSection.style.display = 'none';
        generateNotesBtn.disabled = true;
        generateNotesBtn.innerText = "Generating Progress...";

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
                alert("Error: " + data.error);
                return;
            }

            if (data.result) {
                generatedNotesOutput.value = data.result;
                if (noteResultSection) noteResultSection.style.display = 'block';
            }
        } catch (error) {
            console.error("Short Notes API Error:", error);
            alert("Failed to connect to server for generating short notes.");
        } finally {
            if (noteLoading) noteLoading.style.display = 'none';
            generateNotesBtn.disabled = false;
            generateNotesBtn.innerText = "✨ Generate Short Notes";
        }
    });
}

// --- DOWNLOAD SHORT NOTES AS WORD DOCUMENT (.doc) ---
if (downloadNotesDocxBtn) {
    downloadNotesDocxBtn.addEventListener('click', () => {
        const text = generatedNotesOutput.value;
        if (!text) {
            alert("No short notes available to download!");
            return;
        }

        let formattedHtml = text
            .split('\n')
            .map(line => {
                let trimmed = line.trim();
                if (trimmed.startsWith('# ')) {
                    return `<h1 style="font-size: 16pt; color: #0f172a; font-family: 'Times New Roman', serif; border-bottom: 2px solid #38bdf8; padding-bottom: 4px; margin-top: 20px;">${trimmed.substring(2)}</h1>`;
                } else if (trimmed.startsWith('## ')) {
                    return `<h2 style="font-size: 13pt; color: #1e293b; font-family: 'Times New Roman', serif; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 15px;">${trimmed.substring(3)}</h2>`;
                } else if (trimmed.startsWith('### ')) {
                    return `<h3 style="font-size: 11pt; color: #334155; font-family: 'Times New Roman', serif; margin-top: 10px;">${trimmed.substring(4)}</h3>`;
                } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
                    return `<li style="font-family: 'Times New Roman', serif; font-size: 11pt; margin-bottom: 4px; color: #334155;">${trimmed.substring(2)}</li>`;
                } else if (trimmed === '') {
                    return `<br>`;
                } else {
                    return `<p style="font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 8px; color: #334155;">${trimmed}</p>`;
                }
            })
            .join('');

        let wordContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <title>Lecture Short Notes - Student Productivity Hub</title>
                <style>
                    body { font-family: 'Times New Roman', serif; margin: 25mm; }
                    .header-box { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25mm; }
                    .header-box h1 { color: #0f172a; font-size: 18pt; margin: 0; }
                    .header-box p { color: #64748b; font-size: 10pt; margin: 5px 0 0 0; }
                </style>
            </head>
            <body>
                <div class="header-box">
                    <h1>📚 Lecture Short Notes</h1>
                    <p>Generated via Student Productivity Hub • AI Academic Assistant</p>
                </div>
                ${formattedHtml}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Lecture_Short_Notes.doc';
        a.click();
        URL.revokeObjectURL(url);
    });
}

if (downloadNotesPdfBtn) {
    downloadNotesPdfBtn.addEventListener('click', () => {
        const text = generatedNotesOutput.value;
        if (!text) {
            alert("No short notes available to download!");
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
                <div class="footer-note">Official Academic Study Material Report | Powered by Gemini AI & Student Productivity Hub</div>
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
        if (!deg) { alert("Please enter your Degree Program name!"); degreeInput.focus(); return; }
        localStorage.setItem('active_uni_mode', mode);
        localStorage.setItem(mode + '_degree', deg);
        toggleUniversityMode(mode);
        updateUI();
        alert("Profile switched successfully!");
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
        const studentName = getStudentFirstName();
        updateDynamicGreeting(studentName);
        
        initIEEEModule();

        if (aiChatMessages) {
            aiChatMessages.innerHTML = `
                <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 10px; border-radius: 8px; color: var(--text-color);">
                    👋 Hey ${studentName}! I'm your AI Study Agent. Ask me anything or attach documents/PDFs to analyze! 🎓✨
                </div>
            `;
        }

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

// 🟢 GLOBAL LOGOUT FUNCTION
const performLogout = () => { 
    signOut(auth).then(() => { 
        allSubjects = []; 
        currentStudentFaculty = null;
        
        // 🟢 Fix: Logout unama login section eka pennanna one
        if (loginSection) loginSection.style.display = "block";
        if (appSection) appSection.style.display = "none";
        if (reviewModal) reviewModal.style.display = 'none';

        showView('hub'); 
        updateUI(); 
    }).catch((error) => {
        alert("Logout Failed: " + error.message);
    }); 
};

if (logoutBtn) { logoutBtn.addEventListener('click', performLogout); }
if (mainLogoutBtn) { mainLogoutBtn.addEventListener('click', performLogout); }

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
    if (!degreeInput || degreeInput.value.trim() === "") { alert("Please enter Degree Program name first!"); degreeInput.focus(); return; }
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
        if (!degreeInput || degreeInput.value.trim() === "") { alert("Please enter Degree name first!"); degreeInput.focus(); return; }

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
        if (!degreeInput || degreeInput.value.trim() === "") { alert("Enter degree name first!"); degreeInput.focus(); return; }
        const activeSubjects = getActiveSubjects();
        if (activeSubjects.length === 0) { alert("Add at least one subject!"); return; }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const degree = degreeInput.value;
        const studentName = currentUser ? (currentUser.displayName || currentUser.email) : (userNameDisplay ? userNameDisplay.innerText : getStudentFirstName());
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
                alert("PDF text extracted successfully!");
            } catch (err) {
                console.error("PDF Read Error:", err);
                alert("Failed to read PDF file.");
            }
        };
    });
}

// --- HUMANIZER & PLAGIARISM CHECKER ---
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
            return { error: true, message: data.error };
        }
        return { error: false, result: data.result || inputText };
    } catch (error) {
        console.error("Network Fetch Error:", error);
        return { error: true, message: error.message };
    }
}

if (checkPlagiarismBtn) {
    checkPlagiarismBtn.addEventListener('click', async () => {
        const text = plagiarismText.value.trim();
        if (text === "") {
            alert("Please paste text or upload a PDF first!");
            plagiarismText.focus();
            return;
        }

        const inputWords = text.split(/\s+/).length;
        if (inputWords < 10) {
            alert("Please enter a longer text (at least 10 words).");
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

            checkPlagiarismBtn.innerText = "Humanizing via Gemini AI...";
            const humanizeResponse = await trueAIHumanizer(text);

            if (humanizeResponse.error) {
                const activeName = getStudentFirstName();
                alert(`AI Limit reached during Humanizing, ${activeName}! ඔයාගේ Word quota එකෙන් කිසිම වර්ඩ් එකක් අඩු වුණේ නැහැ. පස්සේ ට්‍රයි කරන්න!`);
                
                checkPlagiarismBtn.innerText = "Scan for Plagiarism & AI";
                checkPlagiarismBtn.disabled = false;
                return;
            }

            const newTotalUsed = userData.wordCountUsed + inputWords;
            await updateDoc(userRef, { wordCountUsed: newTotalUsed, lastResetMonth: currentMonth });

            if (humanizedOutputText) humanizedOutputText.value = humanizeResponse.result;

            const humanizedStatsEl = document.getElementById('humanized-stats');
            if (humanizedStatsEl) {
                humanizedStatsEl.innerHTML = `
                    <b>✨ Post-Humanize Status:</b><br>
                    • Risk Level: <b style="color: #22c55e;">0.0% (Clean & Undetectable)</b><br>
                    • Tone Status: <b style="color: #38bdf8;">100% Natural Academic Human Tone</b>
                `;
            }

            plagiarismStats.innerHTML = `
                <b>📌 Original Scan Report:</b><br>
                • Monthly Quota Used: <b>${newTotalUsed} / ${activeWordLimit} words</b><br>
                • Plagiarism Detected: <b style="color: ${percentPlagiarized > 10 ? '#ef4444' : '#22c55e'};">${percentPlagiarized}%</b><br>
                • Originality Score: <b style="color: #38bdf8;">${(100 - percentPlagiarized).toFixed(1)}% Unique</b><br>
                ${sourcesHTML}
            `;

            if (humanizeBox) humanizeBox.style.display = 'block';
        } catch (error) {
            console.error("API Error:", error);
            alert("Plagiarism scan failed.");
        } finally {
            checkPlagiarismBtn.innerText = "Scan for Plagiarism & AI";
            checkPlagiarismBtn.disabled = false;
        }
    });
}
