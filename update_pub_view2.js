const fs = require('fs');

try {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // 1. Remove the broken openPubTopicSidebar logic at the end
    code = code.replace(/window\.openPubTopicSidebar[\s\S]*$/, '');

    // 2. We need to replace `initHub` & `renderHubContent` safely.
    // Wait, let's just replace from `if (currentSubject === 'Published Links') {` 
    // up to the exact end of `renderHubContent`.

    const startRegex = /if \(currentSubject === 'Published Links'\) \{/;
    const endRegex = /    html \+= \`<div class="chapter-card".*?openTopicSidebar[^}]*\}\s*/;

    // Actually, string replacement by regex is brittle. Let's find the exact indices.
    const lines = code.split('\n');
    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("if (currentSubject === 'Published Links') {")) {
            startIdx = i;
        }
        if (lines[i].startsWith("// --- TOPIC SIDEBAR ---")) {
            endIdx = i;
            break;
        }
    }

    if (startIdx !== -1 && endIdx !== -1) {
        const replacement = `  if (currentSubject === 'Published Links') {
    const pubList = await dbCall('list_published') || {};
    const tree = await dbCall('list') || {};
    renderHubContent(tree, pubList);
  } else {
    const tree = await dbCall('list');
    if (!tree) return;
    renderHubContent(tree[currentSubject] || {}, null);
  }
}

function setSubject(sub) { currentSubject = sub; appMode = 'dashboard'; pushHash(); initHub(); }

function renderHubContent(chaptersObj, pubList = null) {
  window.currentChaptersObj = chaptersObj;
  const cont = document.getElementById('hub-content');

  // ============== PUBLISHED LINKS DASHBOARD (All Subjects/Chapters/Topics Accordion) ==============
  if (pubList !== null) {
    let html = \`<div class="published-grid" style="display:flex; gap:20px; overflow-x:auto; padding-bottom:10px; align-items:flex-start;">\`;
    const subjects = Object.keys(chaptersObj).sort(); // tree

    if (subjects.length === 0) {
      cont.innerHTML = \`<div style="color:#64748b;font-size:14px;">No subjects created yet.</div>\`;
      return;
    }

    subjects.forEach((sub, sIdx) => {
      const subId = \`pub-sub-\${sIdx}\`;
      // We give the column a max height and standard auto overflow so large topic lists can scroll individually
      html += \`<div style="flex: 0 0 320px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; max-height: calc(100vh - 120px); overflow-y: auto;">\`;
      html += \`<h2 style="margin-top:0; margin-bottom:15px; color:#1e293b; border-bottom:2px solid #e2e8f0; padding-bottom:5px; font-size:18px;">\${sub}</h2>\`;
      html += \`<div id="\${subId}" class="chapter-list">\`;

      const chaps = Object.keys(chaptersObj[sub] || {}).sort();
      chaps.forEach((chap, cIdx) => {
        const topics = chaptersObj[sub][chap] ? chaptersObj[sub][chap].filter(t => t !== '_placeholder').sort() : [];
        const chapId = \`\${subId}-chap-\${cIdx}\`;
        
        // Build a lookup map for published links of this chapter
        const pubMap = {};
        if (pubList[sub] && pubList[sub][chap]) {
           pubList[sub][chap].forEach(pt => { pubMap[pt.topic] = pt; });
        }

        html += \`<div class="chapter-card" style="margin-bottom: 10px; padding: 10px; border: 1px solid #f1f5f9; background: #f8fafc; border-radius: 6px;">
                  <div class="card-title" style="cursor:pointer; font-weight: bold; font-size: 14px; margin-bottom: 0; display:flex; align-items:center;" onclick="togglePubChapter('\${chapId}')">
                    <span style="font-size:12px; color:#64748b; margin-right:5px;">▼</span>\${chap} 
                    <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: auto; background:#e2e8f0; padding:2px 6px; border-radius:10px;">\${topics.length}</span>
                  </div>
                  <div id="\${chapId}" class="pub-chapter-topics" style="display:none; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; max-height: 400px; overflow-y: auto;">
                    <div class="topics-list" style="display: flex; flex-direction: column; gap: 8px;">\`;

        topics.forEach(top => {
          const pubItem = pubMap[top];
          if (pubItem) {
            const d = new Date(pubItem.date?.toDate?.() || Date.now());
            const dStr = d.toLocaleDateString();
            html += \`<div class="topic-item" style="cursor:default; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f0fdf4;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                          <div class="topic-name" style="font-weight:bold; font-size: 13px;">📄 \${top}</div>
                          <div style="font-size:10px;color:#16a34a;">Published \${dStr}</div>
                        </div>
                        <div style="display:flex; gap:5px; flex-wrap: wrap;">
                          <button onclick="window.open('\${pubItem.url}', '_blank')" style="background:#e0f2fe; color:#0284c7; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex: 1;">View</button>
                          <button onclick="editPublishedTopic('\${sub}', '\${chap}', '\${pubItem.topic}', '\${pubItem.id}')" style="background:#fef3c7; color:#d97706; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex: 1;">Edit</button>
                          <button onclick="downloadTopicHtml('\${pubItem.topic}', '\${pubItem.id}')" style="background:#dcfce7; color:#16a34a; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex: 1;">HTML</button>
                          \${currentUser === 'admin' ? \`<button onclick="deletePublishedLink('\${pubItem.id}')" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; display:flex; justify-content:center; align-items:center;" title="Delete Published Link"><i style="pointer-events:none;">🗑</i></button>\` : ''}
                        </div>
                      </div>\`;
          } else {
             // Not published yet case
             html += \`<div class="topic-item" style="cursor:default; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                          <div class="topic-name" style="font-weight:bold; font-size: 13px;">📄 \${top}</div>
                        </div>
                        <div style="display:flex; gap:5px; flex-wrap: wrap;">
                          <button onclick="currentSubject='\${sub}'; openTopic('\${chap}', '\${top}')" style="background:#f1f5f9; color:#475569; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; width: 100%;">Open in Editor to Publish</button>
                        </div>
                      </div>\`;
          }
        });

        html += \`   </div>
                    <button class="card-add-btn" style="background:#f8fafc; color:#0f172a; border:1px solid #cbd5e1; margin-top:10px; width:100%;" onclick="downloadChapterZip('\${sub}', '\${chap}')">📦 Download Chapter ZIP</button>
                  </div>
                 </div>\`;
      });
      html += \`</div></div>\`; // End chapter-list and subject-col
    });

    html += \`</div>\`; // End published-grid
    cont.innerHTML = html;
    return;
  }

  // ============== STANDARD SUBJECT CHAPTER DASHBOARD ==============
  const chapters = Object.keys(chaptersObj).sort();
  if (chapters.length === 0) {
    cont.innerHTML = \`<div style="color:#64748b;font-size:14px;">No chapters yet. Click '+ Create New Chapter' to begin.</div>\`;
    return;
  }

  let html = \`<div class="chapter-grid">\`;

  chapters.forEach(chap => {
    const topicsList = chaptersObj[chap].filter(t => t !== '_placeholder').sort();

    // Add admin delete button if applicable
    let delBtn = '';
    if (currentUser === 'admin') {
      delBtn = \`<button class="admin-delete-btn chapter-delete-btn" onclick="event.stopPropagation(); deleteChapter('\${chap}')" title="Delete Chapter">
                  <i style="pointer-events:none;">🗑</i>
                </button>\`;
    }

    html += \`<div class="chapter-card" style="cursor:pointer;" onclick="openTopicSidebar('\${currentSubject}', '\${chap}')">
              <div class="card-title">\${chap} \${delBtn}</div>
              <div class="card-tags">
                <span class="card-tag tag-subject">\${currentSubject}</span>
                <span class="card-tag tag-count">\${topicsList.length} Topic(s)</span>
              </div>
             </div>\`;
  });

  html += \`</div>\`;
  cont.innerHTML = html;
}

`;

        const newLines = lines.slice(0, startIdx).concat([replacement]).concat(lines.slice(endIdx));
        let newCode = newLines.join('\n');

        // Make sure togglePubChapter exists!
        if (!newCode.includes("function togglePubChapter(id)")) {
            newCode += `\nwindow.togglePubChapter = function(id) {
  const topicsDiv = document.getElementById(id);
  if (!topicsDiv) return;
  const isCurrentlyOpen = topicsDiv.style.display === 'block';

  // Close all other open topic lists first
  document.querySelectorAll('.pub-chapter-topics').forEach(div => {
    div.style.display = 'none';
  });

  // Toggle the clicked one
  if (!isCurrentlyOpen) {
    topicsDiv.style.display = 'block';
  }
};\n`;
        } else {
            // if it does exist, it might be scoped correctly. Make it window attached just in case
            newCode = newCode.replace(/function togglePubChapter\(id\)/g, "window.togglePubChapter = function(id)");
        }

        fs.writeFileSync('js/ui.js', newCode);
        console.log('Update Complete - Restored Dropdown.');
    } else {
        console.log('Could not find start/end marks.');
    }

} catch (e) {
    console.error(e);
}
