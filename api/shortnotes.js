export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const text = bodyData?.text;
        const prompt = bodyData?.prompt;

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

        const modelsToTry = [
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.6-flash',
            'gemini-3.5-flash'
        ];

        // 🟢 මොඩල් සහ කීස් එකතු කර සාදාගත් ප්‍රියෝරිටි ලිස්ට් එකෙන් උපරිම උත්සාහයන් 3ක් පමණක් තෝරා ගැනීම (Timeout මඟහරවා ගැනීමට)
        const requestPool = [];
        for (const model of modelsToTry) {
            for (const apiKey of geminiApiKeys) {
                requestPool.push({ model, apiKey });
            }
        }
        const topTries = requestPool.slice(0, 3);

        const systemInstructionText = `You are an expert academic assistant. Generate well-structured, clear, and comprehensive short notes based on the provided text, including key definitions, core concepts, bullet points, comparative tables, and Mermaid.js diagrams where applicable. Output ONLY the final structured notes.`;
        
        const fullUserPrompt = `Source Text:\n${String(text).slice(0, 15000)}\n\nInstructions: ${prompt || "Generate short notes."}`;

        let success = false;
        let responseData = null;
        let lastError = null;

        for (const { model, apiKey } of topTries) {
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

                const rawText = await response.text();
                try {
                    responseData = JSON.parse(rawText);
                } catch (e) {
                    lastError = "Invalid JSON response from Google API";
                    continue;
                }

                if (!response.ok || responseData.error) {
                    lastError = responseData?.error?.message || `Model ${model} failed.`;
                    continue; 
                }

                success = true;
            } catch (err) {
                lastError = err.message;
                continue;
            }
        }

        if (!success || !responseData || responseData.error) {
            return res.status(500).json({ error: lastError || 'All fallback attempts have failed or exhausted rate limits.' });
        }

        const notesResult = responseData.candidates?.[0]?.content?.parts?.[0]?.text
            ? responseData.candidates[0].content.parts[0].text.trim()
            : "No notes generated.";

        return res.status(200).json({ success: true, result: notesResult });
    } catch (error) {
        console.error("Gemini Short Notes Fatal Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error occurred." });
    }
}
