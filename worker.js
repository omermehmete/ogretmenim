// Öğretmenim – Gemini aracı sunucusu + sınıf topluluğu (Cloudflare Worker)
// Gemini API anahtarını gizli tutar; sayfa anahtarı hiç görmez.
// Cloudflare panelinde Settings > Variables and Secrets bölümüne ekle:
//   GEMINI_API_KEY  (Secret)  : Google AI Studio'dan aldığın anahtar
//   ALLOWED_ORIGIN  (Text)    : Sitenin adresi, örn. https://kullaniciadin.github.io
//                               Birden fazla site için virgülle ayır: https://a.github.io,https://b.github.io
// Sınıf topluluğu için Settings > Bindings bölümüne KV namespace ekle:
//   Variable name: TOPLULUK

const temiz = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);
const anahtar = s => /^[a-z0-9_.-]{1,140}$/.test(s);

async function topluluk(islem, req, env, cors) {
  const json = (v, st = 200) => new Response(JSON.stringify(v), { status: st, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
  if (!env.TOPLULUK) return json({ hata: "kv_yok" }, 501);
  let b;
  try { b = JSON.parse(await req.text()); } catch (e) { return json({ hata: "gecersiz" }, 400); }
  const okul = temiz(b.okul, 80), cls = temiz(b.cls, 140), kul = temiz(b.kul, 20);

  if (islem === "katil") {
    if (!anahtar(okul) || !anahtar(cls) || !/^[a-z0-9_.]{3,20}$/.test(kul)) return json({ hata: "gecersiz" }, 400);
    const role = b.role === "ogretmen" ? "ogretmen" : "ogrenci";
    await env.TOPLULUK.put(`m:${cls}:${kul}`, "1", { metadata: { kul, ad: temiz(b.ad, 40), role, t: Date.now() } });
    // Öğrenci katılınca sınıf okulun listesine eklenir (öğretmenler sınıfı oradan bulur)
    if (role === "ogrenci" && b.kademe && b.sinif && b.sube)
      await env.TOPLULUK.put(`c:${okul}:${cls}`, "1", { metadata: { kademe: temiz(b.kademe, 10), sinif: Number(b.sinif) || 1, sube: temiz(b.sube, 10) } });
    return json({ tamam: true });
  }
  if (islem === "ayril") {
    if (!anahtar(cls) || !kul) return json({ hata: "gecersiz" }, 400);
    await env.TOPLULUK.delete(`m:${cls}:${kul}`);
    return json({ tamam: true });
  }
  if (islem === "uyeler") {
    if (!anahtar(cls)) return json({ hata: "gecersiz" }, 400);
    const l = await env.TOPLULUK.list({ prefix: `m:${cls}:`, limit: 200 });
    return json({ uyeler: l.keys.map(k => k.metadata).filter(Boolean) });
  }
  if (islem === "siniflar") {
    if (!anahtar(okul)) return json({ hata: "gecersiz" }, 400);
    const l = await env.TOPLULUK.list({ prefix: `c:${okul}:`, limit: 200 });
    return json({ siniflar: l.keys.map(k => k.metadata).filter(Boolean) });
  }
  return json({ hata: "gecersiz" }, 400);
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const izinli = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim().replace(/\/+$/, "")).filter(Boolean);
    const cors = {
      "Access-Control-Allow-Origin": izinli.length ? (izinli.includes(origin) ? origin : izinli[0]) : "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Yalnızca POST", { status: 405, headers: cors });
    if (izinli.length && !izinli.includes(origin)) return new Response("Bu siteye izin yok", { status: 403, headers: cors });

    const path = new URL(req.url).pathname.slice(1);

    // Sınıf topluluğu: /topluluk/katil, /topluluk/ayril, /topluluk/uyeler, /topluluk/siniflar
    const t = path.match(/^topluluk\/(katil|ayril|uyeler|siniflar)$/);
    if (t) return topluluk(t[1], req, env, cors);

    // İzin verilen yol: /<model>:generateContent veya /<model>:streamGenerateContent
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
