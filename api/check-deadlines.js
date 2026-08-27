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

        const tasksSnapshot = await db.collectionGroup('tasks').get();
        let notificationsSentCount = 0;

        for (const docSnap of tasksSnapshot.docs) {
            const task = docSnap.data();
            
            if (!task.date || !task.time) continue;

            const dueDateTime = new Date(`${task.date}T${task.time}:00`);
            const diffMinutes = Math.floor((dueDateTime - now) / (1000 * 60));

            let notificationType = null; // 'dayBefore' හෝ 'fiveHours'
            let messageContent = "";

            // 1. 📅 දවසකට කලින් (පැය 24කට ආසන්න වෙලාවකදී - විනාඩි 1420ත් 1460ත් අතර)
            if (!task.dayBeforeSent && diffMinutes >= 1420 && diffMinutes <= 1460) {
                notificationType = 'dayBefore';
                messageContent = `📅 *1-Day Deadline Reminder*\n\nHi!\nYour task *"${task.name}"* (${task.type}) is due tomorrow (${task.date} at ${task.time}).\n\nMake sure to complete it on time! ⏳`;
            }
            // 2. 🚨 පැය 5කට කලින් (විනාඩි 280ත් 320ත් අතර)
            else if (!task.fiveHoursBeforeSent && diffMinutes >= 280 && diffMinutes <= 320) {
                notificationType = 'fiveHours';
                messageContent = `🚨 *Urgent! 5-Hour Deadline Alert*\n\nHi!\nYour task *"${task.name}"* (${task.type}) is due in *5 hours* today (${task.date} at ${task.time}).\n\nHurry up and finish it! 🚀`;
            }

            // යවන්න මැසේජ් එකක් තියෙනවා නම් පමණක් ඉදිරියට යයි
            if (notificationType && messageContent) {
                let userEmail = task.userEmail;
                let userWhatsapp = null;

                try {
                    const pathSegments = docSnap.ref.path.split('/'); // users/{userId}/tasks/{taskId}
                    if (pathSegments.length >= 2) {
                        const actualUserId = pathSegments[1];
                        const userDoc = await db.collection('users').doc(actualUserId).get();
                        if (userDoc.exists) {
                            userWhatsapp = userDoc.data().whatsappNumber;
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
                            subject: `⏰ [${notificationType === 'dayBefore' ? '1-Day Notice' : '5-Hour Urgent'}] ${task.type} - ${task.name}`,
                            email: userEmail,
                            message: messageContent.replace(/\*/g, '') // Email එකට boldකුත් නැතිව plain text යැවීමට
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
                        const bodyParams = new URLSearchParams({
                            token: token,
                            to: userWhatsapp,
                            body: messageContent
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
                                console.log(`WhatsApp (${notificationType}) sent successfully to:`, userWhatsapp);
                            }
                        } catch (waErr) {
                            console.error("WhatsApp API Error:", waErr);
                        }
                    }
                }

                // යැවීම සාර්ථක නම් අදාළ ටයිප් එකට අදාළව ෆ්ලැග් එක සේව් කරයි (නැවත එම ಅಲර්ට් එකම නොයෑමට)
                if (successFlag) {
                    notificationsSentCount++;
                    if (notificationType === 'dayBefore') {
                        await docSnap.ref.update({ dayBeforeSent: true });
                    } else if (notificationType === 'fiveHours') {
                        await docSnap.ref.update({ fiveHoursBeforeSent: true });
                    }
                }
            }
        }

        return res.status(200).json({ success: true, message: `Checked successfully. Notifications sent: ${notificationsSentCount}` });
    } catch (error) {
        console.error("Cron Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
