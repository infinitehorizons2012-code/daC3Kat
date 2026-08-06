// content.js - Nhúng vào trang web Khan Academy để đọc thông tin

// Lắng nghe yêu cầu từ popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getKhanScore") {
    // Thuật toán bóc tách điểm (Tương tự khan_extractor.js cũ)
    let score = "Không tìm thấy điểm";
    
    // Thử tìm thẻ có chứa chữ % 
    const elements = document.querySelectorAll('*');
    for (let el of elements) {
      if (el.textContent && el.textContent.includes('%') && el.textContent.length < 10) {
        score = el.textContent.trim();
        break; // Lấy cái đầu tiên thấy
      }
    }
    
    // Gửi kết quả về popup
    sendResponse({ score: score });
  }
});
