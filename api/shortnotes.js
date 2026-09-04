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
            'gemini-3.7-flash'
        ];

        // කීස් සහ මොඩල්ස් සියල්ල එක්කෝට් කරමින් පූල් එකක් සකස් කිරීම
        const requestPool = [];
        for (const model of modelsToTry) {
            for (const apiKey of geminiApiKeys) {
                requestPool.push({ model, apiKey });
            }
        }

        const systemInstructionText = `You are an expert academic assistant. Generate well-structured, clear, and comprehensive short notes based on the provided text, including key definitions, core concepts, bullet points, comparative tables, and Mermaid.js diagrams where applicable. Output ONLY the final structured notes.`;
        
        const fullUserPrompt = `Source Text:\n${String(text).slice(0, 15000)}\n\nInstructions: ${prompt || "Generate short notes."}`;

        let success = false;
        let responseData = null;
        let lastError = null;

        for (const { model, apiKey } of requestPool) {
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

                // High Demand (429) හෝ Resource Exhausted එරර් එකක් ආවොත් ස්වයංක්‍රීයව ඊළඟ කී එකට/මොඩල් එකට පැනීම
                if (!response.ok || responseData.error) {
                    const errMessage = responseData?.error?.message || '';
                    const errStatus = response.status;
                    
                    if (errStatus === 429 || errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('high demand') || errMessage.includes('overloaded')) {
                        lastError = `Model ${model} overloaded (High Demand). Switching fallback...`;
                        continue; // ඊළඟ කී එකට හෝ මොඩල් එකට යයි
                    }

                    lastError = errMessage || `Model ${model} failed.`;
                    continue; 
                }

                success = true;
            } catch (err) {
                lastError = err.message;
                continue;
            }
        }

        if (!success || !responseData || responseData.error) {
            return res.status(500).json({ error: lastError || 'All models and API keys are currently experiencing high demand. Please try again in a few seconds.' });
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
