import re

file_path = r'C:\Users\DT.HANG\.gemini\antigravity\scratch\algebra1-tracker\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Expected Dates for U11-U14
new_dates = {
    'u11': '09/11/2026',
    'u12': '30/11/2026',
    'u13': '21/12/2026',
    'u14': '11/01/2027'
}
def replace_exp_date(match):
    uid = match.group(1)
    if uid in new_dates:
        return f'id="exp-{uid}">{new_dates[uid]}</strong>'
    return match.group(0)

pattern = r'id=\"exp-(u1[1-4])\">(\d{2}/\d{2}/\d{4})</strong>'
content = re.sub(pattern, replace_exp_date, content)

# 2. Inject "Thi học kỳ 1" row between u10 and u11
hk1_row = '''
            <tr class="tbd-row" data-unit="hk1" data-section="hk1-s1">
              <td class="unit-cell clickable" onclick="schedToggleUnit('hk1',this)">
                <div class="unit-title-wrapper"><span class="unit-name"><span class="toggle-icon">▼</span> 🎓 Thi Học Kì 1</span><div class="s-badge" data-unit="hk1" onclick="schedOpenMenu(event,'hk1')"></div></div>
              </td>
              <td class="progress-cell">
                <div class="prog-expected">Dự kiến:<br><strong id="exp-hk1">19/10/2026</strong></div>
                <div class="prog-input-group">
                  <input type="date" class="prog-input" id="act-hk1">
                  <button class="prog-btn" onclick="saveProgress('hk1')">💾 Cập nhật</button>
                </div>
                <div id="eval-hk1" class="prog-eval" style="display:none;"></div>
              </td>
              <td class="section-cell">—</td><td>Tổng ôn & Thi HK1 (Units 1–10)</td><td><span class="type-badge type-test">Exam</span></td><td>-</td>
            </tr>'''

content = re.sub(r'(<tr class="tbd-row" data-unit="u11")', hk1_row + r'\n            \1', content)

# 3. Update the init loop to include hk1
loop_old = '''        for (let i = 1; i <= 14; i++) {
          const uid = 'u' + i;
          renderBadge(uid, localStorage.getItem('khan_status_' + uid) || 'chuahoc');
          if (document.getElementById(`exp-${uid}`)) evalProgress(uid);
        }'''
loop_new = '''        const uids = [];
        for (let i = 1; i <= 14; i++) uids.push('u'+i);
        uids.push('hk1');
        uids.forEach(uid => {
          renderBadge(uid, localStorage.getItem('khan_status_' + uid) || 'chuahoc');
          if (document.getElementById(`exp-${uid}`)) evalProgress(uid);
        });'''
content = content.replace(loop_old, loop_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done injecting HK1 row')
