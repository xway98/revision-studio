// --- INLINE TEXT EDITING ---

function enterEditMode(el) {
  if (editingEl === el) return;
  exitEditMode();
  editingEl = el;
  el.classList.add('editing');
  const inner = el.querySelector('.c-el-inner');
  inner.contentEditable = 'true';
  inner.focus();
  // hide sel overlay handles while editing
  const ov = document.getElementById('sel-overlay');
  ov.querySelectorAll('.sel-handle').forEach(h => h.style.visibility = 'hidden');
  el.style.cursor = 'text';
}

// --- GLOBAL CONFIG UPDATES ---

function updateGlobal(sec, field, val) {
  if (!globalConfig[sec]) globalConfig[sec] = {};
  globalConfig[sec][field] = val;
  pushHist(); renderCanvas();
}

function toggleGlobal() {
  const t = document.getElementById('glob-toggle'), b = document.getElementById('global-body');
  t.classList.toggle('open'); b.classList.toggle('open');
}

// --- PROPERTIES PANEL ---

function renderPropsPanel() {
  const empty = document.getElementById('prop-empty-state');
  const content = document.getElementById('prop-content');
  if (!sel.type) { empty.style.display = 'flex'; content.style.display = 'none'; return; }
  empty.style.display = 'none'; content.style.display = 'block';
  const fonts = getFonts();

  if (sel.type === 'header') {
    const h = getCard().header;
    content.innerHTML = `
    <h3>📌 Header Properties</h3>
    <div class="prop-row"><div class="prop-lbl"><span>Font Family</span></div>
      <select onchange="getCard().header.font=this.value;pushHist();renderCanvas();">${fonts.map(f => `<option value="${f}" ${f === h.font ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
    <div class="prop-row"><div class="prop-lbl"><span>Font Size</span><span>${h.size}px</span></div>
      <input type="range" min="10" max="60" value="${h.size}" oninput="getCard().header.size=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Text Color</label>
      <input type="color" value="${h.color}" oninput="getCard().header.color=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Background Color</label>
      <input type="color" value="${h.bgColor}" oninput="getCard().header.bgColor=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>BG Opacity</span><span>${h.bgAlpha}%</span></div>
      <input type="range" min="0" max="100" value="${h.bgAlpha}" oninput="getCard().header.bgAlpha=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Width</span><span>${h.width}%</span></div>
      <input type="range" min="20" max="100" value="${h.width}" oninput="getCard().header.width=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Corner Radius</span><span>${h.borderR || 8}px</span></div>
      <input type="range" min="0" max="50" value="${h.borderR || 8}" oninput="getCard().header.borderR=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Border Color</label>
      <input type="color" value="${h.borderC || '#000000'}" oninput="getCard().header.borderC=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Border Width</span><span>${h.borderW || 0}px</span></div>
      <input type="range" min="0" max="10" value="${h.borderW || 0}" oninput="getCard().header.borderW=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Shadow Blur</span><span>${h.shadowBlur || 0}px</span></div>
      <input type="range" min="0" max="30" value="${h.shadowBlur || 0}" oninput="getCard().header.shadowBlur=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><div class="fmt-btns">
      <button class="fmt-btn danger" onclick="deselectEl();renderCanvas();">Deselect</button>
    </div></div>`;
  }

  else if (sel.type === 'text') {
    const t = getCard().texts[sel.idx];
    if (!t) { deselectEl(); return; }
    content.innerHTML = `
    <h3>📝 Text Box Properties</h3>
    <div class="prop-row"><label>Rich Formatting</label>
      <div class="fmt-btns" id="rich-toolbar">
        <button class="fmt-btn" onclick="richCmd('bold')" title="Bold"><b>B</b></button>
        <button class="fmt-btn" onclick="richCmd('italic')" title="Italic"><i>I</i></button>
        <button class="fmt-btn" onclick="richCmd('underline')" title="Underline"><u>U</u></button>
        <button class="fmt-btn" onclick="richCmd('strikeThrough')" title="Strike"><s>S</s></button>
        <button class="fmt-btn" onclick="richCmd('superscript')">x²</button>
        <button class="fmt-btn" onclick="richCmd('subscript')">x₂</button>
        <input type="color" value="#000000" class="fmt-btn" style="width:30px;padding:1px;" title="Text colour" onchange="richCmd('foreColor',this.value)">
        <input type="color" value="#ffff00" class="fmt-btn" style="width:30px;padding:1px;" title="Highlight" onchange="richCmd('hiliteColor',this.value)">
        <button class="fmt-btn danger" onclick="richCmd('removeFormat')" title="Clear">✕fmt</button>
      </div>
    </div>
    <div class="prop-row"><div class="prop-lbl"><span>Font Family</span></div>
      <select onchange="getCard().texts[${sel.idx}].font=this.value;pushHist();renderCanvas();">${fonts.map(f => `<option value="${f}" ${f === t.font ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
    <div class="prop-row"><div class="prop-lbl"><span>Font Size</span><span>${t.size}px</span></div>
      <input type="range" min="8" max="80" value="${t.size}" oninput="getCard().texts[${sel.idx}].size=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Base Text Color</label>
      <input type="color" value="${t.color}" oninput="getCard().texts[${sel.idx}].color=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Text Align</label>
      <div class="align-btns">
        ${['left', 'center', 'right', 'justify'].map(a => `<div class="align-btn${t.align === a ? ' active' : ''}" onclick="getCard().texts[${sel.idx}].align='${a}';pushHist();renderCanvas();renderPropsPanel();">${a === 'left' ? '⬅' : a === 'center' ? '⬛' : a === 'right' ? '➡' : '☰'}</div>`).join('')}
      </div></div>
    <div class="prop-row"><label>Weight</label>
      <div class="fmt-btns">
        <button class="fmt-btn${t.weight === 'normal' ? ' active' : ''}" onclick="getCard().texts[${sel.idx}].weight='normal';pushHist();renderCanvas();renderPropsPanel();">Normal</button>
        <button class="fmt-btn${t.weight === 'bold' ? ' active' : ''}" onclick="getCard().texts[${sel.idx}].weight='bold';pushHist();renderCanvas();renderPropsPanel();"><b>Bold</b></button>
      </div></div>
    <div class="prop-row"><div class="prop-lbl"><span>Line Spacing</span><span>${t.lineSpace}</span></div>
      <input type="range" min="1" max="3" step="0.1" value="${t.lineSpace}" oninput="getCard().texts[${sel.idx}].lineSpace=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=(+this.value).toFixed(1);renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Box Width</span><span>${t.width}%</span></div>
      <input type="range" min="10" max="100" value="${t.width}" oninput="getCard().texts[${sel.idx}].width=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position X</span><span>${t.x}%</span></div>
      <input type="range" min="0" max="100" value="${t.x}" oninput="getCard().texts[${sel.idx}].x=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position Y</span><span>${t.y}%</span></div>
      <input type="range" min="0" max="100" value="${t.y}" oninput="getCard().texts[${sel.idx}].y=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="fmt-btns">
      <button class="fmt-btn danger" onclick="deleteSelected()">🗑 Delete Box</button>
      <button class="fmt-btn" style="margin-left:auto;" onclick="deselectEl()">Deselect</button>
    </div>`;
  }

  else if (sel.type === 'img') {
    const img = getCard().imgs[sel.idx];
    if (!img) { deselectEl(); return; }
    content.innerHTML = `
    <h3>🖼 Image Properties</h3>
    <div class="prop-row"><label>Image URL</label>
      <input type="text" value="${img.url.startsWith('data:') ? '[Embedded image]' : img.url}" placeholder="Paste URL or drop image on canvas..." oninput="if(!this.value.startsWith('['))getCard().imgs[${sel.idx}].url=this.value;pushHist();renderCanvas();" style="font-size:11px;"></div>
    <div style="font-size:10px;color:#556677;margin-top:-6px;margin-bottom:8px;">💡 Drop an image file directly onto the canvas to upload automatically</div>
    <div class="prop-row"><div class="prop-lbl"><span>Width</span><span>${img.width}%</span></div>
      <input type="range" min="5" max="100" value="${img.width}" oninput="getCard().imgs[${sel.idx}].width=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position X</span><span>${img.x}%</span></div>
      <input type="range" min="0" max="100" value="${img.x}" oninput="getCard().imgs[${sel.idx}].x=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position Y</span><span>${img.y}%</span></div>
      <input type="range" min="0" max="100" value="${img.y}" oninput="getCard().imgs[${sel.idx}].y=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><label>Crop Tool</label>
      <div class="fmt-btns">
        <button class="fmt-btn" style="background:#f39c12;border-color:#f39c12;" onclick="startCrop()">✂ Open Crop Tool</button>
      </div>
      <div style="font-size:10px;color:#556677;margin-top:4px;">Drag the yellow handles on the canvas to crop, then click Apply.</div>
    </div>
    <div class="prop-row"><div class="prop-lbl"><span>Crop (T/R/B/L)</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#95a5a6;">
        <div>Top: ${(img.crop?.t || 0).toFixed(0)}%</div><div>Right: ${(img.crop?.r || 0).toFixed(0)}%</div>
        <div>Bottom: ${(img.crop?.b || 0).toFixed(0)}%</div><div>Left: ${(img.crop?.l || 0).toFixed(0)}%</div>
      </div>
      ${(img.crop?.t || img.crop?.r || img.crop?.b || img.crop?.l) ? `<button class="fmt-btn danger" style="margin-top:4px;width:100%;" onclick="getCard().imgs[${sel.idx}].crop={t:0,r:0,b:0,l:0};pushHist();renderCanvas();renderPropsPanel();">✕ Reset Crop</button>` : ''}
    </div>
    <div class="prop-sep"></div>
    <div class="fmt-btns">
      <button class="fmt-btn danger" onclick="deleteSelected()">🗑 Delete Image</button>
      <button class="fmt-btn" onclick="deselectEl()">Deselect</button>
    </div>`;
  }
}

// Rich text commands — apply to the currently editing element
function richCmd(cmd, val) {
  let inner = null;
  if (editingEl) { inner = editingEl.querySelector('.c-el-inner'); }
  else if (sel.type === "text") {
    const el = getElDOM("text", sel.idx);
    if (el) { enterEditMode(el); inner = el.querySelector(".c-el-inner"); }
  }
  if (!inner) return;
  inner.focus();
  document.execCommand(cmd, false, val || null);
  // Sync back with sanitization to strip browser-injected font-family noise
  if (sel.type === "text") {
    const baseFont = getCard().texts[sel.idx]?.font;
    const cleaned = sanitizeRichHTML(inner.innerHTML, baseFont);
    if (cleaned !== inner.innerHTML) inner.innerHTML = cleaned;
    getCard().texts[sel.idx].text = cleaned;
    pushHist();
  }
}

// --- CARDS LIST ---

function renderCardsList() {
  const list = document.getElementById('cards-list');
  list.innerHTML = cardData.map((c, i) => `
    <div class="card-pill${i === activeCardIdx ? ' active' : ''}" onclick="deselectEl();activeCardIdx=${i};renderAll();pushHash();">
      <span class="card-pill-num">${i + 1}</span>
      <span class="card-pill-title">${c.header.text || '(untitled)'}</span>
      <span class="card-pill-btns">
        <button class="cpb cpb-dup" onclick="duplicateCard(${i},event)">⧉</button>
        <button class="cpb cpb-del" onclick="deleteCard(${i},event)">✕</button>
      </span>
    </div>`).join('');
  document.getElementById('card-counter').textContent = `Card ${activeCardIdx + 1} / ${cardData.length}`;
}

// --- SYNC GLOBAL SETTINGS UI ---

function syncGlobalUI() {
  const s = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  s('g-bg', globalConfig.bg.color);
  s('g-bgimg', globalConfig.bg.imgUrl || '');
  s('g-trans', globalConfig.transition?.type || 'fade');
  s('g-prog', String(globalConfig.progress?.show !== false));
  s('g-font-url', globalConfig.customFont?.url || '');
  s('g-font-name', globalConfig.customFont?.name || '');
  s('g-logo-url', globalConfig.logo?.url || '');
  s('g-logo-w', globalConfig.logo?.width || 25);
  document.getElementById('g-logo-w-v').textContent = (globalConfig.logo?.width || 25) + '%';
  s('drive-client-id', globalConfig.drive?.clientId || '');
  s('drive-folder-id', globalConfig.drive?.folderId || '');
}


// --- DASHBOARD LOGIC ---

async function dbCall(action, params = {}) {
  try {
    const res = await window.firebaseDbCall(action, { userId: currentUser, password: currentPassword, ...params });
    if (res && res.error) {
      alert('Error: ' + res.error); return null;
    }
    return res;
  } catch (e) {
    console.error(e);
    alert('Firebase database error.');
    return null;
  }
}

async function verifyUser() {
  const idInput = document.getElementById('user-id-input').value.trim();
  const passInput = document.getElementById('password-input').value.trim();

  if (!idInput) { alert("Please enter a User ID."); return; }
  if (!passInput) { alert("Please enter a Password."); return; }

  const btn = event.target; const og = btn.textContent; btn.textContent = 'Verifying...'; btn.disabled = true;

  // Temporarily set currentUser for the request
  const tempUser = currentUser; const tempPass = currentPassword;
  currentUser = idInput; currentPassword = passInput;

  console.log(`Attempting login with Firebase for User: ${idInput}`);
  const res = await dbCall('verify_user');

  btn.textContent = og; btn.disabled = false;
  if (res === true) {
    console.log("Login successful!");
    currentUser = idInput;
    currentPassword = passInput;
    localStorage.setItem('revStudioUser', idInput);
    localStorage.setItem('revStudioPass', passInput);
    initHub().then(() => {
      // After successfully logging in and loading the hub, check for a deep link
      if (window.location.hash) {
        parseHash();
      }
    });
  } else {
    currentUser = tempUser;
    currentPassword = tempPass;
    alert("Invalid User ID or Password.");
  }
}

function logoutAdmin() {
  currentUser = null; currentPassword = null;
  localStorage.removeItem('revStudioUser');
  localStorage.removeItem('revStudioPass');
  document.getElementById('hub-container').style.display = 'none';
  document.getElementById('login-modal').style.display = 'flex';
}

async function initHub() {
  appMode = 'dashboard';
  document.getElementById('editor-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'flex';

  if (!currentUser) {
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('hub-container').style.display = 'none';

    // Check for deep link on first load even before login
    if (window.location.hash) {
      // The parseHash will execute AFTER login is successful inside verifyUser
    }
    return;
  }
  document.getElementById('login-modal').style.display = 'none';
  document.getElementById('hub-container').style.display = 'flex';
  document.getElementById('hub-user-disp').textContent = currentUser;

  if (!currentSubject) currentSubject = 'Physics';

  // Set active sidebar tab
  document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
  const tabMatches = Array.from(document.querySelectorAll('.sidebar-tab')).filter(t => t.textContent.includes(currentSubject));
  if (tabMatches.length) tabMatches[0].classList.add('active');

  // Update header title
  const titleDisp = document.getElementById('hub-title-disp');
  if (titleDisp) titleDisp.textContent = currentSubject;

  // Hide Create Chapter button defensively on Published Links
  const createBtn = document.getElementById('btn-create-chapter');
  if (createBtn) {
    createBtn.style.display = (currentSubject === 'Published Links') ? 'none' : 'block';
  }

  if (currentSubject === 'Published Links') {
    const pubList = await dbCall('list_published');
    if (!pubList) return;
    renderHubContent(pubList || {}, true);
  } else {
    const tree = await dbCall('list');
    if (!tree) return;
    renderHubContent(tree[currentSubject] || {}, false);
  }
}

function setSubject(sub) { currentSubject = sub; appMode = 'dashboard'; pushHash(); initHub(); }

function renderHubContent(chaptersObj, isPublishedObj = false) {
  window.currentChaptersObj = chaptersObj;
  const cont = document.getElementById('hub-content');

  if (isPublishedObj) {
    let html = `<div class="published-grid" style="display:flex; gap:20px; overflow-x:auto; padding-bottom:10px; align-items:flex-start;">`;
    const subjects = Object.keys(chaptersObj).sort();

    if (subjects.length === 0) {
      cont.innerHTML = `<div style="color:#64748b;font-size:14px;">You haven't published any revision cards yet.</div>`;
      return;
    }

    subjects.forEach((sub, sIdx) => {
      const subId = `pub-sub-${sIdx}`;
      html += `<div style="flex: 0 0 320px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; max-height: 80vh; overflow-y: auto;">`;
      html += `<h2 style="margin-top:0; margin-bottom:15px; color:#1e293b; border-bottom:2px solid #e2e8f0; padding-bottom:5px; font-size:18px;">${sub}</h2>`;
      html += `<div id="${subId}" class="chapter-list">`;

      const chaps = Object.keys(chaptersObj[sub]).sort();
      chaps.forEach((chap, cIdx) => {
        const topics = chaptersObj[sub][chap].sort((a, b) => a.topic.localeCompare(b.topic));
        const chapId = `${subId}-chap-${cIdx}`;

        html += `<div class="chapter-card" style="margin-bottom: 10px; padding: 10px; border: 1px solid #f1f5f9; background: #f8fafc; border-radius: 6px;">
                  <div class="card-title" style="cursor:pointer; font-weight: bold; font-size: 14px; margin-bottom: 0; display:flex; align-items:center;" onclick="togglePubChapter('${chapId}')">
                    <span style="font-size:12px; color:#64748b; margin-right:5px;">▼</span>${chap} 
                    <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: auto; background:#e2e8f0; padding:2px 6px; border-radius:10px;">${topics.length}</span>
                  </div>
                  <div id="${chapId}" class="pub-chapter-topics" style="display:none; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                    <div class="topics-list">`;

        topics.forEach(item => {
          const d = new Date(item.date?.toDate?.() || Date.now());
          const dStr = d.toLocaleDateString();
          html += `<div class="topic-item" style="cursor:default; display:flex; justify-content:space-between; align-items:center;">
                      <div>
                        <div class="topic-name" style="font-weight:bold;">📄 ${item.topic}</div>
                        <div style="font-size:10px;color:#94a3b8;">${dStr}</div>
                      </div>
                     <div style="display:flex; gap:5px;">
                        <button onclick="window.open('${item.url}', '_blank')" style="background:#e0f2fe; color:#0284c7; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">View</button>
                        <button onclick="editPublishedTopic('${sub}', '${chap}', '${item.topic}', '${item.id}')" style="background:#fef3c7; color:#d97706; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">Edit</button>
                        <button onclick="downloadTopicHtml('${item.topic}', '${item.id}')" style="background:#dcfce7; color:#16a34a; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">HTML</button>
                        ${currentUser === 'admin' ? `<button onclick="deletePublishedLink('${item.id}')" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;" title="Delete Published Link"><i style="pointer-events:none;">🗑</i></button>` : ''}
                      </div>
                    </div>`;
        });

        html += `   </div>
                    <button class="card-add-btn" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; margin-top:10px;" onclick="downloadChapterZip('${sub}', '${chap}')">📦 Download Chapter ZIP</button>
                  </div>
                 </div>`;
      });
      html += `</div></div>`; // End chapter-list and subject-col
    });

    html += `</div>`; // End published-grid
    cont.innerHTML = html;
    return;
  }

  const chapters = Object.keys(chaptersObj).sort();
  if (chapters.length === 0) {
    cont.innerHTML = `<div style="color:#64748b;font-size:14px;">No chapters yet. Click '+ Create New Chapter' to begin.</div>`;
    return;
  }

  let html = `<div class="chapter-grid">`;

  chapters.forEach(chap => {
    const topicsList = chaptersObj[chap].filter(t => t !== '_placeholder').sort();

    // Add admin delete button if applicable
    let delBtn = '';
    if (currentUser === 'admin') {
      delBtn = `<button class="admin-delete-btn chapter-delete-btn" onclick="event.stopPropagation(); deleteChapter('${chap}')" title="Delete Chapter">
                  <i style="pointer-events:none;">🗑</i>
                </button>`;
    }

    html += `<div class="chapter-card" style="cursor:pointer;" onclick="openTopicSidebar('${currentSubject}', '${chap}')">
              <div class="card-title">${chap} ${delBtn}</div>
              <div class="card-tags">
                <span class="card-tag tag-subject">${currentSubject}</span>
                <span class="card-tag tag-count">${topicsList.length} Topic(s)</span>
              </div>
             </div>`;
  });

  html += `</div>`;
  cont.innerHTML = html;
}

// --- TOPIC SIDEBAR ---

function openTopicSidebar(sub, chap) {
  currentSubject = sub;
  const topicsList = (window.currentChaptersObj[chap] || []).filter(t => t !== '_placeholder').sort();

  document.getElementById('sidebar-chapter-title').textContent = chap;

  let html = '';
  if (topicsList.length === 0) {
    html = `<div style="color:#64748b;font-size:14px;text-align:center;margin-top:20px;">No topics here yet.</div>`;
  } else {
    topicsList.forEach(top => {
      let delBtn = '';
      if (currentUser === 'admin') {
        delBtn = `<button class="admin-delete-btn" onclick="event.stopPropagation(); deleteTopic('${chap}','${top}')" title="Delete Topic">
                    <i style="pointer-events:none;">🗑</i>
                  </button>`;
      }

      html += `<div class="topic-pill sidebar-pill" style="cursor:pointer;" onclick="openTopic('${chap}','${top}')">
                 <span>📄 ${top}</span>
                 ${delBtn}
               </div>`;
    });
  }

  document.getElementById('sidebar-topics-list').innerHTML = html;

  // Bind the Add Topic button
  document.getElementById('sidebar-add-topic-btn').onclick = () => openCreateTopicModal(chap);

  // Slide out panels
  document.getElementById('topic-sidebar').classList.add('open');
  document.getElementById('topic-sidebar-overlay').classList.add('open');
}

function closeTopicSidebar() {
  document.getElementById('topic-sidebar').classList.remove('open');
  document.getElementById('topic-sidebar-overlay').classList.remove('open');
}

// --- ADMIN DELETION COMMANDS ---

async function deleteChapter(chap) {
  if (!confirm(`Are you sure you want to delete the chapter "${chap}" and ALL its topics?\n\nThis cannot be undone.`)) return;
  const res = await dbCall('delete_chapter', { subject: currentSubject, chapter: chap });
  if (res) initHub();
}

async function deleteTopic(chap, top) {
  if (!confirm(`Are you sure you want to delete the topic "${top}"?`)) return;
  const res = await dbCall('delete_topic', { subject: currentSubject, chapter: chap, topic: top });
  if (res) {
    // Refresh the sidebar immediately
    await initHub();
    // Assuming chaptersObj is updated synchronously by initHub (it is), re-open the sidebar to see changes
    if (document.getElementById('topic-sidebar').classList.contains('open')) {
      openTopicSidebar(currentSubject, chap);
    }
  }
}

async function deletePublishedLink(id) {
  if (!confirm(`Are you sure you want to permanently delete this published link?`)) return;
  const res = await dbCall('delete_published', { id });
  if (res) initHub();
}

// --- MODAL CREATION LOGIC ---

function openCreateChapterModal() {
  document.getElementById('input-modal-title').textContent = 'Create New Chapter in ' + currentSubject;
  const input = document.getElementById('input-modal-value');
  input.value = '';
  input.placeholder = 'e.g. Thermodynamics, Cell Biology...';
  document.getElementById('input-modal').style.display = 'flex';

  document.getElementById('input-modal-confirm').onclick = async () => {
    const n = input.value;
    if (n && n.trim()) {
      document.getElementById('input-modal').style.display = 'none';
      await dbCall('save', { subject: currentSubject, chapter: n.trim(), topic: '_placeholder', jsonData: '{}' });
      initHub();
    }
  };
}

function openCreateTopicModal(chap) {
  if (typeof closeTopicSidebar === 'function') closeTopicSidebar();
  document.getElementById('input-modal-title').textContent = 'Add Topic to ' + chap;
  const input = document.getElementById('input-modal-value');
  input.value = '';
  input.placeholder = 'e.g. Entropy, Ribosomes...';
  document.getElementById('input-modal').style.display = 'flex';

  document.getElementById('input-modal-confirm').onclick = () => {
    const n = input.value;
    const cleanName = n ? n.trim() : '';
    if (cleanName) {
      document.getElementById('input-modal').style.display = 'none';
      openEditor(chap, cleanName, true);
    }
  };
}

function togglePubCollapse(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// --- PUBLISHED LINKS ACTIONS ---

async function editPublishedTopic(sub, chap, top, pubId) {
  currentSubject = sub;
  openTopic(chap, top);

  // If the user's local topic doesn't exist, try to recover from the published card's HTML metadata.
  // Wait a tiny bit for openTopic to fail/execute
  setTimeout(async () => {
    if (!cardData || cardData.length === 0 || (cardData.length === 1 && cardData[0].texts[0].text === "Tap to edit this text box")) {
      const res = await dbCall('get_published_html', { id: pubId });
      if (res && res.html) {
        try {
          const doc = new DOMParser().parseFromString(res.html, 'text/html');
          const meta = doc.getElementById('studio-save-data');
          if (meta) {
            const data = JSON.parse(decodeURIComponent(atob(meta.getAttribute('content'))));
            cardData = data.cardData;
            globalConfig = data.globalConfig;
            openEditor(chap, top, false);
            alert("Recovered topic data from published version.");
          }
        } catch (e) { console.error("Could not recover JSON from published HTML", e); }
      }
    }
  }, 500);
}

async function downloadTopicHtml(top, pubId) {
  try {
    const res = await dbCall('get_published_html', { id: pubId });
    if (!res || !res.html) throw new Error("Could not fetch published HTML data from server.");

    const htmlBlob = new Blob([res.html], { type: 'text/html' });
    const cleanName = top.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const a = document.createElement('a');
    a.href = URL.createObjectURL(htmlBlob);
    a.download = cleanName + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    alert('Failed to download HTML: ' + err.message);
  }
}

async function downloadChapterZip(sub, chap) {
  try {
    // 1. Fetch the published list to get URLs for the entire chapter
    const pubList = await dbCall('list_published');
    if (!pubList || !pubList[sub] || !pubList[sub][chap]) {
      alert("No published topics found for this chapter."); return;
    }

    const topics = pubList[sub][chap];
    if (topics.length === 0) return;

    // 2. Initialize JSZip
    const zip = new JSZip();
    const folder = zip.folder(chap.replace(/[^a-z0-9]/gi, '_'));

    // 3. Download each HTML file directly from DB and add to ZIP
    for (const item of topics) {
      if (!item.id) continue;
      const res = await dbCall('get_published_html', { id: item.id });
      if (res && res.html) {
        const cleanName = item.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        folder.file(cleanName + '.html', res.html);
      }
    }

    // 4. Generate ZIP blob and trigger download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = chap.replace(/[^a-z0-9]/gi, '_') + '_revision_cards.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  } catch (err) {
    console.error(err);
    alert('Failed to generate ZIP: ' + err.message);
  }
}

async function openTopic(chap, top) {
  let data;
  try {
    data = await dbCall('load', { subject: currentSubject, chapter: chap, topic: top });
  } catch (e) {
    console.warn("Topic load failed, initializing fresh:", e.message);
  }

  if (data && data.json) {
    try {
      const p = JSON.parse(data.json);
      if (!p.cardData) throw new Error("Missing cardData array");
      cardData = p.cardData; globalConfig = p.globalConfig;
      openEditor(chap, top, false);
    } catch (e) {
      console.warn('Corrupt or empty topic data, initializing fresh:', data.json);
      openEditor(chap, top, true);
    }
  } else {
    // Topic metadata exists but no saved data, or load failed entirely (new topic)
    openEditor(chap, top, true);
  }
}

function openEditor(chap, top, isNew) {
  currentChapter = chap; currentTopic = top; appMode = 'editor';
  if (isNew) {
    cardData = [{ type: 'revision', header: { text: top, font: 'Arial', size: 22, color: '#ffffff', bgColor: '#3498db', bgAlpha: 100, x: 50, y: 7, width: 90, borderW: 0, borderC: '#000', borderR: 8, shadowBlur: 0, shadowAlpha: 50, shadowColor: '#000' }, texts: [{ text: 'Tap to edit this text box', font: 'Arial', size: 17, x: 50, y: 44, align: 'center', color: '#2c3e50', weight: 'normal', lineSpace: 1.5, width: 85 }], imgs: [] }];
    if (typeof triggerAutoSave === 'function') triggerAutoSave(true);
  }
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('editor-view').style.display = 'flex';
  activeCardIdx = 0; hist = []; histIdx = -1; deselectEl(); renderAll(); pushHist(); pushHash();
}

function closeEditor() { appMode = 'dashboard'; pushHash(); initHub(); }

// --- URL HASH ROUTING (DEEP LINKING) ---

function pushHash() {
  if (!currentUser) return;
  const params = new URLSearchParams();
  if (appMode === 'dashboard') {
    if (currentSubject) params.set('subject', currentSubject);
  } else if (appMode === 'editor') {
    if (currentSubject) params.set('subject', currentSubject);
    if (currentChapter) params.set('chapter', currentChapter);
    if (currentTopic) params.set('topic', currentTopic);
    params.set('card', activeCardIdx + 1);
  }
  const newHash = params.toString() ? '#' + params.toString() : '';
  if (window.location.hash !== newHash) {
    // replaceState prevents building up a massive back-button history
    // when just clicking through flashcards rapidly.
    window.history.replaceState(null, '', newHash || window.location.pathname);
  }
}

async function parseHash() {
  if (!currentUser) return;
  const hash = window.location.hash.substring(1);
  if (!hash) {
    if (appMode === 'editor') closeEditor();
    return;
  }

  const params = new URLSearchParams(hash);
  const hSub = params.get('subject');
  const hChap = params.get('chapter');
  const hTop = params.get('topic');
  const hCard = parseInt(params.get('card')) || 1;

  if (hSub && hSub !== currentSubject) {
    currentSubject = hSub;
  }

  // If we have chapter and topic, we should be in the editor
  if (hChap && hTop) {
    if (appMode !== 'editor' || currentChapter !== hChap || currentTopic !== hTop) {
      await openTopic(hChap, hTop);
    }
    const targetIdx = hCard - 1;
    if (activeCardIdx !== targetIdx && targetIdx >= 0 && targetIdx < cardData.length) {
      activeCardIdx = targetIdx;
      deselectEl();
      renderAll();
    }
  } else {
    // Otherwise we should be in the dashboard
    if (appMode === 'editor') {
      closeEditor();
    } else {
      // Re-trigger initHub to refresh the dashboard view for the subject
      initHub();
    }
  }
}
