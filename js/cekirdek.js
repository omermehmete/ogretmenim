/* ---------- yardımcılar ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k, d){ try{ const v = localStorage.getItem("ogt_"+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("ogt_"+k, JSON.stringify(v)); }catch(e){} }
};
const rnd = (a, b) => Math.floor(Math.random()*(b-a+1))+a;
const pick1 = a => a[Math.floor(Math.random()*a.length)];
function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }

const KAD = {
  ilk:{ad:"İlkokul", s:[1,2,3,4]}, orta:{ad:"Ortaokul", s:[5,6,7,8]},
  lise:{ad:"Lise", s:[9,10,11,12]}, uni:{ad:"Üniversite", s:[1,2,3,4]}
};
let U = store.get("user", null);
let P = store.get("prog", {xp:0, solved:0, best:{}});
let V = {name: U ? "home" : "login"};
let T = {ders:"mix"};
let H = [];            // Öğretmenim sohbeti
let PENDING = null;    // sohbete otomatik gönderilecek soru
let timers = [];
let draft = {kad:"ilk", sinif:1, ad:"", okul:""};

// Her hesabın puanı, profil resmi ve defteri kendi anahtarında durur (örn. "prog:elif_05").
const ukey = k => (U && U.kul) ? k + ":" + U.kul : k;
const saveP = () => store.set(ukey("prog"), P);
let P_SAHIP = null;
function syncUser(){
  const o = (U && U.kul) || "";
  if(o === P_SAHIP) return;
  P_SAHIP = o;
  // Eski sürümden kalan ortak kayıtlar, ilk giren hesaba taşınır.
  if(o) ["prog", "avatar", "defter"].forEach(k => { try{
    const eski = localStorage.getItem("ogt_" + k);
    if(eski != null && localStorage.getItem("ogt_" + k + ":" + o) == null) localStorage.setItem("ogt_" + k + ":" + o, eski);
    if(eski != null) localStorage.removeItem("ogt_" + k);
  }catch(e){} });
  P = store.get(ukey("prog"), null) || {xp:0, solved:0, best:{}};
  if(!P.best) P.best = {};
}
const dersler = () => DERS[U.kademe].filter(d => !d.only || d.only.includes(U.sinif)).map(d => {
  if(!d.s) return d;
  const x = d.s[U.sinif] || d.s[Object.keys(d.s)[0]];
  return Object.assign({id:d.id, ad:d.ad, sym:d.sym}, x);
});
const getDers = id => dersler().find(d => d.id === id);
const sinifTxt = () => KAD[U.kademe].ad + " " + U.sinif + ". sınıf";
function clearT(){ timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; try{ window.speechSynthesis && speechSynthesis.cancel(); }catch(e){} }
function go(name, extra){ clearT(); V = Object.assign({name}, extra||{}); render(); window.scrollTo(0,0); }
function ensureDers(mix){ if(!mix && (T.ders === "mix" || !getDers(T.ders))) T.ders = dersler()[0].id; if(mix && T.ders !== "mix" && !getDers(T.ders)) T.ders = "mix"; }
function dersList(){ return T.ders === "mix" ? dersler() : [getDers(T.ders) || dersler()[0]]; }
function dersAd(){ return T.ders === "mix" ? "Karışık" : (getDers(T.ders)||{}).ad; }
function chips(mix){
  ensureDers(mix);
  const l = (mix ? [{id:"mix", ad:"Karışık"}] : []).concat(dersler());
  return '<div class="chips" role="group" aria-label="Ders seç">' + l.map(d =>
    `<button class="chip" data-act="ders" data-id="${d.id}" aria-pressed="${T.ders===d.id}">${esc(d.ad)}</button>`).join("") + "</div>";
}
function prep(it){ const idx = shuffle(it[1].map((_,i)=>i)); return {q:it[0], o:idx.map(i=>it[1][i]), a:idx.indexOf(it[2])}; }
function addXP(n){ P.xp += n; saveP(); }

/* ---------- Claude (Öğretmenim) ---------- */
let _sample;
async function getSample(){
  if(_sample !== undefined) return _sample;
  try{ _sample = (window.claude && window.claude.use) ? await window.claude.use("sample") : null; }catch(e){ _sample = null; }
  return _sample;
}
function aiErr(e){
  const c = e && e.code;
  if(c === "not_granted") return "Öğretmenim'i kullanmak için Claude erişimine izin vermen gerekiyor.";
  if(c === "rate_limited") return "Çok sık istek gönderildi. Biraz bekleyip tekrar dene.";
  if(c === "cancelled") return "";
  if(c === "invalid_json") return "Yanıt okunamadı. Tekrar dene.";
  if(c === "sampling_disabled" || c === "not_declared" || c === "capability_disabled") return "Öğretmenim bu hesapta kullanılamıyor.";
  return "Bağlantı sorunu oldu. Birkaç saniye sonra tekrar dene.";
}
const SYS = () => `Türkiye Yüzyılı Maarif Modeli'ne uygun öğret: erdem-değer-eylem bütünlüğünü, beceri temelli ve günlük hayatla bağlantılı anlatımı gözet. Sen "Öğretmenim" adlı, Türkçe konuşan sabırlı bir yapay zekâ öğretmensin. Öğrenci: ${U.ad || "öğrenci"}, okul: ${U.okul}, seviye: ${sinifTxt()}. Anlatımı bu seviyeye uygun yap; kısa, net, adım adım ve örnekli anlat. Önce küçük bir ipucu ver, öğrenci isterse tam çözümü göster. Cevabın en fazla 120 kelime olsun, emoji kullanma. Okul ve öğrenme dışındaki konularda nazikçe derse dön.`;

