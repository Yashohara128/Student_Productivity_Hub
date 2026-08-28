// ==========================================
// VERCEL FUNCTION: api/humanize.js (Groq AI)
// ==========================================

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
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
                model: "qwen/qwen3.6-27b",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert human writer and professional editor. Rewrite the given AI or robotic academic text into a 100% natural, fluent, human-like academic tone while preserving the core meaning and avoiding any AI detection patterns."
                    },
                    {
                        role: "user",
                        content: `Humanize this text:\n\n${text}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq AI Error' });
        }

        const resultText = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : text;

        return res.status(200).json({ success: true, result: resultText });
    } catch (error) {
        console.error("Groq Humanizer Server Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
