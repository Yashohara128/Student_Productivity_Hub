// moderator.js - Standalone Auto-Moderation System
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

// Prohibited words (Sexual content & Hate speech list)
const forbiddenKeywords = ["sex", "nude", "porn", "xxx", "abuse", "sexy", "xxxxxx","hutta","huk","palyan","plyn","pko","hutti","hutta"]; 
let lastMessageTime = 0;
let spamWarningCount = 0;

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
}, true); // Capturing phase runs before app.js

// 2. Intercept Message Sending (Anti-Spam, Content Filter & Auto-Ban)
document.addEventListener('click', async (e) => {
    const sendBtn = e.target.closest('#chat-send-btn');
    if (!sendBtn) return;

    const chatInput = document.getElementById('chat-input-text');
    if (!chatInput) return;

    const text = chatInput.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) return;

    // Anti-Spam Check (2 seconds gap)
    const now = Date.now();
    if (now - lastMessageTime < 2000) {
        e.stopImmediatePropagation();
        e.preventDefault();
        alert("⚠️ Please wait a moment before sending another message. (Anti-Spam)");
        return;
    }

    // Sexual Content & Hate Speech Filter
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
        e.stopImmediatePropagation();
        e.preventDefault();
        
        spamWarningCount++;
        alert(`🚨 WARNING: Inappropriate content detected (${matchedWord}). Repeated violations will result in an auto-ban!`);

        // Auto-Ban after 3 violations
        if (spamWarningCount >= 3) {
            try {
                await updateDoc(doc(db, "users", user.uid), {
                    isBanned: true,
                    banReason: "Violation of Chat Guidelines (Sexual/Hate Content or Spam)"
                });
                alert("⛔ You have been automatically banned from the Virtual Room due to repeated violations.");
                location.reload();
            } catch (err) {
                console.error("Auto-ban error:", err);
            }
        }
        return;
    }

    lastMessageTime = Date.now();
}, true); // Capturing phase runs before app.js
