module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not set in environment variables' });
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const prompt = `Act as an expert human academic researcher, author, and senior editor. Completely rewrite the following text to make it 100% human-authored, highly engaging, and completely undetectable by AI detectors like Turnitin, GPTZero, and Copyleaks.

CRITICAL REWRITING RULES:
1. **High Burstiness:** Intentionally vary sentence lengths dramatically. Mix very short, punchy statements with long, complex, multi-clause academic sentences.
2. **High Perplexity:** Avoid predictable AI phrasing, robotic transitions (like "furthermore", "consequently", "in conclusion"), and cliches. Use rich, nuanced, and idiomatic academic vocabulary.
3. **Cognitive Variance:** Introduce natural human imperfections in thought flow—such as shifting perspectives slightly, adding subtle analytical commentary, or phrasing arguments from a unique researcher's viewpoint.
4. **Zero AI Footprint:** Ensure the structure looks like it was written by an exhausted university professor or a brilliant graduate student late at night, completely devoid of AI formatting patterns.

Text to humanize:
${text}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topP: 0.95,
                    topK: 40
                }
            })
        });

        const data = await response.json();
        console.log("Gemini API Response:", JSON.stringify(data));

        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Gemini API returned an error' });
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
            const humanizedResult = data.candidates[0].content.parts[0].text.trim();
            return res.status(200).json({ result: humanizedResult });
        } else {
            return res.status(500).json({ error: 'Gemini API structure error: ' + JSON.stringify(data) });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
