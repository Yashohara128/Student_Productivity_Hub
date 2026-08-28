export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required for humanizing' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel Environment Variables' });
        }

        const systemInstructionText = "You are an expert human writer and editor. Rewrite the given text to sound 100% natural, human-written, engaging, and undetectable by AI detectors, while strictly retaining the original academic meaning. Output ONLY the final humanized text paragraph.";

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemInstructionText + "\n\n" + text }] }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini Humanizer Error Detail:", data.error);
            return res.status(500).json({ error: data.error.message || 'Gemini API Error' });
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
