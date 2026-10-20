/* ===== Öğretmen modu, kullanıcı adı, sınıf topluluğu, ders defteri, sınav soruları ===== */
const MQ=[["2x² − 5x − 3 = 0 denkleminin pozitif kökü kaçtır?",3],["144 sayısının kaç tane pozitif böleni vardır?",15],["Ardışık üç tek sayının toplamı 75 ise bu sayıların en büyüğü kaçtır?",27],["Bir ürün %20 zamlandıktan sonra 360 TL oldu. Zamdan önceki fiyatı kaç TL idi?",300],["5! ÷ 3! + 2³ işleminin sonucu kaçtır?",28],["İlk terimi 4, ortak farkı 3 olan aritmetik dizinin 20. terimi kaçtır?",61]];
const isT=()=>U&&U.role==="ogretmen";
const slug=s=>String(s).toLocaleLowerCase("tr").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const ckey=u=>slug(u.okul)+"_"+u.kademe+u.sinif+"_"+slug(u.sube||"a");
let JOIN=null;
async function cap(n){try{return window.claude&&window.claude.use?await window.claude.use(n):null}catch(e){return null}}
async function myId(){const u=await cap("user");return u?await u.id():null}
function ensureDraft(){
  if(draft.role==null)draft.role=U?(U.role||"ogrenci"):"ogrenci";
  if(draft.kul==null)draft.kul=(U&&U.kul)||"";
  if(draft.sube==null)draft.sube=(U&&U.sube)||"";
  if(draft.mq==null)draft.mq=rnd(0,MQ.length-1);
  draft.dogru=draft.dogru||"";draft.err=draft.err||"";
}
readDraft=function(){const g=i=>{const e=$("#"+i);return e?e.value:null};let v;
  if((v=g("ad"))!=null)draft.ad=v;if((v=g("okul"))!=null)draft.okul=v;if((v=g("sinif"))!=null)draft.sinif=Number(v);
  if((v=g("kul"))!=null)draft.kul=v;if((v=g("sifre"))!=null)draft.sifre=v;if((v=g("sifre2"))!=null)draft.sifre2=v;if((v=g("sube"))!=null)draft.sube=v;if((v=g("dogru"))!=null)draft.dogru=v;};
const _vL2=vLogin;
vLogin=()=>{ensureDraft();let h=_vL2();
  const seg=(id,t)=>`<button type="button" data-act="rol" data-id="${id}" aria-pressed="${draft.role===id}">${t}</button>`;
  const verified=U&&U.role==="ogretmen"&&U.dogrulandi;
  const ver=draft.role==="ogretmen"&&!verified?`<div class="field" style="background:var(--soft);border-radius:12px;padding:12px"><label for="dogru">Öğretmen doğrulaması</label><p class="small">${esc(MQ[draft.mq][0])}</p><input type="text" id="dogru" inputmode="numeric" value="${esc(draft.dogru)}" placeholder="Cevabı yaz" autocomplete="off"></div>`:"";
  h=h.replace('<form class="page" id="loginForm" autocomplete="off">','<form class="page" id="loginForm" autocomplete="off"><div class="field"><span style="font-weight:700;font-size:14px">Ben</span><div class="seg" role="group" aria-label="Rol">'+seg("ogrenci","Öğrenciyim")+seg("ogretmen","Öğretmenim")+'</div></div>');
  h=h.replace('data-act="reset">İlerlememi sıfırla</button>','data-act="reset">İlerlememi sıfırla</button><button class="btn ghost" type="button" data-act="cikis">Çıkış yap</button>');{const A=Object.values(store.get("accounts",{}));if(false&&!U&&A.length)h=h.replace('<form class="page" id="loginForm"','<div class="page"><h3>Kayıtlı hesaplar</h3>'+A.map(a=>`<button type="button" class="opt" data-act="hesap" data-id="${esc(a.kul)}">${esc(a.ad||a.kul)} · @${esc(a.kul)} · ${a.role==="ogretmen"?"Öğretmen":"Öğrenci"}, ${esc(a.okul)} ${esc(a.sube||"")}</button>`).join("")+(draft.hid?`<div class="field"><label for="hpw">@${esc(draft.hid)} şifresi</label><input type="password" id="hpw" autocomplete="current-password"><div class="row"><button type="button" class="btn" data-act="hgir">Giriş yap</button></div>${draft.herr?`<p role="alert" style="color:var(--bad);font-weight:700">${esc(draft.herr)}</p>`:""}</div>`:"")+'</div><form class="page" id="loginForm"')}
  h=h.replace('<div class="field"><label for="okul">',`<div class="field"><label for="kul">Kullanıcı adı</label><input type="text" id="kul" value="${esc(draft.kul)}" placeholder="Örn. elif_05" maxlength="20" autocapitalize="none" required></div><div class="field"><label for="sifre">Şifre</label><input type="password" id="sifre" value="${esc(draft.sifre||"")}" placeholder="${U&&U.ph?"Değiştirmek istemezsen boş bırak":"En az 4 karakter"}" autocomplete="new-password"></div><div class="field"><label for="sifre2">Şifre (tekrar)</label><input type="password" id="sifre2" value="${esc(draft.sifre2||"")}" autocomplete="new-password"></div><div class="field"><label for="okul">`);
  h=h.replace('<button class="btn" type="submit">',`<div class="field"><label for="sube">Sınıf adı (şube)</label><input type="text" id="sube" value="${esc(draft.sube)}" placeholder="Örn. 5-A" maxlength="10" required></div>${ver}${draft.err?`<p role="alert" style="color:var(--bad);font-weight:700">${esc(draft.err)}</p>`:""}<button class="btn" type="submit">`);
  return h;};
