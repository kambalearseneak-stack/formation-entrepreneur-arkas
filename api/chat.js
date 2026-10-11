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

        // Construire l'historique au format de la nouvelle API
        const input = [];

        // Ajouter le contexte système
        input.push({
            type: 'user_input',
            content: [{
                type: 'text',
                text: `Tu es l'assistant IA d'Arkas, une plateforme d'accompagnement entrepreneurial destinée aux entrepreneurs francophones.

Ton rôle :
- Aider les entrepreneurs à développer leur projet
- Répondre en français, de manière claire et structurée
- Donner des conseils concrets et actionnables
- Utiliser des listes et émojis pour la lisibilité
- Être bienveillant, encourageant et professionnel

Réponds toujours en français.`
            }]
        });

        // Ajouter l'historique si fourni
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                input.push({
                    type: 'user_input',
                    content: [{ type: 'text', text: msg.role === 'user' ? msg.text : '' }]
                });
                if (msg.role === 'model') {
                    input.push({
                        type: 'model_output',
                        content: [{ type: 'text', text: msg.text }]
                    });
                }
            });
        }

        // Ajouter le message actuel
        input.push({
            type: 'user_input',
            content: [{ type: 'text', text: message }]
        });

        // Appel à la NOUVELLE API
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/interactions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify({
                    model: 'gemini-1.5-flash',
                    input: input
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

        // Extraire la réponse (nouveau format : steps[].content[].text)
        let reply = 'Désolé, je n\'ai pas pu générer de réponse.';
        
        if (data.steps && Array.isArray(data.steps)) {
            // Trouver l'étape de type model_output
            const modelOutput = data.steps.find(step => step.type === 'model_output');
            if (modelOutput && modelOutput.content && modelOutput.content[0]) {
                reply = modelOutput.content[0].text || reply;
            }
        }

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur',
            details: error.message 
        });
    }
}
