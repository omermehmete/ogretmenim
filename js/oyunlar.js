/* ===== Maarif uyumlu genişletme: 20 soru, yeni oyunlar ===== */
const MAARIF_GENEL = "Türkiye Yüzyılı Maarif Modeli: erdem–değer–eylem bütünlüğü; kavramsal, sosyal-duygusal ve okuryazarlık becerileri.";
const MAARIF = {mat:["Sabır","Matematiksel akıl yürütme ve problem çözme"],tur:["Saygı","Okuryazarlık ve Türkçeyi doğru kullanma"],fen:["Sorumluluk","Bilimsel gözlem ve sorgulama"],ing:["Dostluk","İletişim ve yabancı dil okuryazarlığı"],sos:["Vatanseverlik","Harita okuryazarlığı ve zamanda düşünme"],fiz:["Dürüstlük","Analitik düşünme ve modelleme"],kim:["Sorumluluk","Veri yorumlama ve güvenli çalışma"],biy:["Sevgi","Sistem düşünme ve canlılara duyarlılık"],edb:["Saygı","Eleştirel ve estetik okuma"],alg:["Öz denetim","Algoritmik düşünme"],eko:["Adalet","Finansal okuryazarlık"],ist:["Dürüstlük","Veri okuryazarlığı"],aka:["Dürüstlük","Araştırma ve bilimsel etik"],dkab:["Saygı","Ahlaki muhakeme ve ortak yaşam"],kur:["Sabır","Okuma, anlama ve güzel okuma"],hay:["Sorumluluk","Öz yönetim ve sosyal katılım"],ink:["Vatanseverlik","Tarihsel düşünme ve kanıt kullanma"],tar:["Vatanseverlik","Tarihsel düşünme ve kronolojik düşünme"],cog:["Sorumluluk","Mekânsal düşünme ve harita okuryazarlığı"]};
const WORD = /^[A-Za-zÇĞİÖŞÜçğıöşü]{4,}$/;
(function(){
  const cut = (s,n) => s.length > n ? s.slice(0,n-1) + "…" : s;
  function expand(d){
    if(d._x || !d.q) return; d._x = 1;
    const out = d.q.slice(), m = d.m || [], seen = new Set(out.map(x => x[0]));
    const add = it => { if(!seen.has(it[0]) && out.length < 20){ seen.add(it[0]); out.push(it); } };
    const dist = (arr, k, ex) => shuffle(arr.filter(x => x !== ex)).slice(0,3);
    if(m.length >= 4){
      m.forEach(t => { const o = [t[1], ...dist(m.map(x=>x[1]), 3, t[1])]; add([`‘${t[0]}’ ne demektir?`, o, 0]); });
      m.forEach(t => { const o = [t[0], ...dist(m.map(x=>x[0]), 3, t[0])]; add([`‘${cut(t[1],70)}’ tanımı hangi kavrama aittir?`, o, 0]); });
    }
    (d.tf || []).forEach(t => add([`Bu ifade doğru mudur? ${t[0]}`, ["Doğru","Yanlış"], t[1] ? 0 : 1]));
    const p = d.p || [];
    p.forEach(c => { if(p.length < 3) return; const o = [cut(c[1],90), ...dist(p.map(x=>cut(x[1],90)), 3, cut(c[1],90))]; add([`‘${c[0]}’ konusuyla ilgili doğru bilgi hangisidir?`, o, 0]); });
    const T = (d.tf || []).filter(x => x[1]), F = (d.tf || []).filter(x => !x[1]);
    d._wrong = F.map(f => [ "Hangisi YANLIŞTIR?", [f[0], ...shuffle(T).slice(0,2).map(x=>x[0])], 0 ]).filter(x => x[1].length === 3);
    d.q = out; d._more = out.length;
  }
  Object.values(DERS).forEach(arr => arr.forEach(d => d.s ? Object.values(d.s).forEach(expand) : expand(d)));
})();
const mTxt = () => T.ders === "mix" ? "" : (() => { const k = MAARIF[T.ders] || ["Sorumluluk","Eleştirel düşünme"]; return `<div class="note"><span class="up">Maarif Modeli bağlantısı</span><p><b>Değer:</b> ${k[0]} · <b>Beceri:</b> ${k[1]}</p><p class="small mute">${MAARIF_GENEL}</p></div>`; })();
const _vTest = vTest, _vMat = vMat;
vTest = () => _vTest() + mTxt(); vMat = () => _vMat() + mTxt();
function bilgiPool(){ return GENEL[U.kademe].concat(dersler().flatMap(d => d.q)); }
vOyun = function(){
  const t = (id,n,h,s,w) => `<button class="tile${w?" wide":""}" data-act="${id.startsWith("q:")?"qgame":"game"}" data-id="${id.replace("q:","")}"><span class="n">${n}</span><h3>${h}</h3><span class="small ${w?"":"mute"}">${s}</span></button>`;
  return backBtn() + `<h2>Ders <span class="mark">oyunları</span></h2>` + chips(true) + `<div class="tiles">`
   + t("mem","Hafıza","Eşleştir","Terimi tanımıyla eşleştir") + t("tf","Hızlı tur","Doğru mu, yanlış mı?","İfadeye karar ver")
   + t("q:blitz","Yıldırım","Yıldırım turu","10 soru, süre sınırlı") + t("q:wrong","Dedektif","Yanlışı bul","3 ifadeden yanlış olanı seç")
   + t("hang","Kelime","Adam asmaca","Tanımdan terimi tahmin et") + t("scr","Kelime","Harf karması","Karışık harflerden terimi bul")
   + t("calc","45 saniye","Hızlı işlem",esc(KAD[U.kademe].ad) + " seviyesine uygun işlemler",1) + `</div>` + mTxt();
};
ACT.qgame = d => {
  const ds = dersList();
  if(d.id === "blitz") startQuiz("Yıldırım turu · " + dersAd(), shuffle(ds.flatMap(x => x.q)).slice(0,10).map(prep), {back:"oyun", timed:true});
  else { const w = shuffle(ds.flatMap(x => x._wrong || [])).slice(0,8); if(!w.length) return; startQuiz("Yanlışı bul · " + dersAd(), w.map(prep), {back:"oyun"}); }
};
const newWord = () => { const all = allOf("m"), f = all.filter(x => WORD.test(x[0])), t = pick1(f.length ? f : all), w = t[0].toLocaleUpperCase("tr"); let s = w; for(let i=0;i<9&&s===w;i++) s = shuffle([...w]).join(""); return {w, h:t[1], s}; };
vHang = function(){
  if(!V.G) V.G = Object.assign(newWord(), {g:[], l:6});
  const g = V.G, W = [...g.w], won = W.every(c => c === " " || g.g.includes(c)), lost = g.l <= 0, fin = won || lost;
  if(won && !g.paid){ g.paid = 1; addXP(15); P.solved++; saveP(); }
  return backBtn("oyun","Oyunlar") + `<div class="page"><div class="row" style="justify-content:space-between"><span class="up">Adam asmaca · ${esc(dersAd())}</span><span class="up">Can: ${"♥".repeat(Math.max(g.l,0))}</span></div>
  <p class="mute small">İpucu: ${esc(g.h)}</p><div class="big" style="font-size:34px;letter-spacing:.1em">${W.map(c => c === " " ? " " : (g.g.includes(c) || lost ? c : "_")).join(" ")}</div>`
  + (fin ? `<div class="fb ${won?"ok":"bad"}" role="status">${won ? "Bildin! +15 puan" : "Kelime: " + esc(g.w)}</div><button class="btn" data-act="game" data-id="hang">Yeni kelime</button>`
   : `<div class="chips">${[..."ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ"].map(c => `<button class="chip" data-act="hl" data-c="${c}" ${g.g.includes(c)?"disabled":""}>${c}</button>`).join("")}</div>`) + `</div>`;
};
ACT.hl = d => { const g = V.G; if(g.g.includes(d.c)) return; g.g.push(d.c); if(!g.w.includes(d.c)) g.l--; render(); };
vScr = function(){
  if(!V.G) V.G = Object.assign(newWord(), {r:0, s:0, res:null});
  const g = V.G, back = backBtn("oyun","Oyunlar");
  if(g.r >= 5) return back + `<div class="page"><span class="up">Harf karması · ${esc(dersAd())}</span><div class="big">${g.s} / 5</div><button class="btn" data-act="game" data-id="scr">Tekrar oyna</button></div>`;
  return back + `<div class="page"><div class="row" style="justify-content:space-between"><span class="up">Harf karması · ${esc(dersAd())}</span><span class="up">${g.r+1} / 5</span></div>
  <p class="mute small">İpucu: ${esc(g.h)}</p><div class="big" style="font-size:38px;letter-spacing:.12em">${esc(g.s)}</div>
  ${g.res == null ? `<input type="text" id="sc" autocomplete="off" aria-label="Cevabın"><button class="btn" data-act="scr">Kontrol et</button>` : `<div class="fb ${g.res?"ok":"bad"}" role="status">${g.res ? "Doğru! +8 puan" : "Doğrusu: " + esc(g.w)}</div><button class="btn" data-act="scrn">Devam</button>`}</div>`;
};
ACT.scr = () => { const g = V.G, v = ($("#sc").value || "").trim().toLocaleUpperCase("tr"); if(!v) return; g.res = v === g.w; if(g.res){ g.s++; addXP(8); } P.solved++; saveP(); render(); };
ACT.scrn = () => { const g = V.G; Object.assign(g, newWord(), {res:null, r:g.r+1}); render(); };

