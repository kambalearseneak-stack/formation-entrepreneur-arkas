// ============================================
// CONFIGURATION SUPABASE
// ============================================
const SUPABASE_URL = window.ARKAS_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ARKAS_CONFIG.SUPABASE_ANON_KEY;

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;

// ============================================
// SÉCURITÉ ANTI-XSS
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// NAVIGATION
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
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return alert("Veuillez remplir l'email et le mot de passe.");

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Erreur : " + error.message);
    else {
        alert("✅ Connexion réussie !");
        checkAuth();
    }
}

async function handleSignup() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) return alert("Veuillez remplir l'email et le mot de passe.");
    if (password.length < 6) return alert("Le mot de passe doit contenir au moins 6 caractères.");

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Erreur : " + error.message);
    else {
        alert("✅ Inscription réussie ! Vous pouvez vous connecter.");
        checkAuth();
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    renderAuthUI();
}

// ============================================
// AUTHENTIFICATION DEPUIS LA PAGE D'ACCUEIL
// ============================================
function scrollToAuth() {
    document.getElementById('auth-section-home').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

async function handleSignupFromHome() {
    const email = document.getElementById('home-email').value.trim();
    const password = document.getElementById('home-password').value;
    
    if (!email || !password) return alert("Veuillez remplir tous les champs.");
    if (password.length < 6) return alert("Le mot de passe doit contenir au moins 6 caractères.");
    
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
        alert("Erreur : " + error.message);
    } else {
        alert("✅ Inscription réussie ! Vous pouvez vous connecter.");
        document.getElementById('home-email').value = '';
        document.getElementById('home-password').value = '';
        checkAuth();
    }
}

async function handleLoginFromHome() {
    const email = document.getElementById('home-email').value.trim();
    const password = document.getElementById('home-password').value;
    
    if (!email || !password) return alert("Veuillez remplir tous les champs.");
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Erreur : " + error.message);
    } else {
        alert("✅ Connexion réussie !");
        document.getElementById('home-email').value = '';
        document.getElementById('home-password').value = '';
        checkAuth();
    }
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
        alert("✅ Réflexion enregistrée !");
        document.getElementById(fieldId).value = '';
    }
}

// ============================================
// ASSISTANT IA AVEC GEMINI (via backend Vercel)
// ============================================
let chatHistory = [];

function handleChatKey(event) {
    if (event.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('user-input');
    const box = document.getElementById('chat-box');
    const text = input.value.trim();
    if (!text) return;

    // Message utilisateur
    box.innerHTML += `
        <div class="chat-message user">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    input.value = '';
    box.scrollTop = box.scrollHeight;

    // Indicateur de réflexion
    const typingId = 'typing-' + Date.now();
    box.innerHTML += `
        <div class="chat-message bot" id="${typingId}">
            <i class="fa-solid fa-robot"></i>
            <p><i class="fa-solid fa-ellipsis fa-fade"></i> Réflexion en cours...</p>
        </div>
    `;
    box.scrollTop = box.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: chatHistory.slice(-10)
            })
        });

        const data = await response.json();
        document.getElementById(typingId)?.remove();

        if (!response.ok) {
            throw new Error(data.details || data.error || 'Erreur inconnue');
        }

        const reply = data.reply || "Désolé, je n'ai pas pu répondre.";

        chatHistory.push({ role: 'user', text: text });
        chatHistory.push({ role: 'model', text: reply });

        box.innerHTML += `
            <div class="chat-message bot">
                <i class="fa-solid fa-robot"></i>
                <p>${escapeHtml(reply)}</p>
            </div>
        `;
        box.scrollTop = box.scrollHeight;

    } catch (error) {
        console.error('Erreur chat:', error);
        document.getElementById(typingId)?.remove();
        
        box.innerHTML += `
            <div class="chat-message bot">
                <i class="fa-solid fa-robot"></i>
                <p>❌ Erreur de connexion à l'IA.<br><small>${escapeHtml(error.message)}</small></p>
            </div>
        `;
        box.scrollTop = box.scrollHeight;
    }
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
// CARNET DE BORD
// ============================================
function saveNote() {
    const input = document.getElementById('new-note');
    const text = input.value.trim();
    if (!text) {
        alert("Veuillez écrire quelque chose avant d'ajouter.");
        return;
    }

    const notes = JSON.parse(localStorage.getItem('arkas_notes') || '[]');
    notes.unshift({ 
        id: Date.now(),
        text: text, 
        date: new Date().toISOString() 
    });
    localStorage.setItem('arkas_notes', JSON.stringify(notes));
    input.value = '';
    renderNotes();
}

function renderNotes() {
    const container = document.getElementById('notes-list');
    const emptyState = document.getElementById('empty-notes');
    const notes = JSON.parse(localStorage.getItem('arkas_notes') || '[]');
    
    if (notes.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    container.innerHTML = notes.map(note => `
        <div class="note-card">
            <span class="note-text">${escapeHtml(note.text)}</span>
            <button class="note-delete" onclick="deleteNote(${note.id})" title="Supprimer">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteNote(noteId) {
    if (!confirm("Supprimer cette note ?")) return;
    
    let notes = JSON.parse(localStorage.getItem('arkas_notes') || '[]');
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem('arkas_notes', JSON.stringify(notes));
    renderNotes();
}

// ============================================
// INITIALISATION
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadComments('res_bp');
    renderNotes();
});
