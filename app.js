import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================================
// SİSTEM GEREKSİNİMLERİ: BARKOD KÜTÜPHANESİ VE YAZDIRMA CSS MOTORU
// =========================================================================
const jsbScript = document.createElement('script');
jsbScript.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
document.head.appendChild(jsbScript);

if (!document.querySelector('meta[name="viewport"]')) {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.head.appendChild(meta);
}

const style = document.createElement('style');
style.innerHTML = `
    * { box-sizing: border-box; }
    body { padding-bottom: 80px !important; }
    .card-wrapper { display: flex; gap: 40px; width: 100%; align-items: stretch; }
    .card-main { flex: 1.3; background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    .card-sidebar { flex: 1; display: flex; flex-direction: column; gap: 40px; }
    .stock-box { flex: 1; background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    
    .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 40px; }
    .title-text { font-size: 34px; font-weight: 800; color: #fff; line-height: 1.2; word-break: break-word; }
    .label-text { font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
    .value-text { font-size: 20px; font-family: monospace; font-weight: bold; }
    
    .input-style { background: #000; border: 1px solid #444; color: #fff; padding: 8px 12px; border-radius: 6px; font-family: monospace; width: 100%; max-width: 160px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .input-style:focus { border-color: #00ff00; }
    .btn-save { background: #00ff00; color: #000; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px; }
    .btn-cancel { background: #1a1a1a; color: #ff3333; border: 1px solid #333; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; transition: 0.2s; }
    .btn-edit { background: #111; border: 1px solid #333; color: #aaa; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-edit:hover { color: #fff; background: #333; border-color: #555; }
    
    .flex-edit { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .edit-btn-group { display: flex; gap: 5px; }
    
    .doc-link { background: #111; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block; transition: 0.2s; }
    .doc-link:hover { background: #1a1a1a; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
    .mobile-break { word-break: break-all; }

    .legal-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background-color: rgba(5, 5, 5, 0.95);
        color: #888;
        text-align: center;
        padding: 16px 20px;
        font-size: 13px;
        z-index: 9999;
        border-top: 1px solid #1a1a1a;
        backdrop-filter: blur(8px);
        line-height: 1.5;
    }
    .legal-footer b { color: #aaa; font-weight: bold; }

    @media (max-width: 900px) {
        body { padding: 15px !important; padding-bottom: 100px !important; }
        .card-wrapper { flex-direction: column; gap: 20px; }
        .card-main, .stock-box { padding: 25px; }
        .grid-details { grid-template-columns: 1fr; gap: 25px; margin-top: 25px; padding-top: 25px; }
        .title-text { font-size: 24px; }
        .value-text { font-size: 18px; }
        .input-style { max-width: 100%; width: 100%; padding: 12px; font-size: 16px; margin-bottom: 5px; }
        .btn-save, .btn-cancel { padding: 12px; font-size: 14px; flex: 1; }
        .btn-edit { padding: 10px; font-size: 12px; margin-top: 5px; width: 100%; }
        .flex-edit { flex-direction: column; align-items: stretch; gap: 5px; width: 100%; }
        .edit-btn-group { width: 100%; display: flex; gap: 10px; }
        .doc-links-container { display: flex; flex-direction: column; gap: 10px; }
        .doc-link { text-align: center; padding: 15px; width: 100%; }
        .btn-print-mobile { width: 100% !important; margin-top: 15px; padding: 15px !important; }
        .legal-footer { font-size: 11px; padding: 12px; }
    }

    /* ZEBRA ZT230 YAZDIRMA (PRINT) MOTORU - ORTALANMIŞ 2'Lİ SÜTUN */
    @media screen {
        #print-container { display: none !important; }
    }
    @media print {
        @page { 
            margin: 0 !important; 
            size: 8.3cm auto; /* ZEBRA YAZICI GENİŞLİĞİ */
        }
        body, html { 
            margin: 0; padding: 0; background: #fff; 
            width: 8.3cm; 
            display: flex; justify-content: center; /* KAĞITTA ORTALAMA SAĞLAR */
        }
        body * { visibility: hidden; }
        #print-container, #print-container * { visibility: visible; }
        .legal-footer { display: none !important; }
        
        #print-container {
            position: absolute; left: 0; top: 0;
            display: grid;
            grid-template-columns: 3.9cm 3.9cm; /* TAM OLARAK İSTENEN ETİKET ENİ */
            column-gap: 0.3cm; /* İKİ SÜTUN ARASI BOŞLUK */
            row-gap: 0cm; /* ALT ALTA BOŞLUKSUZ */
            width: 8.1cm; /* 3.9 + 3.9 + 0.3 = 8.1cm Toplam Grid Genişliği */
            margin: 0 auto; /* IZGARAYI KAĞIDIN ORTASI İÇİN MERKEZLER */
            background: #fff;
        }
        .mini-label {
            width: 3.9cm;  /* ETİKET NET GENİŞLİĞİ */
            height: 1.9cm; /* ETİKET NET YÜKSEKLİĞİ */
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            overflow: hidden; padding: 1px; box-sizing: border-box;
            color: #000; font-family: Arial, sans-serif; 
            page-break-inside: avoid;
        }
        .mini-label .p-name { 
            font-size: 8px; 
            font-weight: bold; 
            width: 100%; 
            text-align: center; 
            margin-bottom: 2px; 
            white-space: normal;
            line-height: 1.1;
            /* 2 Satır limiti orijinal sistem mantığı ile Javascript'te çözüldü */
        }
        .mini-label svg { 
            height: 0.9cm !important; 
            width: 100% !important; 
            max-width: 3.5cm; 
            margin: 0 auto; /* BARKODU İÇERİDE ORTALAR */
        }
        .mini-label .p-code { font-size: 8.5px; font-weight: bold; text-align: center; margin-top: 1px; letter-spacing: 0.5px; }
    }
`;
document.head.appendChild(style);

