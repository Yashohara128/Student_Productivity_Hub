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

        const model = 'gemini-3.5-flash';
        const systemInstruction = "You are an expert academic assistant. Generate well-structured, clear, and comprehensive short notes based on the provided text, including key definitions, core concepts, bullet points, comparative tables, and Mermaid.js diagrams inside ```mermaid ... ``` blocks where applicable. Output ONLY the final structured notes.";
        
        const truncatedText = String(text).slice(0, 4000);

        // සියලුම කීස් එකවර සමාන්තරව (Parallel) යැවීම මඟින් Vercel Timeout (10s) සම්පූර්ණයෙන්ම මඟහරවා ගැනීම
        const requests = geminiApiKeys.map(apiKey => 
            fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: systemInstruction + "\n\nSource Text:\n" + truncatedText + "\n\nInstructions: " + (prompt || "Generate short notes.") }] }
                    ]
                })
            }).then(async apiRes => {
                const responseData = await apiRes.json();
                if (!apiRes.ok || responseData.error) {
                    throw new Error(responseData?.error?.message || 'API request failed');
                }
                return responseData;
            })
        );

        let data;
        try {
            data = await Promise.any(requests);
        } catch (aggregateError) {
            return res.status(500).json({ error: 'All API keys failed or hit rate limits simultaneously.' });
        }

        const notesResult = data.candidates?.[0]?.content?.parts?.[0]?.text
            ? data.candidates[0].content.parts[0].text.trim()
            : "No notes generated.";

        return res.status(200).json({ success: true, result: notesResult });
    } catch (error) {
        console.error("Short Notes Fatal Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error occurred." });
    }
}
