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

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GROQ_API_KEY is not set in environment variables' });
        }

        // Groq API Endpoint (Using Llama 3.3 - Blazing fast & High Quality)
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        const prompt = `Act as an expert human academic researcher, author, and senior editor. Completely rewrite the following text to make it 100% human-authored, highly engaging, and completely undetectable by AI detectors like Turnitin, GPTZero, and Copyleaks.

CRITICAL REWRITING RULES:
1. **High Burstiness:** Intentionally vary sentence lengths dramatically. Mix very short, punchy statements with long, complex, multi-clause academic sentences.
2. **High Perplexity:** Avoid predictable AI phrasing, robotic transitions, and cliches. Use rich, nuanced, and idiomatic academic vocabulary.
3. **Cognitive Variance:** Introduce natural human imperfections in thought flow.
4. **Zero AI Footprint:** Ensure the structure looks like it was written by an exhausted university professor or a brilliant graduate student late at night.

Text to humanize:
${text}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.9
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: data.error.message || 'Groq API returned an error' });
        }

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            const humanizedResult = data.choices[0].message.content.trim();
            return res.status(200).json({ result: humanizedResult });
        } else {
            return res.status(500).json({ error: 'API structure error: ' + JSON.stringify(data) });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