/* ---------- görünümler ---------- */
function topbar(){
  return `<div class="top"><span class="brand"><span class="mark">Öğretmenim</span></span>
    <button class="who" data-act="profil" aria-label="Profil">${esc(U.ad || "Öğrenci")} · ${esc(KAD[U.kademe].ad)} ${U.sinif}</button></div>`;
}
function vLogin(){
  const k = draft.kad, ss = KAD[k].s;
  return `<div class="paper" style="margin-top:12px">
    <span class="up">${U ? "Profilini düzenle" : "Hoş geldin"}</span>
    <h1><span class="mark">Öğretmenim</span></h1>
    <p class="mute">Sınıfını ve okulunu seç. Sorular, oyunlar ve anlatımlar sınıf düzeyine göre hazırlanır.</p></div>
  <form class="page" id="loginForm" autocomplete="off">
    <div class="field"><label for="ad">Adın</label><input type="text" id="ad" value="${esc(draft.ad)}" placeholder="Örn. Elif" maxlength="40"></div>
    <div class="field"><label for="okul">Okul adı</label><input type="text" id="okul" value="${esc(draft.okul)}" placeholder="Örn. Atatürk İlkokulu" maxlength="80" required></div>
    <div class="field"><span style="font-weight:700;font-size:14px">Kademe</span>
      <div class="seg" role="group" aria-label="Kademe">${Object.keys(KAD).map(x => `<button type="button" data-act="kad" data-id="${x}" aria-pressed="${k===x}">${KAD[x].ad}</button>`).join("")}</div></div>
    <div class="field"><label for="sinif">Sınıf</label>
      <select id="sinif">${ss.map(s => `<option value="${s}" ${draft.sinif===s?"selected":""}>${s}. sınıf</option>`).join("")}</select></div>
    <button class="btn" type="submit">${U ? "Kaydet" : "Başla"}</button>
    ${U ? `<div class="row"><button class="btn ghost" type="button" data-act="home">Vazgeç</button><button class="btn ghost" type="button" data-act="reset">İlerlememi sıfırla</button></div>` : ""}
  </form>`;
}
function vHome(){
  const n = dersler().length;
  return `<div class="paper">
    <span class="up">${esc(U.okul)}</span>
    <h1>Merhaba${U.ad ? ", " + esc(U.ad) : ""}</h1>
    <p>${esc(sinifTxt())} için bugün ne çalışalım?</p>
    <div class="stats"><span class="stat"><b>${P.xp}</b> puan</span><span class="stat"><b>${P.solved}</b> soru çözüldü</span></div></div>
  <div class="tiles">
    <button class="tile" data-act="go" data-id="test"><span class="n">Test</span><h3>Ders testleri</h3><span class="small mute">${n} ders, her derste 20 soruluk test</span></button>
    <button class="tile" data-act="go" data-id="bilgi"><span class="n">Bilgi</span><h3>Bilgi yarışması</h3><span class="small mute">Süreli genel kültür</span></button>
    <button class="tile" data-act="go" data-id="oyun"><span class="n">Oyun</span><h3>Ders oyunları</h3><span class="small mute">6 oyun: eşleştir, adam asmaca, yıldırım turu ve daha fazlası</span></button>
    <button class="tile" data-act="go" data-id="mat"><span class="n">Konu anlatımı</span><h3>Konu anlatımları</h3><span class="small mute">Maarif temalarına göre, sınıfına özel</span></button>
    <button class="tile" data-act="go" data-id="video"><span class="n">Video ders</span><h3>Video anlatım</h3><span class="small mute">Her tema için ayrı video, içinde oyunlar</span></button>
    <button class="tile" data-act="hoca"><span class="n">Yapay zekâ</span><h3>Öğretmenim</h3><span class="small mute">Takıldığın her şeyi sor</span></button>
  </div>`;
}
const backBtn = (to, t) => `<button class="back" data-act="go" data-id="${to||"home"}">‹ ${t||"Ana sayfa"}</button>`;

