// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = 'https://kdhchzkurngbgynpytrh.supabase.co';
const SUPABASE_ANON_KEY = 'Sb_publishable_atCUDbOqr6Cn9iDxSKbrWQ_w2sa0j_1';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

// --- SYSTEME D'AUTHENTIFICATION ---
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
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                <span><i class="fa-solid fa-user-check" style="color: #22c55e;"></i> ${currentUser.email}</span>
                <button onclick="handleLogout()" class="btn-primary" style="padding: 4px 10px; font-size: 11px;">Déconnexion</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="auth-box-inline">
                <input type="email" id="auth-email" placeholder="Email...">
                <input type="password" id="auth-password" placeholder="Mot de passe...">
                <button onclick="handleLogin()" class="btn-primary" style="padding: 5px 10px; font-size: 12px;">Connexion</button>
                <button onclick="handleSignup()" class="btn-save" style="padding: 5px 10px; font-size: 12px;">S'inscrire</button>
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
        alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
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
    if (!currentUser) return alert("Veuillez vous connecter en haut de la page pour enregistrer vos réflexions en privé.");

    const answerText = document.getElementById(fieldId).value;
    if (!answerText.trim()) return alert("Veuillez écrire une réponse avant d'enregistrer.");

    const { error } = await supabaseClient
        .from('user_reflections')
        .insert([{ question: questionLabel, answer: answerText }]);

    if (error) alert("Erreur lors de l'enregistrement : " + error.message);
    else alert("Réflexion enregistrée avec succès dans votre espace privé !");
}

// --- ASSISTANT IA INTELLIGENT ET CONTEXTUEL ---
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

    // Analyse intelligente du texte pour une réponse contextuelle variée
    setTimeout(() => {
        const lower = text.toLowerCase();
        let reply = "C'est un point stratégique important. Pour réussir, je vous conseille de découper cet objectif en actions simples et mesurables dès cette semaine.";

        if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('coucou')) {
            reply = "Bonjour ! Ravi de vous accompagner. Quel est votre projet ou votre défi du moment en entrepreneuriat ?";
        } else if (lower.includes('client') || lower.includes('vente') || lower.includes('marche') || lower.includes('prospect')) {
            reply = "Pour attirer et convaincre vos clients, concentrez-vous sur le bénéfice direct que votre offre leur apporte. Allez interroger 5 clients potentiels pour comprendre leurs blocages exacts.";
        } else if (lower.includes('argent') || lower.includes('financement') || lower.includes('capital') || lower.includes('fonds')) {
            reply = "Le financement dépend de votre stade : privilégiez le bootstrapping (autofinancement par les premiers clients) au début, puis préparez un pitch deck solide si vous cherchez des investisseurs ou un prêt.";
        } else if (lower.includes('idee') || lower.includes('projet') || lower.includes('lancer')) {
            reply = "Pour valider une bonne idée de projet, assurez-vous qu'elle résout un problème douloureux pour lequel les gens sont prêts à payer. Utilisez l'onglet Formations de la plateforme pour structurer cela !";
        } else if (lower.includes('merci')) {
            reply = "Avec grand plaisir ! N'hésitez pas si vous avez d'autres questions pour faire avancer votre entreprise.";
        }

        box.innerHTML += `
            <div class="chat-message bot">
                <i class="fa-solid fa-robot"></i>
                <p>${reply}</p>
            </div>
        `;
        box.scrollTop = box.scrollHeight;
    }, 700);
}

// --- LIKES ET COMMENTAIRES PUBLICS ---
async function likeResource(resourceId) {
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
