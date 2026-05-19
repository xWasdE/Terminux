import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================================
// %100 EL TERMİNALİ / MOBİL MOTORU (RESPONSIVE CSS ENJEKSİYONU)
// =========================================================================
if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.head.appendChild(meta);
}

const style = document.createElement('style');
style.innerHTML = `
    * { box-sizing: border-box; }
    .card-wrapper { display: flex; gap: 40px; width: 100%; align-items: stretch; }
    .card-main { flex: 1.2; background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .card-sidebar { flex: 1; display: flex; flex-direction: column; gap: 40px; }
    .stock-box { flex: 1; background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    
    .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 40px; }
    .title-text { font-size: 36px; font-weight: 800; color: #fff; line-height: 1.2; word-break: break-word; }
    .label-text { font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; }
    .value-text { font-size: 20px; font-family: monospace; font-weight: bold; word-break: break-all; }
    
    .input-style { background: #000; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 6px; font-family: monospace; width: 100%; max-width: 180px; font-size: 14px; }
    .btn-save { background: #0f0; color: #000; border: none; padding: 10px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px; }
    .btn-edit { background: #1a1a1a; border: 1px solid #333; color: #aaa; padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-edit:hover { color: #fff; background: #333; }
    
    .flex-edit { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .doc-link { background: #111; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 5px; transition: 0.2s; }
    .doc-link:hover { background: #1a1a1a; }

    /* EL TERMİNALİ VE TELEFON GÖRÜNÜMÜ */
    @media (max-width: 900px) {
        body { padding: 15px !important; }
        .card-wrapper { flex-direction: column; gap: 20px; }
        .card-main, .stock-box { padding: 25px; }
        .grid-details { grid-template-columns: 1fr; gap: 25px; margin-top: 25px; padding-top: 25px; }
        .title-text { font-size: 26px; }
        .value-text { font-size: 18px; }
        
        /* Parmak dostu tam genişlik ayarları */
        .input-style { max-width: 100%; width: 100%; margin-bottom: 5px; padding: 15px; font-size: 16px; }
        .btn-save { width: 100%; padding: 15px; font-size: 15px; }
        .flex-edit { flex-direction: column; align-items: stretch; gap: 5px; }
        .flex-edit > div { display: flex; gap: 10px; width: 100%; }
        .flex-edit > div > button { flex: 1; } /* OK ve X butonları yarı yarıya böler */
        
        .doc-link { display: block; text-align: center; margin-bottom: 10px; padding: 15px; }
        .btn-edit { width: 100%; padding: 12px; font-size: 13px; margin-top: 5px; }
    }
`;
document.head.appendChild(style);
// =========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyCX-X3ri95oQtO53tgEyAwqHuu1mmYKONM",
    authDomain: "terminux-wms.firebaseapp.com",
    projectId: "terminux-wms",
    storageBucket: "terminux-wms.firebasestorage.app",
    messagingSenderId: "427323493367",
    appId: "1:427323493367:web:8c0f7bdd21fe5b83c3bcf2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loadingScreen = document.getElementById('loading-screen');
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const operatorName = document.getElementById('operator-name');
const searchInput = document.getElementById('main-search');
const dropdown = document.getElementById('dropdown-results');
const resultContainer = document.getElementById('result-container');

let productCatalog = [];
let searchTimeout = null;

setPersistence(auth, browserLocalPersistence);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        operatorName.textContent = user.email.split('@')[0].toUpperCase();
        await buildCatalog();
        loadingScreen.classList.add('hidden');
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        searchInput.focus();
    } else {
        loadingScreen.classList.add('hidden');
        appScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = usernameInput.value.trim().toLowerCase();
    const passVal = passwordInput.value;
    let finalEmail = userVal === 'test' ? 'test@terminux.com.tr' : (userVal.includes('@') ? userVal : `${userVal}@terminux.com.tr`);
    let finalPass = (userVal === 'test' && passVal === 'test') ? 'testtest' : passVal;

    try {
        await signInWithEmailAndPassword(auth, finalEmail, finalPass);
    } catch (error) {
        alert("Giriş Başarısız: Lütfen bilgileri kontrol edin.");
    }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    await signOut(auth);
    window.location.reload();
});

