/* ===== Gemini bağlantısı: sayfa Claude dışında (ör. GitHub Pages) açıldığında yapay zekâ Gemini ile çalışır ===== */
const GEMINI = {
  proxy: "https://ogretmenim-ai.mustafaorhn456.workers.dev",                    // Önerilen: Cloudflare Worker adresin. Örn: "https://ogretmenim-ai.kullaniciadin.workers.dev"
  key: "",                      // Ya da anahtarı buraya yaz. Herkes görebilir; Google Cloud'da yalnızca kendi sitene kısıtla!
  model: "gemini-flash-latest"  // İstersen değiştir: "gemini-3.5-flash-lite" gibi
};
const gKey = () => GEMINI.key || store.get("gkey", "");
const gReady = () => !!(GEMINI.proxy || gKey());
function gContents(input){
  const msgs = typeof input === "string" ? [{role:"user", content:input}] : input, out = [];
  msgs.forEach(m => {
    const role = m.role === "assistant" ? "model" : "user", last = out[out.length-1];
    if(last && last.role === role) last.parts[0].text += "\n\n" + m.content;
    else out.push({role, parts:[{text:String(m.content)}]});
  });
  return out;
}
const gText = j => ((j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || "").join("");
async function gCall(input, json, onText){
  const stream = !!onText && !json, method = stream ? "streamGenerateContent" : "generateContent";
  const body = {contents:gContents(input), generationConfig:Object.assign({temperature:0.7}, json ? {responseMimeType:"application/json"} : {})};
  const url = GEMINI.proxy
    ? GEMINI.proxy.replace(/\/+$/, "") + "/" + GEMINI.model + ":" + method
    : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI.model}:${method}?${stream ? "alt=sse&" : ""}key=${encodeURIComponent(gKey())}`;
  let res;
  // Google meşgulse (500/503) birkaç saniye bekleyip 2 kez daha dene
  for(let deneme = 0; ; deneme++){
    try{ res = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)}); }
    catch(e){ throw {code:"network"}; }
    if((res.status === 503 || res.status === 500) && deneme < 2){ await new Promise(r => setTimeout(r, 2000 * (deneme + 1))); continue; }
    break;
  }
  if(!res.ok){ const st = res.status; throw {code: st === 429 ? "rate_limited" : (st === 400 || st === 401 || st === 403) ? "bad_key" : st === 404 ? "bad_model" : (st === 503 || st === 500) ? "busy" : "network"}; }
  if(!stream){ const t = gText(await res.json()); if(!t) throw {code:"empty"}; return t; }
  const rd = res.body.getReader(), dec = new TextDecoder(); let buf = "", text = "";
  for(;;){
    const {done, value} = await rd.read(); if(done) break;
    buf += dec.decode(value, {stream:true});
    let i; while((i = buf.indexOf("\n")) >= 0){
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if(!line.startsWith("data:")) continue;
      try{ text += gText(JSON.parse(line.slice(5))); onText({text, delta:""}); }catch(e){}
    }
  }
  if(!text) throw {code:"empty"};
  return text;
}
function makeGemini(){
  const f = async (input, opts) => ({text: await gCall(input, false, opts && opts.onText), truncated:false});
  f.json = async input => {
    const t = await gCall(input, true);
    try{ return JSON.parse(t); }catch(e){
      const m = t.match(/[\[{][\s\S]*[\]}]/); if(m){ try{ return JSON.parse(m[0]); }catch(_){} }
      throw {code:"invalid_json"};
    }
  };
  return f;
}
let _claudeSample;
getSample = async function(){
  if(_claudeSample === undefined){
    try{ _claudeSample = (window.claude && window.claude.use) ? await window.claude.use("sample") : null; }catch(e){ _claudeSample = null; }
  }
  if(_claudeSample) return _claudeSample;
  return gReady() ? makeGemini() : null;
};
const _aiErrG = aiErr;
aiErr = function(e){
  const c = e && e.code;
  if(c === "bad_key") return "Gemini anahtarı geçersiz ya da bu siteden kullanılmasına izin verilmiyor. Yapay zekâ ayarını kontrol et.";
  if(c === "bad_model") return "Gemini modeli bulunamadı. Kodda GEMINI.model adını kontrol et.";
  if(c === "busy") return "Yapay zekâ şu an çok yoğun. Biraz bekleyip tekrar dene.";
  if(c === "empty") return "Gemini boş yanıt verdi. Soruyu biraz değiştirip tekrar dene.";
  return _aiErrG(e);
};

/* Yapay zekâ ayarı sayfası */
function vAyar(){
  const k = store.get("gkey", ""), fixed = !!(GEMINI.proxy || GEMINI.key);
  return backBtn() + `<h2>Yapay zekâ <span class="mark">ayarı</span></h2>
  <div class="page">
    <p>Öğretmenim, Claude üzerinden açıldığında Claude ile, başka bir sitede (ör. GitHub) açıldığında <b>Google Gemini</b> ile çalışır.</p>
    ${fixed ? `<div class="fb ok">Bu sitede Gemini bağlantısı hazır. Ayrıca bir şey yapmana gerek yok.</div>` : `
    <form id="gForm" class="field" autocomplete="off">
      <label for="gk">Gemini API anahtarı</label>
      <input type="password" id="gk" value="${esc(k)}" placeholder="AIza..." autocomplete="off">
      <div class="row"><button class="btn" type="submit">Kaydet</button>${k ? `<button class="btn ghost" type="button" data-act="gdel">Anahtarı sil</button>` : ""}</div>
    </form>
    <p class="small mute">Anahtar yalnızca bu tarayıcıda saklanır. Ücretsiz anahtarı <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--accent);font-weight:700">Google AI Studio</a>'dan alabilirsin.</p>`}
    <div class="row"><button class="btn ghost" id="gtBtn" data-act="gtest">Bağlantıyı dene</button></div>
    <p class="small" id="gMsg" role="status"></p>
  </div>`;
}
ACT.ayar = () => go("ayar");
ACT.gdel = () => { try{ localStorage.removeItem("ogt_gkey"); }catch(e){} render(); };
ACT.gtest = async () => {
  const m = $("#gMsg"), b = $("#gtBtn"), s = await getSample();
  if(!s){ m.textContent = "Önce Gemini API anahtarını kaydet."; return; }
  b.disabled = true; m.textContent = "Deneniyor...";
  try{ const r = await s("Tek cümleyle Türkçe merhaba de."); m.textContent = "Çalışıyor: " + r.text.trim().slice(0, 140); }
  catch(e){ m.textContent = aiErr(e); }
  b.disabled = false;
};
document.addEventListener("submit", e => {
  if(e.target.id !== "gForm") return;
  const v = ($("#gk").value || "").trim(); store.set("gkey", v);
  const m = $("#gMsg"); render(); const m2 = $("#gMsg"); if(m2) m2.textContent = v ? "Kaydedildi. ‘Bağlantıyı dene’ ile kontrol edebilirsin." : "Anahtar silindi.";
});
const _vHomeG = vHome;
vHome = () => _vHomeG().replace(/(<button class="tile" data-act="hoca">[\s\S]*?<\/button>)/, '$1<button class="tile wide" data-act="ayar"><span class="n">Ayar</span><h3>Yapay zekâ ayarı</h3><span class="small">Gemini API anahtarını gir ve bağlantıyı dene</span></button>');
const _renderG = render;
render = function(){ if(V.name === "ayar"){ V.after = null; $("#app").innerHTML = topbar() + vAyar(); $("#fab").hidden = false; return; } _renderG(); };
