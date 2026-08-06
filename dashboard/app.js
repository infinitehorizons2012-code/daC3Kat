// Khởi tạo Supabase client (Thay URL và Key bằng giá trị thật sau này)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
// const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Vẽ biểu đồ mẫu (Mock data) chờ có DB thật
    initMockChart();
    
    // 2. Load dữ liệu giả cho Khan và Notes
    loadMockData();

    // TODO: Khi có DB thật, dùng supabase.from('activity_logs').select(...) để thay thế
});

function initMockChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Google Chrome', 'Khan Academy (Custom)', 'Microsoft Word', 'Zoom'],
            datasets: [{
                label: 'Thời gian (Phút)',
                data: [45, 120, 30, 60],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function loadMockData() {
    const khanList = document.getElementById('khan-list');
    khanList.innerHTML = `
        <li><strong>Đại số lớp 8:</strong> 85% hoàn thành (Hôm nay)</li>
        <li><strong>Lập trình JS:</strong> 40% hoàn thành (Hôm qua)</li>
    `;

    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = `
        <li><em>"Photosynthesis is the process..."</em> - Dịch: Quang hợp là quá trình... (Từ khóa học Sinh học)</li>
        <li><em>"Ghi nhớ công thức nghiệm phương trình bậc 2"</em> (Từ khóa học Toán)</li>
    `;
}
