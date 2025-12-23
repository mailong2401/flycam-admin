// supabase/functions/youtube-metadata/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const { youtubeUrl } = await req.json();

    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ error: "Missing youtubeUrl" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ===============================
    // 1. TÁCH VIDEO ID
    // ===============================
    const match =
      youtubeUrl.match(/v=([^&]+)/) ||
      youtubeUrl.match(/youtu\.be\/([^?]+)/);

    if (!match) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const videoId = match[1];

    // ===============================
    // 2. GỌI YOUTUBE DATA API
    // ===============================
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      throw new Error("Missing YOUTUBE_API_KEY");
    }

    const apiUrl =
      "https://www.googleapis.com/youtube/v3/videos" +
      `?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;

    const ytRes = await fetch(apiUrl);
    const ytData = await ytRes.json();

    if (!ytData.items || ytData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const video = ytData.items[0];

    // ===============================
    // 3. TRẢ DATA CHO FRONTEND
    // ===============================
    return new Response(
      JSON.stringify({
        videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        duration: video.contentDetails.duration,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("youtube-metadata error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
