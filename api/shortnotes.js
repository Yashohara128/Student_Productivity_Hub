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

        // 🟢 ස්ටේබල් සහ වේගවත්ම Flash මොඩල් ප්‍රධාන තුනක් (Limit මඟහරවා ගැනීමට)
        const modelsToTry = [
            'gemini-3.6-flash',
            'gemini-3.7-flash',
            'gemini-3.5-flash'
        ];

        const systemInstructionText = "You are an expert academic assistant. Generate well-structured, comprehensive academic short notes with key definitions, core concepts, bullet points, comparative tables, and Mermaid.js diagrams for a university student. Output ONLY the final structured notes.";
        
        const fullUserPrompt = `Source Text:\n${text.slice(0, 15000)}\n\nInstructions: ${prompt || "Generate short notes."}`;

        let success = false;
        let data = null;
        let lastError = null;

        // මොඩල් සහ කීස් මාරුවෙන් මාරුවට චෙක් කරමින් ඉක්මනින් රිසල්ට් එක ලබා ගැනීම
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

                    // ලિમිට් හෝ හයි ඩිමාන්ඩ් එරර් එකක් ආවොත් ඊළඟ කී එකට හෝ මොඩල් එකට ක්ෂණිකව මාරු වේ
                    if (response.status !== 200 || data.error) {
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
            return res.status(500).json({ error: lastError || 'All models and API keys have exhausted their rate limits or are experiencing high demand.' });
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
