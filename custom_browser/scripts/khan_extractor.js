const { ipcRenderer } = require('electron');

// Lắng nghe lệnh yêu cầu lấy điểm từ <webview> host (index.html)
ipcRenderer.on('extract-khan-score', () => {
  console.log("Đang trích xuất điểm Khan Academy...");
  
  // Script này sẽ được chạy trong bối cảnh trang web Khan Academy.
  // DO Khan Academy sử dụng class khá phức tạp (React/GraphQL), 
  // đây là ví dụ DOM parsing cơ bản. Có thể cần điều chỉnh selector 
  // dựa trên giao diện thực tế của màn hình "Báo cáo" hoặc "Hồ sơ" của bé.
  
  let scoreText = "Không tìm thấy";
  let percentText = "0%";
  let moduleName = document.title;

  try {
    // Tùy thuộc vào trang đang mở, tìm các thẻ chứa phần trăm hoặc tiến độ.
    // VD: thẻ chứa phần trăm mastery trên Khan Academy thường có class chứa chữ "percent"
    const progressEl = document.querySelector('span[class*="percent"], div[class*="progress"]');
    if (progressEl) {
      percentText = progressEl.innerText;
    }
  } catch (e) {
    console.error("Lỗi khi tìm điểm:", e);
  }

  const result = {
    module: moduleName,
    percent: percentText,
    url: window.location.href,
    time: new Date().toISOString()
  };

  // Gửi kết quả ngược lại cho index.html
  ipcRenderer.sendToHost('khan-score-result', result);
});

// Thêm sự kiện lắng nghe chuột phải để tạo menu "Ghi chú/Dịch thuật"
window.addEventListener('contextmenu', (e) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    // Có thể gửi yêu cầu hiển thị context menu lên Host
    // ipcRenderer.sendToHost('show-context-menu', selectedText);
    console.log("Đã chọn đoạn text:", selectedText);
  }
});