ACT.hesap=d=>{readDraft();draft.hid=d.id;draft.herr="";render()};
ACT.hgir=async()=>{const d={id:draft.hid};const pw=($("#hpw")||{}).value||"";const a0=store.get("accounts",{})[d.id];if(a0&&a0.ph&&await sha(a0.kul+":"+pw)!==a0.ph){draft.herr="Şifre yanlış.";render();return}draft.hid=null;const a=store.get("accounts",{})[d.id];if(!a)return;U=a;store.set("user",U);T.ders="mix";H=[];JOIN=await joinClass();go("home")};
ACT.cikis=()=>{if(U&&U.kul){const A=store.get("accounts",{});A[U.kul]=U;store.set("accounts",A)}try{localStorage.removeItem("ogt_user")}catch(e){}U=null;JOIN=null;H=[];T.ders="mix";draft={kad:"ilk",sinif:1,ad:"",okul:"",role:"ogrenci",kul:"",sube:"",mq:rnd(0,MQ.length-1),dogru:"",err:""};go("login")};
ACT.rol=d=>{readDraft();draft.role=d.id;draft.err="";render();};
async function sha(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("ogt:"+s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
doLogin=async function(){
  readDraft();const d=draft,fail=m=>{d.err=m;render()};
  if(!d.okul.trim()||!d.sube.trim())return fail("Okul adı ve sınıf adı gerekli.");
  const kul=d.kul.trim().toLowerCase();
  if(!/^[a-z0-9_.]{3,20}$/.test(kul))return fail("Kullanıcı adı 3-20 karakter olmalı: a-z, rakam, _ ve . kullanabilirsin.");
  let ph=U&&U.ph&&U.kul===kul?U.ph:null;const pw=d.sifre||"";
  if(pw||!ph){if(pw.length<4)return fail("Şifre en az 4 karakter olmalı.");if(pw!==d.sifre2)return fail("İki şifre aynı değil.");ph=await sha(kul+":"+pw)}
  const ok=U&&U.role==="ogretmen"&&U.dogrulandi;
  if(d.role==="ogretmen"&&!ok&&Number(String(d.dogru).replace(/\s/g,""))!==MQ[d.mq][1]){
    d.mq=(d.mq+1+rnd(0,MQ.length-2))%MQ.length;d.dogru="";return fail("Doğrulama cevabı yanlış. Yeni bir soru geldi, tekrar dene.");}
  try{const db=await cap("db"),id=await myId();if(db&&id){const r=db.doc("users/"+kul),s=await r.get();
    if(s.exists&&s.data().uid!==id)return fail("Bu kullanıcı adı başkasında. Başka bir tane dene.");if(!s.exists)await r.set({uid:id});}}catch(e){}
  U={ad:d.ad.trim(),kul,okul:d.okul.trim(),kademe:d.kad,sinif:d.sinif,sube:d.sube.trim(),role:d.role,ph,dogrulandi:d.role==="ogretmen"};
  store.set("user",U);{const A=store.get("accounts",{});A[kul]=U;store.set("accounts",A)}T.ders="mix";H=[];d.err="";d.dogru="";d.sifre=d.sifre2="";
  JOIN=await joinClass();go("home");
};
async function joinClass(){try{const db=await cap("db"),id=await myId();if(!db||!id)return null;
  const c=db.collection("cls/"+ckey(U)+"/members"),sn=await c.get();
  const st=sn.docs.filter(x=>x.id!==id&&x.data().role==="ogrenci").length;
  await c.doc(id).set({kul:U.kul,ad:U.ad,role:U.role,t:Date.now()});return {st};}catch(e){return null}}
const _vH3=vHome;
vHome=()=>{let h=_vH3();
  const t=(a,n,x,s)=>`<button class="tile" data-act="go" data-id="${a}"><span class="n">${n}</span><h3>${x}</h3><span class="small mute">${s}</span></button>`;
  const more=(isT()?t("defter","Öğretmen","Ders defteri","Okul ders defterine not yaz")+t("sinav","Öğretmen","Sınav soruları","Soru seç, sınav kâğıdı indir"):"")+t("topluluk","Topluluk","Sınıf topluluğu",esc(U.sube||"Sınıfın")+" şubesi");
  h=h.replace(/<\/div>$/,more+'</div><button class="btn ghost" data-act="cikis" style="margin-top:4px">Çıkış yap</button>');
  const note=JOIN?`<div class="fb" style="background:var(--okbg);border-radius:12px;padding:12px 14px">${JOIN.st>0?`Sınıfında ${JOIN.st} öğrenci var. Sınıf topluluğuna eklendin.`:"Sınıf topluluğunu sen başlattın. Sınıftakiler katıldıkça burada görünecek."}</div>`:"";
  return h.replace('<div class="tiles">',note+'<div class="tiles">').replace('<span class="up">'+esc(U.okul)+'</span>','<span class="up">'+esc(U.okul)+(U.sube?" · "+esc(U.sube):"")+(isT()?" · Öğretmen":"")+'</span>');};
/* topluluk */
function vTop(){V.after=loadMembers;return `${backBtn()}<div class="paper"><span class="up">${esc(U.okul)} · ${esc(U.sube||"")}</span><h2>Sınıf topluluğu</h2><p class="mute small">${esc(sinifTxt())}, aynı okul ve şubedeki herkes</p></div><div class="page" id="mem2"><p class="mute">Yükleniyor…</p></div>`}
async function loadMembers(){const el=$("#mem2");try{const db=await cap("db");if(!db)throw 0;
  const sn=await db.collection("cls/"+ckey(U)+"/members").get(),m=sn.docs.map(x=>x.data()).sort((a,b)=>(a.role==="ogretmen"?0:1)-(b.role==="ogretmen"?0:1)||String(a.kul).localeCompare(b.kul));
  if(!$("#mem2")||V.name!=="topluluk")return;
  $("#mem2").innerHTML=`<h3>${m.length} üye · ${m.filter(x=>x.role==="ogrenci").length} öğrenci</h3>`+m.map(x=>`<div class="row" style="align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-block:8px"><span><b>${esc(x.ad||x.kul)}</b> <span class="mute small">@${esc(x.kul)}</span></span><span class="stat">${x.role==="ogretmen"?"Öğretmen":"Öğrenci"}</span></div>`).join("");
 }catch(e){if(el)el.innerHTML='<p class="mute">Topluluk için Claude hesabınla giriş yapmış olman gerekir.</p>'}}
/* ders defteri */
async function dLoad(){try{const db=await cap("db"),id=await myId();if(db&&id){const s=await db.collection("data/users/"+id).doc("defter").get();if(s.exists)return s.data().n||[]}}catch(e){}return store.get("defter",[])}
async function dSave(n){store.set("defter",n);try{const db=await cap("db"),id=await myId();if(db&&id)await db.collection("data/users/"+id).doc("defter").set({n})}catch(e){}}
function vDef(){if(!isT())return backBtn()+'<div class="page">Bu bölüm öğretmenlere özel.</div>';
  if(V.N==null)V.after=async()=>{V.N=await dLoad();if(V.name==="defter")render()};
  const N=V.N||[],ds=dersler();
  return `${backBtn()}<div class="paper"><span class="up">${esc(U.okul)} · ${esc(U.sube)}</span><h2>Ders defteri</h2><p class="mute small">Notların sadece sana görünür.</p></div>
  <form class="page" id="defForm" autocomplete="off"><div class="field"><label for="dt">Tarih</label><input type="text" id="dt" value="${new Date().toISOString().slice(0,10)}" placeholder="YYYY-AA-GG"></div>
  <div class="field"><label for="dd">Ders</label><select id="dd">${ds.map(x=>`<option>${esc(x.ad)}</option>`).join("")}</select></div>
  <div class="field"><label for="dk">Konu</label><input type="text" id="dk" maxlength="80" placeholder="Bugün işlenen konu"></div>
  <div class="field"><label for="dn">Not</label><textarea id="dn" rows="4" placeholder="Devamsızlık, ödev, öğrenci gözlemi, bir sonraki ders planı…"></textarea></div>
  <button class="btn" type="submit">Deftere yaz</button></form>
  ${V.N==null?'<p class="mute">Defter yükleniyor…</p>':N.map(x=>`<div class="page"><span class="up">${esc(x.t)} · ${esc(x.d)}</span>${x.k?`<h3>${esc(x.k)}</h3>`:""}<p style="white-space:pre-wrap">${esc(x.n)}</p><button class="btn ghost" data-act="ddel" data-id="${x.id}">Sil</button></div>`).join("")||'<p class="mute">Henüz not yok.</p>'}`}
async function doDef(){const v=i=>$("#"+i).value.trim();if(!v("dn"))return;const n=V.N||[];
  n.unshift({id:Date.now(),t:v("dt"),d:v("dd"),k:v("dk"),n:v("dn")});V.N=n;await dSave(n);render()}
ACT.ddel=d=>{V.N=(V.N||[]).filter(x=>String(x.id)!==d.id);dSave(V.N);render()};
/* sınav soruları */
function sinAll(){const d=getDers(T.ders);return d.q.concat((V.S.ex[d.id]||[]))}
function vSin(){if(!isT())return backBtn()+'<div class="page">Bu bölüm öğretmenlere özel.</div>';
  V.S=V.S||{ex:{},sel:{}};const d=getDers(T.ders||"x")||dersler()[0];ensureDers(false);const dd=getDers(T.ders),all=sinAll();
  const n=all.filter((_,i)=>V.S.sel[dd.id+":"+i]).length;
  return `${backBtn()}<div class="paper"><span class="up">${esc(sinifTxt())}</span><h2>Sınav soruları</h2><p class="mute small">Dersi seç, sınavda sormak istediklerini işaretle.</p></div>
  ${chips(false)}<div class="row"><button class="btn ghost" data-act="sinall">Tümünü seç</button><button class="btn ghost" data-act="sinai" ${V.busy?"disabled":""}>${V.busy?"Hazırlanıyor…":"Yapay zekâ ile 5 yeni soru"}</button></div><p class="small mute" id="sinMsg"></p>
  <div class="opts">${all.map((it,i)=>`<label class="opt" style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" data-sel="${dd.id}:${i}" ${V.S.sel[dd.id+":"+i]?"checked":""} style="margin-top:5px"><span>${i+1}. ${esc(it[0])}<br><span class="small mute">${it[1].map((x,j)=>"ABCD"[j]+") "+esc(x)).join(" · ")} · <b>Cevap: ${"ABCD"[it[2]]}</b></span></span></label>`).join("")}</div>
  <button class="btn" data-act="sindl" id="sinDl">Sınav kâğıdı indir (${n} soru)</button>`}
ACT.sinall=()=>{const dd=getDers(T.ders),all=sinAll();all.forEach((_,i)=>V.S.sel[dd.id+":"+i]=true);render()};
ACT.sinai=async()=>{const dd=getDers(T.ders),s=await getSample(),m=$("#sinMsg");if(!s){m.textContent="Yapay zekâ ayarlı değil. Ana sayfadaki ‘Yapay zekâ ayarı’ bölümünden Gemini API anahtarını gir.";return}
  V.busy=true;render();
  try{const arr=await s.json(`${sinifTxt()} için "${dd.ad}" dersi, konu: ${dd.konu}. Sınavda sorulabilecek, Türkiye Yüzyılı Maarif Modeli'ne uygun, beceri temelli 5 çoktan seçmeli soru yaz. Sadece JSON dizisi döndür: [{"q":"soru","o":["A","B","C","D"],"a":0}] (a doğru şıkkın indeksi, 4 şık).`);
    const ok=(Array.isArray(arr)?arr:[]).filter(x=>x&&typeof x.q==="string"&&Array.isArray(x.o)&&x.o.length===4&&Number.isInteger(x.a)&&x.a>=0&&x.a<4).map(x=>[x.q,x.o.map(String),x.a]);
    V.S.ex[dd.id]=(V.S.ex[dd.id]||[]).concat(ok);V.busy=false;render();
  }catch(e){V.busy=false;render();const mm=$("#sinMsg");if(mm)mm.textContent=aiErr(e)||"Soru üretilemedi."}};
