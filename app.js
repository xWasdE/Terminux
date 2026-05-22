import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================================
// BARKOD KÜTÜPHANESİ EKLENİYOR
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

// =========================================================================
// TERMINUX NEXUS CSS MOTORU & KUSURSUZ YAZDIRMA KALIBI
// =========================================================================
const style = document.createElement('style');
style.innerHTML = `
    * { box-sizing: border-box; }
    body { background: #050505; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; padding-bottom: 80px; }
    
    .app-header { background: #000; padding: 15px 20px; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
    .app-logo { font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #fff; display: flex; align-items: center; gap: 10px; }
    .app-logo span { color: #00ff00; }
    
    .main-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .card-wrapper { display: flex; gap: 30px; width: 100%; align-items: stretch; }
    .card-main { flex: 1.5; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    .card-sidebar { flex: 1; display: flex; flex-direction: column; gap: 30px; }
    .stock-box { flex: 1; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 35px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    
    .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; border-top: 1px solid #1a1a1a; padding-top: 30px; }
    .title-text { font-size: 28px; font-weight: 800; color: #fff; line-height: 1.3; word-break: break-word; }
    .label-text { font-size: 11px; color: #777; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
    .value-text { font-size: 18px; font-family: monospace; font-weight: bold; }
    
    .input-style { background: #000; border: 1px solid #333; color: #fff; padding: 10px 12px; border-radius: 6px; font-family: monospace; width: 100%; max-width: 160px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .input-style:focus { border-color: #00ff00; }
    .btn-save { background: #00ff00; color: #000; border: none; padding: 10px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px; }
    .btn-cancel { background: #111; color: #ff3333; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
    .btn-edit { background: #111; border: 1px solid #333; color: #aaa; padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: 0.2s; }
    .btn-edit:hover { color: #fff; background: #333; border-color: #555; }
    
    .flex-edit { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .edit-btn-group { display: flex; gap: 5px; }
    .doc-link { background: #111; border: 1px solid #333; padding: 10px 15px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block; transition: 0.2s; }
    .mobile-break { word-break: break-all; }

    /* ALT MENÜ */
    .bottom-nav { position: fixed; bottom: 0; left: 0; width: 100%; background: #000; border-top: 1px solid #1a1a1a; display: flex; justify-content: space-around; padding: 10px 5px; padding-bottom: calc(10px + env(safe-area-inset-bottom)); z-index: 1000; }
    .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; color: #555; text-decoration: none; cursor: pointer; transition: 0.2s; }
    .nav-item.active { color: #00ff00; }
    .nav-icon { font-size: 20px; }
    .nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }

    /* TOAST MESAJI */
    .toast-msg { visibility: hidden; min-width: 250px; background-color: #ffbc00; color: #000; text-align: center; border-radius: 8px; padding: 15px; position: fixed; z-index: 2000; left: 50%; bottom: 100px; transform: translateX(-50%); font-weight: bold; font-size: 14px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s, visibility 0.3s; }
    .toast-msg.show { visibility: visible; opacity: 1; }

    @media (max-width: 900px) {
        .card-wrapper { flex-direction: column; gap: 15px; }
        .card-main, .stock-box { padding: 20px; }
        .grid-details { grid-template-columns: 1fr; gap: 20px; margin-top: 20px; padding-top: 20px; }
        .title-text { font-size: 22px; }
        .input-style { max-width: 100%; padding: 14px; font-size: 16px; margin-bottom: 5px; }
        .btn-save, .btn-cancel { padding: 14px; font-size: 14px; flex: 1; }
        .flex-edit { flex-direction: column; align-items: stretch; width: 100%; }
        .edit-btn-group { width: 100%; display: flex; gap: 10px; }
        .doc-links-container { display: flex; flex-direction: column; gap: 10px; }
        .doc-link { text-align: center; padding: 15px; }
    }

    /* =======================================================
       YAZDIRMA MOTORU (Chrome Reklamları Yok Edildi, 2 Sütun Düzeni)
       ======================================================= */
    @media screen {
        #print-container { display: none !important; }
    }

    @media print {
        @page { 
            margin: 0 !important; /* TARAYICI TARİH/LİNK YAZILARINI YOK EDER */
            size: 8.3cm auto; /* ZEBRA YAZICI RULO GENİŞLİĞİ */
        }
        body, html { margin: 0; padding: 0; background: #fff; }
        body * { visibility: hidden; }
        #print-container, #print-container * { visibility: visible; }
        
        #print-container {
            position: absolute; left: 0; top: 0;
            display: grid;
            grid-template-columns: 4cm 4cm; /* Yan yana 2 Etiket */
            column-gap: 0.3cm; /* Etiketler Arası Boşluk */
            row-gap: 0cm; /* Alt alta dizilim (boşluk rulo kesim yerindedir) */
            width: 8.3cm; 
            margin: 0; padding: 0;
            background: #fff;
        }
        
        .mini-label {
            width: 4cm;
            height: 2.1cm; /* Yükseklik (4 tanesi 8.4cm yapar) */
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            overflow: hidden; padding: 2px; box-sizing: border-box;
            color: #000; font-family: Arial, sans-serif; page-break-inside: avoid;
        }
        
        .mini-label .p-name { 
            font-size: 8px; 
            font-weight: bold; 
            width: 100%; 
            text-align: center; 
            margin-bottom: 2px; 
            display: -webkit-box;
            -webkit-line-clamp: 2; /* 2 Satır Sınırı */
            -webkit-box-orient: vertical;
            overflow: hidden;
            white-space: normal;
            line-height: 1.1;
        }
        
        .mini-label svg { height: 1.1cm !important; width: 100% !important; max-width: 3.8cm; }
        .mini-label .p-code { font-size: 9px; font-weight: bold; text-align: center; margin-top: 2px; letter-spacing: 1px; }
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

const searchInput = document.getElementById('main-search');
const dropdown = document.getElementById('dropdown-results');
const resultContainer = document.getElementById('result-container');

let productCatalog = [];
let searchTimeout = null;
window.currentRenderedProduct = null;

// Sisteme Menü ve Toast Ekleniyor
document.body.insertAdjacentHTML('beforeend', `
    <div id="toast-msg" class="toast-msg">🛠️ Bu modül yapım aşamasındadır.</div>
    <div class="bottom-nav">
        <div class="nav-item active">
            <div class="nav-icon">🔍</div>
            <div class="nav-label">STOK KARTI</div>
        </div>
        <div class="nav-item" onclick="showToast()">
            <div class="nav-icon">🚚</div>
            <div class="nav-label">SEVK / KABUL</div>
        </div>
        <div class="nav-item" onclick="showToast()">
            <div class="nav-icon">📋</div>
            <div class="nav-label">SAYIM</div>
        </div>
        <div class="nav-item" onclick="showToast()">
            <div class="nav-icon">🏢</div>
            <div class="nav-label">ADRESLEME</div>
        </div>
    </div>
