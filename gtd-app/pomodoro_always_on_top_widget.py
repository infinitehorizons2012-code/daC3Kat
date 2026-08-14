import tkinter as tk
import time
import urllib.request
import json
import threading
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

class AlwaysOnTopPomodoroWidget:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("⏱️ Pomodoro 168")
        
        # 🌟 100% TRUE ALWAYS-ON-TOP NATIVE WINDOWS FLAG
        self.root.attributes('-topmost', True)
        self.root.overrideredirect(True) # Borderless floating window
        
        # Window size & position (Top right corner of screen)
        screen_w = self.root.winfo_screenwidth()
        w, h = 320, 110
        x, y = screen_w - w - 20, 40
        self.root.geometry(f"{w}x{h}+{x}+{y}")
        
        self.root.configure(bg='#0f172a') # Slate-900
        
        # Make draggable
        self.root.bind('<ButtonPress-1>', self.start_move)
        self.root.bind('<B1-Motion>', self.do_move)
        
        # UI Elements
        # Header / Status
        self.lbl_status = tk.Label(
            self.root, text="🔥 DEEP WORK — POMODORO 168", 
            font=("Segoe UI", 9, "bold"), fg="#f59e0b", bg="#0f172a"
        )
        self.lbl_status.pack(pt=5)
        
        # Action Title
        self.lbl_action = tk.Label(
            self.root, text="Tập trung hoàn thành mục tiêu", 
            font=("Segoe UI", 8), fg="#cbd5e1", bg="#0f172a"
        )
        self.lbl_action.pack()
        
        # Timer Display
        self.timeLeft = 25 * 60
        self.isRunning = False
        self.lbl_timer = tk.Label(
            self.root, text="25:00", 
            font=("Segoe UI", 28, "bold"), fg="#fbbf24", bg="#0f172a"
        )
        self.lbl_timer.pack(py=0)
        
        # Controls Frame
        btn_frame = tk.Frame(self.root, bg="#0f172a")
        btn_frame.pack(pb=5)
        
        self.btn_toggle = tk.Button(
            btn_frame, text="⏯️ Chạy/Dừng", font=("Segoe UI", 8, "bold"),
            bg="#f59e0b", fg="#090d16", bd=0, px=10, py=2, command=self.toggle_timer
        )
        self.btn_toggle.pack(side=tk.LEFT, mx=5)

        btn_close = tk.Button(
            btn_frame, text="✖️ Đóng", font=("Segoe UI", 8, "bold"),
            bg="#334155", fg="#94a3b8", bd=0, px=8, py=2, command=self.root.destroy
        )
        btn_close.pack(side=tk.LEFT, mx=5)
        
        # Timer tick loop
        self.update_timer_loop()
        
    def start_move(self, event):
        self.x = event.x
        self.y = event.y

    def do_move(self, event):
        deltax = event.x - self.x
        deltay = event.y - self.y
        x = self.root.winfo_x() + deltax
        y = self.root.winfo_y() + deltay
        self.root.geometry(f"+{x}+{y}")

    def toggle_timer(self):
        self.isRunning = not self.isRunning
        self.btn_toggle.configure(bg="#10b981" if self.isRunning else "#f59e0b")

    def update_timer_loop(self):
        if self.isRunning and self.timeLeft > 0:
            self.timeLeft -= 1
            mins = self.timeLeft // 60
            secs = self.timeLeft % 60
            self.lbl_timer.configure(text=f"{mins:02d}:{secs:02d}")
            
            if self.timeLeft == 0:
                self.isRunning = False
                self.lbl_timer.configure(text="00:00")
                self.lbl_status.configure(text="🎉 HOÀN THÀNH HIỆP POMODORO!")
                # Bring to front!
                self.root.lift()
                self.root.attributes('-topmost', True)
        
        self.root.after(1000, self.update_timer_loop)

if __name__ == "__main__":
    app = AlwaysOnTopPomodoroWidget()
    app.root.mainloop()
