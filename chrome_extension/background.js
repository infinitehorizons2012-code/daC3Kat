// Đọc cấu hình bảo mật từ config.js cục bộ
importScripts("config.js");

// Tạo menu chuột phải khi bôi đen văn bản
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveNote",
    title: "Lưu ghi chú cho Kat",
    contexts: ["selection"]
  });
});

// Xử lý sự kiện click vào menu chuột phải
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "saveNote") {
    const selectedText = info.selectionText;
    const pageUrl = tab.url;
    
    console.log("Đang lưu ghi chú:", selectedText);
    
    // Đẩy dữ liệu lên Supabase bằng REST API tiêu chuẩn
    if (SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE") {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ 
            content: selectedText, 
            source_url: pageUrl,
            created_at: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          console.error("Lỗi khi đẩy lên Supabase:", response.statusText);
        } else {
          console.log("Đã đẩy ghi chú lên mây thành công!");
        }
      } catch (err) {
        console.error("Lỗi kết nối Supabase:", err);
      }
    } else {
      console.warn("Chưa cấu hình Supabase URL/Key. Ghi chú chỉ được in ra console.");
    }
  }
});
