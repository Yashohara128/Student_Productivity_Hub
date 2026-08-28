export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, fileContent, studentName } = req.body;
        if (!message && !fileContent) {
            return res.status(400).json({ error: 'Message or file content is required' });
        }

        // 🟢 API Keys 3ක් ඇරේ එකකට ලබා ගැනීම
        const geminiApiKeys = [
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3
        ].filter(Boolean);

        if (geminiApiKeys.length === 0) {
            return res.status(500).json({ error: 'Gemini API Keys are missing in Vercel Environment Variables' });
        }

        const name = studentName || "Yashohara";
        let fullUserPrompt = message || "Please analyze and explain this attached document.";
        if (fileContent) {
            fullUserPrompt = `Attached Document Content:\n${fileContent.slice(0, 15000)}\n\nUser Question/Task: ${message || "Please summarize or analyze this document."}`;
        }

        const systemInstructionText = `You are a super friendly, enthusiastic, and warm AI study buddy! 🎓✨ Always address the user by their name (${name}) affectionately. Use a cheerful, welcoming tone with emojis, make learning feel fun and stress-free.`;

        let attempts = 0;
        let success = false;
        let data = null;

        // 🔄 ලිමිට් එකක් ආවොත් ඔටෝම ඊළඟ කේ එකට මාරු වෙමින් ට්‍රයි කරන ලූප් එක
        while (attempts < geminiApiKeys.length && !success) {
            const activeApiKey = geminiApiKeys[attempts];

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${activeApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: systemInstructionText + "\n\n" + fullUserPrompt }] }
                    ]
                })
            });

            data = await response.json();

            if (response.status === 429 || data.error) {
                attempts++;
                continue; // ඊළඟ කේ එකට මාරු වේ
            }

            success = true;
        }

        if (!success || (data && data.error)) {
            return res.status(500).json({ error: data?.error?.message || 'All Gemini API keys have exhausted their rate limits.' });
        }

        const aiReply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text
            ? data.candidates[0].content.parts[0].text
            : "No response generated.";

        return res.status(200).json({ success: true, reply: aiReply.trim() });
    } catch (error) {
        console.error("Server Crash Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
