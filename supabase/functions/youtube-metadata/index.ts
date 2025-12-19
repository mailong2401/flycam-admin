// supabase/functions/youtube-metadata/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    let videoId: string = body.videoId || body.url; // Hỗ trợ cả videoId và url

    // Nếu truyền URL, extract videoId
    if (videoId && videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
      const extracted = extractYouTubeId(videoId);
      if (!extracted) {
        return new Response(
          JSON.stringify({ error: "Invalid YouTube URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      videoId = extracted;
    }

    if (!videoId || typeof videoId !== "string" || videoId.length !== 11) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid videoId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

    // Fallback nếu không có API key
    if (!YOUTUBE_API_KEY) {
      return new Response(
        JSON.stringify({
          videoId,
          title: "Video YouTube",
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          duration: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      // Video không tồn tại hoặc private
      return new Response(
        JSON.stringify({
          videoId,
          title: "Video không khả dụng",
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          duration: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    const parseDuration = (isoDuration: string): number => {
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2] || "0");
      const seconds = parseInt(match[3] || "0");
      return hours * 3600 + minutes * 60 + seconds;
    };

    const durationSeconds = parseDuration(contentDetails.duration);

    return new Response(
      JSON.stringify({
        videoId,
        title: snippet.title || "Video YouTube",
        description: snippet.description,
        thumbnail: snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: durationSeconds,
        publishedAt: snippet.publishedAt,
        channelTitle: snippet.channelTitle,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("YouTube metadata error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch video metadata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractYouTubeId(url: string): string | null {
  const regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regex);
  return match && match[2].length === 11 ? match[2] : null;
}