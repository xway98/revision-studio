// --- ELECTRICITY EXPERIMENT LOGIC ---

// State
let selectedSolution = 'HCl';
let isSwitchOn = false;
let hasLiquid = false;

// Elements
const elecLiquid = document.getElementById('elecLiquid');
const elecSwitch = document.getElementById('elecSwitch');
const elecBulb = document.getElementById('elecBulb');
const switchIcon = document.getElementById('switchIcon');
const circuitBadge = document.getElementById('circuitBadge');
const reactionStatus = document.getElementById('reactionStatus');
const notebookLogs = document.getElementById('notebookLogs');
const pendingLog = document.getElementById('pendingLog');
const btnSwitch = document.getElementById('btnSwitch');
const wireLines = document.querySelectorAll('.wire-line');

// Solutions Database
const solutions = {
    'HCl': {
        name: 'Dilute HCl',
        conducts: true,
        desc: 'Strong acid, fully dissociates into H⁺ and Cl⁻ ions.'
    },
    'H2SO4': {
        name: 'Dilute H₂SO₄',
        conducts: true,
        desc: 'Strong acid, provides H⁺ and SO₄²⁻ ions.'
    },
    'Glucose': {
        name: 'Glucose Solution',
        conducts: false,
        desc: 'Covalent compound, does not produce free ions in water.'
    },
    'Alcohol': {
        name: 'Alcohol Solution',
        conducts: false,
        desc: 'Covalent covalent, does not produce free ions in water.'
    }
};

// --- INITIALIZATION ---
function initExperiment() {
    // Select default solution
    selectSolution('HCl');
}

// --- CONTROLS ---

function selectSolution(type) {
    if (isSwitchOn) {
        logToNotebook("Turn off the switch before changing solutions.", true);
        return;
    }

    selectedSolution = type;

    // Update UI Buttons
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.solution === type) btn.classList.add('active');
    });

    // Fill beaker visually
    fillBeaker(type);

    // Log action
    logToNotebook(`Poured <strong>${solutions[type].name}</strong> into the beaker.`);
}

function fillBeaker(type) {
    hasLiquid = true;
    elecLiquid.className = `elec-liquid ${type}`;
    // Trigger animation by setting height
    setTimeout(() => elecLiquid.style.height = '60px', 50);
}

function toggleSwitch() {
    if (!hasLiquid) {
        logToNotebook("Please select a solution first.", true);
        return;
    }

    isSwitchOn = !isSwitchOn;

    if (isSwitchOn) {
        // TURN ON
        elecSwitch.classList.add('closed');
        btnSwitch.innerHTML = `Turn Switch OFF <span class="icon-right" id="switchIcon">🛑</span>`;
        logToNotebook("Closed the switch. Circuit is complete.");

        checkConductivity();

    } else {
        // TURN OFF
        elecSwitch.classList.remove('closed');
        btnSwitch.innerHTML = `Turn Switch ON <span class="icon-right" id="switchIcon">🔌</span>`;
        logToNotebook("Opened the switch. Circuit is broken.");

        stopConductivity();
    }
}

// --- SIMULATION LOGIC ---

function checkConductivity() {
    const sol = solutions[selectedSolution];

    if (sol.conducts) {
        // Conducts Electricity!

        // 1. Wires turn orange
        wireLines.forEach(w => w.classList.add('active'));

        // 2. Bulb Glows
        elecBulb.classList.add('on');

        // 3. Bubbles form on nails (Electrolysis)
        startBubbles();

        // 4. Update Status Badges
        circuitBadge.textContent = 'ON';
        circuitBadge.style.opacity = 1;
        circuitBadge.style.borderColor = '#eab308'; // yellow
        circuitBadge.style.color = '#eab308';

        reactionStatus.textContent = 'Current Flowing / Electrolysis';
        reactionStatus.classList.add('active');

        // 5. Log Result
        setTimeout(() => {
            logToNotebook(`Result: <strong>Bulb flows brightly!</strong>`, false, 'success');
            logToNotebook(`Observation: Bubbles of gas are observed at the nails.`);
            logToNotebook(`Conclusion: ${sol.name} contains free ions that conduct electricity.`, false, 'highlight');
        }, 1000);

    } else {
        // Does NOT conduct
        circuitBadge.textContent = 'FAIL';
        circuitBadge.style.opacity = 1;
        circuitBadge.style.borderColor = '#ef4444'; // red
        circuitBadge.style.color = '#ef4444';

        reactionStatus.textContent = 'No Current Detected';
        reactionStatus.className = 'reaction-status';

        setTimeout(() => {
            logToNotebook(`Result: <strong>Bulb does NOT glow.</strong>`, true);
            logToNotebook(`Conclusion: ${sol.name} does not produce ions and cannot conduct electricity.`, false, 'highlight');
        }, 1000);
    }
}

function stopConductivity() {
    wireLines.forEach(w => w.classList.remove('active'));
    elecBulb.classList.remove('on');
    stopBubbles();

    circuitBadge.style.opacity = 0;
    reactionStatus.textContent = 'Circuit Open';
    reactionStatus.className = 'reaction-status';
}

// --- BUBBLE ANIMATIONS ---

let bubbleIntervals = [];

function startBubbles() {
    const nail1 = document.getElementById('nail1Bubbles');
    const nail2 = document.getElementById('nail2Bubbles');

    const createBubble = (container) => {
        if (!container) return;
        const b = document.createElement('div');
        b.className = 'elec-bubble';
        b.style.left = Math.random() * 20 + 'px'; // Random X position within nail width
        // Randomize animation slightly
        b.style.animationDuration = (1 + Math.random()) + 's';

        container.appendChild(b);

        // Remove after animation
        setTimeout(() => {
            if (b && b.parentNode) b.parentNode.removeChild(b);
        }, 1500);
    };

    bubbleIntervals.push(setInterval(() => createBubble(nail1), 300));
    bubbleIntervals.push(setInterval(() => createBubble(nail2), 300));
}

function stopBubbles() {
    bubbleIntervals.forEach(clearInterval);
    bubbleIntervals = [];
    document.getElementById('nail1Bubbles').innerHTML = '';
    document.getElementById('nail2Bubbles').innerHTML = '';
}


// --- NOTEBOOK / UTILS ---

function logToNotebook(text, isWarning = false, specialClass = '') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const log = document.createElement('div');
    log.className = `log-card ${specialClass}`;
    if (isWarning) log.style.borderLeft = '4px solid #ef4444';
    if (specialClass === 'success') log.style.borderLeft = '4px solid #22c55e';
    if (specialClass === 'highlight') {
        log.style.background = '#fffbeb';
        log.style.borderColor = '#fde68a';
    }

    log.innerHTML = `
        <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 4px;">[${time}]</div>
        <div>${text}</div>
    `;

    notebookLogs.insertBefore(log, pendingLog);
    notebookLogs.scrollTop = notebookLogs.scrollHeight;
}

function resetExperiment() {
    if (isSwitchOn) toggleSwitch();

    // Clear beaker
    hasLiquid = false;
    elecLiquid.style.height = '0';

    // Clear logs
    const cards = notebookLogs.querySelectorAll('.log-card:not(.pending-log)');
    cards.forEach(c => c.remove());

    // Reset selection
    document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('active'));

    logToNotebook("Experiment reset apparatus cleaned.");
}

// Start
initExperiment();
