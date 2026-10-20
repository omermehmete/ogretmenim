/* ===== Video görselleri: konuya uygun resim kartı + kendi fotoğrafını ekleme ===== */
const EMOJI = [[/toplam|çıkar/,"➕|➖|🧮"],[/çarp/,"✖️|🧮|🔢"],[/kesir|payda/,"🍕|🍰|🥧"],[/yüzde|oran/,"💯|📊|🏷️"],[/üçgen|geometri|açı/,"📐|🔺|📏"],[/fonksiyon|denklem|logaritma/,"📈|🧮|📉"],[/hücre|çekirdek|kloroplast/,"🔬|🧫|🦠"],[/dna|kalıtım/,"🧬|🔬|🧫"],[/canlı|bitki|ağaç|fotosentez/,"🌱|🌳|🌻"],[/kedi|köpek|\bcat\b|\bdog\b|bird|fish|hayvan/,"🐱|🐶|🐦|🐟"],[/renk|\bred\b|blue|green|yellow/,"🎨|🌈|🖍️"],[/sayı|number/,"🔢|1️⃣|2️⃣|3️⃣"],[/güneş|dünya|gezegen|jüpiter|uzay/,"☀️|🌍|🪐"],[/\bsu\b|buz|sıvı|katı|gaz|buhar|madde|donma|erime/,"💧|🧊|☁️"],[/kuvvet|newton|hız|hareket|ivme|sürtünme/,"🚗|🍎|🏃"],[/elektrik|akım|devre/,"⚡|💡|🔌"],[/atom|element|periyodik|asit|baz|kimya/,"⚗️|🧪|🔬"],[/harita|ölçek|kuzey|yön|kıta/,"🗺️|🧭|🌐"],[/cumhuriyet|atatürk|1923|ankara|anayasa/,"🇹🇷|🏛️|📜"],[/özne|yüklem|nesne|cümle|sıfat|isim|fiil|hece|sözcük|noktalama/,"📖|✏️|🔤"],[/şiir|edeb|roman|sanat|deyim|atasözü/,"📚|🖋️|🎭"],[/algoritma|kod|program|döngü/,"💻|⚙️|🧩"],[/arz|talep|enflasyon|ekonomi|para|piyasa/,"💰|📈|🛒"],[/ortalama|medyan|sapma|veri|istatistik/,"📊|🎲|📉"],[/kaynak|alıntı|apa|makale|bilimsel/,"🎓|📑|🔎"],[/namaz|oruç|hac|zekât|dua|peygamber|allah|ahlak|sadaka|melek|ahiret/,"🕌|🌙|🤲"],[/tecvit|harf|okuma|kur'an/,"📖|🕌|🌙"]];
const EDEF = {mat:"🔢|📐",tur:"📖|✏️",fen:"🔬|🌍",ing:"🌐|🗣️",sos:"🏛️|🗺️",fiz:"⚛️|🚀",kim:"🧪|⚗️",biy:"🧬|🌿",edb:"📚|🖋️",alg:"💻|⚙️",eko:"💰|📈",ist:"📊|🎲",aka:"🎓|📑",dkab:"🕌|🌙",kur:"📖|🕌",hay:"🏡|🌱",ink:"🇹🇷|📜",tar:"⌛|📜",cog:"🌍|🗺️"};
const GRAD = ["#2457D6,#7FA5FF","#14804F,#8FE0B5","#B8741A,#FFD27A","#7A3FB5,#D3A8FF","#B93434,#FFA3A3"];
function sceneEmoji(s, d){
  const t = (s.baslik + " " + s.metin).toLocaleLowerCase("tr"), m = EMOJI.find(e => e[0].test(t));
  return (m ? m[1] : (EDEF[d.id] || "📘|✨")).split("|");
}
const phKey = (d, s) => "img:" + d.id + ":" + s.baslik;
function resizeImg(file, cb){
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const k = Math.min(1, 720 / Math.max(im.width, im.height)), c = document.createElement("canvas");
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    cb(c.toDataURL("image/jpeg", 0.7)); }; im.src = r.result; };
  r.readAsDataURL(file);
}
const _drawScene = drawScene;
drawScene = function(){
  _drawScene(); const st = $("#stage"); if(!st || !V.scenes) return;
  const s = V.scenes[V.i], d = getDers(T.ders); if(!d) return;
  const own = s.game ? null : store.get(phKey(d, s), null), em = sceneEmoji(s, d), g = GRAD[(V.i + em.length) % GRAD.length];
  const pic = own ? `<img src="${own}" alt="${esc(s.baslik)} fotoğrafı" style="max-height:170px;max-width:100%;border:5px solid var(--chalk);border-radius:6px;transform:rotate(-1deg)">`
    : `<div role="img" aria-label="${esc(s.baslik)} görseli" style="background:linear-gradient(135deg,${g});border:5px solid var(--chalk);border-radius:6px;padding:10px 18px;font-size:52px;line-height:1.2;letter-spacing:.1em;transform:rotate(-1deg);box-shadow:0 6px 14px rgba(0,0,0,.35)">${em.slice(0,4).join(" ")}</div>`;
  const sym = st.querySelector(".s"); if(sym) sym.style.fontSize = "26px";
  st.insertAdjacentHTML("afterbegin", pic);
  if(!s.game) st.insertAdjacentHTML("beforeend", `<div class="row" style="justify-content:center"><label class="chip" style="cursor:pointer;background:var(--card);color:var(--ink)">📷 ${own ? "Fotoğrafı değiştir" : "Kendi fotoğrafını ekle"}<input type="file" accept="image/*" id="vph" hidden></label>${own ? `<button class="chip" data-act="vphdel" style="color:var(--ink)">Kaldır</button>` : ""}</div>`);
};
ACT.vphdel = () => { const s = V.scenes[V.i], d = getDers(T.ders); try{ localStorage.removeItem("ogt_" + phKey(d, s)); }catch(e){} drawScene(); };
document.addEventListener("change", e => {
  if(e.target.id !== "vph" || !e.target.files[0]) return;
  const s = V.scenes[V.i], d = getDers(T.ders);
  resizeImg(e.target.files[0], url => { try{ localStorage.setItem("ogt_" + phKey(d, s), JSON.stringify(url)); }catch(x){ alert("Fotoğraf kaydedilemedi, hafıza dolu olabilir."); } drawScene(); });
});

