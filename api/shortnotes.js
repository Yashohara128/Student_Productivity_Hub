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
            process.env.GEMINI_API_KEY_3
        ].filter(Boolean);

        if (geminiApiKeys.length === 0) {
            return res.status(500).json({ error: 'Gemini API Keys are missing in Vercel Environment Variables' });
        }

        const systemInstructionText = "You are an expert academic assistant. Generate well-structured, clear, and comprehensive short notes based on the provided text, including key definitions, core concepts, bullet points, and comparative tables where applicable. Output ONLY the final structured notes.";
        
        const fullUserPrompt = `Source Text:\n${text.slice(0, 15000)}\n\nInstructions: ${prompt || "Generate short notes."}`;

        let attempts = 0;
        let success = false;
        let data = null;

        while (attempts < geminiApiKeys.length && !success) {
            const activeApiKey = geminiApiKeys[attempts];

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${activeApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: systemInstructionText + "\n\n" + fullUserPrompt }] }
                    ]
                })
            });

            data = await response.json();

            if (response.status === 429 || data.error) {
                attempts++;
                continue;
            }

            success = true;
        }

        if (!success || (data && data.error)) {
            return res.status(500).json({ error: data?.error?.message || 'All Gemini API keys have exhausted their rate limits.' });
        }

        const notesResult = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text
            ? data.candidates[0].content.parts[0].text.trim()
            : "No notes generated.";

        return res.status(200).json({ success: true, result: notesResult });
    } catch (error) {
        console.error("Gemini Short Notes Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
