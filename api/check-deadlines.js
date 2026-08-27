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
        let notificationsSentCount = 0;

        for (const docSnap of tasksSnapshot.docs) {
            const task = docSnap.data();
            
            // ඩේට්, ටයිම් නැත්නම් හෝ කලින් නොටිෆිකේෂන් යවා ඇත්නම් ස්කිප් කරයි
            if (!task.date || !task.time || task.cronNotificationSent) continue;

            const dueDateTime = new Date(`${task.date}T${task.time}:00`);
            const diffMinutes = Math.floor((dueDateTime - now) / (1000 * 60));

            // හරියටම පැයට කලින් (විනාඩි 58ත් 62ත් අතර කාලය තුළ)
            if (diffMinutes >= 58 && diffMinutes <= 62) {
                const userId = task.userId; // Task එක දාපු යුසර්ගේ ID එක (သို့ත් parent document path එකෙන් ගන්න පුළුවන්)
                let userEmail = task.userEmail;
                let userWhatsapp = null;

                // යුසර්ගේ ප්‍රොෆයිල් එකෙන් WhatsApp නම්බර් එක ලබා ගැනීම (Firestore users/{userId} එකෙන්)
                // සමහරවිට task එක ඇතුළෙම whatsapp number එක සේව් කරලා තියෙනවා නම් task.whatsapp ගන්නත් පුළුවන්.
                try {
                    // Task එකේ parent path එකෙන් හෝ user collection එකෙන් user data ගන්නවා
                    const pathSegments = docSnap.ref.path.split('/'); // users/{userId}/tasks/{taskId}
                    if (pathSegments.length >= 2) {
                        const actualUserId = pathSegments[1];
                        const userDoc = await db.collection('users').doc(actualUserId).get();
                        if (userDoc.exists) {
                            userWhatsapp = userDoc.data().whatsappNumber; // අපි ෆ්‍රන්ට්එන්ඩ් එකෙන් save කරන field name එක මෙතනට දෙන්න
                        }
                    }
                } catch (err) {
                    console.error("Error fetching user whatsapp:", err);
                }

                let successFlag = false;

                // 1. Web3Forms හරහා ඊමේල් යැවීම
                if (userEmail) {
                    const emailResponse = await fetch("https://api.web3forms.com/submit", {
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
                    const emailResult = await emailResponse.json();
                    if (emailResult.success) successFlag = true;
                }

                // 2. UltraMsg හරහා WhatsApp මැසේජ් යැවීම
                if (userWhatsapp) {
                    const instanceId = process.env.WHATSAPP_INSTANCE_ID;
                    const token = process.env.WHATSAPP_TOKEN;

                    if (instanceId && token) {
                        const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
                        const customMessage = `🔔 *Student Productivity Hub Alert*\n\nHi!\nThis is a friendly reminder for your upcoming task:\n\n• *Task:* ${task.name}\n• *Type:* ${task.type}\n• *Due:* ${task.date} at ${task.time}\n\nPlease complete it on time! 🚀`;

                        const bodyParams = new URLSearchParams({
                            token: token,
                            to: userWhatsapp, // e.g. 94762068122
                            body: customMessage
                        });

                        try {
                            const waResponse = await fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: bodyParams
                            });
                            const waResult = await waResponse.json();
                            if (waResult.sent === "true" || waResult.message === "ok") {
                                successFlag = true;
                                console.log("WhatsApp alert sent successfully to:", userWhatsapp);
                            }
                        } catch (waErr) {
                            console.error("WhatsApp API Error:", waErr);
                        }
                    }
                }

                // ඊමේල් හෝ වට්ස්ඇප් එකක් හරි සාර්ථක වුණා නම් නැවත නොයෑමට ටැග් කරයි
                if (successFlag) {
                    notificationsSentCount++;
                    await docSnap.ref.update({ cronNotificationSent: true });
                }
            }
        }

        return res.status(200).json({ success: true, message: `Checked successfully. Notifications sent: ${notificationsSentCount}` });
    } catch (error) {
        console.error("Cron Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
