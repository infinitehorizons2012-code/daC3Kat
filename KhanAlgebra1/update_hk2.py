import re

file_path = r'C:\Users\DT.HANG\.gemini\antigravity\scratch\algebra1-tracker\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

hk2_row = '''
            <tr class="tbd-row" data-unit="hk2" data-section="hk2-s1">
              <td class="unit-cell clickable" onclick="schedToggleUnit('hk2',this)">
                <div class="unit-title-wrapper"><span class="unit-name"><span class="toggle-icon">▼</span> 🎓 Thi Học Kì 2 & DEADLINE</span><div class="s-badge" data-unit="hk2" onclick="schedOpenMenu(event,'hk2')"></div></div>
              </td>
              <td class="progress-cell">
                <div class="prog-expected">Dự kiến:<br><strong id="exp-hk2">20/01/2027</strong></div>
                <div class="prog-input-group">
                  <input type="date" class="prog-input" id="act-hk2">
                  <button class="prog-btn" onclick="saveProgress('hk2')">💾 Cập nhật</button>
                </div>
                <div id="eval-hk2" class="prog-eval" style="display:none;"></div>
              </td>
              <td class="section-cell">—</td><td>Kiểm tra HK2 — Hoàn thành toàn bộ Algebra 1!</td><td><span class="type-badge type-test">Exam</span></td><td>-</td>
            </tr>'''

# Inject hk2 row before the closing </tbody>
content = content.replace('          </tbody>\n        </table>', hk2_row + '\n          </tbody>\n        </table>')

# Update loop to include hk2
content = content.replace("uids.push('hk1');", "uids.push('hk1', 'hk2');")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done injecting HK2')
