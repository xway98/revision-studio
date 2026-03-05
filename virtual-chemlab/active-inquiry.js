// --- ACTIVE INQUIRY LOGIC ---

// State
let currentStep = 1;
let selectedHypothesis = null;
let selectedItem = null;
let isAnimating = false;

// DOM Elements
const logContainer = document.getElementById('notebookLogs');
const procedureTracker = document.getElementById('procedureTracker');
const nextBtn = document.getElementById('nextStepBtn');
const actionRing = document.getElementById('actionRing');
const expTitle = document.getElementById('expTitle');
const expBody = document.getElementById('expBody');

const inventoryCards = document.querySelectorAll('.inv-card');

// Data Definitions
const stepData = {
    1: {
        title: "Setup Beaker",
        body: "Place a clean 100ml beaker onto the workbench to prepare for the conductivity test.",
        log: "Beaker placed on workbench. Equipment check passed.",
        requiresInventory: false,
        nextWait: 5000 // 5 seconds
    },
    2: {
        title: "Add Solution",
        body: "Select a solution from your Inventory and add it to the beaker.",
        log: "Solution added to beaker.",
        requiresInventory: true,
        nextWait: 5000
    },
    3: {
        title: "Insert Electrodes",
        body: "Lower the graphite electrodes into the solution. Ensure the switch remains open.",
        log: "Electrodes immersed. Circuit connected but switch open.",
        requiresInventory: false,
        nextWait: 5000,
        thoughtGated: true
    },
    4: {
        title: "Observe Circuit",
        body: "Close the circuit switch and quietly observe the electrodes and the bulb.",
        log: "Circuit closed.",
        requiresInventory: false,
        nextWait: 6000
    }
};

// --- START EXPERIMENT ---
function initExperiment() {
    logTimeEntry(1);
    startWaitTimer(stepData[1].nextWait);
}

// --- CORE PACING & PROGRESSION ---
function startWaitTimer(ms) {
    isAnimating = true;
    nextBtn.disabled = true;
    nextBtn.classList.remove('ready');

    // Reset ring
    actionRing.style.transition = 'none';
    actionRing.style.strokeDashoffset = '125.6';

    // Force reflow
    void actionRing.offsetWidth;

    // Animate ring
    actionRing.style.transition = `stroke-dashoffset ${ms}ms linear`;
    actionRing.style.strokeDashoffset = '0';

    setTimeout(() => {
        isAnimating = false;
        enableNextStep();
    }, ms);
}

function enableNextStep() {
    // Only enable if we don't have pending requirements
    if (stepData[currentStep].requiresInventory && !selectedItem) {
        // Wait for inventory selection
        makeInventorySelectable();
        return;
    }

    // Check thought gate before step 3 completion
    if (currentStep === 2 && stepData[3].thoughtGated && selectedHypothesis === null) {
        showThoughtExperiment();
        return;
    }

    nextBtn.disabled = false;
    nextBtn.classList.add('ready');
}

function handleNextStep() {
    if (isAnimating) return;

    // Transition to Next Step
    nextBtn.disabled = true;
    nextBtn.classList.remove('ready');

    const oldStep = currentStep;
    currentStep++;

    if (currentStep > 4) {
        finishExperiment();
        return;
    }

    // Update UI
    updateImageFrame(oldStep, currentStep);
    updateProcedureTracker(oldStep, currentStep);

    // Update Explanation Card
    expTitle.textContent = stepData[currentStep].title;
    expBody.textContent = stepData[currentStep].body;

    // Log old step completion / new step start
    let logMsg = stepData[currentStep].log;
    if (currentStep === 2 && selectedItem) {
        logMsg = `${selectedItem} (50ml) added to the beaker. Ions beginning to disperse.`;
    }
    if (currentStep === 4) {
        logMsg = `Bubbling observed at the electrodes. The circuit is now complete.`;
    }

    addLog(logMsg, currentStep === 4 ? 'highlight' : '');

    // In-situ observation handle
    if (currentStep === 4) {
        setTimeout(() => {
            document.getElementById('bubbleOverlay').style.display = 'flex';
        }, 1500);
    }

    // Start timer for current step
    startWaitTimer(stepData[currentStep].nextWait);
}