ACT.sindl=async()=>{const dd=getDers(T.ders),all=sinAll().filter((_,i)=>V.S.sel[dd.id+":"+i]),m=$("#sinMsg");if(!all.length){m.textContent="Önce en az bir soru seç.";return}
  const q=all.map((it,i)=>`${i+1}. ${it[0]}\n`+it[1].map((x,j)=>`   ${"ABCD"[j]}) ${x}`).join("\n")).join("\n\n");
  const txt=`${U.okul} · ${U.sube}\n${dd.ad} Sınavı (${sinifTxt()})\nAd Soyad: ____________   Tarih: ________\n\n${q}\n\n--- CEVAP ANAHTARI ---\n${all.map((it,i)=>`${i+1}-${"ABCD"[it[2]]}`).join("  ")}\n`;
  const ad="sinav-"+slug(dd.ad)+".txt";
  try{const dl=await cap("downloads");if(!dl)throw 0;await dl.save({filename:ad,data:txt});}
  catch(e){
    // Claude dışında (ör. GitHub Pages) tarayıcının kendi indirmesini kullan
    try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+txt],{type:"text/plain;charset=utf-8"}));a.download=ad;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);m.textContent="Sınav kâğıdı indirildi: "+ad;return}catch(_){}
    try{await navigator.clipboard.writeText(txt);m.textContent="İndirme kapalı; sınav metni panoya kopyalandı."}catch(_){m.textContent="İndirme bu ortamda kullanılamıyor."}}};