/* ===== Video: çok sayıda video + video içi oyunlar ===== */
const vList = d => [{id:"full",ad:"Tam ders"}].concat(d.p.map((p,i) => ({id:"k"+i, ad:(i+1) + ". " + (p[0].includes(":") ? p[0].split(":").slice(1).join(":").trim() : p[0])})), [{id:"uz",ad:"Detaylı anlatım"},{id:"soz",ad:"Mini sözlük"},{id:"tfv",ad:"Doğru mu yanlış mı"},{id:"soru",ad:"Soru çözümü"}]);
const gMC = it => { const x = prep(it); return {baslik:"Oyun: Doğru şıkkı bul", metin:x.q, sembol:"?", game:{o:x.o, a:x.a}}; };
const gTF = t => ({baslik:"Oyun: Doğru mu, yanlış mı?", metin:t[0], sembol:"D/Y", game:{o:["Doğru","Yanlış"], a:t[1] ? 0 : 1}});
const gMT = (m, all) => { const o = shuffle([m[0]].concat(shuffle(all.filter(x => x[0] !== m[0])).slice(0,3).map(x => x[0]))); return {baslik:"Oyun: Terimi bul", metin:`“${m[1]}” hangi kavramdır?`, sembol:"Aa", game:{o, a:o.indexOf(m[0])}}; };
const gameScenes = (d, n) => shuffle(d.q).slice(0,n).map(gMC);
buildScenes = function(d){
  V.vsc = {c:0, n:0};
  const k = vList(d).some(x => x.id === V.vk) ? V.vk : "full"; V.vk = k;
  const sc = (b,m,s) => ({baslik:b, metin:m, sembol:s}), EX = d.p.map(p => p[3] ? sc("Örnek: " + p[0], p[3], "✎") : null), PS = d.p.map(p => sc(p[0],p[1],p[2])), tfs = shuffle(d.tf || []), m = d.m || [];
  const end = sc("Özet","Video bitti. Oyun puanın aşağıda. İstersen bir sonraki videoya geçebilirsin.","✓"); end.sum = 1;
  let a;
  if(k === "full") a = [sc(d.konu, `${d.ad} dersi, ${sinifTxt()}. Bu videoda ${d.p.length} tema var. Her temadan sonra çözümlü bir örnek ve bir oyun seni bekliyor.`, d.sym)].concat(...PS.map((s,i) => [s, EX[i], gMC(pick1(d.q))].filter(Boolean)), tfs.slice(0,1).map(gTF), gameScenes(d,2));
  else if(k[0] === "k"){ const i = +k.slice(1); a = [sc(d.p[i][0], `${d.ad}, ${sinifTxt()}. Bu temayı öğrenip çözümlü örnekle ve oyunlarla pekiştirelim.`, d.p[i][2]), PS[i], EX[i]].filter(Boolean).concat(gameScenes(d,2), tfs.slice(0,1).map(gTF)); }
  else if(k === "uz"){ a = [sc(d.konu, "Detaylı anlatım. Her bölümden sonra kısa bir oyun var.", d.sym)]; let n = 0; d.p.forEach(p => (store.get("long:" + d.id + ":" + U.sinif + ":" + p[0], null) || []).forEach(x => { a.push(sc(x.b, x.m, x.e || "•")); if(++n % 2 === 0) a.push(gMC(pick1(d.q))); })); if(!n) a.push(sc("Henüz hazır değil", "Konu özetleri sayfasında Uzun anlatımı aç düğmesine basarak bu videoyu hazırlayabilirsin.", "📚")); }
  else if(k === "soz"){ a = [sc("Mini sözlük","Önemli terimleri öğreniyoruz. Arada oyun var.","Aa")]; m.forEach((t,i) => { a.push(sc(t[0], t[1], "•")); if(i % 2 === 1) a.push(gMT(t, m)); }); }
  else if(k === "tfv") a = [sc("Doğru mu, yanlış mı?","İfadelere karar ver. Hazır mısın?","D/Y")].concat(tfs.map(gTF), gameScenes(d,2));
  else a = [sc("Soru çözümü","Şimdi birlikte soru çözüyoruz. Cevabı seç, doğrusunu hemen göreceksin.","?")].concat(gameScenes(d,6));
  return a.concat([end]);
};
const _vVideo = vVideo;
vVideo = () => { const h = _vVideo(), d = getDers(T.ders);
  return h.replace('<div class="stage"', `<div class="chips" role="group" aria-label="Video seç">${vList(d).map(x => `<button class="chip" data-act="vsel" data-id="${x.id}" aria-pressed="${V.vk === x.id}">${esc(x.ad)}</button>`).join("")}</div><p class="small mute">${esc(d.ad)} · ${esc(sinifTxt())} · ${vList(d).length} video · hepsinde oyun var</p><div class="stage"`); };
