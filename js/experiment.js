// --- EXPERIMENT DASHBOARD LOGIC ---

function openExperimentBuilder(chap, top, isNew) {
  currentChapter = chap;
  currentTopic = top;
  appMode = 'experiment';

  // Check if we have loaded data (from ui.js -> openTopic loading logic)
  let expData = null;
  if (!isNew && Array.isArray(cardData) && cardData.length === 1 && cardData[0].type === 'html_experiment') {
    expData = cardData[0];
  }

  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('editor-view').style.display = 'none';

  const builder = document.getElementById('experiment-builder');
  builder.style.display = 'flex';
  builder.style.flexDirection = 'column';
  builder.style.alignItems = 'center';
  builder.style.justifyContent = 'center';
  builder.style.padding = '40px';

  renderExperimentDashboard(expData);
}

function closeExperimentBuilder() {
  document.getElementById('experiment-builder').style.display = 'none';
  initHub();
}

function renderExperimentDashboard(expData) {
  const builder = document.getElementById('experiment-builder');

  let contentHtml = '';

  if (expData) {
    // We have an experiment loaded
    contentHtml = `
      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:40px; width:100%; max-width:600px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
        <span style="font-size:3rem; display:block; margin-bottom:16px;">🧪</span>
        <h2 style="font-family:'Inter', sans-serif; font-size:1.5rem; color:#0f172a; margin-bottom:8px;">Interactive Experiment Active</h2>
        <p style="font-family:'Inter', sans-serif; color:#64748b; margin-bottom:32px;">File loaded: <strong>${expData.filename}</strong></p>
        
        <div style="display:flex; gap:16px; justify-content:center;">
          <button onclick="viewExperimentHtml()" style="background:#3b82f6; color:white; border:none; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; font-family:'Inter', sans-serif; transition:0.2s; box-shadow:0 4px 6px -1px rgba(59, 130, 246, 0.3);">
            ▶ Preview Experiment
          </button>
          
          <label style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; font-family:'Inter', sans-serif; transition:0.2s;">
            <input type="file" accept=".html" style="display:none;" onchange="handleExperimentUpload(event)">
            Replace File
          </label>
        </div>
      </div>
    `;
  } else {
    // Empty state
    contentHtml = `
      <div style="background:#fff; border:1px dashed #cbd5e1; border-radius:12px; padding:60px 40px; width:100%; max-width:500px; text-align:center;">
        <span style="font-size:3rem; display:block; margin-bottom:16px; opacity:0.5;">📄</span>
        <h2 style="font-family:'Inter', sans-serif; font-size:1.2rem; color:#475569; margin-bottom:12px;">No Experiment Loaded</h2>
        <p style="font-family:'Inter', sans-serif; color:#94a3b8; font-size:0.9rem; margin-bottom:24px;">Upload your standalone HTML experiment file below.</p>
        
        <label style="background:#22c55e; color:white; border:none; padding:12px 24px; border-radius:8px; font-weight:600; cursor:pointer; font-family:'Inter', sans-serif; box-shadow:0 4px 6px -1px rgba(34, 197, 94, 0.3); display:inline-block;">
          <input type="file" accept=".html" style="display:none;" onchange="handleExperimentUpload(event)">
          Upload HTML File
        </label>
      </div>
    `;
  }

  builder.innerHTML = `
    <!-- Header -->
    <div style="width:100%; max-width:800px; display:flex; justify-content:space-between; align-items:center; margin-bottom:32px;">
      <div>
        <h1 style="font-family:'Inter', sans-serif; font-size:1.5rem; color:#0f172a; margin:0;">${currentTopic}</h1>
        <p style="font-family:'Inter', sans-serif; color:#64748b; font-size:0.9rem; margin:4px 0 0 0;">${currentSubject} • ${currentChapter}</p>
      </div>
      <button onclick="closeExperimentBuilder()" style="background:#fff; border:1px solid #e2e8f0; padding:8px 16px; border-radius:6px; color:#475569; font-weight:600; cursor:pointer; font-family:'Inter', sans-serif; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
        🏠 Return to Hub
      </button>
    </div>
    
    <!-- Main Content -->
    ${contentHtml}
  `;
}

function handleExperimentUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const htmlContent = ev.target.result;

      // Update local state structure identical to how export.js does it
      cardData = [{
        type: 'html_experiment',
        filename: file.name,
        htmlContent: htmlContent
      }];
      globalConfig = { bg: { color: '#fff' }, type: 'experiment' };

      // Re-render dashboard
      renderExperimentDashboard(cardData[0]);

      // Save to Firebase backend directly (bypassing auto-save delay for immediate feedback)
      const saved = { cardData, globalConfig };

      const btnLabel = document.querySelector('label[style*="Replace"]') || document.querySelector('label[style*="Upload"]');
      const ogText = btnLabel.innerHTML;
      btnLabel.innerHTML = '⏳ Saving...';

      await dbCall('save', {
        subject: currentSubject,
        chapter: currentChapter,
        topic: currentTopic,
        jsonData: JSON.stringify(saved),
        htmlData: htmlContent
      });

      btnLabel.innerHTML = '✅ Saved';
      setTimeout(() => { btnLabel.innerHTML = ogText; }, 2000);

    } catch (err) {
      console.error("Experiment Upload Error:", err);
      alert('Error saving experiment: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function viewExperimentHtml() {
  if (!cardData || !cardData[0] || cardData[0].type !== 'html_experiment') {
    alert("No experiment data found."); return;
  }

  // Creates a blob from the raw HTML content and opens it in a new browser tab
  const blob = new Blob([cardData[0].htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
