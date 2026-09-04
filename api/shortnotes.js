export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, prompt } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        const geminiApiKeys = [
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3,
            process.env.GEMINI_API_KEY
        ].filter(Boolean);

        if (geminiApiKeys.length === 0) {
            return res.status(500).json({ error: 'Gemini API Keys are missing in Vercel Environment Variables' });
        }

        // 🟢 හරියටම බැලන්ස් එකට වැඩ කරන ස්ථාවර මෝඩල් 2ක් පමණක් (Limit සහ Timeout මඟහරවා ගැනීමට)
        const modelsToTry = [
            'gemini-3.8-flash',
            'gemini-3.7-flash',
        ];

        const systemInstructionText = "You are an expert academic assistant. Generate well-structured, clear, and comprehensive short notes based on the provided text, including key definitions, core concepts, bullet points, comparative tables, and Mermaid.js diagrams where applicable. Output ONLY the final structured notes.";
        
        const fullUserPrompt = `Source Text:\n${text.slice(0, 15000)}\n\nInstructions: ${prompt || "Generate short notes."}`;

        let success = false;
        let data = null;
        let lastError = null;

        for (const model of modelsToTry) {
            if (success) break;
            for (const apiKey of geminiApiKeys) {
                if (success) break;

                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [
                                { role: "user", parts: [{ text: systemInstructionText + "\n\n" + fullUserPrompt }] }
                            ]
                        })
                    });

                    data = await response.json();

                    if (!response.ok || data.error) {
                        lastError = data?.error?.message || `Model ${model} failed.`;
                        continue; 
                    }

                    success = true;
                } catch (err) {
                    lastError = err.message;
                    continue;
                }
            }
        }

        if (!success || (data && data.error)) {
            return res.status(500).json({ error: lastError || 'All models and API keys have exhausted their rate limits.' });
        }

        const notesResult = data.candidates?.[0]?.content?.parts?.[0]?.text
            ? data.candidates[0].content.parts[0].text.trim()
            : "No notes generated.";

        return res.status(200).json({ success: true, result: notesResult });
    } catch (error) {
        console.error("Gemini Short Notes Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
