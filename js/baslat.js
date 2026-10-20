/* ===== Başlangıç ===== */
if(U) draft = {kad:U.kademe, sinif:U.sinif, ad:U.ad || "", okul:U.okul};
if(U&&!U.sube&&U.role!=="ogretmen"&&V.name==="home"){draft={kad:U.kademe,sinif:U.sinif,ad:U.ad||"",okul:U.okul};go("login")}
render();
