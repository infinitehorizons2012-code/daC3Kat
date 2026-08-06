import re

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace the toolbar HTML and move it right above the #schedule-table
# The original HTML for the toolbar is:
# <div style="margin-bottom: 12px; display: flex; gap: 10px;">
#   <button class="btn-secondary" style="font-size: 0.85rem;" onclick="schedToggleAll('unit')">↕️ Thu nhỏ / Mở rộng tất cả Units</button>
#   <button class="btn-secondary" style="font-size: 0.85rem;" onclick="schedToggleAll('section')">↕️ Thu nhỏ / Mở rộng tất cả Sections</button>
#   <a href="https://www.khanacademy.org/math/algebra" target="_blank" class="btn-primary" style="font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; margin-left: auto;">
#     🔗 Link
#   </a>
# </div>

toolbar_pattern = r'<div style="margin-bottom: 12px; display: flex; gap: 10px;">.*?</div>\s*<div class="table-container">'

toolbar_replacement = r'''<div class="table-container" style="display: flex; flex-direction: column; height: 100%;">
        <div id="unified-toolbar" style="padding: 10px 14px; background: #0f1123; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; gap: 10px; z-index: 11; position: sticky; top: 0;">
          <button class="btn-secondary" style="font-size: 0.85rem;" onclick="schedToggleAll('unit')">↕️ Thu nhỏ / Mở rộng tất cả Units</button>
          <button class="btn-secondary" style="font-size: 0.85rem;" onclick="schedToggleAll('section')">↕️ Thu nhỏ / Mở rộng tất cả Sections</button>
          <a href="https://www.khanacademy.org/math/algebra" target="_blank" class="btn-primary" style="font-size: 0.85rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; margin-left: auto;">
            🔗 Link
          </a>
        </div>
        <div class="table-inner-scroll" style="flex: 1; overflow-y: auto;">'''

# We also need to close the extra div after the table
table_end_pattern = r'(</table>\s*</div>\s*</div>\s*<!-- END TAB 5 -->)'
table_end_replacement = r'</table>\n        </div>\n      </div>\n    </div>\n  <!-- END TAB 5 -->'

html = re.sub(toolbar_pattern, toolbar_replacement, html, flags=re.DOTALL)
html = re.sub(table_end_pattern, table_end_replacement, html)

# Fix the thead sticky top
html = re.sub(
    r'#schedule-table thead th \{\s*position:\s*sticky;\s*top:\s*48px;\s*z-index:\s*10;',
    r'#schedule-table thead th {\n  position: sticky;\n  top: 0;\n  z-index: 10;',
    html
)

# Fix the CSS for toolbar since it's no longer the first-child of schedule-wrap
html = re.sub(
    r'#schedule-wrap > div:first-child \{[^}]+\}',
    '',
    html
)

# And remove overflow-y auto from panel-units, we'll put it in table-inner-scroll
html = re.sub(
    r'#panel-units \{[^}]*\}', 
    '', # Actually panel-units doesn't have a CSS rule directly, it uses .tab-panel
    html
)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Done")
