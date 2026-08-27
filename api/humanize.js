const prompt = `Completely rewrite and reimagine the following text as if a human university student wrote it in a rushed, highly engaging, and slightly imperfect essay style.

CRITICAL RULES TO BYPASS AI DETECTORS:
1. **Extreme Burstiness:** Make sentence lengths wildly chaotic. Mix an extremely short, punchy 4-word sentence with a long, winding, multi-clause academic sentence. 
2. **Zero AI Cliche Words:** Strictly ban all typical AI transition words like "Furthermore", "Moreover", "In conclusion", "It is important to note", "Delve", "Tapestry". Use natural, human-like connective thoughts.
3. **Irregular Rhythm:** Avoid a uniform, predictable rhythm. Make the flow feel human, organic, and slightly unpredictable.

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
