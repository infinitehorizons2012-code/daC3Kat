// Cloudflare Worker API URL (User needs to replace this with their actual deployed worker URL)
const CLOUDFLARE_API_URL = 'https://time-app-api.infinite-horizons-2012.workers.dev'; 

// Khởi tạo state (Kiến trúc Master Task List)
let state = {
    stars: 0,
    tasks: [] // Một mảng duy nhất chứa toàn bộ task
};

let currentActiveTab = 'predefined';

// DOM Elements
const syncStatusEl = document.getElementById('sync-status');
const starCountEl = document.getElementById('star-count');
const celebrationEl = document.getElementById('celebration');
const masterListEl = document.getElementById('master-task-list');
const taskModal = document.getElementById('task-modal');
const quickAddInput = document.getElementById('quick-add-input');
const headerTitle = document.getElementById('header-title');
const headerDesc = document.getElementById('header-desc');

// Cấu hình Tabs
const tabConfigs = {
    'action': { title: 'Hành Động', desc: 'Bảng tổng hợp toàn bộ dữ liệu (Giao diện Excel).', icon: 'fa-table-list', color: '#10b981', defaultWorkCat: 'Pre-defined Work', defaultSysCat: 'Next Actions' },
    'vision': { 
        title: 'Tầm Nhìn', 
        desc: 'Mục tiêu lớn và ước mơ của con.', 
        icon: 'fa-eye', 
        color: 'var(--secondary-color)', 
        defaultWorkCat: 'Vision', 
        defaultSysCat: 'N/A',
        guide: `
            <div class="tab-guide-content">
                <h4><i class="fa-solid fa-map"></i> Ghi chú:</h4>
                
                <div style="margin-bottom: 15px; padding: 12px 15px; background: rgba(234, 179, 8, 0.1); border-radius: 8px; border-left: 4px solid #eab308; font-size: 0.95rem; line-height: 1.5;">
                    <strong style="color: #a16207;"><i class="fa-solid fa-star"></i> NGUYÊN TẮC CỐT LÕI (START WITH WHY):</strong> Trả lời câu hỏi <em>"Tại sao mình lại làm việc này?"</em> mang lại ý nghĩa, động lực và sự tập trung, giúp bạn loại bỏ những việc vô bổ không đóng góp cho bức tranh lớn.
                </div>

                <div style="margin-bottom: 20px; padding: 15px; background: rgba(22, 163, 74, 0.1); border-radius: 8px; border-left: 4px solid #16a34a; font-size: 0.95rem; line-height: 1.5;">
                    <p style="margin-bottom: 8px;"><strong>Sứ mệnh (50k ft):</strong> Là lý do bạn có mặt trên đời, là nền tảng đạo đức và các nguyên tắc sống không thay đổi theo thời gian.</p>
                    <p style="margin-bottom: 8px;"><strong>Tầm nhìn (40k ft):</strong> Là đích dài hạn, là bức tranh tổng thể, là kết quả cụ thể mà Sứ mệnh muốn hướng tới trong một khoảng thời gian nhất định (thường là 3–5 năm). Nó phác họa con người bạn muốn trở thành hoặc vị thế bạn muốn đạt được.</p>
                    <p style="margin-bottom: 12px;"><strong>Mục tiêu (30k ft):</strong> Là các mốc ngắn hạn, là kết quả cụ thể, có thể đo lường được (số liệu, thời hạn) cần hoàn thành trong 1–2 năm để hiện thực hóa Tầm nhìn.</p>
                    
                    <div style="margin-bottom: 12px; font-style: italic; color: #15803d; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px;">
                        <i class="fa-solid fa-arrow-right"></i> <strong>Sứ mệnh</strong> là con đường bạn đi, <strong>Tầm nhìn</strong> là ngọn núi bạn muốn chinh phục trên con đường đó, còn <strong>Mục tiêu</strong> là các trạm dừng chân bạn phải cán mốc để lên tới đỉnh núi.
                    </div>
                    
                    <p style="margin-bottom: 0;"><strong><i class="fa-solid fa-bridge"></i> Lĩnh vực trách nhiệm (20k ft) và Dự án (10k ft)</strong> đóng vai trò là cầu nối thực thi giúp biến Mục tiêu thành các Hành động thực tế hàng ngày (Runway). Lĩnh vực là nơi quản lý các vai trò cuộc sống, còn Dự án là các phương tiện có mốc hoàn thành giúp bạn thực thi trách nhiệm trong lĩnh vực đó và tiến tới mục tiêu.</p>
                </div>
                
                <details style="margin-bottom: 15px; background: rgba(255,255,255,0.8); border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: var(--secondary-color); font-size: 1.05rem;">
                        <i class="fa-solid fa-list-ul"></i> Xem 14 Mẫu Dream Map (Bản đồ Ước mơ)
                    </summary>
                    <div style="margin-top: 20px;">
                        <div style="margin-bottom: 15px;">
                            <h5 style="color: var(--primary-color); margin-bottom: 5px;">MẪU 1: Tài chính / Sự nghiệp</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Đọc 20 trang sách kinh tế hôm nay.</li>
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành khóa học & đọc 5 cuốn sách đầu tư giá trị.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Tài chính cá nhân & Đầu tư (Duy trì cả đời). Tính dài hạn: Dự án ngắn hạn sẽ kết thúc, nhưng Lĩnh vực này liên tục sinh ra các dự án tiếp theo.</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Đạt tự chủ tài chính / quy mô danh mục $X đồng trong 2 năm tới.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Tự do thời gian, chủ động công việc và dành nhiều thời gian chất lượng cho gia đình sau 5 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Sống tự lập, tự do tư duy và liên tục phát triển bản thân.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: var(--success-color); margin-bottom: 5px;">MẪU 2: Sức khỏe</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Xỏ giày ra đường chạy 3km ngay chiều nay.</li>
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành giáo án tập chạy 12 tuần.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Rèn luyện thể lực hàng tuần (Duy trì cả đời). Tính dài hạn: Dự án giáo án 12 tuần sẽ kết thúc, nhưng Lĩnh vực sức khỏe này sẽ liên tục sinh ra các dự án tập luyện tiếp theo.</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Hoàn thành cự ly chạy Half Marathon 21km trong năm nay.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Sở hữu cơ thể dẻo dai, tràn đầy năng lượng sau 3 năm để đồng hành cùng con cái khi trưởng thành.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Coi trọng và tôn vinh sức khỏe như nền tảng gốc rễ của mọi sự phát triển.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #8b5cf6; margin-bottom: 5px;">MẪU 3: Lập trình & Game (Creating an Indie Video Game)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Tải phần mềm Godot Engine / Unity về máy tính và xem video hướng dẫn làm game 2D cơ bản (30 phút).</li>
                                <li><strong>Dự án (10k ft):</strong> Lập trình và phát hành bản Demo game dạng Platformer dài 5 phút trên nền tảng itch.io.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Phát triển kỹ năng phần mềm, Thiết kế trải nghiệm người dùng & Sáng tạo nội dung số (Duy trì và nâng cấp liên tục).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Xây dựng một hồ sơ năng lực (Portfolio) gồm 3 dự án game hoàn chỉnh và đạt 1,000 lượt tải trong vòng 12–18 tháng.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Trở thành một Nhà phát triển Game độc lập (Indie Game Developer) có nguồn thu nhập tự do và có thể làm việc từ xa trong 3 năm tới.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Tự do sáng tạo, giải quyết vấn đề bằng tư duy logic và mang lại niềm vui cho cộng đồng thông qua công nghệ.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #ec4899; margin-bottom: 5px;">MẪU 4: Du lịch & Ngôn ngữ (Sống & Học tập tại Nước ngoài)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Tải ứng dụng Duolingo, đặt lịch học 15 phút tiếng Tây Ban Nha mỗi ngày và gửi 1 email hỏi thông tin về chương trình tình nguyện viên tại Guatemala.</li>
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành hồ sơ đăng ký, tiết kiệm đủ $1,500 chi phí sinh hoạt và mua vé máy bay cho chuyến đi 3 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Năng lực ngôn ngữ, Trải nghiệm sống & Kỹ năng sinh tồn tự lập (Duy trì cả đời).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Đạt trình độ giao tiếp phản xạ tự nhiên (B2) và thực hiện thành công 1 chuyến đi trải nghiệm thực tế trong vòng 1 năm.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Trở thành một công dân toàn cầu, tự tin sống, làm việc và kết nối ở bất kỳ đâu trên thế giới trong 3–5 năm tới.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Mở rộng ranh giới trải nghiệm, tôn trọng sự đa dạng văn hóa và không ngừng dấn thân vào những vùng đất mới.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #f59e0b; margin-bottom: 5px;">MẪU 5: Xuất bản / Viết sách (Writing & Publishing a Book)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Mở file tài liệu mới và viết 500 từ cho chương đầu tiên vào 6:00 sáng nay.</li>
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành bản thảo 30,000 từ và tìm kiếm 1 biên tập viên tự do để hiệu chỉnh trong 6 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Rèn luyện tư duy viết lách, Truyền thông cá nhân & Quản lý tri thức (Chăm sóc liên tục).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Xuất bản tự lực (Self-publish) 1 cuốn sách trên Amazon Kindle / Nền tảng phát hành nội dung và bán được 500 bản trong vòng 1–2 năm.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Định hình bản thân như một Tác giả / Chuyên gia truyền cảm hứng có tiếng nói uy tín trong cộng đồng tự học trong 3 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Lan tỏa tri thức, đóng góp giá trị tinh thần cho người khác và sống một cuộc đời có chiều sâu tư duy.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #06b6d4; margin-bottom: 5px;">MẪU 6: Khởi nghiệp / Tổ chức Sự kiện (Community Event / Micro-Business)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Gửi tin nhắn khảo sát nhu cầu cho 10 người bạn trong mạng lưới và đặt thuê địa điểm tổ chức buổi hội thảo (workshop) nhỏ vào cuối tuần.</li>
                                <li><strong>Dự án (10k ft):</strong> Tổ chức thành công chuỗi 4 buổi Workshop hướng dẫn kỹ năng tự học với 50 người tham dự.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Quản lý tài chính cá nhân, Kỹ năng tổ chức/lãnh đạo & Kết nối cộng đồng (Lĩnh vực sống dài hạn).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Xây dựng một mô hình kinh doanh nhỏ/dự án xã hội tự duy trì được tài chính trong 12–24 tháng.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Làm chủ mô hình kinh doanh linh hoạt, tự chủ tài chính và tạo được việc làm hoặc giá trị cho cộng đồng xung quanh sau 3–5 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Chủ động tạo ra cơ hội, sống tự lập về kinh tế và tạo dựng một cộng đồng gắn kết, tích cực.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #4ade80; margin-bottom: 5px;">MẪU 7: Dự án Xã hội & Cộng đồng (Social Impact & Advocacy)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Gửi 1 email cho tổ chức phi chính phủ (NGO) địa phương để xin lịch hẹn phỏng vấn về vấn đề rác thải nhựa vào sáng mai.</li>
                                <li><strong>Dự án (10k ft):</strong> Thiết kế và thực hiện chiến dịch truyền thông nhận thức rác thải nhựa tại địa phương, thu hút 200 người tham gia trong 3 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Trách nhiệm xã hội, Kỹ năng lãnh đạo cộng đồng & Truyền thông vận động (Lĩnh vực duy trì lâu dài).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Thành lập một nhóm/tổ chức tình nguyện trẻ tự vận hành và gây quỹ thành công $2,000 trong 12–18 tháng.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Trở thành một nhà hoạt động xã hội/nhà lãnh đạo trẻ có ảnh hưởng thực chất, kết nối các nguồn lực để tạo thay đổi bền vững trong 3–5 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Phụng sự cộng đồng, bảo vệ môi trường sống và để lại những giá trị tích cực cho thế hệ sau.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #60a5fa; margin-bottom: 5px;">MẪU 8: Đa đam mê / Sự nghiệp Portfolio (Hybrid & Portfolio Career)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Tạo một trang web cá nhân đơn giản (Notion/WordPress) và đăng lên 3 sản phẩm mẫu (1 bài viết, 1 bộ ảnh, 1 thiết kế) chiều nay.</li>
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành bộ hồ sơ năng lực đa dạng (Portfolio) và nhận 3 hợp đồng tự do (Freelance) đầu tiên ở cả 3 lĩnh vực trong 4 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Quản lý năng lực đa chiều, Thương hiệu cá nhân & Tự do tài chính (Chăm sóc cả đời).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Xây dựng mô hình thu nhập hỗn hợp (Portfolio Career) mang lại nguồn tài chính ổn định từ nhiều dịch vụ khác nhau trong 1–2 năm.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Làm chủ một sự nghiệp linh hoạt, không bị bó buộc vào một danh xưng công việc cố định, tự do điều phối thời gian cho các đam mê khác nhau sau 3–5 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Sống đa dạng, khai phá tối đa tiềm năng bản thân và không giới hạn khả năng sáng tạo.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #f43f5e; margin-bottom: 5px;">MẪU 9: Xây dựng Mạng lưới Cố vấn (Mentorship & Network Building)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Soạn và gửi 1 thư điện tử (Cold Email) ngỏ lời xin 15 phút trò chuyện ngắn với 1 chuyên gia trong ngành.</li>
                                <li><strong>Dự án (10k ft):</strong> Thực hiện chuỗi 10 cuộc phỏng vấn hướng nghiệp (Informational Interviews) với các chuyên gia và tổng hợp thành bộ tài liệu học tập trong 2 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Xây dựng mối quan hệ chất lượng & Phát triển tư duy chuyên môn (Lĩnh vực sống dài hạn).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Kết nối được với ít nhất 2 người cố vấn (Mentors) chính thức đồng hành cùng lộ trình phát triển trong 1 năm.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Đứng trong mạng lưới những người tiên phong, uy tín trong ngành và sẵn sàng quay lại làm cố vấn cho thế hệ tiếp theo sau 3–5 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Khiêm tốn học hỏi từ người đi trước, xây dựng giá trị trên sự kết nối chân thành và chia sẻ tri thức.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #a855f7; margin-bottom: 5px;">MẪU 10: Vượt qua Nỗi sợ & Rào cản (Comfort Zone Expansion / Fear-Busting)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Đăng ký tham gia một câu lạc bộ nói trước công chúng (như Toastmasters) hoặc thực hiện 1 cuộc gọi "Cold call" tới người lạ trong 15 phút.</li>
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành chuỗi 30 ngày liên tục thực hiện các thử thách bước ra khỏi vùng an toàn (Comfort Zone Challenges).</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Rèn luyện tâm lý vững vàng, Sức khỏe tinh thần & Sự tự tin cá nhân (Lĩnh vực chăm sóc cả đời).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Xóa bỏ rào cản sợ xã hội/sợ thất bại và tự tin chủ động dẫn dắt các cuộc trò chuyện quan trọng trong 1–2 năm.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Trở thành một người bản lĩnh, kiên cường, sẵn sàng đối mặt với rủi ro và thích nghi với mọi biến động cuộc sống sau 3–5 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Sống dũng cảm, làm chủ nỗi sợ và không để sự nghi ngờ bản thân giới hạn tiềm năng cuộc đời.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #10b981; margin-bottom: 5px;">MẪU 11: Chuyển giao Đam mê sang Tài chính (Monetizing a Passion)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Chụp ảnh 3 sản phẩm thủ công/nghệ thuật đẹp nhất và đăng bán trên sàn thương mại điện tử (Etsy/Shopee) hoặc mạng xã hội.</li>
                                <li><strong>Dự án (10k ft):</strong> Xây dựng cửa hàng trực tuyến, tối ưu hóa quy trình đóng gói/giao hàng và đạt 50 đơn hàng đầu tiên trong 3 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Thương mại hóa sáng tạo, Quản lý tài chính kinh doanh & Chăm sóc khách hàng (Trách nhiệm duy trì).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Tạo ra dòng tiền đều đặn từ đam mê, trang trải 50–100% chi phí sinh hoạt cá nhân trong 1–2 năm.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Sở hữu một thương hiệu/doanh nghiệp sáng tạo độc lập, tự chủ kinh tế và tạo ra sản phẩm được cộng đồng đón nhận trong 3–5 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Tự do tài chính thông qua việc trao giá trị thực sự và sống trọn vẹn với niềm đam mê.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #f97316; margin-bottom: 5px;">MẪU 12: Thử nghiệm Nhanh / Thất bại Rẻ (Rapid Prototyping & Fail Cheap)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Dành 2 tiếng tối nay làm một bản khảo sát ngắn (Google Forms) và gửi cho 20 người để kiểm tra mức độ quan tâm về một ý tưởng mới.</li>
                                <li><strong>Dự án (10k ft):</strong> Chạy thử nghiệm mô hình thu nhỏ (Minimum Viable Product - MVP) trong vòng 2 tuần với chi phí dưới $50.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Tư duy thử nghiệm, Quản lý rủi ro & Năng lực học tập thích ứng (Lĩnh vực sống dài hạn).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Thử nghiệm và loại bỏ nhanh 5–10 ý tưởng không khả thi để tìm ra 1–2 hướng đi cốt lõi nhất trong 1 năm.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Làm chủ tư duy khởi nghiệp tinh gọn (Lean Mindset), nhạy bén với cơ hội và ra quyết định chính xác dựa trên dữ liệu thực tế sau 3 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Không ngừng khám phá, coi thất bại là học hỏi và hành động linh hoạt dựa trên sự thật.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #14b8a6; margin-bottom: 5px;">MẪU 13: Tự do Tài chính & Đi làm sớm (Financial Independence & Gap Year)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Cập nhật CV/Resume cá nhân và gửi đơn ứng tuyển vào 3 vị trí bán thời gian/thực tập tại địa phương.</li>
                                <li><strong>Dự án (10k ft):</strong> Đi làm và tích lũy quỹ tài chính khẩn cấp / quỹ trải nghiệm $3,000 trong vòng 8 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Quản lý tài chính cá nhân & Kỹ năng làm việc thực tế (Lĩnh vực sống cốt lõi).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Tự chủ 100% chi phí sinh hoạt cá nhân và tự tài trợ cho 1 năm trải nghiệm (Gap Year) trong 1–2 năm tới.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Đạt trạng thái tự do tài chính ở mức cơ bản, không bị phụ thuộc vào chu cấp gia đình hay rào cản bằng cấp sau 3 năm.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Tự lập về kinh tế, tôn trọng giá trị của lao động và làm chủ hoàn toàn các lựa chọn cuộc đời.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed #ccc;">
                            <h5 style="color: #6366f1; margin-bottom: 5px;">MẪU 14: Chuẩn bị ứng tuyển Đại học (College Admissions Dream Map)</h5>
                            <ul>
                                <li><strong>Hành động (Runway):</strong> Tải đề thi mẫu SAT/ACT về máy và làm bài thi thử phần Math trong 45 phút chiều nay.</li>
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành chứng chỉ SAT đạt 1400+ và đóng gói Hồ sơ năng lực tự học (Portfolio / Narrative) trong 6 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Học thuật & Phát triển tri thức, Quản lý hồ sơ cá nhân (Duy trì và theo dõi liên tục).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Nộp đơn và nhận thư trúng tuyển (kèm học bổng) từ ít nhất 1 trường Đại học phù hợp trong 12–18 tháng.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Tự do trải nghiệm môi trường đại học với tinh thần chủ động, kết nối với mạng lưới học giả và chuyên gia trong 3–5 năm tới.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Theo đuổi tri thức đỉnh cao, giữ vững tư duy độc lập và dùng sự hiểu biết để phụng sự xã hội.</li>
                            </ul>
                        </div>
                    </div>
                </details>

                <div class="tab-tip" style="margin-bottom: 15px;"><i class="fa-solid fa-lightbulb"></i> <strong>Tránh bẫy ôm đồm:</strong> Gom dự án theo Lĩnh vực trách nhiệm (Tài chính, Sức khỏe, Gia đình, Sự nghiệp...) để cân bằng nguồn lực, tránh lệch vai.</div>

                <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 15px; font-size: 0.95rem; line-height: 1.5; margin-bottom: 10px;">
                    <h5 style="color: #d97706; margin-bottom: 10px;"><i class="fa-solid fa-arrows-rotate"></i> Tính linh hoạt (Adaptability):</h5>
                    <p style="margin-bottom: 8px;">Giấc mơ hay Tầm nhìn có thể thay đổi. Khi thử làm một Dự án mà bạn nhận ra mình không thích, bạn hoàn toàn có thể gạch bỏ nó, điều chỉnh Dream Map và cập nhật lại hệ thống mà không thấy dằn vặt.</p>
                    <p style="margin-bottom: 8px; font-weight: bold; color: #b45309;"><i class="fa-solid fa-arrow-right"></i> Không phải mọi tầm nhìn hay mục tiêu mới nảy ra đều phải đưa vào thực thi ngay lập tức. Để tránh "vỡ trận" do đổi hướng quá nhanh:</p>
                    <ul style="margin-bottom: 15px; margin-left: 20px; list-style-type: disc;">
                        <li style="margin-bottom: 4px;"><strong>Tận dụng danh sách Someday/Maybe (Định Hình):</strong> Khi có ý tưởng mới nhưng chưa phải lúc làm, hãy đưa nó vào danh sách này.</li>
                        <li><strong>Kích hoạt đúng thời điểm:</strong> Trong các buổi Đánh giá định kỳ, bạn mới mở danh sách này ra để biến nó thành Mục tiêu / Dự án chính thức.</li>
                    </ul>
                    <p style="margin-bottom: 8px; font-weight: bold; color: #b45309;"><i class="fa-solid fa-arrow-right"></i> Nhịp điệu rà soát (Review Cadence): Tầm nhìn không thay đổi theo từng ngày, mà được điều chỉnh theo các nhịp khác nhau:</p>
                    <ul style="margin-bottom: 0; margin-left: 20px; list-style-type: disc;">
                        <li style="margin-bottom: 4px;"><strong>Weekly Review (Hàng tuần - Tầng Runway & 10,000 ft):</strong> Rà soát Hành động và Dự án. Hoàn thành hoặc gạch bỏ dự án không còn phù hợp.</li>
                        <li style="margin-bottom: 4px;"><strong>Monthly/Quarterly Review (Hàng tháng/Quý - Tầng 20,000 & 30,000 ft):</strong> Kiểm tra Lĩnh vực & Mục tiêu 1-2 năm. Đạt được thì lên kế hoạch ăn mừng, không còn phù hợp thì điều chỉnh hoặc loại bỏ.</li>
                        <li><strong>Annual Review (Hàng năm - Tầng 40,000 & 50,000 ft):</strong> Đánh giá Tầm nhìn 3–5 năm và Sứ mệnh/Nguyên tắc sống. Nhìn lại bản thân để xem các giá trị cốt lõi có chuyển biến hay mở rộng sang hướng mới không.</li>
                    </ul>
                </div>

                <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 8px; padding: 15px; font-size: 0.95rem; line-height: 1.5; margin-bottom: 10px;">
                    <h5 style="color: #2563eb; margin-bottom: 10px;"><i class="fa-solid fa-layer-group"></i> Phân loại Hành động thực tế:</h5>
                    <p style="margin-bottom: 12px;">Trong cuộc sống hàng ngày, không phải 100% mọi việc hôm nay đều phải nối lên tận Sứ mệnh. Cần phân chia hành động thành 2 nhóm:</p>
                    
                    <div style="margin-bottom: 12px;">
                        <strong style="color: #1d4ed8;"><i class="fa-solid fa-arrow-trend-up"></i> Nhóm 1: Việc hướng đến sự phát triển (Strategic Actions)</strong>
                        <p style="margin: 4px 0 4px 15px; color: #475569;"><em>Chuỗi: Hành động &rarr; Dự án &rarr; Lĩnh vực trách nhiệm &rarr; Mục tiêu &rarr; Tầm nhìn &rarr; Sứ mệnh.</em></p>
                        <p style="margin: 0 0 0 15px;">Ví dụ: Đọc 20 trang sách kinh tế &rarr; Hoàn thành khóa học đầu tư &rarr; Tự chủ tài chính 2 năm tới &rarr; Tự do thời gian &rarr; Tự lập và liên tục phát triển.</p>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <strong style="color: #1d4ed8;"><i class="fa-solid fa-screwdriver-wrench"></i> Nhóm 2: Việc duy trì & bảo trì cuộc sống (Maintenance Actions)</strong>
                        <p style="margin: 4px 0 4px 15px; color: #475569;"><em>Chuỗi: Hành động &rarr; Dự án &rarr; Lĩnh vực trách nhiệm &rarr; Mục tiêu</em></p>
                        <p style="margin: 4px 0 4px 15px;">Những việc này chỉ dừng lại ở tầng Runway (Hành động) hoặc tầng 20,000 ft (Lĩnh vực trách nhiệm) mà không nhất thiết phải có "Dự án" hay "Mục tiêu 3-5 năm".</p>
                        <p style="margin: 0 0 0 15px;">Ví dụ: Đi đóng tiền điện, thay dầu xe, cắt tóc, dọn nhà... Bạn làm vì đó là trách nhiệm duy trì cuộc sống (Area of Responsibility), không cần gán cho nó một "mục tiêu cao cả" để tránh làm phức tạp hóa hệ thống.</p>
                    </div>

                    <div style="background: rgba(255,255,255,0.7); padding: 10px 15px; border-radius: 6px; border-left: 3px solid #60a5fa;">
                        <h6 style="color: #1e40af; font-weight: bold; margin-bottom: 5px;">TÓM LẠI:</h6>
                        <ul style="margin-bottom: 0; padding-left: 20px; list-style-type: square;">
                            <li style="margin-bottom: 4px;"><strong>Nghĩa chuẩn:</strong> Mọi việc quan trọng bạn làm hôm nay nên có "gốc rễ" cắm sâu vào Mục tiêu, Tầm nhìn và Sứ mệnh.</li>
                            <li><strong>Tâm thế vận hành:</strong> Dùng Tầm nhìn & Sứ mệnh để biết việc gì nên làm, và dùng Lịch & Danh sách việc để biết hôm nay làm gì cụ thể.</li>
                        </ul>
                    </div>
                </div>

                <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 15px; font-size: 0.95rem; line-height: 1.5; margin-bottom: 10px;">
                    <h5 style="color: #6d28d9; margin-bottom: 10px;"><i class="fa-solid fa-gears"></i> Cơ chế vận hành toàn hệ thống:</h5>
                    
                    <div style="margin-bottom: 12px;">
                        <strong style="color: #5b21b6;"><i class="fa-solid fa-compass" style="color: #8b5cf6;"></i> Tầm nhìn (Horizons of Focus):</strong>
                        <p style="margin: 4px 0 0 20px;">Định hướng cấp cao (Mục tiêu 1-5 năm, Sứ mệnh). Nó chính là "la bàn" để bạn biết việc nào quan trọng, việc nào không.</p>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <strong style="color: #5b21b6;"><i class="fa-solid fa-filter" style="color: #8b5cf6;"></i> Defining Work (Quá trình Định nghĩa):</strong>
                        <p style="margin: 4px 0 4px 20px;">Đây là bước bạn lấy thông tin thô (hoặc từ Tầm nhìn, hoặc từ In-basket) và chạy qua Làm rõ (Clarify) & Đánh giá (Review).</p>
                        <p style="margin: 0 0 0 20px; font-style: italic; color: #4c1d95;">Bước <strong>Review</strong> chính là cầu nối quan trọng nhất: Từ tầm nhìn cao &rarr; biến thành các Dự án (Projects) &rarr; chốt ra Hành động tiếp theo (Next Actions).</p>
                    </div>

                    <div style="margin-bottom: 0;">
                        <strong style="color: #5b21b6;"><i class="fa-solid fa-check-double" style="color: #8b5cf6;"></i> Defined Work (Công việc đã sẵn sàng):</strong>
                        <p style="margin: 4px 0 0 20px;">Là sản phẩm đầu ra của quá trình Defining Work. Nhờ đã được định nghĩa rõ ràng ("Làm cái gì, ở đâu, mất bao lâu"), khi nhảy vào làm (Engage), não bạn không bị ma sát hay trì hoãn.</p>
                    </div>
                </div>

                <div style="background: rgba(244, 63, 94, 0.1); border-left: 4px solid #f43f5e; border-radius: 8px; padding: 15px; font-size: 0.95rem; line-height: 1.5;">
                    <h5 style="color: #e11d48; margin-bottom: 10px;"><i class="fa-solid fa-bolt"></i> Nguyên tắc xử lý Việc Đột xuất (Unplanned Work):</h5>
                    <p style="margin-bottom: 12px;">Việc đột xuất sẽ xuất hiện liên tục và nguyên tắc xử lý như sau:</p>
                    
                    <div style="margin-bottom: 12px; background: rgba(255,255,255,0.7); padding: 10px 15px; border-radius: 6px;">
                        <strong style="color: #be123c;"><i class="fa-regular fa-clock"></i> Quy tắc "Bộ lọc 2 phút nhanh" tại chỗ:</strong>
                        <p style="margin: 4px 0 4px 0;">Khi một việc đột xuất đến (email khẩn, sếp gọi, sự cố phát sinh):</p>
                        <ul style="margin-bottom: 0; padding-left: 20px; list-style-type: disc;">
                            <li style="margin-bottom: 4px;"><strong>Nếu mất &lt; 2 phút:</strong> Làm luôn ngay tại chỗ rồi quay lại việc đang làm.</li>
                            <li><strong>Nếu mất &gt; 2 phút:</strong> Bạn phải tạm dừng lại 3 giây để thực hiện <strong>ĐÁNH GIÁ ĐỐI GIAO THOA (Trade-off Decision)</strong> dựa trên 4 bộ lọc hành động (Bối cảnh, Thời gian, Năng lượng, Độ ưu tiên).</li>
                        </ul>
                    </div>

                    <p style="margin-bottom: 8px; font-weight: bold; color: #9f1239;">Câu hỏi quyết định: "Liệu làm việc đột xuất này NGAY BÂY GIỜ có mang lại giá trị cao hơn tất cả những việc đã lên kế hoạch trong danh sách Defined Work của mình hay không?"</p>
                    <ul style="margin-bottom: 0; padding-left: 20px; list-style-type: square;">
                        <li style="margin-bottom: 4px;"><strong style="color: #16a34a;">Nếu CÓ:</strong> Chấp nhận gạt danh sách Defined Work sang một bên &rarr; Thực hiện việc đột xuất.</li>
                        <li><strong style="color: #dc2626;">Nếu KHÔNG:</strong> Tiếp tục làm việc đã định trước (Defined Work) <strong>VÀ</strong> Quăng ngay việc đột xuất đó vào In-basket (Định Hình / Thu thập) để nó đi đúng chu trình Defining Work.</li>
                    </ul>
                </div>

                <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid #ddd6fe; border-radius: 8px; padding: 15px; margin-top: 20px;">
                    <h5 style="color: #6d28d9; margin-bottom: 10px; text-transform: uppercase; border-bottom: 2px solid #ddd6fe; padding-bottom: 5px;"><i class="fa-solid fa-bullseye"></i> QUẢN LÝ MỤC TIÊU (30,000 FT) KHI THIẾU DỰ ÁN DẪN ĐƯỜNG</h5>
                    <p style="margin-bottom: 12px; font-size: 0.95rem;">Khi một Mục tiêu 1–2 năm (30k ft) không liên kết với bất kỳ Dự án (10k ft) nào đang kích hoạt, nó đang rơi vào trạng thái "mồ côi" thực thi. Một Mục tiêu ở tình trạng này thường thuộc về 1 trong 3 trường hợp sau:</p>
                    
                    <strong style="color: #5b21b6;">Trường hợp 1: Mục tiêu đang ở giai đoạn "Ấp ủ" (Someday / Maybe)</strong>
                    <ul style="margin-bottom: 12px; margin-top: 5px; margin-left: 15px; list-style-type: square; font-size: 0.95rem; color: #475569;">
                        <li style="margin-bottom: 4px;"><strong>Bản chất:</strong> Đây là mục tiêu chính đáng trong khung thời gian 1–2 năm, nhưng chưa phải là ưu tiên vận hành trong quý hoặc tháng này.</li>
                        <li style="margin-bottom: 4px;"><strong>Ví dụ:</strong> Mục tiêu "Thi lấy bằng lái xe ô tô trong năm nay", nhưng Quý 1 bạn dành 100% nguồn lực cho "Mục tiêu SAT 1450+". Bạn chủ động lưu giữ mục tiêu này ở danh sách 30,000 ft mà chưa cần đẻ ra Dự án ở tầng 10,000 ft.</li>
                        <li><strong>Trạng thái hệ thống:</strong> Hợp lệ (Pended / On Hold).</li>
                    </ul>

                    <strong style="color: #5b21b6;">Trường hợp 2: Mục tiêu bị ngưng trệ do thiếu đóng gói (Unactionable Goal)</strong>
                    <ul style="margin-bottom: 12px; margin-top: 5px; margin-left: 15px; list-style-type: square; font-size: 0.95rem; color: #475569;">
                        <li style="margin-bottom: 4px;"><strong>Bản chất:</strong> Bạn mong muốn đạt được mục tiêu ngay thời điểm hiện tại, nhưng hệ thống quản lý mới chỉ dừng lại ở tên gọi mong muốn chứ chưa chuyển hóa thành các gói công việc đóng gói cụ thể.</li>
                        <li style="margin-bottom: 4px;"><strong>Hậu quả:</strong> Mục tiêu bị treo vô thời hạn vì não bộ gặp rào cản nhận thức, không biết bước đi cụ thể tiếp theo là gì.</li>
                        <li style="margin-bottom: 4px;"><strong>Giải pháp:</strong> Đặt câu hỏi định hướng: <em>"Để tiến gần 1 bước tới Mục tiêu này ngay lúc này, kết quả cụ thể (Project) cần đóng gói và hoàn thành trong 1–3 tháng tới là gì?"</em></li>
                        <li><strong>Trạng thái hệ thống:</strong> Cần xử lý ngay (Action Required).</li>
                    </ul>

                    <strong style="color: #5b21b6;">Trường hợp 3: Mục tiêu đã lỗi thời hoặc không còn phù hợp (Obsolete Goal)</strong>
                    <ul style="margin-bottom: 15px; margin-top: 5px; margin-left: 15px; list-style-type: square; font-size: 0.95rem; color: #475569;">
                        <li style="margin-bottom: 4px;"><strong>Bản chất:</strong> Mục tiêu từng được thiết lập trong quá khứ nhưng hoàn cảnh, nguồn lực hoặc định hướng cá nhân đã thay đổi khiến nó không còn giá trị thực tế.</li>
                        <li style="margin-bottom: 4px;"><strong>Hậu quả:</strong> Gây nhiễu tâm trí và làm phân tán sự tập trung khi thực hiện đánh giá định kỳ.</li>
                        <li style="margin-bottom: 4px;"><strong>Giải pháp:</strong> Chủ động dọn dẹp và gạch bỏ (Archive / Delete) khỏi hệ thống.</li>
                        <li><strong>Trạng thái hệ thống:</strong> Loại bỏ (Archived).</li>
                    </ul>

                    <h6 style="color: #6d28d9; margin-top: 15px; margin-bottom: 10px; text-transform: uppercase;"><i class="fa-solid fa-calendar-check"></i> QUY TRÌNH KIỂM TRA ĐỊNH KỲ (WEEKLY REVIEW)</h6>
                    <p style="margin-bottom: 10px; font-size: 0.95rem;">Trong buổi Rà soát Tuần (Weekly Review), lọc danh sách dữ liệu tại tầng 30,000 ft (Mục tiêu) và đối chiếu với tầng 10,000 ft (Dự án). Khi phát hiện Mục tiêu chưa có Dự án:</p>
                    
                    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; font-size: 0.95rem; margin-bottom: 10px;">
                        <ul style="margin-bottom: 0; padding-left: 20px; list-style-type: circle;">
                            <li style="margin-bottom: 8px;"><strong>Lựa chọn 1 - Chưa làm ngay (Chưa kích hoạt):</strong> Gán nhãn Someday/Maybe &rarr; Giữ ở tầng 30k ft, không tạo dự án rác.</li>
                            <li style="margin-bottom: 8px;"><strong>Lựa chọn 2 - Muốn làm ngay (Triển khai ngay):</strong> Tạo tối thiểu <strong>1 Dự án (10k ft)</strong> tương ứng &rarr; Tạo <strong>1 Hành động tiếp theo (Runway)</strong> để đưa vào Lịch/Danh sách việc cần làm.</li>
                            <li><strong>Lựa chọn 3 - Không làm nữa (Chuyển hướng):</strong> Lưu trữ / Xóa bỏ (Archive / Delete) khỏi danh sách &rarr; Giải phóng dung lượng hệ thống và tâm trí.</li>
                        </ul>
                    </div>
                </div>
            </div>
        `
    },
    'prinberk': {
        title: 'Prinberk Highschool:',
        desc: 'DA học thuật & DA tín chỉ',
        icon: 'fa-gem',
        color: '#14b8a6',
        defaultWorkCat: 'Vision',
        defaultSysCat: 'N/A',
        guide: `
            <div class="tab-guide-content">
                <h4><i class="fa-solid fa-gem"></i> YÊU CẦU TỐT NGHIỆP THPT (Path 2)</h4>
                
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(20, 184, 166, 0.1); border-radius: 8px; border-left: 4px solid #14b8a6; font-size: 0.95rem; line-height: 1.5;">
                    <p style="margin-bottom: 12px; font-weight: bold; color: #0f766e;">To graduate Path 2, students must be full-time and complete 20 credits.</p>
                    
                    <div style="background: rgba(255, 255, 255, 0.7); border: 1px solid #99f6e4; border-radius: 8px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left;">
                            <tbody>
                                <tr style="border-bottom: 1px solid #ccfbf1;">
                                    <td style="padding: 10px 15px; color: #334155;">English</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">4 credits</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1; background: rgba(240, 253, 250, 0.5);">
                                    <td style="padding: 10px 15px; color: #334155;">Math (must include Algebra I)</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">3 credits</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1;">
                                    <td style="padding: 10px 15px; color: #334155;">Social Studies (must include World History, US History, and Economics)</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">3 credits</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1; background: rgba(240, 253, 250, 0.5);">
                                    <td style="padding: 10px 15px; color: #334155;">Science (must include a physical and biology science)</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">3 credits</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1;">
                                    <td style="padding: 10px 15px; color: #334155;">Foreign Language (2 years of the same language)</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">2 credits</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1; background: rgba(240, 253, 250, 0.5);">
                                    <td style="padding: 10px 15px; color: #334155;"><strong style="color: #b91c1c;">Visual/Performing Arts</strong> or third Foreign Language</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">1 credit</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1;">
                                    <td style="padding: 10px 15px; color: #334155;">Physical Education</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">0.5 credits</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1; background: rgba(240, 253, 250, 0.5);">
                                    <td style="padding: 10px 15px; color: #334155;"><strong style="color: #b91c1c;">Health</strong></td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">0.5 credits</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #ccfbf1;">
                                    <td style="padding: 10px 15px; color: #334155;"><strong style="color: #b91c1c;">Electives</strong> or <strong style="color: #b91c1c;">Career & Technical Education</strong> Courses (may be additional cores)</td>
                                    <td style="padding: 10px 15px; font-weight: bold; color: #0f766e; text-align: right; white-space: nowrap;">3 credits</td>
                                </tr>
                                <tr style="background: rgba(254, 226, 226, 0.5);">
                                    <td style="padding: 12px 15px; font-weight: bold; color: #991b1b; text-transform: uppercase;">TOTAL</td>
                                    <td style="padding: 12px 15px; font-weight: bold; color: #b91c1c; text-align: right; font-size: 1.05rem;">20 credits</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #0f766e; font-size: 1.05rem;">
                        <i class="fa-solid fa-calculator"></i> Maths
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
                        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                            <li>Algebra 1</li>
                            <li>Geometry</li>
                            <li>Algebra 2</li>
                            <li>SAT Prep (tự chọn)</li>
                            <li>Precalculus (tự chọn)</li>
                        </ul>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #0f766e; font-size: 1.05rem;">
                        <i class="fa-solid fa-language"></i> Foreign Language: Chinese
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
                        <ul style="margin: 0; padding-left: 20px; list-style-type: square;">
                            <li style="margin-bottom: 4px;">Pinyin</li>
                            <li style="margin-bottom: 4px;">Chiết tự</li>
                            <li style="margin-bottom: 0;">Polyglyph</li>
                        </ul>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #0f766e; font-size: 1.05rem;">
                        <i class="fa-solid fa-palette"></i> Visual/Performing Arts or third Foreign Language (1)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
                        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                            <li>Drum</li>
                            <li>Móc len</li>
                            <li>French (German/Korean/Japanese)</li>
                        </ul>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #0f766e; font-size: 1.05rem;">
                        <i class="fa-solid fa-running"></i> Physical Education (0.5)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
                        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                            <li>Karate</li>
                            <li>Bơi</li>
                        </ul>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #0f766e; font-size: 1.05rem;">
                        <i class="fa-solid fa-heart-pulse"></i> Health (0.5)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
                        <p>Nội dung đang được cập nhật...</p>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #99f6e4; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #0f766e; font-size: 1.05rem;">
                        <i class="fa-solid fa-book-open"></i> Electives or Career & Technical Education Courses (may be additional cores) (3)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
                        <p>Nội dung đang được cập nhật...</p>
                    </div>
                </details>

            </div>
        `
    },
    'dream': {
        title: 'DA Dream Map',
        desc: '',
        icon: 'fa-rocket',
        color: '#8b5cf6',
        defaultWorkCat: 'Vision',
        defaultSysCat: 'N/A',
        guide: `
            <div class="tab-guide-content">
                <h4><i class="fa-solid fa-rocket"></i> DA Dream Map</h4>
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border-left: 4px solid #8b5cf6; font-size: 0.95rem; line-height: 1.5;">
                    <p style="margin-bottom: 8px;"><strong style="color: #5b21b6;">50,000 ft (Sứ mệnh):</strong> Sống tự chủ, làm chủ năng lực học tập suốt đời và tự tạo giá trị cho xã hội.</p>
                    <p style="margin-bottom: 8px;"><strong style="color: #5b21b6;">40,000 ft (Tầm nhìn):</strong> Sở hữu sự nghiệp tự do, tự chủ tài chính trong 3–5 năm.</p>
                    <p style="margin-bottom: 12px;"><strong style="color: #5b21b6;">30,000 ft (Mục tiêu):</strong> Đạt thu nhập $1,000/tháng từ công việc Freelance/Kinh doanh trong 12 tháng.</p>
                    
                    <div style="margin-bottom: 12px; font-style: italic; color: #4c1d95; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px;">
                        <strong style="color: #5b21b6;">20,000 ft (Lĩnh vực): Lĩnh vực Năng lực Thực chiến & Thương hiệu Cá nhân</strong>
                    </div>
                    
                    <p style="margin-bottom: 8px;"><strong style="color: #5b21b6;">10,000 ft (Dự án):</strong></p>
                    <ul style="margin-bottom: 12px; margin-left: 15px; list-style-type: none; padding-left: 0;">
                        <li style="margin-bottom: 4px;"><i class="fa-solid fa-check" style="color: #8b5cf6; margin-right: 5px;"></i> <strong>Dự án Kỹ năng:</strong> Master kỹ năng Lập trình Web / Marketing trong 3 tháng.</li>
                        <li style="margin-bottom: 4px;"><i class="fa-solid fa-check" style="color: #8b5cf6; margin-right: 5px;"></i> <strong>Dự án Portfolio:</strong> Xây dựng trang web cá nhân trưng bày 3 sản phẩm thực tế.</li>
                        <li style="margin-bottom: 4px;"><i class="fa-solid fa-check" style="color: #8b5cf6; margin-right: 5px;"></i> <strong>Dự án Mạng lưới:</strong> Cold email & thực hiện 10 cuộc phỏng vấn với Mentor trong ngành.</li>
                    </ul>

                </div>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #c4b5fd; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #5b21b6; font-size: 1.05rem;">
                        <i class="fa-solid fa-route"></i> Phân tích: LỘ TRÌNH PHÁT TRIỂN SỰ NGHIỆP TỰ DO (5 BƯỚC)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 12px; font-style: italic; color: #475569;">Con đường phát triển sự nghiệp theo đúng trật tự tâm lý và lộ trình gia tăng giá trị thực tế trên thị trường, giải quyết triệt để 5 câu hỏi lớn nhất:</p>
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #6d28d9; font-size: 1.02rem;">Bước 1: Tích lũy Kỹ năng Thực chiến (Gain Practical Skills)</strong>
                            <p style="margin-bottom: 4px; margin-top: 4px;"><strong>Câu hỏi giải quyết:</strong> <em>"Mình sẽ bán giá trị gì cho thị trường?"</em></p>
                            <p style="margin-bottom: 4px;"><strong>Tại sao nằm ở Bước 1:</strong> Bạn không thể làm dự án, xây Portfolio hay tạo ra bất kỳ dòng tiền nào nếu chưa sở hữu một kỹ năng cốt lõi (Core Competency) mà thị trường sẵn sàng trả phí (Lập trình, Thiết kế, Copywriting, Digital Marketing...).</p>
                            <p style="margin-bottom: 0;"><strong>Trạng thái tài chính:</strong> Đầu tư ban đầu (0 thu nhập). Đây là giai đoạn tập trung 100% nguồn lực để tự học, học qua làm (learn by doing) và làm chủ công cụ.</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #6d28d9; font-size: 1.02rem;">Bước 2: Xây dựng Portfolio Sản phẩm (Build a Portfolio)</strong>
                            <p style="margin-bottom: 4px; margin-top: 4px;"><strong>Câu hỏi giải quyết:</strong> <em>"Làm sao để thị trường tin mình làm được?"</em></p>
                            <p style="margin-bottom: 4px;"><strong>Tại sao nằm ở Bước 2:</strong> Kiến thức ở Bước 1 phải được chuyển hóa thành sản phẩm thực tế (App đã vận hành, bài viết đã xuất bản, thiết kế đã ứng dụng) để làm "bằng chứng thép".</p>
                            <p style="margin-bottom: 4px;"><strong>Trạng thái tài chính:</strong> Khởi tạo dòng tiền thử nghiệm (Tiền lẻ / Dòng tiền nhỏ).</p>
                            <p style="margin-bottom: 4px;">Thay vì chỉ làm sản phẩm giả định, bạn có thể nhận các hợp đồng Freelance quy mô nhỏ, làm dự án giá rẻ hoặc nhận hoa hồng từ sản phẩm đầu tay.</p>
                            <p style="margin-bottom: 0;"><strong>Mục tiêu chính:</strong> Chưa phải là giàu có, mà là dùng đồng tiền thực tế từ khách hàng để xác thực (validate) giá trị của Portfolio.</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #6d28d9; font-size: 1.02rem;">Bước 3: Xây dựng Mạng lưới Cố vấn & Đồng hành (Build a Network)</strong>
                            <p style="margin-bottom: 4px; margin-top: 4px;"><strong>Câu hỏi giải quyết:</strong> <em>"Ai sẽ là người mở cánh cửa cơ hội và đưa mình đến với những thương vụ lớn hơn?"</em></p>
                            <p style="margin-bottom: 4px;"><strong>Tại sao nằm ở Bước 3:</strong> Khi đã có kỹ năng (Bước 1) và sản phẩm chứng minh (Bước 2), bạn tiếp cận các chuyên gia, Mentor và đối tác (Cold Email, tham gia cộng đồng) với tư thế của một người trao giá trị, không phải người đi xin xỏ.</p>
                            <p style="margin-bottom: 4px;"><strong>Trạng thái tài chính:</strong> Gia tăng cơ hội thu nhập phụ (Micro-revenues & Referrals).</p>
                            <p style="margin-bottom: 0;">Nhờ mạng lưới kết nối, bạn bắt đầu nhận được các lời giới thiệu dự án (Referrals), công việc bán thời gian (Part-time), hoặc các hợp đồng cộng tác có trả phí từ chính Mentor/đồng nghiệp trong ngành.</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #6d28d9; font-size: 1.02rem;">Bước 4: Bước ra Thị trường / Tự Thúc đẩy (Launch Yourself)</strong>
                            <p style="margin-bottom: 4px; margin-top: 4px;"><strong>Câu hỏi giải quyết:</strong> <em>"Làm sao để biến kỹ năng, sản phẩm và mạng lưới thành Thu nhập chính thức & Sự nghiệp bền vững?"</em></p>
                            <p style="margin-bottom: 4px;"><strong>Tại sao nằm ở Bước 4:</strong> Đây là thời điểm "thu hoạch" quy mô lớn. Khi đã hội đủ 3 nền tảng trên, bạn chủ động tự đề xuất vị trí làm việc chính thức với doanh nghiệp, chào gói dịch vụ Freelance cao cấp, hoặc thương mại hóa mô hình kinh doanh nhỏ (Micro-business).</p>
                            <p style="margin-bottom: 0;"><strong>Trạng thái tài chính:</strong> Bứt phá dòng tiền chính (Tự chủ tài chính / Thu nhập chính thức). Bạn chính thức bước vào thị trường với tư thế một chuyên gia tự chủ, đạt mốc thu nhập mục tiêu (ví dụ: $1,000–$3,000+/tháng) mà không bị giới hạn bởi bằng cấp.</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #6d28d9; font-size: 1.02rem;">Bước 5: Rèn luyện Bản lĩnh & Tư duy Tự chủ (Personal Mastery)</strong>
                            <p style="margin-bottom: 4px; margin-top: 4px;"><strong>Câu hỏi giải quyết:</strong> <em>"Làm sao để giữ vững phong độ, tăng giá trị bản thân và không bị bỏ lại phía sau?"</em></p>
                            <p style="margin-bottom: 4px;"><strong>Tại sao nằm ở bước cuối (Môi trường bao phủ):</strong> Khi đã có thu nhập tốt, thách thức lớn nhất là duy trì kỷ luật, quản lý rủi ro tài chính và liên tục nâng cấp bản thân. Bước này đóng vai trò như một hệ điều hành, giúp bạn tái đầu tư vào Bước 1 (kỹ năng mới) để nâng mức giá của bản thân lên cao hơn.</p>
                            <p style="margin-bottom: 0;"><strong>Trạng thái tài chính:</strong> Tăng trưởng & Tối ưu hóa tài chính dài hạn. Nâng cao đơn giá theo giờ (Hourly rate), đàm phán mức lương/hợp đồng cao hơn và xây dựng tài sản tích lũy bền vững.</p>
                        </div>

                        <div style="margin-top: 20px; padding: 15px; background: rgba(124, 58, 237, 0.05); border: 1px solid #c4b5fd; border-radius: 8px;">
                            <strong style="color: #5b21b6; display: block; margin-bottom: 10px;"><i class="fa-solid fa-chart-line"></i> SƠ ĐỒ CHUYỂN DỊCH TÀI CHÍNH QUA 5 BƯỚC:</strong>
                            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 0;">
                                <li style="margin-bottom: 6px;"><strong>Bước 1: Skill</strong> <span style="color: #64748b;">&rarr; Đầu tư thời gian/trí tuệ ($0)</span></li>
                                <li style="margin-bottom: 6px;"><strong>Bước 2: Portfolio</strong> <span style="color: #64748b;">&rarr; Tạo dòng tiền thử nghiệm / Hợp đồng nhỏ ($)</span></li>
                                <li style="margin-bottom: 6px;"><strong>Bước 3: Network</strong> <span style="color: #64748b;">&rarr; Mở rộng cơ hội giới thiệu / Dự án cộng tác ($$)</span></li>
                                <li style="margin-bottom: 6px;"><strong>Bước 4: Launch</strong> <span style="color: #64748b;">&rarr; Bứt phá dòng tiền chính / Thu nhập tự chủ ($$$$)</span></li>
                                <li style="margin-bottom: 0;"><strong>Bước 5: Mastery</strong> <span style="color: #64748b;">&rarr; Tối ưu đơn giá &amp; Tăng trưởng tài chính dài hạn ($$$$$)</span></li>
                            </ul>
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
                        <i class="fa-solid fa-laptop-code"></i> MÔ HÌNH 1: "Học Qua Làm" (Learn by Doing) Ngay Trong Cấp 3
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 4px;"><strong><span style="color: #1d4ed8;">Bản chất:</span></strong> Dự án Dream Map (Viết sách, Xuất bản App, Tổ chức Sự kiện) áp dụng khung 5 Bước không phải để con bạn bỏ học đi làm full-time ngay, mà là để sản phẩm đó có giá trị thực (thị trường chấp nhận, có dòng tiền/người dùng thật).</p>
                        
                        <p style="margin-bottom: 4px;"><strong><span style="color: #1d4ed8;">Cách hiểu:</span></strong> Thay vì làm một dự án "giả lập" chỉ để làm đẹp hồ sơ, con áp dụng khung 5 bước: Học kỹ năng (B1) &rarr; Đóng gói sản phẩm (B2) &rarr; Tiếp cận Mentor (B3) &rarr; Ra mắt sản phẩm / Thương mại hóa nhỏ (B4).</p>
                        
                        <p style="margin-bottom: 10px;">Chính số tiền kiếm được ($) hoặc số lượng người dùng thực tế từ Bước 2/Bước 3/Bước 4 trở thành "bằng chứng thép" (Proof of Work) vô cùng ấn tượng trong Dự án Hồ sơ Đại học (College Portfolio).</p>
                        
                        <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 10px; border-radius: 6px;">
                            <strong>Tóm lại:</strong> Khung 5 Bước lúc này là "động cơ thực thi" để tạo ra Sản phẩm Dream Map chất lượng nhất gửi cho Trường Đại học.
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #047857; font-size: 1.05rem;">
                        <i class="fa-solid fa-map-signs"></i> MÔ HÌNH 2: Chiến Lược "Gap Year / Parallel Track" (Thực Chiến Trước, Đại Học Sau)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 8px;"><em>Kịch bản dành cho người muốn kiểm tra năng lực bản thân và chuẩn bị tài chính/kinh nghiệm trước khi vào Đại học.</em></p>
                        
                        <p style="margin-bottom: 4px;"><strong><span style="color: #047857;">Bản chất:</span></strong> Người học dành 1–2 năm chạy trọn vẹn khung 5 Bước để tự chủ tài chính nhỏ, tích lũy vốn sống, xác định chính xác ngành mình yêu thích.</p>
                        
                        <p style="margin-bottom: 4px;"><strong><span style="color: #047857;">Cách hiểu:</span></strong> Sau khi hoàn thành Bước 4 (Có thu nhập tự chủ, hiểu rõ thị trường), họ nhận ra: "Đại học là nơi giúp mình nâng cấp tư duy nền tảng và mở rộng mạng lưới ở quy mô lớn hơn (Bản nâng cấp của Bước 5)".</p>
                        
                        <p style="margin-bottom: 10px;">Lúc này, họ quay lại dùng chính toàn bộ thành quả (Portfolio, Thu nhập, Trải nghiệm) của 5 bước đó để nộp xin Học bổng Đại học.</p>
                        
                        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 10px; border-radius: 6px;">
                            <strong>Tóm lại:</strong> Đi làm/thực chiến ngắn hạn &rarr; Hiểu rõ mình cần gì &rarr; Bước vào Đại học với tư thế của một người từng trải, hoàn toàn chủ động chứ không đi học vì phong trào.
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #c2410c; font-size: 1.05rem;">
                        <i class="fa-solid fa-hammer"></i> MÔ HÌNH 3: "DIY Degree" (Tự Tạo Bằng Đại Học Cho Ngành Mới / Học Sau Đại Học)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 8px;"><em>Kịch bản dành cho người đã đi làm/đã có nền tảng, muốn chuyển ngành hoặc nâng tầm sự nghiệp.</em></p>
                        
                        <p style="margin-bottom: 4px;"><strong><span style="color: #c2410c;">Bản chất:</span></strong> Bạn dùng khung 5 Bước để tự đào tạo mình ở một ngành hoàn toàn mới (ví dụ: từ Kinh tế chuyển sang Khoa học Dữ liệu hoặc Thiết kế).</p>
                        
                        <p style="margin-bottom: 4px;"><strong><span style="color: #c2410c;">Cách hiểu (5 Bước Dream Map):</span></strong> Giúp bạn làm chủ kỹ năng ngành mới, tạo ra dòng tiền và sản phẩm thực tế mà không cần tốn 4 năm đi học lại đại học từ đầu.</p>
                        
                        <p style="margin-bottom: 10px;"><strong><span style="color: #c2410c;">Hồ sơ Đại học (Horizons 50k–10k ft):</span></strong> Nếu ngành mới yêu cầu bằng cấp chuyên sâu (như Thạc sĩ/Cao học), toàn bộ các Dự án Dream Map thực chiến kia trở thành Hồ sơ ứng tuyển (Portfolio) cực mạnh để xin học bổng Cao học (Master/PhD) hoặc các chứng chỉ quốc tế cao cấp.</p>
                        
                        <div style="background: rgba(249, 115, 22, 0.1); border-left: 4px solid #f97316; padding: 10px; border-radius: 6px;">
                            <strong>Tóm lại:</strong> Dùng khung 5 bước như một công cụ xây dựng "Bằng cấp tự tạo" (DIY Degree) để đi tắt đón đầu trên con đường chuyển hướng sự nghiệp.
                        </div>
                    </div>
                </details>
            </div>
        `
    },
    'scm': {
        title: 'SCM & AI:',
        desc: 'DA Dream Map & DA Tín chỉ',
        icon: 'fa-truck-fast',
        color: '#3b82f6',
        defaultWorkCat: 'Vision',
        defaultSysCat: 'N/A',
        guide: `
<div class="tab-guide-content">
                <h4><i class="fa-solid fa-truck-fast"></i> SCM & AI: DA Dream Map & DA Tín chỉ</h4>
    <div style="margin-bottom: 20px; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6; font-size: 0.95rem; line-height: 1.5;">
        <p style="margin-bottom: 12px;">Sự kết hợp giữa <strong>Supply Chain (Chuỗi cung ứng)</strong> và <strong>Trí tuệ nhân tạo (AI)</strong> đang tạo ra bước ngoặt lớn, giúp chuyển đổi các chuỗi cung ứng truyền thống (vốn thụ động, xử lý dữ liệu chậm) thành chuỗi cung ứng thông minh (Smart Supply Chain) với khả năng tự động hóa, dự báo chính xác và ứng phó linh hoạt.</p>
        <p>Dưới đây là các ứng dụng cốt lõi, lợi ích mang lại và thách thức khi triển khai AI trong chuỗi cung ứng:</p>
    </div>

    <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;" open>
        <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
            1. Các ứng dụng cốt lõi của AI trong Chuỗi cung ứng
        </summary>
        <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
            <p><strong>A. Dự báo nhu cầu (Demand Forecasting)</strong><br>
            - <em>Cách AI hoạt động:</em> Thay vì chỉ dựa vào dữ liệu bán hàng quá khứ, các mô hình Học máy (Machine Learning) phân tích đồng thời dữ liệu lịch sử, xu hướng thị trường, thời tiết, biến động kinh tế, mạng xã hội và thậm chí cả sự kiện địa chính trị.<br>
            - <em>Tác dụng:</em> Giảm tình trạng thiếu hàng (stockouts) hoặc tồn kho quá mức (overstocking), giúp doanh nghiệp tối ưu hóa lượng hàng tồn trữ.</p>
            
            <p><strong>B. Quản lý kho hàng & Tự động hóa (Warehouse Automation)</strong><br>
            - <em>Robots & AMR (Autonomous Mobile Robots):</em> AI điều hướng robot tự hành trong kho để lấy hàng (picking), đóng gói và sắp xếp hàng hóa tối ưu.<br>
            - <em>Kiểm kê tự động:</em> Sử dụng thị giác máy tính (Computer Vision) kết hợp với Drone để quét mã vạch và kiểm kê hàng tồn kho theo thời gian thực với độ chính xác tuyệt đối.</p>
            
            <p><strong>C. Tối ưu hóa vận tải & Logistics (Route & Network Optimization)</strong><br>
            - <em>Định tuyến thông minh:</em> AI tính toán tuyến đường giao hàng tối ưu dựa trên tình trạng giao thông thời gian thực, thời tiết, tải trọng xe và hạn giao hàng.<br>
            - <em>Logistics chặng cuối (Last-mile Delivery):</em> Phân bổ đơn hàng cho tài xế hoặc phương tiện giao hàng (drone, xe tự hành) để giảm thời gian và chi phí nhiên liệu.</p>
            
            <p><strong>D. Bảo trì dự đoán (Predictive Maintenance)</strong><br>
            - <em>Giám sát thiết bị:</em> Cảm biến IoT gắn trên xe tải, máy móc nhà xưởng gửi dữ liệu về hệ thống AI để phát hiện các dấu hiệu hỏng hóc trước khi sự cố xảy ra.<br>
            - <em>Tác dụng:</em> Giảm thời gian dừng hoạt động ngoài kế hoạch (downtime) và kéo dài tuổi thọ tài sản.</p>
            
            <p><strong>E. Quản lý rủi ro & Nhà cung cấp (Risk Management & Supplier Analytics)</strong><br>
            - <em>Cảnh báo sớm:</em> AI quét tin tức toàn cầu, dữ liệu thời tiết và báo cáo tài chính để phát hiện sớm nguy cơ đứt gãy từ phía nhà cung cấp (thiên tai, đình công, phá sản).<br>
            - <em>Đánh giá nhà cung cấp:</em> Tự động xếp hạng và chấm điểm hiệu suất của nhà cung cấp dựa trên tỷ lệ giao hàng đúng hạn, chất lượng sản phẩm và biến động giá.</p>
            
            <p><strong>F. AI Tạo sinh (Generative AI) trong Chuỗi cung ứng</strong><br>
            - Tự động tạo và xử lý hóa đơn, chứng từ xuất nhập khẩu, hợp đồng.<br>
            - Trợ lý ảo (Chatbot AI) hỗ trợ xử lý sự cố đơn hàng, giải đáp thắc mắc cho đối tác và khách hàng 24/7.</p>
        </div>
    </details>

    <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;">
        <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
            2. Lợi ích chiến lược AI mang lại
        </summary>
        <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 10px;">
                <thead>
                    <tr style="background: rgba(59, 130, 246, 0.1); color: #1e3a8a;">
                        <th style="padding: 10px; border-bottom: 2px solid #93c5fd;">Tiêu chí</th>
                        <th style="padding: 10px; border-bottom: 2px solid #93c5fd;">Chuỗi cung ứng Truyền thống</th>
                        <th style="padding: 10px; border-bottom: 2px solid #93c5fd;">Chuỗi cung ứng kết hợp AI</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #dbeafe;">
                        <td style="padding: 10px;"><strong>Phản ứng với biến động</strong></td>
                        <td style="padding: 10px;">Thụ động (xử lý khi sự cố đã xảy ra)</td>
                        <td style="padding: 10px; font-weight: bold; color: #047857;">Chủ động (dự báo và phòng ngừa trước)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #dbeafe; background: rgba(243, 244, 246, 0.5);">
                        <td style="padding: 10px;"><strong>Độ chính xác dự báo</strong></td>
                        <td style="padding: 10px;">Dựa trên kinh nghiệm & dữ liệu cũ (60–70%)</td>
                        <td style="padding: 10px; font-weight: bold; color: #047857;">Dựa trên dữ liệu đa chiều thời gian thực (>90%)</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #dbeafe;">
                        <td style="padding: 10px;"><strong>Chi phí vận hành</strong></td>
                        <td style="padding: 10px;">Cao (chi phí tồn kho, lãng phí logistics)</td>
                        <td style="padding: 10px; font-weight: bold; color: #047857;">Tối ưu (giảm 15–20% chi phí kho & vận chuyển)</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px;"><strong>Thời gian giao hàng</strong></td>
                        <td style="padding: 10px;">Chậm hơn, dễ trễ do nghẽn mạng lưới</td>
                        <td style="padding: 10px; font-weight: bold; color: #047857;">Tối ưu hóa tuyến đường, giao hàng nhanh hơn</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </details>

    <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;">
        <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
            3. Thách thức khi triển khai AI
        </summary>
        <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
            <ul style="padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>Chất lượng dữ liệu (Data Quality):</strong> AI cần lượng lớn dữ liệu chuẩn xác, sạch và đồng bộ. Nếu dữ liệu đầu vào bị phân mảnh hoặc sai lệch, dự đoán của AI sẽ không hiệu quả.</li>
                <li style="margin-bottom: 8px;"><strong>Chi phí đầu tư ban đầu:</strong> Chi phí tích hợp hạ tầng công nghệ, hệ thống IoT và đào tạo nhân sự khá đắt đỏ.</li>
                <li style="margin-bottom: 8px;"><strong>Thay đổi văn hóa doanh nghiệp:</strong> Nhân sự truyền thống có thể e ngại bị thay thế hoặc gặp khó khăn khi tiếp cận công nghệ mới.</li>
                <li style="margin-bottom: 8px;"><strong>An ninh mạng & Bảo mật:</strong> Chuỗi cung ứng kết nối AI và Cloud dễ trở thành mục tiêu của các cuộc tấn công mạng nếu không có giải pháp bảo mật vững chắc.</li>
            </ul>
        </div>
    </details>

    <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;">
        <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
            4. Ví dụ thực tế từ các tập đoàn lớn
        </summary>
        <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
            <ul style="padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>Amazon:</strong> Sử dụng AI và hơn 750.000 robot để quản lý kho, cùng thuật toán dự báo nhu cầu để chuẩn bị hàng hóa tại kho gần khách hàng nhất trước cả khi họ bấm mua.</li>
                <li style="margin-bottom: 8px;"><strong>Walmart:</strong> Dùng AI phân tích dữ liệu thời tiết và xu hướng khu vực để điều phối hàng hóa đến đúng cửa hàng trước khi các đợt bão hoặc nắng nóng diễn ra.</li>
                <li style="margin-bottom: 8px;"><strong>DHL:</strong> Sử dụng thuật toán AI định tuyến giao hàng giúp tiết kiệm hàng triệu lít nhiên liệu mỗi năm.</li>
            </ul>
        </div>
    </details>
    <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;" open>
        <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
            5. Bức tranh tổng thể về năng lực
        </summary>
        <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
            <p><strong>Góc độ Kỹ thuật & Phần cứng (Automotive / Electronics / Industrial Maintenance):</strong><br>
            Cho bạn hiểu biết thực tế về "thể xác" của chuỗi cung ứng: xe tải, xe nâng, băng tải, hệ thống điện kho bãi, cơ chế vận hành và bảo trì máy móc.</p>
            
            <p><strong>Góc độ Công nghệ & Phần mềm (Computer Science / Python / Data Science):</strong><br>
            Cho bạn "bộ não" để điều khiển phần cứng: viết thuật toán, xử lý dữ liệu lớn, áp dụng AI để tối ưu lộ trình và dự báo bảo trì thiết bị.</p>
            
            <p><strong>Góc độ Kinh doanh & Quản lý (Intro to Business / Economics / Finance):</strong><br>
            Cho bạn "tư duy hệ thống": hiểu tại sao doanh nghiệp cần tối ưu chi phí, cách tính toán lợi nhuận, dòng tiền và quản lý vận hành.</p>
        </div>
    </details>

    <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;" open>
        <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
            6. Ví dụ về 2 cách phối hợp 3 Credits thực tế
        </summary>
        <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
            <strong style="color: #047857;">Cách 1: Nghiêng về "Kỹ thuật + Công nghệ" (Thực hành & Phần cứng)</strong>
            <ul style="padding-left: 20px; margin-bottom: 12px;">
                <li><strong>1.0 Credit:</strong> Automotive Technology (hoặc Basic Electronics) &rarr; Học sâu về cơ khí / điện tử.</li>
                <li><strong>1.0 Credit:</strong> Python Programming (hoặc AP Computer Science) &rarr; Học lập trình và xử lý dữ liệu.</li>
                <li><strong>1.0 Credit:</strong> Intro to Business (hoặc Economics) &rarr; Nắm tư duy vận hành doanh nghiệp.</li>
            </ul>

            <strong style="color: #047857;">Cách 2: Nghiêng về "Cơ điện tử & Tự động hóa kho bãi" (Mechatronics)</strong>
            <ul style="padding-left: 20px; margin-bottom: 12px;">
                <li><strong>1.0 Credit:</strong> Mechatronics / Robotics Technology &rarr; Kết hợp thẳng cả cơ khí, điện tử lẫn lập trình robot.</li>
                <li><strong>1.0 Credit:</strong> Data Science / AP Statistics &rarr; Phân tích dữ liệu chuỗi cung ứng.</li>
                <li><strong>1.0 Credit:</strong> Business Management / Financial Literacy &rarr; Quản lý tài chính & tối ưu chi phí vận hành.</li>
            </ul>

            <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 12px; border-radius: 6px; margin-top: 15px;">
                <p style="margin-bottom: 8px; font-weight: bold; color: #047857;"><i class="fa-solid fa-star"></i> Lợi thế khi chọn theo cách này</p>
                <p style="margin-bottom: 0;">Khi nộp đơn vào Đại học (hoặc viết bài luận xin học bổng), một hồ sơ kết hợp như vậy thể hiện bạn không chỉ là người "học lý thuyết trên giấy" hay chỉ biết "ngồi gõ code", mà là một học sinh có trải nghiệm thực tế với máy móc, hiểu bản chất phần cứng và biết dùng công nghệ/kinh doanh để giải quyết bài toán thực tế.</p>
            </div>
        </div>
    </details>
    <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;" open>
        <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
            7. Kết nối thành một Bức tranh Thực thi Thống nhất
        </summary>
        <div style="margin-top: 15px; font-size: 0.95rem; color: #334155;">
            <p><strong>1. Sự kết nối giữa Bộ môn học (3 Credits) và Dream Map</strong><br>
            Nếu chỉ học 3 môn học này riêng rẽ, chúng vẫn chỉ là các tín chỉ nằm trên bảng điểm. Nhưng khi đặt vào Dream Map, 3 môn học này chuyển hóa thành 3 công cụ cốt lõi để tạo ra một <strong>Sản phẩm thực tế (Product / Project)</strong>:</p>
            <ul style="padding-left: 20px; margin-bottom: 12px;">
                <li><strong>Kỹ thuật & Phần cứng (Automotive/Mechatronics):</strong> Cung cấp chất liệu / môi trường thực tế (Hardware/Physical Layer).</li>
                <li><strong>Công nghệ & Phần mềm (Python/Data Science):</strong> Cung cấp trí tuệ / giải pháp tự động hóa (Software/Brain Layer).</li>
                <li><strong>Kinh doanh & Quản lý (Business/Economics):</strong> Cung cấp bài toán kinh tế / giá trị thực tiễn (Business Case/Impact Layer).</li>
            </ul>
            
            <div style="background: rgba(243, 244, 246, 0.8); padding: 10px; border-radius: 6px; border-left: 3px solid #64748b; margin-bottom: 15px;">
                <p style="margin-bottom: 4px; font-weight: bold;">Ví dụ về một Dự án Dream Map sinh ra từ sự kết hợp này:</p>
                <p style="margin-bottom: 4px;"><strong>Dự án Dream Map:</strong> Xây dựng hệ thống tự động cảnh báo bảo trì & tối ưu lộ trình cho một đội xe tải / thiết bị kho bãi nhỏ tại địa phương.</p>
                <p style="margin-bottom: 0;"><strong>Việc con làm:</strong> Dùng kiến thức Kỹ thuật để hiểu cơ chế hỏng hóc cơ khí &rarr; Dùng Python viết thuật toán dự báo dựa trên dữ liệu cảm biến &rarr; Dùng tư duy Business để tính toán xem hệ thống này giúp doanh nghiệp tiết kiệm bao nhiêu % chi phí vận hành.</p>
            </div>

            <p><strong>2. Chiếu sang Mô hình 1: "Học Qua Làm" (Learn by Doing)</strong><br>
            Mô hình 1 nhấn mạnh: Con học kiến thức không phải để đi thi lấy điểm rồi để đó, mà học đến đâu dùng để giải quyết bài toán thực tế ngay đến đó (tạo ra Proof of Work). Khi áp dụng Mô hình 1 vào bộ môn học trên, tiến trình phát triển của con sẽ đi theo đúng <strong>Khung 5 Bước</strong> của Blake Boles:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tbody>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; font-weight: bold; width: 140px;">Bước 1 (Practical Skills):</td>
                        <td style="padding: 8px;">Học 3 Credits (Mechatronics + Python + Business) để có kỹ năng nền.</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; font-weight: bold;">Bước 2 (Portfolio):</td>
                        <td style="padding: 8px;">Chế tạo mô hình/ứng dụng thực tế & thử nghiệm trực tiếp trên máy móc thật.</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; font-weight: bold;">Bước 3 (Network):</td>
                        <td style="padding: 8px;">Đem giải pháp đến gõ cửa các xưởng bảo trì/kho bãi địa phương, xin ý kiến Mentor.</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 8px; font-weight: bold;">Bước 4 (Launch / $):</td>
                        <td style="padding: 8px;">Áp dụng thử nghiệm cho 1 đơn vị thực tế, chứng minh giúp họ tiết kiệm chi phí ($).</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Bước 5 (Mastery):</td>
                        <td style="padding: 8px;">Đóng gói toàn bộ quá trình thành <strong>Portfolio & Bài luận ứng tuyển Đại học</strong>.</td>
                    </tr>
                </tbody>
            </table>

            <p><strong>3. Sức mạnh vượt trội khi nộp Hồ sơ Đại học (The Standout Factor)</strong><br>
            Hội đồng tuyển sinh Đại học (đặc biệt là các trường hàng đầu khối STEM / Logistics / Business) cực kỳ ấn tượng với những hồ sơ này vì:</p>
            <ul style="padding-left: 20px; margin-bottom: 15px;">
                <li style="margin-bottom: 6px;"><strong>Xóa bỏ hình mẫu "Học sinh học vẹt" (No Paper Student):</strong>
                    <ul style="padding-left: 20px; margin-top: 4px;">
                        <li><em>Học sinh truyền thống:</em> Chỉ có điểm A môn Toán, Lý, Kinh tế trên giấy.</li>
                        <li><em>Con của bạn:</em> Có điểm A tín chỉ + Có một Portfolio thực tế chứng minh đã vận dụng cả 3 môn đó để giải quyết một bài toán ngoài đời thực.</li>
                    </ul>
                </li>
                <li style="margin-bottom: 6px;"><strong>Thể hiện Tư duy Tích hợp Chuyên ngành (Interdisciplinary Thinking):</strong> Con không bị đóng khung là "chỉ biết viết code" hay "chỉ biết sửa máy", mà là người có tư duy hệ thống: biết kết nối Phần cứng + Phần mềm + Bài toán Tài chính.</li>
                <li><strong>Chất liệu làm nên Bài luận cá nhân (Personal Statement) đỉnh cao:</strong> Bài luận của con sẽ không còn là những triết lý chung chung, mà là câu chuyện thực chiến: <em>"Tôi đã đối mặt với bài toán hỏng hóc thiết bị ra sao, tôi đã dùng Python giải quyết nó thế nào, và tôi nhận ra giá trị kinh tế mà công nghệ mang lại cho doanh nghiệp truyền thống như thế nào."</em></li>
            </ul>

            <div style="background: rgba(236, 72, 153, 0.05); border: 1px solid #fbcfe8; border-radius: 8px; padding: 15px;">
                <p style="margin-bottom: 10px; font-weight: bold; color: #be185d; text-align: center;"><i class="fa-solid fa-layer-group"></i> Bảng Cấu Trúc Quản Lý (10,000 ft - 50,000 ft)</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <tbody>
                        <tr style="border-bottom: 1px solid #fbcfe8;">
                            <td style="padding: 8px; font-weight: bold; color: #9d174d; width: 140px;">50,000 ft (Sứ mệnh)</td>
                            <td style="padding: 8px;">Trở thành nhà giải quyết bài toán thực tế bằng công nghệ và tư duy hệ thống.</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #fbcfe8;">
                            <td style="padding: 8px; font-weight: bold; color: #9d174d;">40,000 ft (Tầm nhìn)</td>
                            <td style="padding: 8px;">Trở thành ứng viên xuất sắc nhận học bổng Đại học ngành STEM/Supply Chain/Automation.</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #fbcfe8;">
                            <td style="padding: 8px; font-weight: bold; color: #9d174d;">30,000 ft (Mục tiêu)</td>
                            <td style="padding: 8px;">Hoàn thành 3 Credits tích hợp & Xây dựng 1 Dự án Tự động hóa Kho bãi có ứng dụng thực tế.</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #fbcfe8;">
                            <td style="padding: 8px; font-weight: bold; color: #9d174d;">20,000 ft (Lĩnh vực)</td>
                            <td style="padding: 8px; font-weight: bold;">Năng lực Kỹ thuật Tích hợp & Hồ sơ Đại học</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #fbcfe8;">
                            <td style="padding: 8px; font-weight: bold; color: #9d174d;">10,000 ft (Dự án)</td>
                            <td style="padding: 8px;">
                                • <strong>Dự án Tín chỉ:</strong> Hoàn thành 3 môn Mechatronics, Python, Intro to Business.<br>
                                • <strong>Dự án Dream Map:</strong> Chế tạo & triển khai Hệ thống Giám sát Thiết bị Kho bãi.<br>
                                • <strong>Dự án Hồ sơ:</strong> Đóng gói Portfolio & Viết Bài luận về quá trình làm dự án.
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; color: #9d174d;">Runway (Hành động)</td>
                            <td style="padding: 8px;">Đọc chương 1 giáo trình Mechatronics / Viết 50 dòng code Python mô phỏng dữ liệu hôm nay.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <p style="margin-top: 15px; padding: 10px; background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; border-radius: 4px; font-weight: bold; color: #1e40af;">Tóm lại: Cách phối hợp 3 Credits này chính là nguyên liệu hoàn hảo cho Mô hình 1. Nó giúp con bạn biến việc học các môn lý thuyết thành một Dự án Dream Map thực chiến, từ đó đóng gói ra một Portfolio ứng tuyển Đại học độc nhất vô nhị!</p>
        </div>
    </details>

    <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
        <h5 style="color: #b45309; margin-bottom: 10px; font-size: 1.05rem;"><i class="fa-solid fa-sticky-note"></i> Ghi chú: Cách hoàn thiện trọn vẹn đủ 3.0 Tín chỉ (Credits) khi trường thiếu môn CTE/Kỹ thuật</h5>
        <p style="margin-bottom: 15px; font-size: 0.95rem; color: #451a03;">Nếu trường không có các môn xưởng cơ khí, điện tử hay kinh doanh thực hành, bạn có thể ghép 3.0 tín chỉ hoàn chỉnh theo một trong các phương án sau:</p>
        
        <strong style="color: #d97706; display: block; margin-bottom: 5px;">Phương án A: Thêm 1 môn Cốt lõi nâng cao nữa (Tổng: 3 môn x 1.0 credit = 3.0 credits)</strong>
        <ul style="padding-left: 20px; font-size: 0.95rem; color: #334155; margin-bottom: 15px;">
            <li><strong>1.0 credit:</strong> AP Computer Science A (Khoa học máy tính)</li>
            <li><strong>1.0 credit:</strong> AP Statistics (Toán thống kê - cực kỳ quan trọng cho AI & Supply Chain)</li>
            <li><strong>1.0 credit:</strong> AP Microeconomics / Macroeconomics (Kinh tế học vi mô/vĩ mô) HOẶC AP Physics (Vật lý nâng cao - giúp hiểu nguyên lý cơ học của xe cẩu/xe nâng).</li>
        </ul>

        <strong style="color: #d97706; display: block; margin-bottom: 5px;">Phương án B: Kết hợp 2 môn năm (2.0 credits) + 2 môn kỳ (1.0 credit)</strong>
        <ul style="padding-left: 20px; font-size: 0.95rem; color: #334155; margin-bottom: 15px;">
            <li><strong>1.0 credit:</strong> AP Computer Science A (học 1 năm)</li>
            <li><strong>1.0 credit:</strong> AP Statistics (học 1 năm)</li>
            <li><strong>0.5 credit:</strong> Microeconomics / Financial Literacy (học 1 học kỳ)</li>
            <li><strong>0.5 credit:</strong> Public Speaking / Psychology / CAD-Engineering Design (học 1 học kỳ)</li>
        </ul>

        <strong style="color: #d97706; display: block; margin-bottom: 5px;">Phương án C: Học khóa học trực tuyến (Online CTE Courses)</strong>
        <p style="font-size: 0.95rem; color: #334155; margin-bottom: 0;">Nhiều trường Mỹ cho phép học sinh đăng ký các môn CTE (như Auto Tech, Electronics, Python, Intro to Business) qua các nền tảng trực tuyến được công nhận (như Florida Virtual School - FLVS hoặc Edmentum) để lấy đủ 1.0 credit CTE còn thiếu, ghép chung với 2.0 credits môn Cốt lõi nâng cao ở trên.</p>
    </div>

</div>
        `
    },
    'homeconomie': {
        title: 'Homeconomie',
        desc: 'DA Homeconomie',
        icon: 'fa-house-chimney',
        color: '#f59e0b',
        defaultWorkCat: 'Vision',
        defaultSysCat: 'N/A',
        guide: `
            <div class="tab-guide-content">
                <h4><i class="fa-solid fa-house-chimney"></i> Homeconomie</h4>
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 0.95rem; line-height: 1.5;">
                    <p>Nội dung đang cập nhật...</p>
                </div>
            </div>
        `
    },
    'kat': {
        title: 'Kế hoạch của Kat',
        desc: 'Hồ sơ Ứng tuyển Đại học (College Admissions)',
        icon: 'fa-graduation-cap',
        color: '#ec4899',
        defaultWorkCat: 'Vision',
        defaultSysCat: 'N/A',
        guide: `
            <div class="tab-guide-content">
                <h4><i class="fa-solid fa-graduation-cap"></i> Kế hoạch của Kat:</h4>
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(236, 72, 153, 0.1); border-radius: 8px; border-left: 4px solid #ec4899; font-size: 0.95rem; line-height: 1.5;">
                    <p style="margin-bottom: 8px;"><strong style="color: #be185d;">Sứ mệnh (50k ft):</strong> Theo đuổi tri thức tự do, tự chủ con đường học tập và tạo giá trị.</p>
                    <p style="margin-bottom: 8px;"><strong style="color: #be185d;">Tầm nhìn (40k ft):</strong> Nhận thư nhập học & học bổng từ trường Đại học mơ ước sau 3 năm.</p>
                    <p style="margin-bottom: 12px;"><strong style="color: #be185d;">Mục tiêu (30k ft):</strong> Đạt SAT 1450+, có 12 tín chỉ Cao đẳng và hoàn thành 3 dự án độc đáo.</p>
                    
                    <div style="margin-bottom: 12px; font-style: italic; color: #831843; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px;">
                        <strong style="color: #9d174d;">Lĩnh vực (20k ft): Chuẩn bị Hồ sơ Đại học (College Admissions Portfolio)</strong><br>
                        <span style="font-size: 0.9em;">(Lĩnh vực gom các dự án phục vụ 4 trụ cột ứng tuyển)</span>
                    </div>
                    
                    <p style="margin-bottom: 8px;"><strong style="color: #be185d;">Dự án (10k ft):</strong></p>
                    <ul style="margin-bottom: 12px; margin-left: 15px; list-style-type: none; padding-left: 0;">
                        <li style="margin-bottom: 4px;"><i class="fa-solid fa-check" style="color: #ec4899; margin-right: 5px;"></i> <strong>Dự án Học thuật:</strong> Highschool, SAT</li>
                        <li style="margin-bottom: 4px;"><i class="fa-solid fa-check" style="color: #ec4899; margin-right: 5px;"></i> <strong>Dự án Tín chỉ:</strong> 2 môn Online College Credits.</li>
                        <li style="margin-bottom: 4px;"><i class="fa-solid fa-check" style="color: #ec4899; margin-right: 5px;"></i> <strong>Dự án Dream Map (Sản phẩm):</strong> Viết sách / Xuất bản App / Tổ chức Sự kiện...</li>
                        <li style="margin-bottom: 4px;"><i class="fa-solid fa-check" style="color: #ec4899; margin-right: 5px;"></i> <strong>Dự án Hồ sơ:</strong> Đóng gói Portfolio & viết bài luận cá nhân.</li>
                    </ul>
                </div>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #fbcfe8; border-radius: 8px; padding: 10px 15px;" open>
                    <summary style="font-weight: bold; cursor: pointer; color: #be185d; font-size: 1.05rem;">
                        <i class="fa-solid fa-layer-group"></i> Phân tích chi tiết: HỆ SINH THÁI 6 CẤP ĐỘ
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; line-height: 1.6;">
                        
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #9d174d; font-size: 1.05em;">50,000 ft — SỨ MỆNH & TUYÊN NGÔN DANH TÍNH (MISSION & IDENTITY)</strong><br>
                            <i style="color: #be185d;">Tư duy Cổ điển (Logos - Ethos/Egos - Pathos) × Công nghệ AI Thế kỷ 21</i><br>
                            <p style="margin-top: 5px; margin-bottom: 8px;">Phá vỡ giới hạn độ tuổi, dấn thân tìm bản chất gốc rễ của tri thức để tháo dỡ, tái tạo và kiến tạo giá trị mới cho xã hội.</p>
                            <ul style="margin-left: 15px; margin-bottom: 0;">
                                <li style="margin-bottom: 4px;"><strong>LOGOS (Trí - Quy luật & Logic cốt lõi):</strong> Đi tìm Chân lý (Truth) và Nguyên lý thứ nhất (First Principles) của vũ trụ; mang trong mình tư duy của một nhà nghiên cứu liên môn, thấu hiểu trọn vẹn từ bản chất phần cứng, cấu trúc dữ liệu, thuật toán AI đến tư duy hệ thống kinh tế với bộ não suy luận mạch lạc, không đứt gãy.</li>
                                <li style="margin-bottom: 4px;"><strong>ETHOS / EGOS (Đức & Đảm - Bản lĩnh & Kỷ luật tự chủ):</strong> Khẳng định danh tính của một Nhà nghiên cứu tự do (Self-directed Scholar); giữ vững sự uy tín thông qua sản phẩm thật (Portfolio), kỷ luật tự giác, tuân thủ cam kết/deadlines và chuẩn mực chất lượng.</li>
                                <li><strong>PATHOS (Tâm - Rung cảm Trí tuệ & Thấu cảm):</strong> Nuôi dưỡng tình yêu tri thức từ sự kinh ngạc chân thành (Wonder & Awe) trước vẻ đẹp tự nhiên; dùng sự thấu cảm bài toán thực tế của cộng đồng làm động lực kiến tạo, truyền tải đam mê tự thân vào câu chuyện cá nhân.</li>
                            </ul>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #9d174d; font-size: 1.05em;">40,000 ft — TẦM NHÌN DÀI HẠN (VISION 3–5 NĂM)</strong>
                            <p style="margin-top: 5px; margin-bottom: 0;">Bước chân vào các Viện Công nghệ / Đại học tinh hoa (như MIT, Caltech hay các trường hàng đầu khu vực Massachusetts) như một hệ quả tất yếu của một bộ não nghiên cứu liên môn. Bước vào đại học là để kiến tạo cái mới, phát triển tiếp các công trình thực chiến, chứ không phải để ngồi nghe lại lý thuyết bề mặt.</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #9d174d; font-size: 1.05em;">30,000 ft — MỤC TIÊU CHIẾN LƯỢC (GOALS 1–2 NĂM)</strong>
                            <p style="margin-top: 5px; margin-bottom: 0;">Xây dựng bộ năng lực liên môn tích hợp (Kỹ thuật + Phần mềm + Kinh tế) và hoàn thành tối thiểu 1 Dự án Tự động hóa có ứng dụng thực tế & thương mại hóa/tạo tác động xã hội ở độ tuổi 12–15.</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #9d174d; font-size: 1.05em;">20,000 ft — LĨNH VỰC TRÁCH NHIỆM (AREAS OF FOCUS)</strong>
                            <p style="margin-top: 5px; margin-bottom: 0;">Năng lực Nghiên cứu Tích hợp & Hồ sơ Đại học Tinh hoa (Quản lý & nuôi dưỡng các trụ cột: Học thuật chuẩn hóa, Kỹ năng thực chiến, Portfolio sản phẩm và Mạng lưới chuyên môn).</p>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #9d174d; font-size: 1.05em;">10,000 ft — DANH SÁCH DỰ ÁN (ACTIVE PROJECTS)</strong>
                            <ul style="margin-top: 5px; margin-left: 15px; margin-bottom: 0;">
                                <li style="margin-bottom: 4px;"><strong>Dự án Học thuật Core:</strong> Hoàn thành 20 High School Credits + Ôn thi SAT đạt mục tiêu 1500+.</li>
                                <li style="margin-bottom: 4px;"><strong>Dự án Tín chỉ Chuyên sâu:</strong> Hoàn thành 3 môn Tích hợp (Mechatronics + Python / Data Science + Intro to Business).</li>
                                <li style="margin-bottom: 4px;"><strong>Dự án Dream Map (Sản phẩm Thực chiến):</strong> Triển khai Hệ thống Giám sát & Tự động hóa Thiết bị Kho bãi.</li>
                                <li><strong>Dự án Hồ sơ & Bài luận:</strong> Đóng gói Portfolio & Viết Bài luận cá nhân về Tâm thế Nhà nghiên cứu liên môn: Kiến tạo thay vì thụ động tiếp thu.</li>
                            </ul>
                        </div>

                        <div>
                            <strong style="color: #9d174d; font-size: 1.05em;">GROUND / RUNWAY — HÀNH ĐỘNG KẾ TIẾP (NEXT ACTIONS)</strong>
                            <ul style="margin-top: 5px; margin-left: 15px; margin-bottom: 0;">
                                <li style="margin-bottom: 4px;"><strong>Kỹ thuật (Logos):</strong> Đọc Chương 1 giáo trình Mechatronics & tóm tắt 3 nguyên lý vận hành phần cứng chiều nay.</li>
                                <li style="margin-bottom: 4px;"><strong>Lập trình (Logos):</strong> Mở IDE và viết 30 dòng code Python mô phỏng thuật toán xử lý dữ liệu cảm biến lúc 15:00.</li>
                                <li><strong>Kỷ luật (Ethos):</strong> Cập nhật tiến độ bài tập SAT trên Khan Academy đúng khung giờ đã cam kết.</li>
                            </ul>
                        </div>

                        <div style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.9); border-radius: 6px; border-left: 4px solid #be185d;">
                            <strong style="color: #9d174d; font-size: 1.05em;"><i class="fa-solid fa-lightbulb"></i> Ghi chú:</strong>
                            <ol style="margin-top: 10px; margin-left: 5px; margin-bottom: 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px;"><strong>Theo đuổi Chân lý & Tri thức gốc rễ (Logos):</strong> Luôn giữ cho bộ não khát khao học hỏi (Intellectually Curious), tư duy logic mạch lạc và không ngừng khám phá bản chất vận hành của thế giới.</li>
                                <li style="margin-bottom: 6px;"><strong>Rèn luyện Bản lĩnh & Đạo đức (Ethos / Egos):</strong> Giữ cho thể chất dẻo dai (Physically Strong), sống kỷ luật, tôn trọng các cam kết và giữ vững đạo đức chuẩn mực (Morally Straight).</li>
                                <li><strong>Thấu cảm & Phụng sự Xã hội (Pathos):</strong> Luôn tỉnh thức (Mentally Awake), sẵn sàng giúp đỡ mọi người và dùng tri thức để kiến tạo giá trị tốt đẹp cho cộng đồng.</li>
                            </ol>
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.9); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
                        <i class="fa-solid fa-compass"></i> Bức tranh Tổng thể về "Cùng Đích" theo Baden-Powell
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem; line-height: 1.6;">
                        
                        <div style="background: rgba(243, 244, 246, 0.8); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #3b82f6;">
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <strong style="width: 220px; color: #1e40af; flex-shrink: 0;">PHƯƠNG TIỆN (Means)</strong>
                                <span style="color: #64748b; margin-right: 10px; flex-shrink: 0;"><i class="fa-solid fa-arrow-right"></i></span>
                                <span>Kỹ năng, Hoạt động thực hành, Bài tập, Kỷ luật</span>
                            </div>
                            <div style="margin-left: 100px; color: #64748b; font-size: 0.85em; margin-bottom: 5px;">
                                <i class="fa-solid fa-arrow-down"></i> (Tôi luyện)
                            </div>
                            
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <strong style="width: 220px; color: #1e40af; flex-shrink: 0;">TÍNH KHÍ (Character)</strong>
                                <span style="color: #64748b; margin-right: 10px; flex-shrink: 0;"><i class="fa-solid fa-arrow-right"></i></span>
                                <span>Tự chủ, Bản lĩnh, Sự trung thực, Tinh thần trách nhiệm</span>
                            </div>
                            <div style="margin-left: 100px; color: #64748b; font-size: 0.85em; margin-bottom: 5px;">
                                <i class="fa-solid fa-arrow-down"></i> (Hướng tới)
                            </div>
                            
                            <div style="display: flex; align-items: center;">
                                <strong style="width: 220px; color: #1e40af; flex-shrink: 0;">CHỦ ĐÍCH / CÙNG ĐÍCH (The End)</strong>
                                <span style="color: #64748b; margin-right: 10px; flex-shrink: 0;"><i class="fa-solid fa-arrow-right"></i></span>
                                <strong style="color: #b91c1c;">PHỤNG SỰ & TẠO GIÁ TRỊ TỐT ĐẸP CHO XÃ HỘI</strong>
                            </div>
                        </div>

                        <ul style="margin-left: 15px; margin-bottom: 15px; list-style-type: none; padding-left: 0;">
                            <li style="margin-bottom: 8px;"><strong style="color: #1e40af;">Phương tiện (Means) <i class="fa-solid fa-arrow-right" style="color:#64748b; font-size:0.85em;"></i> Ground / Runway & 10,000 ft (Dự án):</strong><br>Điểm SAT 1500+, High School Credits, code Python, kiến thức Mechatronics... tất cả chỉ là phương tiện. Chúng không phải là "cùng đích" của cuộc đời.</li>
                            <li style="margin-bottom: 8px;"><strong style="color: #1e40af;">Tính khí (Character) <i class="fa-solid fa-arrow-right" style="color:#64748b; font-size:0.85em;"></i> 20,000 ft (Lĩnh vực) & Ethos (Bản lĩnh):</strong><br>Sự kỷ luật hoàn thành deadline, tinh thần tự học, danh tính Self-directed Scholar ... là tính khí, là chất thép bên trong được tôi luyện thông qua quá trình va đập với các phương tiện ở tầng dưới.</li>
                            <li style="margin-bottom: 8px;"><strong style="color: #1e40af;">Chủ đích / Cùng đích (Purpose / End) <i class="fa-solid fa-arrow-right" style="color:#64748b; font-size:0.85em;"></i> 40,000 & 50,000 ft (Tầm nhìn & Sứ mệnh / Pathos):</strong><br>Dùng tri thức liên môn để tháo dỡ, tái tạo và kiến tạo giá trị mới, giải quyết bài toán thực tế giúp xã hội tốt đẹp hơn. Bước vào Đại học tinh hoa (MIT) cũng chỉ là một phương tiện tầm cao để thực hiện cùng đích phụng sự đó.</li>
                        </ul>

                        <p style="margin-bottom: 15px; padding: 12px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; border-radius: 6px;">
                            <strong style="color: #b45309;">Tóm lại:</strong> Lời nhắc nhở của Baden-Powell giúp con bạn và hệ thống quản lý không rơi vào cái bẫy "nghiện phương tiện" (chạy theo điểm số, bằng cấp hay chứng chỉ). Điểm số hay kỹ năng chỉ là công cụ để rèn luyện Tính khí, và Tính khí đó được dùng để thực hiện Chủ đích tối thượng của con người: Là Phụng sự người khác và đạt được Hạnh phúc chân thật (Service & Happiness).
                        </p>

                        <div style="background: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 15px; border-left: 4px solid #10b981; font-style: italic;">
                            <p style="margin-bottom: 8px; font-weight: bold; color: #047857; font-style: normal;"><i class="fa-solid fa-quote-left"></i> Câu nói kinh điển của Baden-Powell về Cùng đích:</p>
                            <p style="margin-bottom: 8px; color: #065f46;">"Cách duy nhất để đạt được hạnh phúc là ban phát hạnh phúc cho người khác. Hãy cố gắng để lại thế giới này tốt đẹp hơn một chút so với khi bạn bước vào nó."</p>
                            <p style="margin-bottom: 0; color: #065f46; font-size: 0.9em;">(The real way to get happiness is by giving out happiness to other people. Try and leave this world a little better than you found it.)</p>
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #1d4ed8; font-size: 1.05rem;">
                        <i class="fa-solid fa-book-open"></i> Phân tích: DỰ ÁN HỌC THUẬT (ACADEMIC PROJECT)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 8px;"><strong>Bản chất:</strong> Đây là gói dự án đáp ứng tiêu chuẩn học thuật nền tảng và chuẩn hóa (Core Academic Standards & Standardized Testing).</p>
                        
                        <div style="margin-bottom: 15px; padding: 10px; background: rgba(59, 130, 246, 0.05); border-radius: 6px; border: 1px solid #bfdbfe;">
                            <p style="margin-bottom: 4px;"><strong><i class="fa-solid fa-crosshairs" style="color: #1d4ed8; width: 20px;"></i> Vai trò:</strong> Tiêu chuẩn nền tảng</p>
                            <p style="margin-bottom: 0;"><strong><i class="fa-solid fa-comment-dots" style="color: #1d4ed8; width: 20px;"></i> Thông điệp:</strong> <em>"Học sinh này có đủ tư duy cơ bản không?"</em> &rarr; <strong>Có.</strong></p>
                        </div>
                        
                        <p style="margin-bottom: 4px; font-weight: bold; color: #1e40af;">Tại sao cần:</p>
                        <p style="margin-bottom: 8px;">Hội đồng tuyển sinh đại học cần hai bằng chứng học thuật cốt lõi để bảo đảm "điều kiện cần":</p>
                        <ul style="margin-bottom: 15px; margin-left: 15px; list-style-type: square; color: #475569;">
                            <li style="margin-bottom: 4px;"><strong>Sức bền & Kiến thức phổ thông:</strong> Bằng tốt nghiệp THPT (High School Diploma) thông qua việc tích lũy đủ các tín chỉ (Credits) quy định.</li>
                            <li style="margin-bottom: 4px;"><strong>Thước đo khách quan:</strong> Điểm số kỳ thi chuẩn hóa (SAT/ACT) để chứng minh tư duy Toán học, Đọc hiểu và Phân tích đạt mặt bằng chung toàn cầu, xóa bỏ mối lo ngại về chất lượng giảng dạy tự do tại nhà.</li>
                        </ul>
                        
                        <div style="background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 12px; border-radius: 6px; margin-top: 5px;">
                            <p style="margin-bottom: 8px; font-weight: bold; color: #1d4ed8;"><i class="fa-solid fa-gears"></i> Cách vận hành (Tầng 10,000 ft):</p>
                            <p style="margin-bottom: 12px; color: #475569;">Dự án Học thuật này bao gồm 2 Sub-Projects (Dự án thành phần) chạy song song:</p>
                            
                            <strong style="color: #1e40af;">1. Sub-Project A: Hoàn thành Chương trình High School (20 Credits)</strong>
                            <ul style="margin-bottom: 12px; margin-top: 5px; margin-left: 15px; list-style-type: disc;">
                                <li style="margin-bottom: 4px;"><strong>Kết quả mong muốn (Outcome):</strong> Hoàn thành toàn bộ các môn học yêu cầu, đạt đủ 20 High School Credits và nhận Bằng Tốt nghiệp THPT chính thức trước tháng [Tháng/Năm].</li>
                                <li style="margin-bottom: 4px;"><strong>Hành động kế tiếp (Runway):</strong> 
                                    <ul style="margin-top: 4px; margin-bottom: 4px; list-style-type: circle; color: #475569;">
                                        <li>Rà soát bảng theo dõi tiến độ môn học (Credit Audit) để xác định các môn còn thiếu.</li>
                                        <li>Hoàn thành bài kiểm tra cuối chương môn Toán / Đọc 15 trang tài liệu Lịch sử chiều nay.</li>
                                    </ul>
                                </li>
                            </ul>

                            <strong style="color: #1e40af;">2. Sub-Project B: Ôn luyện & Thi SAT trong 4 tháng</strong>
                            <ul style="margin-bottom: 0; margin-top: 5px; margin-left: 15px; list-style-type: disc;">
                                <li style="margin-bottom: 4px;"><strong>Kết quả mong muốn (Outcome):</strong> Đạt điểm SAT mục tiêu (ví dụ: 1450+) và nhận phiếu điểm chính thức từ College Board trước đợt nộp hồ sơ.</li>
                                <li style="margin-bottom: 4px;"><strong>Hành động kế tiếp (Runway):</strong> 
                                    <ul style="margin-top: 4px; margin-bottom: 0; list-style-type: circle; color: #475569;">
                                        <li>Làm 1 bài thi thử SAT Diagnostic Test trên Bluebook để xác định mức điểm đầu vào.</li>
                                        <li>Mở Khan Academy và giải 20 câu Toán SAT thuộc phần Algebra lúc 15:00 hôm nay.</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #047857; font-size: 1.05rem;">
                        <i class="fa-solid fa-graduation-cap"></i> Phân tích: DỰ ÁN TÍN CHỈ (CREDIT PROJECT)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 8px;"><strong>Bản chất:</strong> Đây là dự án chứng minh khả năng học tập ở cấp độ đại học thực sự (Academic Rigor).</p>
                        
                        <div style="margin-bottom: 15px; padding: 10px; background: rgba(16, 185, 129, 0.05); border-radius: 6px; border: 1px solid #a7f3d0;">
                            <p style="margin-bottom: 4px;"><strong><i class="fa-solid fa-crosshairs" style="color: #047857; width: 20px;"></i> Vai trò:</strong> Sức bền học thuật</p>
                            <p style="margin-bottom: 0;"><strong><i class="fa-solid fa-comment-dots" style="color: #047857; width: 20px;"></i> Thông điệp:</strong> <em>"Học sinh này có chịu được áp lực đại học không?"</em> &rarr; <strong>Có.</strong></p>
                        </div>
                        
                        <p style="margin-bottom: 4px; font-weight: bold; color: #065f46;">Tại sao cần:</p>
                        <p style="margin-bottom: 15px;">Khác với điểm thi trắc nghiệm SAT, việc học và lấy 2 môn tín chỉ Đại học/Cao đẳng (ví dụ: Vi mô Kinh tế, Lập trình Python cơ bản, Tâm lý học nhập môn qua các nền tảng trực tuyến như ASU Universal Learner, edX, Coursera hoặc Cao đẳng cộng đồng) cho thấy học sinh có khả năng tự đọc tài liệu chuyên ngành, làm bài luận dài và vượt qua các bài thi khắt khe của giảng viên đại học.</p>
                        
                        <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 12px; border-radius: 6px; margin-top: 5px;">
                            <p style="margin-bottom: 8px; font-weight: bold; color: #047857;"><i class="fa-solid fa-gears"></i> Cách vận hành (Tầng 10,000 ft):</p>
                            
                            <ul style="margin-bottom: 0; margin-top: 5px; margin-left: 15px; list-style-type: disc;">
                                <li style="margin-bottom: 4px;"><strong>Kết quả mong muốn (Outcome):</strong> Hoàn thành 2 khóa học với điểm số A/B và có bảng điểm chính thức (Official Transcript).</li>
                                <li style="margin-bottom: 4px;"><strong>Hành động kế tiếp (Runway):</strong> 
                                    <ul style="margin-top: 4px; margin-bottom: 0; list-style-type: circle; color: #475569;">
                                        <li>Đăng ký tài khoản trên hệ thống trường ASU.</li>
                                        <li>Đọc chương 1 giáo trình Kinh tế học tối nay.</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #ddd6fe; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #6d28d9; font-size: 1.05rem;">
                        <i class="fa-solid fa-lightbulb"></i> Phân tích: DỰ ÁN DREAM MAP / SẢN PHẨM (PRODUCT PROJECT)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 8px;"><strong>Bản chất:</strong> Đây là dự án tạo nên "sự độc đáo và nét riêng" (Uniqueness / Standout Factor).</p>
                        
                        <div style="margin-bottom: 15px; padding: 10px; background: rgba(139, 92, 246, 0.05); border-radius: 6px; border: 1px solid #ddd6fe;">
                            <p style="margin-bottom: 4px;"><strong><i class="fa-solid fa-crosshairs" style="color: #6d28d9; width: 20px;"></i> Vai trò:</strong> Điểm nét riêng biệt</p>
                            <p style="margin-bottom: 0;"><strong><i class="fa-solid fa-comment-dots" style="color: #6d28d9; width: 20px;"></i> Thông điệp:</strong> <em>"Học sinh này có gì đặc biệt so với những người khác?"</em> &rarr; <strong>Rất độc đáo.</strong></p>
                        </div>
                        
                        <p style="margin-bottom: 4px; font-weight: bold; color: #5b21b6;">Tại sao cần:</p>
                        <p style="margin-bottom: 8px;">Hàng ngàn học sinh truyền thống đều có điểm SAT cao và bảng điểm đẹp, nhưng rất ít người sở hữu một sản phẩm thực tế do chính mình tạo ra từ đầu đến cuối. Một cuốn sách đã xuất bản, một ứng dụng di động đã có người dùng, hay một dự án/sự kiện cộng đồng đã quy tụ hàng trăm người chính là minh chứng sống động nhất cho tư duy chủ động, năng lực lãnh đạo và sự kiên trì.</p>
                        <p style="margin-bottom: 8px;">Đó là hồ sơ thể hiện cách một ứng viên tư duy khi đối mặt với một bài toán thực tế. Nhà tuyển dụng (hay Hội đồng tuyển sinh) không chỉ nhìn vào kết quả cuối cùng. Họ quan tâm đến toàn bộ quá trình:</p>
                        <ul style="margin-bottom: 8px; margin-left: 15px; list-style-type: square; color: #475569;">
                            <li style="margin-bottom: 4px;">Bạn tiếp cận vấn đề như thế nào?</li>
                            <li style="margin-bottom: 4px;">Bạn lựa chọn phương pháp ra sao?</li>
                            <li style="margin-bottom: 4px;">Bạn đánh đổi giữa độ chính xác và khả năng triển khai thế nào?</li>
                            <li style="margin-bottom: 4px;">Bạn giải thích kết quả cho người không có nền tảng kỹ thuật bằng cách nào?</li>
                        </ul>
                        <p style="margin-bottom: 15px;">Những yếu tố này gần như không thể hiện qua bảng điểm, nhưng lại thể hiện rất rõ thông qua các dự án cá nhân.</p>
                        
                        <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 6px; margin-top: 5px;">
                            <p style="margin-bottom: 8px; font-weight: bold; color: #6d28d9;"><i class="fa-solid fa-gears"></i> Cách vận hành (Tầng 10,000 ft):</p>
                            
                            <ul style="margin-bottom: 0; margin-top: 5px; margin-left: 15px; list-style-type: disc;">
                                <li style="margin-bottom: 4px;"><strong>Kết quả mong muốn (Outcome):</strong> Xuất bản ứng dụng lên Apple App Store / Đưa sách lên Amazon Kindle / Tổ chức xong buổi Workshop.</li>
                                <li style="margin-bottom: 4px;"><strong>Hành động kế tiếp (Runway):</strong> 
                                    <ul style="margin-top: 4px; margin-bottom: 0; list-style-type: circle; color: #475569;">
                                        <li>Viết 300 từ dàn ý cho chương 1.</li>
                                        <li>Thiết kế giao diện (wireframe) cho màn hình chính của ứng dụng.</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #fde68a; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #b45309; font-size: 1.05rem;">
                        <i class="fa-solid fa-folder-open"></i> Phân tích: DỰ ÁN HỒ SƠ (APPLICATION PACKAGE PROJECT)
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <p style="margin-bottom: 8px;"><strong>Bản chất:</strong> Đây là dự án "đóng gói và truyền thông" (Packaging & Storytelling) toàn bộ thành quả.</p>
                        
                        <div style="margin-bottom: 15px; padding: 10px; background: rgba(245, 158, 11, 0.05); border-radius: 6px; border: 1px solid #fde68a;">
                            <p style="margin-bottom: 4px;"><strong><i class="fa-solid fa-crosshairs" style="color: #b45309; width: 20px;"></i> Vai trò:</strong> Câu chuyện thương hiệu</p>
                            <p style="margin-bottom: 0;"><strong><i class="fa-solid fa-comment-dots" style="color: #b45309; width: 20px;"></i> Thông điệp:</strong> <em>"Học sinh này là ai và tại sao chúng tôi nên chọn?"</em> &rarr; <strong>Rõ ràng, truyền cảm hứng.</strong></p>
                        </div>
                        
                        <p style="margin-bottom: 4px; font-weight: bold; color: #92400e;">Tại sao cần:</p>
                        <p style="margin-bottom: 8px;">Dù có điểm thi tốt, học xong tín chỉ và làm ra sản phẩm hay, nếu không biết gom lại và kể thành một câu chuyện cá nhân (Narrative) hấp dẫn thì hồ sơ vẫn mờ nhạt. Đây là dự án ở tầng 10,000 ft (Project) nhằm tập hợp toàn bộ thành tựu, sản phẩm và câu chuyện trưởng thành của con thành một bộ hồ sơ ứng tuyển hoàn chỉnh (Application Package) gửi đến các trường Đại học.</p>
                        <p style="margin-bottom: 8px;">Dự án này gồm 2 thành tố chính:</p>
                        
                        <strong style="color: #b45309;">A. Portfolio (Hồ sơ năng lực thực tế)</strong>
                        <p style="margin-bottom: 4px; color: #475569;">Thay vì chỉ đưa ra một bảng điểm số khô khan, Portfolio là một tập tài liệu (dạng file PDF, trang web cá nhân, hoặc video) minh chứng cho những gì con đã thực sự làm và tạo ra:</p>
                        <ul style="margin-bottom: 12px; margin-left: 15px; list-style-type: square; color: #475569;">
                            <li style="margin-bottom: 4px;"><strong>Các sản phẩm từ Dream Map / Micro-Projects:</strong> Cuốn sách con đã viết, ứng dụng/game con đã code, kênh nghiên cứu, dự án cộng đồng con từng tổ chức, tranh ảnh/thiết kế con đã sáng tác...</li>
                            <li style="margin-bottom: 4px;"><strong>Danh mục tự học (Reading/Course List):</strong> Danh sách các cuốn sách chuyên sâu con đã đọc, các khóa học online (Coursera, edX...) con đã hoàn thành.</li>
                            <li style="margin-bottom: 4px;"><strong>Minh chứng hoạt động:</strong> Hình ảnh, đường link sản phẩm, giấy chứng nhận, thư nhận xét từ người cố vấn (Mentors).</li>
                        </ul>

                        <strong style="color: #b45309;">B. Personal Essay / Statement (Bài luận cá nhân)</strong>
                        <p style="margin-bottom: 4px; color: #475569;">Đây là bài viết (thường từ 500–650 từ) để con cất lên tiếng nói và góc nhìn của riêng mình:</p>
                        <ul style="margin-bottom: 15px; margin-left: 15px; list-style-type: square; color: #475569;">
                            <li style="margin-bottom: 4px;"><strong>Nội dung:</strong> Con kể lại hành trình tự học của mình—tại sao con chọn con đường này, con đã gặp khó khăn gì khi thực hiện các dự án trong Dream Map, con đã vượt qua ra sao và điều đó định hình nên con người con như thế nào.</li>
                            <li style="margin-bottom: 4px;"><strong>Vai trò:</strong> Bài luận giúp hội đồng tuyển sinh thấy được tính cách, sự trưởng thành, tư duy độc lập và niềm đam mê học tập của con—những điều mà điểm số hay tín chỉ không thể hiện hết được.</li>
                        </ul>
                        
                        <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin-top: 5px;">
                            <p style="margin-bottom: 8px; font-weight: bold; color: #b45309;"><i class="fa-solid fa-gears"></i> Cách vận hành (Tầng 10,000 ft):</p>
                            
                            <ul style="margin-bottom: 0; margin-top: 5px; margin-left: 15px; list-style-type: disc;">
                                <li style="margin-bottom: 4px;"><strong>Kết quả mong muốn (Outcome):</strong> Nộp hoàn tất bộ hồ sơ ứng tuyển (Common App) lên hệ thống của các trường Đại học trước hạn chót.</li>
                                <li style="margin-bottom: 4px;"><strong>Hành động kế tiếp (Runway):</strong> 
                                    <ul style="margin-top: 4px; margin-bottom: 0; list-style-type: circle; color: #475569;">
                                        <li>Lập file Google Drive gom tất cả hình ảnh/chứng nhận dự án.</li>
                                        <li>Viết 200 từ nháp đầu tiên cho bài luận cá nhân.</li>
                                        <li>Xin Thư giới thiệu của người cố vấn.</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </details>

                <details style="margin-top: 15px; background: rgba(255,255,255,0.8); border: 1px solid #f87171; border-radius: 8px; padding: 10px 15px;">
                    <summary style="font-weight: bold; cursor: pointer; color: #b91c1c; font-size: 1.05rem;">
                        <i class="fa-solid fa-star"></i> Phân tích: CÁC TIÊU CHÍ TUYỂN SINH CỐT LÕI
                    </summary>
                    <div style="margin-top: 15px; font-size: 0.95rem;">
                        <div style="margin-bottom: 12px;">
                            <strong style="color: #b91c1c;">Intellectual Vitality</strong> là tò mò trí tuệ tự thân (Self-directed Curiosity). Nhà tuyển sinh không chỉ tìm học sinh biết làm bài thi, mà tìm người thật sự yêu thích việc học. Đối với người tự học, điều này thể hiện qua việc bạn tự đọc những cuốn sách khó, tự đăng ký các khóa học online chuyên sâu, hoặc theo đuổi một chủ đề nghiên cứu đến cùng mà không ai bắt buộc.
                            <br><em style="color: #475569;">Biểu hiện thực tế: Danh mục sách chuyên sâu đã đọc (Reading List), các chứng chỉ khóa học trực tuyến/tín chỉ cao đẳng (College Credits), bài nghiên cứu cá nhân.</em>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <strong style="color: #b91c1c;">Leadership & Initiative</strong> không nhất thiết phải là làm Lớp trưởng hay Chủ tịch câu lạc bộ trường lớp. Lãnh đạo chính là Sự chủ động (Initiative)—khả năng tự biến một ý tưởng trong đầu thành một dự án ngoài đời thực, tự kết nối mọi người và tự chịu trách nhiệm về kết quả.
                            <br><em style="color: #475569;">Biểu hiện thực tế: Tự tổ chức một sự kiện cộng đồng, thành lập một nhóm học tập/sở thích, khởi xướng một chiến dịch xã hội, hoặc điều hành một mô hình kinh doanh nhỏ (Micro-business).</em>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <strong style="color: #b91c1c;">Logic & Quantitative Reasoning</strong> là khả năng suy luận logic, giải quyết bài toán phức tạp và tư duy dựa trên dữ liệu. Đây là kỹ năng cốt lõi giúp học sinh tự học xóa tan nghi ngờ của xã hội về việc "học ở nhà thì thiếu tư duy khoa học".
                            <br><em style="color: #475569;">Biểu hiện thực tế: Kết quả phần thi Toán/Đọc hiểu phân tích trong kỳ thi SAT, khả năng lập trình phần mềm, làm nghiên cứu khoa học, hoặc quản lý tài chính/dữ liệu thực tế cho dự án cá nhân.</em>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <strong style="color: #b91c1c;">Academic Background / Foundation</strong> vững chắc, đạt tiêu chuẩn mặt bằng chung để không bị tụt hậu khi bước vào môi trường đại học. Đây chính là "điều kiện cần".
                            <br><em style="color: #475569;">Biểu hiện thực tế: Việc hoàn thành chương trình Cấp 3 (tích lũy đủ High School Credits), điểm số các kỳ thi chuẩn hóa (SAT/ACT) và các điểm số môn học nền tảng (Toán, Khoa học, Ngữ văn).</em>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <strong style="color: #b91c1c;">Deadlines & Grade Performance</strong> là "bằng chứng thép" về sự trưởng thành, tính kỷ luật và tinh thần trách nhiệm.
                            <br><em style="color: #475569;">Biểu hiện thực tế:<br>
                            - <strong>Deadlines:</strong> Hoàn thành các môn học/tín chỉ đúng thời hạn cam kết; nộp các dự án, bài luận, hồ sơ đúng hạn chót mà không cần ai nhắc nhở.<br>
                            - <strong>Grade Standards:</strong> Không chỉ "học cho biết", mà đạt điểm số cao (Điểm A/B ở các lớp Cao đẳng Cộng đồng, điểm SAT thuộc top %, GPA chuẩn mực). Điểm số chính là kết quả đo lường sự nghiêm túc đối với cam kết của bản thân.</em>
                        </div>
                    </div>
                </details>
            </div>
        `
    },
    'portfolio': {
        title: 'DA Hồ sơ',
        desc: '',
        icon: 'fa-briefcase',
        color: '#f59e0b',
        defaultWorkCat: 'Vision',
        defaultSysCat: 'N/A',
        guide: `
            <div class="tab-guide-content">
                <h4><i class="fa-solid fa-briefcase"></i> DA Hồ sơ</h4>
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(245, 158, 11, 0.1); border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 0.95rem; line-height: 1.5;">
                    <ul style="margin: 0; padding-left: 20px; list-style-type: square; color: #334155;">
                        <li style="margin-bottom: 8px;">Lập file Google Drive gom tất cả hình ảnh/chứng nhận dự án.</li>
                        <li style="margin-bottom: 8px;">Viết 200 từ nháp đầu tiên cho bài luận cá nhân.</li>
                        <li style="margin-bottom: 0;">Xin Thư giới thiệu của người cố vấn.</li>
                    </ul>
                </div>
            </div>
        `
    },
    'unplanned': { title: 'Đột Xuất', desc: 'Những việc bất ngờ nhảy vào! Làm ngay.', icon: 'fa-bolt', color: 'var(--warning-color)', defaultWorkCat: 'Unplanned Work', defaultSysCat: 'Next Actions' },
    'predefined': { title: 'Định Trước', desc: 'Những việc đã lên kế hoạch!', icon: 'fa-bullseye', color: 'var(--success-color)', defaultWorkCat: 'Pre-defined Work', defaultSysCat: 'Next Actions' },
    'defining': { title: 'Định Hình', desc: 'Ghi chép ý tưởng, dọn dẹp hòm thư.', icon: 'fa-box-archive', color: '#6366f1', defaultWorkCat: 'Defining Work', defaultSysCat: 'Inbox (Stuff)' }
};

