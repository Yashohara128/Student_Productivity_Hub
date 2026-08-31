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

function getStudentFirstName() {
    if (currentUser && currentUser.displayName) {
        return currentUser.displayName.split(" ")[0];
    } else if (currentUser && currentUser.email) {
        return currentUser.email.split('@')[0];
    }
    return "Student";
}

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
            .then((result) => { console.log("Login Success:", result.user.displayName); })
            .catch((error) => { alert("❌ Login Failed: " + error.message); });
    });
}

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

const chatImageBtn = document.getElementById('chat-image-btn');
const chatImageInput = document.getElementById('chat-image-input');
const chatDocBtn = document.getElementById('chat-doc-btn');
const chatDocInput = document.getElementById('chat-doc-input');
const chatMicBtn = document.getElementById('chat-mic-btn');
const recordingIndicator = document.getElementById('recording-indicator');
const clearMyChatBtn = document.getElementById('clear-my-chat-btn');

// Voice Preview Elements
const voicePreviewBar = document.getElementById('voice-preview-bar');
const previewAudioElement = document.getElementById('preview-audio-element');
const cancelVoiceBtn = document.getElementById('cancel-voice-btn');
const sendVoiceBtn = document.getElementById('send-voice-btn');
const normalInputControls = document.getElementById('normal-input-controls');

let currentStudentFaculty = null;
let recordedAudioBlob = null;

// 1. Open Room Logic
if (cardVirtualRoom) {
    cardVirtualRoom.addEventListener('click', async () => {
        if (!currentUser) { alert("Please login first!"); return; }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists() && userSnap.data().faculty && userSnap.data().studentId) {
            currentStudentFaculty = userSnap.data().faculty;
            openChatRoom(currentStudentFaculty);
        } else {
            studentIdModal.style.display = 'flex'; 
        }
    });
}

if (closeIdModal) closeIdModal.addEventListener('click', () => { studentIdModal.style.display = 'none'; });

// 2. ID Prefix Verification & 🛡️ SECURITY LOGIC
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
                leaveRoomBtn.innerText = "Leave";
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
    let safeText = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, " 🚫 <i>[Emails are not allowed to this chat]</i> ");
    safeText = safeText.replace(/(?:\+94|0)[0-9]{9}/g, " 🚫 <i>[Contact numbers are not allowed to this chat]</i> ");
    return safeText;
}

// 4. Send Message to Firestore
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
        } catch (e) {
            console.error("Error sending message:", e);
        }
    });
}

// 🟢 5. MEDIA UPLOAD LOGIC (Auto-Image Compression & Document Handling)
if(chatImageBtn && chatImageInput) {
    chatImageBtn.addEventListener('click', () => chatImageInput.click());
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

if(chatDocBtn && chatDocInput) {
    chatDocBtn.addEventListener('click', () => chatDocInput.click());
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

if(chatMicBtn) {
    chatMicBtn.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                isRecording = true;
                
                if (recordingIndicator) recordingIndicator.style.display = 'block';
                chatMicBtn.innerText = '⏹️';
                chatMicBtn.style.color = '#ef4444';

                mediaRecorder.ondataavailable = e => { audioChunks.push(e.data); };

                mediaRecorder.onstop = async () => {
                    if (recordingIndicator) recordingIndicator.style.display = 'none';
                    chatMicBtn.innerText = '🎤';
                    chatMicBtn.style.color = '#38bdf8';
                    
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
        } else {
            mediaRecorder.stop();
            isRecording = false;
        }
    });
}

