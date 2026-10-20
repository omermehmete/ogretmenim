// Öğretmenim – Gemini aracı sunucusu (Cloudflare Worker)
// Gemini API anahtarını gizli tutar; sayfa anahtarı hiç görmez.
// Cloudflare panelinde Settings > Variables and Secrets bölümüne ekle:
//   GEMINI_API_KEY  (Secret)  : Google AI Studio'dan aldığın anahtar
//   ALLOWED_ORIGIN  (Text)    : Sitenin adresi, örn. https://kullaniciadin.github.io

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Yalnızca POST", { status: 405, headers: cors });
    if (allowed && origin !== allowed) return new Response("Bu siteye izin yok", { status: 403, headers: cors });

    // İzin verilen yol: /<model>:generateContent veya /<model>:streamGenerateContent
    const path = new URL(req.url).pathname.slice(1);
    const m = path.match(/^(gemini-[\w.-]+):(generateContent|streamGenerateContent)$/);
    if (!m) return new Response("Geçersiz istek", { status: 400, headers: cors });

    const body = await req.text();
    if (body.length > 60000) return new Response("İstek çok uzun", { status: 413, headers: cors });

    const stream = m[2] === "streamGenerateContent";
    const target = `https://generativelanguage.googleapis.com/v1beta/models/${m[1]}:${m[2]}${stream ? "?alt=sse" : ""}`;
    const r = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body
    });
    return new Response(r.body, {
      status: r.status,
      headers: { ...cors, "Content-Type": r.headers.get("Content-Type") || "application/json" }
    });
  }
};
