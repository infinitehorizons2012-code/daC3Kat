import os
import re
import subprocess
import time

urls = [
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:algebra-overview-history/v/abstract-ness',
        'dir_name': '02 - Abstract-ness',
        'file_name': 'U01.S01.L002. Abstract-ness.md'
    },
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:algebra-overview-history/v/the-beauty-of-algebra',
        'dir_name': '03 - The beauty of algebra',
        'file_name': 'U01.S01.L003. The beauty of algebra.md'
    },
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:algebra-overview-history/v/creativity-important-in-algebra',
        'dir_name': '04 - Creativity break Why is creativity important in algebra',
        'file_name': 'U01.S01.L004. Creativity break Why is creativity important in algebra.md'
    },
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:algebra-overview-history/v/descartes-and-cartesian-coordinates',
        'dir_name': '05 - Intro to the coordinate plane',
        'file_name': 'U01.S01.L005. Intro to the coordinate plane.md'
    },
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:algebra-overview-history/v/why-all-the-letters-in-algebra',
        'dir_name': '06 - Why all the letters in algebra',
        'file_name': 'U01.S01.L006. Why all the letters in algebra.md'
    }
]

base_dir = r'C:\Users\DT.HANG\OneDrive\Documents\Claude\Projects\Obsidian\KHAN MATH\Unit 1 - Algebra foundations\01 - Overview and history of algebra'
temp_vtt = 'temp_transcript.en.vtt'

def process_vtt(vtt_path, out_md_path):
    with open(vtt_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    text_lines = []
    for line in lines:
        line = line.strip()
        if not line: continue
        if line.startswith('WEBVTT') or line.startswith('Kind:') or line.startswith('Language:'): continue
        if re.match(r'\d{2}:\d{2}:\d{2}', line): continue
        if re.match(r'</c>', line) or '<c>' in line:
            line = re.sub(r'<[^>]+>', '', line)
        if line and line not in text_lines:
            text_lines.append(line)

    with open(out_md_path, 'w', encoding='utf-8') as f:
        f.write(' '.join(text_lines))


for item in urls:
    print(f"Processing: {item['file_name']}")
    
    # We can just search youtube for the slug, or use yt-dlp on the khan academy URL?
    # Wait, does yt-dlp support Khan Academy URL directly? Let's search using the slug.
    slug = item['url'].split('/')[-1]
    search_query = f"ytsearch1:{slug.replace('-', ' ')} Khan Academy"
    
    cmd = ['yt-dlp', '--write-auto-subs', '--write-subs', '--skip-download', '--sub-langs', 'en', '-o', 'temp_transcript', search_query]
    subprocess.run(cmd, check=False)
    
    # Check if downloaded
    if os.path.exists(temp_vtt):
        out_path = os.path.join(base_dir, item['dir_name'], item['file_name'])
        process_vtt(temp_vtt, out_path)
        os.remove(temp_vtt)
        print("-> Success!")
    else:
        print("-> Failed to download transcript.")
        
print("All done!")
