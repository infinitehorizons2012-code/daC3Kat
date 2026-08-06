import os
import re
import shutil

def sanitize_filename(filename):
    filename = re.sub(r'[\\/*?:"<>|]', "", filename)
    filename = filename.replace('\n', '').replace('\r', '')
    filename = filename.strip()
    return filename

file_path = r'C:\Users\DT.HANG\.gemini\antigravity\scratch\algebra1-tracker\index.html'
base_dir = r'C:\Users\DT.HANG\OneDrive\Documents\Claude\Projects\Obsidian\KHAN MATH\Unit 1 - Algebra foundations'

# Wipe existing directory to start fresh
if os.path.exists(base_dir):
    shutil.rmtree(base_dir)
os.makedirs(base_dir)

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

u1_start = html.find('<!-- Unit 1 -->')
u1_end = html.find('<!-- Unit 2 -->')
if u1_end == -1: u1_end = html.find('<tr class="tbd-row" data-unit="u2"')
u1_html = html[u1_start:u1_end]

rows = re.findall(r'<tr.*?>.*?</tr>', u1_html, re.DOTALL)

sec_index = 1
current_sec_dir = ""
lesson_index = 1

for row in rows:
    tds = re.findall(r'(<td[^>]*>.*?</td>)', row, re.DOTALL)
    
    sec_td_index = -1
    for i, td in enumerate(tds):
        if 'class="section-cell' in td:
            sec_td_index = i
            sec_name_match = re.search(r'▼</span>(.*?)</td>', td, re.DOTALL)
            if sec_name_match:
                sec_name = sec_name_match.group(1).strip()
                sec_name = re.sub(r'<[^>]+>', '', sec_name).strip()
                current_sec_dir = os.path.join(base_dir, f"{sec_index:02d} - {sanitize_filename(sec_name)}")
                os.makedirs(current_sec_dir, exist_ok=True)
                sec_index += 1
                lesson_index = 1 # Reset lesson index for new section
            break
            
    if sec_td_index != -1:
        if sec_td_index + 1 < len(tds):
            lesson_td = tds[sec_td_index + 1]
            lesson_name = re.sub(r'<[^>]+>', '', lesson_td).strip()
            lesson_name = sanitize_filename(lesson_name)
            if lesson_name and lesson_name != '-':
                lesson_dir = os.path.join(current_sec_dir, f"{lesson_index:02d} - {lesson_name}")
                os.makedirs(lesson_dir, exist_ok=True)
                lesson_index += 1
    else:
        if len(tds) > 0:
            lesson_td = tds[0]
            lesson_name = re.sub(r'<[^>]+>', '', lesson_td).strip()
            lesson_name = sanitize_filename(lesson_name)
            if lesson_name and lesson_name != '-' and current_sec_dir:
                lesson_dir = os.path.join(current_sec_dir, f"{lesson_index:02d} - {lesson_name}")
                os.makedirs(lesson_dir, exist_ok=True)
                lesson_index += 1

print('Folders created perfectly with numbered lessons!')