/* ===== Uzun, fotoğraflı konu anlatımı ===== */
const lkey = (d, p) => "long:" + d.id + ":" + U.sinif + ":" + p[0];
function pic(d, b, em, k){
  const own = store.get(phKey(d, {baslik:b}), null), g = GRAD[(b.length) % GRAD.length];
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">` + (own
    ? `<img src="${own}" alt="${esc(b)} fotoğrafı" style="max-height:190px;max-width:100%;border:5px solid #fff;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.25)">`
    : `<div role="img" aria-label="${esc(b)} görseli" style="background:linear-gradient(135deg,${g});border:5px solid #fff;border-radius:6px;padding:8px 16px;font-size:44px;line-height:1.2;letter-spacing:.1em;box-shadow:0 4px 12px rgba(0,0,0,.25)">${em.slice(0,4).join(" ")}</div>`)
    + `<label class="chip small" style="cursor:pointer">📷 ${own ? "Fotoğrafı değiştir" : "Fotoğraf ekle"}<input type="file" accept="image/*" class="mph" data-k="${esc(b)}" hidden></label></div>`;
}
const _vMat2 = vMat;
vMat = function(){
  let h = _vMat2(); const d = getDers(T.ders); if(!d) return h;
  const old = d.p.map(p => `<div class="note"><span class="sym">${esc(p[2])}</span><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p></div>`).join("");
  const cards = d.p.map((p,i) => { const L = store.get(lkey(d,p), null);
    return `<div class="note">${pic(d, p[0], sceneEmoji({baslik:p[0], metin:p[1]}, d))}<span class="sym">${esc(p[2])}</span><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p>`
    + (p[3] ? `<div class="ex"><b>Örnek</b><p>${esc(p[3])}</p></div>` : "")
    + `<button class="btn ghost" data-act="vtema" data-id="k${i}">▶ Bu temanın videosunu izle</button>`
    + (L ? L.map(x => `<div class="note" style="background:var(--soft)">${pic(d, x.b, x.e ? [x.e] : sceneEmoji({baslik:x.b, metin:x.m}, d))}<h3>${esc(x.b)}</h3><p style="white-space:pre-wrap">${esc(x.m)}</p></div>`).join("") + `<button class="btn ghost" data-act="longgen" data-i="${i}" ${V.busy != null ? "disabled" : ""}>Yeniden hazırla</button>`
      : `<button class="btn" data-act="longgen" data-i="${i}" ${V.busy != null ? "disabled" : ""}>${V.busy === i ? "Hazırlanıyor..." : "Uzun anlatımı aç"}</button>`) + `</div>`; }).join("");
  const top = `<div class="row"><button class="btn" data-act="longall" ${V.busy != null ? "disabled" : ""}>${V.busy != null ? "Hazırlanıyor..." : "Tüm konuların uzun anlatımını hazırla"}</button></div><p class="small mute">Uzun anlatımı Öğretmenim hazırlar; her bölümde görsel ve fotoğraf ekleme alanı vardır. Hazırlananlar bu cihazda saklanır ve "Detaylı anlatım" videosunda izlenir.</p>`;
  return h.replace(old, top + cards);
};
async function genLong(d, i){
  const p = d.p[i], sample = await getSample();
  if(!sample){ alert("Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir."); return false; }
  V.busy = i; render();
  try{
    const arr = await sample.json(`${sinifTxt()} öğrencisi için "${d.ad} dersi: ${p[0]}" konusunu (kısa özet: ${p[1]}) Türkiye Yüzyılı Maarif Modeli'ne uygun, ayrıntılı ve uzun anlat; toplam 400-500 kelime olsun. Bilgi kesin ve doğru olsun. 6 bölüm yaz: Merak uyandıran giriş; Temel kavramlar; Ayrıntılı anlatım; Adım adım çözümlü örnek veya örnek olay; Günlük hayattan bağlantı; Değer ve beceri bağlantısı ile kısa özet. Her bölüm 60-90 kelime olsun. Yalnızca JSON dizisi döndür: [{"b":"bölüm başlığı","m":"anlatım","e":"bölümü anlatan 1-3 emoji"}]. Markdown kullanma.`, {cache:false, modelTier:"default"});
    const ok = (Array.isArray(arr) ? arr : []).filter(x => x && typeof x.b === "string" && typeof x.m === "string");
    if(!ok.length) throw {code:"invalid_json"};
    store.set(lkey(d,p), ok.slice(0,8).map(x => ({b:x.b.slice(0,70), m:x.m.slice(0,1000), e:String(x.e || "").slice(0,12)})));
    return true;
  }catch(e){ alert(aiErr(e) || "Bir sorun oldu."); return false; }
  finally{ V.busy = null; if(V.name === "mat") render(); }
}
ACT.longgen = async d => { if(V.busy != null) return; await genLong(getDers(T.ders), Number(d.i)); };
ACT.longall = async () => { if(V.busy != null) return; const ds = getDers(T.ders); for(let i = 0; i < ds.p.length; i++){ if(store.get(lkey(ds, ds.p[i]), null)) continue; if(!(await genLong(ds, i))) break; } };
document.addEventListener("change", e => {
  if(!e.target.classList || !e.target.classList.contains("mph") || !e.target.files[0]) return;
  const d = getDers(T.ders), b = e.target.dataset.k;
  resizeImg(e.target.files[0], url => { try{ localStorage.setItem("ogt_" + phKey(d, {baslik:b}), JSON.stringify(url)); }catch(x){ alert("Fotoğraf kaydedilemedi, hafıza dolu olabilir."); } if(V.name === "mat") render(); });
});

