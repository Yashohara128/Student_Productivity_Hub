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

        const url = 'https://api.groq.com/openai/v1/chat/completions';

       const prompt = `Act as an exhausted human university literature student writing a rough draft late at night. Completely rewrite the following text so it sounds completely unpolished, highly erratic, and 100% human. 

CRITICAL RULES TO AVOID AI DETECTORS:
1. **Extreme Burstiness:** Make sentence lengths completely chaotic. Follow a massive, winding, multi-clause academic sentence with a very short, blunt, 3-word sentence.
2. **Imperfect Flow:** Use conversational human transitions, occasional slight informal phrasing, and non-robotic flow. Avoid all standard AI transition words (like "Furthermore", "In conclusion", "Moreover", "It is important to note").
3. **High Perplexity:** Use unique, vivid, and highly descriptive vocabulary that a real human author would use instead of generic AI words.

Text to humanize:
${text}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b",
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