// YASAL BİLGİLENDİRME (FOOTER) VE YAZDIRMA MODALI EKLENİYOR
document.body.insertAdjacentHTML('beforeend', `
    <div id="print-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; justify-content:center; align-items:center; backdrop-filter:blur(3px);">
        <div style="background:#111; padding:30px; border-radius:12px; border:1px solid #333; text-align:center; width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
            <h3 style="margin-top:0; color:#fff; font-size:18px;">🖨️ ETİKET YAZDIR</h3>
            <p style="color:#888; font-size:13px; margin-bottom:20px;">Kaç adet etiket basılsın?</p>
            <input type="number" id="print-qty-input" value="8" min="1" style="width:100%; padding:12px; border-radius:6px; border:1px solid #444; background:#000; color:#00ff00; font-size:24px; font-weight:bold; text-align:center; margin-bottom:20px; outline:none;">
            <div style="display:flex; gap:10px;">
                <button onclick="closePrintModal()" style="flex:1; padding:12px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; font-weight:bold; cursor:pointer;">İPTAL</button>
                <button onclick="executePrint()" style="flex:1; padding:12px; background:#00ccff; color:#000; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">YAZDIR</button>
            </div>
        </div>
    </div>

    <div class="legal-footer">
        <b>YASAL BİLGİLENDİRME:</b> Bu sistem, tamamen operasyonel test ve iç yönetim amacıyla kapalı devre olarak çalışmaktadır. Sistem üzerinden hiçbir şekilde ticari bir faaliyet yürütülmemekte, marka veya ürün satışı yapılmamakta olup; hiçbir kurum veya kişi tarafından maddi kazanç elde edilmemektedir.
    </div>
`);
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
window.currentRenderedProduct = null;

// GÜVENLİ ÇIKIŞ BUTONU ZIRHI
document.addEventListener('click', async (e) => {
    if (e.target && (e.target.id === 'btn-logout' || e.target.closest('#btn-logout'))) {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (err) {
            alert("Çıkış yapılırken bir hata oluştu.");
        }
    }
});

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
    const finalEmail = usernameInput.value.trim().toLowerCase() === 'test' ? 'test@terminux.com.tr' : (usernameInput.value.includes('@') ? usernameInput.value : `${usernameInput.value}@terminux.com.tr`);
    const finalPass = (usernameInput.value.trim().toLowerCase() === 'test' && passwordInput.value === 'test') ? 'testtest' : passwordInput.value;

    try { await signInWithEmailAndPassword(auth, finalEmail, finalPass); } 
    catch (error) { alert("Giriş Başarısız: Bilgileri kontrol edin."); }
});

async function buildCatalog() {
    try {
        const [anaSnap, amSnap] = await Promise.all([getDocs(collection(db, "ana_depo")), getDocs(collection(db, "ameliyathane"))]);
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
                    surecTipi: String(data.surecTipi || ""),
                    searchString: `${data.urunAdi || ""} ${data.urunKodu || ""} ${data.barkod || ""} ${data.refNo || ""} ${data.altGrup || ""}`.toLowerCase()
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
});

searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimeout);
    if (val.length < 2) { dropdown.style.display = 'none'; return; }

    searchTimeout = setTimeout(() => {
        dropdown.innerHTML = '<div style="padding: 20px; color: #666; font-size: 16px;">Aranıyor...</div>';
        dropdown.style.display = 'block';

        const terms = val.split(/\s+/);
        let matches = productCatalog.filter(m => terms.every(t => m.searchString.includes(t))).slice(0, 15);

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
            dropdown.innerHTML = '<div style="padding: 20px; color: #f33; font-size: 16px;">Kayıt bulunamadı.</div>';
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

// =========================================================================
// YAZDIRMA (PRINT) FONKSİYONLARI - MODAL İLE ENTEGRE EDİLDİ
// =========================================================================
window.openPrintModal = () => {
    if (!window.currentRenderedProduct) return alert("Yazdırılacak ürün bulunamadı!");
    document.getElementById('print-modal').style.display = 'flex';
};

window.closePrintModal = () => {
    document.getElementById('print-modal').style.display = 'none';
};

window.executePrint = () => {
    const data = window.currentRenderedProduct;
    let printQty = document.getElementById('print-qty-input').value;
    printQty = parseInt(printQty);

    if (!printQty || printQty <= 0) return;

    let targetBarcode = data.urunKodu; 
    const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
    if (data.barkod && !invalidCodes.includes(data.barkod)) {
        targetBarcode = data.barkod;
    }

    let printContainer = document.getElementById('print-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        document.body.appendChild(printContainer);
    }
    printContainer.innerHTML = ''; 

    // Orijinal Sistemdeki gibi ismi Virgüle (,) göre bölüp 2 satır yapma zekası
    let urunParts = data.urunAdi.split(',');
    let displayName = urunParts[0].trim();
    if (urunParts.length > 1) {
        displayName += "<br>" + urunParts[1].trim(); 
    }

    for(let i=0; i < printQty; i++) {
        const label = document.createElement('div');
        label.className = 'mini-label';
        label.innerHTML = `
            <div class="p-name">${displayName}</div>
            <svg id="print-bc-${i}"></svg>
            <div class="p-code">${data.urunKodu}</div>
        `;
        printContainer.appendChild(label);
    }

    if(window.JsBarcode) {
        for(let i=0; i < printQty; i++) {
            JsBarcode(`#print-bc-${i}`, targetBarcode, {
                format: "CODE128",
                width: 1.2,
                height: 30,
                displayValue: false,
                margin: 0
            });
        }
    }

    closePrintModal();
    setTimeout(() => { window.print(); }, 300);
};

// =========================================================================
// DÜZENLEME MANTIĞI
// =========================================================================
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

    if (!newVal) return alert("Hata: Değer boş bırakılamaz.");

    const updateData = {};
    if (type === 'b') {
        updateData.barkod = newVal;
        updateData.docLinks = { kunye: "", etiket: "", kilavuz: "" };
    } else if (type === 'r') {
        updateData.refNo = newVal;
        updateData.docLinks = { kunye: "", etiket: "", kilavuz: "" };
    } else if (type === 'm') {
        updateData.miatTarihi = newVal;
    }

    try {
        const anaRef = doc(db, "ana_depo", id);
        const amRef = doc(db, "ameliyathane", id);
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);
        
        await buildCatalog(); 
        fetchAndDisplayProduct(id); 
    } catch (err) { alert("Sistem Hatası: " + err.message); }
};