// --- VISUALIZERS ---
function updateImageFrame(oldS, newS) {
    document.getElementById(`frame${oldS}`).classList.remove('active');
    document.getElementById(`frame${newS}`).classList.add('active');
}

function updateProcedureTracker(oldS, newS) {
    document.getElementById(`step${oldS}-marker`).classList.replace('active', 'done');

    if (newS <= 4) {
        document.getElementById(`step${newS}-marker`).classList.replace('pending', 'active');
    }
}

// --- INVENTORY ---
function makeInventorySelectable() {
    expBody.innerHTML = `<strong>Please select 'Dilute HCl' from the inventory to continue.</strong>`;

    inventoryCards.forEach(card => {
        card.classList.add('selectable');
        card.addEventListener('click', function handleSelect() {
            if (this.id !== 'inv-hcl') {
                addLog("System Warning: Please select Dilute HCl for this controlled prototype.", "sys-record");
                return;
            }

            // Valid selection
            inventoryCards.forEach(c => {
                c.classList.remove('selectable', 'active');
                c.removeEventListener('click', handleSelect);
            });

            this.classList.add('active');
            selectedItem = "Dilute HCl";
            addLog(`Selected: Dilute HCl (Strong Acid)`);

            expBody.textContent = stepData[currentStep].body;
            enableNextStep(); // Button is now ready
        });
    });
}

// --- THOUGHT EXPERIMENT ---
function showThoughtExperiment() {
    document.getElementById('thoughtModal').classList.remove('hidden');
}

function submitHypothesis(isCorrect) {
    selectedHypothesis = isCorrect;
    document.getElementById('thoughtModal').classList.add('hidden');

    addLog(`Hypothesis logged: The bulb will not glow if solid NaCl is used.`);

    // Now enable the button
    enableNextStep();
}

// --- CAPSTONE MCQ ---
function finishExperiment() {
    document.getElementById('workbenchView').style.display = 'none';
    document.getElementById('capstoneView').style.display = 'block';
    document.getElementById('capstoneView').classList.remove('hidden');

    addLog(`Experiment practical complete. Awaiting final assessment.`, 'sys-record');
}

function selectFinalAnswer(btn, isCorrect) {
    // Disable all options
    document.querySelectorAll('.mcq-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
        opt.classList.remove('correct', 'wrong');
        opt.querySelector('.feedback-text').classList.add('hidden');
    });

    if (isCorrect) {
        btn.classList.add('correct');
        btn.querySelector('.feedback-text').classList.remove('hidden');

        setTimeout(() => {
            addLog(`FINAL INFERENCE KEY: HCl is a strong acid that completely dissociates into free-moving ions in water, which act as charge carriers.`, 'highlight');
            updateStreak();
        }, 1000);

    } else {
        btn.classList.add('wrong');
        btn.querySelector('.feedback-text').classList.remove('hidden');
    }
}


// --- UTILS ---
function addLog(text, customClass = '') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const html = `
    <div class="log-entry">
        <div class="log-time">${time}</div>
        <div class="log-card ${customClass}">
            ${text}
        </div>
    </div>`;

    logContainer.insertAdjacentHTML('beforeend', html);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function logTimeEntry() {
    document.getElementById('logTime1').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateStreak() {
    document.querySelector('.streak').innerHTML = `<span class="flame">🔥</span> Streak: 13`;
    document.querySelector('.streak').style.transform = 'scale(1.1)';
    setTimeout(() => { document.querySelector('.streak').style.transform = ''; }, 300);
}

// Start
initExperiment();
// Hide bubble initially
document.getElementById('bubbleOverlay').style.display = 'none';
