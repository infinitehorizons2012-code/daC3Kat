import os
import re
import subprocess
import shutil

links = [
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:intro-variables/v/what-is-a-variable',
        'dir_name': '01 - What is a variable',
        'file_name': 'U01.S02.L001. What is a variable.md'
    },
    {
        'url': "https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:intro-variables/v/why-aren-t-we-using-the-multiplication-sign",
        'dir_name': "02 - Why aren't we using the multiplication sign",
        'file_name': "U01.S02.L002. Why aren't we using the multiplication sign.md"
    },
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:intro-variables/v/creativity-stem-jobs',
        'dir_name': '03 - Creativity break Why is creativity important in STEM jobs',
        'file_name': 'U01.S02.L003. Creativity break Why is creativity important in STEM jobs.md'
    },
    {
        'url': 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:intro-variables/v/variables-and-expressions-1',
        'dir_name': '04 - Evaluating an expression with one variable',
        'file_name': 'U01.S02.L004. Evaluating an expression with one variable.md'
    }
]

base_dir = r'C:\Users\DT.HANG\OneDrive\Documents\Claude\Projects\Obsidian\KHAN MATH\Unit 1 - Algebra foundations\02 - Introduction to variables'
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

for item in links:
    print(f"Processing: {item['file_name']}")
    
    # Run yt-dlp directly on the khan academy URL
    cmd = ['yt-dlp', '--write-auto-subs', '--write-subs', '--skip-download', '--sub-langs', 'en', '-o', 'temp_transcript', item['url']]
    subprocess.run(cmd, check=False)
    
    if os.path.exists(temp_vtt):
        out_path = os.path.join(base_dir, item['dir_name'], item['file_name'])
        process_vtt(temp_vtt, out_path)
        os.remove(temp_vtt)
        print("-> Success!")
    else:
        print("-> Failed to download transcript from URL directly. Let's try searching slug...")
        slug = item['url'].split('/')[-1].replace('-', ' ')
        search_query = f'ytsearch1:"{slug}" Khan Academy'
        cmd2 = ['yt-dlp', '--write-auto-subs', '--write-subs', '--skip-download', '--sub-langs', 'en', '-o', 'temp_transcript', search_query]
        subprocess.run(cmd2, check=False)
        if os.path.exists(temp_vtt):
            out_path = os.path.join(base_dir, item['dir_name'], item['file_name'])
            process_vtt(temp_vtt, out_path)
            os.remove(temp_vtt)
            print("-> Success via search!")
        else:
            print("-> Totally failed.")
        
print("All done for Section 2 with exact links!")