document.addEventListener("change",e=>{const k=e.target.dataset&&e.target.dataset.sel;if(!k||!V.S)return;V.S.sel[k]=e.target.checked;
  const b=$("#sinDl");if(b){const dd=getDers(T.ders);b.textContent=`Sınav kâğıdı indir (${sinAll().filter((_,i)=>V.S.sel[dd.id+":"+i]).length} soru)`}});
/* ===== Çıkış yaparken hesabı silme seçeneği ===== */
const _cikis=ACT.cikis;
function modalKapat(){const m=document.getElementById("cikisModal");if(m)m.remove()}
ACT.cikis=()=>{
  if(!U||!U.kul)return _cikis();
  modalKapat();
  const m=document.createElement("div");m.id="cikisModal";
  m.style.cssText="position:fixed;inset:0;background:rgba(10,20,40,.55);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50";
  m.innerHTML=`<div class="page" role="dialog" aria-modal="true" aria-labelledby="cmT" style="max-width:420px;width:100%"><h3 id="cmT">Çıkış yapılsın mı?</h3>
    <p class="mute small">@${esc(U.kul)} hesabından çıkabilir ya da hesabı bu cihazdan tamamen silebilirsin. Silersen ilerlemen, puanların ve notların da gider; bu geri alınamaz.</p>
    <button class="btn" type="button" data-act="cikisTamam">Sadece çıkış yap</button>
    <button class="btn" type="button" data-act="hesapSil" style="background:var(--bad);color:#fff">Hesabı sil ve çık</button>
    <button class="btn ghost" type="button" data-act="modalKapat">Vazgeç</button></div>`;
  document.body.appendChild(m);
};
ACT.modalKapat=modalKapat;
ACT.cikisTamam=()=>{modalKapat();_cikis()};
ACT.hesapSil=()=>{
  const kul=U&&U.kul;modalKapat();
  if(kul){const A=store.get("accounts",{});delete A[kul];store.set("accounts",A)}
  ["prog","avatar","defter"].forEach(k=>{try{localStorage.removeItem("ogt_"+ukey(k))}catch(e){}});
  P={xp:0,solved:0,best:{}};U=null;_cikis();
};
document.addEventListener("keydown",e=>{if(e.key==="Escape")modalKapat()});