async function buildCatalog() {
    try {
        const [anaSnap, amSnap] = await Promise.all([
            getDocs(collection(db, "ana_depo")),
            getDocs(collection(db, "ameliyathane"))
        ]);
        
        const tempMap = new Map();
        const processDoc = (doc) => {
            const data = doc.data();
            if (!tempMap.has(doc.id)) {
                tempMap.set(doc.id, {
                    docId: doc.id,
                    urunKodu: String(data.urunKodu || ""),
                    urunAdi: String(data.urunAdi || ""),
                    barkod: String(data.barkod || ""),
                    refNo: String(data.refNo || "BULUNAMADI"),
                    altGrup: String(data.altGrup || ""),
                    searchString: `${data.urunAdi || ""} ${data.urunKodu || ""} ${data.barkod || ""} ${data.refNo || ""} ${doc.id} ${data.altGrup || ""}`.toLowerCase()
                });
            }
        };

        anaSnap.forEach(processDoc);
        amSnap.forEach(processDoc);
        productCatalog = Array.from(tempMap.values());
    } catch (error) { console.error("Katalog hatası:", error); }
}

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && !e.target.closest('.search-item')) {
        dropdown.style.display = 'none';
    }
    if(!['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName) && !appScreen.classList.contains('hidden')) {
        searchInput.focus();
    }
});

searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimeout);
    if (val.length < 2) { dropdown.style.display = 'none'; return; }

    searchTimeout = setTimeout(() => {
        dropdown.innerHTML = '<div style="padding: 20px; color: #666; font-size: 18px;">Aranıyor...</div>';
        dropdown.style.display = 'block';

        const searchTerms = val.split(/\s+/);
        let matches = productCatalog.filter(m => searchTerms.every(term => m.searchString.includes(term))).slice(0, 15);

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(m => `
                <div class="search-item" data-id="${m.docId}" style="padding: 15px 20px; border-bottom: 1px solid #1a1a1a; cursor: pointer;">
                    <div style="color: #fff; font-size: 16px; font-weight: 600;">${m.urunAdi}</div>
                    <div style="color: #888; font-size: 12px; font-family: monospace; margin-top:5px;">KOD: <span style="color:#0f0;">${m.urunKodu}</span> | REF: ${m.refNo}</div>
                </div>
            `).join('');

            document.querySelectorAll('.search-item').forEach(item => {
                item.addEventListener('click', () => {
                    searchInput.value = '';
                    dropdown.style.display = 'none';
                    fetchAndDisplayProduct(item.getAttribute('data-id'));
                });
            });
        } else {
            dropdown.innerHTML = '<div style="padding: 20px; color: #f33; font-size: 16px;">Eşleşme bulunamadı.</div>';
        }
    }, 150);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimeout);
        dropdown.style.display = 'none';
        
        const code = searchInput.value.trim();
        if (!code) return;
        searchInput.value = '';

        const directMatch = productCatalog.find(m => 
            (m.docId.toLowerCase() === code.toLowerCase()) || 
            (m.urunKodu.toLowerCase() === code.toLowerCase()) || 
            (m.barkod.toLowerCase() === code.toLowerCase()) || 
            (m.refNo.toLowerCase() === code.toLowerCase())
        );

        if (directMatch) fetchAndDisplayProduct(directMatch.docId);
        else fetchAndDisplayProduct(code);
    }
});

// -----------------------------------------------------
// İZOLE EDİLMİŞ GÜVENLİ DÜZENLEME MANTIĞI
// -----------------------------------------------------
window.editField = (id, type) => {
    document.getElementById(`txt-container-${type}-${id}`).style.display = 'none';
    document.getElementById(`edit-${type}-${id}`).style.display = 'flex';
};

window.cancelEdit = (id, type) => {
    document.getElementById(`txt-container-${type}-${id}`).style.display = 'flex';
    document.getElementById(`edit-${type}-${id}`).style.display = 'none';
};

window.saveUpdate = async (id, type) => {
    const inputEl = document.getElementById(`man-${type}-${id}`);
    const newVal = inputEl ? inputEl.value.trim() : null;

    if (!newVal) return alert("Hata: Değer boş olamaz!");

    const updateData = {};
    if (type === 'b') {
        updateData.barkod = newVal;
        updateData.docLinks = { kunye: "", etiket: "", kilavuz: "" }; // Barkod değişirse botu uyandır
    } else if (type === 'r') {
        updateData.refNo = newVal;
        updateData.docLinks = { kunye: "", etiket: "", kilavuz: "" }; // Ref değişirse botu uyandır
    } else if (type === 'm') {
        updateData.miatTarihi = newVal;
        // MİAT TARİHİNDE BELGELERİ SIFIRLAMIYORUZ! Bot boşuna çalışmaz.
    }

    try {
        const anaRef = doc(db, "ana_depo", id);
        const amRef = doc(db, "ameliyathane", id);
        
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);
        
        await buildCatalog();
        fetchAndDisplayProduct(id);
    } catch (err) { alert("Güncelleme hatası: " + err.message); }
};

