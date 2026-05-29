import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================================
// NGROK TÜNEL ADRESİNİZ
// =========================================================================
const UTS_API_ADRESI = "https://anchor-crushing-constant.ngrok-free.dev"; 

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
    body, html { overflow-x: hidden; max-width: 100vw; margin: 0; padding: 0; }
    body { padding-bottom: 80px !important; }
    
    .card-wrapper { display: flex; gap: 40px; width: 100%; align-items: stretch; }
    .card-main { flex: 1.3; background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    .card-sidebar { flex: 1; display: flex; flex-direction: column; gap: 40px; }
    .stock-box { flex: 1; background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
    
    .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 40px; }
    .title-text { font-size: 34px; font-weight: 800; color: #fff; line-height: 1.2; word-break: break-word; }
    .label-text { font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; }
    .value-text { font-size: 20px; font-family: monospace; font-weight: bold; }
    .stock-value { font-size: 80px; font-weight: 800; line-height: 1; word-break: break-word; overflow-wrap: break-word; }
    
    .input-style { background: #000; border: 1px solid #444; color: #fff; padding: 8px 12px; border-radius: 6px; font-family: monospace; width: 100%; max-width: 160px; font-size: 14px; outline: none; transition: border-color 0.2s; }
    .input-style:focus { border-color: #00ff00; }
    .btn-save { background: #00ff00; color: #000; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px; }
    .btn-cancel { background: #1a1a1a; color: #ff3333; border: 1px solid #333; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; transition: 0.2s; }
    .btn-edit { background: #111; border: 1px solid #333; color: #aaa; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
    .btn-edit:hover { color: #fff; background: #333; border-color: #555; }
    
    .flex-edit { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .edit-btn-group { display: flex; gap: 5px; }
    .mobile-break { word-break: break-all; }

    /* Login Screen Fixes for Mobile */
    #login-screen { width: 100vw; min-height: 100vh; overflow-x: hidden; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
    #login-screen > div, #login-form { max-width: 100% !important; box-sizing: border-box; }

    .legal-footer {
        position: fixed; bottom: 0; left: 0; width: 100%; background-color: rgba(5, 5, 5, 0.95); color: #888;
        text-align: center; padding: 16px 20px; font-size: 12px; z-index: 9999; border-top: 1px solid #1a1a1a;
        backdrop-filter: blur(8px); line-height: 1.5;
    }
    .legal-footer b { color: #aaa; font-weight: bold; }

    #lightbox-modal {
        display: none; position: fixed; z-index: 15000; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.95); align-items: center; justify-content: center; backdrop-filter: blur(5px);
    }
    #lightbox-img { max-width: 90%; max-height: 90%; border-radius: 8px; border: 2px solid #333; box-shadow: 0 0 30px rgba(0,0,0,0.8); }
    .lightbox-close { position: absolute; top: 20px; right: 30px; font-size: 40px; color: #fff; cursor: pointer; transition: 0.2s; }

    /* Mobile Responsive Optimizations */
    @media (max-width: 900px) {
        body { padding: 10px !important; padding-bottom: 120px !important; }
        .card-wrapper { flex-direction: column; gap: 15px; }
        .card-main, .stock-box { padding: 20px; }
        
        /* Compact Grid for Mobile */
        .grid-details { grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; padding-top: 20px; }
        .title-text { font-size: 20px; }
        .label-text { font-size: 10px; }
        .value-text { font-size: 14px; }
        .stock-value { font-size: 40px !important; } /* Stop Overflow on TANIMSIZ */
        
        .input-style { font-size: 12px; padding: 8px; max-width: 100%; width: 100%; margin-bottom: 5px; }
        .btn-save, .btn-cancel { padding: 8px 10px; font-size: 12px; flex: 1; }
        .btn-edit { padding: 8px; font-size: 11px; margin-top: 5px; width: 100%; }
        .flex-edit { flex-direction: column; align-items: stretch; gap: 5px; width: 100%; }
        .edit-btn-group { width: 100%; display: flex; gap: 10px; }
        .btn-print-mobile { width: 100% !important; margin-top: 15px; padding: 12px !important; }
        .legal-footer { font-size: 10px; padding: 10px; }
        svg { max-width: 100%; height: auto; }
    }

    /* Yatay (Landscape) Print Motoru */
    @media screen { #print-container { display: none !important; } }
    @media print {
        @page { margin: 0 !important; size: landscape !important; } /* Yatay Baskı Zorlaması */
        body, html { margin: 0; padding: 0; background: #fff; display: block; }
        body * { visibility: hidden; }
        #print-container, #print-container * { visibility: visible; }
        .legal-footer { display: none !important; }
        
        #print-container {
            position: absolute; left: 0; top: 0;
            display: grid;
            grid-template-rows: repeat(4, 1.9cm); 
            grid-auto-columns: 3.9cm; 
            grid-auto-flow: column; 
            column-gap: 0.2cm; row-gap: 0cm; 
            margin: 0; padding: 0; background: #fff; width: max-content;
        }
        .mini-label {
            width: 3.9cm; height: 1.9cm; 
            display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
            overflow: hidden; padding: 2px 4px; box-sizing: border-box; color: #000; font-family: Arial, sans-serif; page-break-inside: avoid;
        }
        .mini-label .p-name { 
            font-size: 7px; font-weight: bold; width: 100%; text-align: left; 
            margin-bottom: 2px; text-transform: uppercase; 
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; line-height: 1.1; 
        }
        .mini-label svg { height: 0.8cm !important; width: 100% !important; max-width: 3.5cm; margin: 0; align-self: flex-start; }
        .mini-label .p-code { font-size: 8px; font-weight: bold; text-align: left; margin-top: 1px; letter-spacing: 0.5px; } 
    }
`;
document.head.appendChild(style);

document.body.insertAdjacentHTML('beforeend', `
    <div id="lightbox-modal">
        <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
        <img id="lightbox-img" src="">
    </div>
    <div id="print-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000; justify-content:center; align-items:center; backdrop-filter:blur(3px);">
        <div style="background:#111; padding:30px; border-radius:12px; border:1px solid #333; text-align:center; width: 300px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
            <h3 style="margin-top:0; color:#fff; font-size:18px;">ETİKET YAZDIR</h3>
            <p style="color:#888; font-size:13px; margin-bottom:20px;">Yazdırılacak etiket miktarını giriniz.</p>
            <input type="number" id="print-qty-input" value="8" min="1" style="width:100%; padding:12px; border-radius:6px; border:1px solid #444; background:#000; color:#00ff00; font-size:24px; font-weight:bold; text-align:center; margin-bottom:20px; outline:none;">
            <div style="display:flex; gap:10px;">
                <button onclick="closePrintModal()" style="flex:1; padding:12px; background:#222; color:#fff; border:1px solid #444; border-radius:6px; font-weight:bold; cursor:pointer;">İPTAL</button>
                <button onclick="executePrint()" style="flex:1; padding:12px; background:#00ccff; color:#000; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">YAZDIR</button>
            </div>
        </div>
    </div>
    <div class="legal-footer">
        <b>YASAL BİLGİLENDİRME:</b> Bu sistem, tamamen operasyonel test ve iç yönetim amacıyla kapalı devre olarak çalışmaktadır. Sistem üzerinden hiçbir şekilde ticari bir faaliyet yürütülmemekte, marka veya ürün satışı yapılmamakta olup; bireysel veya kurumsal anlamda herhangi bir kazanç elde edilmemektedir.
    </div>
`);

window.openLightbox = (src) => {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox-modal').style.display = 'flex';
}
window.closeLightbox = () => {
    document.getElementById('lightbox-modal').style.display = 'none';
    document.getElementById('lightbox-img').src = "";
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

const noImageSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23111' rx='8'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='11' font-weight='bold' fill='%23ff3333' text-anchor='middle'%3EGÖRSEL BULUNAMADI%3C/text%3E%3C/svg%3E";

// =========================================================================
// NGROK GÜVENLİK DUVARI DELİCİ VE ÖNBELLEK TEMİZLEYİCİ
// =========================================================================
async function loadNgrokImage(imgElement, sourceUrl) {
    if (sourceUrl.startsWith('data:image')) {
        imgElement.src = sourceUrl;
        imgElement.onclick = () => openLightbox(sourceUrl);
        return;
    }

    let fullUrl = sourceUrl.startsWith('http') ? sourceUrl : UTS_API_ADRESI + sourceUrl;
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime();

    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                "Bypass-Tunnel-Reminder": "true",
                "ngrok-skip-browser-warning": "true"
            }
        });
        
        if (!response.ok) throw new Error("Görsele ulaşılamadı.");
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        imgElement.src = objectUrl;
        imgElement.onclick = () => openLightbox(objectUrl);
        
    } catch (error) {
        console.error("Resim Çekilemedi:", error);
        imgElement.src = noImageSvg; 
    }
}

document.addEventListener('click', async (e) => {
    if (e.target && (e.target.id === 'btn-logout' || e.target.closest('#btn-logout') || e.target.innerText?.trim().toUpperCase() === 'GÜVENLİ ÇIKIŞ')) {
        try {
            await signOut(auth);
            window.location.reload();
        } catch (err) { alert("Sistem Hatası: Oturum kapatılamadı."); }
    }
});

setPersistence(auth, browserLocalPersistence);
onAuthStateChanged(auth, async (user) => {
    if (user) {
        if(operatorName) operatorName.textContent = user.email.split('@')[0].toUpperCase();
        await buildCatalog();
        if(loadingScreen) loadingScreen.classList.add('hidden');
        if(loginScreen) loginScreen.classList.add('hidden');
        if(appScreen) appScreen.classList.remove('hidden');
        if(searchInput) searchInput.focus();
    } else {
        if(loadingScreen) loadingScreen.classList.add('hidden');
        if(appScreen) appScreen.classList.add('hidden');
        if(loginScreen) loginScreen.classList.remove('hidden');
    }
});

if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!usernameInput || !passwordInput) return;
        const finalEmail = usernameInput.value.trim().toLowerCase() === 'test' ? 'test@terminux.com.tr' : (usernameInput.value.includes('@') ? usernameInput.value : `${usernameInput.value}@terminux.com.tr`);
        const finalPass = (usernameInput.value.trim().toLowerCase() === 'test' && passwordInput.value === 'test') ? 'testtest' : passwordInput.value;

        try { await signInWithEmailAndPassword(auth, finalEmail, finalPass); } 
        catch (error) { alert("Yetkilendirme Hatası: Kullanıcı adı veya şifre geçersiz."); }
    });
}

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
                    utsGorseller: data.utsGorseller || [],
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
            dropdown.innerHTML = '<div style="padding: 20px; color: #666; font-size: 16px;">Sorgulanıyor...</div>';
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
    if (!window.currentRenderedProduct) return alert("Hata: Yazdırılacak ürün verisi bulunamadı.");
    document.getElementById('print-modal').style.display = 'flex';
};
window.closePrintModal = () => { document.getElementById('print-modal').style.display = 'none'; };

window.executePrint = () => {
    const data = window.currentRenderedProduct;
    let printQty = document.getElementById('print-qty-input').value;
    printQty = parseInt(printQty);

    if (!printQty || printQty <= 0) return;

    let targetBarcode = data.urunKodu; 
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
                format: "CODE128", width: 1.2, height: 30, displayValue: false, margin: 0
            });
        }
    }

    closePrintModal();
    setTimeout(() => { window.print(); }, 300);
};

// =========================================================================
// MERKEZİ ENTEGRASYON VE VERİTABANI YÖNETİMİ
// =========================================================================
window.autoFetchUTS = async (id, barkod) => {
    const gorselContainer = document.getElementById('uts-gorsel-container');
    if(gorselContainer) {
        gorselContainer.innerHTML = `<div style="color:#00ccff; font-size:12px; font-weight:bold; padding: 10px 0; width:100%;">Sistem sunucuları sorguluyor. (Lütfen bu sayfa açıkken bekleyiniz...)</div>`;
    }
    
    let dbUrls = []; 

    try {
        const response = await fetch(`${UTS_API_ADRESI}/api/uts?barkod=${barkod}`, {
            headers: {
                "Bypass-Tunnel-Reminder": "true",
                "ngrok-skip-browser-warning": "true"
            }
        });
        const data = await response.json(); 
        
        if (data.utsGorseller && data.utsGorseller.length > 0) {
            dbUrls = data.utsGorseller;
        }

    } catch(e) {
        if (gorselContainer) {
            gorselContainer.innerHTML = `<div style="color:#ff3333; font-size:12px; font-weight:bold; padding-bottom:10px;">Sistem Hatası: Arka plan servisine ulaşılamadı. Sunucu bağlantısını kontrol ediniz.</div>`;
        }
    }

    if (dbUrls.length === 0) {
        dbUrls.push(noImageSvg);
    }

    const updateData = { utsGorseller: dbUrls };
    
    try {
        const anaRef = doc(db, "ana_depo", id);
        const amRef = doc(db, "ameliyathane", id);
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);

        const catItem = productCatalog.find(m => m.docId === id);
        if(catItem) catItem.utsGorseller = dbUrls;
        
    } catch (dbError) {
        console.error("Veritabanı Kayıt Hatası:", dbError);
    }

    // EKRANA ÇİZİM İŞLEMİ
    if (gorselContainer) {
        gorselContainer.innerHTML = '';
        const imgQueue = [];
        
        dbUrls.forEach((url, idx) => {
            const imgId = `img-fetch-${id}-${idx}`;
            const loadingSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23111' rx='8'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='11' font-weight='bold' fill='%23555' text-anchor='middle'%3EY%C3%9CKLEN%C4%B0YOR...%3C/text%3E%3C/svg%3E";
            
            gorselContainer.innerHTML += `<img id="${imgId}" src="${loadingSvg}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #333; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">`;
            imgQueue.push({ id: imgId, url: url });
        });
        
        setTimeout(() => {
            imgQueue.forEach(item => {
                const imgEl = document.getElementById(item.id);
                if(imgEl) loadNgrokImage(imgEl, item.url);
            });
        }, 100);
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

    if (!newVal) return alert("Hata: Veri alanı boş bırakılamaz.");

    const updateData = {};
    if (type === 'b') {
        updateData.barkod = newVal;
        updateData.utsGorseller = []; 
    } else if (type === 'r') {
        updateData.refNo = newVal;
    } else if (type === 'm') {
        updateData.miatTarihi = newVal;
    }

    try {
        const anaRef = doc(db, "ana_depo", id);
        const amRef = doc(db, "ameliyathane", id);
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);
        
        const catItem = productCatalog.find(m => m.docId === id);
        if (catItem) {
            if (type === 'b') catItem.barkod = newVal;
            if (type === 'r') catItem.refNo = newVal;
            catItem.searchString = `${catItem.urunAdi} ${catItem.urunKodu} ${catItem.barkod} ${catItem.refNo} ${catItem.altGrup}`.toLowerCase();
        }
        
        fetchAndDisplayProduct(id); 
    } catch (err) { alert("Sistem Hatası: " + err.message); }
};

function createEditUI(id, type, val, placeholder, colorClass) {
    const isSet = val && val !== "TANIMLI DEĞİL" && val !== "BULUNAMADI" && val !== "-" && val !== "TAM EŞLEŞME YOK" && val !== "SONUÇ YOK";
    if (isSet) {
        return `
            <div id="txt-container-${type}-${id}" class="flex-edit">
                <span style="color: ${colorClass};" class="value-text mobile-break">${val}</span>
                <button onclick="editField('${id}', '${type}')" class="btn-edit">DÜZENLE</button>
            </div>
            <div id="edit-${type}-${id}" class="flex-edit" style="display:none;">
                <input type="text" id="man-${type}-${id}" value="${val}" class="input-style">
                <div class="edit-btn-group">
                    <button onclick="saveUpdate('${id}', '${type}')" class="btn-save" style="background:#ffbc00; color:#000;">KAYDET</button>
                    <button onclick="cancelEdit('${id}', '${type}')" class="btn-cancel">İPTAL</button>
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
        resultContainer.innerHTML = '<div style="color: #666; font-size: 24px;">Kayıtlar Senkronize Ediliyor...</div>';
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
                utsGorseller: baseData.utsGorseller || [],
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

            let crossRefText = "";
            let exactName = mergedData.urunAdi.toLowerCase().trim();
            if (mergedData.surecTipi === "R") {
                const sifirUrun = productCatalog.find(p => p.urunAdi.toLowerCase().trim() === exactName && p.surecTipi !== "R");
                if (sifirUrun) crossRefText = `<div style="font-size: 12px; color: #ffbc00; margin-top: 5px;">SIFIR KODU: <b style="color:#fff;">${sifirUrun.urunKodu}</b></div>`;
            } else {
                const reuseUrun = productCatalog.find(p => p.urunAdi.toLowerCase().trim() === exactName && p.surecTipi === "R");
                if (reuseUrun) crossRefText = `<div style="font-size: 12px; color: #ff3333; margin-top: 5px;">REUSE KODU: <b style="color:#fff;">${reuseUrun.urunKodu}</b></div>`;
            }
            mergedData.crossRefText = crossRefText;

            renderCard(mergedData);

            let targetBarcode = mergedData.urunKodu;
            const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
            if (mergedData.barkod && !invalidCodes.includes(mergedData.barkod)) targetBarcode = mergedData.barkod;

            if (targetBarcode && targetBarcode !== mergedData.urunKodu) {
                if (!mergedData.utsGorseller || mergedData.utsGorseller.length === 0 || mergedData.utsGorseller.includes(noImageSvg)) {
                    window.autoFetchUTS(mergedData.docId, targetBarcode);
                }
            }

        } else {
            if(resultContainer) resultContainer.innerHTML = `
                <div class="card-main" style="text-align:center; border-color:#330000; background:#110000;">
                    <div style="color: #ff3333; font-size: 28px; font-weight: 800; margin-bottom: 10px;">KAYIT BULUNAMADI</div>
                    <div style="color: #888; font-size: 16px; font-family: monospace;">Sorgulanan Parametre: <span style="color:#fff;">${code}</span></div>
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

    const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
    const hasValidBarcode = data.barkod && !invalidCodes.includes(data.barkod);

    const barkodUI = createEditUI(data.urunKodu, 'b', data.barkod, 'Barkod Girişi', '#ccc');
    const barkodEkSVG = hasValidBarcode ? `<div style="background: #fff; padding: 4px; border-radius: 4px; margin-top: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><svg id="ui-barcode-real" style="max-height: 28px; width: auto;"></svg></div>` : ``;

    const refUI = createEditUI(data.urunKodu, 'r', data.refNo, 'Ref Numarası', '#fff');
    const miatUI = createEditUI(data.urunKodu, 'm', data.miatTarihi, 'GG.AA.YYYY', '#ff3333');

    let gorselHTML = '';
    const imgLoadQueue = [];

    if (data.utsGorseller && data.utsGorseller.length > 0) {
        data.utsGorseller.forEach((url, index) => {
            const imgId = `img-render-${data.docId}-${index}`;
            const loadingSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23111' rx='8'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='11' font-weight='bold' fill='%23555' text-anchor='middle'%3EY%C3%9CKLEN%C4%B0YOR...%3C/text%3E%3C/svg%3E";
            
            gorselHTML += `<img id="${imgId}" src="${loadingSvg}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #333; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">`;
            imgLoadQueue.push({ id: imgId, url: url });
        });
    } else if (hasValidBarcode) {
        gorselHTML = `<div style="color:#555; font-size:12px; font-weight:bold; padding: 20px 0; width:100%;">Senkronizasyon Bekleniyor...</div>`;
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
                        <button onclick="openPrintModal()" class="btn-save btn-print-mobile" style="background: #00ccff; color: #000; padding: 14px 28px; font-size: 13px; width: auto; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,204,255,0.2);">ETİKET YAZDIR</button>
                    </div>
                    
                    <div class="grid-details">
                        <div>
                            <div class="label-text">ÜRÜN KODU</div>
                            <div class="value-text" style="color:#00ff00; margin-bottom: 12px;">${data.urunKodu}</div>
                            <div style="background: #fff; padding: 6px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                                <svg id="ui-barcode-urunkodu" style="max-height: 42px; width: auto;"></svg>
                            </div>
                        </div>
                        
                        <div><div class="label-text">REF NO</div><div>${refUI}</div></div>
                        <div><div class="label-text">BARKOD</div><div>${barkodUI}</div>${barkodEkSVG}</div>
                        <div><div class="label-text">MİAT TARİHİ</div><div>${miatUI}</div></div>
                        
                        <div><div class="label-text">ALT GRUP</div><div class="value-text" style="color:#ffbc00;">${data.altGrup}</div></div>
                        <div><div class="label-text">SÜREÇ TİPİ</div><div class="value-text" style="color:#ccc;">${data.surecTipi}</div></div>
                    </div>

                    <div style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
                        <div class="label-text" style="margin-bottom:15px;">ÜRÜN GÖRSELLERİ</div>
                        
                        <div id="uts-gorsel-container" style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; min-height: 100px;">
                            ${gorselHTML}
                        </div>
                    </div>
                </div>

                <div class="card-sidebar">
                    <div class="stock-box">
                        <div class="label-text" style="margin-bottom:15px; font-size:14px;">ANA DEPO STOK</div>
                        <div class="stock-value" style="color:${sAna.c};">${sAna.t}</div>
                        ${data.hasAna ? `
                            <div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                            <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                            <div style="text-align: left; padding: 0 10px;">
                                <div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.anaStokAdresi}</span></div>
                                <div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ${data.anaDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'};">${data.anaDummy}</span></div>
                                <div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ${data.anaReuse === 'REUSE' ? '#ff3333' : '#00ccff'};">${data.anaReuse}</span></div>
                                ${data.crossRefText}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="stock-box">
                        <div class="label-text" style="margin-bottom:15px; font-size:14px;">AMELİYATHANE STOK</div>
                        <div class="stock-value" style="color:${sAm.c};">${sAm.t}</div>
                        ${data.hasAm ? `
                            <div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ${data.minAlert} | MAX: ${data.max}</div>
                            <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>
                            <div style="text-align: left; padding: 0 10px;">
                                <div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">${data.amStokAdresi}</span></div>
                                <div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ${data.amDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'};">${data.amDummy}</span></div>
                                <div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ${data.amReuse === 'REUSE' ? '#ff3333' : '#00ccff'};">${data.amReuse}</span></div>
                                ${data.crossRefText}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            imgLoadQueue.forEach(item => {
                const imgEl = document.getElementById(item.id);
                if(imgEl) loadNgrokImage(imgEl, item.url);
            });
        }, 100);
    }

    setTimeout(() => {
        if(window.JsBarcode) {
            JsBarcode("#ui-barcode-urunkodu", data.urunKodu, { format: "CODE128", width: 1.5, height: 40, displayValue: false, lineColor: "#000", background: "transparent", margin: 0 });
            if (hasValidBarcode) JsBarcode("#ui-barcode-real", data.barkod, { format: "CODE128", width: 1.2, height: 28, displayValue: false, lineColor: "#000", background: "transparent", margin: 0 });
        }
    }, 150);
}