function vTest(){
  const ds = dersList(), items = ds.flatMap(d => d.q).length;
  const best = P.best["test:"+T.ders];
  return backBtn() + `<h2>Ders <span class="mark">testleri</span></h2>` + chips(true) + `
  <div class="page">
    <span class="up">${esc(dersAd())}</span>
    ${T.ders !== "mix" ? `<h3>${esc(ds[0].konu)}</h3>` : `<h3>Tüm derslerden karışık sorular</h3>`}
    <p class="mute">${T.ders === "mix" ? "Karışık testte 20 soru gelir." : items + " soruluk hazır test var."}${best != null ? " En iyi sonucun: " + best + "." : ""}</p>
    <button class="btn" data-act="startTest">Testi başlat</button>
    <button class="btn ghost" id="genBtn" data-act="genTest">Öğretmenim'den 20 yeni soru iste</button>
    <p class="small mute" id="genMsg" role="status"></p>
  </div>`;
}
function startQuiz(title, items, o){
  clearT();
  V = Object.assign({name:"quiz"}, {Q:Object.assign({title, items, i:0, score:0, streak:0, sel:null, wrong:[], t0:Date.now(), limit:20000}, o)});
  render(); window.scrollTo(0,0);
}
function vQuiz(){
  const Q = V.Q;
  if(Q.i >= Q.items.length) return vResult();
  const it = Q.items[Q.i], ans = Q.sel != null;
  if(Q.timed && !ans){
    V.after = () => {
      const tk = setInterval(() => {
        const f = 1 - (Date.now() - Q.t0) / Q.limit, el = $("#tb");
        if(el) el.style.width = Math.max(0, f*100) + "%";
        if(f <= 0){ clearInterval(tk); pickAns(-1); }
      }, 100);
      timers.push(tk);
    };
  }
  let fb = "";
  if(ans){
    const ok = Q.sel === it.a;
    fb = `<div class="fb ${ok?"ok":"bad"}" role="status">${ok ? "Doğru!" : (Q.sel === -1 ? "Süre doldu." : "Yanlış.")} ${ok ? "" : "Doğru cevap: " + esc(it.o[it.a])}</div>
      <div class="row"><button class="btn" data-act="nextQ">${Q.i+1 === Q.items.length ? "Sonucu gör" : "Sonraki soru"}</button>
      ${ok ? "" : `<button class="btn ghost" data-act="explain">Öğretmenim anlatsın</button>`}</div>`;
  }
  return backBtn(Q.back, "Çık") + `<div class="page">
    <div class="row" style="justify-content:space-between"><span class="up">${esc(Q.title)}</span><span class="up">${Q.i+1} / ${Q.items.length}</span></div>
    <div class="bar" aria-hidden="true"><i style="width:${Q.i/Q.items.length*100}%"></i></div>
    ${Q.timed ? `<div class="bar" aria-label="Kalan süre"><i id="tb" style="width:${ans?0:100}%;transition:none"></i></div>` : ""}
    ${Q.ai ? '<p class="small mute">Bu sorular yapay zekâ ile üretildi.</p>' : ""}
    <p class="qtext">${esc(it.q)}</p>
    <div class="opts">${it.o.map((o,i) => `<button class="opt${ans ? (i===it.a?" ok":(i===Q.sel?" bad":"")) : ""}" data-act="pick" data-i="${i}" ${ans?"disabled":""}>${esc(o)}</button>`).join("")}</div>
    ${fb}</div>`;
}
function pickAns(i){
  const Q = V.Q; if(Q.sel != null) return;
  clearT(); Q.sel = i;
  const it = Q.items[Q.i];
  if(i === it.a){ Q.score++; Q.streak++; addXP(10 + (Q.timed && Q.streak > 1 ? 5 : 0)); }
  else { Q.streak = 0; Q.wrong.push(it); }
  P.solved++; saveP(); render();
}
function vResult(){
  const Q = V.Q, n = Q.items.length, r = Q.score / n;
  const key = Q.key;
  if(key && !Q.saved){ Q.saved = true; if((P.best[key] ?? -1) < Q.score){ P.best[key] = Q.score; saveP(); } }
  const msg = r === 1 ? "Mükemmel, hepsi doğru!" : r >= .7 ? "Çok iyi gidiyorsun." : r >= .4 ? "İyi bir başlangıç. Tekrar dene." : "Sorun değil, konu özetine bakıp yeniden dene.";
  return `<div class="page"><span class="up">${esc(Q.title)}</span>
    <div class="big">${Q.score} / ${n}</div><p style="text-align:center;font-weight:700">${msg}</p>
    <p class="mute" style="text-align:center">Kazandığın puan toplam ${P.xp}.</p>
    <div class="row"><button class="btn" data-act="again">Tekrar çöz</button>
    ${Q.wrong.length ? `<button class="btn ghost" data-act="explainWrong">Yanlışlarımı anlat</button>` : ""}
    <button class="btn ghost" data-act="go" data-id="${Q.back}">Geri dön</button></div></div>`;
}
function vBilgi(){
  const best = P.best["bilgi"];
  return backBtn() + `<h2><span class="mark">Bilgi</span> yarışması</h2>
  <div class="page"><span class="up">${esc(KAD[U.kademe].ad)} seviyesi</span>
    <h3>Her soru için 20 saniyen var</h3>
    <p class="mute">Üst üste doğrular bonus puan kazandırır. 20 soru: genel kültür ve ders soruları.${best != null ? " En iyi sonucun: " + best + " / 20." : ""}</p>
    <button class="btn" data-act="startBilgi">Yarışmayı başlat</button>
    <button class="btn ghost" id="genBtn" data-act="genBilgi">Öğretmenim'den yeni bilgi soruları</button>
    <p class="small mute" id="genMsg" role="status"></p></div>`;
}
async function genQuestions(topic, n, label){
  const msg = $("#genMsg"), btn = $("#genBtn");
  const sample = await getSample();
  if(!sample){ msg.textContent = "Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir."; return null; }
  btn.disabled = true; msg.textContent = "Öğretmenim sorular hazırlıyor...";
  try{
    const arr = await sample.json(`Türkiye Yüzyılı Maarif Modeli'ne uygun (beceri temelli, günlük hayatla bağlantılı), ${sinifTxt()} öğrencisi için ${topic} hakkında ${n} adet 4 şıklı çoktan seçmeli soru yaz. Sorular birbirinden farklı olsun, tek doğru cevabı olsun, doğru cevap hesaplanabilir ve kesin olsun. Yalnızca JSON dizisi döndür. Örnek biçim: [{"q":"2+3 kaçtır?","o":["4","5","6","7"],"a":1}] (a = doğru şıkkın 0 tabanlı sırası).`, {cache:false, modelTier:"default"});
    const ok = (Array.isArray(arr) ? arr : []).filter(x => x && typeof x.q === "string" && Array.isArray(x.o) && x.o.length === 4 && Number.isInteger(x.a) && x.a >= 0 && x.a < 4);
    if(!ok.length) throw {code:"invalid_json"};
    msg.textContent = ""; btn.disabled = false;
    return ok.map(x => prep([x.q, x.o.map(String), x.a]));
  }catch(e){ msg.textContent = aiErr(e); btn.disabled = false; return null; }
}
/* ---------- oyunlar ---------- */
function vOyun(){
  return backBtn() + `<h2>Ders <span class="mark">oyunları</span></h2>` + chips(true) + `
  <div class="tiles">
    <button class="tile" data-act="game" data-id="mem"><span class="n">Hafıza</span><h3>Eşleştir</h3><span class="small mute">Terimi tanımıyla eşleştir (${esc(dersAd())})</span></button>
    <button class="tile" data-act="game" data-id="tf"><span class="n">Hızlı tur</span><h3>Doğru mu, yanlış mı?</h3><span class="small mute">İfadeye karar ver (${esc(dersAd())})</span></button>
    <button class="tile wide" data-act="game" data-id="calc"><span class="n">45 saniye</span><h3>Hızlı işlem</h3><span class="small">${esc(KAD[U.kademe].ad)} seviyesine uygun işlemleri süre bitmeden çöz.</span></button>
  </div>`;
}
function allOf(k){ return dersList().flatMap(d => d[k]); }
function vMem(){
  const G = V.G;
  if(!G){
    const pairs = T.ders === "mix" ? shuffle(allOf("m")).slice(0,6) : dersList()[0].m.slice(0,6);
    V.G = {cards: shuffle(pairs.flatMap((p,i) => [{p:i, t:p[0]}, {p:i, t:p[1]}])), flip:[], done:[], moves:0, lock:false};
  }
  const g = V.G, fin = g.done.length === g.cards.length;
  if(fin && !g.paid){ g.paid = true; g.xp = Math.max(10, 40 - (g.moves-6)*3); addXP(g.xp); }
  return backBtn("oyun", "Oyunlar") + `<div class="page"><div class="row" style="justify-content:space-between"><span class="up">Eşleştir · ${esc(dersAd())}</span><span class="up">${g.moves} hamle</span></div>
    <p class="mute small">İki kart aç: biri terim, diğeri onun tanımı olmalı.</p>
    <div class="mgrid">${g.cards.map((c,i) => {
      const done = g.done.includes(i), up = g.flip.includes(i);
      return `<button class="mc ${done?"done":up?"up2":""}" data-act="flip" data-i="${i}" ${done?"disabled":""} aria-label="${done||up?esc(c.t):"Kapalı kart"}">${done||up?esc(c.t):"?"}</button>`;
    }).join("")}</div>
    ${fin ? `<div class="fb ok">Hepsini buldun! ${g.moves} hamle, +${g.xp} puan.</div><div class="row"><button class="btn" data-act="game" data-id="mem">Yeni oyun</button></div>` : ""}</div>`;
}
function flipCard(i){
  const g = V.G; if(g.lock || g.flip.includes(i) || g.done.includes(i)) return;
  g.flip.push(i);
  if(g.flip.length === 2){
    g.moves++;
    const [a,b] = g.flip;
    if(g.cards[a].p === g.cards[b].p){ g.done.push(a,b); g.flip = []; }
    else { g.lock = true; timers.push(setTimeout(() => { g.flip = []; g.lock = false; if(V.name === "mem") render(); }, 900)); }
  }
  render();
}
function vTf(){
  if(!V.G){
    const items = T.ders === "mix" ? shuffle(allOf("tf")).slice(0,8) : shuffle(dersList()[0].tf);
    V.G = {items, i:0, score:0, sel:null};
  }
  const g = V.G, back = backBtn("oyun", "Oyunlar");
  if(g.i >= g.items.length){
    return back + `<div class="page"><span class="up">Doğru mu, yanlış mı? · ${esc(dersAd())}</span><div class="big">${g.score} / ${g.items.length}</div>
      <div class="row"><button class="btn" data-act="game" data-id="tf">Tekrar oyna</button></div></div>`;
  }
  const it = g.items[g.i], ans = g.sel != null, ok = ans && g.sel === it[1];
  return back + `<div class="page"><div class="row" style="justify-content:space-between"><span class="up">Doğru mu, yanlış mı?</span><span class="up">${g.i+1} / ${g.items.length}</span></div>
    <div class="bar"><i style="width:${g.i/g.items.length*100}%"></i></div>
    <p class="qtext">${esc(it[0])}</p>
    <div class="row"><button class="opt${ans?(it[1]===true?" ok":(g.sel===true?" bad":"")):""}" style="flex:1;text-align:center" data-act="tfpick" data-v="1" ${ans?"disabled":""}>Doğru</button>
    <button class="opt${ans?(it[1]===false?" ok":(g.sel===false?" bad":"")):""}" style="flex:1;text-align:center" data-act="tfpick" data-v="0" ${ans?"disabled":""}>Yanlış</button></div>
    ${ans ? `<div class="fb ${ok?"ok":"bad"}" role="status">${ok?"Doğru!":"Yanlış. Doğrusu: " + (it[1]?"Doğru":"Yanlış")}</div><button class="btn" data-act="tfnext">Devam</button>` : ""}</div>`;
}
function genCalc(){
  const k = U.kademe, t = rnd(0,3);
  if(k === "ilk"){
    if(t < 2){ const a = rnd(5,30), b = rnd(3,20); return [`${a} + ${b}`, a+b]; }
    if(t === 2){ const a = rnd(10,40), b = rnd(1,a); return [`${a} − ${b}`, a-b]; }
    const a = rnd(2,9), b = rnd(2,9); return [`${a} × ${b}`, a*b];
  }
  if(k === "orta"){
    if(t === 0){ const a = rnd(6,15), b = rnd(6,15); return [`${a} × ${b}`, a*b]; }
    if(t === 1){ const b = rnd(2,9), q = rnd(2,12); return [`${b*q} ÷ ${b}`, q]; }
    if(t === 2){ const p = pick1([10,20,25,50]), n = pick1([40,60,80,100,200]); return [`${n} sayısının %${p}'i`, n*p/100]; }
    const a = rnd(2,15); return [`${a}²`, a*a];
  }
  if(k === "lise"){
    if(t === 0){ const x = rnd(1,6); return [`x = ${x} için 2x² + 3`, 2*x*x+3]; }
    if(t === 1){ const x = rnd(1,9), b = rnd(1,9); return [`2x + ${b} = ${2*x+b} ise x`, x]; }
    if(t === 2){ const e = rnd(1,7); return [`log₂ ${2**e}`, e]; }
    const a = rnd(2,15); return [`√${a*a}`, a];
  }
  if(t === 0){ const n = rnd(5,31); return [`(${n.toString(2)})₂ onluk tabanda`, n]; }
  if(t === 1){ const a = rnd(1,5), k2 = rnd(1,5); return [`f(x) = ${a}x² için f′(${k2})`, 2*a*k2]; }
  if(t === 2){ const a = rnd(10,99), b = rnd(3,9); return [`${a} mod ${b}`, a % b]; }
  const n = rnd(4,12); return [`1 + 2 + … + ${n}`, n*(n+1)/2];
}
function vCalc(){
  if(!V.G) V.G = {end: Date.now()+45000, score:0, cur: genCalc(), over:false, paid:false};
  const g = V.G, back = backBtn("oyun", "Oyunlar");
  if(g.over){
    if(!g.paid){ g.paid = true; addXP(g.score*5); }
    return back + `<div class="page"><span class="up">Hızlı işlem</span><div class="big">${g.score}</div><p style="text-align:center;font-weight:700">doğru işlem · +${g.score*5} puan</p>
      <div class="row"><button class="btn" data-act="game" data-id="calc">Tekrar oyna</button></div></div>`;
  }
  V.after = () => {
    const tk = setInterval(() => {
      const left = Math.max(0, Math.ceil((g.end - Date.now())/1000)), el = $("#tl");
      if(el) el.textContent = left + " sn";
      if(g.end - Date.now() <= 0){ clearInterval(tk); g.over = true; render(); }
    }, 250);
    timers.push(tk);
    const i = $("#cin"); if(i) i.focus();
  };
  return back + `<div class="page"><div class="row" style="justify-content:space-between"><span class="up">Hızlı işlem</span><span class="up" id="tl">45 sn</span></div>
    <p class="qtext" id="cq" style="text-align:center;font-size:26px">${esc(g.cur[0])}</p>
    <form class="calc" id="calcForm"><input type="text" id="cin" inputmode="numeric" autocomplete="off" aria-label="Cevap" placeholder="?"><button class="btn" type="submit">Gönder</button></form>
    <p class="mute" style="text-align:center">Doğru: <b id="cs">${g.score}</b></p></div>`;
}
function doCalc(){
  const g = V.G, inp = $("#cin"); if(!g || g.over || !inp) return;
  const v = inp.value.trim().replace(",", ".");
  if(v === "") return;
  if(Number(v) === g.cur[1]){ g.score++; $("#cs").textContent = g.score; }
  g.cur = genCalc(); $("#cq").textContent = g.cur[0]; inp.value = ""; inp.focus();
}