// -----------------------------------------------------
// VİTRİN: ÜRÜN KARTI OLUŞTURMA
// -----------------------------------------------------
window.fetchAndDisplayProduct = async (code) => {
    resultContainer.style.display = 'block';
    resultContainer.innerHTML = '<div style="color: #666; font-size: 24px;">Veriler Çekiliyor...</div>';

    try {
        const [anaDoc, amDoc] = await Promise.all([getDoc(doc(db, "ana_depo", code)), getDoc(doc(db, "ameliyathane", code))]);

        if (anaDoc.exists() || amDoc.exists()) {
            const anaData = anaDoc.exists() ? anaDoc.data() : null;
            const amData = amDoc.exists() ? amDoc.data() : null;
            const baseData = anaData || amData; 

            const mergedData = {
                urunKodu: code,
                barkod: baseData.barkod || "",
                urunAdi: baseData.urunAdi || "-",
                refNo: baseData.refNo || "BULUNAMADI",
                altGrup: (anaData && anaData.altGrup) ? anaData.altGrup : ((amData && amData.altGrup) ? amData.altGrup : "-"),
                surecTipi: baseData.surecTipi || "-",
                miatTarihi: baseData.miatTarihi || "-",
                docLinks: baseData.docLinks || { kunye: "", etiket: "", kilavuz: "" }, 
                minAlert: baseData.minAlert || 0,
                max: baseData.max || 0,
                hasAna: anaDoc.exists(),
                anaMiktar: anaData ? parseInt(anaData.miktar) : 0,
                anaStokAdresi: anaData ? (anaData.stokAdresi || "-") : "-",
                anaDummy: anaData ? (anaData.dummy || "DUMMY DEĞİL") : "DUMMY DEĞİL",
                anaReuse: anaData ? (anaData.reuse || "REUSE DEĞİL") : "REUSE DEĞİL", 
                hasAm: amDoc.exists(),
                amMiktar: amData ? parseInt(amData.miktar) : 0,
                amStokAdresi: amData ? (amData.stokAdresi || "-") : "-",
                amDummy: amData ? (amData.dummy || "DUMMY DEĞİL") : "DUMMY DEĞİL",
                amReuse: amData ? (amData.reuse || "REUSE DEĞİL") : "REUSE DEĞİL"
            };

            renderCard(mergedData, resultContainer);
        } else {
            resultContainer.innerHTML = `
                <div class="card-main" style="text-align:center; border-color:#300;">
                    <div style="color: #f33; font-size: 28px; font-weight: 800; margin-bottom: 10px;">KAYIT BULUNAMADI</div>
                    <div style="color: #888; font-size: 16px; font-family: monospace;">Kod: <span style="color:#fff;">${code}</span></div>
                </div>
            `;
        }
    } catch (err) { resultContainer.innerHTML = `<div style="color:#f33;">Hata: ${err.message}</div>`; }
};

// DÜZENLEME ARAYÜZÜ KALIBI (UI GENERATOR)
function createEditUI(id, type, val, placeholder, colorClass) {
    const isSet = val && val !== "TANIMLI DEĞİL" && val !== "BULUNAMADI" && val !== "-";
    
    if (isSet) {
        return `
            <div id="txt-container-${type}-${id}" class="flex-edit">
                <span style="color: ${colorClass};" class="value-text">${val}</span>
                <button onclick="editField('${id}', '${type}')" class="btn-edit">✎ DÜZENLE</button>
            </div>
            <div id="edit-${type}-${id}" class="flex-edit" style="display:none;">
                <input type="text" id="man-${type}-${id}" value="${val}" class="input-style">
                <div>
                    <button onclick="saveUpdate('${id}', '${type}')" style="background:#fb0;" class="btn-save">OK</button>
                    <button onclick="cancelEdit('${id}', '${type}')" style="background:#333; color:#f33;" class="btn-save">X</button>
                </div>
            </div>
        `;
    } else {
        return `
            <div class="flex-edit">
                <input type="text" id="man-${type}-${id}" placeholder="${placeholder}" class="input-style">
                <button onclick="saveUpdate('${id}', '${type}')" class="btn-save">KAYDET</button>
            </div>
        `;
    }
}

