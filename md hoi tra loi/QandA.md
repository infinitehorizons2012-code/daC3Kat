# Câu hỏi và Trả lời (Q&A) - Dự án DA C3 Kat

## Câu hỏi 1:
Ý tưởng: Tôi muốn làm một quản lý thời gian và máy vi tính của con gái để đạt mục tiêu homeschool. Theo đó: 
Thứ nhất những gì con làm trên máy vi tính sẽ được log lại để xem thời gian khi nào, thời lượng bao nhiêu. 
Thứ 2 là tôi muốn làm một cửa sổ quản lý trình duyệt để có thể đọc thông tin trên đó và ghi ra báo cáo ví dụ như con tôi vào Khan học thì sẽ khi ấn nút sẽ tự cập nhật điểm % của khan, ngoài ra nếu con muốn ghi chú gì lại thì con sẽ có thể bôi và add vào ghi chú. Cũng như nếu con học ngoại ngữ thì sẽ hỗ trợ các công cụ dịch thuật hay nghe ... 

## Trả lời 1:
Chào bạn, đây là một ý tưởng rất tuyệt vời và thiết thực cho việc ứng dụng công nghệ vào Homeschooling. Để thực hiện dự án này (DA C3 Kat), chúng ta có thể chia hệ thống thành 2 phần chính như sau:

**1. Module Quản lý thời gian và hoạt động (Activity Tracker):**
- Xây dựng một ứng dụng chạy ngầm (Background App) trên máy tính bằng **Python** hoặc **C#**.
- Tự động theo dõi cửa sổ (window) nào đang được mở và "active", từ đó ghi nhận thời gian bắt đầu và thời lượng sử dụng.

**2. Module Quản lý Trình duyệt & Hỗ trợ học tập:**
Tạo một **Tiện ích mở rộng (Chrome/Edge Extension)** hoặc một ứng dụng Desktop tích hợp trình duyệt nhúng (**Electron.js**). 
- **Tự động cập nhật điểm Khan Academy:** Khi con bấm nút, ứng dụng sẽ tự động đọc phần trăm (%) hoàn thành hoặc điểm số hiển thị trên màn hình.
- **Tính năng Ghi chú & Ngoại ngữ:** Bôi đen đoạn văn bản để hiện menu "Thêm vào ghi chú", dịch từ vựng, hoặc phát âm.

**3. Giao diện Quản lý (Dashboard):**
- Xây dựng một trang web nhỏ (Web App) để xem lại tổng quan.

---

## Câu hỏi 2 (Phản hồi về Kế hoạch triển khai):
1. Bạn muốn xem Dashboard (báo cáo) trên một thiết bị khác hay xem chung trên máy của bé? ==> trên trang web github
2. Bạn muốn lưu dữ liệu cục bộ hay muốn sau này xem được online (trên Cloud)? ==> đề xuất cái nào tiện hơn? dùng google drive stream được không
3. Bạn đồng ý làm Extension thay vì tự viết một trình duyệt đóng kín chứ? ==> tự viết

## Trả lời 2 (Cập nhật Kiến trúc):
Dựa trên mong muốn của bạn, tôi xin cập nhật lại giải pháp và kiến trúc hệ thống như sau:

**1. Về Trình duyệt (Tự viết):**
- Chúng ta sẽ không làm Extension nữa mà sẽ xây dựng một **Trình duyệt tự viết (Custom Browser)** bằng công nghệ **Electron.js**.
- Trình duyệt này sẽ hiển thị trang Khan Academy và các trang học tập khác. Trong đó, chúng ta sẽ lập trình sẵn các nút bấm ở thanh công cụ hoặc menu ngữ cảnh (chuột phải) để: Lấy điểm %, Dịch thuật, và Lưu ghi chú. Việc "tự viết" giúp bạn kiểm soát hoàn toàn môi trường học tập của con (có thể khóa không cho vào các trang web khác nếu muốn).

**2. Về Lưu trữ dữ liệu và Dashboard trên Github Web:**
- **Vấn đề của Google Drive:** Nếu lưu dữ liệu bằng file vào Google Drive trên máy của bé, thì trang web tĩnh trên Github (Github Pages) sẽ **không thể** đọc trực tiếp được file đó (vì lý do bảo mật của trình duyệt web). Nếu dùng Google Drive, Dashboard bắt buộc phải là một file HTML mở trực tiếp trên máy tính của bạn.
- **Đề xuất tối ưu (Cloud Database):** Để Dashboard có thể xem được trên **Github Web** (ai có link cũng xem được, tiện lợi trên điện thoại), tiện nhất là cho Trình duyệt tự viết (Electron) và App theo dõi (Python) gửi dữ liệu lên một **Cơ sở dữ liệu đám mây miễn phí (như Supabase hoặc Firebase)**. 
- Sau đó, trang Github Web chỉ việc lấy dữ liệu từ Supabase/Firebase về để vẽ biểu đồ và hiển thị báo cáo. Đây là chuẩn mực hiện nay, miễn phí và rất tiện lợi.

---

## Kế hoạch Triển khai Cập nhật (Revised Implementation Plan)

Dự án DA C3 Kat sẽ bao gồm 3 thành phần chính:

### Cấu trúc hệ thống:
1. **Activity Tracker (Python):** Chạy ngầm trên Windows để theo dõi thời gian và ứng dụng đang sử dụng, định kỳ gửi log lên Supabase.
2. **Custom Browser (Electron.js):** 
   - Trình duyệt đóng kín được lập trình riêng.
   - Nhúng `<webview>` hoặc `BrowserView` để hiển thị trang web.
   - Inject JavaScript vào Khan Academy để lấy % điểm.
   - Hỗ trợ popup/sidebar để xem từ vựng, dịch thuật và ghi chú. Gửi dữ liệu về Supabase.
3. **Github Pages Dashboard (HTML/JS/React):** Trang web báo cáo được host trên Github, truy xuất dữ liệu từ Supabase để hiển thị biểu đồ và lịch sử cho mẹ Kat xem.

### Các thay đổi và cấu trúc dự án dự kiến:

#### 1. Thư mục `tracker` (Python Window/Activity Tracker)
- `tracker/requirements.txt`
- `tracker/main.py` (Lấy active window)
- `tracker/supabase_client.py` (Gửi data lên cloud)

#### 2. Thư mục `custom_browser` (Trình duyệt Electron.js)
- `custom_browser/package.json`
- `custom_browser/main.js` (Quản lý cửa sổ Electron)
- `custom_browser/preload.js` (Cầu nối an toàn giữa giao diện và hệ thống)
- `custom_browser/index.html` (Giao diện khung của trình duyệt)
- `custom_browser/scripts/khan_extractor.js` (Đoạn mã inject vào Khan Academy để lấy điểm)

#### 3. Thư mục `dashboard` (Github Pages)
- `dashboard/index.html`
- `dashboard/app.js` (Fetch data từ Supabase và vẽ biểu đồ)
- `dashboard/style.css`
