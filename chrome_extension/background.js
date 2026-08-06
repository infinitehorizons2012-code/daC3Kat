// background.js - Service worker cho Chrome Extension

// Tạo menu chuột phải khi bôi đen văn bản
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveNote",
    title: "Lưu ghi chú cho Kat",
    contexts: ["selection"]
  });
});

// Xử lý sự kiện click vào menu chuột phải
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveNote") {
    const selectedText = info.selectionText;
    const pageUrl = tab.url;
    
    console.log("Đã lưu ghi chú:", selectedText, "từ URL:", pageUrl);
    
    // (Tương lai) Gửi dữ liệu này lên Supabase API ở đây
    // fetch('SUPABASE_URL/rest/v1/notes', { ... })
  }
});
