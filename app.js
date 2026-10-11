// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'VOTRE_URL_SUPABASE'; // Remplacez par votre URL si nécessaire
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_SUPABASE'; // Remplacez par votre clé si nécessaire

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// --- GESTION DES ONGLETS ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
    });
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const activeTab = document.getElementById(tabId);
    if (activeTab) activeTab.classList.add('active');

    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- SYSTEME D'AUTHENTIFICATION (Connexion / Inscription) ---
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session ? session.user : null;
    renderAuthUI();
}

function renderAuthUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (currentUser) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; font-size: 14px;">
                <span><i class="fa-solid fa-user-check" style="color: #22c55e;"></i> ${currentUser.email}</span>
                <button onclick="handleLogout()" class="btn-primary" style="padding: 6px 12px; font-size: 12px;">Déconnexion</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="auth-box-inline">
                <input type="email" id="auth-email" placeholder="Email...">
                <input type="password" id="auth-password" placeholder="Mot de passe...">
                <button onclick="handleLogin()" class="btn-primary" style="padding: 6px 12px; font-size: 13px;">Connexion</button>
                <button onclick="handleSignup()" class="btn-save" style="padding: 6px 12px; font-size: 13px;">S'inscrire</button>
            </div>
        `;
    }
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return alert("Veuillez remplir l'email et le mot de passe.");

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Erreur de connexion : " + error.message);
    else {
        alert("Connexion réussie !");
        checkAuth();
    }
}

async function handleSignup() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return alert("Veuillez remplir l'email et le mot de passe.");

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Erreur d'inscription : " + error.message);
    else {
        alert("Inscription réussie ! Vérifiez vos emails si une confirmation est requise, ou connectez-vous.");
        checkAuth();
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    renderAuthUI();
    alert("Déconnecté avec succès.");
}

// --- REFLEXIONS PRIVEES ---
async function saveReflection(fieldId, questionLabel) {
    if (!currentUser) return alert("Veuillez vous connecter ou vous inscrire en haut de la page pour enregistrer vos réflexions en privé.");

    const answerText = document.getElementById(fieldId).value;
    if (!answerText.trim()) return alert("Veuillez écrire une réponse avant d'enregistrer.");

    const { error } = await supabaseClient
        .from('user_reflections')
        .insert([{ user_id: currentUser.id, question: questionLabel, answer: answerText }]);

    if (error) alert("Erreur lors de l'enregistrement : " + error.message);
    else alert("Réflexion enregistrée avec succès dans votre espace privé !");
}

// --- ASSISTANT IA SIMULE / ACTIF ---
function handleChatKey(event) {
    if (event.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
    const input = document.getElementById('user-input');
    const box = document.getElementById('chat-box');
    const text = input.value.trim();
    if (!text) return;

    // Afficher message utilisateur
    box.innerHTML += `
        <div class="chat-message user">
            <p>${text}</p>
        </div>
    `;
    input.value = '';
    box.scrollTop = box.scrollHeight;

    // Réponse intelligente de l'assistant Arkas
    setTimeout(() => {
        let reply = "C'est une excellente question pour votre projet. Pour structurer cela, commencez par identifier clairement la valeur unique que vous apportez à vos clients.";
        const lower = text.toLowerCase();
        
        if (lower.includes('financement') || lower.includes('argent') || lower.includes('capital')) {
            reply = "Pour trouver des financements, vous pouvez explorer le bootstrapping, les business angels locaux, ou préparer un dossier solide pour les institutions partenaires d'Arkas.";
        } else if (lower.includes('client') || lower.includes('marche') || lower.includes('vente')) {
            reply = "L'etude de marché passe par l'écoute active. Allez directement à la rencontre de 10 clients potentiels cette semaine pour valider leur besoin réel.";
        }

        box.innerHTML += `
            <div class="chat-message bot">
                <i class="fa-solid fa-robot"></i>
                <p>${reply}</p>
            </div>
        `;
        box.scrollTop = box.scrollHeight;
    }, 800);
}

// --- LIKES ET COMMENTAIRES PUBLICS ---
async function likeResource(resourceId) {
    // Simple compteur dynamique local ou Supabase
    const span = document.getElementById(`likes-${resourceId}`);
    let current = parseInt(span.innerText) || 0;
    current++;
    span.innerText = current;

    await supabaseClient
        .from('resource_likes')
        .upsert({ resource_id: resourceId, likes_count: current }, { onConflict: 'resource_id' });
}

async function addComment(resourceId) {
    const input = document.getElementById(`comment-${resourceId}`);
    const text = input.value.trim();
    if (!text) return;

    await supabaseClient
        .from('resource_comments')
        .insert([{ resource_id: resourceId, comment_text: text }]);

    input.value = '';
    loadComments(resourceId);
}

async function loadComments(resourceId) {
    const { data } = await supabaseClient
        .from('resource_comments')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

    const list = document.getElementById(`comments-list-${resourceId}`);
    if (list && data) {
        list.innerHTML = data.map(c => `<div>• ${c.comment_text}</div>`).join('');
    }
}

// Initialisation au chargement
window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadComments('res_bp');
});
