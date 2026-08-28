module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
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
                        content: "You are an elite, friendly, and student-friendly AI Study Assistant. You can converse in any language (Sinhala, Tamil, English, etc.) and help students solve academic tasks, code debugging, explanations, and general questions. Be clear, precise, and supportive."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq API Error' });
        }

        let aiReply = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : "No response generated.";

        aiReply = aiReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        return res.status(200).json({ success: true, reply: aiReply });
    } catch (error) {
        console.error("AI Agent Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
