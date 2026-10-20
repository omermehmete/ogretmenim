/* ===== Yapay zekâ ile uzun video ders: konuyu yaz, Öğretmenim bölüm bölüm hazırlasın ===== */
const UZ = {orta:{n:8, ad:"Orta · 8 bölüm"}, uzun:{n:14, ad:"Uzun · 14 bölüm"}, cok:{n:20, ad:"Çok uzun · 20 bölüm"}};
let GEN = null; // {id, konu, done, total, msg}
const aiVids = () => store.get("aivid", []);
const saveAiVids = a => store.set("aivid", a.slice(0, 12));
const aiVid = id => aiVids().find(x => x.id === id);
const sceneSecs = s => s.game ? 12 : Math.round(((s.baslik + ". " + s.metin).length * 80 + 3500) / 1000);
const durTxt = sc => { const m = Math.round(sc.reduce((t, s) => t + sceneSecs(s), 0) / 60); return m < 1 ? "1 dk'dan kısa" : "≈ " + m + " dk"; };

function aiScenes(v){
  const a = [{baslik:v.konu, metin:`${v.sinif} için uzun video ders. ${v.plan.length} bölüm var; her iki bölümden sonra kısa bir oyun seni bekliyor. Hazırsan başlıyoruz.`, sembol:"▶"}];
  const qs = (v.sorular || []).slice();
  v.bolum.forEach((b, i) => {
    a.push({baslik:b.b, metin:b.m, sembol:b.e || "•", ai:1});
    if(i % 2 === 1 && qs.length){ const q = qs.shift(); a.push(gMC([q.q, q.o, q.a])); }
  });
  if(v.tamam){
    qs.slice(0, 2).forEach(q => a.push(gMC([q.q, q.o, q.a])));
    const end = {baslik:"Özet", metin:(v.ozet || "Dersi bitirdik.") + " Takıldığın yeri Öğretmenim'e sorabilirsin.", sembol:"✓"}; end.sum = 1; a.push(end);
  } else a.push({baslik:"Devamı hazırlanıyor", metin:"Öğretmenim sonraki bölümleri yazıyor. Birazdan video kendiliğinden devam edecek.", sembol:"⏳", wait:1});
  return a;
}

const _seAI = sceneEmoji;
sceneEmoji = function(s, d){
  if(s && s.ai && s.sembol && /\p{Extended_Pictographic}/u.test(s.sembol)){
    const parts = typeof Intl !== "undefined" && Intl.Segmenter ? [...new Intl.Segmenter("tr", {granularity:"grapheme"}).segment(s.sembol)].map(x => x.segment).filter(x => x.trim()) : [s.sembol];
    if(parts.length) return parts;
  }
  return _seAI(s, d);
};
const _bsAI = buildScenes;
buildScenes = function(d){
  if(V.vk && V.vk.startsWith("ai:")){ const v = aiVid(V.vk.slice(3)); if(v){ V.vsc = {c:0, n:0}; return aiScenes(v); } V.vk = "full"; }
  return _bsAI(d);
};

