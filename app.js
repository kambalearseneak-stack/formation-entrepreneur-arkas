// ============================================
// CONFIGURATION SUPABASE (depuis config.js)
// ============================================
const SUPABASE_URL = window.ARKAS_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ARKAS_CONFIG.SUPABASE_ANON_KEY;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// ============================================
// FONCTION DE SÉCURITÉ (anti-XSS)
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// NAVIGATION PAR ONGLETS
// ============================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
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

// ============================================
// AUTHENTIFICATION
// ============================================
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentUser = session ? session.user : null;
        renderAuthUI();
    } catch (error) {
        console.error("Erreur d'authentification:", error);
    }
}

function renderAuthUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    if (currentUser) {
        container.innerHTML = `
            <div class="user-info">
                <i class="fa-solid fa-user-check" style="color: #22c55e;"></i>
                <span>${escapeHtml(currentUser.email)}</span>
                <button onclick="handleLogout()" class="btn-primary btn-small">Déconnexion</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="auth-box-inline">
                <input type="email" id="auth-email" placeholder="Email...">
                <input type="password" id="auth-password" placeholder="Mot de passe...">
                <button onclick="handleLogin()" class="btn-primary btn-small">Connexion</button>
                <button onclick="handleSignup()" class="btn-save btn-small">S'inscrire</button>
            </div>
        `;
    }
}

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return alert("Veuillez remplir l'email et le mot de passe.");

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Erreur : " + error.message);
    else {
        alert("Connexion réussie !");
        checkAuth();
    }
}

async function handleSignup() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return alert("Veuillez remplir l'email et le mot de passe.");
    if (password.length < 6) return alert("Le mot de passe doit contenir au moins 6 caractères.");

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Erreur : " + error.message);
    else {
        alert("Inscription réussie ! Vérifiez votre email ou connectez-vous.");
        checkAuth();
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    renderAuthUI();
}

// ============================================
// RÉFLEXIONS PRIVÉES
// ============================================
async function saveReflection(fieldId, questionLabel) {
    if (!currentUser) return alert("Connectez-vous pour enregistrer vos réflexions.");

    const answerText = document.getElementById(fieldId).value;
    if (!answerText.trim()) return alert("Veuillez écrire une réponse.");

    const { error } = await supabaseClient
        .from('user_reflections')
        .insert([{
            user_id: currentUser.id,
            question: questionLabel,
            answer: answerText
        }]);

    if (error) alert("Erreur : " + error.message);
    else {
        alert("Réflexion enregistrée !");
        document.getElementById(fieldId).value = '';
    }
}

// ============================================
// ASSISTANT IA
// ============================================
function handleChatKey(event) {
    if (event.key === 'Enter') sendChatMessage();
}

function sendChatMessage() {
    const input = document.getElementById('user-input');
    const box = document.getElementById('chat-box');
    const text = input.value.trim();
    if (!text) return;

    // Message utilisateur (SÉCURISÉ)
    box.innerHTML += `
        <div class="chat-message user">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    input.value = '';
    box.scrollTop = box.scrollHeight;

    // Réponse contextuelle
    setTimeout(() => {
        const lower = text.toLowerCase();
        let reply = "C'est un point stratégique important. Je vous conseille de découper cet objectif en actions simples et mesurables.";

        if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('coucou')) {
            reply = "Bonjour ! Ravi de vous accompagner. Quel est votre projet ou votre défi du moment ?";
        } else if (lower.includes('client') || lower.includes('vente') || lower.includes('marche') || lower.includes('prospect')) {
            reply = "Pour convaincre vos clients, concentrez-vous sur le bénéfice direct. Interrogez 5 clients potentiels pour comprendre leurs blocages.";
        } else if (lower.includes('argent') || lower.includes('financement') || lower.includes('capital') || lower.includes('fonds')) {
            reply = "Privilégiez le bootstrapping au début. Préparez ensuite un pitch deck solide pour les investisseurs.";
        } else if (lower.includes('idee') || lower.includes('projet') || lower.includes('lancer')) {
            reply = "Assurez-vous que votre idée résout un problème douloureux pour lequel les gens sont prêts à payer.";
        } else if (lower.includes('merci')) {
            reply = "Avec grand plaisir ! N'hésitez pas si vous avez d'autres questions.";
        }

        box.innerHTML += `
            <div class="chat-message bot">
                <i class="fa-solid fa-robot"></i>
                <p>${escapeHtml(reply)}</p>
            </div>
        `;
        box.scrollTop = box.scrollHeight;
    }, 700);
}

// ============================================
// LIKES ET COMMENTAIRES
// ============================================
async function likeResource(resourceId) {
    const span = document.getElementById(`likes-${resourceId}`);
    let current = parseInt(span.innerText) || 0;
    current++;
    span.innerText = current;

    const { error } = await supabaseClient
        .from('resource_likes')
        .upsert({ resource_id: resourceId, likes_count: current }, { onConflict: 'resource_id' });

    if (error) console.error("Erreur like:", error);
}

async function addComment(resourceId) {
    if (!currentUser) return alert("Connectez-vous pour commenter.");

    const input = document.getElementById(`comment-${resourceId}`);
    const text = input.value.trim();
    if (!text) return;

    const { error } = await supabaseClient
        .from('resource_comments')
        .insert([{
            resource_id: resourceId,
            user_id: currentUser.id,
            user_email: currentUser.email,
            comment_text: text
        }]);

    if (error) alert("Erreur : " + error.message);
    else {
        input.value = '';
        loadComments(resourceId);
    }
}

async function loadComments(resourceId) {
    const { data, error } = await supabaseClient
        .from('resource_comments')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur chargement commentaires:", error);
        return;
    }

    const list = document.getElementById(`comments-list-${resourceId}`);
    if (list && data) {
        list.innerHTML = data.map(c =>
            `<div>• <strong>${escapeHtml(c.user_email || 'Anonyme')}</strong> : ${escapeHtml(c.comment_text)}</div>`
        ).join('');
    }
}

// ============================================
// CARNET DE BORD (localStorage)
// ============================================
function saveNote() {
    const input = document.getElementById('new-note');
    const text = input.value.trim();
    if (!text) return;

    const notes = JSON.parse(localStorage.getItem('arkas_notes') || '[]');
    notes.push({ text, date: new Date().toISOString() });
    localStorage.setItem('arkas_notes', JSON.stringify(notes));
    input.value = '';
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById('notes-list');
    const notes = JSON.parse(localStorage.getItem('arkas_notes') || '[]');
    container.innerHTML = notes.map(n =>
        `<div class="note-card">${escapeHtml(n.text)}</div>`
    ).join('');
}

// ============================================
// INITIALISATION
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadComments('res_bp');
    renderNotes();
});
