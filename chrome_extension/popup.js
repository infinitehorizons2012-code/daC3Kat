// Cấu hình Supabase (Chờ cấp URL/Key thật)
const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

document.getElementById('btn-extract').addEventListener('click', async () => {
  const resultDiv = document.getElementById('result');
  resultDiv.innerText = "Đang lấy điểm...";
  
  // Lấy tab đang hoạt động hiện tại
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Kiểm tra xem có phải trang Khan Academy không
  if (tab.url.includes("khanacademy.org")) {
    // Gửi thông điệp tới content.js đang chạy trên trang đó
    chrome.tabs.sendMessage(tab.id, { action: "getKhanScore" }, async (response) => {
      if (chrome.runtime.lastError) {
        resultDiv.innerText = "Lỗi: Chưa tải xong trang hoặc không thể kết nối.";
      } else if (response && response.score) {
        resultDiv.innerText = "Điểm của Kat: " + response.score;
        
        // Đẩy điểm lên Supabase
        if (SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE") {
          try {
            const pushRes = await fetch(`${SUPABASE_URL}/rest/v1/khan_scores`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({ 
                score: response.score, 
                url: tab.url,
                created_at: new Date().toISOString()
              })
            });
            if (pushRes.ok) {
              resultDiv.innerText += "\n(Đã đẩy lên mây thành công!)";
            }
          } catch (err) {
            console.error("Lỗi đẩy điểm:", err);
          }
        }
      }
    });
  } else {
    resultDiv.innerText = "Vui lòng mở trang Khan Academy!";
  }
});