/* ===== Profil resmi ===== */
function avatar(sz, name){
  const img = store.get(ukey("avatar"), null), nm = (name != null ? name : (U && U.ad) || "").trim();
  const st = `width:${sz}px;height:${sz}px;border-radius:50%;flex:none;border:2px solid var(--line);`;
  return img ? `<img src="${img}" alt="Profil resmi" style="${st}object-fit:cover">`
    : `<span role="img" aria-label="Profil resmi yok" style="${st}display:inline-flex;align-items:center;justify-content:center;background:var(--accent);color:var(--accent-ink);font:800 ${Math.round(sz*.46)}px var(--f-display)">${esc((nm[0] || "Ö").toLocaleUpperCase("tr"))}</span>`;
}
function cropAvatar(file, cb){
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const n = Math.min(im.width, im.height), c = document.createElement("canvas"); c.width = c.height = 200;
    c.getContext("2d").drawImage(im, (im.width-n)/2, (im.height-n)/2, n, n, 0, 0, 200, 200); cb(c.toDataURL("image/jpeg", 0.8)); };
    im.src = r.result; };
  r.readAsDataURL(file);
}
const _topbar = topbar, _vLogin = vLogin, _vHome = vHome;
topbar = () => _topbar().replace('class="who"', 'class="who" style="display:flex;align-items:center;gap:8px"').replace('aria-label="Profil">', 'aria-label="Profil">' + avatar(24));
vHome = () => _vHome().replace("<h1>Merhaba", avatar(64) + "<h1>Merhaba");
vLogin = () => _vLogin().replace('<div class="field"><label for="ad">', `<div class="field" style="align-items:center;gap:8px">${avatar(88, draft.ad)}<div class="row" style="justify-content:center"><label class="chip" style="cursor:pointer">📷 Profil resmi seç<input type="file" accept="image/*" id="avin" hidden></label>${store.get(ukey("avatar"), null) ? `<button class="chip" type="button" data-act="avdel">Kaldır</button>` : ""}</div></div><div class="field"><label for="ad">`);
ACT.avdel = () => { readDraft(); try{ localStorage.removeItem("ogt_" + ukey("avatar")); }catch(e){} render(); };
document.addEventListener("change", e => {
  if(e.target.id !== "avin" || !e.target.files[0]) return;
  readDraft(); cropAvatar(e.target.files[0], url => { store.set(ukey("avatar"), url); render(); });
});
