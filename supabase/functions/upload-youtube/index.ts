// supabase/functions/upload-youtube/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // hoặc đổi thành frontend URL: "http://localhost:8080"
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };

  // Xử lý preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ===============================
    // 1. CHỈ CHO PHÉP POST
    // ===============================
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    // ===============================
    // 2. KIỂM TRA AUTH SUPABASE
    // ===============================
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ===============================
    // 3. LẤY FILE VIDEO + DATA
    // ===============================
    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const title = (formData.get("title") as string) || "Untitled video";
    const description = (formData.get("description") as string) || "Uploaded from website";

    if (!videoFile) {
      return new Response(
        JSON.stringify({ error: "Missing video file" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ===============================
    // 4. ĐỔI REFRESH TOKEN → ACCESS TOKEN
    // ===============================
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        refresh_token: Deno.env.get("GOOGLE_REFRESH_TOKEN")!,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      return new Response(
        JSON.stringify({ error: "Failed to get access token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const accessToken = tokenData.access_token;

    // ===============================
    // 5. UPLOAD VIDEO LÊN YOUTUBE
    // ===============================
    const uploadUrl =
      "https://www.googleapis.com/upload/youtube/v3/videos" +
      "?part=snippet,status" +
      "&uploadType=resumable";

    // 5.1 Tạo resumable session
    const initRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        snippet: { title, description },
        status: { privacyStatus: "public" },
      }),
    });

    const uploadSessionUrl = initRes.headers.get("location");

    if (!uploadSessionUrl) {
      const text = await initRes.text();
      console.error("Init upload failed:", text);
      return new Response(
        JSON.stringify({ error: "Failed to init upload session" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 5.2 Upload binary video
    const videoBuffer = new Uint8Array(await videoFile.arrayBuffer());

    const uploadRes = await fetch(uploadSessionUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Length": videoBuffer.length.toString(),
        "Content-Type": videoFile.type || "video/*",
      },
      body: videoBuffer,
    });

    const uploadResult = await uploadRes.json();

    if (!uploadResult.id) {
      console.error("Upload failed:", uploadResult);
      return new Response(
        JSON.stringify({ error: "Upload failed", detail: uploadResult }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ===============================
    // 6. TRẢ KẾT QUẢ VỀ FRONTEND
    // ===============================
    return new Response(
      JSON.stringify({
        success: true,
        videoId: uploadResult.id,
        youtubeUrl: `https://youtu.be/${uploadResult.id}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (err) {
    console.error("Edge Function error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
