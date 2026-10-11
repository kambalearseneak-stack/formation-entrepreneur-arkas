// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://kdhchzkurngbgynpytrh.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_atCUDbOqr6Cn9iDxSKbrWQ_w2sa0j_1';

// Initialisation de Supabase
const supabaseClient = (window.supabase && SUPABASE_URL) 
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
    : null;

// Fonction pour enregistrer la réflexion personnelle en privé dans Supabase
async function saveReflectionToSupabase(questionText, answerText) {
    if (!supabaseClient) {
        console.log("Supabase n'est pas initialisé.");
        alert("Réponse enregistrée localement (mode simulation).");
        return;
    }

    const { data, error } = await supabaseClient
        .from('user_reflections')
        .insert([{ 
            question: questionText, 
            answer: answerText, 
            created_at: new Date() 
        }]);

    if (error) {
        console.error("Erreur lors de l'enregistrement dans Supabase :", error.message);
        alert("Erreur lors de l'enregistrement privé.");
    } else {
        console.log("Réponse enregistrée avec succès en privé !", data);
        alert("Votre réflexion a été enregistrée en toute confidentialité !");
    }
}

// --- GESTION DE LA NAVIGATION ---
function switchSection(sectionId, event) {
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(sec => sec.classList.remove('active'));

    const buttons = document.querySelectorAll('nav button');
    buttons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');
    
    if (event && event.target.tagName === 'BUTTON') {
        event.target.classList.add('active');
    }
}

// --- GESTION DU CHAT IA ---
function sendMessage() {
    const input = document.getElementById('userInput');
    const messagesContainer = document.getElementById('chatMessages');
    
    if (input.value.trim() === '') return;

    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = input.value;
    messagesContainer.appendChild(userMsg);

    const userText = input.value;
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'message ai';
        aiMsg.textContent = "J'analyse votre question (\"" + userText + "\"). En tant qu'Arcas Assistance IA, je vous suggère d'appliquer les méthodologies vues dans vos modules de formation pour structurer cette démarche.";
        messagesContainer.appendChild(aiMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// --- GESTION DES QUESTIONS DE RÉFLEXION PERSONNELLE ---
const reflectionData = [
    {
        question: "Quel problème majeur du marché votre entreprise résout-elle concrètement pour vos futurs clients ?"
    },
    {
        question: "Quelles sont les trois prochaines actions prioritaires que vous devez mener cette semaine pour avancer ?"
    }
];

let currentReflectionIndex = 0;

function startReflection() {
    document.getElementById('formation-menu').style.display = 'none';
    document.getElementById('reflection-box').style.display = 'block';
    currentReflectionIndex = 0;
    loadReflectionQuestion();
}

function loadReflectionQuestion() {
    if (currentReflectionIndex < reflectionData.length) {
        const q = reflectionData[currentReflectionIndex];
        document.getElementById('reflection-title').textContent = `Réflexion - Question ${currentReflectionIndex + 1} sur ${reflectionData.length}`;
        document.getElementById('reflection-question').textContent = q.question;
        document.getElementById('reflection-input').value = '';
    } else {
        document.getElementById('reflection-title').textContent = "Exercice Terminé 🎯";
        document.getElementById('reflection-question').textContent = "Vous avez complété toutes les questions de réflexion pour ce module.";
        document.getElementById('reflection-input').style.display = 'none';
        document.querySelector('#reflection-box button').style.display = 'none';
        document.getElementById('reflection-back').style.display = 'inline-block';
    }
}

function saveReflectionAnswer() {
    const answerText = document.getElementById('reflection-input').value.trim();
    if (answerText === '') {
        alert("Veuillez écrire une réponse avant d'enregistrer.");
        return;
    }

    const currentQ = reflectionData[currentReflectionIndex].question;
    
    // Enregistrement privé dans Supabase
    saveReflectionToSupabase(currentQ, answerText);

    // Passer à la question suivante
    currentReflectionIndex++;
    loadReflectionQuestion();
}

function resetFormations() {
    document.getElementById('reflection-box').style.display = 'none';
    document.getElementById('formation-menu').style.display = 'grid';
    document.getElementById('reflection-back').style.display = 'none';
    document.getElementById('reflection-input').style.display = 'block';
    document.querySelector('#reflection-box button').style.display = 'inline-block';
}
