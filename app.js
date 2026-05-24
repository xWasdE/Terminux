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
    body { background: #050505; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; padding-bottom: 80px !important; }
    
    .app-header { background: #000; padding: 15px 20px; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }
    .header-left { display: flex; align-items: center; gap: 15px; }
    .btn-back { background: #222; color: #fff; border: 1px solid #444; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; display: none; transition: 0.2s; }
    .btn-back:hover { background: #333; }
    .app-logo { font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #fff; }
    .app-logo span { color: #888; font-weight: normal; }
    .header-right { display: flex; align-items: center; gap: 15px; }
    .op-text { font-size: 12px; color: #888; }
    .op-text b { color: #fff; }
    .btn-logout { background: transparent; border: 1px solid #f33; color: #f33; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    .btn-logout:hover { background: #f33; color: #000; }

    #dashboard-screen { padding: 40px 20px; max-width: 900px; margin: 0 auto; }
    .dash-title { text-align: center; color: #666; font-size: 14px; letter-spacing: 3px; margin-bottom: 30px; font-weight: bold; }
    .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .dash-btn { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 50px 20px; text-align: center; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 10px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .dash-btn:hover { border-color: #00ff00; transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,255,0,0.1); }
    .dash-icon { font-size: 45px; }
    .dash-text { font-size: 16px; font-weight: 800; color: #fff; letter-spacing: 1px; }

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

    .toast-msg { visibility: hidden; min-width: 250px; background-color: #ffbc00; color: #000; text-align: center; border-radius: 8px; padding: 15px; position: fixed; z-index: 2000; left: 50%; bottom: 50px; transform: translateX(-50%); font-weight: bold; font-size: 14px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); opacity: 0; transition: opacity 0.3s, visibility 0.3s; }
    .toast-msg.show { visibility: visible; opacity: 1; }

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

    /* LİGHTBOX BÜYÜTME EKRANI CSS */
    #lightbox-modal {
        display: none; position: fixed; z-index: 15000; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); align-items: center; justify-content: center; backdrop-filter: blur(5px);
    }
    #lightbox-img {
        max-width: 90%; max-height: 90%; border-radius: 8px; border: 2px solid #333; box-shadow: 0 0 30px rgba(0,0,0,0.8);
    }
    .lightbox-close {
        position: absolute; top: 20px; right: 30px; font-size: 40px; color: #fff; cursor: pointer; transition: 0.2s;
    }
    .lightbox-close:hover { color: #ff3333; }

    @media (max-width: 900px) {
        .dash-grid { grid-template-columns: 1fr; }
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
        .legal-footer { font-size: 11px; padding: 12px; }
    }

    /* ZEBRA ZT230 YAZDIRMA (PRINT) MOTORU - ORTALANMIŞ 2'Lİ SÜTUN */
    @media screen {
        #print-container { display: none !important; }
    }
    @media print {
        @page { margin: 0 !important; size: 8.3cm auto; }
        body, html { margin: 0; padding: 0; background: #fff; width: 8.3cm; display: flex; justify-content: center; }
        body * { visibility: hidden; }
        #print-container, #print-container * { visibility: visible; }
        .legal-footer { display: none !important; }
        
        #print-container {
            position: absolute; left: 0; top: 0;
            display: grid; grid-template-columns: 3.9cm 3.9cm; column-gap: 0.3cm; row-gap: 0cm; 
            width: 8.1cm; margin: 0 auto; background: #fff;
        }
        .mini-label {
            width: 3.9cm; height: 1.9cm; display: flex; flex-direction: column; justify-content: center; align-items: center;
            overflow: hidden; padding: 1px; box-sizing: border-box; color: #000; font-family: Arial, sans-serif; page-break-inside: avoid;
        }
        .mini-label .p-name { 
            font-size: 6.5px; font-weight: bold; width: 100%; text-align: center; margin-bottom: 2px; 
            display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; line-height: 1.1; max-height: 22px; 
        }
        .mini-label svg { height: 0.8cm !important; width: 100% !important; max-width: 3.5cm; margin: 0 auto; }
        .mini-label .p-code { font-size: 8px; font-weight: bold; text-align: center; margin-top: 1px; letter-spacing: 0.5px; }
    }
`;
document.head.appendChild(style);

// UI OLUŞTURMA (HEADER, DASHBOARD, MODAL, FOOTER, LİGHTBOX)
const headerDiv = document.createElement('div');
headerDiv.id = 'dynamic-header';
headerDiv.className = 'app-header';
headerDiv.style.display = 'none'; 
headerDiv.innerHTML = `
    <div class="header-left">
        <button id="btn-go-dash" class="btn-back">⬅ GERİ</button>
        <div class="app-logo">TERMINUX <span>WMS</span></div>
    </div>
    <div class="header-right">
        <span class="op-text">OP: <b id="ui-op-name">USER</b></span>
        <button onclick="logoutApp()" class="btn-logout">ÇIKIŞ</button>
    </div>
`;
document.body.insertBefore(headerDiv, document.body.firstChild);

const oldHeader = document.getElementById('header-bar');
if(oldHeader) oldHeader.style.display = 'none';

const dashDiv = document.createElement('div');
dashDiv.id = 'dashboard-screen';
dashDiv.style.display = 'none';
dashDiv.innerHTML = `
    <div class="dash-title">LÜTFEN İŞLEM YAPMAK İSTEDİĞİNİZ MODÜLÜ SEÇİNİZ</div>
    <div class="dash-grid">
        <div class="dash-btn" onclick="openModule('stok')">
            <div class="dash-icon">🔍</div>
            <div class="dash-text">STOK KARTI</div>
        </div>
        <div class="dash-btn" onclick="showToast()">
            <div class="dash-icon">🚚</div>
            <div class="dash-text">SEVK / MAL KABUL</div>
        </div>
        <div class="dash-btn" onclick="showToast()">
            <div class="dash-icon">📋</div>
            <div class="dash-text">SAYIM</div>
        </div>
        <div class="dash-btn" onclick="showToast()">
            <div class="dash-icon">🏢</div>
            <div class="dash-text">DEPO ADRESLEME</div>
        </div>
    </div>
`;
if (document.getElementById('app-screen')) {
    document.body.insertBefore(dashDiv, document.getElementById('app-screen'));
}

document.body.insertAdjacentHTML('beforeend', `
    <div id="toast-msg" class="toast-msg">🛠️ Bu modül şu an yapım aşamasındadır.</div>
    
    <div id="lightbox-modal">
        <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
        <img id="lightbox-img" src="">
    </div>

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

window.showToast = () => {
    const toast = document.getElementById("toast-msg");
    toast.className = "toast-msg show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// LİGHTBOX FONKSİYONLARI
window.openLightbox = (src) => {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-modal').style.display = 'flex';
}
window.closeLightbox = () => {
    document.getElementById('lightbox-modal').style.display = 'none';
    document.getElementById('lightbox-img').src = "";
}

window.logoutApp = async () => {
    try { await signOut(auth); window.location.reload(); } 
    catch (err) { alert("Çıkış Hatası!"); }
};

window.openModule = (mod) => {
    if(mod === 'stok') {
        document.getElementById('dashboard-screen').style.display = 'none';
        const appSc = document.getElementById('app-screen');
        if(appSc) {
            appSc.classList.remove('hidden');
            appSc.classList.add('main-container');
        }
        document.getElementById('btn-go-dash').style.display = 'block';
        if(document.getElementById('main-search')) document.getElementById('main-search').focus();
    }
};

const btnGoDash = document.getElementById('btn-go-dash');
if(btnGoDash) {
    btnGoDash.addEventListener('click', () => {
        const appSc = document.getElementById('app-screen');
        if(appSc) {
            appSc.classList.add('hidden');
            appSc.classList.remove('main-container');
        }
        document.getElementById('btn-go-dash').style.display = 'none';
        document.getElementById('dashboard-screen').style.display = 'block';
        if(document.getElementById('main-search')) document.getElementById('main-search').value = '';
        if(document.getElementById('dropdown-results')) document.getElementById('dropdown-results').style.display = 'none';
        if(document.getElementById('result-container')) document.getElementById('result-container').innerHTML = '';
    });
}

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

window.executeLoginProcess = async () => {
    const uInput = document.getElementById('username');
    const pInput = document.getElementById('password');

    if (!uInput || !pInput) return;
    const valU = uInput.value.trim();
    const valP = pInput.value;
    if (!valU || !valP) {
        alert("Lütfen kullanıcı adı ve şifre girin!");
        return;
    }

    const finalEmail = valU.toLowerCase() === 'test' ? 'test@terminux.com.tr' : (valU.includes('@') ? valU : `${valU}@terminux.com.tr`);
    const finalPass = (valU.toLowerCase() === 'test' && valP === 'test') ? 'testtest' : valP;

    try { 
        await signInWithEmailAndPassword(auth, finalEmail, finalPass); 
    } catch (error) { 
        alert("Giriş Başarısız: Şifrenizi veya Kullanıcı Adınızı kontrol edin."); 
    }
};

document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'login-form') {
        e.preventDefault();
        window.executeLoginProcess();
    }
});

document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'login-btn' || e.target.id === 'btn-login' || e.target.innerText?.trim().toLowerCase() === 'giriş yap')) {
        e.preventDefault(); 
        window.executeLoginProcess();
    }
});

let productCatalog = [];
let searchTimeout = null;
window.currentRenderedProduct = null;

setPersistence(auth, browserLocalPersistence);
onAuthStateChanged(auth, async (user) => {
    const loadScreen = document.getElementById('loading-screen');
    const logScreen = document.getElementById('login-screen');
    
    if (user) {
        if(document.getElementById('ui-op-name')) document.getElementById('ui-op-name').textContent = user.email.split('@')[0].toUpperCase();
        await buildCatalog();
        
        if(loadScreen) loadScreen.classList.add('hidden');
        if(logScreen) logScreen.classList.add('hidden');
        
        document.getElementById('dynamic-header').style.display = 'flex';
        document.getElementById('dashboard-screen').style.display = 'block';
        if(document.getElementById('app-screen')) document.getElementById('app-screen').classList.add('hidden'); 
    } else {
        if(loadScreen) loadScreen.classList.add('hidden');
        document.getElementById('dynamic-header').style.display = 'none';
        document.getElementById('dashboard-screen').style.display = 'none';
        if(document.getElementById('app-screen')) document.getElementById('app-screen').classList.add('hidden');
        if(logScreen) logScreen.classList.remove('hidden');
    }
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
                    utsGorseller: data.utsGorseller || [], // Dizi olarak görseller
                    utsEtiketPdf: String(data.utsEtiketPdf || ""), // Etiket PDF linki
                    searchString: `${data.urunAdi || ""} ${data.urunKodu || ""} ${data.barkod || ""} ${data.refNo || ""} ${data.altGrup || ""}`.toLowerCase()
                });
            }
        };

        anaSnap.forEach(processDoc);
        amSnap.forEach(processDoc);
        productCatalog = Array.from(tempMap.values());
    } catch (error) { console.error("Katalog hatası:", error); }
}

const searchInput = document.getElementById('main-search');
const dropdown = document.getElementById('dropdown-results');
const resultContainer = document.getElementById('result-container');

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

    let urunParts = data.urunAdi.split(',');
    let displayName = urunParts[0].trim();
    if (urunParts.length > 1) {
        displayName += "<br>" + urunParts.slice(1).join(', ').trim(); 
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
// ÜTS ÇEKİM MOTORU (CORS PROXY & SİMÜLASYON)
// =========================================================================
window.autoFetchUTS = async (id, barkod) => {
    const gorselContainer = document.getElementById('uts-gorsel-container');
    if(gorselContainer) {
        gorselContainer.innerHTML = `<div style="color:#00ff00; font-size:12px; font-weight:bold; padding: 10px 0; width:100%;">🔄 ÜTS'den Bilgiler Çekiliyor... Lütfen Bekleyin...</div>`;
    }
    
    try {
        /*
        NOT: Gerçekte ÜTS sunucularından resmi (PDF veya resim) çekmek için proxy sunucusunu yazıp buraya entegre edeceksin.
        Örnek Proxy İsteği:
        const response = await fetch(`https://api.allorigins.win/get?url=https://utsuygulama.saglik.gov.tr/rest/bilgi/urungorsel/sorgula?barkod=${barkod}`);
        */
        
        // SİSTEMİN ŞU AN ÇÖKMESİNİ ENGELLEMEK VE TEST EDEBİLMEN İÇİN GEÇİCİ SİMÜLASYON (1.5 sn bekler)
        await new Promise(r => setTimeout(r, 1500));
        
        // Simülasyon Verisi: ÜTS'den 3 görsel ve 1 PDF linki gelmiş gibi varsayalım.
        const utsGorseller = [
            "https://via.placeholder.com/300/111/00ff00?text=Urun+Kutu.jpg",
            "https://via.placeholder.com/300/111/ffbc00?text=Urun+Igneli.jpg",
            "https://via.placeholder.com/300/111/00ccff?text=Urun+Yan.jpg"
        ];
        const utsEtiketPdf = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"; // Örnek PDF

        const updateData = { utsGorseller, utsEtiketPdf };
        
        const anaRef = doc(db, "ana_depo", id);
        const amRef = doc(db, "ameliyathane", id);
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);

        // Arayüzü Güncelle (Lightbox Uyumlu Tıklanabilir Resimler)
        if (gorselContainer) {
            let html = '';
            utsGorseller.forEach(url => {
                html += `<img src="${url}" onclick="openLightbox('${url}')" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #333; cursor: zoom-in; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">`;
            });
            
            html += `<a href="${utsEtiketPdf}" target="_blank" style="width: 100px; height: 100px; background: #111; border: 1px solid #333; border-radius: 8px; display: flex; flex-direction:column; align-items: center; justify-content: center; color: #ffbc00; font-size: 11px; font-weight: bold; text-align: center; text-decoration:none; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition:0.2s;">📄<br>ORİJİNAL<br>ETİKET PDF</a>`;
            
            gorselContainer.innerHTML = html;
        }
        await buildCatalog(); 
    } catch(e) {
        console.log("ÜTS Çekim Hatası:", e);
        if (gorselContainer) gorselContainer.innerHTML = `<div style="color:#f33; font-size:12px; font-weight:bold;">❌ ÜTS Bağlantı Hatası</div>`;
    }
};

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
        // BARKOD GÜNCELLENİRSE ESKİ RESİMLERİ SİL! YENİ BARKOD İÇİN ÜTS'DEN TEKRAR ÇEKECEK.
        updateData.utsGorseller = []; 
        updateData.utsEtiketPdf = "";
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
    if(resultContainer) {
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = '<div style="color: #666; font-size: 24px;">Veriler Çekiliyor...</div>';
    }

    try {
        const [anaDoc, amDoc] = await Promise.all([getDoc(doc(db, "ana_depo", code)), getDoc(doc(db, "ameliyathane", code))]);

        if (anaDoc.exists() || amDoc.exists()) {
            const anaData = anaDoc.exists() ? anaDoc.data() : null;
            const amData = amDoc.exists() ? amDoc.data() : null;
            const baseData = anaData || amData; 

            const mergedData = {
                docId: code, 
                urunKodu: code,
                barkod: baseData.barkod || "",
                urunAdi: baseData.urunAdi || "-",
                refNo: baseData.refNo || "BULUNAMADI",
                altGrup: (anaData && anaData.altGrup) ? anaData.altGrup : ((amData && amData.altGrup) ? amData.altGrup : "-"),
                surecTipi: baseData.surecTipi || "-",
                miatTarihi: baseData.miatTarihi || "-",
                docLinks: baseData.docLinks || { kunye: "", etiket: "", kilavuz: "" }, 
                utsGorseller: baseData.utsGorseller || [],
                utsEtiketPdf: baseData.utsEtiketPdf || "",
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

            // KART EKRANA BASILDIKTAN SONRA OTOMATİK ÜTS KONTROLÜ
            let targetBarcode = mergedData.urunKodu;
            const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
            if (mergedData.barkod && !invalidCodes.includes(mergedData.barkod)) {
                targetBarcode = mergedData.barkod;
            }

            // GÖRSEL YOKSA OTOMATİK ÇEKİME BAŞLA
            if (targetBarcode && targetBarcode !== mergedData.urunKodu) {
                if (!mergedData.utsGorseller || mergedData.utsGorseller.length === 0) {
                    window.autoFetchUTS(mergedData.docId, targetBarcode);
                }
            }

        } else {
            if(resultContainer) resultContainer.innerHTML = `
                <div class="card-main" style="text-align:center; border-color:#330000; background:#110000;">
                    <div style="color: #ff3333; font-size: 28px; font-weight: 800; margin-bottom: 10px;">KAYIT BULUNAMADI</div>
                    <div style="color: #888; font-size: 16px; font-family: monospace;">Aranan Kod: <span style="color:#fff;">${code}</span></div>
                </div>
            `;
        }
    } catch (err) { if(resultContainer) resultContainer.innerHTML = `<div style="color:#f33;">Sistem Hatası: ${err.message}</div>`; }
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

    // DB'DEKİ GÖRSELLERİ UI İÇİN HAZIRLA
    let gorselHTML = '';
    const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
    const hasValidBarcode = data.barkod && !invalidCodes.includes(data.barkod);

    if (data.utsGorseller && data.utsGorseller.length > 0) {
        data.utsGorseller.forEach(url => {
            gorselHTML += `<img src="${url}" onclick="openLightbox('${url}')" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #333; cursor: zoom-in; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">`;
        });
        if(data.utsEtiketPdf) {
            gorselHTML += `<a href="${data.utsEtiketPdf}" target="_blank" style="width: 100px; height: 100px; background: #111; border: 1px solid #333; border-radius: 8px; display: flex; flex-direction:column; align-items: center; justify-content: center; color: #ffbc00; font-size: 11px; font-weight: bold; text-align: center; text-decoration:none; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition:0.2s;">📄<br>ORİJİNAL<br>ETİKET PDF</a>`;
        }
    } else if (hasValidBarcode) {
        gorselHTML = `<div style="color:#555; font-size:12px; font-weight:bold; padding: 20px 0; width:100%;">Bağlantı Kuruluyor...</div>`;
    } else {
        gorselHTML = `<div style="width: 100px; height: 100px; background: #111; border: 1px dashed #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 11px; font-weight: bold; text-align: center; line-height:1.4;">BARKOD<br>GEREKLİ</div>`;
    }

    if(resultContainer) {
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
                        <div class="label-text" style="margin-bottom:15px;">ÜTS BELGELERİ VE GÖRSELLER (Orjinal)</div>
                        
                        <div id="uts-gorsel-container" style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; min-height: 100px;">
                            ${gorselHTML}
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
    }

    setTimeout(() => {
        if(window.JsBarcode) {
            let targetBarcode = data.urunKodu;
            if (hasValidBarcode) targetBarcode = data.barkod;

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