// --- Khởi động ứng dụng ---
document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    await loadData();
    updateHeader();
    window.renderTasks();
    updateStarsUI();
});

// --- Quản lý Tab ---
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentActiveTab = btn.getAttribute('data-tab');
            updateHeader();
            window.renderTasks();
        });
    });
}

function updateHeader() {
    const conf = tabConfigs[currentActiveTab];
    headerTitle.innerHTML = `<i class="fa-solid ${conf.icon}" style="color: ${conf.color}"></i> ${conf.title}`;
    headerDesc.textContent = conf.desc;
    
    const guideEl = document.getElementById('tab-guide');
    if (guideEl) {
        if (conf.guide) {
            guideEl.innerHTML = conf.guide;
            guideEl.style.display = 'block';
        } else {
            guideEl.style.display = 'none';
        }
    }

    // Ẩn form nhập và danh sách công việc nếu là tab Tầm Nhìn hoặc tab Kat
    const quickAddForm = document.getElementById('quick-add-form');
    const masterList = document.getElementById('master-task-list');
    const listControls = document.getElementById('list-controls');
    if (currentActiveTab === 'vision' || currentActiveTab === 'kat' || currentActiveTab === 'dream' || currentActiveTab === 'prinberk' || currentActiveTab === 'portfolio' || currentActiveTab === 'scm' || currentActiveTab === 'homeconomie') {
        if (quickAddForm) quickAddForm.style.display = 'none';
        if (masterList) masterList.style.display = 'none';
        if (listControls) listControls.style.display = 'none';
    } else {
        if (quickAddForm) quickAddForm.style.display = 'flex';
        if (masterList) masterList.style.display = '';
        if (listControls) listControls.style.display = 'flex';
    }

    const stratDropdown = document.getElementById('quick-add-strategy-type');
    if (stratDropdown) {
        stratDropdown.style.display = 'none';
    }

    // Đổi placeholder input
    quickAddInput.placeholder = `Nhập ${conf.title.toLowerCase()} mới...`;
}

