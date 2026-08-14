import ctypes
import time
import json
import urllib.request
import os
import sys
import subprocess
import sqlite3
import shutil
import tempfile
import glob
from datetime import datetime

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "https://gtd-space-station-168-api.infinite-horizons-2012.workers.dev/api/pc-logs"
LOCAL_LOG_PATH = r"C:\Users\DT.HANG\Downloads\DA C3 Kat\gtd-app\public\pc_activity_log.json"

user32 = ctypes.windll.user32

def get_latest_exact_browser_url():
    user_dir = os.path.expanduser('~')
    chrome_paths = glob.glob(os.path.join(user_dir, r'AppData\Local\Google\Chrome\User Data\*\History'))
    edge_paths = glob.glob(os.path.join(user_dir, r'AppData\Local\Microsoft\Edge\User Data\*\History'))
    brave_paths = glob.glob(os.path.join(user_dir, r'AppData\Local\BraveSoftware\Brave-Browser\User Data\*\History'))

    all_paths = chrome_paths + edge_paths + brave_paths
    temp_dir = tempfile.gettempdir()

    latest_item = None
    latest_time = 0

    for hist_file in all_paths:
        if os.path.exists(hist_file):
            try:
                temp_hist = os.path.join(temp_dir, f"temp_hist_{os.path.basename(os.path.dirname(hist_file))}_{int(time.time())}.sqlite")
                shutil.copy2(hist_file, temp_hist)

                conn = sqlite3.connect(temp_hist)
                cursor = conn.cursor()
                query = "SELECT urls.url, urls.title, visits.visit_time FROM urls JOIN visits ON urls.id = visits.url ORDER BY visits.visit_time DESC LIMIT 1"
                cursor.execute(query)
                row = cursor.fetchone()
                if row:
                    url, title, vtime = row
                    if url and not url.startswith('chrome://') and not url.startswith('edge://'):
                        if vtime > latest_time:
                            latest_time = vtime
                            latest_item = {"url": url, "title": title or url}
                conn.close()
                if os.path.exists(temp_hist):
                    os.remove(temp_hist)
            except Exception:
                pass

    return latest_item

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

    # Extract exact full URL from browser history
    url_info = get_latest_exact_browser_url()
    exact_url = url_info["url"] if url_info else ""
    page_title = url_info["title"] if url_info else title

    if not title and not exact_url:
        title = "Chrome - Google Antigravity & GTD App"
        exact_url = "http://localhost:5173"

    return page_title or title, exact_url

def categorize_activity(title, url=""):
    t_lower = (str(title) + " " + str(url)).lower()

    if any(k in t_lower for k in ['code', 'python', 'idle', 'pycharm', 'visual studio', 'terminal', 'cmd', 'powershell', 'coursera', 'prinberk', 'khan academy', 'algebra', 'pinyin', 'sat', 'high school', 'math', 'gtd', 'antigravity', 'github']):
        return 'Học tập & Deep Work'

    if any(k in t_lower for k in ['drum', 'piano', 'music', 'duolingo', 'trống', 'nhạc', 'ngoại ngữ', 'tiếng trung']):
        return 'Ngoại ngữ & Kỹ năng'

    if any(k in t_lower for k in ['minecraft', 'roblox', 'game', 'youtube', 'twitch', 'facebook', 'tiktok', 'garena', 'steam', 'netflix', 'reel']):
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
        
        # Deduplicate top item if same app & url
        if not existing or existing[0].get('url_link') != log_entry.get('url_link') or existing[0].get('app_name') != log_entry.get('app_name'):
            existing.insert(0, log_entry)

        with open(LOCAL_LOG_PATH, 'w', encoding='utf-8') as f:
            json.dump(existing[:200], f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Save log info:", e)

def run_tracker_loop():
    print("🚀 PC 24/7 Auto-Tracker Daemon with Exact URL Extraction active...")
    current_title, current_url = get_active_window_details()
    start_time = datetime.now()

    while True:
        try:
            time.sleep(5)
            title, url = get_active_window_details()
            now = datetime.now()
            duration_secs = (now - start_time).total_seconds()

            if title != current_title or url != current_url or duration_secs >= 60:
                duration_mins = max(1, round(duration_secs / 60))
                if (current_title or current_url) and duration_mins > 0:
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
                        "details": f"Trang web: {current_title} (Link gốc: {current_url})" if current_url else f"Ứng dụng: {current_title}"
                    }

                    print(f"📌 [{start_str} - {end_str}] {current_title} | URL: {current_url} ({duration_mins}m) -> {cat}")
                    post_log_to_api(log_entry)

                current_title, current_url = title, url
                start_time = now
        except Exception as e:
            print("Loop info:", e)
            time.sleep(5)

if __name__ == "__main__":
    run_tracker_loop()