const _vVideoAI = vVideo;
vVideo = function(){
  let h = _vVideoAI();
  const vs = aiVids();
  const mine = vs.length ? `<div class="page"><h3>Yapay zekâ videolarım</h3><div class="chips" role="group" aria-label="Yapay zekâ videoları">${vs.map(v => `<button class="chip" data-act="vsel" data-id="ai:${esc(v.id)}" aria-pressed="${V.vk === "ai:" + v.id}">🎬 ${esc(v.konu)}${v.tamam ? "" : " (yarım)"}</button>`).join("")}</div>${V.vk && V.vk.startsWith("ai:") && aiVid(V.vk.slice(3)) ? `<p class="small mute">${esc(aiVid(V.vk.slice(3)).sinif)} · ${aiVid(V.vk.slice(3)).bolum.length} bölüm · ${durTxt(V.scenes || [])}</p><div class="row">${!aiVid(V.vk.slice(3)).tamam && !GEN ? `<button class="btn" data-act="aidevam">Kalan bölümleri hazırla</button>` : ""}<button class="btn ghost" data-act="aisil">Bu videoyu sil</button></div>` : ""}</div>` : "";
  const busy = !!GEN;
  const prog = busy ? `<div class="bar" aria-hidden="true"><i style="width:${Math.round(100 * GEN.done / Math.max(1, GEN.total))}%"></i></div><p class="small" id="aiMsg" role="status">${esc(GEN.msg)}</p>` : `<p class="small mute" id="aiMsg" role="status"></p>`;
  const form = `<form class="page" id="vidForm"><h3>Yapay zekâ ile uzun video ders yap</h3>
    <p class="small mute">Konuyu yaz, Öğretmenim ${esc(sinifTxt())} seviyesine göre bölüm bölüm anlatan, arada oyunları olan uzun bir video hazırlasın. İlk bölümler hazır olunca izlemeye başlayabilirsin.</p>
    <div class="field"><label for="vtopic">Konu</label><input type="text" id="vtopic" placeholder="Örn. Osmanlı Devleti'nin kuruluşu, Fotosentez, Üslü sayılar" maxlength="100" ${busy ? "disabled" : ""}></div>
    <div class="field"><label for="vlen">Uzunluk</label><select id="vlen" ${busy ? "disabled" : ""}>${Object.entries(UZ).map(([k, x]) => `<option value="${k}" ${k === (store.get("vlen", "uzun")) ? "selected" : ""}>${x.ad}</option>`).join("")}</select></div>
    <button class="btn" type="submit" id="vidBtn" ${busy ? "disabled" : ""}>${busy ? "Hazırlanıyor..." : "Uzun videoyu hazırla"}</button>${prog}</form>`;
  h = h.replace(/<form class="page" id="vidForm">[\s\S]*?<\/form>/, form);
  return h.replace('<div class="stage"', mine + '<div class="stage"');
};

async function genSections(v, sample){
  const per = 3;
  while(v.bolum.length < v.plan.length){
    const from = v.bolum.length, part = v.plan.slice(from, from + per);
    GEN.msg = `Bölüm ${from + 1}–${from + part.length} / ${v.plan.length} yazılıyor...`; aiRefresh();
    const prev = v.bolum.slice(-1).map(x => x.b + ": " + x.m.slice(0, 200)).join("");
    const arr = await sample.json(`${v.sinif} öğrencisi için "${v.konu}" konulu uzun bir video dersin anlatım metnini yazıyorsun. Türkiye Yüzyılı Maarif Modeli'ne uygun, konuşma diliyle, sıcak bir öğretmen sesiyle yaz. Bilgiler kesin ve doğru olsun; emin olmadığın tarih, sayı veya isim yazma.
Dersin bölüm planı:
${v.plan.map((p, i) => `${i + 1}. ${p.b} — ${p.ozet}`).join("\n")}
${prev ? "Bir önceki bölüm şöyle bitti: " + prev + "\n" : ""}Şimdi yalnızca şu bölümleri yaz: ${part.map((p, i) => (from + i + 1) + ". " + p.b).join("; ")}.
Her bölüm 70-100 kelime olsun, önceki bölümleri tekrar etme, uygun yerde somut örnek ver. Yalnızca JSON dizisi döndür: [{"b":"bölüm başlığı","m":"anlatım metni","e":"bölümü anlatan 1-3 emoji"}]. Markdown kullanma.`, {cache:false, modelTier:"default"});
    const ok = (Array.isArray(arr) ? arr : []).filter(x => x && typeof x.b === "string" && typeof x.m === "string").slice(0, part.length);
    if(!ok.length) throw {code:"invalid_json"};
    ok.forEach(x => v.bolum.push({b:x.b.slice(0, 70), m:x.m.slice(0, 900), e:String(x.e || "").slice(0, 12)}));
    GEN.done = v.bolum.length + 1;
    aiSave(v); aiRefresh(true);
  }
  v.tamam = true; aiSave(v);
}
function aiSave(v){ const a = aiVids().filter(x => x.id !== v.id); a.unshift(v); saveAiVids(a); }
function aiRefresh(scenes){
  if(V.name !== "video") return;
  const v = GEN && aiVid(GEN.id);
  if(scenes && v && V.vk === "ai:" + v.id && V.scenes){
    const keep = V.scenes, fresh = aiScenes(v);
    // oynatma ve verilen cevaplar korunur; yalnızca yeni sahneler eklenir
    V.scenes = keep.filter(s => !s.wait).concat(fresh.slice(keep.filter(s => !s.wait).length));
    const waiting = keep[V.i] && keep[V.i].wait;
    if(waiting && V.scenes[V.i] && !V.scenes[V.i].wait && V.playing){ drawScene(); playScene(); }
  }
  const pos = window.scrollY; render(); window.scrollTo(0, pos);
}
async function runGen(v, sample){
  GEN = {id:v.id, konu:v.konu, total:v.plan.length + 1, done:v.bolum.length + 1, msg:"Hazırlanıyor..."};
  try{
    await genSections(v, sample);
    GEN = null; aiRefresh(true);
    const m = $("#aiMsg"); if(m) m.textContent = "Video tamamlandı. " + durTxt(aiScenes(v)) + ".";
  }catch(e){
    GEN = null; aiRefresh(true);
    const m = $("#aiMsg"); if(m) m.textContent = (aiErr(e) || "Durduruldu.") + " Hazırlanan bölümler kaydedildi; 'Kalan bölümleri hazırla' ile devam edebilirsin.";
  }
}