/* ---------- materyal ---------- */
function vMat(){
  ensureDers(false);
  const d = getDers(T.ders);
  return backBtn() + `<h2>Konu <span class="mark">anlatımı</span></h2>` + chips(false) + `
  <div class="page"><span class="up">${esc(d.ad)} · ${esc(sinifTxt())} · ${d.p.length} tema</span><h3>${esc(d.konu)}</h3>
    ${d.kaynak ? `<p class="small mute">${esc(d.kaynak)}</p>` : ""}
    ${d.p.map(p => `<div class="note"><span class="sym">${esc(p[2])}</span><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p></div>`).join("")}
    <h3>Mini sözlük</h3>
    <div class="dl">${d.m.map(m => `<div><b>${esc(m[0])}</b><span>${esc(m[1])}</span></div>`).join("")}</div>
    <div class="row"><button class="btn" data-act="go" data-id="video">Videoyu izle</button><button class="btn ghost" data-act="goTest">Testini çöz</button></div>
  </div>
  <form class="page" id="matForm"><h3>Kendi konun için özet iste</h3>
    <div class="field"><label for="mtopic">Konu</label><input type="text" id="mtopic" placeholder="Örn. Fotosentez" maxlength="80"></div>
    <button class="btn" type="submit" id="matBtn">Öğretmenim özet hazırlasın</button>
    <div class="note" id="aiOut" role="status" style="white-space:pre-wrap;overflow-wrap:anywhere" hidden></div></form>`;
}
async function doMat(){
  const topic = $("#mtopic").value.trim(); if(!topic) return;
  const out = $("#aiOut"), btn = $("#matBtn");
  out.hidden = false; out.textContent = "Düşünüyor...";
  const sample = await getSample();
  if(!sample){ out.textContent = "Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir."; return; }
  btn.disabled = true;
  try{
    await sample(`${sinifTxt()} öğrencisi için "${topic}" konusunu Türkçe, 5 kısa maddede özetle. Her maddede kısa bir örnek ver. Emoji kullanma, başlık veya markdown işareti kullanma.`, {onText: ({text}) => { out.textContent = text; }});
  }catch(e){ out.textContent = (e && e.text ? e.text + "\n\n" : "") + aiErr(e); }
  btn.disabled = false;
}