/* ===== Ders defteri: sadece doldurma notları, yalnızca bu cihazda ===== */
dLoad=async()=>store.get(ukey("defter"),[]);
dSave=async n=>{store.set(ukey("defter"),n)};
vDef=function(){
  if(!isT())return backBtn()+'<div class="page">Bu bölüm öğretmenlere özel.</div>';
  if(V.N==null)V.after=async()=>{V.N=await dLoad();if(V.name==="defter")render()};
  const N=V.N||[],ds=dersler();
  const f=(id,l,ph,rows)=>`<div class="field"><label for="${id}">${l}</label>${rows?`<textarea id="${id}" rows="${rows}" placeholder="${ph}"></textarea>`:`<input type="text" id="${id}" placeholder="${ph}" maxlength="120">`}</div>`;
  return `${backBtn()}<div class="paper"><span class="up">${esc(U.okul)} · ${esc(U.sube)}</span><h2>Ders defteri</h2><p class="mute small">Boşlukları doldur, deftere yaz. Notlar sadece bu cihazda ve sadece sende durur.</p></div>
  <form class="page" id="defForm" autocomplete="off"><div class="field"><label for="dt">Tarih</label><input type="text" id="dt" value="${new Date().toISOString().slice(0,10)}" placeholder="YYYY-AA-GG"></div>
  <div class="field"><label for="dd">Ders</label><select id="dd">${ds.map(x=>`<option>${esc(x.ad)}</option>`).join("")}</select></div>
  ${f("dk","İşlenen konu","Bugün işlenen konu")}${f("dv","Devamsız öğrenciler","Örn. Ali, Ayşe")}${f("do","Ödev","Verilen ödev")}${f("dn","Not","Gözlem, bir sonraki ders planı…",3)}
  <button class="btn" type="submit">Deftere yaz</button></form>
  ${V.N==null?'<p class="mute">Defter yükleniyor…</p>':N.map(x=>`<div class="page"><span class="up">${esc(x.t)} · ${esc(x.d)}</span>${[["İşlenen konu",x.k],["Devamsız",x.dv],["Ödev",x.od]].filter(r=>r[1]).map(r=>`<p><b>${r[0]}:</b> ${esc(r[1])}</p>`).join("")}${x.n?`<p style="white-space:pre-wrap">${esc(x.n)}</p>`:""}<button class="btn ghost" data-act="ddel" data-id="${x.id}">Sil</button></div>`).join("")||'<p class="mute">Henüz not yok.</p>'}`;};
doDef=async function(){const v=i=>$("#"+i).value.trim();if(!v("dk")&&!v("dv")&&!v("do")&&!v("dn"))return;const n=V.N||[];
  n.unshift({id:Date.now(),t:v("dt"),d:v("dd"),k:v("dk"),dv:v("dv"),od:v("do"),n:v("dn")});V.N=n;await dSave(n);render()};

