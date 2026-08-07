// Cloudflare Worker API URL (User needs to replace this with their actual deployed worker URL)
const CLOUDFLARE_API_URL = ''; 

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
            <div class="gtd-guide">
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
                                <li><strong>Dự án (10k ft):</strong> Hoàn thành chứng chỉ SAT đạt 1400+ và đóng gói Hồ sơ năng lực tự học (Unschooling Portfolio / Narrative) trong 6 tháng.</li>
                                <li><strong>Lĩnh vực trách nhiệm (20k ft):</strong> Học thuật & Phát triển tri thức, Quản lý hồ sơ cá nhân (Duy trì và theo dõi liên tục).</li>
                                <li><strong>Mục tiêu (30k ft):</strong> Nộp đơn và nhận thư trúng tuyển (kèm học bổng) từ ít nhất 1 trường Đại học phù hợp trong 12–18 tháng.</li>
                                <li><strong>Tầm nhìn (40k ft):</strong> Tự do trải nghiệm môi trường đại học với tinh thần chủ động, kết nối với mạng lưới học giả và chuyên gia trong 3–5 năm tới.</li>
                                <li><strong>Sứ mệnh (50k ft):</strong> Theo đuổi tri thức đỉnh cao, giữ vững tư duy độc lập và dùng sự hiểu biết để phụng sự xã hội.</li>
                            </ul>
                        </div>
                    </div>
                </details>

                <div class="gtd-tip" style="margin-bottom: 15px;"><i class="fa-solid fa-lightbulb"></i> <strong>Tránh bẫy ôm đồm:</strong> Gom dự án theo Lĩnh vực trách nhiệm (Tài chính, Sức khỏe, Gia đình, Sự nghiệp...) để cân bằng nguồn lực, tránh lệch vai.</div>

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
            <div class="gtd-guide">
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
                        <p style="margin-bottom: 8px;"><strong>Bản chất:</strong> Đây là dự án tạo nên "sự độc đáo và nét riêng" (Uniqueness / Standout Factor) từ triết lý của Blake Boles.</p>
                        
                        <div style="margin-bottom: 15px; padding: 10px; background: rgba(139, 92, 246, 0.05); border-radius: 6px; border: 1px solid #ddd6fe;">
                            <p style="margin-bottom: 4px;"><strong><i class="fa-solid fa-crosshairs" style="color: #6d28d9; width: 20px;"></i> Vai trò:</strong> Điểm nét riêng biệt</p>
                            <p style="margin-bottom: 0;"><strong><i class="fa-solid fa-comment-dots" style="color: #6d28d9; width: 20px;"></i> Thông điệp:</strong> <em>"Học sinh này có gì đặc biệt so với những người khác?"</em> &rarr; <strong>Rất độc đáo.</strong></p>
                        </div>
                        
                        <p style="margin-bottom: 4px; font-weight: bold; color: #5b21b6;">Tại sao cần:</p>
                        <p style="margin-bottom: 15px;">Hàng ngàn học sinh truyền thống đều có điểm SAT cao và bảng điểm đẹp, nhưng rất ít người sở hữu một sản phẩm thực tế do chính mình tạo ra từ đầu đến cuối. Một cuốn sách đã xuất bản, một ứng dụng di động đã có người dùng, hay một dự án/sự kiện cộng đồng đã quy tụ hàng trăm người chính là minh chứng sống động nhất cho tư duy chủ động, năng lực lãnh đạo và sự kiên trì.</p>
                        
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
                        <p style="margin-bottom: 8px;">Dù có điểm thi tốt, học xong tín chỉ và làm ra sản phẩm hay, nếu không biết gom lại và kể thành một câu chuyện cá nhân (Narrative) hấp dẫn thì hồ sơ vẫn mờ nhạt. Dự án này bao gồm:</p>
                        <ul style="margin-bottom: 15px; margin-left: 15px; list-style-type: square; color: #475569;">
                            <li style="margin-bottom: 4px;"><strong>Unschooling Portfolio:</strong> Tập hợp đường link, hình ảnh, bài báo, nhận xét từ người cố vấn (Mentors), danh mục sách đã đọc thành một file PDF hoặc trang web cá nhân đẹp mắt.</li>
                            <li style="margin-bottom: 4px;"><strong>Bài luận cá nhân (Personal Statement):</strong> Bài viết 650 từ trả lời câu hỏi: "Con đường tự học đã hình thành nên con người và thế giới quan của bạn như thế nào?"</li>
                        </ul>
                        
                        <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin-top: 5px;">
                            <p style="margin-bottom: 8px; font-weight: bold; color: #b45309;"><i class="fa-solid fa-gears"></i> Cách vận hành (Tầng 10,000 ft):</p>
                            
                            <ul style="margin-bottom: 0; margin-top: 5px; margin-left: 15px; list-style-type: disc;">
                                <li style="margin-bottom: 4px;"><strong>Kết quả mong muốn (Outcome):</strong> Nộp hoàn tất bộ hồ sơ ứng tuyển (Common App) lên hệ thống của các trường Đại học trước hạn chót.</li>
                                <li style="margin-bottom: 4px;"><strong>Hành động kế tiếp (Runway):</strong> 
                                    <ul style="margin-top: 4px; margin-bottom: 0; list-style-type: circle; color: #475569;">
                                        <li>Lập file Google Drive gom tất cả hình ảnh/chứng nhận dự án.</li>
                                        <li>Viết 200 từ nháp đầu tiên cho bài luận cá nhân.</li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </details>
            </div>
        `
    },
    'project': { title: 'Dự Án', desc: 'Mục tiêu cần nhiều bước để hoàn thành.', icon: 'fa-layer-group', color: 'var(--primary-color)', defaultWorkCat: 'Project', defaultSysCat: 'N/A' },
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
    if (currentActiveTab === 'vision' || currentActiveTab === 'kat') {
        if (quickAddForm) quickAddForm.style.display = 'none';
        if (masterList) masterList.style.display = 'none';
    } else {
        if (quickAddForm) quickAddForm.style.display = '';
        if (masterList) masterList.style.display = '';
    }

    // Đổi placeholder input
    quickAddInput.placeholder = `Nhập ${conf.title.toLowerCase()} mới...`;
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

    if (CLOUDFLARE_API_URL) {
        setSyncStatus('syncing');
        try {
            const response = await fetch(`${CLOUDFLARE_API_URL}/data`);
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
    if (CLOUDFLARE_API_URL) {
        setSyncStatus('syncing');
        try {
            const response = await fetch(`${CLOUDFLARE_API_URL}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
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
    syncStatusEl.className = 'sync-status ' + status;
    if (status === 'synced') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-check"></i>';
        syncStatusEl.title = 'Đã đồng bộ';
    } else if (status === 'syncing') {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-rotate"></i>';
        syncStatusEl.title = 'Đang đồng bộ...';
    } else {
        syncStatusEl.innerHTML = '<i class="fa-solid fa-cloud-xmark"></i>';
        syncStatusEl.title = 'Lỗi đồng bộ';
    }
}