doVid = async function(){
  if(GEN) return;
  const topic = ($("#vtopic").value || "").trim(), len = $("#vlen").value, n = (UZ[len] || UZ.uzun).n;
  const msg = $("#aiMsg");
  if(!topic){ msg.textContent = "Önce bir konu yaz."; $("#vtopic").focus(); return; }
  store.set("vlen", len);
  const sample = await getSample();
  if(!sample){ msg.textContent = "Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir."; return; }
  GEN = {id:"", konu:topic, total:n + 1, done:0, msg:"Öğretmenim dersin planını çıkarıyor..."}; aiRefresh();
  try{
    const r = await sample.json(`${sinifTxt()} öğrencisi için "${topic}" konusunda ${n} bölümlük uzun bir video ders planla. Türkiye Yüzyılı Maarif Modeli'ne uygun olsun: merak uyandıran girişle başla, temel kavramlardan ayrıntıya ilerle, çözümlü örnekler ve günlük hayat bağlantısı kur, değer ve beceri bağlantısı ile bitir. Konu bu seviyeye uygun değilse seviyeye uygun yönünü anlat. Bilgiler kesin ve doğru olsun.
Ayrıca videonun içinde oynanacak ${Math.ceil(n / 2) + 2} adet 4 şıklı soru yaz; sorular anlatılan bölümlere dayansın.
Yalnızca JSON nesnesi döndür: {"baslik":"videonun kısa başlığı","bolumler":[{"b":"bölüm başlığı","ozet":"bu bölümde anlatılacakların tek cümlelik özeti"}],"sorular":[{"q":"soru","o":["A","B","C","D"],"a":0}],"ozet":"dersin 2-3 cümlelik özeti"}. "a" doğru şıkkın 0'dan başlayan sırasıdır. Markdown kullanma.`, {cache:false, modelTier:"default"});
    const plan = (r && Array.isArray(r.bolumler) ? r.bolumler : []).filter(x => x && typeof x.b === "string").slice(0, n).map(x => ({b:x.b.slice(0, 70), ozet:String(x.ozet || "").slice(0, 200)}));
    if(plan.length < 2) throw {code:"invalid_json"};
    const sorular = (Array.isArray(r.sorular) ? r.sorular : []).filter(q => q && typeof q.q === "string" && Array.isArray(q.o) && q.o.length >= 2 && Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length).map(q => ({q:q.q.slice(0, 220), o:q.o.slice(0, 4).map(o => String(o).slice(0, 90)), a:q.a})).filter(q => q.a < q.o.length);
    const v = {id:Date.now().toString(36), konu:String(r.baslik || topic).slice(0, 80) || topic, sinif:sinifTxt(), plan, bolum:[], sorular, ozet:String(r.ozet || "").slice(0, 400), tamam:false};
    aiSave(v);
    if(V.name === "video"){ clearT(); V.vk = "ai:" + v.id; V.scenes = null; V.i = 0; V.playing = false; V.ended = false; }
    await runGen(v, sample);
  }catch(e){
    GEN = null; aiRefresh();
    const m = $("#aiMsg"); if(m) m.textContent = aiErr(e) || "Durduruldu.";
  }
};
ACT.aidevam = async () => {
  if(GEN || !V.vk || !V.vk.startsWith("ai:")) return;
  const v = aiVid(V.vk.slice(3)), sample = await getSample();
  if(!v) return; if(!sample){ const m = $("#aiMsg"); if(m) m.textContent = "Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir."; return; }
  await runGen(v, sample);
};
ACT.aisil = () => {
  if(!V.vk || !V.vk.startsWith("ai:")) return;
  const id = V.vk.slice(3); if(GEN && GEN.id === id) return;
  saveAiVids(aiVids().filter(x => x.id !== id));
  clearT(); V.vk = "full"; V.scenes = null; V.i = 0; V.playing = false; V.ended = false; render();
};
const _dersAI = ACT.ders;
ACT.ders = d => { if(V.name === "video" && V.vk && V.vk.startsWith("ai:")) V.vk = "full"; _dersAI(d); };

