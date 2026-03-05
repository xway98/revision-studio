// --- GAMIFIED LAB LOGIC : Activity 2.9 ---

// State
let currentStep = 1; // 1: Setup, 2: Add Acid, 3: Dry Test, 4: Moist Test
let selectedItem = null;
let isSwitchEngaged = false;
let eloScore = 1200;

// Elements
const inventoryCards = document.querySelectorAll('.inv-card');
const selectedItemDisplay = document.getElementById('selectedItemDisplay');
const toggleSwitch = document.getElementById('mainActionToggle');
const currentActionBadge = document.getElementById('currentActionBadge');
const terminalLogs = document.getElementById('terminalLogs');

// Items Dictionary for easy lookup
const items = {
    'NaCl': { name: 'Solid NaCl', type: 'setup', color: 'orange' },
    'H2SO4': { name: 'Conc. H₂SO₄', type: 'reagent', color: 'orange' },
    'DryLitmus': { name: 'Dry Blue Litmus', type: 'test', color: 'blue' },
    'MoistLitmus': { name: 'Moist Blue Litmus', type: 'test', color: 'blue' }
};

// --- INVENTORY MANAGEMENT ---
function selectItem(itemId) {
    if (isSwitchEngaged) {
        logToTerminal('[WARNING] Cannot change inventory while switch is engaged.', 'warn');
        return;
    }

    selectedItem = itemId;
    const itemData = items[itemId];

    // UI Update: Cards
    inventoryCards.forEach(card => card.classList.remove('active'));
    document.querySelector(`[data-item="${itemId}"]`).classList.add('active');

    // UI Update: Action Bar
    selectedItemDisplay.textContent = itemData.name;
    selectedItemDisplay.className = `neon-text ${itemData.color}`;

    // Enable Switch
    toggleSwitch.disabled = false;
    currentActionBadge.textContent = 'READY TO ENGAGE';

    logToTerminal(`[INVENTORY] Selected: ${itemData.name}`, 'info');
}

// --- ACTION BAR & SWITCH ---
function executeAction() {
    isSwitchEngaged = toggleSwitch.checked;

    if (isSwitchEngaged) {
        logToTerminal(`[ACTION] Engaging main mechanism with ${items[selectedItem].name}...`, 'prompt');
        validateAndProcessStep();
    } else {
        logToTerminal(`[ACTION] Mechanism disengaged. Awaiting new input...`, 'sys');
        resetActionState();
    }
}

function resetActionState() {
    selectedItem = null;
    inventoryCards.forEach(card => card.classList.remove('active'));
    selectedItemDisplay.textContent = 'NONE';
    selectedItemDisplay.className = 'neon-text none';
    toggleSwitch.disabled = true;
    currentActionBadge.textContent = 'AWAITING INPUT';
}

// --- CORE LOGIC FLOW ---
function validateAndProcessStep() {
    setTimeout(() => {
        // Step 1 expects H2SO4
        if (currentStep === 1) {
            if (selectedItem === 'H2SO4') {
                handleSuccessStep(1, 2, 'H2SO4 applied. Effervescence observed. HCl gas evolving.');
            } else {
                handleFailStep('Invalid reagent. NaCl in setup requires Concentrated Sulphuric Acid to react.');
            }
        }
        // Step 2 expects Dry Litmus
        else if (currentStep === 2) {
            if (selectedItem === 'DryLitmus') {
                handleSuccessStep(2, 3, 'Dry Litmus exposed to gas. Result: NO COLOR CHANGE.');
            } else {
                handleFailStep('Invalid item. We must test the gas with a dry indicator first.');
            }
        }
        // Step 3 expects Moist Litmus
        else if (currentStep === 3) {
            if (selectedItem === 'MoistLitmus') {
                handleSuccessStep(3, 4, 'Moist Litmus exposed to gas. Result: TURNS RED. Acidic properties confirmed.');
                unlockTakeaway();
            } else {
                handleFailStep('Invalid item. We must test the gas with a moistened indicator.');
            }
        }
    }, 1000); // 1-second mechanical delay simulation
}

function handleSuccessStep(oldStep, newStep, logMessage) {
    // 1. Log success
    logToTerminal(`[SUCCESS] ${logMessage}`, 'success');

    // 2. Add XP / Gamification
    eloScore += 25;
    document.getElementById('eloScore').textContent = eloScore;
    document.getElementById('eloScore').style.animation = 'flicker 0.2s 3';
    setTimeout(() => document.getElementById('eloScore').style.animation = '', 600);

    // 3. Update Image Layer Simulation
    document.getElementById(`imgLayer${oldStep}`).classList.remove('current');
    document.getElementById(`imgLayer${newStep}`).classList.add('current');

    // 4. Update Progress Tracker
    const oldMarker = document.getElementById(`step${oldStep}-marker`);
    oldMarker.classList.remove('active');
    oldMarker.classList.add('completed');

    if (newStep <= 4) {
        const newMarker = document.getElementById(`step${newStep}-marker`);
        newMarker.classList.remove('pending');
        newMarker.classList.add('active');
    }

    currentStep = newStep;

    // Auto-disengage switch to reset for next move after delay
    setTimeout(() => {
        toggleSwitch.checked = false;
        executeAction(); // triggers disengage log
    }, 2500);
}

function handleFailStep(reason) {
    logToTerminal(`[ERROR] ${reason}`, 'warn');

    // Auto-disengage immediately to undo the switch
    setTimeout(() => {
        toggleSwitch.checked = false;
        executeAction();
    }, 500);
}


// --- NOTEBOOK & TERMINAL ---
function logToTerminal(text, type) {
    const log = document.createElement('div');
    log.className = `log-line ${type}`;
    log.textContent = text;
    terminalLogs.appendChild(log);

    // Auto scroll
    terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// --- GAMIFICATION TAKEAWAY UNLOCK ---
function unlockTakeaway() {
    setTimeout(() => {
        logToTerminal(`[SYSTEM] Decrypting Inference Archives...`, 'prompt');

        setTimeout(() => {
            document.getElementById('lockOverlay').style.opacity = '0';
            document.getElementById('takeawayCard').classList.remove('locked');
            logToTerminal(`[SYSTEM] MISSION COMPLETE. Inference unlocked.`, 'sys');

            // Final ELO boost
            eloScore += 150;
            document.getElementById('eloScore').textContent = eloScore;

        }, 1500);
    }, 3500);
}

// Init
logToTerminal('[HINT] Begin by finding the correct reagent to react with the Solid NaCl in the apparatus.', 'sys');
