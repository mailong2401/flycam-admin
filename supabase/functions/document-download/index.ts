// supabase/functions/document-download/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// CORS headers đầy đủ
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// -------------------- SMTP SEND FUNCTION --------------------
async function sendSMTP(to: string, html: string, subject: string) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  // -------------------- ENV VARIABLES --------------------
  const smtpHost = Deno.env.get('SMTP_HOST')!
  const smtpPort = Number(Deno.env.get('SMTP_PORT')!)
  const smtpUser = Deno.env.get('SMTP_USER')!
  const smtpPass = Deno.env.get('SMTP_PASS')!
  const secure = Deno.env.get('SMTP_SECURE') === 'true'

  console.log(`📧 SMTP Config: ${smtpHost}:${smtpPort}, user: ${smtpUser}`)

  const conn = secure
    ? await Deno.connectTls({ hostname: smtpHost, port: smtpPort })
    : await Deno.connect({ hostname: smtpHost, port: smtpPort })

  async function smtp(cmd: string) {
    await conn.write(encoder.encode(cmd + "\r\n"))
    const buf = new Uint8Array(4096)
    const n = await conn.read(buf)
    return decoder.decode(buf.subarray(0, n))
  }

  try {
    // SMTP Handshake
    await smtp("EHLO localhost")
    await smtp("AUTH LOGIN")
    await smtp(btoa(smtpUser))
    await smtp(btoa(smtpPass))

    // Send email
    await smtp(`MAIL FROM:<${smtpUser}>`)
    await smtp(`RCPT TO:<${to}>`)
    await smtp("DATA")

    const body = 
`From: ${smtpUser}
To: ${to}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

${html}
`

    await smtp(body + "\r\n.")
    await smtp("QUIT")
    
    console.log(`✅ Email sent successfully to: ${to}`)
    return true
  } catch (error) {
    console.error(`❌ SMTP error sending to ${to}:`, error)
    throw error
  } finally {
    conn.close()
  }
}

