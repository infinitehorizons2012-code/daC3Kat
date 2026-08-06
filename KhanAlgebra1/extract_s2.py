import os
import re
import subprocess

file_path = r'C:\Users\DT.HANG\.gemini\antigravity\scratch\algebra1-tracker\index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

u1_start = html.find('<!-- Unit 1 -->')
u1_end = html.find('<!-- Unit 2 -->')
u1_html = html[u1_start:u1_end]

s2_start = u1_html.find('data-section="u1-s2"')
s3_start = u1_html.find('data-section="u1-s3"')
s2_html = u1_html[s2_start:s3_start]

rows = re.findall(r'<tr.*?>.*?</tr>', s2_html, re.DOTALL)
video_titles = []
for row in rows:
    if 'type-video' in row:
        tds = re.findall(r'(<td[^>]*>.*?</td>)', row, re.DOTALL)
        for i, td in enumerate(tds):
            if 'type-video' in td:
                lesson_name = re.sub(r'<[^>]+>', '', tds[i-1]).strip()
                video_titles.append(lesson_name)

print("Video lessons in Section 2:")
for v in video_titles:
    print("-", v)
