import re

file_path = r'C:\Users\DT.HANG\.gemini\antigravity\scratch\algebra1-tracker\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix CSS overlapping for unit-cell and progress-cell
if 'min-width: 280px;' not in content:
    content = content.replace('.unit-cell {', '.unit-cell {\n        min-width: 250px;')

# 2. Add Notes CSS before </style>
notes_css = '''
      /* Notes System */
      .note-icon {
        margin-left: 8px; font-size: 0.85em; cursor: pointer; opacity: 0.5; transition: 0.2s;
      }
      .note-icon:hover { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
      .modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(5px);
        display: none; align-items: center; justify-content: center; z-index: 9999;
      }
      .modal-content {
        background: var(--bg); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; width: 90%; max-width: 700px;
        max-height: 90vh; display: flex; flex-direction: column;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      }
      .modal-header {
        padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex; justify-content: space-between; align-items: center;
      }
      .modal-header h3 { margin: 0; font-size: 1.15rem; color: var(--accent2); line-height:1.4; }
      .close-btn {
        background: none; border: none; color: var(--text-muted); font-size: 1.5rem;
        cursor: pointer; transition: 0.2s; line-height: 1;
      }
      .close-btn:hover { color: white; }
      .modal-body {
        padding: 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 20px;
      }
      .note-editor-wrapper { display: flex; flex-direction: column; gap: 10px; }
      #note-textarea {
        width: 100%; min-height: 150px; background: rgba(0,0,0,0.2);
        border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
        padding: 16px; color: var(--text); font-family: inherit;
        resize: vertical; font-size: 0.95rem; line-height: 1.6;
      }
      #note-textarea:focus { outline: none; border-color: var(--accent); }
      #note-textarea.readonly { background: rgba(255,255,255,0.02); border-color: transparent; cursor: default; }
      .note-actions { display: flex; justify-content: flex-end; gap: 10px; }
      .btn-primary, .btn-secondary {
        padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; border: none;
      }
      .btn-primary { background: var(--accent); color: white; }
      .btn-secondary { background: rgba(255,255,255,0.1); color: white; }
      .btn-primary:hover { background: var(--accent2); }
      .btn-secondary:hover { background: rgba(255,255,255,0.15); }
      .child-note-details {
        background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px; margin-bottom: 10px; overflow: hidden;
      }
      .child-note-summary {
        padding: 12px 16px; background: rgba(0,0,0,0.3); cursor: pointer;
        font-weight: 600; color: #bae6fd; user-select: none;
      }
      .child-note-content {
        padding: 16px; color: #cbd5e1; font-size: 0.9rem; line-height: 1.6;
        border-top: 1px solid rgba(255,255,255,0.05);
      }
'''
if '.modal-overlay' not in content:
    content = content.replace('</style>', notes_css + '</style>')

# 3. Add Modal HTML before </body>
notes_html = '''
<!-- Note Modal -->
<div id="note-modal" class="modal-overlay" onclick="if(event.target===this) closeNoteModal()">
  <div class="modal-content">
    <div class="modal-header">
      <h3 id="note-title">Ghi chú</h3>
      <button class="close-btn" onclick="closeNoteModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="note-editor-wrapper">
        <textarea id="note-textarea" class="readonly" readonly placeholder="Viết ghi chú của bạn vào đây..."></textarea>
        <div class="note-actions">
          <button id="btn-edit-note" class="btn-secondary" onclick="toggleEditNote()">✏️ Sửa</button>
          <button id="btn-save-note" class="btn-primary" onclick="saveNote()" style="display:none;">💾 Lưu</button>
        </div>
      </div>
      <div id="note-children" class="note-children-container"></div>
    </div>
  </div>
</div>
'''
if 'id="note-modal"' not in content:
    content = content.replace('</body>', notes_html + '\n</body>')

