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

        // සේෆ්ටි ෆිල්ටර්ස් වලට නොසෑහෙන තරම් සරල සහ පැහැදිලි ඇකඩමික් ප්‍රොම්ට් එකක්
        const prompt = `Rewrite the following academic text to make it exceptionally natural, highly engaging, and written in a refined human scholarly tone with varied sentence structures and rich vocabulary. Also, include 2 to 3 professionally formatted academic sources (in APA 7th edition style) related to the topic at the very end under a "References" section.

Text to rewrite:
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
                temperature: 0.7
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