window.promptForApiKey = function() {
    let key = prompt("Vui lòng nhập mật khẩu API để khởi động kết nối Database:");
    if (key) {
        localStorage.setItem('app_api_key', key);
        
        if (state && state.tasks && state.tasks.length > 0) {
            alert("Đã lưu mật khẩu! Dữ liệu cũ trong máy của bạn đang được đẩy lên Cloudflare...");
            saveData();
        } else {
            alert("Đã lưu mật khẩu! Hệ thống sẽ tải dữ liệu từ Cloudflare.");
            loadData();
        }
    }
}

function getApiKey() {
    return localStorage.getItem('app_api_key') || '';
}

// --- Dữ liệu (Cloudflare + LocalStorage Fallback) ---
async function loadData() {
    const localData = localStorage.getItem('timeManagementStatePro');
    if (localData) {
        state = JSON.parse(localData);
    } else {
        // Thử migrate từ bản cũ nếu có
        const oldData = localStorage.getItem('timeManagementState');
        if (oldData) {
            const parsed = JSON.parse(oldData);
            state.stars = parsed.stars || 0;
            if (parsed.tasks && !Array.isArray(parsed.tasks)) {
                // Chuyển object tasks thành flat array
                for (let key in parsed.tasks) {
                    parsed.tasks[key].forEach(t => {
                        t.workCategory = tabConfigs[key]?.defaultWorkCat || 'Pre-defined Work';
                        t.systemCategory = tabConfigs[key]?.defaultSysCat || 'Next Actions';
                        t.context = ''; t.time = ''; t.energy = ''; t.projectRef = '';
                        state.tasks.push(t);
                    });
                }
            }
            saveToLocal();
        }
    }

    const apiKey = getApiKey();
    if (CLOUDFLARE_API_URL && apiKey) {
        setSyncStatus('syncing');
        try {
            const response = await fetch(`${CLOUDFLARE_API_URL}/data`, {
                headers: { 'x-api-key': apiKey }
            });
            
            if (response.status === 401) {
                alert("Sai mật khẩu API! Vui lòng tải lại trang và nhập lại.");
                localStorage.removeItem('app_api_key');
                setSyncStatus('error');
                return;
            }
            
            if (response.ok) {
                const cloudData = await response.json();
                if (cloudData && Array.isArray(cloudData.tasks)) {
                    state = cloudData;
                    saveToLocal();
                }
                setSyncStatus('synced');
            } else {
                setSyncStatus('error');
            }
        } catch (error) {
            console.error('Lỗi khi load từ Cloudflare:', error);
            setSyncStatus('error');
        }
    } else {
        syncStatusEl.style.display = 'none';
    }
}