// Uzun metinler: sesi cümle cümle oku (tarayıcılar uzun konuşmaları yarıda kesebiliyor); hazırlanan bölümü bekle.
playScene = function(){
  clearT();
  const s = V.scenes[V.i], g = s.game, txt = s.baslik + ". " + s.metin;
  if(s.wait){ timers.push(setTimeout(() => { if(V.playing && V.scenes[V.i] && V.scenes[V.i].wait && !GEN){ V.playing = false; drawScene(); } }, 4000)); return; }
  if(V.voice && "speechSynthesis" in window && s.pick == null){
    try{ (txt.match(/[^.!?…]+[.!?…]*/g) || [txt]).map(x => x.trim()).filter(Boolean).forEach(p => { const u = new SpeechSynthesisUtterance(p); u.lang = "tr-TR"; u.rate = 1.02; speechSynthesis.speak(u); }); }catch(e){}
  }
  if(g && s.pick == null) return;
  timers.push(setTimeout(() => {
    if(V.i < V.scenes.length-1){ V.i++; drawScene(); playScene(); }
    else { V.playing = false; V.ended = true; drawScene(); }
  }, g ? 2500 : txt.length*80 + 3500));
};
const _drawAI = drawScene;
drawScene = function(){
  _drawAI();
  const st = $("#stage"), s = V.scenes && V.scenes[V.i]; if(!st || !s) return;
  const p = st.querySelector("p"); if(p && s.metin.length > 320){ p.style.fontSize = "15px"; p.style.textAlign = "left"; }
  const sg = $("#segs"); if(sg) sg.style.gap = V.scenes.length > 24 ? "2px" : "";
  const c = $("#vcount"); if(c) c.textContent = `Sahne ${V.i + 1} / ${V.scenes.length}`;
};
const _vVideoAI2 = vVideo;
vVideo = () => _vVideoAI2().replace('<div class="segs" id="segs" aria-hidden="true"></div>', '<div class="segs" id="segs" aria-hidden="true"></div><p class="small mute" id="vcount" style="text-align:center"></p>');