function createEditUI(id, type, val, placeholder, colorClass) {
    const isSet = val && val !== "TANIMLI DEĞİL" && val !== "BULUNAMADI" && val !== "-" && val !== "TAM EŞLEŞME YOK" && val !== "SONUÇ YOK";
    if (isSet) {
        return `
            <div id="txt-container-${type}-${id}" class="flex-edit">
                <span style="color: ${colorClass};" class="value-text mobile-break">${val}</span>
                <button onclick="editField('${id}', '${type}')" class="btn-edit">✎ DÜZENLE</button>
            </div>
            <div id="edit-${type}-${id}" class="flex-edit" style="display:none;">
                <input type="text" id="man-${type}-${id}" value="${val}" class="input-style">
                <div class="edit-btn-group">
                    <button onclick="saveUpdate('${id}', '${type}')" class="btn-save" style="background:#ffbc00; color:#000;">OK</button>
                    <button onclick="cancelEdit('${id}', '${type}')" class="btn-cancel">X</button>
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

            renderCard(mergedData);
        } else {
            resultContainer.innerHTML = `
                <div class="card-main" style="text-align:center; border-color:#330000; background:#110000;">
                    <div style="color: #ff3333; font-size: 28px; font-weight: 800; margin-bottom: 10px;">KAYIT BULUNAMADI</div>
                    <div style="color: #888; font-size: 16px; font-family: monospace;">Aranan Kod: <span style="color:#fff;">${code}</span></div>
                </div>
            `;
        }
    } catch (err) { resultContainer.innerHTML = `<div style="color:#f33;">Sistem Hatası: ${err.message}</div>`; }
};

function renderCard(data) {
    window.currentRenderedProduct = data;

    const min = parseInt(data.minAlert) || 0;
    const max = parseInt(data.max) || 0;
    const getS = (val, has) => (!has ? { c: '#fb0', t: 'TANIMSIZ' } : { c: val <= min ? '#ff3333' : '#fff', t: val });
    const sAna = getS(data.anaMiktar, data.hasAna);
    const sAm = getS(data.amMiktar, data.hasAm);

    const barkodUI = createEditUI(data.urunKodu, 'b', data.barkod, '1. Barkod Okut...', '#ccc');
    const refUI = createEditUI(data.urunKodu, 'r', data.refNo, 'Ref No Yaz...', '#fff');
    const miatUI = createEditUI(data.urunKodu, 'm', data.miatTarihi, 'GG.AA.YYYY', '#ff3333');

    resultContainer.innerHTML = `
        <div class="card-wrapper">
            <div class="card-main">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; gap: 20px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <div class="label-text">ÜRÜN BİLGİSİ</div>
                        <div class="title-text">${data.urunAdi}</div>
                    </div>
                    <button onclick="openPrintModal()" class="btn-save btn-print-mobile" style="background: #00ccff; color: #000; padding: 14px 28px; font-size: 13px; width: auto; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,204,255,0.2);">🖨️ ETİKET YAZDIR</button>
                </div>
                
                <div class="grid-details">
                    <div>
                        <div class="label-text">ÜRÜN KODU</div>
                        <div class="value-text" style="color:#00ff00; margin-bottom: 12px;">${data.urunKodu}</div>
                        <div style="background: #fff; padding: 6px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                            <svg id="ui-barcode" style="max-height: 42px; width: auto;"></svg>
                        </div>
                    </div>
                    
                    <div><div class="label-text">REF NO</div><div>${refUI}</div></div>
                    <div><div class="label-text">BARKOD</div><div>${barkodUI}</div></div>
                    <div><div class="label-text">MİAT TARİHİ</div><div>${miatUI}</div></div>
                    
                    <div><div class="label-text">ALT GRUP</div><div class="value-text" style="color:#ffbc00;">${data.altGrup}</div></div>
                    <div><div class="label-text">SÜREÇ TİPİ</div><div class="value-text" style="color:#ccc;">${data.surecTipi}</div></div>
                </div>

                <div style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
                    <div class="label-text" style="margin-bottom:15px;">ÜTS BELGELERİ VE GÖRSELLER</div>
                    <div class="doc-links-container" style="display: flex; gap: 15px; flex-wrap: wrap;">
                        ${data.docLinks.kunye ? `<a href="${data.docLinks.kunye}" target="_blank" class="doc-link" style="color:#00ccff;">📄 Ürün Künyesi</a>` : ``}
                        ${data.docLinks.etiket ? `<a href="${data.docLinks.etiket}" target="_blank" class="doc-link" style="color:#ffbc00;">🖼️ Etiket / Ambalaj</a>` : ``}
                        ${data.docLinks.kilavuz ? `<a href="${data.docLinks.kilavuz}" target="_blank" class="doc-link" style="color:#00ff00;">📖 Kullanma Kılavuzu</a>` : ``}
                        ${(!data.docLinks.kunye && !data.docLinks.etiket && !data.docLinks.kilavuz) ? `<span style="color:#444; font-size:13px; font-style:italic; padding:10px 0;">Sistem belgeleme bekliyor...</span>` : ``}
                    </div>
                </div>
            </div>

            <div class="card-sidebar">
                <div class="stock-box">
                    <div class="label-text" style="margin-bottom:15px; font-size:14px;">ANA DEPO STOK</div>
                    <div style="font-size:80px; font-weight:800; color:${sAna.c}; line-height:1;">${sAna.t}</div>
                    ${data.hasAna ? `
                        <div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                        <div style="text-align: left; padding: 0 10px;">
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.anaStokAdresi}</span></div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ${data.anaDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'};">${data.anaDummy}</span></div>
                            <div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ${data.anaReuse === 'REUSE' ? '#ff3333' : '#00ccff'};">${data.anaReuse}</span></div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="stock-box">
                    <div class="label-text" style="margin-bottom:15px; font-size:14px;">AMELİYATHANE STOK</div>
                    <div style="font-size:80px; font-weight:800; color:${sAm.c}; line-height:1;">${sAm.t}</div>
                    ${data.hasAm ? `
                        <div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                        <div style="text-align: left; padding: 0 10px;">
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.amStokAdresi}</span></div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ${data.amDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'};">${data.amDummy}</span></div>
                            <div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ${data.amReuse === 'REUSE' ? '#ff3333' : '#00ccff'};">${data.amReuse}</span></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        if(window.JsBarcode) {
            let targetBarcode = data.urunKodu;
            const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
            
            if (data.barkod && !invalidCodes.includes(data.barkod)) targetBarcode = data.barkod;

            JsBarcode("#ui-barcode", targetBarcode, {
                format: "CODE128",
                width: 1.5,
                height: 40,
                displayValue: false,
                lineColor: "#000",
                background: "transparent",
                margin: 0
            });
        }
    }, 150);
}