async function saveData() {
    saveToLocal();
    const apiKey = getApiKey();
    if (CLOUDFLARE_API_URL && apiKey) {
        setSyncStatus('syncing');
        try {
            const response = await fetch(`${CLOUDFLARE_API_URL}/data`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify(state)
            });
            
            if (response.status === 401) {
                alert("Sai mật khẩu API khi lưu dữ liệu! Vui lòng tải lại trang.");
                localStorage.removeItem('app_api_key');
                setSyncStatus('error');
                return;
            }
            
            if (response.ok) {
                setSyncStatus('synced');
            } else {
                setSyncStatus('error');
            }
        } catch (error) {
            console.error('Lỗi khi lưu lên Cloudflare:', error);
            setSyncStatus('error');
        }
    }
}

function saveToLocal() {
    localStorage.setItem('timeManagementStatePro', JSON.stringify(state));
}

function setSyncStatus(status) {
    syncStatusEl.style.display = 'flex';
    syncStatusEl.className = 'sync-status ' + status;
    const appTitle = document.getElementById('app-title');
    
    if (status === 'synced') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-check"></i>';
        syncStatusEl.title = 'Đã đồng bộ';
        if (appTitle) appTitle.classList.add('db-connected');
    } else if (status === 'syncing') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        syncStatusEl.title = 'Đang đồng bộ...';
        if (appTitle) appTitle.classList.remove('db-connected');
    } else {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-xmark"></i>';
        syncStatusEl.title = 'Lỗi đồng bộ';
        if (appTitle) appTitle.classList.remove('db-connected');
    }
}