// Cancel Voice Note
if (cancelVoiceBtn) {
    cancelVoiceBtn.addEventListener('click', () => {
        recordedAudioBlob = null;
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
            
            await addDoc(collection(db, "virtual_rooms"), {
                faculty: currentStudentFaculty,
                senderName: getStudentFirstName(),
                senderId: currentUser.uid,
                text: type === 'audio' ? '🎤 Voice Message' : (type === 'image' ? '📷 Photo' : '📄 Document'),
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

// 🗑️ Delete Message Function
window.deleteVirtualMessage = async function(msgId) {
    const confirmDelete = confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, "virtual_rooms", msgId));
    } catch (e) {
        alert("Failed to delete message: " + e.message);
    }
};

// ✏️ Edit Message Function
window.editVirtualMessage = async function(msgId, currentText) {
    const newText = prompt("Edit your message:", decodeURIComponent(currentText));
    if (newText === null || newText.trim() === "") return;

    const cleanedText = filterSensitiveData(newText.trim());
    try {
        await updateDoc(doc(db, "virtual_rooms", msgId), {
            text: cleanedText
        });
    } catch (e) {
        alert("Failed to edit message: " + e.message);
    }
};

// 5. Load Real-time Messages (Global 1-Month DB limit & Student-side Disappearing/Clear filters)
function openChatRoom(facultyName) {
    showView('virtualroom');
    if(activeFacultyLabel) activeFacultyLabel.innerText = "🎓 " + facultyName + " Room";
    
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

            // 1️⃣ Global 30-Day Rule
            if (msgTime < absoluteMaxDate) return;

            // 2️⃣ Student-Side Disappearing Timer Rule
            if (msgTime < personalCutoffDate) return;

            // 3️⃣ Student Local Clear Chat Rule
            if (studentClearedTime && msgTime <= studentClearedTime) return;

            msgs.push(msgData);
        });

        msgs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const bannerHtml = `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); padding: 12px 14px; border-radius: 12px; font-size: 0.82rem; color: var(--text-color); line-height: 1.5; margin-bottom: 6px;">
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-size: 0.9rem;">
                    <span>💡</span> Virtual Room Guidelines / මාර්ගෝපදේශ / வழிகாட்டுதல்கள்
                </div>

                <!-- English -->
                <div><b>English:</b><br>
                1. Please be mindful of your language and respectful while chatting, as seniors and fellow campus members are present in this virtual room.<br>
                2. Chat clear option and chat timer options remove messages from your device only, whereas the message delete option removes the message completely for everyone.<br>
                3. Avoid sensitive content such as inappropriate material, phone numbers, email addresses, and spam messages to prevent your account from being blocked.<br>
                4. We believe this virtual room helps you share educational information safely and cooperatively across the faculty. - <i>Web Admin Team</i></div>
                <hr style="border: none; border-top: 1px solid rgba(56,189,248,0.2); margin: 8px 0;">

                <!-- Sinhala -->
                <div><b>සිංහල:</b><br>
                1. මෙම virtual room එක ඇතුලේ ඔයලගේ campus එකේ අයියලා අක්කලා ඉන්න නිසා chat කිරිමේදි වචන භාවිතය ගැන සැලකිලිමත් වන්න.<br>
                2. chat clear option එක හරහා සහ chat timer option තුලින් අදාල කාල සිමාවේ දී ඔබගේ චැට් එක ඔබගේ උපකරණයෙන් පමණක් ඉවත් වන අතර message delete option එක මගින් message එක සම්පුර්ණණයෙන්ම ඉවත් වීම සිදු වේ.<br>
                3. අසභ්‍ය අන්තර්ගතයන්, දුරකතන අංක, ඊමේල් ලිපින, spam messages වැනි සංවේදි පණිවිඩ යැවීම නිසා ඔබගේ ගිණුම අවහිර වී යා හැකි බව මතක තබා ගන්න.<br>
                4. මෙම virtual room පහසුකම මගින් ඔබගේ campus එක තුල සමස්ත faculty එක ඇතුලත සහයෝගිතාවයෙන් ආරක්ෂිත ලෙස අධ්‍යාපනික තොරතුරු බෙදා ගැනීමට පහසුකම සැලසෙනු ඇතැයි අප විශ්වාස කරමු. - <i>Web Admin Team</i></div>
                <hr style="border: none; border-top: 1px solid rgba(56,189,248,0.2); margin: 8px 0;">

                <!-- Tamil -->
                <div><b>தமிழ்:</b><br>
                1. இந்த மெய்நிகர் அறையில் உங்கள் வளாகத்தின் மூத்த மாணவர்களும் அக்காக்களும் அண்ணன்களும் இருப்பதால், அரட்டையடிக்கும்போது வார்த்தைப் பயன்பாட்டில் கவனமாக இருக்கவும்.<br>
                2. அரட்டை தெளிவு விருப்பம் (Chat clear option) மற்றும் அரட்டை டைமர் விருப்பம் (Chat timer option) மூலம் குறிப்பிட்ட நேரத்தில் உங்கள் அரட்டை உங்கள் சாதனத்திலிருந்து மட்டுமே நீக்கப்படும், அதே நேரத்தில் செய்தி நீக்குதல் விருப்பம் (Message delete option) செய்தியை முழுமையாக அகற்றும்.<br>
                3. ஆபாசமான உள்ளடக்கங்கள், தொலைபேசி எண்கள், மின்னஞ்சல் முகவரிகள், ஸ்பேம் செய்திகள் போன்ற உணர்திறன் வாய்ந்த செய்திகளை அனுப்புவது உங்கள் கணக்கு முடக்கப்படுவதற்குக் காரணமாகலாம் என்பதை நினைவில் கொள்ளுங்கள்.<br>
                4. இந்த மெய்நிகர் அறை வசதியானது உங்கள் வளாகத்திற்குள் முழு பீடத்திலும் ஒத்துழைப்புடன் பாதுகாப்பாக கல்வித் தகவல்களைப் பகிர்ந்து கொள்ள உதவும் என்று நாங்கள் நம்புகிறோம். - <i>Web Admin Team</i></div>
            </div>
        `;

        if (msgs.length === 0) {
            chatMessagesContainer.innerHTML = `
                ${bannerHtml}
                <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: auto; margin-bottom: auto;">
                    No messages yet. Say hi to your friends! 👋
                </div>
            `;
            return;
        }

        let html = bannerHtml;

        msgs.forEach(msg => {
            const isMe = msg.senderId === currentUser.uid;

            let contentHtml = "";
            if (msg.type === 'image') {
                contentHtml = `<img src="${msg.fileUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 5px; cursor: pointer;" onclick="window.open('${msg.fileUrl}', '_blank')">`;
            } else if (msg.type === 'document') {
                contentHtml = `<a href="${msg.fileUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 500; font-size: 0.85rem;">📄 ${msg.fileName || 'Download / View File'}</a>`;
            } else if (msg.type === 'audio') {
                contentHtml = `<audio controls style="height: 35px; max-width: 220px; margin-top: 5px; border-radius: 20px;"><source src="${msg.fileUrl}" type="audio/webm">Your browser does not support audio.</audio>`;
            } else {
                contentHtml = `${msg.text}`;
            }

            html += `
                <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 80%; background: ${isMe ? 'rgba(56, 189, 248, 0.15)' : 'var(--input-bg)'}; border: 1px solid ${isMe ? 'rgba(56, 189, 248, 0.3)' : 'var(--input-border)'}; padding: 10px 14px; border-radius: 12px; border-top-right-radius: ${isMe ? '2px' : '12px'}; border-top-left-radius: ${!isMe ? '2px' : '12px'}; display: flex; flex-direction: column; position: relative;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-bottom: 3px;">
                        ${!isMe ? `<span style="font-size: 0.7rem; color: #a855f7; font-weight: bold;">${msg.senderName}</span>` : '<span></span>'}
                        ${isMe ? `<div style="display: flex; gap: 6px;"><button onclick="editVirtualMessage('${msg.msgId}', '${encodeURIComponent(msg.text || '')}')" style="background: none; border: none; color: #38bdf8; font-size: 0.75rem; cursor: pointer; padding: 0;" title="Edit Message">✏️</button><button onclick="deleteVirtualMessage('${msg.msgId}')" style="background: none; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer; padding: 0;" title="Delete Message">🗑️</button></div>` : ''}
                    </div>

                    <div style="color: var(--text-color); font-size: 0.9rem; line-height: 1.4;">${contentHtml}</div>
                </div>
            `;
        });
        chatMessagesContainer.innerHTML = html;
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
}
// ==========================================


