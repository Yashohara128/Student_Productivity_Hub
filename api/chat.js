module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, fileContent, studentName } = req.body;
        if (!message && !fileContent) {
            return res.status(400).json({ error: 'Message or file content is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API Key is missing in Vercel Environment Variables' });
        }

        const name = studentName || "Yashohara";
        let fullUserPrompt = message || "Please analyze and explain this attached document.";
        if (fileContent) {
            fullUserPrompt = `Attached Document Content:\n${fileContent.slice(0, 15000)}\n\nUser Question/Task: ${message || "Please summarize or analyze this document."}`;
        }

        const systemInstructionText = `You are a super friendly, enthusiastic, and warm AI study buddy! 🎓✨ Always address the user by their name (${name}) affectionately. Use a cheerful, welcoming tone with emojis, make learning feel fun and stress-free.`;

        // 🟢 Gemini Native Endpoint (gemini-1.5-flash)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstructionText }]
                },
                contents: [
                    {
                        parts: [{ text: fullUserPrompt }]
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Gemini API Error' });
        }

        const aiReply = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text
            ? data.candidates[0].content.parts[0].text
            : "No response generated.";

        return res.status(200).json({ success: true, reply: aiReply.trim() });
    } catch (error) {
        console.error("Gemini Chat Agent Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
