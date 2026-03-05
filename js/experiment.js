// --- EXPERIMENT BUILDER STATE & LOGIC ---

let expData = []; // Array of steps: { image, procedure, observation, takeaway }
let expActiveIdx = -1;

function openExperimentBuilder(chap, top, isNew) {
  currentChapter = chap;
  currentTopic = top;
  appMode = 'experiment';

  if (isNew) {
    expData = [
      { image: '', procedure: '', observation: '', takeaway: '' }
    ];
    expActiveIdx = 0;
  } else {
    // Need to load from db, but for now we expect it's loaded into cardData or similar
    // We will hook this up properly with load mechanisms
    if (Array.isArray(cardData) && cardData.length > 0 && cardData[0].procedure !== undefined) {
      expData = cardData; // Re-use the variable from state.js during the transition
    } else {
      expData = [
        { image: '', procedure: '', observation: '', takeaway: '' }
      ];
    }
    expActiveIdx = 0;
  }

  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('editor-view').style.display = 'none';
  document.getElementById('experiment-builder').style.display = 'flex';

  expRenderList();
  expRenderForm();
  expRenderPreview();
}

function closeExperimentBuilder() {
  document.getElementById('experiment-builder').style.display = 'none';
  // Return to hub, same logic as closeEditor()
  initHub();
}

function expAddStep() {
  expData.push({ image: '', procedure: '', observation: '', takeaway: '' });
  expActiveIdx = expData.length - 1;
  expRenderList();
  expRenderForm();
  expRenderPreview();
  triggerExpAutoSave();
}

function expDeleteStep() {
  if (expData.length <= 1) return alert("You must have at least one step.");
  expData.splice(expActiveIdx, 1);
  if (expActiveIdx >= expData.length) expActiveIdx = expData.length - 1;
  expRenderList();
  expRenderForm();
  expRenderPreview();
  triggerExpAutoSave();
}

function expSelectStep(idx) {
  expActiveIdx = idx;
  expRenderList();
  expRenderForm();
  expRenderPreview();
}

function expUpdateField(field, val) {
  if (expActiveIdx < 0 || expActiveIdx >= expData.length) return;
  expData[expActiveIdx][field] = val;
  expRenderList(); // Quick refresh in case we want to show a preview snippet
  expRenderPreview();
  triggerExpAutoSave();
}

function expRenderList() {
  const container = document.getElementById('exp-steps-list');
  if (!container) return;

  container.innerHTML = expData.map((step, i) => {
    const isAct = i === expActiveIdx;
    const bg = isAct ? '#e0f2fe' : '#f8fafc';
    const border = isAct ? '#3b82f6' : '#e2e8f0';
    return `
      <div style="padding:10px;background:${bg};border:1px solid ${border};border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:10px;" onclick="expSelectStep(${i})">
        <div style="width:24px;height:24px;background:#3b82f6;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">${i + 1}</div>
        <div style="flex:1;font-size:13px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${step.procedure ? step.procedure : 'Empty Step...'}
        </div>
      </div>
    `;
  }).join('');
}

function expRenderForm() {
  const step = expData[expActiveIdx];
  if (!step) return;

  document.getElementById('exp-step-title').textContent = `Step ${expActiveIdx + 1} Details`;

  document.getElementById('exp-img-url').value = step.image || '';
  document.getElementById('exp-text-procedure').value = step.procedure || '';
  document.getElementById('exp-text-observation').value = step.observation || '';
  document.getElementById('exp-text-takeaway').value = step.takeaway || '';
}

function expRenderPreview() {
  const stack = document.getElementById('exp-preview-images');
  const procArea = document.getElementById('exp-preview-proc');
  const obsArea = document.getElementById('exp-preview-obs');
  const takeArea = document.getElementById('exp-preview-take');

  if (!stack) return;

  // Render Image Stack up to current step
  stack.innerHTML = expData
    .slice(0, expActiveIdx + 1)
    .map((step, i) => {
      if (!step.image) return '';
      // Only the last image drops in, previous ones are fully visible
      const isLast = (i === expActiveIdx);
      return `<img src="${step.image}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;animation: ${isLast ? 'fadeIn 0.5s ease forwards' : 'none'};">`;
    }).join('');

  // Render Texts for current step
  const curr = expData[expActiveIdx];
  if (curr) {
    procArea.textContent = curr.procedure || '...';
    obsArea.textContent = curr.observation || '...';
    takeArea.textContent = curr.takeaway || '...';
  }
}

// Ensure the animation exists
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
  }
  `;
document.head.appendChild(style);

// --- AUTO SAVE ---

let expAutoSaveTimer = null;
function triggerExpAutoSave() {
  const statusMenu = document.getElementById('exp-save-status');
  if (statusMenu) statusMenu.textContent = 'Saving...';

  clearTimeout(expAutoSaveTimer);
  expAutoSaveTimer = setTimeout(async () => {
    // We reuse the existing firebase topic save, just stuffing our 'expData' into 'cardData' so it saves correctly
    // or we can just send it directly if we modify the save structure.
    cardData = expData;
    const saved = { cardData, globalConfig: {} };

    const res = await firebaseDbCall('save', {
      userId: currentUser,
      subject: currentSubject,
      chapter: currentChapter,
      topic: currentTopic,
      jsonData: JSON.stringify(saved),
      htmlData: '' // The builder doesn't generate HTML during autosave, only Publish
    });

    if (statusMenu) {
      statusMenu.textContent = res.message ? 'Saved' : 'Save Failed';
      setTimeout(() => {
        if (statusMenu.textContent === 'Saved') statusMenu.textContent = '';
      }, 3000);
    }
  }, 1500);
}

async function expPublish() {
  alert("Publishing feature for Experiments will generate a custom viewer HTML. We will implement this next!");
}
