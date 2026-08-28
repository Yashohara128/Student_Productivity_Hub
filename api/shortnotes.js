export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, prompt } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text content is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel Environment Variables' });
        }

        const systemInstructionText = "You are an expert academic assistant. Generate well-structured, clear, and comprehensive short notes based on the provided text, including key definitions, core concepts, bullet points, and comparative tables where applicable. Output ONLY the final structured notes.";
        
        const fullUserPrompt = `Source Text:\n${text.slice(0, 15000)}\n\nInstructions: ${prompt || "Generate short notes."}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemInstructionText + "\n\n" + fullUserPrompt }] }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini Short Notes Error Detail:", data.error);
            return res.status(500).json({ error: data.error.message || 'Gemini API Error' });
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
