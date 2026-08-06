import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime

load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

# Khởi tạo client nhưng không throw error nếu chưa có biến môi trường
supabase: Client | None = None
if url and key:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        print(f"Lỗi kết nối Supabase: {e}")

def log_activity_to_db(app_name: str, window_title: str, duration_seconds: int):
    """
    Ghi lại hoạt động sử dụng máy tính lên Supabase
    """
    if not supabase:
        print(f"[Local Log] Bỏ qua vì chưa cấu hình Supabase: {app_name} - {window_title} ({duration_seconds}s)")
        return
        
    try:
        data = {
            "app_name": app_name,
            "window_title": window_title,
            "duration_seconds": duration_seconds,
            "logged_at": datetime.datetime.now().isoformat()
        }
        supabase.table("activity_logs").insert(data).execute()
        print(f"Đã đồng bộ lên cloud: {app_name} ({duration_seconds}s)")
    except Exception as e:
        print(f"Lỗi khi push data lên Supabase: {e}")