/* ---------- video anlatım ---------- */
function buildScenes(d){
  return [{baslik:d.konu, metin:`${d.ad} dersi, ${KAD[U.kademe].ad.toLowerCase()} seviyesi. Hazırsan başlıyoruz.`, sembol:d.sym}]
    .concat(d.p.map(p => ({baslik:p[0], metin:p[1], sembol:p[2]})))
    .concat([{baslik:"Özet", metin:"Bugün şunları öğrendik: " + d.p.map(p => p[0]).join(", ") + ". Şimdi testi çözerek pekiştirebilirsin.", sembol:"✓"}]);
}
function vVideo(){
  ensureDers(false);
  const d = getDers(T.ders);
  if(!V.scenes){ V.scenes = buildScenes(d); V.i = 0; V.playing = false; }
  if(V.voice === undefined) V.voice = true;
  V.after = drawScene;
  const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent(`${d.konu} ${KAD[U.kademe].ad} ders anlatımı`);
  return backBtn() + `<h2><span class="mark">Video</span> anlatım</h2>` + chips(false) + `
  <div class="stage" id="stage" aria-live="polite"></div>
  <div class="segs" id="segs" aria-hidden="true"></div>
  <div class="row"><button class="btn ghost" data-act="vprev" aria-label="Önceki sahne">‹</button>
    <button class="btn" id="vplay" data-act="vplay">Oynat</button>
    <button class="btn ghost" data-act="vnext" aria-label="Sonraki sahne">›</button>
    <button class="btn ghost" id="vvoice" data-act="vvoice">Ses: açık</button></div>
  <p class="small mute">Sesli anlatım tarayıcının Türkçe sesini kullanır; ses yoksa sahneler yazıyla akar.</p>
  <form class="page" id="vidForm"><h3>Kendi konun için video ders iste</h3>
    <div class="field"><label for="vtopic">Konu</label><input type="text" id="vtopic" placeholder="Örn. Üçgenlerde açılar" maxlength="80"></div>
    <button class="btn" type="submit" id="vidBtn">Öğretmenim video ders hazırlasın</button>
    <p class="small mute" id="vMsg" role="status"></p></form>
  <a class="small" href="${yt}" target="_blank" rel="noopener" style="color:var(--accent);font-weight:700">YouTube'da bu konuyu ara ›</a>`;
}
function drawScene(){
  const st = $("#stage"); if(!st) return;
  const s = V.scenes[V.i];
  st.innerHTML = `<div class="s" style="font-size:${s.sembol.length > 4 ? 38 : 64}px">${esc(s.sembol)}</div><h3>${esc(s.baslik)}</h3><p>${esc(s.metin)}</p>`;
  $("#segs").innerHTML = V.scenes.map((_,i) => `<i class="${i <= V.i ? "on" : ""}"></i>`).join("");
  $("#vplay").textContent = V.playing ? "Duraklat" : (V.ended ? "Baştan oynat" : "Oynat");
  $("#vvoice").textContent = "Ses: " + (V.voice ? "açık" : "kapalı");
}
function playScene(){
  clearT();
  const s = V.scenes[V.i], txt = s.baslik + ". " + s.metin;
  if(V.voice && "speechSynthesis" in window){
    try{ const u = new SpeechSynthesisUtterance(txt); u.lang = "tr-TR"; u.rate = 1.02; speechSynthesis.speak(u); }catch(e){}
  }
  timers.push(setTimeout(() => {
    if(V.i < V.scenes.length-1){ V.i++; drawScene(); playScene(); }
    else { V.playing = false; V.ended = true; drawScene(); }
  }, txt.length*80 + 3500));
}
async function doVid(){
  const topic = $("#vtopic").value.trim(); if(!topic) return;
  const msg = $("#vMsg"), btn = $("#vidBtn");
  const sample = await getSample();
  if(!sample){ msg.textContent = "Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir."; return; }
  btn.disabled = true; msg.textContent = "Öğretmenim dersi hazırlıyor...";
  try{
    const arr = await sample.json(`${sinifTxt()} öğrencisi için "${topic}" konusunda 4 sahnelik kısa bir video ders yaz. Her sahne en fazla 35 kelime olsun ve konuşma diliyle, doğru bilgiyle yazılsın. Yalnızca JSON dizisi döndür: [{"baslik":"kısa başlık","metin":"anlatım","sembol":"en fazla 5 karakterlik simge veya formül"}]`, {modelTier:"default"});
    const ok = (Array.isArray(arr) ? arr : []).filter(x => x && typeof x.baslik === "string" && typeof x.metin === "string").slice(0,5);
    if(!ok.length) throw {code:"invalid_json"};
    clearT();
    V.scenes = [{baslik:topic, metin:"Hazırsan başlıyoruz.", sembol:"▶"}]
      .concat(ok.map(x => ({baslik:x.baslik.slice(0,60), metin:x.metin.slice(0,400), sembol:String(x.sembol || "•").slice(0,6)})))
      .concat(gameScenes(getDers(T.ders),3)).concat([{baslik:"Özet", metin:"Dersi bitirdik. Takıldığın yeri Öğretmenim'e sorabilirsin.", sembol:"✓"}]);
    V.i = 0; V.playing = false; V.ended = false;
    drawScene(); msg.textContent = "Hazır. Oynat'a bas.";
  }catch(e){ msg.textContent = aiErr(e); }
  btn.disabled = false;
}

