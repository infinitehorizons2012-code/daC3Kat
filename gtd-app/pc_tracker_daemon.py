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

def get_active_window_title():
    try:
        hwnd = user32.GetForegroundWindow()
        length = user32.GetWindowTextLengthW(hwnd)
        if length > 0:
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            t = buff.value
            if t and t != "Program Manager":
                return t
    except Exception:
        pass

    # Fallback to Tasklist / Process Window Inspection
    try:
        cmd = 'tasklist /v /fo csv'
        output = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')
        lines = output.strip().split('\n')
        for line in lines[1:]:
            parts = [p.strip('"') for p in line.split('","')]
            if len(parts) >= 9:
                img = parts[0].lower()
                wt = parts[8] if len(parts) > 8 else ''
                if wt and wt not in ["N/A", "Program Manager", "Desktop", "OleMainThreadWndName", "Quick Settings"]:
                    if any(x in img for x in ['chrome', 'edge', 'code', 'antigravity', 'python', 'minecraft', 'discord', 'zalo']):
                        return wt
    except Exception:
        pass

    return "Google Chrome / Desktop"

def categorize_activity(title):
    t_lower = title.lower()

    # 1. Academic & Deep Work
    if any(k in t_lower for k in ['code', 'python', 'idle', 'pycharm', 'visual studio', 'terminal', 'cmd', 'powershell', 'coursera', 'prinberk', 'khan academy', 'algebra', 'pinyin', 'sat', 'high school', 'math', 'la', 'antigravity', 'gtd']):
        return 'Học tập & Deep Work'

    # 2. Languages & Skills
    if any(k in t_lower for k in ['drum', 'piano', 'music', 'duolingo', 'trống', 'nhạc', 'ngoại ngữ', 'tiếng trung']):
        return 'Ngoại ngữ & Kỹ năng'

    # 3. Games & Entertainment / Social
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
        
        # Deduplicate recent top entry
        if not existing or existing[0].get('app_name') != log_entry.get('app_name'):
            existing.insert(0, log_entry)

        with open(LOCAL_LOG_PATH, 'w', encoding='utf-8') as f:
            json.dump(existing[:200], f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Save log info:", e)

def run_tracker_loop():
    print("🚀 PC Auto-Tracker Daemon active...")
    current_title = get_active_window_title()
    start_time = datetime.now()

    while True:
        try:
            time.sleep(5)
            title = get_active_window_title()
            now = datetime.now()
            duration_secs = (now - start_time).total_seconds()

            if title != current_title or duration_secs >= 60:
                duration_mins = max(1, round(duration_secs / 60))
                if current_title and duration_mins > 0:
                    cat = categorize_activity(current_title)
                    start_str = start_time.strftime("%Y-%m-%d %H:%M")
                    end_str = now.strftime("%H:%M")

                    log_entry = {
                        "log_id": f"pc-{int(time.time()*1000)}",
                        "app_name": current_title[:80],
                        "category": cat,
                        "start_time": start_str,
                        "end_time": end_str,
                        "duration_mins": duration_mins,
                        "details": f"Ghi nhận tự động lúc {end_str}"
                    }

                    print(f"📌 [{start_str} - {end_str}] {current_title[:50]} ({duration_mins}m) -> {cat}")
                    post_log_to_api(log_entry)

                current_title = title
                start_time = now
        except Exception as e:
            print("Loop info:", e)
            time.sleep(5)

if __name__ == "__main__":
    run_tracker_loop()