// --- Quick Add Task ---
window.handleQuickAdd = async function(event) {
    event.preventDefault();
    const input = document.getElementById('quick-add-input');
    const text = input.value.trim();
    if (!text) return;

    const conf = tabConfigs[currentActiveTab];
    const strategyDropdown = document.getElementById('quick-add-strategy-type');
    const workCat = conf.defaultWorkCat;

    const newTask = {
        id: 't-' + Date.now(),
        text: text,
        done: false,
        workCategory: workCat,
        systemCategory: conf.defaultSysCat,
        context: "",
        time: "",
        energy: "",
        taskGroup: "Maintenance",
        area: "",
        projectRef: "",
        goalRef: "",
        visionRef: "",
        missionRef: "",
        createdAt: new Date().toISOString()
    };

    state.tasks.unshift(newTask);
    quickAddInput.value = '';
    
    window.renderTasks();
    await saveData();
};

window.toggleTask = async function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasDone = task.done;
    task.done = !task.done;

    if (task.workCategory === 'Pre-defined Work' && !wasDone && task.done) {
        awardStar();
    }
    
    window.renderTasks();
    await saveData();
};

window.deleteTask = async function(taskId) {
    if (confirm("Bạn có chắc chắn muốn xóa công việc này không?")) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        window.renderTasks();
        await saveData();
    }
};

