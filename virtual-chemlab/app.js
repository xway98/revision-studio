let reactionActive = false;
let reactionInterval = null;
let bubblesTimer = null;

// UI Elements
const btnAddZinc = document.getElementById('btnAddZinc');
const btnLightCandle = document.getElementById('btnLightCandle');
const notebookLogs = document.getElementById('notebookLogs');
const pendingLog = document.getElementById('pendingLog');
const zincGranulesContainer = document.getElementById('zincGranules');
const tubeBubbles = document.getElementById('tubeBubbles');
const soapBubbles = document.getElementById('soapBubbles');
const reactionStatus = document.getElementById('reactionStatus');
const moleculeBadge = document.getElementById('moleculeBadge');
const tubeLiquid = document.getElementById('tubeLiquid');

const candleEl = document.getElementById('candleEl');
const popEffect = document.getElementById('popEffect');
const grandPopOverlay = document.getElementById('grandPopOverlay');
const popSound = document.getElementById('popSound');

const acidChoices = document.querySelectorAll('.choice-btn');

// State
let selectedAcid = 'Dilute Sulphuric Acid';

// Acid selection
acidChoices.forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (reactionActive) return; // Cannot change during reaction

        acidChoices.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAcid = btn.innerText.trim();
    });
});

// Format current time HH:MM:SS
function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
}

// Add a log to notebook
function addLog(htmlContent, isKeyObs = false) {
    const card = document.createElement('div');
    card.className = 'log-card' + (isKeyObs ? ' key-observation' : '');

    let timeHtml = `<div class="log-time">${getCurrentTime()} ${isKeyObs ? '<span class="key-obs-label">- KEY OBSERVATION</span>' : ''}</div>`;

    card.innerHTML = timeHtml + `<div class="log-content">${htmlContent}</div>`;

    notebookLogs.insertBefore(card, pendingLog);
    // Auto scroll bottom
    notebookLogs.scrollTop = notebookLogs.scrollHeight;
}

// Actions
function addZinc() {
    btnAddZinc.disabled = true;

    // Animate granules falling
    for (let i = 0; i < 8; i++) {
        setTimeout(() => {
            const granule = document.createElement('div');
            granule.className = 'granule';
            granule.style.left = (Math.random() * 12) + 'px';
            zincGranulesContainer.appendChild(granule);
        }, i * 100);
    }

    // Change liquid color slightly to indicate reaction
    tubeLiquid.style.background = 'rgba(186, 230, 253, 0.8)';

    // Log
    addLog(`Added 5g of <strong>Zinc granules</strong> to 20ml of <strong>${selectedAcid}</strong>.`);

    // Start Reaction after short delay
    setTimeout(() => {
        startReaction();
    }, 1500);
}

function startReaction() {
    reactionActive = true;
    btnLightCandle.disabled = false;
    reactionStatus.classList.add('active');
    reactionStatus.innerText = 'Reaction Active';
    moleculeBadge.style.opacity = '1';

    // Log reaction
    addLog(`Observed rapid evolution of gas in the form of <strong>bubbles</strong> on the surface of zinc granules.`);

    // Add bubbles in test tube
    reactionInterval = setInterval(() => {
        createTubeBubble();
    }, 300);

    // Add soap bubbles rising
    bubblesTimer = setInterval(() => {
        createSoapBubble();
    }, 1200);
}

function createTubeBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'tube-bubble';
    bubble.style.left = (Math.random() * 20) + 'px';
    bubble.style.animation = `fizz ${Math.random() * 0.5 + 1}s linear forwards`;

    tubeBubbles.appendChild(bubble);

    setTimeout(() => {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
    }, 1500);
}

function createSoapBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'large-bubble';
    bubble.style.left = (Math.random() * 20 - 10) + 'px';
    const duration = Math.random() * 2 + 3; // 3-5 seconds
    bubble.style.animation = `floatUp ${duration}s ease-in forwards`;

    soapBubbles.appendChild(bubble);

    setTimeout(() => {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
    }, duration * 1000);
}

function lightCandle() {
    btnLightCandle.disabled = true;

    // Bring candle near bubbles layout
    candleEl.classList.add('active');

    setTimeout(() => {
        // Trigger Pop Event
        triggerPop();
    }, 1200);
}

function triggerPop() {
    // Audio
    try {
        popSound.currentTime = 0;
        popSound.play();
    } catch (e) { console.warn("Audio blocked by browser policy"); }

    // Visual effect
    popEffect.style.animation = 'bang 0.4s ease-out forwards';
    grandPopOverlay.classList.add('active');

    // Remove effect classes after duration
    setTimeout(() => {
        popEffect.style.animation = '';
        candleEl.classList.remove('active');
        setTimeout(() => {
            grandPopOverlay.classList.remove('active');
        }, 1500);
    }, 500);

    // Log
    const logHTML = `
        Burning candle brought near gas bubble: <span class="pop-text">POP SOUND DETECTED.</span>
        <div class="log-conclusion">Conclusion: The evolved gas is <strong>Hydrogen (H₂)</strong>.</div>
    `;
    addLog(logHTML, true);

    // Disable pending log display
    pendingLog.style.display = 'none';
}

function resetExperiment() {
    // Stop intervals
    if (reactionInterval) clearInterval(reactionInterval);
    if (bubblesTimer) clearInterval(bubblesTimer);

    reactionActive = false;

    // Reset UI Elements
    btnAddZinc.disabled = false;
    btnLightCandle.disabled = true;
    reactionStatus.classList.remove('active');
    reactionStatus.innerText = 'Reaction Inactive';
    moleculeBadge.style.opacity = '0';

    // Clear DOM generated items
    zincGranulesContainer.innerHTML = '';
    tubeBubbles.innerHTML = '';
    soapBubbles.innerHTML = '';

    // Reset Logs
    const notebookCards = document.querySelectorAll('.log-card:not(.pending-log)');
    notebookCards.forEach(card => card.remove());
    pendingLog.style.display = 'flex';

    // Reset candle
    candleEl.classList.remove('active');
    grandPopOverlay.classList.remove('active');
    tubeLiquid.style.background = 'rgba(186, 230, 253, 0.6)';
}
