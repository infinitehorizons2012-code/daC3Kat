/**
 * Cloudflare Worker Backend cho Ứng dụng Quản lý Thời gian (168)
 * 
 * HƯỚNG DẪN TRIỂN KHAI LÊN CLOUDFLARE:
 * 1. Tạo một tài khoản Cloudflare (nếu chưa có).
 * 2. Vào mục "Workers & Pages" -> "Create application" -> "Create Worker".
 * 3. Đặt tên (ví dụ: `time-app-api`) và nhấn "Deploy".
 * 4. Nhấn "Edit code", copy toàn bộ nội dung file này dán đè vào và nhấn "Save and Deploy".
 * 5. (Tùy chọn cho việc lưu trữ vĩnh viễn): Bạn cần tạo một KV Namespace có tên `APP_DATA` và bind vào biến `APP_DATA` trong phần Settings -> Variables -> KV Namespace Bindings.
 * 6. Copy URL của Worker (VD: https://time-app-api.username.workers.dev) dán vào biến `CLOUDFLARE_API_URL` trong file `script.js` của Frontend.
 */

// Handle CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Xử lý Preflight requests cho CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // API Route: /data
    if (url.pathname === '/data') {
      if (request.method === 'GET') {
        try {
          // Lấy data từ KV Namespace (nếu bạn đã cài đặt biến môi trường APP_DATA)
          // Nếu chưa cài KV, fallback trả về data rỗng (hoặc báo lỗi).
          if (!env.APP_DATA) {
            return new Response(JSON.stringify({ error: "Chưa cấu hình KV APP_DATA" }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }
          
          const value = await env.APP_DATA.get('timeManagementState');
          if (value === null) {
            return new Response(JSON.stringify({
              stars: 0,
              tasks: { unplanned: [], predefined: [], defining: [] }
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          
          return new Response(value, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } catch (error) {
          return new Response(error.toString(), { status: 500, headers: corsHeaders });
        }
      } 
      
      else if (request.method === 'POST') {
        try {
          const body = await request.json();
          if (!env.APP_DATA) {
             return new Response(JSON.stringify({ error: "Chưa cấu hình KV APP_DATA" }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }
          
          // Lưu data vào KV
          await env.APP_DATA.put('timeManagementState', JSON.stringify(body));
          
          return new Response(JSON.stringify({ success: true }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        } catch (error) {
          return new Response(error.toString(), { status: 500, headers: corsHeaders });
        }
      }
    }

    // Default route
    return new Response('API Backend Siêu Nhân Thời Gian 168. Dùng /data để lấy/lưu dữ liệu.', {
      headers: corsHeaders,
    });
  },
};
