export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required for humanizing' });
        }

        const geminiApiKeys = [
            process.env.GEMINI_API_KEY_1,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3
        ].filter(Boolean);

        if (geminiApiKeys.length === 0) {
            return res.status(500).json({ error: 'Gemini API Keys are missing in Vercel Environment Variables' });
        }

        const systemInstructionText = "You are an expert human writer and editor. Rewrite the given text to sound 100% natural, human-written, engaging, and undetectable by AI detectors, while strictly retaining the original academic meaning. Output ONLY the final humanized text paragraph.";

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
                        { role: "user", parts: [{ text: systemInstructionText + "\n\n" + text }] }
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

        const humanizedText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text
            ? data.candidates[0].content.parts[0].text.trim()
            : text;

        return res.status(200).json({ success: true, result: humanizedText });
    } catch (error) {
        console.error("Gemini Humanizer Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