/* ===== Açılış: Giriş yap / Kayıt ol sekmeleri ===== */
const _vL3=vLogin;
// Öğretmen kademe ve sınıfı kendisi seçer; yalnızca şube topluluk bölümünden gelir.
const stripT=h=>draft.role!=="ogretmen"?h:h.replace(/<div class="field"><label for="sube">[\s\S]*?<\/div>/,"").replace("Sınıfını ve okulunu seç.","Okulunu, kademeni ve sınıfını seç. Şubene topluluk bölümünden katılacaksın.");
vLogin=()=>{
  ensureDraft();
  if(U)return stripT(_vL3());
  const tab=draft.tab||"giris";
  const tb=(id,t)=>`<button type="button" role="tab" data-act="tab" data-id="${id}" aria-selected="${tab===id}" aria-pressed="${tab===id}">${t}</button>`;
  const tabs=`<div class="seg" role="tablist" aria-label="Giriş veya kayıt" style="margin-top:12px">${tb("giris","Giriş yap")}${tb("kayit","Kayıt ol")}</div>`;
  if(tab==="kayit")return tabs+stripT(_vL3());
  return tabs+`<div class="paper"><span class="up">${draft.role==="ogretmen"?"Öğretmen girişi":"Öğrenci girişi"}</span><h1><span class="mark">Öğretmenim</span></h1>
    <p class="mute">Hesabına girmek için bilgilerini yaz.</p></div>
  <form class="page" id="girisForm" autocomplete="off">
    <div class="field"><span style="font-weight:700;font-size:14px">Ben</span><div class="seg" role="group" aria-label="Rol">${["ogrenci","ogretmen"].map(r=>`<button type="button" data-act="rol" data-id="${r}" aria-pressed="${draft.role===r}">${r==="ogrenci"?"Öğrenciyim":"Öğretmenim"}</button>`).join("")}</div></div>
    <div class="field"><label for="kul">Kullanıcı adı</label><input type="text" id="kul" value="${esc(draft.kul)}" autocapitalize="none" autocomplete="username" maxlength="20" required></div>
    <div class="field"><label for="sifre">Şifre</label><input type="password" id="sifre" value="${esc(draft.sifre||"")}" autocomplete="current-password" required></div>
    <div class="field"><label for="okul">Okul adı</label><input type="text" id="okul" value="${esc(draft.okul)}" placeholder="Örn. Atatürk İlkokulu" maxlength="80" required></div>
    ${draft.role==="ogretmen"?"":`<div class="field"><label for="sube">Şube</label><input type="text" id="sube" value="${esc(draft.sube)}" placeholder="Örn. 5-A" maxlength="10" required></div>`}
    ${draft.err?`<p role="alert" style="color:var(--bad);font-weight:700">${esc(draft.err)}</p>`:""}
    <button class="btn" type="submit">Giriş yap</button>
    <p class="small mute" style="text-align:center">Hesabın yok mu? <button type="button" class="back" data-act="tab" data-id="kayit" style="display:inline">Kayıt ol</button></p>
  </form>`;
};
ACT.tab=d=>{readDraft();draft.tab=d.id;draft.err="";draft.sifre=draft.sifre2="";render()};
async function doGiris(){
  readDraft();const d=draft,fail=m=>{d.err=m;render()};
  const kul=(d.kul||"").trim().toLowerCase(),pw=d.sifre||"";
  const tch=d.role==="ogretmen";
  if(!kul||!pw||!(d.okul||"").trim()||(!tch&&!(d.sube||"").trim()))return fail(tch?"Kullanıcı adı, şifre ve okul adı gerekli.":"Kullanıcı adı, şifre, okul adı ve şube gerekli.");
  const a=store.get("accounts",{})[kul];
  if(!a||!a.ph||await sha(kul+":"+pw)!==a.ph)return fail("Kullanıcı adı veya şifre yanlış. Hesabın yoksa Kayıt ol sekmesini kullan.");
  if((a.role||"ogrenci")!==d.role)return fail(a.role==="ogretmen"?"Bu bir öğretmen hesabı. Üstten Öğretmenim seçeneğini seç.":"Bu bir öğrenci hesabı. Üstten Öğrenciyim seçeneğini seç.");
  if(slug(a.okul)!==slug(d.okul)||(!tch&&slug(a.sube||"")!==slug(d.sube)))return fail(tch?"Okul adı bu hesapla eşleşmiyor.":"Okul adı veya şube bu hesapla eşleşmiyor.");
  U=a;store.set("user",U);T.ders="mix";H=[];d.err="";d.sifre=d.sifre2="";
  JOIN=await joinClass();go("home");
}
document.addEventListener("submit",e=>{if(e.target.id==="girisForm")doGiris()});

