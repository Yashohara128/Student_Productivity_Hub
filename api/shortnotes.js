// ==========================================
// VERCEL FUNCTION: api/shortnotes.js (Strict Output Cleaner)
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

        const maxChars = 15000;
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
                        content: "You are an elite academic professor and professional note-taker. DO NOT output any internal monologue, reasoning, planning, or thinking process. Output ONLY the final structured academic short notes starting directly with the main heading (#), incorporating headings, bold keywords (**), bullet points, and Markdown tables."
                    },
                    {
                        role: "user",
                        content: `${prompt}\n\nStudy Material / Lecture Text:\n${safeText}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 2500
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq API Error' });
        }

        let notesResult = data.choices && data.choices[0] && data.choices[0].message 
            ? data.choices[0].message.content 
            : "No response generated.";

        // 1. <think> ටැග්ස් සම්පූර්ණයෙන්ම ඉවත් කිරීම
        notesResult = notesResult.replace(/<think>[\s\S]*?<\/think>/gi, '');

        // 2. ටැග්ස් නොදා "Here's a thinking process:" වගේ ඒවා ආවොත් ඒවා සහ මැද තියෙන අනවශ්‍ය ඇනලයිසින් කොටස් ඉවත් කර හැරීම
        notesResult = notesResult.replace(/Here'?s a thinking process:[\s\S]*?(?=# |\*\*|$)/i, '');

        // 3. මුලින් තියෙන හිස් අවකාශ පිරිසිදු කිරීම
        notesResult = notesResult.trim();

        return res.status(200).json({ success: true, result: notesResult });

    } catch (error) {
        console.error("Groq AI Server Error:", error);
        return res.status(500).json({ error: error.message });
    }
};
