/* ===== Sınıf topluluğu: farklı cihazlar Cloudflare sunucusu (worker.js, KV) üzerinden birbirini görür ===== */
const bulutVar = () => !!(GEMINI && GEMINI.proxy);
async function bulut(islem, veri){
  if(!bulutVar()) return null;
  try{
    const r = await fetch(GEMINI.proxy.replace(/\/+$/, "") + "/topluluk/" + islem, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(veri)});
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; }
}
const bulutKatil = (u, cls) => u && u.kul && bulut("katil", {okul:slug(u.okul), cls:cls || ckey(u), kul:u.kul, ad:u.ad || "", role:u.role === "ogretmen" ? "ogretmen" : "ogrenci", kademe:u.kademe, sinif:u.sinif, sube:u.sube});
const bulutUyeler = async u => ((await bulut("uyeler", {cls:ckey(u)})) || {}).uyeler || [];

// Öğrenci kayıt olunca / giriş yapınca sınıfına buluttan da katılır
const _jcB = joinClass;
joinClass = async function(){
  const r = await _jcB();
  if(isT() || !U || !U.sube) return r;
  await bulutKatil(U);
  const bu = (await bulutUyeler(U)).filter(x => x.role === "ogrenci" && x.kul !== U.kul).length;
  return {st: Math.max(bu, (r && r.st) || 0)};
};

// Üye listesi: bu cihaz + Claude veritabanı + bulut
const _lmB = loadMembers;
loadMembers = async function(){
  await _lmB();
  if(!U || !U.sube || !bulutVar()) return;
  if(!isT()) bulutKatil(U); // eski hesaplar da listeye girsin
  const bu = await bulutUyeler(U);
  if(!bu.length || !$("#mem2") || V.name !== "topluluk") return;
  const by = {};
  localMembers().forEach(x => by[x.kul] = x);
  bu.forEach(x => { if(x && x.kul && !by[x.kul]) by[x.kul] = x; });
  const m = Object.values(by).sort((a,b) => (a.role === "ogretmen" ? 0 : 1) - (b.role === "ogretmen" ? 0 : 1) || String(a.kul).localeCompare(b.kul));
  $("#mem2").innerHTML = `<h3>${m.length} üye · ${m.filter(x => x.role === "ogrenci").length} öğrenci</h3>` + m.map(x => `<div class="row" style="align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-block:8px"><span><b>${esc(x.ad || x.kul)}</b> <span class="mute small">@${esc(x.kul)}</span></span><span class="stat">${x.role === "ogretmen" ? "Öğretmen" : "Öğrenci"}</span></div>`).join("");
};

// Öğretmen okulun sınıflarını buluttan da görür
const _lcB = listClasses;
listClasses = async function(){
  const L = await _lcB(), out = {};
  L.forEach(c => out[clsKey(c)] = c);
  const r = await bulut("siniflar", {okul:slug(U.okul)});
  ((r && r.siniflar) || []).forEach(c => { if(c && KAD[c.kademe] && c.sube) out[clsKey(c)] = c; });
  return Object.values(out).sort((a,b) => clsAd(a).localeCompare(clsAd(b), "tr", {numeric:true}));
};

// Öğretmen bir sınıfa katılınca buluta da yazılır
const _katilB = ACT.katil;
ACT.katil = async d => { await _katilB(d); if(U && U.sube) await bulutKatil(U); if(V.name === "topluluk") loadMembers(); };

// Sınıfı değişen (profil) ya da silinen hesap eski sınıftan çıkarılır
const _dLB = doLogin;
doLogin = async function(){
  const eski = U && U.kul && U.sube ? {cls:ckey(U), kul:U.kul} : null;
  await _dLB();
  if(eski && U && (U.kul !== eski.kul || !U.sube || ckey(U) !== eski.cls)) bulut("ayril", eski);
};
const _silB = ACT.hesapSil;
ACT.hesapSil = () => { if(U && U.kul && U.sube) bulut("ayril", {cls:ckey(U), kul:U.kul}); _silB(); };
