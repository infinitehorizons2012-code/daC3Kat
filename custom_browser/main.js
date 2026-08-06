const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
require('dotenv').config();

// Tắt hardware acceleration để tránh lỗi GPU process exited unexpectedly trên một số máy Windows
app.disableHardwareAcceleration();

// (Tương lai) Tích hợp Supabase ở đây nếu cần đẩy dữ liệu trực tiếp từ Main Process
// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      webviewTag: true, // Cho phép dùng thẻ <webview> để nhúng trang web
      nodeIntegration: false, // Bảo mật: không cho JS trong trang web dùng Node.js
      contextIsolation: true, // Bắt buộc context isolation
      preload: path.join(__dirname, 'preload.js') // Sẽ tạo sau
    }
  });

  // Tải giao diện khung chính của trình duyệt (thanh địa chỉ, nút tiện ích)
  mainWindow.loadFile('index.html');

  // Tạo menu chuột phải đơn giản cho ứng dụng (có thể mở rộng sau)
  const template = [
    {
      label: 'Tools',
      submenu: [
        { role: 'toggleDevTools' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Lắng nghe sự kiện từ giao diện (Renderer)
ipcMain.on('save-note', (event, noteText, url) => {
  console.log('Main Process nhận yêu cầu lưu ghi chú:', noteText, url);
  // TODO: Lưu vào Supabase ở đây
});

ipcMain.on('save-khan-score', (event, scoreData) => {
  console.log('Main Process nhận điểm Khan Academy:', scoreData);
  // TODO: Lưu vào Supabase ở đây
});