`);

window.showToast = () => {
    const toast = document.getElementById("toast-msg");
    toast.className = "toast-msg show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// GLOBAL ÇIKIŞ FONKSİYONU (ZIRHLI)
window.logoutApp = async () => {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (err) {
        alert("Çıkış yapılırken bir hata oluştu!");
    }
};

setPersistence(auth, browserLocalPersistence);
onAuthStateChanged(auth, async (user) => {
    try {
        if (user) {
            // Güvenli Header Ekleme
            if(!document.querySelector('.app-header')) {
                const header = document.createElement('div');
                header.className = 'app-header';
                const operatorName = user.email.split('@')[0].toUpperCase();
                header.innerHTML = `
                    <div class="app-logo">TERMINUX <span>NEXUS</span></div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <span style="font-size:12px; color:#888;">OP: <b style="color:#fff;">${operatorName}</b></span>
                        <button onclick="logoutApp()" style="background:none; border:1px solid #333; color:#f33; padding:5px 10px; border-radius:4px; font-size:10px; cursor:pointer;">ÇIKIŞ</button>
                    </div>`;
                document.body.insertBefore(header, document.body.firstChild);
                
                const oldHeader = document.getElementById('header-bar');
                if (oldHeader) oldHeader.style.display = 'none'; 
            }

            await buildCatalog();
            
            const loadScreen = document.getElementById('loading-screen');
            if(loadScreen) loadScreen.classList.add('hidden');
            
            const appScreen = document.getElementById('app-screen');
            if(appScreen) {
                appScreen.classList.remove('hidden');
                appScreen.classList.add('main-container');
            }
            if (searchInput) searchInput.focus();
            
        } else {
            const loadScreen = document.getElementById('loading-screen');
            if(loadScreen) loadScreen.classList.add('hidden');
            
            const appScreen = document.getElementById('app-screen');
            if(appScreen) appScreen.classList.add('hidden');
            
            const logScreen = document.getElementById('login-screen');
            if(logScreen) logScreen.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Başlatma Hatası: ", err);
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
    if (searchInput && dropdown && !searchInput.contains(e.target) && !dropdown.contains(e.target) && !e.target.closest('.search-item')) {
        dropdown.style.display = 'none';
    }
});

if(searchInput) {
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
                        <div style="color: #fff; font-size: 15px; font-weight: 600;">${m.urunAdi}</div>
                        <div style="color: #888; font-size: 11px; font-family: monospace; margin-top:6px;">KOD: <span style="color:#0f0;">${m.urunKodu}</span> | REF: ${m.refNo}</div>
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
}

// =========================================================================
// YAZDIRMA (PRINT) TETİKLEYİCİ - ZEBRA ZT230 YAN YANA 2'Lİ
// =========================================================================
window.printLabel = () => {
    const data = window.currentRenderedProduct;
    if (!data) return alert("Yazdırılacak ürün bulunamadı!");

    let printQty = prompt("Kaç adet etiket basılsın? (Sistem yan yana 2'li olarak kesecektir)", "8");
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

    for(let i=0; i < printQty; i++) {
        const label = document.createElement('div');
        label.className = 'mini-label';
        label.innerHTML = `
            <div class="p-name">${data.urunAdi}</div>
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

    // Yazdırma dialoğu açılmadan önce küçük bir tampon süre bırakıyoruz.
    setTimeout(() => { 
        window.print(); 
    }, 300);
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
                    <button onclick="saveUpdate('${id}', '${type}')" class="btn-save">OK</button>
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
    resultContainer.innerHTML = '<div style="color: #666; font-size: 20px; text-align:center; padding: 50px;">Veriler Çekiliyor...</div>';

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
            resultContainer.innerHTML = `<div class="card-main" style="text-align:center; border-color:#330000;">
                                            <div style="color: #ff3333; font-size: 24px; font-weight: 800; margin-bottom: 10px;">KAYIT BULUNAMADI</div>
                                            <div style="color: #888; font-size: 14px; font-family: monospace;">Aranan Kod: <span style="color:#fff;">${code}</span></div>
                                         </div>`;
        }
    } catch (err) { resultContainer.innerHTML = `<div style="color:#f33; padding: 20px;">Sistem Hatası: ${err.message}</div>`; }
};