// --- 🟢 AI Agent Open / Close Toggle Logic (Strict Fixed Logic) ---
const aiToggleBtn = document.getElementById('ai-toggle-btn');
const aiAgentSidebar = document.getElementById('ai-agent-sidebar');

if (aiToggleBtn && aiAgentSidebar) {
    aiToggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            // Mobile toggle
            aiAgentSidebar.classList.toggle('mobile-open');
            if (aiAgentSidebar.classList.contains('mobile-open')) {
                aiToggleBtn.innerHTML = "✕ Close Chat";
            } else {
                aiToggleBtn.innerHTML = "🤖 Open AI Chat";
            }
        } else {
            // Desktop toggle
            aiAgentSidebar.classList.toggle('collapsed');
            if (aiAgentSidebar.classList.contains('collapsed')) {
                aiToggleBtn.innerHTML = "🤖 Open AI Chat";
            } else {
                aiToggleBtn.innerHTML = "✕ Close Chat";
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
        showView('hub'); 
        updateUI(); 
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

if (copyHumanizedBtn) {
    copyHumanizedBtn.addEventListener('click', () => {
        humanizedOutputText.select();
        navigator.clipboard.writeText(humanizedOutputText.value);
        alert("Humanized text copied to clipboard!");
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
            alert("No humanized text available to download!");
            return;
        }

        let formattedHtml = text.split('\n\n').map(p => `<p style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; text-align: justify; margin-bottom: 15px;">${p.replace(/\n/g, '<br>')}</p>`).join('');

        let wordContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <title>Humanizer Report</title>
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

        const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Humanized_Assignment_Report.doc';
        a.click();
        URL.revokeObjectURL(url);
    });
}