// --- Modal Chỉnh sửa chi tiết ---
window.populateStrategicDropdowns = function() {
    const projectSelect = document.getElementById('modal-task-project');
    const goalSelect = document.getElementById('modal-task-goal');
    const visionSelect = document.getElementById('modal-task-vision');
    const missionSelect = document.getElementById('modal-task-mission');
    
    const genOptions = (category) => {
        const tasks = state.tasks.filter(t => t.workCategory === category);
        return '<option value="">-- Không có --</option>' + 
               tasks.map(t => `<option value="${escapeHTML(t.text)}">${escapeHTML(t.text)}</option>`).join('');
    };

    if (projectSelect) projectSelect.innerHTML = genOptions('Project');
    if (goalSelect) goalSelect.innerHTML = genOptions('Goal');
    if (visionSelect) visionSelect.innerHTML = genOptions('Vision');
    if (missionSelect) missionSelect.innerHTML = genOptions('Mission');
};

window.handleWorkCatChange = function() {
    window.toggleGroupFields();
};

window.openTaskModal = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    window.populateStrategicDropdowns();

    document.getElementById('modal-task-id').value = task.id;
    document.getElementById('modal-task-name').value = task.text;
    
    const isStrategicItem = ['Project', 'Goal', 'Vision', 'Mission'].includes(task.workCategory);
    
    if (isStrategicItem) {
        document.getElementById('workcat-container').style.display = 'none';
        document.getElementById('strategy-type-container').style.display = 'block';
        document.getElementById('modal-task-strategy-type').value = task.workCategory;
        document.getElementById('modal-task-group').value = 'Strategic';
        if (document.getElementById('action-details-row')) document.getElementById('action-details-row').style.display = 'none';
        if (document.getElementById('syscat-container')) document.getElementById('syscat-container').style.display = 'none';
        if (document.getElementById('group-container')) document.getElementById('group-container').style.display = 'none';
    } else {
        document.getElementById('workcat-container').style.display = 'block';
        document.getElementById('strategy-type-container').style.display = 'none';
        document.getElementById('modal-task-workcat').value = task.workCategory;
        document.getElementById('modal-task-group').value = task.taskGroup || "Maintenance";
        if (document.getElementById('action-details-row')) document.getElementById('action-details-row').style.display = 'flex';
        if (document.getElementById('syscat-container')) document.getElementById('syscat-container').style.display = 'block';
        if (document.getElementById('group-container')) document.getElementById('group-container').style.display = 'block';
    }

    document.getElementById('modal-task-syscat').value = task.systemCategory;
    document.getElementById('modal-task-context').value = task.context || "";
    document.getElementById('modal-task-time').value = task.time || "";
    document.getElementById('modal-task-energy').value = task.energy || "";
    document.getElementById('modal-task-area').value = task.area || "";
    document.getElementById('modal-task-project').value = task.projectRef || "";
    document.getElementById('modal-task-goal').value = task.goalRef || "";
    document.getElementById('modal-task-vision').value = task.visionRef || "";
    document.getElementById('modal-task-mission').value = task.missionRef || "";
    
    // Set Archive button text
    const archiveBtn = document.getElementById('btn-archive-task');
    if (task.archived) {
        archiveBtn.innerHTML = '<i class="fa-solid fa-box-open"></i> Bỏ lưu trữ';
        archiveBtn.style.background = '#3b82f6';
    } else {
        archiveBtn.innerHTML = '<i class="fa-solid fa-box-archive"></i> Lưu trữ';
        archiveBtn.style.background = '#64748b';
    }


    window.toggleGroupFields();
    taskModal.classList.add('show');
};