/* ===== Öğretmen: sınıf seçmeden kayıt, sınıfa topluluktan katılma ===== */
const _dL=doLogin;
doLogin=async function(){
  readDraft();if(draft.role!=="ogretmen")return _dL();
  const d=draft,fail=m=>{d.err=m;render()};
  if(!d.okul.trim())return fail("Okul adı gerekli.");
  const kul=d.kul.trim().toLowerCase();
  if(!/^[a-z0-9_.]{3,20}$/.test(kul))return fail("Kullanıcı adı 3-20 karakter olmalı: a-z, rakam, _ ve . kullanabilirsin.");
  let ph=U&&U.ph&&U.kul===kul?U.ph:null;const pw=d.sifre||"";
  if(pw||!ph){if(pw.length<4)return fail("Şifre en az 4 karakter olmalı.");if(pw!==d.sifre2)return fail("İki şifre aynı değil.");ph=await sha(kul+":"+pw)}
  const ok=U&&U.role==="ogretmen"&&U.dogrulandi;
  if(!ok&&Number(String(d.dogru).replace(/\s/g,""))!==MQ[d.mq][1]){
    d.mq=(d.mq+1+rnd(0,MQ.length-2))%MQ.length;d.dogru="";return fail("Doğrulama cevabı yanlış. Yeni bir soru geldi, tekrar dene.");}
  try{const db=await cap("db"),id=await myId();if(db&&id){const r=db.doc("users/"+kul),s=await r.get();
    if(s.exists&&s.data().uid!==id)return fail("Bu kullanıcı adı başkasında. Başka bir tane dene.");if(!s.exists)await r.set({uid:id});}}catch(e){}
  let old=U&&U.kul===kul?U:{};
  if(old.okul&&slug(old.okul)!==slug(d.okul))old={kul};
  // Kademe/sınıf değiştiyse eski açık şube artık uymaz
  const ayniSinif=old.kademe===d.kad&&old.sinif===d.sinif;
  U={ad:d.ad.trim(),kul,okul:d.okul.trim(),kademe:d.kad,sinif:d.sinif,sube:ayniSinif?(old.sube||""):"",siniflar:old.siniflar||[],role:"ogretmen",ph,dogrulandi:true};
  store.set("user",U);{const A=store.get("accounts",{});A[kul]=U;store.set("accounts",A)}
  T.ders="mix";H=[];d.err="";d.dogru="";d.sifre=d.sifre2="";JOIN=null;go("home");
};
// Kayıtta bu cihazdaki başka bir hesabın kullanıcı adı alınamaz (yoksa o hesabın üstüne yazılıyordu).
const _dLAyni=doLogin;
doLogin=async function(){
  readDraft();
  const kul=(draft.kul||"").trim().toLowerCase(),a=store.get("accounts",{})[kul];
  if(a&&a.ph&&!(U&&U.kul===kul)){draft.err="Bu kullanıcı adıyla bu cihazda zaten bir hesap var. Senin hesabınsa Giriş yap sekmesinden gir, değilse başka bir kullanıcı adı seç.";render();return}
  const eski=U&&U.kul;
  await _dLAyni();
  // Profilde kullanıcı adı değiştiyse eski kaydı kaldır, puanları ve resmi yeni ada taşı
  if(eski&&U&&U.kul&&U.kul!==eski){
    const A=store.get("accounts",{});delete A[eski];store.set("accounts",A);
    ["prog","avatar","defter"].forEach(k=>{try{const v=localStorage.getItem("ogt_"+k+":"+eski);if(v!=null){localStorage.setItem("ogt_"+k+":"+U.kul,v);localStorage.removeItem("ogt_"+k+":"+eski)}}catch(e){}});
    P_SAHIP=null;render();
  }
};
const _jc=joinClass;
joinClass=async function(){
  if(isT())return null;
  const r=await _jc();
  try{const db=await cap("db");if(db&&U.sube)await db.doc("schools/"+slug(U.okul)+"/classes/"+ckey(U)).set({kademe:U.kademe,sinif:U.sinif,sube:U.sube})}catch(e){}
  return r;
};
const clsKey=c=>slug(U.okul)+"_"+c.kademe+c.sinif+"_"+slug(c.sube);
const clsAd=c=>KAD[c.kademe].ad+" "+c.sinif+". sınıf · "+c.sube;
async function listClasses(){
  const out={};
  Object.values(store.get("accounts",{})).filter(a=>a.role!=="ogretmen"&&a.sube&&slug(a.okul)===slug(U.okul)).forEach(a=>{const c={kademe:a.kademe,sinif:a.sinif,sube:a.sube};out[clsKey(c)]=c});
  try{const db=await cap("db");if(db){const sn=await db.collection("schools/"+slug(U.okul)+"/classes").get();sn.docs.forEach(x=>{const c=x.data();if(c&&KAD[c.kademe]&&c.sube)out[clsKey(c)]=c})}}catch(e){}
  (U.siniflar||[]).forEach(c=>out[clsKey(c)]=c);
  return Object.values(out).sort((a,b)=>clsAd(a).localeCompare(clsAd(b),"tr",{numeric:true}));
}
const _vTop=vTop;
vTop=function(){
  if(!isT())return _vTop();
  V.after=loadClasses;
  return `${backBtn()}<div class="paper"><span class="up">${esc(U.okul)}</span><h2>Sınıf topluluğu</h2><p class="mute small">Okulundaki sınıfları gör, katılmak istediğine katıl.</p></div><div class="page" id="cls2"><p class="mute">Yükleniyor…</p></div>${U.sube?`<div class="page" id="mem2"></div>`:""}`;
};
async function loadClasses(){
  const el=$("#cls2"),L=await listClasses();if(!el||V.name!=="topluluk")return;V.CL=L;
  const mine=new Set((U.siniflar||[]).map(clsKey)),act=U.sube?clsKey(U):"";
  el.innerHTML=`<h3>${esc(U.okul)} sınıfları</h3>`+(L.length?L.map((c,i)=>{const k=clsKey(c);return `<div class="row" style="align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-block:8px"><span><b>${esc(clsAd(c))}</b>${k===act?' <span class="stat">Açık sınıf</span>':""}</span>${mine.has(k)?(k===act?"":`<button class="btn ghost" data-act="sec" data-i="${i}">Bu sınıfı aç</button>`):`<button class="btn" data-act="katil" data-i="${i}">Katıl</button>`}</div>`}).join(""):'<p class="mute">Bu okulda henüz sınıf yok. Öğrenciler kayıt olduğunda sınıflar burada görünür.</p>');
  if(U.sube)loadMembers();
}
function aktifSinif(c){U.kademe=c.kademe;U.sinif=c.sinif;U.sube=c.sube;store.set("user",U);const A=store.get("accounts",{});A[U.kul]=U;store.set("accounts",A);T.ders="mix"}
ACT.katil=async d=>{const c=V.CL[Number(d.i)];if(!c)return;
  U.siniflar=(U.siniflar||[]).filter(x=>clsKey(x)!==clsKey(c)).concat([{kademe:c.kademe,sinif:c.sinif,sube:c.sube}]);
  aktifSinif(c);
  try{const db=await cap("db"),id=await myId();if(db&&id)await db.collection("cls/"+ckey(U)+"/members").doc(id).set({kul:U.kul,ad:U.ad,role:"ogretmen",t:Date.now()})}catch(e){}
  render()};
ACT.sec=d=>{const c=V.CL[Number(d.i)];if(!c)return;aktifSinif(c);render()};
const _vH4=vHome;
vHome=()=>{let h=_vH4();
  if(isT()&&!U.sube)h=h.replace('<div class="tiles">','<div class="fb" style="background:var(--soft);border-radius:12px;padding:12px 14px">Henüz bir sınıfa katılmadın. <b>Sınıf topluluğu</b> bölümünden sınıfına katıl.</div><div class="tiles">');
  return h;};


