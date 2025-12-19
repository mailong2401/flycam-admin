📧PHÂN BIỆT CÁC FILE:
1. emailService.js - FRONTEND CODE (chạy trên browser)
Vị trí: src/utils/emailService.js (trong dự án của bạn)

Nhiệm vụ: Gửi HTTP request đến Supabase Edge Function

Chạy ở: Browser của người dùng

Không chứa: Email người nhận, SendGrid API Key

2. index.ts - BACKEND CODE (Edge Function trên Supabase)
Vị trí: Trong Edge Function trên Supabase Dashboard

Nhiệm vụ: Nhận request, gửi email qua SendGrid

Chạy ở: Supabase server

Chứa: Logic gửi email, nhưng KHÔNG hardcode email/SendGrid key

📧 NƠI CẤU HÌNH EMAIL:
Email được cấu hình ở 2 nơi:
A. Environment Variables trong Supabase Dashboard ⭐ (QUAN TRỌNG NHẤT)
Trong Supabase → Edge Functions → Settings → Environment Variables:

text
Key: ADMIN_EMAIL
Value: phamnguyenminhtri249@gmail.com    ⬅️ EMAIL NHẬN THÔNG BÁO

Key: FROM_EMAIL  
Value: phamnguyenminhtri249@gmail.com    ⬅️ EMAIL VERIFY TRÊN SENDGRID

Key: SENDGRID_API_KEY
Value: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
B. Trong code Edge Function (index.ts)
typescript
// Lấy từ Environment Variables, KHÔNG hardcode
const FROM_EMAIL = Deno.env.get('FROM_EMAIL')        // Email verify
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')      // Email nhận thông báo


🔧 CẬP NHẬT CẤU HÌNH:
Bước 1: Vào Supabase Dashboard
Login supabase.com

Chọn project của bạn

Vào Edge Functions → send-contact-email

Click Settings (bánh răng)

Bước 2: Thêm/Update Environment Variables
Trong tab Environment Variables, thêm 3 key-value pairs:

text
SENDGRID_API_KEY = SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL = phamnguyenminhtri249@gmail.com
ADMIN_EMAIL = phamnguyenminhtri249@gmail.com
Bước 3: Deploy lại Function
Click Deploy để áp dụng thay đổi

🎯 TÓM TẮT LUỒNG HOẠT ĐỘNG:
text
NGƯỜI DÙNG điền form
        ↓
emailService.js gửi request đến Supabase
        ↓
Edge Function (index.ts) chạy trên Supabase
        ↓
Lấy FROM_EMAIL, ADMIN_EMAIL từ Environment Variables
        ↓
Gửi email qua SendGrid với FROM_EMAIL là sender
        ↓
Admin nhận email ở ADMIN_EMAIL
User nhận auto-reply ở email họ điền trong form