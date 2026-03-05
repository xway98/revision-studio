// --- KEYBOARD ---

document.addEventListener('keydown', e => {
  const editing = document.activeElement?.contentEditable === 'true' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return; }
  if (e.key === 'Escape') { exitEditMode(); deselectEl(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && sel.type && !editing) { e.preventDefault(); deleteSelected(); return; }
  if (!editing) {
    if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); }
  }
});

// --- DRAG & DROP IMAGE ON CANVAS ---

const liveCanvas = () => document.getElementById('live-canvas');

liveCanvas;
document.addEventListener('DOMContentLoaded', () => {
  const lc = document.getElementById('live-canvas');
  lc.addEventListener('dragover', e => { e.preventDefault(); document.getElementById('drop-overlay').classList.add('active'); });
  lc.addEventListener('dragleave', e => { if (!lc.contains(e.relatedTarget)) document.getElementById('drop-overlay').classList.remove('active'); });
  lc.addEventListener('drop', e => {
    e.preventDefault();
    document.getElementById('drop-overlay').classList.remove('active');
    const file = [...(e.dataTransfer.files || [])].find(f => f.type.startsWith('image/'));
    if (!file) return;
    const pos = clientToCanvas(e.clientX, e.clientY);
    const xPct = Math.round(pos.x / 375 * 100);
    const yPct = Math.round(pos.y / 667 * 100);
    handleImageDrop(file, xPct, yPct);
  });
});

async function handleImageDrop(file, x, y) {
  if (!currentUser) {
    alert("You must be logged in to upload images.");
    return;
  }

  // Show uploading state
  const dropOverlay = document.getElementById('drop-overlay');
  const ogHtml = dropOverlay.innerHTML;
  dropOverlay.innerHTML = '<span>⏳ Uploading to Firebase...</span>';
  dropOverlay.classList.add('active');

  try {
    const ext = file.name.split('.').pop() || 'png';
    const filename = `uploads/${currentUser}/${Date.now()}.${ext}`;
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(filename);
    const snapshot = await fileRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    insertImage(downloadURL, x, y);
  } catch (err) {
    console.error("Image upload failed:", err);
    alert("Failed to upload image.");
  } finally {
    dropOverlay.innerHTML = ogHtml;
    dropOverlay.classList.remove('active');
  }
}

function insertImage(url, x, y) {
  const card = cardData[activeCardIdx];
  card.imgs.push({ url, width: 55, x, y, crop: { t: 0, r: 0, b: 0, l: 0 } });
  pushHist();
  renderCanvas();
  // Auto-select the new image
  const idx = card.imgs.length - 1;
  selectEl('img', activeCardIdx, idx);
}

// --- RENDER ALL ---

function renderAll() {
  renderCardsList();
  renderCanvas();
  renderPropsPanel();
  syncGlobalUI();
  if (typeof syncExperimentUI === 'function') syncExperimentUI();
  resizeCanvas();
}

// --- INIT ---

// Initialize Dashboard Hub instead of Editor
setTimeout(() => {
  initHub();
}, 100);


// --- AUTO SAVE ---

let autoSaveTimer = null;
function triggerAutoSave(immediate = false) {
  if (appMode !== 'editor' || !currentTopic) return;
  const btn = document.getElementById('drive-btn-label');
  if (btn) btn.textContent = '💾 Saving...';

  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    const saved = { cardData, globalConfig };
    let htmlData = '';
    if (typeof getExportCode === 'function') {
      try { htmlData = getExportCode(); } catch (e) { console.error(e); }
    }
    const res = await dbCall('save', {
      subject: currentSubject,
      chapter: currentChapter,
      topic: currentTopic,
      jsonData: JSON.stringify(saved),
      htmlData: htmlData
    });

    if (btn) {
      btn.textContent = res ? '💾 Saved' : '❌ Save Failed';
      setTimeout(() => {
        const b = document.getElementById('drive-btn-label');
        if (b) b.textContent = '🔗 Connect Google Drive';
      }, 3000);
    }
  }, immediate ? 0 : 2000);
}

