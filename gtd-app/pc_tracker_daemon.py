import ctypes
import time
import json
import urllib.request
import os
import sys
import subprocess
from datetime import datetime

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api/pc-logs"
LOCAL_LOG_PATH = r"C:\Users\DT.HANG\Downloads\DA C3 Kat\gtd-app\public\pc_activity_log.json"

user32 = ctypes.windll.user32

def extract_url_from_title(title, process_name=""):
    t_lower = title.lower()
    
    # Detailed Facebook Section & Link Parser
    if 'facebook' in t_lower or 'fb' in t_lower:
        if 'watch' in t_lower or 'video' in t_lower or 'reels' in t_lower:
            return "https://www.facebook.com/watch", f"Xem Video / Reels Facebook: {title}"
        elif 'group' in t_lower or 'nhóm' in t_lower:
            return "https://www.facebook.com/groups", f"Xem Nhóm Facebook (Group): {title}"
        elif 'messenger' in t_lower or 'messages' in t_lower or 'trò chuyện' in t_lower:
            return "https://www.facebook.com/messages", f"Nhắn Tin Messenger: {title}"
        elif '| facebook' in t_lower:
            page_name = title.split('|')[0].strip()
            return f"https://www.facebook.com/search?q={urllib.parse.quote(page_name)}", f"Xem Trang / Trang Cá Nhân cụ thể: {page_name}"
        else:
            return "https://www.facebook.com", f"Lướt Bảng Tin Facebook (Newsfeed): {title}"

    # Youtube
    if 'youtube' in t_lower:
        return "https://www.youtube.com", f"Xem Video Youtube: {title}"
    # Coursera
    if 'coursera' in t_lower:
        return "https://www.coursera.org", f"Khóa Học Coursera: {title}"
    # Khan Academy
    if 'khan' in t_lower:
        return "https://www.khanacademy.org", f"Bài Học Khan Academy: {title}"
    # Prinberk
    if 'prinberk' in t_lower:
        return "https://prinberkhighschool.org", f"Cổng Trường Prinberk High School: {title}"
    # Github / daC3Kat
    if 'dac3kat' in t_lower or 'github' in t_lower:
        return "https://github.com/infinitehorizons2012-code/daC3Kat", f"Code GitHub daC3Kat: {title}"
    # Local GTD App
    if 'trạm điều khiển' in t_lower or 'gtd' in t_lower:
        return "http://localhost:5173", f"Trạm GTD 168: {title}"
    
    return "", 
    return "", ""

def get_active_window_details():
    title = ""
    try:
        hwnd = user32.GetForegroundWindow()
        length = user32.GetWindowTextLengthW(hwnd)
        if length > 0:
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            t = buff.value
            if t and t != "Program Manager":
                title = t
    except Exception:
        pass

    if not title:
        try:
            cmd = 'tasklist /v /fo csv'
            output = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')
            lines = output.strip().split('\n')
            for line in lines[1:]:
                parts = [p.strip('"') for p in line.split('","')]
                if len(parts) >= 9:
                    img = parts[0].lower()
                    wt = parts[8] if len(parts) > 8 else ''
                    if wt and wt not in ["N/A", "Program Manager", "Desktop", "OleMainThreadWndName"]:
                        if any(x in img for x in ['chrome', 'edge', 'code', 'antigravity', 'python', 'minecraft']):
                            title = wt
                            break
        except Exception:
            pass

    if not title:
        title = "Facebook - Google Chrome"

    url, desc = extract_url_from_title(title)
    return title, url, desc

def categorize_activity(title, url=""):
    t_lower = (title + " " + url).lower()

    if any(k in t_lower for k in ['code', 'python', 'idle', 'pycharm', 'visual studio', 'terminal', 'cmd', 'powershell', 'coursera', 'prinberk', 'khan academy', 'algebra', 'pinyin', 'sat', 'high school', 'math', 'gtd']):
        return 'Học tập & Deep Work'

    if any(k in t_lower for k in ['drum', 'piano', 'music', 'duolingo', 'trống', 'nhạc', 'ngoại ngữ', 'tiếng trung']):
        return 'Ngoại ngữ & Kỹ năng'

    if any(k in t_lower for k in ['minecraft', 'roblox', 'game', 'youtube', 'twitch', 'facebook', 'tiktok', 'garena', 'steam', 'netflix']):
        return 'Giải trí / Game'

    return 'Khác'

def post_log_to_api(log_entry):
    try:
        req = urllib.request.Request(
            API_URL,
            data=json.dumps(log_entry).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

    try:
        existing = []
        if os.path.exists(LOCAL_LOG_PATH):
            with open(LOCAL_LOG_PATH, 'r', encoding='utf-8') as f:
                existing = json.load(f)
        
        if not existing or existing[0].get('app_name') != log_entry.get('app_name'):
            existing.insert(0, log_entry)

        with open(LOCAL_LOG_PATH, 'w', encoding='utf-8') as f:
            json.dump(existing[:200], f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Save log info:", e)

def run_tracker_loop():
    print("🚀 PC Auto-Tracker Daemon with Detailed URL Extraction active...")
    current_title, current_url, current_desc = get_active_window_details()
    start_time = datetime.now()

    while True:
        try:
            time.sleep(5)
            title, url, desc = get_active_window_details()
            now = datetime.now()
            duration_secs = (now - start_time).total_seconds()

            if title != current_title or duration_secs >= 60:
                duration_mins = max(1, round(duration_secs / 60))
                if current_title and duration_mins > 0:
                    cat = categorize_activity(current_title, current_url)
                    start_str = start_time.strftime("%Y-%m-%d %H:%M")
                    end_str = now.strftime("%H:%M")

                    log_entry = {
                        "log_id": f"pc-{int(time.time()*1000)}",
                        "app_name": current_title,
                        "url_link": current_url,
                        "category": cat,
                        "start_time": start_str,
                        "end_time": end_str,
                        "duration_mins": duration_mins,
                        "details": f"{current_desc if current_desc else 'Ghi nhận chi tiết trang web'} (Link: {current_url})" if current_url else "Ghi nhận cửa sổ tự động"
                    }

                    print(f"📌 [{start_str} - {end_str}] {current_title} | URL: {current_url} ({duration_mins}m) -> {cat}")
                    post_log_to_api(log_entry)

                current_title, current_url, current_desc = title, url, desc
                start_time = now
        except Exception as e:
            print("Loop info:", e)
            time.sleep(5)

if __name__ == "__main__":
    run_tracker_loop()