// --- Quick Add Task ---
window.handleQuickAdd = async function(event) {
    event.preventDefault();
    const text = quickAddInput.value.trim();
    if (!text) return;

    const conf = tabConfigs[currentActiveTab];
    const newTask = {
        id: Date.now().toString(),
        text: text,
        done: false,
        workCategory: conf.defaultWorkCat,
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
window.openTaskModal = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('modal-task-id').value = task.id;
    document.getElementById('modal-task-name').value = task.text;
    document.getElementById('modal-task-workcat').value = task.workCategory;
    document.getElementById('modal-task-syscat').value = task.systemCategory;
    document.getElementById('modal-task-context').value = task.context || "";
    document.getElementById('modal-task-time').value = task.time || "";
    document.getElementById('modal-task-energy').value = task.energy || "";
    document.getElementById('modal-task-group').value = task.taskGroup || "Maintenance";
    document.getElementById('modal-task-area').value = task.area || "";
    document.getElementById('modal-task-project').value = task.projectRef || "";
    document.getElementById('modal-task-goal').value = task.goalRef || "";
    document.getElementById('modal-task-vision').value = task.visionRef || "";
    document.getElementById('modal-task-mission').value = task.missionRef || "";

    window.toggleGroupFields();
    taskModal.classList.add('show');
};

window.toggleGroupFields = function() {
    const group = document.getElementById('modal-task-group').value;
    document.getElementById('strategic-fields').style.display = group === 'Strategic' ? 'block' : 'none';
};

window.closeTaskModal = function() {
    taskModal.classList.remove('show');
};

window.saveTaskDetails = async function() {
    const id = document.getElementById('modal-task-id').value;
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task.text = document.getElementById('modal-task-name').value;
    task.workCategory = document.getElementById('modal-task-workcat').value;
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

    // Logic GTD: Nếu thêm Context/Time mà đang ở Defining -> Tự động chuyển qua Pre-defined
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
window.renderTasks = function() {
    const conf = tabConfigs[currentActiveTab];
    const expectedWorkCat = conf.defaultWorkCat;

    // Lọc theo Tab (Nếu không phải tab Hành Động)
    let filteredTasks = state.tasks;
    if (currentActiveTab !== 'action') {
        filteredTasks = filteredTasks.filter(t => t.workCategory === expectedWorkCat);
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
                            <tr class="${task.done ? 'done' : ''}">
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
        // Render dạng Card chuẩn
        masterListEl.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.done ? 'done' : ''}">
                <div class="task-main">
                    <div class="task-info">
                        <div class="checkbox" onclick="toggleTask('${task.id}')">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <span class="task-text">${escapeHTML(task.text)}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-details" onclick="openTaskModal('${task.id}')" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i></button>
                        <button class="delete-btn" onclick="deleteTask('${task.id}')" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                <div class="task-tags">
                    ${task.taskGroup ? `<span class="tag tag-sys" style="background:#dcfce3;color:#166534;"><i class="fa-solid fa-layer-group"></i> ${escapeHTML(task.taskGroup)}</span>` : ''}
                    ${task.area ? `<span class="tag tag-sys" style="background:#f3e8ff;color:#6b21a8;">${escapeHTML(task.area)}</span>` : ''}
                    ${task.systemCategory && task.systemCategory !== 'N/A' ? `<span class="tag tag-sys">${escapeHTML(task.systemCategory)}</span>` : ''}
                    ${task.projectRef ? `<span class="tag tag-sys" style="background:#e0f2fe;color:#0369a1;"><i class="fa-solid fa-rocket"></i> Dự án: ${escapeHTML(task.projectRef)}</span>` : ''}
                    ${task.goalRef ? `<span class="tag tag-sys" style="background:#ffedd5;color:#c2410c;"><i class="fa-solid fa-bullseye"></i> MT: ${escapeHTML(task.goalRef)}</span>` : ''}
                    ${task.visionRef ? `<span class="tag tag-sys" style="background:#fef08a;color:#854d0e;"><i class="fa-solid fa-eye"></i> TN: ${escapeHTML(task.visionRef)}</span>` : ''}
                    ${task.missionRef ? `<span class="tag tag-sys" style="background:#fee2e2;color:#b91c1c;"><i class="fa-solid fa-fire"></i> SM: ${escapeHTML(task.missionRef)}</span>` : ''}
                    ${task.context ? `<span class="tag tag-context">${escapeHTML(task.context)}</span>` : ''}
                    ${task.time ? `<span class="tag tag-time"><i class="fa-regular fa-clock"></i> ${escapeHTML(task.time)}</span>` : ''}
                    ${task.energy ? `<span class="tag tag-energy"><i class="fa-solid fa-bolt"></i> ${escapeHTML(task.energy)}</span>` : ''}
                </div>
            </div>
        `).join('');
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
