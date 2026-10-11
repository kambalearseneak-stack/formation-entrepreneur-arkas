// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://kdhchzkurngbgynpytrh.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_atCUDbOqr6Cn9iDxSKbrWQ_w2sa0j_1';

// Initialisation de Supabase
const supabaseClient = (window.supabase && SUPABASE_URL) 
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
    : null;

// Chargement initial des données dynamiques (likes et commentaires) au démarrage
document.addEventListener("DOMContentLoaded", () => {
    loadResourceStats('pdf1');
    loadResourceStats('vid1');
});

// --- GESTION DES LIKES ET COMMENTAIRES CONNECTÉS À SUPABASE ---
async function loadResourceStats(itemId) {
    if (!supabaseClient) return;

    // Charger les likes
    const { data: likeData } = await supabaseClient
        .from('resource_likes')
        .select('likes_count')
        .eq('resource_id', itemId)
        .single();
    
    if (likeData) {
        document.getElementById(`likes-${itemId}`).textContent = likeData.likes_count;
    }

    // Charger les commentaires
    const { data: commentsData } = await supabaseClient
        .from('resource_comments')
        .select('*')
        .eq('resource_id', itemId)
        .order('created_at', { ascending: true });

    if (commentsData && commentsData.length > 0) {
        const list = document.getElementById(`comments-list-${itemId}`);
        list.innerHTML = '';
        commentsData.forEach(c => {
            const newP = document.createElement('p');
            newP.style.margin = "4px 0";
            newP.style.background = "rgba(255,255,255,0.03)";
            newP.style.padding = "6px";
            newP.style.borderRadius = "4px";
            newP.innerHTML = `💬 <em>Membre :</em> ${c.comment_text}`;
            list.appendChild(newP);
        });
    }
}

async function likeItem(itemId) {
    const span = document.getElementById(`likes-${itemId}`);
    let currentLikes = parseInt(span.textContent) + 1;
    span.textContent = currentLikes;

    if (!supabaseClient) return;

    // Mise à jour ou insertion du like dans Supabase
    const { error } = await supabaseClient
        .from('resource_likes')
        .upsert({ resource_id: itemId, likes_count: currentLikes, updated_at: new Date() }, { onConflict: 'resource_id' });

    if (error) {
        console.error("Erreur mise à jour like :", error.message);
    }
}

async function addComment(itemId) {
    const input = document.getElementById(`comment-${itemId}`);
    const commentText = input.value.trim();
    if (commentText === '') return;

    // Affichage immédiat local
    const list = document.getElementById(`comments-list-${itemId}`);
    const newP = document.createElement('p');
    newP.style.margin = "4px 0";
    newP.style.background = "rgba(255,255,255,0.03)";
    newP.style.padding = "6px";
    newP.style.borderRadius = "4px";
    newP.innerHTML = `💬 <em>Vous :</em> ${commentText}`;
    list.appendChild(newP);
    input.value = '';

    if (!supabaseClient) return;

    // Enregistrement dans Supabase
    const { error } = await supabaseClient
        .from('resource_comments')
        .insert([{ resource_id: itemId, comment_text: commentText, created_at: new Date() }]);

    if (error) {
        console.error("Erreur enregistrement commentaire :", error.message);
    }
}

// --- ENREGISTREMENT DES RÉFLEXIONS PERSONNELLES (PRIVÉ) ---
async function saveReflectionToSupabase(questionText, answerText) {
    if (!supabaseClient) {
        alert("Réponse enregistrée localement (mode simulation).");
        return;
    }

    const { error } = await supabaseClient
        .from('user_reflections')
        .insert([{ question: questionText, answer: answerText, created_at: new Date() }]);

    if (error) {
        console.error("Erreur Supabase :", error.message);
    } else {
        alert("Votre réflexion a été enregistrée en toute confidentialité !");
    }
}

// --- ENREGISTREMENT DES NOTES DU CARNET DE BORD (PRIVÉ) ---
async function saveUserNote() {
    const noteText = document.getElementById('noteInput').value.trim();
    if (noteText === '') {
        alert("Veuillez écrire une note avant d'enregistrer.");
        return;
    }

    if (!supabaseClient) {
        alert("Note enregistrée localement (mode simulation).");
        document.getElementById('noteInput').value = '';
        return;
    }

    const { error } = await supabaseClient
        .from('user_notes')
        .insert([{ note: noteText, created_at: new Date() }]);

    if (error) {
        console.error("Erreur Supabase :", error.message);
    } else {
        alert("Votre note a été enregistrée en privé avec succès !");
        document.getElementById('noteInput').value = '';
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
    { question: "Quel problème majeur du marché votre entreprise résout-elle concrètement pour vos futurs clients ?" },
    { question: "Quelles sont les trois prochaines actions prioritaires que vous devez mener cette semaine pour avancer ?" }
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
    saveReflectionToSupabase(currentQ, answerText);

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