drawScene = function(){
  const st = $("#stage"); if(!st) return;
  const s = V.scenes[V.i], g = s.game, ans = s.pick != null;
  st.innerHTML = `<div class="s" style="font-size:${s.sembol.length > 4 ? 38 : 64}px">${esc(s.sembol)}</div><h3>${esc(s.baslik)}</h3><p>${esc(s.metin)}</p>`
    + (g ? `<div class="opts" style="width:100%">${g.o.map((o,i) => `<button class="opt${ans ? (i === g.a ? " ok" : i === s.pick ? " bad" : "") : ""}" data-act="vg" data-i="${i}" ${ans ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>` + (ans ? `<p role="status"><b>${s.pick === g.a ? "Doğru! +5 puan" : "Doğrusu: " + esc(g.o[g.a])}</b></p>` : "") : "")
    + (s.sum && V.vsc ? `<p><b>Oyun puanın: ${V.vsc.c} / ${V.vsc.n}</b></p>` : "");
  $("#segs").innerHTML = V.scenes.map((_,i) => `<i class="${i <= V.i ? "on" : ""}"></i>`).join("");
  $("#vplay").textContent = V.playing ? "Duraklat" : (V.ended ? "Baştan oynat" : "Oynat");
  $("#vvoice").textContent = "Ses: " + (V.voice ? "açık" : "kapalı");
};
playScene = function(){
  clearT();
  const s = V.scenes[V.i], g = s.game, txt = s.baslik + ". " + s.metin;
  if(V.voice && "speechSynthesis" in window && s.pick == null){
    try{ const u = new SpeechSynthesisUtterance(txt); u.lang = "tr-TR"; u.rate = 1.02; speechSynthesis.speak(u); }catch(e){}
  }
  if(g && s.pick == null) return;
  timers.push(setTimeout(() => {
    if(V.i < V.scenes.length-1){ V.i++; drawScene(); playScene(); }
    else { V.playing = false; V.ended = true; drawScene(); }
  }, g ? 2500 : txt.length*80 + 3500));
};
ACT.vsel = d => { clearT(); V.vk = d.id; V.scenes = null; V.i = 0; V.playing = false; V.ended = false; render(); };
ACT.vg = d => {
  const s = V.scenes[V.i]; if(!s.game || s.pick != null) return;
  V.vsc = V.vsc || {c:0, n:0}; s.pick = Number(d.i); V.vsc.n++; P.solved++;
  if(s.pick === s.game.a){ V.vsc.c++; addXP(5); } else saveP();
  drawScene(); if(V.playing) playScene();
};
