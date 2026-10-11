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

const quizData = [
    {
        question: "Quelle est la première étape essentielle pour lancer un projet entrepreneurial solide ?",
        options: [
            "Acheter un local commercial immédiatement",
            "Identifier un vrai problème client et analyser le marché",
            "Embaucher une grande équipe sans plan"
        ],
        correct: 1
    },
    {
        question: "À quoi sert principalement le tableau de bord analytique sur Arkas ?",
        options: [
            "À suivre la progression des modules et la réussite des quiz",
            "À jouer à des jeux vidéo",
            "À modifier le code source du site"
        ],
        correct: 0
    }
];

let currentQuestion = 0;
let score = 0;

function startQuiz() {
    document.getElementById('formation-menu').style.display = 'none';
    document.getElementById('quiz-box').style.display = 'block';
    currentQuestion = 0;
    score = 0;
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestion < quizData.length) {
        const q = quizData[currentQuestion];
        document.getElementById('quiz-title').textContent = `Quiz - Question ${currentQuestion + 1} sur ${quizData.length}`;
        document.getElementById('quiz-question').textContent = q.question;
        
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.onclick = () => selectAnswer(index);
            optionsContainer.appendChild(btn);
        });
    } else {
        document.getElementById('quiz-title').textContent = "Résultat du Quiz 🎯";
        document.getElementById('quiz-question').textContent = `Vous avez terminé le quiz avec un score de ${score} / ${quizData.length} !`;
        document.getElementById('quiz-options').innerHTML = "<p style='color:#818cf8;'>Félicitations pour votre progression entrepreneuriale !</p>";
        document.getElementById('quiz-back').style.display = 'inline-block';
    }
}

function selectAnswer(selectedIndex) {
    if (selectedIndex === quizData[currentQuestion].correct) {
        score++;
    }
    currentQuestion++;
    loadQuestion();
}

function resetFormations() {
    document.getElementById('quiz-box').style.display = 'none';
    document.getElementById('formation-menu').style.display = 'grid';
    document.getElementById('quiz-back').style.display = 'none';
}
