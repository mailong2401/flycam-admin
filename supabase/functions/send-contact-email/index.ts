import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// -------------------- CORS --------------------
function cors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

serve(async (req) => {
  try {
    // Handle preflight
    if (req.method === "OPTIONS") {
      return cors(new Response("ok", { status: 200 }));
    }

    if (req.method !== "POST") {
      return cors(
        new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
        })
      );
    }

    const data = await req.json();

    // -------------------- ENV --------------------
    const smtpHost = Deno.env.get("SMTP_HOST")!;
    const smtpPort = Number(Deno.env.get("SMTP_PORT")!);
    const smtpUser = Deno.env.get("SMTP_USER")!;
    const smtpPass = Deno.env.get("SMTP_PASS")!;
    const secure = Deno.env.get("SMTP_SECURE") === "true";
    const adminEmail = Deno.env.get("ADMIN_EMAIL")!;

    // *** IMPORTANT ***
    // Bạn chỉ nên dùng PROJECT_URL + SERVICE_ROLE_KEY
    const supabaseUrl = Deno.env.get("PROJECT_URL")!;
    const supabaseServiceRole = Deno.env.get("SERVICE_ROLE_KEY")!;

    // FIX: Tắt persistSession để client chạy đúng trong edge functions
    const supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false }
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // -------------------- SMTP SEND FUNCTION --------------------
    async function sendSMTP(to: string, html: string, subject: string) {
      const conn = secure
        ? await Deno.connectTls({ hostname: smtpHost, port: smtpPort })
        : await Deno.connect({ hostname: smtpHost, port: smtpPort });

      async function smtp(cmd: string) {
        await conn.write(encoder.encode(cmd + "\r\n"));
        const buf = new Uint8Array(4096);
        const n = await conn.read(buf);
        return decoder.decode(buf.subarray(0, n));
      }

      await smtp("EHLO localhost");
      await smtp("AUTH LOGIN");
      await smtp(btoa(smtpUser));
      await smtp(btoa(smtpPass));

      await smtp(`MAIL FROM:<${smtpUser}>`);
      await smtp(`RCPT TO:<${to}>`);
      await smtp("DATA");

      const body = 
`From: ${smtpUser}
To: ${to}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

${html}
`;

      await smtp(body + "\r\n.");
      await smtp("QUIT");

      conn.close();
    }

    // -------------------- ADMIN EMAIL --------------------
    const adminHtml = `
    <div style="font-family: Arial; padding:20px; border:1px solid #eee; border-radius:8px;">
      <h2 style="color:#333;">📩 New Contact Submission</h2>
      <p><b>Name:</b> ${data.name}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Company:</b> ${data.company || "N/A"}</p>
      <p><b>Service:</b> ${data.service || "N/A"}</p>
      <p><b>Message:</b><br>${data.message}</p>
      <br>
      <small style="color:#777;">Sent from website contact form</small>
    </div>
    `;

    // -------------------- USER EMAIL --------------------
    const userHtml = `
    <div style="font-family: Arial; padding:20px; border:1px solid #eee; border-radius:8px;">
      <h2 style="color:#4CAF50;">🎉 Cảm ơn bạn đã liên hệ!</h2>
      <p>Chào <b>${data.name}</b>,</p>
      <p>Chúng tôi đã nhận được thông tin của bạn và sẽ liên hệ lại sớm nhất.</p>

      <h3>📄 Thông tin bạn đã gửi:</h3>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Service:</b> ${data.service || "N/A"}</p>
      <p><b>Message:</b><br>${data.message}</p>

      <br><br>
      <p>Trân trọng,<br><b>Hitek Team</b></p>
    </div>
    `;

    // -------------------- SAVE TO DATABASE --------------------
    const { data: saved, error } = await supabase
      .from("contact_submissions")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        service: data.service,
        message: data.message,
        status: "pending",
      })
      .select();

    // 🔥 GHI LẠI LỖI THẬT
    console.log("DB INSERT RESULT:", saved);
    console.log("DB INSERT ERROR:", error);

    // -------------------- SEND EMAILS --------------------
    await sendSMTP(adminEmail, adminHtml, "📩 New Contact Submission");
    await sendSMTP(data.email, userHtml, "🎉 Cảm ơn bạn đã liên hệ!");

    return cors(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

  } catch (err) {
    console.error("❌ ERROR:", err);
    return cors(
      new Response(JSON.stringify({ error: err.message }), {
        status: 500,
      })
    );
  }
});
