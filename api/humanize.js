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
                        content: "You are an expert human writer and editor. Rewrite the given text to sound 100% natural, human-written, engaging, and undetectable by AI detectors, while strictly retaining the original academic meaning. CRITICAL INSTRUCTION: Do NOT output any thinking process, reasoning, markdown headers about steps, or <think> tags. Output ONLY the final humanized text paragraph."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq API Rate Limit Reached' });
        }

        let humanizedText = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : text;

        // 🟢 පවර්ෆුල් ක්ලීනර් මඟින් සියලුම thinking artifacts ඉවත් කිරීම
        humanizedText = humanizedText.replace(/<think>[\s\S]*?<\/think>/gi, '');
        humanizedText = humanizedText.replace(/Here'?s a thinking process:[\s\S]*?(?=\n\n|$)/gi, '');
        humanizedText = humanizedText.replace(/\*\*Analyze User Input:\*\*[\s\S]*?(?=\n\n|$)/gi, '');
        
        // මොඩල් එක කවදාවත් හිතන්නේ නැති විදිහට අන්तिम පැරග්‍රාෆ් එක හෝ පිරිසිදු ටෙක්ස්ට් එක පමණක් ලබා ගැනීම
        const cleanedParts = humanizedText.split(/(?:Refined for Academic Tone|Draft \d|Final check)/i);
        if (cleanedParts.length > 1) {
            humanizedText = cleanedParts[cleanedParts.length - 1];
        }

        humanizedText = humanizedText.trim();

        return res.status(200).json({ success: true, result: humanizedText });
    } catch (error) {
        console.error("Humanizer Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