# 4. Add JS logic before </body>
notes_js = '''
<script>
window.noteTitles = {};
let currentNoteType = '';
let currentNoteId = '';

function initNotes() {
  const table = document.getElementById('schedule-table');
  const rows = table.querySelectorAll('tbody tr');
  
  let currentUnit = null;
  let currentSection = null;
  let lessonCounter = 1;

  rows.forEach(row => {
    // 1. UNIT NOTE
    if (row.classList.contains('tbd-row') || row.querySelector('.unit-cell')) {
      let unitId = row.getAttribute('data-unit');
      if (unitId) {
        currentUnit = unitId;
        let titleWrap = row.querySelector('.unit-title-wrapper');
        if (titleWrap && !titleWrap.querySelector('.note-icon')) {
          let nameSpan = titleWrap.querySelector('.unit-name');
          let text = nameSpan ? nameSpan.textContent.replace('▼', '').trim() : '';
          window.noteTitles[unitId] = text;
          titleWrap.insertAdjacentHTML('beforeend', `<span class="note-icon" onclick="openNoteModal('unit', '${unitId}', event)" title="Ghi chú Unit">📝</span>`);
        }
      }
    }

    if (row.classList.contains('tbd-row')) return;

    // 2. SECTION NOTE
    if (row.querySelector('.section-cell')) {
      let secId = row.getAttribute('data-section');
      if (secId) {
        currentSection = secId;
        lessonCounter = 1;
        let secCell = row.querySelector('.section-cell');
        if (secCell && !secCell.querySelector('.note-icon')) {
          let text = secCell.textContent.replace('▼', '').trim();
          window.noteTitles[secId] = text;
          secCell.insertAdjacentHTML('beforeend', `<span class="note-icon" onclick="openNoteModal('section', '${secId}', event)" title="Ghi chú Section">📝</span>`);
        }
      }
    }

    // 3. LESSON NOTE
    let cells = row.querySelectorAll('td');
    let lessonCell = null;
    if (row.querySelector('.unit-cell') && row.querySelector('.section-cell')) {
       lessonCell = cells.length > 3 ? cells[3] : null;
    } else if (row.querySelector('.section-cell')) {
       lessonCell = cells.length > 1 ? cells[1] : null;
    } else {
       lessonCell = cells.length > 0 ? cells[0] : null;
    }

    if (lessonCell && !lessonCell.querySelector('.note-icon')) {
       let lessonId = `${currentSection}-l${lessonCounter}`;
       row.setAttribute('data-lesson', lessonId);
       lessonCounter++;
       
       let text = lessonCell.textContent.trim();
       window.noteTitles[lessonId] = text;
       lessonCell.insertAdjacentHTML('beforeend', ` <span class="note-icon" onclick="openNoteModal('lesson', '${lessonId}', event)" title="Ghi chú Bài học">📝</span>`);
    }
  });
}

window.openNoteModal = function(type, id, event) {
  if (event) event.stopPropagation();
  
  currentNoteType = type;
  currentNoteId = id;
  
  document.getElementById('note-title').textContent = window.noteTitles[id] || 'Ghi chú';
  
  const ta = document.getElementById('note-textarea');
  ta.value = localStorage.getItem('khan_note_' + id) || '';
  
  ta.readOnly = true;
  ta.classList.add('readonly');
  document.getElementById('btn-edit-note').style.display = 'inline-block';
  document.getElementById('btn-save-note').style.display = 'none';
  
  const childrenContainer = document.getElementById('note-children');
  childrenContainer.innerHTML = '';
  
  if (type === 'section') {
     Object.keys(window.noteTitles).forEach(key => {
        if (key.startsWith(id + '-l')) {
           let content = localStorage.getItem('khan_note_' + key);
           if (content && content.trim() !== '') {
              childrenContainer.insertAdjacentHTML('beforeend', createChildNoteHTML(window.noteTitles[key], content));
           }
        }
     });
  } else if (type === 'unit') {
     Object.keys(window.noteTitles).forEach(key => {
        if (key.startsWith(id + '-s') && key.split('-').length === 2) {
           let content = localStorage.getItem('khan_note_' + key);
           if (content && content.trim() !== '') {
              childrenContainer.insertAdjacentHTML('beforeend', createChildNoteHTML(window.noteTitles[key], content));
           }
        }
     });
  }
  
  document.getElementById('note-modal').style.display = 'flex';
}

window.closeNoteModal = function() {
  document.getElementById('note-modal').style.display = 'none';
}

window.toggleEditNote = function() {
  const ta = document.getElementById('note-textarea');
  ta.readOnly = false;
  ta.classList.remove('readonly');
  ta.focus();
  document.getElementById('btn-edit-note').style.display = 'none';
  document.getElementById('btn-save-note').style.display = 'inline-block';
}

window.saveNote = function() {
  const ta = document.getElementById('note-textarea');
  localStorage.setItem('khan_note_' + currentNoteId, ta.value);
  ta.readOnly = true;
  ta.classList.add('readonly');
  document.getElementById('btn-edit-note').style.display = 'inline-block';
  document.getElementById('btn-save-note').style.display = 'none';
}

function createChildNoteHTML(title, content) {
  return `
    <details class="child-note-details">
      <summary class="child-note-summary">${title}</summary>
      <div class="child-note-content">${content.replace(/\\n/g, '<br>')}</div>
    </details>
  `;
}

// init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
   setTimeout(initNotes, 500); // Wait for other scripts to render
});
</script>
'''
if 'function initNotes()' not in content:
    content = content.replace('</body>', notes_js + '\n</body>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done adding notes system')