/* ---------- Öğretmenim sohbeti ---------- */
let BUSY = false;
function vHoca(){
  V.after = () => {
    if(PENDING){ const t = PENDING; PENDING = null; sendMsg(t); }
    else window.scrollTo(0, document.body.scrollHeight);
  };
  const sug = ["Bu konuyu bana basitçe anlat", "Bana 3 soru sor", "Haftalık çalışma planı hazırla", "Sınav kaygısıyla nasıl başa çıkarım?"];
  return backBtn() + `<div class="paper"><span class="up">Yapay zekâ öğretmen</span><h2><span class="mark">Öğretmenim</span></h2>
    <p class="small">${esc(sinifTxt())} seviyesine göre anlatır. Yanıtlar yapay zekâ ile üretilir; önemli bilgileri ders kitabından da kontrol et.</p></div>
  <div class="chat">${H.map((m,i) => `<div class="msg ${m.role === "user" ? "u" : "a"}" ${i === H.length-1 && BUSY ? 'id="live"' : ""}>${esc(m.content) || "Düşünüyor..."}</div>`).join("")}</div>
  ${H.length ? "" : `<div class="chips">${sug.map(s => `<button class="chip" data-act="sug" data-t="${esc(s)}">${esc(s)}</button>`).join("")}</div>`}
  <form class="composer" id="chatForm"><input type="text" id="cq2" placeholder="Sorunu yaz..." autocomplete="off" aria-label="Sorun"><button class="btn" type="submit" ${BUSY ? "disabled" : ""}>Gönder</button></form>`;
}
async function sendMsg(text){
  text = (text || "").trim(); if(!text || BUSY) return;
  H.push({role:"user", content:text}, {role:"assistant", content:""});
  BUSY = true; render(); window.scrollTo(0, document.body.scrollHeight);
  const sample = await getSample();
  const last = () => H[H.length-1];
  if(!sample){ last().content = "Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir."; BUSY = false; if(V.name === "hoca") render(); return; }
  let turns = H.slice(0,-1).filter(m => m.content).slice(-10);
  while(turns.length && turns[0].role !== "user") turns.shift();
  try{
    const r = await sample([{role:"user", content:SYS()}].concat(turns), {cache:false, modelTier:"default",
      onText: ({text}) => { last().content = text; const el = $("#live"); if(el) el.textContent = text; window.scrollTo(0, document.body.scrollHeight); }});
    last().content = r.text;
  }catch(e){ last().content = ((e && e.text) ? e.text + "\n\n" : "") + (aiErr(e) || "Durduruldu."); }
  BUSY = false; if(V.name === "hoca") render();
}
function askTeacher(t){ PENDING = t; go("hoca"); }