serve(async (req) => {
  console.log('📄 Document Download Edge Function called')
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling CORS preflight request')
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  // Chỉ cho phép POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse request
    let formData
    try {
      formData = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON format' 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('📥 Received document download data:', formData)

    const { 
      name, 
      email, 
      phone, 
      company, 
      document 
    } = formData
    
    // Validate
    if (!name || !email || !phone || !document || !document.title) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields for document download' 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. SETUP SUPABASE CLIENT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || ''
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'phamnguyenminhtri249@gmail.com'
    
    console.log('🔗 Supabase URL exists:', !!supabaseUrl)
    console.log('🔑 Supabase Service Key exists:', !!supabaseServiceKey)
    console.log('📧 Admin Email:', adminEmail)
    
    // Kiểm tra biến môi trường SMTP
    const smtpHost = Deno.env.get('SMTP_HOST')
    const smtpPort = Deno.env.get('SMTP_PORT')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    
    console.log('📧 SMTP Config check:', {
      host: !!smtpHost,
      port: !!smtpPort,
      user: !!smtpUser,
      pass: !!smtpPass
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Supabase credentials missing' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'SMTP configuration missing' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 2. LƯU VÀO BẢNG document_downloads
    let dbRecordId = null
    try {
      const { data, error } = await supabase
        .from('document_downloads')
        .insert({
          user_name: name,
          user_email: email,
          user_phone: phone,
          user_company: company || null,
          document_id: document.id,
          document_title: document.title,
          document_description: document.description,
          document_url: document.file_url,
          document_type: document.file_type,
          document_size: document.file_size,
          download_at: new Date().toISOString(),
          status: 'downloaded'
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('❌ Database insert error:', error)
        throw new Error(`Database error: ${error.message}`)
      } else {
        dbRecordId = data.id
        console.log('✅ Saved to document_downloads with ID:', dbRecordId)
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      throw dbError
    }

    // 3. EMAIL CHO ADMIN - Tải tài liệu (CHỈ GỬI CHO ADMIN, KHÔNG GỬI CHO NGƯỜI DÙNG)
    const adminHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tải tài liệu từ Hitek Flycam</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .highlight { background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .document-info {
            background: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 Hitek Flycam - Tải tài liệu mới</h1>
            <p>Có người vừa tải tài liệu từ website của bạn</p>
        </div>
        
        <div class="content">
            <div class="highlight">
                <p><strong>📋 Thông tin người tải:</strong></p>
                <p>Họ tên: <strong>${name}</strong></p>
                <p>Thời gian: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
                <p>Mã giao dịch: <strong>DL${dbRecordId ? dbRecordId.toString().substring(0, 8).toUpperCase() : 'N/A'}</strong></p>
            </div>
            
            <div class="document-info">
                <h3 style="margin-top: 0; color: #2563eb;">📄 THÔNG TIN TÀI LIỆU ĐÃ TẢI</h3>
                <table>
                    <tr>
                        <td width="30%"><strong>Tiêu đề:</strong></td>
                        <td><strong>${document.title}</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Mô tả:</strong></td>
                        <td>${document.description || 'Không có mô tả'}</td>
                    </tr>
                    ${document.file_type ? `
                    <tr>
                        <td><strong>Loại file:</strong></td>
                        <td>${document.file_type}</td>
                    </tr>
                    ` : ''}
                    ${document.file_size ? `
                    <tr>
                        <td><strong>Kích thước:</strong></td>
                        <td>${document.file_size}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
            
            <table>
                <tr>
                    <td width="30%"><strong>👤 Họ và tên:</strong></td>
                    <td>${name}</td>
                </tr>
                <tr>
                    <td><strong>🏢 Công ty:</strong></td>
                    <td>${company || 'Không có'}</td>
                </tr>
                <tr>
                    <td><strong>📧 Email:</strong></td>
                    <td><a href="mailto:${email}" style="color: #3b82f6;">${email}</a></td>
                </tr>
                <tr>
                    <td><strong>📞 Số điện thoại:</strong></td>
                    <td><a href="tel:${phone}" style="color: #3b82f6;">${phone}</a></td>
                </tr>
            </table>
            
            <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
            
            <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 6px; font-size: 14px;">
                <p><strong>📊 Thông tin hệ thống:</strong></p>
                <table>
                    <tr>
                        <td width="40%">Hệ thống:</td>
                        <td>Hitek Flycam - Module Tài Liệu</td>
                    </tr>
                    <tr>
                        <td>Thời gian xử lý:</td>
                        <td>${new Date().toISOString()}</td>
                    </tr>
                    <tr>
                        <td>Email gửi đến:</td>
                        <td>Chỉ admin (không gửi xác nhận cho người dùng)</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
`

    // 4. GỬI EMAIL CHO ADMIN BẰNG SMTP
    console.log('📤 Sending admin notification via SMTP to:', adminEmail)
    let adminSent = false
    let adminError = null
    
    try {
      await sendSMTP(adminEmail, adminHtml, `📄 Hitek Flycam - Tải tài liệu từ ${name}`)
      adminSent = true
      console.log('✅ Admin notification sent successfully via SMTP')
    } catch (error) {
      console.error('❌ Admin notification failed:', error)
      adminError = error.message
    }

    // 5. CẬP NHẬT DATABASE VỚI TRẠNG THÁI EMAIL (chỉ admin)
    if (dbRecordId) {
      try {
        const updateData: any = {
          admin_email_sent: adminSent,
          updated_at: new Date().toISOString()
        }
        
        if (!adminSent) {
          updateData.email_error_details = {
            admin_error: adminError
          }
        }
        
        const { error: updateError } = await supabase
          .from('document_downloads')
          .update(updateData)
          .eq('id', dbRecordId)
        
        if (updateError) {
          console.error('❌ Database update error:', updateError)
        } else {
          console.log('✅ Database updated with email status')
        }
      } catch (updateError) {
        console.error('❌ Database update failed:', updateError)
      }
    }

    // 6. TRẢ VỀ RESPONSE
    const responseData = {
      success: true,
      message: 'Document download recorded successfully!',
      data: {
        record_id: dbRecordId,
        document_title: document.title,
        document_url: document.file_url,
        email_sent: {
          admin: adminSent
        },
        download_time: new Date().toISOString()
      }
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in Document Download Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})