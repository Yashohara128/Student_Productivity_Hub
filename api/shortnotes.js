// ==========================================
// VERCEL FUNCTION: api/shortnotes.js (Fixed Token Limit)
// ==========================================

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, prompt } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return res.status(500).json({ error: 'Groq API Key is missing in Vercel Environment Variables' });
        }

        const maxChars = 50000;
        const safeText = text.length > maxChars ? text.slice(0, maxChars) + "\n\n[Note: Text was automatically trimmed.]" : text;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen/qwen3.6-27b",
                messages: [
                    {
                        role: "system",
                        content: "You are an elite academic professor and professional note-taker. Generate exceptionally structured, comprehensive academic short notes directly without truncation, incorporating clear headings (#, ##), bold keywords (**), bullet points, and Markdown tables (| Column 1 | Column 2 |) for comparative data."
                    },
                    {
                        role: "user",
                        content: `${prompt}\n\nStudy Material / Lecture Text:\n${safeText}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 16384 // 🟢 Token සීමාව වැඩි කළා (Thinking + Full Notes සඳහා ප්‍රමාණවත් වන පරිදි)
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq API Error' });
        }

        let notesResult = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : "No response generated.";

        // <think> ටැග්ස් සහ ඇතුළේ තියෙන ටෙක්ස්ට් සම්පූර්ණයෙන්ම ඉවත් කිරීම
        notesResult = notesResult.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        return res.status(200).json({ success: true, result: notesResult });

    } catch (error) {
        console.error("Groq AI Server Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
