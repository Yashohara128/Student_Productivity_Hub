// ==========================================
// VERCEL FUNCTION: api/shortnotes.js (Groq AI)
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

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile", // 👈 මෙන්න මෙතන මොඩල් නම වෙනස් කළා
                messages: [
                    {
                        role: "system",
                        content: "You are an expert academic assistant and professional note-taker. Create exceptionally well-structured, clear, and comprehensive academic short notes with key definitions, core concepts, bullet points, and important takeaways based on the provided lecture text."
                    },
                    {
                        role: "user",
                        content: `${prompt}\n\nStudy Material / Lecture Text:\n${text}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
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
