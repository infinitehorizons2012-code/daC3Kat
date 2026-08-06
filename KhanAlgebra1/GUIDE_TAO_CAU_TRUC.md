# Hướng dẫn tạo cấu trúc khóa học tự động bằng AI (Nhìn hình gõ code)

Đây là hướng dẫn chi tiết cách dùng hình ảnh (screenshot) để nhờ AI tự động tạo code HTML cho danh sách bài học của bất kỳ Unit nào trên Khan Academy (giống như cách chúng ta đã làm với Unit 1). 

---

## 📸 Quy trình 3 bước

### Bước 1: Chụp ảnh màn hình (Screenshot)
Vào trang Khan Academy của Unit bạn muốn học. Chụp màn hình toàn bộ danh sách các bài học.
> **Lưu ý khi chụp:** Hãy đảm bảo ảnh chụp hiển thị rõ **Tên bài học** và **Biểu tượng (Icon)** bên trái (để AI biết phân biệt đâu là Video, đâu là Bài tập, Bài đọc hay Bài thi). Nếu danh sách dài, bạn có thể chụp thành 2-3 ảnh khác nhau.

### Bước 2: Tải ảnh vào khung chat
Kéo thả hoặc upload các bức ảnh vừa chụp vào khung chat với AI.

### Bước 3: Gửi kèm câu lệnh (Prompt) "thần thánh"
Hãy gửi kèm các bức ảnh đó cùng với một câu lệnh mẫu chuẩn xác dưới đây để AI hiểu định dạng mã code cần xuất ra:

> **Câu lệnh mẫu (Copy/Paste):**
> 
> *"Đây là hình ảnh lộ trình bài học của **Unit [Điền số Unit]**. Hãy phân tích hình ảnh này và chuyển đổi thành mã HTML (các thẻ `<tr>`) theo đúng định dạng bảng theo dõi (tracker) của tôi. 
> Hãy tuân thủ các quy tắc gắn tag sau dựa vào biểu tượng trong ảnh:
> 1. Nút Play ➡️ `<span class="type-badge type-video">Video</span>`
> 2. Trang giấy ➡️ `<span class="type-badge type-article">Text/Article</span>`
> 3. Ngôi sao/Bút chì ➡️ `<span class="type-badge type-practice">Practice</span>`
> 4. Quiz ➡️ `<span class="type-badge type-quiz">Quiz</span>`
> 5. Unit Test ➡️ `<span class="type-badge type-test">Unit Test</span>`
> 
> Hãy đảm bảo thêm thuộc tính `data-unit="u[Số Unit]"` và `data-section` đầy đủ cho từng dòng nhé."*

---

## 🛠️ Điều gì sẽ xảy ra tiếp theo?
1. AI sẽ quét toàn bộ ảnh, đọc chính xác tên bài học bằng tiếng Anh.
2. Dựa vào icon để phân loại bài.
3. Xuất ra một đoạn mã HTML hoàn chỉnh và chuẩn định dạng CSS của bảng theo dõi.
4. Cuối cùng, AI (hoặc bạn) sẽ tự động dán đoạn code đó vào file `index.html` tại đúng vị trí của Unit tương ứng. 

Chỉ với 3 bước trên, bạn có thể thiết lập lộ trình cho bất kỳ khóa học nào một cách nhanh chóng mà không cần phải tự mình gõ lại một dòng code nào!