function renderCard(data) {
    const min = parseInt(data.minAlert) || 0;
    const getS = (val, has) => (!has ? { c: '#fb0', t: 'TANIMSIZ' } : { c: val <= min ? '#f33' : '#fff', t: val });
    const sAna = getS(data.anaMiktar, data.hasAna);
    const sAm = getS(data.amMiktar, data.hasAm);

    // Otomatik UI Üreticileri (Barkod, Ref, Miat)
    const barkodUI = createEditUI(data.urunKodu, 'b', data.barkod, 'Barkod Okut...', '#ccc');
    const refUI = createEditUI(data.urunKodu, 'r', data.refNo, 'Ref No Yaz...', '#fff');
    const miatUI = createEditUI(data.urunKodu, 'm', data.miatTarihi, 'GG.AA.YYYY', '#f33');

    resultContainer.innerHTML = `
        <div class="card-wrapper">
            <div class="card-main">
                <div style="margin-bottom: 30px;">
                    <div class="label-text">ÜRÜN BİLGİSİ</div>
                    <div class="title-text">${data.urunAdi}</div>
                </div>
                
                <div class="grid-details">
                    <div><div class="label-text">ÜRÜN KODU</div><div class="value-text" style="color:#0f0;">${data.urunKodu}</div></div>
                    <div><div class="label-text">BARKOD</div><div>${barkodUI}</div></div>
                    <div><div class="label-text">REF NO</div><div>${refUI}</div></div>
                    <div><div class="label-text">MİAT TARİHİ</div><div>${miatUI}</div></div>
                    <div><div class="label-text">ALT GRUP</div><div class="value-text" style="color:#fb0;">${data.altGrup}</div></div>
                    <div><div class="label-text">SÜREÇ TİPİ</div><div class="value-text" style="color:#aaa;">${data.surecTipi}</div></div>
                </div>

                <div style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
                    <div class="label-text" style="margin-bottom:15px;">ÜTS BELGELERİ VE GÖRSELLER</div>
                    <div>
                        ${data.docLinks.kunye ? `<a href="${data.docLinks.kunye}" target="_blank" class="doc-link" style="color:#0cf;">📄 Ürün Künyesi</a>` : ``}
                        ${data.docLinks.etiket ? `<a href="${data.docLinks.etiket}" target="_blank" class="doc-link" style="color:#fb0;">🖼️ Etiket / Ambalaj</a>` : ``}
                        ${data.docLinks.kilavuz ? `<a href="${data.docLinks.kilavuz}" target="_blank" class="doc-link" style="color:#0f0;">📖 Kılavuz</a>` : ``}
                        ${(!data.docLinks.kunye && !data.docLinks.etiket && !data.docLinks.kilavuz) ? `<span style="color:#444; font-size:13px; font-style:italic;">Belge bekleniyor...</span>` : ``}
                    </div>
                </div>
            </div>

            <div class="card-sidebar">
                <div class="stock-box">
                    <div class="label-text" style="margin-bottom:15px; font-size:14px; font-weight:bold;">ANA DEPO STOK</div>
                    <div style="font-size:80px; font-weight:800; color:${sAna.c}; line-height:1;">${sAna.t}</div>
                    ${data.hasAna ? `
                        <div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                        <div style="text-align: left; padding: 0 10px;">
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.anaStokAdresi}</span></div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ${data.anaDummy === 'DUMMY' ? '#fb0' : '#0f0'};">${data.anaDummy}</span></div>
                            <div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ${data.anaReuse === 'REUSE' ? '#f33' : '#0cf'};">${data.anaReuse}</span></div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="stock-box">
                    <div class="label-text" style="margin-bottom:15px; font-size:14px; font-weight:bold;">AMELİYATHANE STOK</div>
                    <div style="font-size:80px; font-weight:800; color:${sAm.c}; line-height:1;">${sAm.t}</div>
                    ${data.hasAm ? `
                        <div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                        <div style="text-align: left; padding: 0 10px;">
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.amStokAdresi}</span></div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ${data.amDummy === 'DUMMY' ? '#fb0' : '#0f0'};">${data.amDummy}</span></div>
                            <div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ${data.amReuse === 'REUSE' ? '#f33' : '#0cf'};">${data.amReuse}</span></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}
