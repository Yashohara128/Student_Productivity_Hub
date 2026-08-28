module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required for humanizing' });
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
                        content: "You are an expert human writer and editor. Rewrite the given text to sound 100% natural, human-written, engaging, and undetectable by AI detectors, while strictly retaining the original academic meaning. DO NOT output any thinking process or preamble, output ONLY the humanized text."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000 // 🟢 ටෝකන් ඉතිරි කර ගැනීමට 1000 දක්වා අඩු කර ඇත
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq API Rate Limit Reached' });
        }

        let humanizedText = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : text;

        humanizedText = humanizedText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        return res.status(200).json({ success: true, result: humanizedText });
    } catch (error) {
        console.error("Humanizer Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