function renderCard(data) {
    window.currentRenderedProduct = data;

    const min = parseInt(data.minAlert) || 0;
    const max = parseInt(data.max) || 0;
    const getS = (val, has) => (!has ? { c: '#fb0', t: 'TANIMSIZ' } : { c: val <= min ? '#ff3333' : '#fff', t: val });
    const sAna = getS(data.anaMiktar, data.hasAna);
    const sAm = getS(data.amMiktar, data.hasAm);

    const barkodUI = createEditUI(data.urunKodu, 'b', data.barkod, 'Barkod Okut...', '#ccc');
    const refUI = createEditUI(data.urunKodu, 'r', data.refNo, 'Ref No Yaz...', '#fff');
    const miatUI = createEditUI(data.urunKodu, 'm', data.miatTarihi, 'GG.AA.YYYY', '#ff3333');

    resultContainer.innerHTML = `
        <div class="card-wrapper">
            <div class="card-main">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <div class="label-text">ÜRÜN BİLGİSİ</div>
                        <div class="title-text">${data.urunAdi}</div>
                    </div>
                    <button onclick="printLabel()" class="btn-save" style="background: #00ccff; color: #000; padding: 12px 24px; font-size: 13px; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,204,255,0.2);">🖨️ ETİKET YAZDIR</button>
                </div>
                
                <div class="grid-details">
                    <div>
                        <div class="label-text">ÜRÜN KODU</div>
                        <div class="value-text" style="color:#00ff00; margin-bottom: 8px;">${data.urunKodu}</div>
                        <div style="background: #fff; padding: 5px; border-radius: 4px; display: inline-block;">
                            <svg id="ui-barcode" style="max-height: 38px; width: auto;"></svg>
                        </div>
                    </div>
                    
                    <div><div class="label-text">REF NO</div><div>${refUI}</div></div>
                    <div><div class="label-text">BARKOD</div><div>${barkodUI}</div></div>
                    <div><div class="label-text">MİAT TARİHİ</div><div>${miatUI}</div></div>
                    <div><div class="label-text">ALT GRUP</div><div class="value-text" style="color:#ffbc00;">${data.altGrup}</div></div>
                    <div><div class="label-text">SÜREÇ TİPİ</div><div class="value-text" style="color:#ccc;">${data.surecTipi}</div></div>
                </div>

                <div style="margin-top: 30px; border-top: 1px solid #1a1a1a; padding-top: 25px;">
                    <div class="label-text" style="margin-bottom:12px;">ÜTS BELGELERİ VE GÖRSELLER</div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        ${data.docLinks.kunye ? `<a href="${data.docLinks.kunye}" target="_blank" class="doc-link" style="color:#00ccff;">📄 Ürün Künyesi</a>` : ``}
                        ${data.docLinks.etiket ? `<a href="${data.docLinks.etiket}" target="_blank" class="doc-link" style="color:#ffbc00;">🖼️ Etiket / Ambalaj</a>` : ``}
                        ${data.docLinks.kilavuz ? `<a href="${data.docLinks.kilavuz}" target="_blank" class="doc-link" style="color:#00ff00;">📖 Kullanma Kılavuzu</a>` : ``}
                        ${(!data.docLinks.kunye && !data.docLinks.etiket && !data.docLinks.kilavuz) ? `<span style="color:#555; font-size:12px; font-style:italic; padding:5px 0;">Sistem belgeleme bekliyor...</span>` : ``}
                    </div>
                </div>
            </div>

            <div class="card-sidebar">
                <div class="stock-box">
                    <div class="label-text" style="margin-bottom:10px; font-size:13px;">ANA DEPO STOK</div>
                    <div style="font-size:70px; font-weight:800; color:${sAna.c}; line-height:1;">${sAna.t}</div>
                    ${data.hasAna ? `
                        <div style="font-size: 12px; color: #555; margin-top: 10px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                        <div style="text-align: left; padding: 0 5px;">
                            <div style="font-size: 12px; color: #777; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.anaStokAdresi}</span></div>
                            <div style="font-size: 12px; color: #777; margin-bottom: 5px;">DUMMY: <span style="color: ${data.anaDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'};">${data.anaDummy}</span></div>
                            <div style="font-size: 12px; color: #777;">CİHAZ: <span style="color: ${data.anaReuse === 'REUSE' ? '#ff3333' : '#00ccff'};">${data.anaReuse}</span></div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="stock-box">
                    <div class="label-text" style="margin-bottom:10px; font-size:13px;">AMELİYATHANE STOK</div>
                    <div style="font-size:70px; font-weight:800; color:${sAm.c}; line-height:1;">${sAm.t}</div>
                    ${data.hasAm ? `
                        <div style="font-size: 12px; color: #555; margin-top: 10px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                        <div style="text-align: left; padding: 0 5px;">
                            <div style="font-size: 12px; color: #777; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.amStokAdresi}</span></div>
                            <div style="font-size: 12px; color: #777; margin-bottom: 5px;">DUMMY: <span style="color: ${data.amDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'};">${data.amDummy}</span></div>
                            <div style="font-size: 12px; color: #777;">CİHAZ: <span style="color: ${data.amReuse === 'REUSE' ? '#ff3333' : '#00ccff'};">${data.amReuse}</span></div>
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
                height: 35,
                displayValue: false,
                lineColor: "#000",
                background: "transparent",
                margin: 0
            });
        }
    }, 150);
}
