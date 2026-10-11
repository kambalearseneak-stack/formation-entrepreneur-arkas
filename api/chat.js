export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message manquant' });
        }

        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Clé API non configurée sur le serveur' });
        }

        const contents = [];

        contents.push({
            role: 'user',
            parts: [{ text: `Tu es l'assistant IA d'Arkas, une plateforme d'accompagnement entrepreneurial destinée aux entrepreneurs francophones.

Ton rôle :
- Aider les entrepreneurs à développer leur projet
- Répondre en français, de manière claire et structurée
- Donner des conseils concrets et actionnables
- Utiliser des listes et émojis pour la lisibilité
- Être bienveillant, encourageant et professionnel

Réponds toujours en français.` }]
        });

        contents.push({
            role: 'model',
            parts: [{ text: "Compris ! Je suis prêt à aider les entrepreneurs." }]
        });

        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                });
            });
        }

        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // ✅ MODÈLE MIS À JOUR : gemini-3.8-flash
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 1000,
                        topP: 0.95,
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Erreur Gemini:', JSON.stringify(data));
            return res.status(500).json({ 
                error: 'Erreur de l\'IA', 
                details: data.error?.message || 'Erreur inconnue' 
            });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                     'Désolé, je n\'ai pas pu générer de réponse.';

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur',
            details: error.message 
        });
    }
}