window.toggleGroupFields = function() {
    const groupSelect = document.getElementById('modal-task-group').value;
    const isStrategicContainerVisible = document.getElementById('strategy-type-container').style.display === 'block';
    
    document.getElementById('strategic-fields').style.display = groupSelect === 'Strategic' ? 'block' : 'none';

    if (groupSelect === 'Strategic') {
        const type = isStrategicContainerVisible ? document.getElementById('modal-task-strategy-type').value : 'NormalAction';
        
        document.getElementById('field-project').style.display = type === 'NormalAction' ? 'block' : 'none';
        document.getElementById('field-goal').style.display = (type === 'Project') ? 'block' : 'none';
        document.getElementById('field-vision').style.display = (type === 'Project' || type === 'Goal') ? 'block' : 'none';
        document.getElementById('field-mission').style.display = (type === 'Project' || type === 'Goal' || type === 'Vision') ? 'block' : 'none';
    }
};

window.closeTaskModal = function() {
    taskModal.classList.remove('show');
};

window.saveTaskDetails = async function() {
    const id = document.getElementById('modal-task-id').value;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.text = document.getElementById('modal-task-name').value;
    
    const isStrategicContainerVisible = document.getElementById('strategy-type-container').style.display === 'block';
    task.workCategory = isStrategicContainerVisible 
        ? document.getElementById('modal-task-strategy-type').value 
        : document.getElementById('modal-task-workcat').value;

    task.systemCategory = document.getElementById('modal-task-syscat').value;
    task.context = document.getElementById('modal-task-context').value;
    task.time = document.getElementById('modal-task-time').value;
    task.energy = document.getElementById('modal-task-energy').value;
    task.taskGroup = document.getElementById('modal-task-group').value;
    task.area = document.getElementById('modal-task-area').value;
    task.projectRef = document.getElementById('modal-task-project').value;
    task.goalRef = document.getElementById('modal-task-goal').value;
    task.visionRef = document.getElementById('modal-task-vision').value;
    task.missionRef = document.getElementById('modal-task-mission').value;

    if (task.taskGroup === 'Maintenance') {
        task.projectRef = "";
        task.goalRef = "";
        task.visionRef = "";
        task.missionRef = "";
    }

    // Logic: Nếu thêm Context/Time mà đang ở Defining -> Tự động chuyển qua Pre-defined
    if (task.workCategory === 'Defining Work' && (task.context || task.time)) {
        task.workCategory = 'Pre-defined Work';
        if (task.systemCategory === 'Inbox (Stuff)') {
            task.systemCategory = 'Next Actions';
        }
    }

    closeTaskModal();
    window.renderTasks();
    await saveData();
};

