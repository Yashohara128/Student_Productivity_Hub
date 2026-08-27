// ==========================================
// VERCEL CRON FUNCTION: api/check-deadlines.js
// ==========================================

import admin from 'firebase-admin';

// Firebase Admin SDK ඉනිෂල් කරන්න (Environment variables හරහා)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Private key එකේ නව රේඛා (\n) නිවැරදිව හැසිරවීම සඳහා
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
            })
        });
    } catch (e) {
        console.error("Firebase Admin Init Error:", e);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    try {
        const now = new Date();
        console.log("Background deadline check running at:", now.toISOString());

        // සියලුම යූසර්වරුන්ගේ tasks එකතු කිරීම සඳහා Collection Group Query එක භාවිත කරයි
        const tasksSnapshot = await db.collectionGroup('tasks').get();
        let emailsSentCount = 0;

        for (const docSnap of tasksSnapshot.docs) {
            const task = docSnap.data();
            
            // ඩේට්, ටයිම් නැත්නම් හෝ කලින් මේල් යවා ඇත්නම් ස්කිප් කරයි
            if (!task.date || !task.time || task.cronEmailSent) continue;

            const dueDateTime = new Date(`${task.date}T${task.time}:00`);
            const diffMinutes = Math.floor((dueDateTime - now) / (1000 * 60));

            // හරියටම පැයට කලින් (විනාඩි 58ත් 62ත් අතර කාලය තුළ)
            if (diffMinutes >= 58 && diffMinutes <= 62) {
                const userEmail = task.userEmail;

                if (userEmail) {
                    // Web3Forms API එක හරහා ඊමේල් යැවීම
                    const response = await fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            access_key: process.env.WEB3FORMS_ACCESS_KEY || "bb33cf20-7257-424a-933e-384723d7e936",
                            subject: `⏰ Deadline Reminder: ${task.type} - ${task.name}`,
                            email: userEmail,
                            message: `Hello!\n\nThis is an automated background reminder for your upcoming academic task:\n\n• Task Name: ${task.name}\n• Type: ${task.type}\n• Due Date: ${task.date} at ${task.time}\n\nPlease complete it on time.\n\nBest regards,\nStudent Productivity Hub`
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        emailsSentCount++;
                        // ආපහු මේල් නොයෑමට ටැග් කිරීම සේව් කරයි
                        await docSnap.ref.update({ cronEmailSent: true });
                    }
                }
            }
        }

        return res.status(200).json({ success: true, message: `Checked successfully. Emails sent: ${emailsSentCount}` });
    } catch (error) {
        console.error("Cron Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
