// moderator.js
const forbiddenKeywords = ["sex", "nude", "porn", "xxx", "abuse", "sexy", "maru kada","maru kanda","xxxx"]; 
let lastMessageTime = 0;
let spamWarningCount = 0;

export async function checkAndBanViolator(text, currentUser, db, updateDoc, doc) {
    if (!text) return false;

    // 1. Anti-Spam Check (2 seconds delay)
    const now = Date.now();
    if (now - lastMessageTime < 2000) {
        alert("⚠️ Please wait a moment before sending another message. (Anti-Spam)");
        return false;
    }

    // 2. Sexual / Hate Content Filter
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
        spamWarningCount++;
        alert(`🚨 WARNING: Inappropriate or prohibited content detected (${matchedWord}). Repeated violations will result in an auto-ban!`);
        
        // 3. Auto-Ban Trigger (3 warnings)
        if (spamWarningCount >= 3) {
            try {
                await updateDoc(doc(db, "users", currentUser.uid), { 
                    isBanned: true,
                    banReason: "Violation of Chat Guidelines (Sexual/Hate Content or Spam)"
                });
                alert("⛔ You have been automatically banned from the Virtual Room due to repeated violations.");
                location.reload(); 
            } catch (err) {
                console.error("Auto-ban error:", err);
            }
        }
        return false; 
    }

    lastMessageTime = Date.now();
    return true; 
}