/* ===== Çıkış sonrası: kayıtlı hesaplar görünsün, şifreyle giriş yapılsın ===== */
const _vL4=vLogin;
vLogin=()=>{
  const h=_vL4();
  if(U)return h;
  const A=Object.values(store.get("accounts",{})).filter(a=>a&&a.kul&&a.ph);
  if(!A.length)return h;
  const sel=draft.hid;
  const rol=a=>a.role==="ogretmen"?"Öğretmen":"Öğrenci";
  const list=A.map(a=>`<button type="button" class="opt" data-act="hesap" data-id="${esc(a.kul)}" aria-pressed="${sel===a.kul}" style="display:flex;align-items:center;gap:12px;${sel===a.kul?"border-color:var(--accent);background:var(--soft)":""}">
    <span aria-hidden="true" style="flex:none;width:40px;height:40px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:inline-flex;align-items:center;justify-content:center;font:800 18px var(--f-display)">${esc(String(a.ad||a.kul).trim().charAt(0).toLocaleUpperCase("tr"))}</span>
    <span style="min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.ad||a.kul)}</b><span class="small mute" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@${esc(a.kul)} · ${rol(a)}${a.okul?", "+esc(a.okul):""}${a.role!=="ogretmen"&&a.sube?" "+esc(a.sube):""}</span></span></button>`).join("");
  const pw=sel&&A.some(a=>a.kul===sel)?`<form id="hesapForm" class="field" autocomplete="off" style="margin-top:4px"><label for="hpw">@${esc(sel)} şifresi</label><input type="password" id="hpw" autocomplete="current-password" required autofocus>${draft.herr?`<p role="alert" style="color:var(--bad);font-weight:700">${esc(draft.herr)}</p>`:""}<button type="submit" class="btn">Giriş yap</button></form>`:"";
  const card=`<div class="page"><h3>Kayıtlı hesaplar</h3><p class="small mute">Hesabına dokun, şifreni yaz ve gir.</p><div class="opts">${list}</div>${pw}</div>`;
  const i=h.indexOf('<div class="paper">');
  return i<0?card+h:h.slice(0,i)+card+h.slice(i);
};
const _hesap=ACT.hesap;
ACT.hesap=d=>{readDraft();draft.hid=draft.hid===d.id?null:d.id;draft.herr="";render();setTimeout(()=>{const p=$("#hpw");if(p)p.focus()},0)};
document.addEventListener("submit",e=>{if(e.target.id==="hesapForm")ACT.hgir()});

/* ===== Topluluk: Claude hesabı gerekmez ===== */
// Kimlik: Claude hesabı varsa onu, yoksa uygulamadaki kullanıcı adını kullan.
myId=async function(){
  try{const u=await cap("user");if(u){const i=await u.id();if(i)return i}}catch(e){}
  const k=(U&&U.kul)||(draft&&draft.kul&&String(draft.kul).trim().toLowerCase())||"";
  return k?"k_"+k:null;
};
// Bu cihazdaki kayıtlı hesaplardan sınıf üyeleri
function localMembers(){
  const key=ckey(U),out=[];
  Object.values(store.get("accounts",{})).concat(U?[U]:[]).forEach(a=>{
    if(!a||!a.kul||!a.okul||slug(a.okul)!==slug(U.okul))return;
    const tch=a.role==="ogretmen";
    const inCls=tch?((a.siniflar||[]).some(c=>slug(U.okul)+"_"+c.kademe+c.sinif+"_"+slug(c.sube)===key)||(a.sube&&ckey(a)===key)):(a.sube&&ckey(a)===key);
    if(inCls)out.push({kul:a.kul,ad:a.ad,role:tch?"ogretmen":"ogrenci"});
  });
  return out;
}
loadMembers=async function(){
  const el=$("#mem2");if(!el)return;
  const by={};localMembers().forEach(x=>by[x.kul]=x);
  try{const db=await cap("db");if(db){const sn=await db.collection("cls/"+ckey(U)+"/members").get();sn.docs.forEach(d=>{const x=d.data();if(x&&x.kul&&!by[x.kul])by[x.kul]=x})}}catch(e){}
  if(!$("#mem2")||V.name!=="topluluk")return;
  const m=Object.values(by).sort((a,b)=>(a.role==="ogretmen"?0:1)-(b.role==="ogretmen"?0:1)||String(a.kul).localeCompare(b.kul));
  $("#mem2").innerHTML=`<h3>${m.length} üye · ${m.filter(x=>x.role==="ogrenci").length} öğrenci</h3>`+m.map(x=>`<div class="row" style="align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-block:8px"><span><b>${esc(x.ad||x.kul)}</b> <span class="mute small">@${esc(x.kul)}</span></span><span class="stat">${x.role==="ogretmen"?"Öğretmen":"Öğrenci"}</span></div>`).join("");
};
// Katılım bildirimi: paylaşılan veri yoksa bu cihazdaki hesaplara bak
const _jc2=joinClass;
joinClass=async function(){
  if(isT())return null;
  const r=await _jc2();
  if(r)return r;
  if(!U||!U.sube)return null;
  return {st:localMembers().filter(x=>x.role==="ogrenci"&&x.kul!==U.kul).length};
};

