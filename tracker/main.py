import time
import pygetwindow as gw
import psutil
from supabase_client import log_activity_to_db

def get_active_window_info():
    try:
        active_window = gw.getActiveWindow()
        if active_window is not None:
            title = active_window.title
            # Lấy Process ID và Tên ứng dụng (app_name) không dễ trực tiếp từ pygetwindow trên mọi OS
            # Tuy nhiên trên Windows, gw hoạt động tốt nhưng không trả về PID trực tiếp.
            # Tạm thời ta lấy title làm đại diện.
            
            # TODO: Cải tiến phần lấy process name từ window handle (HWND) sau
            app_name = "Unknown App"
            
            # Tách app_name từ title (thường app name nằm ở cuối, ví dụ "Document - Word")
            parts = title.rsplit('-', 1)
            if len(parts) > 1:
                app_name = parts[-1].strip()
                
            return title, app_name
    except Exception as e:
        pass
    return None, None

def main():
    print("Bắt đầu theo dõi hoạt động...")
    current_title = None
    current_app = None
    start_time = time.time()
    
    # Kiểm tra mỗi 5 giây
    POLL_INTERVAL = 5 
    
    while True:
        try:
            title, app_name = get_active_window_info()
            
            # Nếu cửa sổ thay đổi
            if title != current_title:
                # Ghi nhận log cho cửa sổ cũ nếu có
                if current_title and current_app:
                    duration = int(time.time() - start_time)
                    if duration >= 5: # Chỉ log nếu dùng trên 5 giây
                        log_activity_to_db(current_app, current_title, duration)
                
                # Reset bộ đếm cho cửa sổ mới
                current_title = title
                current_app = app_name
                start_time = time.time()
                
            time.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            print("Đã dừng tracker.")
            break
        except Exception as e:
            print(f"Lỗi: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()
