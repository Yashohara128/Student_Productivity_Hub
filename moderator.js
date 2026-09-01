// moderator.js - Instant Synchronous Content Blocker & Auto-Ban
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// Prohibited words list (Oyaata kamathi wachan mekata thawa add karanna puluwan)
const forbiddenKeywords =  ["sex", "nude", "porn", "xxx", "abuse", "sexy", "xxxxxx","hutta","huk","palyan","plyn","pko","hutti","hutta"]; 

// 1. Intercept Virtual Room Entry (Check if Banned)
document.addEventListener('click', async (e) => {
    const virtualCard = e.target.closest('#card-virtual-room');
    if (!virtualCard) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists() && userSnap.data().isBanned) {
            e.stopImmediatePropagation();
            e.preventDefault();
            alert("⛔ Access Denied: You have been banned from the Virtual Room for violating guidelines.");
        }
    } catch (err) {
        console.error("Ban check error:", err);
    }
}, true);

// 2. Instant Synchronous Intercept Message Sending
document.addEventListener('click', (e) => {
    const sendBtn = e.target.closest('#chat-send-btn');
    if (!sendBtn) return;

    const chatInput = document.getElementById('chat-input-text');
    if (!chatInput) return;

    const text = chatInput.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) return;

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
        // 🛑 SYNCHRONOUSLY STOP EVENT SO APP.JS NEVER SEES IT
        e.stopImmediatePropagation();
        e.preventDefault();

        // Clear input field immediately
        chatInput.value = "";

        alert(`⛔ BANNED: Your message contained a prohibited word ("${matchedWord}"). You have been permanently banned from the Virtual Room!`);

        // Perform database ban in the background without blocking the stop event
        updateDoc(doc(db, "users", user.uid), {
            isBanned: true,
            banReason: `Instant Ban: Used prohibited word (${matchedWord})`
        }).then(() => {
            location.reload(); // Refresh after ban is saved
        }).catch((err) => {
            console.error("Instant ban error:", err);
            location.reload();
        });
    }
}, true); // Capturing phase runs before app.js
