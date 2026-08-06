document.getElementById('btn-extract').addEventListener('click', async () => {
  const resultDiv = document.getElementById('result');
  resultDiv.innerText = "Đang lấy điểm...";
  
  // Lấy tab đang hoạt động hiện tại
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Kiểm tra xem có phải trang Khan Academy không
  if (tab.url.includes("khanacademy.org")) {
    // Gửi thông điệp tới content.js đang chạy trên trang đó
    chrome.tabs.sendMessage(tab.id, { action: "getKhanScore" }, (response) => {
      if (chrome.runtime.lastError) {
        resultDiv.innerText = "Lỗi: Chưa tải xong trang hoặc không thể kết nối.";
      } else if (response && response.score) {
        resultDiv.innerText = "Điểm của Kat: " + response.score;
      }
    });
  } else {
    resultDiv.innerText = "Vui lòng mở trang Khan Academy!";
  }
});