// --- Filters & Render ---

window.showArchived = false;
window.toggleShowArchive = function(checked) {
    window.showArchived = checked;
    window.renderTasks();
};

window.toggleArchiveTask = async function() {
    const taskId = document.getElementById('modal-task-id').value;
    if (!taskId) return;
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.archived = !task.archived;
        closeTaskModal();
        window.renderTasks();
        await saveData();
    }
};


window.findSiblingsInTree = function(tree, taskId) {
    for (let i = 0; i < tree.length; i++) {
        if (tree[i].id === taskId) {
            return { siblings: tree, index: i };
        }
        if (tree[i].children && tree[i].children.length > 0) {
            const res = window.findSiblingsInTree(tree[i].children, taskId);
            if (res) return res;
        }
    }
    return null;
};

window.swapTasksInState = async function(taskId1, taskId2) {
    const idx1 = state.tasks.findIndex(t => t.id === taskId1);
    const idx2 = state.tasks.findIndex(t => t.id === taskId2);
    if (idx1 !== -1 && idx2 !== -1) {
        const temp = state.tasks[idx1];
        state.tasks[idx1] = state.tasks[idx2];
        state.tasks[idx2] = temp;
        window.renderTasks();
        await saveData();
    }
};

window.moveTaskUp = function(taskId) {
    let currentFiltered = state.tasks;
    if (currentActiveTab !== 'action') {
        const conf = tabConfigs[currentActiveTab];
        currentFiltered = currentFiltered.filter(t => t.workCategory === conf.defaultWorkCat);
    }
    if (!window.showArchived) {
        currentFiltered = currentFiltered.filter(t => !t.archived);
    }

    const tree = buildTaskTree(currentFiltered);
    const info = window.findSiblingsInTree(tree, taskId);
    if (info && info.index > 0) {
        const siblingId = info.siblings[info.index - 1].id;
        window.swapTasksInState(taskId, siblingId);
    }
};

window.moveTaskDown = function(taskId) {
    let currentFiltered = state.tasks;
    if (currentActiveTab !== 'action') {
        const conf = tabConfigs[currentActiveTab];
        currentFiltered = currentFiltered.filter(t => t.workCategory === conf.defaultWorkCat);
    }
    if (!window.showArchived) {
        currentFiltered = currentFiltered.filter(t => !t.archived);
    }

    const tree = buildTaskTree(currentFiltered);
    const info = window.findSiblingsInTree(tree, taskId);
    if (info && info.index < info.siblings.length - 1) {
        const siblingId = info.siblings[info.index + 1].id;
        window.swapTasksInState(taskId, siblingId);
    }
};

window.collapsedTasks = new Set();
window.toggleTaskExpand = function(taskId) {
    if (window.collapsedTasks.has(taskId)) {
        window.collapsedTasks.delete(taskId);
    } else {
        window.collapsedTasks.add(taskId);
    }
    window.renderTasks();
};

function buildTaskTree(filteredTasks) {
    const taskMap = new Map();
    const roots = [];

    // Initialize map
    filteredTasks.forEach(task => {
        taskMap.set(task.text.trim(), { ...task, children: [] });
    });

    // Build tree
    filteredTasks.forEach(task => {
        const node = taskMap.get(task.text.trim());
        
        let parentNode = null;
        if (task.projectRef && taskMap.has(task.projectRef.trim())) {
            parentNode = taskMap.get(task.projectRef.trim());
        } else if (task.goalRef && taskMap.has(task.goalRef.trim())) {
            parentNode = taskMap.get(task.goalRef.trim());
        } else if (task.visionRef && taskMap.has(task.visionRef.trim())) {
            parentNode = taskMap.get(task.visionRef.trim());
        } else if (task.missionRef && taskMap.has(task.missionRef.trim())) {
            parentNode = taskMap.get(task.missionRef.trim());
        }

        if (parentNode && parentNode.text.trim() !== task.text.trim()) { // prevent self-reference
            parentNode.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

function renderTaskNode(node) {
    const hasChildren = node.children && node.children.length > 0;
    // Default expanded
    const isExpanded = !window.collapsedTasks.has(node.id);
    const archivedTag = node.archived ? `<span class="tag tag-sys" style="background:#cbd5e1;color:#334155;"><i class="fa-solid fa-box-archive"></i> Đã lưu trữ</span>` : '';
 
    
    let tagsHTML = '';
    if (['Project', 'Goal', 'Vision', 'Mission'].includes(node.workCategory)) {
        tagsHTML += node.workCategory === 'Project' ? `<span class="tag tag-sys" style="background:#e0f2fe;color:#0369a1;"><i class="fa-solid fa-rocket"></i> Dự án</span>` : '';
        tagsHTML += node.workCategory === 'Goal' ? `<span class="tag tag-sys" style="background:#ffedd5;color:#c2410c;"><i class="fa-solid fa-bullseye"></i> Mục tiêu</span>` : '';
        tagsHTML += node.workCategory === 'Vision' ? `<span class="tag tag-sys" style="background:#fef08a;color:#854d0e;"><i class="fa-solid fa-eye"></i> Tầm nhìn</span>` : '';
        tagsHTML += node.workCategory === 'Mission' ? `<span class="tag tag-sys" style="background:#fee2e2;color:#b91c1c;"><i class="fa-solid fa-fire"></i> Sứ mệnh</span>` : '';
    } else if (node.taskGroup) {
        tagsHTML += `<span class="tag tag-sys" style="background:#dcfce3;color:#166534;"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(node.taskGroup)}</span>`;
    }
    
    tagsHTML += archivedTag;
    if (node.area) tagsHTML += `<span class="tag tag-sys" style="background:#f3e8ff;color:#6b21a8;">${escapeHTML(node.area)}</span>`;
    if (node.systemCategory && node.systemCategory !== 'N/A' && !['Project', 'Goal', 'Vision', 'Mission'].includes(node.workCategory)) {
        tagsHTML += `<span class="tag tag-sys">${escapeHTML(node.systemCategory)}</span>`;
    }
    
    if (node.projectRef) tagsHTML += `<span class="tag tag-sys" style="background:#e0f2fe;color:#0369a1;"><i class="fa-solid fa-rocket"></i> DA: ${escapeHTML(node.projectRef)}</span>`;
    if (node.goalRef) tagsHTML += `<span class="tag tag-sys" style="background:#ffedd5;color:#c2410c;"><i class="fa-solid fa-bullseye"></i> MT: ${escapeHTML(node.goalRef)}</span>`;
    if (node.visionRef) tagsHTML += `<span class="tag tag-sys" style="background:#fef08a;color:#854d0e;"><i class="fa-solid fa-eye"></i> TN: ${escapeHTML(node.visionRef)}</span>`;
    if (node.missionRef) tagsHTML += `<span class="tag tag-sys" style="background:#fee2e2;color:#b91c1c;"><i class="fa-solid fa-fire"></i> SM: ${escapeHTML(node.missionRef)}</span>`;
    
    if (node.context && !['Project', 'Goal', 'Vision', 'Mission'].includes(node.workCategory)) {
        tagsHTML += `<span class="tag tag-context">${escapeHTML(node.context)}</span>`;
    }
    if (node.time && !['Project', 'Goal', 'Vision', 'Mission'].includes(node.workCategory)) {
        tagsHTML += `<span class="tag tag-time"><i class="fa-regular fa-clock"></i> ${escapeHTML(node.time)}</span>`;
    }
    if (node.energy && !['Project', 'Goal', 'Vision', 'Mission'].includes(node.workCategory)) {
        tagsHTML += `<span class="tag tag-energy"><i class="fa-solid fa-bolt"></i> ${escapeHTML(node.energy)}</span>`;
    }
    
    let html = `
    <div class="task-node">
        <div class="task-item ${node.done ? 'done' : ''} ${node.archived ? 'archived' : ''}">
            <div class="task-main">
                <div class="task-info-wrapper">
                    ${hasChildren ? `
                        <button class="task-expand-btn" onclick="toggleTaskExpand('${node.id}')" title="Thu/Phóng">
                            <i class="fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
                        </button>
                    ` : '<div style="width: 24px; margin-right: 8px;"></div>'}
                    <div class="task-info">
                        <div class="checkbox" onclick="toggleTask('${node.id}')">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <span class="task-text">${escapeHTML(node.text)}</span>
                    </div>
                </div>
                <div class="task-actions" style="display: flex; gap: 4px; align-items: center;">
                    <button class="btn-move" onclick="moveTaskUp('${node.id}')" title="Lên"><i class="fa-solid fa-arrow-up"></i></button>
                    <button class="btn-move" onclick="moveTaskDown('${node.id}')" title="Xuống"><i class="fa-solid fa-arrow-down"></i></button>
                    <button class="btn-details" onclick="openTaskModal('${node.id}')" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                    <button class="delete-btn" onclick="deleteTask('${node.id}')" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            <div class="task-tags" style="${hasChildren ? 'margin-left: 32px;' : 'margin-left: 32px;'}">
                ${tagsHTML}
            </div>
        </div>
        ${hasChildren ? `
            <div class="task-children ${isExpanded ? '' : 'hidden'}">
                ${node.children.map(child => renderTaskNode(child)).join('')}
            </div>
        ` : ''}
    </div>
    `;
    return html;
}

window.renderTasks = function() {
    const conf = tabConfigs[currentActiveTab];
    const expectedWorkCat = conf.defaultWorkCat;

    // Lọc theo Tab (Nếu không phải tab Hành Động)
    let filteredTasks = state.tasks;
    if (currentActiveTab !== 'action') {
        filteredTasks = filteredTasks.filter(t => t.workCategory === expectedWorkCat);
    }

    // Archive filtering
    if (!window.showArchived) {
        filteredTasks = filteredTasks.filter(t => !t.archived);
    }


    if (filteredTasks.length === 0) {
        masterListEl.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-style:italic; padding:20px 0;">Không có công việc nào khớp với điều kiện lọc!</p>';
        return;
    }

    if (currentActiveTab === 'action') {
        // Render dạng bảng Excel
        masterListEl.innerHTML = `
            <div class="table-responsive">
                <table class="excel-table">
                    <thead>
                        <tr>
                            <th>Xong</th>
                            <th>Tên Hành Động</th>
                            <th>Nhóm</th>
                            <th>Lĩnh Vực</th>
                            <th>Bối Cảnh</th>
                            <th>Thời Gian</th>
                            <th>Năng Lượng</th>
                            <th>Phân Loại CV</th>
                            <th>Hệ Thống</th>
                            <th>Dự Án</th>
                            <th>Mục Tiêu</th>
                            <th>Tầm Nhìn</th>
                            <th>Sứ Mệnh</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredTasks.map(task => `
                            <tr class="${task.done ? 'done' : ''} ${task.archived ? 'archived' : ''}">
                                <td class="checkbox-cell">
                                    <div class="checkbox" style="margin:0 auto;" onclick="toggleTask('${task.id}')">
                                        <i class="fa-solid fa-check"></i>
                                    </div>
                                </td>
                                <td><strong>${escapeHTML(task.text)}</strong></td>
                                <td>${escapeHTML(task.taskGroup || 'Maintenance')}</td>
                                <td>${escapeHTML(task.area || '')}</td>
                                <td>${escapeHTML(task.context || '')}</td>
                                <td>${escapeHTML(task.time || '')}</td>
                                <td>${escapeHTML(task.energy || '')}</td>
                                <td>${escapeHTML(task.workCategory)}</td>
                                <td>${escapeHTML(task.systemCategory)}</td>
                                <td>${escapeHTML(task.projectRef || '')}</td>
                                <td>${escapeHTML(task.goalRef || '')}</td>
                                <td>${escapeHTML(task.visionRef || '')}</td>
                                <td>${escapeHTML(task.missionRef || '')}</td>
                                <td class="actions-cell">
                                    <button class="btn-details" onclick="openTaskModal('${task.id}')" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                                    <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else {
        // Render dạng Card chuẩn với cấu trúc cây
        const tree = buildTaskTree(filteredTasks);
        masterListEl.innerHTML = tree.map(node => renderTaskNode(node)).join('');
    }
};

// --- Gamification ---
function awardStar() {
    state.stars += 1;
    updateStarsUI();
    showCelebration();
}
function updateStarsUI() { starCountEl.textContent = state.stars; }
function showCelebration() {
    celebrationEl.classList.add('show');
    setTimeout(() => { celebrationEl.classList.remove('show'); }, 2500);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}


window.openModalTab = function(event, tabId) {
    const tabContents = document.querySelectorAll('.modal-tab-content');
    tabContents.forEach(content => content.style.display = 'none');
    
    const tabBtns = document.querySelectorAll('.modal-tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).style.display = 'block';
    if (event) {
        event.currentTarget.classList.add('active');
    }
};
