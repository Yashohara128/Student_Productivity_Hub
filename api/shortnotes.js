// ==========================================
// VERCEL FUNCTION: api/shortnotes.js (Groq AI with Safe Text Limiting)
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

        // Groq Free Tier Limit එක (8000 TPM) පැනර් නොසිටින්න ටෙක්ස්ට් එක අක්ෂර 20,000 කට (సుమారు 4000-5000 tokens) සීමා කිරීම
        const maxChars = 20000;
        const safeText = text.length > maxChars ? text.slice(0, maxChars) + "\n\n[Note: Text was automatically trimmed to fit free tier limits.]" : text;

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
                        content: "You are an expert academic assistant and professional note-taker. Create exceptionally well-structured, clear, and comprehensive academic short notes with key definitions, core concepts, bullet points, and important takeaways based on the provided lecture text."
                    },
                    {
                        role: "user",
                        content: `${prompt}\n\nStudy Material / Lecture Text:\n${safeText}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 3000
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq API Error' });
        }

        const notesResult = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : "No response generated.";

        return res.status(200).json({ success: true, result: notesResult });
    } catch (error) {
        console.error("Groq AI Server Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
