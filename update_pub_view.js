const fs = require('fs');

try {
    let code = fs.readFileSync('js/ui.js', 'utf8');

    // 1. Replace initHub lines 306-314
    code = code.replace(
        /if \(currentSubject === 'Published Links'\) \{[\s\S]*?renderHubContent[^}]*\} else \{[\s\S]*?renderHubContent[^}]*\}/,
        `if (currentSubject === 'Published Links') {
      const tree = await dbCall('list');
      const pubList = await dbCall('list_published') || {};
      if (!tree) return;
      window.currentStoreTree = tree;
      window.currentPubList = pubList;
      renderHubContent(tree, pubList);
    } else {
      const tree = await dbCall('list');
      if (!tree) return;
      window.currentStoreTree = tree;
      renderHubContent(tree[currentSubject] || {}, null);
    }`
    );

    // 2. Replace renderHubContent declaration
    code = code.replace(
        /function renderHubContent\(chaptersObj,\s*isPublishedObj\s*=\s*false\)\s*\{/,
        `function renderHubContent(chaptersObj, pubList = null) {`
    );

    // 3. Replace the isPublishedObj condition body
    const newPubBody = `if (pubList !== null) {
      let html = \`<div class="published-grid" style="display:flex; gap:20px; overflow-x:auto; padding-bottom:10px; align-items:flex-start;">\`;
      const subjects = Object.keys(chaptersObj).sort();

      if (subjects.length === 0) {
        cont.innerHTML = \`<div style="color:#64748b;font-size:14px;">No subjects created yet.</div>\`;
        return;
      }

      subjects.forEach((sub, sIdx) => {
        const subId = \`pub-sub-\${sIdx}\`;
        html += \`<div style="flex: 0 0 320px; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; max-height: calc(100vh - 150px); overflow-y: auto;">\`;
        html += \`<h2 style="margin-top:0; margin-bottom:15px; color:#1e293b; border-bottom:2px solid #e2e8f0; padding-bottom:5px; font-size:18px;">\${sub}</h2>\`;
        html += \`<div id="\${subId}" class="chapter-list">\`;

        const chaps = Object.keys(chaptersObj[sub] || {}).sort();
        chaps.forEach((chap, cIdx) => {
          const topics = chaptersObj[sub][chap] ? chaptersObj[sub][chap].filter(t => t !== '_placeholder').sort() : [];
          const chapId = \`\${subId}-chap-\${cIdx}\`;

          html += \`<div class="chapter-card" style="margin-bottom: 10px; padding: 10px; border: 1px solid #f1f5f9; background: #f8fafc; border-radius: 6px; cursor:pointer;" onclick="openPubTopicSidebar('\${sub}', '\${chap}')">
                    <div class="card-title" style="font-weight: bold; font-size: 14px; margin-bottom: 0; display:flex; align-items:center;">
                      \${chap} 
                      <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: auto; background:#e2e8f0; padding:2px 6px; border-radius:10px;">\${topics.length}</span>
                    </div>
                   </div>\`;
        });
        html += \`</div></div>\`; // End chapter-list and subject-col
      });

      html += \`</div>\`; // End published-grid
      cont.innerHTML = html;
      return;
    }`;

    // It originally matches `if (isPublishedObj) { ... return; }`
    code = code.replace(/if \(isPublishedObj\) \{[\s\S]*?return;\s*\}/, newPubBody);

    // 4. Append the new sidebar function and openTopicFromPublish
    const newFunctions = `
  window.openPubTopicSidebar = function(sub, chap) {
    currentSubject = sub;
    const topicsList = (window.currentStoreTree[sub] && window.currentStoreTree[sub][chap] ? window.currentStoreTree[sub][chap] : []).filter(t => t !== '_placeholder').sort();
    const pubListMap = {};
    if (window.currentPubList && window.currentPubList[sub] && window.currentPubList[sub][chap]) {
       window.currentPubList[sub][chap].forEach(pt => { pubListMap[pt.topic] = pt; });
    }

    document.getElementById('sidebar-chapter-title').textContent = chap;

    let html = '';
    if (topicsList.length === 0) {
      html = \`<div style="color:#64748b;font-size:14px;text-align:center;margin-top:20px;">No topics here yet.</div>\`;
    } else {
      topicsList.forEach(top => {
        const pubItem = pubListMap[top];
        if (pubItem) {
          const d = new Date(pubItem.date?.toDate?.() || Date.now());
          const dStr = d.toLocaleDateString();
          html += \`<div class="topic-pill sidebar-pill" style="display:flex; flex-direction:column; align-items:start; padding:10px; background:#f0fdf4; border:1px solid #bbf7d0;">
                     <div style="font-weight:bold; margin-bottom:5px; width:100%;">📄 \${top} <span style="float:right; font-size:10px; color:#16a34a; font-weight:normal;">\${dStr}</span></div>
                     <div style="display:flex; gap:5px; margin-top:5px; width:100%; justify-content: flex-start;">
                        <button onclick="window.open('\${pubItem.url}', '_blank')" style="background:#e0f2fe; color:#0284c7; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex:1;">View</button>
                        <button onclick="editPublishedTopic('\${sub}', '\${chap}', '\${pubItem.topic}', '\${pubItem.id}')" style="background:#fef3c7; color:#d97706; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex:1;">Edit (Pub)</button>
                        <button onclick="downloadTopicHtml('\${pubItem.topic}', '\${pubItem.id}')" style="background:#dcfce7; color:#16a34a; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex:1;">HTML</button>
                        \${currentUser === 'admin' ? \`<button onclick="deletePublishedLink('\${pubItem.id}')" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex:0.4; display:flex; justify-content:center; align-items:center;" title="Delete Published Link"><i style="pointer-events:none;">🗑</i></button>\` : ''}
                     </div>
                   </div>\`;
        } else {
          html += \`<div class="topic-pill sidebar-pill" style="display:flex; flex-direction:column; align-items:start; padding:10px;">
                     <div style="font-weight:bold; margin-bottom:5px;">📄 \${top}</div>
                     <div style="display:flex; margin-top:5px; width:100%;">
                        <button onclick="openTopicFromPublish('\${sub}', '\${chap}', '\${top}')" style="background:#f1f5f9; color:#475569; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold; flex:1;">Open in Editor to Publish</button>
                     </div>
                   </div>\`;
        }
      });
    }

    html += \`<button class="card-add-btn" style="background:#f8fafc; color:#0f172a; border:1px solid #cbd5e1; margin-top:20px; width:100%;" onclick="downloadChapterZip('\${sub}', '\${chap}')">📦 Download Chapter ZIP</button>\`;

    document.getElementById('sidebar-topics-list').innerHTML = html;

    const btnCreate = document.getElementById('sidebar-add-topic-btn');
    if (btnCreate) btnCreate.style.display = 'none'; 

    document.getElementById('topic-sidebar').classList.add('open');
    document.getElementById('topic-sidebar-overlay').classList.add('open');
  };

  window.openTopicFromPublish = function(sub, chap, top) {
    closeTopicSidebar();
    currentSubject = sub;
    openTopic(chap, top);
  };
  `;

    if (!code.includes('window.openPubTopicSidebar')) {
        code += newFunctions;
    } else {
        code = code.replace(/window\.openPubTopicSidebar[\s\S]*/, newFunctions);
    }

    // Also remove togglePubChapter since it is dead now
    code = code.replace(/function togglePubChapter[\s\S]*\}\s*$/, '');

    fs.writeFileSync('js/ui.js', code);
    console.log('Update complete.');
} catch (e) {
    console.error(e);
}