/* ---------- eylemler ---------- */
function readDraft(){
  const a = $("#ad"), o = $("#okul"), s = $("#sinif");
  if(a) draft.ad = a.value; if(o) draft.okul = o.value; if(s) draft.sinif = Number(s.value);
}
const ACT = {
  go(d){ go(d.id); },
  home(){ go("home"); },
  hoca(){ go("hoca"); },
  profil(){ draft = {kad:U.kademe, sinif:U.sinif, ad:U.ad || "", okul:U.okul}; go("login"); },
  kad(d){ readDraft(); draft.kad = d.id; draft.sinif = KAD[d.id].s[0]; render(); },
  reset(){ P = {xp:0, solved:0, best:{}}; saveP(); go("home"); },
  ders(d){
    T.ders = d.id;
    if(V.name === "video"){ clearT(); V.scenes = null; V.i = 0; V.playing = false; V.ended = false; }
    render();
  },
  goTest(){ go("test"); },
  startTest(){
    const ds = dersList();
    const raw = T.ders === "mix" ? shuffle(ds.flatMap(d => d.q)).slice(0,20) : ds[0].q.slice();
    startQuiz(dersAd() + " testi", shuffle(raw).map(prep), {back:"test", key:"test:" + T.ders});
  },
  async genTest(){
    const topic = T.ders === "mix" ? "karışık okul dersleri" : `${dersAd()} dersi, konu: ${dersList()[0].konu}`;
    const items = await genQuestions(topic, 20);
    if(items) startQuiz(dersAd() + " · Öğretmenim soruları", items, {back:"test", ai:true});
  },
  startBilgi(){ startQuiz("Bilgi yarışması", shuffle(bilgiPool()).slice(0,20).map(prep), {back:"bilgi", key:"bilgi", timed:true}); },
  async genBilgi(){
    const items = await genQuestions("genel kültür (tarih, coğrafya, bilim, edebiyat karışık)", 20);
    if(items) startQuiz("Bilgi yarışması · yeni sorular", items, {back:"bilgi", timed:true, ai:true});
  },
  pick(d){ pickAns(Number(d.i)); },
  nextQ(){ const Q = V.Q; Q.i++; Q.sel = null; Q.t0 = Date.now(); render(); window.scrollTo(0,0); },
  again(){ const Q = V.Q; startQuiz(Q.title, shuffle(Q.items), {back:Q.back, key:Q.key, timed:Q.timed, ai:Q.ai}); },
  explain(){ const Q = V.Q, it = Q.items[Q.i]; askTeacher(`Şu soruyu açıklar mısın? "${it.q}" Şıklar: ${it.o.join(" / ")}. Doğru cevap: ${it.o[it.a]}. Neden doğru?`); },
  explainWrong(){ const Q = V.Q; askTeacher("Şu soruları yanlış yaptım, kısaca açıklar mısın?\n" + Q.wrong.slice(0,3).map(w => `- ${w.q} (doğru cevap: ${w.o[w.a]})`).join("\n")); },
  game(d){ clearT(); V = {name:d.id}; render(); window.scrollTo(0,0); },
  flip(d){ flipCard(Number(d.i)); },
  tfpick(d){ const g = V.G; if(g.sel != null) return; g.sel = d.v === "1"; const it = g.items[g.i]; if(g.sel === it[1]){ g.score++; addXP(5); } P.solved++; saveP(); render(); },
  tfnext(){ const g = V.G; g.i++; g.sel = null; render(); },
  vplay(){
    if(V.playing){ V.playing = false; clearT(); }
    else { if(V.ended){ V.i = 0; V.ended = false; } V.playing = true; playScene(); }
    drawScene();
  },
  vprev(){ if(V.i > 0){ V.i--; V.ended = false; drawScene(); if(V.playing) playScene(); } },
  vnext(){ if(V.i < V.scenes.length-1){ V.i++; drawScene(); if(V.playing) playScene(); } },
  vvoice(){ V.voice = !V.voice; if(!V.voice){ try{ speechSynthesis.cancel(); }catch(e){} } else if(V.playing) playScene(); drawScene(); },
  sug(d){ sendMsg(d.t); },
  vtema(d){ go("video", {vk:d.id}); }
};
function doLogin(){
  readDraft();
  if(!draft.okul.trim()) return;
  U = {ad:draft.ad.trim(), okul:draft.okul.trim(), kademe:draft.kad, sinif:draft.sinif};
  store.set("user", U); T.ders = "mix"; H = []; go("home");
}
function doChat(){ const i = $("#cq2"); const t = i.value; i.value = ""; sendMsg(t); }

/* ---------- çizim ve başlangıç ---------- */
function render(){
  syncUser();
  V.after = null;
  const views = {login:vLogin, home:vHome, test:vTest, quiz:vQuiz, bilgi:vBilgi, oyun:vOyun, mem:vMem, tf:vTf, calc:vCalc, mat:vMat, video:vVideo, hoca:vHoca, hang:vHang, scr:vScr, topluluk:vTop, defter:vDef, sinav:vSin};
  $("#app").innerHTML = (V.name === "login" ? "" : topbar()) + views[V.name]();
  $("#fab").hidden = (V.name === "login" || V.name === "hoca");
  if(V.after) V.after();
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if(!b || b.disabled) return;
  const f = ACT[b.dataset.act]; if(f) f(b.dataset, b);
});
document.addEventListener("submit", e => {
  e.preventDefault();
  const m = {loginForm:doLogin, chatForm:doChat, calcForm:doCalc, matForm:doMat, vidForm:doVid, defForm:doDef}[e.target.id];
  if(m) m();
});
