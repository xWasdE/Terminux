import { app, auth, db, onAuthStateChanged } from './core-auth.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, collection, getDocs, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const MERKEZ_API_ADRESI = "https://anchor-crushing-constant.ngrok-free.dev"; 

const scannerScript = document.createElement('script');
scannerScript.src = "https://unpkg.com/html5-qrcode";
document.head.appendChild(scannerScript);

const cfScript = document.createElement('script');
cfScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
cfScript.async = true;
cfScript.defer = true;
document.head.appendChild(cfScript);

const jsbScript = document.createElement('script');
jsbScript.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
document.head.appendChild(jsbScript);

window.lightboxImages = [];
window.lightboxIndex = 0;

window.openLightbox = (index) => {
    if(!window.lightboxImages || window.lightboxImages.length === 0) return;
    window.lightboxIndex = index;
    document.getElementById('lightbox-img').src = window.lightboxImages[window.lightboxIndex];
    document.getElementById('lightbox-modal').style.display = 'flex';
    const showArrows = window.lightboxImages.length > 1 ? 'block' : 'none';
    document.querySelector('.lightbox-prev').style.display = showArrows;
    document.querySelector('.lightbox-next').style.display = showArrows;
};

window.closeLightbox = () => {
    document.getElementById('lightbox-modal').style.display = 'none';
    document.getElementById('lightbox-img').src = "";
};

window.changeLightbox = (dir) => {
    window.lightboxIndex += dir;
    if (window.lightboxIndex >= window.lightboxImages.length) window.lightboxIndex = 0;
    if (window.lightboxIndex < 0) window.lightboxIndex = window.lightboxImages.length - 1;
    document.getElementById('lightbox-img').src = window.lightboxImages[window.lightboxIndex];
};

let html5QrCode = null;

window.openScanner = () => {
    document.getElementById('scanner-modal').style.display = 'flex';
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    html5QrCode.start({ facingMode: "environment" }, config,
        (decodedText) => {
            const searchInputEl = document.getElementById('main-search');
            if (searchInputEl) {
                searchInputEl.value = decodedText;
                window.closeScanner();
                
                const rawCode = decodedText.trim();
                if(!rawCode) return;
                
                const dropdown = document.getElementById('dropdown-results');
                if(dropdown) dropdown.style.display = 'none';
                
                const searchCode = trToLower(rawCode);
                const directMatch = productCatalog.find(m => 
                    (trToLower(m.docId) === searchCode) || 
                    (trToLower(m.urunKodu) === searchCode) || 
                    (trToLower(m.barkod) === searchCode) || 
                    (trToLower(m.refNo) === searchCode)
                );

                if (directMatch) {
                    const validId = directMatch.docId || directMatch.urunKodu;
                    fetchAndDisplayProduct(String(validId));
                } else {
                    fetchAndDisplayProduct(rawCode); 
                }
            }
        },
        () => {}
    ).catch((err) => {
        window.closeScanner();
    });
};

window.closeScanner = () => {
    document.getElementById('scanner-modal').style.display = 'none';
    if(html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        }).catch(() => {});
    }
};

const setScreen = (type) => {
    const loadSc = document.getElementById('loading-screen');
    const logSc = document.getElementById('login-screen');
    const appSc = document.getElementById('app-screen');

    if (loadSc) {
        loadSc.classList.add('hidden');
        loadSc.style.display = 'none';
    }

    if (type === 'login') {
        if (appSc) { appSc.classList.add('hidden'); appSc.style.display = 'none'; }
        if (logSc) { logSc.classList.remove('hidden'); logSc.style.display = 'flex'; }
    } else if (type === 'app') {
        if (logSc) { logSc.classList.add('hidden'); logSc.style.display = 'none'; }
        if (appSc) { appSc.classList.remove('hidden'); appSc.style.display = 'flex'; }
    }
};

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const operatorName = document.getElementById('operator-name');
const searchInput = document.getElementById('main-search');
const dropdown = document.getElementById('dropdown-results');
const resultContainer = document.getElementById('result-container');

if (loginForm) {
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-login-header';
    mobileHeader.innerHTML = '<div style="color:#fff; font-size:28px; font-weight:900; letter-spacing:1px; margin-bottom:5px;">TERMINUX</div><div style="color:#0f0; font-size:12px; font-weight:bold; letter-spacing:3px; margin-bottom:30px;">WMS TERMINAL</div>';
    loginForm.insertBefore(mobileHeader, loginForm.firstChild);

    if (!document.getElementById('cf-turnstile-widget')) {
        const cfWrapper = document.createElement('div');
        cfWrapper.id = 'cf-turnstile-widget';
        cfWrapper.className = 'cf-turnstile';
        cfWrapper.setAttribute('data-sitekey', '0x4AAAAAADYmA33uynV7f5VV'); 
        cfWrapper.style.margin = '15px auto';
        cfWrapper.style.display = 'flex';
        cfWrapper.style.justifyContent = 'center';
        loginForm.insertBefore(cfWrapper, loginForm.querySelector('button[type="submit"]'));
    }
}

let productCatalog = [];
let searchTimeout = null;
window.currentRenderedProduct = null;

const trToLower = (text) => {
    if (text === null || text === undefined) return "";
    return String(text).replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr-TR');
};

const noImageSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23111' rx='8'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='11' font-weight='bold' fill='%23ff3333' text-anchor='middle'%3EGÖRSEL BULUNAMADI%3C/text%3E%3C/svg%3E";

async function loadTelegramImage(imgElement, fileId, index) {
    if (fileId.startsWith('data:image')) {
        imgElement.src = fileId;
        window.lightboxImages[index] = fileId;
        imgElement.onclick = () => openLightbox(index);
        return;
    }

    let fullUrl = MERKEZ_API_ADRESI + '/api/telegram-image?file_id=' + fileId + '&cb=' + new Date().getTime();

    try {
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                "Bypass-Tunnel-Reminder": "true",
                "ngrok-skip-browser-warning": "true"
            }
        });
        
        if (!response.ok) throw new Error("Ağ Hatası");
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        imgElement.src = objectUrl;
        window.lightboxImages[index] = objectUrl;
        imgElement.onclick = () => openLightbox(index);
        
    } catch (error) {
        imgElement.src = noImageSvg; 
        window.lightboxImages[index] = noImageSvg;
        imgElement.onclick = () => openLightbox(index);
    }
}

document.addEventListener('click', async (e) => {
    if (e.target && (e.target.id === 'btn-logout' || e.target.closest('#btn-logout') || e.target.innerText?.trim().toUpperCase() === 'GÜVENLİ ÇIKIŞ')) {
        try {
            localStorage.removeItem('terminux_catalog_cache_merkez');
            localStorage.removeItem('terminux_catalog_cache_bodrum');
            localStorage.removeItem('terminux_catalog_cache_eskisehir');
            localStorage.removeItem('terminux_catalog_time_merkez');
            localStorage.removeItem('terminux_catalog_time_bodrum');
            localStorage.removeItem('terminux_catalog_time_eskisehir');
            await signOut(auth);
            window.location.reload();
        } catch (err) {}
    }
});

let initFallback = setTimeout(() => { setScreen('login'); }, 2500);

onSnapshot(doc(db, "system", "settings"), (docSnap) => {
    if(docSnap.exists()) {
        const data = docSnap.data();
        const btnLens = document.getElementById('btn-lens-redirect');
        if (btnLens) {
            btnLens.style.display = data.publicLensEnabled ? 'block' : 'none';
        }
    }
}, (error) => {});

onAuthStateChanged(auth, async (user) => {
    clearTimeout(initFallback);
    if (user) {
        if(operatorName) operatorName.textContent = user.email.split('@')[0].toUpperCase();
        
        try {
            const uDoc = await getDoc(doc(db, "users", user.uid));
            if (uDoc.exists()) {
                if (uDoc.data().role === 'admin') {
                    const adminBtn = document.getElementById('btn-admin-panel');
                    if (adminBtn) adminBtn.style.display = 'inline-block';
                }
            }
        } catch(e) {}

        const locSelector = document.getElementById('loc-selector');
        const userLoc = localStorage.getItem('user_loc') || 'merkez';
        if (userLoc === 'tumu') {
            if (locSelector) {
                locSelector.style.display = 'inline-block';
                locSelector.value = localStorage.getItem('active_loc') || 'merkez';
                locSelector.onchange = (e) => {
                    localStorage.setItem('active_loc', e.target.value);
                    buildCatalog(true);
                };
            }
        } else {
            if (locSelector) locSelector.style.display = 'none';
            localStorage.setItem('active_loc', userLoc);
        }

        setScreen('app');

        onSnapshot(doc(db, "system", "version"), (snapshot) => {
            if(snapshot.exists()) {
                const data = snapshot.data();
                const activeLoc = localStorage.getItem('active_loc') || 'merkez';
                const cacheTime = localStorage.getItem('terminux_catalog_time_' + activeLoc);
                if (!cacheTime || data.lastUpdate > parseInt(cacheTime)) {
                    buildCatalog(true);
                }
            }
        }, (error) => {});

        buildCatalog().then(() => {
            if(searchInput) searchInput.focus();
        });
    } else {
        setScreen('login');
    }
});

if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginBtn = loginForm.querySelector('button[type="submit"]');

        const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]');
        if (!turnstileResponse || !turnstileResponse.value) {
            return; 
        }

        if (!usernameInput || !passwordInput) return;
        const finalEmail = usernameInput.value.indexOf('@') !== -1 ? usernameInput.value : usernameInput.value + '@terminux.com.tr';
        const finalPass = passwordInput.value;

        if (loginBtn) {
            loginBtn.textContent = "GİRİŞ YAPILIYOR...";
            loginBtn.classList.add('btn-loading');
            loginBtn.disabled = true;
        }

        try { 
            await signInWithEmailAndPassword(auth, finalEmail, finalPass); 
        } 
        catch (error) { 
            if (window.turnstile) window.turnstile.reset();
            if (loginBtn) {
                loginBtn.textContent = "Giriş Yap";
                loginBtn.classList.remove('btn-loading');
                loginBtn.disabled = false;
            }
        }
    });
}

async function buildCatalog(forceUpdate = false) {
    let activeLoc = localStorage.getItem('active_loc') || localStorage.getItem('user_loc') || 'merkez';
    if (activeLoc === 'tumu') activeLoc = 'merkez';

    const CACHE_KEY = 'terminux_catalog_cache_' + activeLoc;
    const CACHE_TIME_KEY = 'terminux_catalog_time_' + activeLoc;

    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        if (!forceUpdate && cachedData && cacheTime && (now - parseInt(cacheTime) < 14400000)) {
            const parsed = JSON.parse(cachedData);
            if(Array.isArray(parsed) && parsed.length > 0) {
                productCatalog = parsed;
                return;
            }
        }
    } catch(e) {}

    try {
        const colAnaName = activeLoc === 'merkez' ? 'ana_depo' : 'ana_depo_' + activeLoc;
        const colAmName = activeLoc === 'merkez' ? 'ameliyathane' : 'ameliyathane_' + activeLoc;

        const [anaSnap, amSnap] = await Promise.all([getDocs(collection(db, colAnaName)), getDocs(collection(db, colAmName))]);
        const tempMap = new Map();
        
        const processDoc = (d) => {
            const data = d.data();
            if (!tempMap.has(d.id)) {
                tempMap.set(d.id, {
                    docId: d.id,
                    urunKodu: String(data.urunKodu || ""),
                    urunAdi: String(data.urunAdi || ""),
                    barkod: String(data.barkod || ""),
                    refNo: String(data.refNo || "BULUNAMADI"),
                    altGrup: String(data.altGrup || ""),
                    surecTipi: String(data.surecTipi || ""),
                    utsGorseller: data.utsGorseller || [],
                    searchString: trToLower((data.urunAdi || "") + " " + (data.urunKodu || "") + " " + (data.barkod || "") + " " + (data.refNo || "") + " " + (data.altGrup || ""))
                });
            }
        };

        anaSnap.forEach(processDoc);
        amSnap.forEach(processDoc);
        productCatalog = Array.from(tempMap.values());

        if (productCatalog.length > 0) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(productCatalog));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }

        if (forceUpdate && document.getElementById('main-search')) {
            const toast = document.createElement('div');
            toast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#00ff00; color:#000; padding:10px 20px; border-radius:20px; font-weight:bold; font-size:12px; z-index:99999; box-shadow:0 5px 15px rgba(0,255,0,0.3);";
            toast.innerText = "Lokasyon Veritabanı Güncellendi";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

    } catch (error) {}
}

document.addEventListener('click', (e) => {
    if (searchInput && dropdown && !searchInput.contains(e.target) && !dropdown.contains(e.target) && !e.target.closest('.search-item')) {
        dropdown.style.display = 'none';
    }
});

if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const val = trToLower(e.target.value.trim());
        clearTimeout(searchTimeout);
        if (val.length < 2) { dropdown.style.display = 'none'; return; }

        searchTimeout = setTimeout(() => {
            dropdown.innerHTML = '<div style="padding: 20px; color: #666; font-size: 16px;">Sorgulanıyor...</div>';
            dropdown.style.display = 'block';

            const terms = val.split(/\s+/);
            let matches = productCatalog.filter(m => terms.every(t => m.searchString.indexOf(t) !== -1)).slice(0, 15);

            if (matches.length > 0) {
                dropdown.innerHTML = matches.map(m => '<div class="search-item" data-id="' + m.docId + '" style="padding: 15px 20px; border-bottom: 1px solid #1a1a1a; cursor: pointer;"><div style="color: #fff; font-size: 15px; font-weight: 600;">' + m.urunAdi + '</div><div style="color: #888; font-size: 11px; font-family: monospace; margin-top:6px;">KOD: <span style="color:#0f0;">' + m.urunKodu + '</span> | REF: ' + m.refNo + '</div></div>').join('');

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
            
            const rawCode = searchInput.value.trim();
            if (!rawCode) return;
            searchInput.value = '';

            const searchCode = trToLower(rawCode);

            const directMatch = productCatalog.find(m => 
                (trToLower(m.docId) === searchCode) || 
                (trToLower(m.urunKodu) === searchCode) || 
                (trToLower(m.barkod) === searchCode) || 
                (trToLower(m.refNo) === searchCode)
            );

            if (directMatch) fetchAndDisplayProduct(directMatch.docId);
            else fetchAndDisplayProduct(rawCode); 
        }
    });
}

window.openPrintModal = () => {
    if (!window.currentRenderedProduct) return;
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
        label.innerHTML = '<div class="p-name">' + data.urunAdi + '</div><svg id="print-bc-' + i + '"></svg><div class="p-code">' + data.urunKodu + '</div>';
        printContainer.appendChild(label);
    }

    if(window.JsBarcode) {
        for(let i=0; i < printQty; i++) {
            JsBarcode('#print-bc-' + i, targetBarcode, {
                format: "CODE128", width: 1.2, height: 30, displayValue: false, margin: 0
            });
        }
    }

    closePrintModal();
    setTimeout(() => { window.print(); }, 300);
};

window.autoFetchCentral = async (data, barkod) => {
    const id = data.docId;
    const gorselContainer = document.getElementById('gorsel-container');
    let statusEl = document.getElementById('fetch-status-' + id);
    
    if (gorselContainer) {
        gorselContainer.innerHTML = '';
        statusEl = document.createElement('div');
        statusEl.id = 'fetch-status-' + id;
        statusEl.style.cssText = "color:#00ccff; font-size:13px; font-weight:bold; padding: 10px 0; width:100%;";
        statusEl.innerHTML = "Sisteme bağlanılıyor...";
        gorselContainer.appendChild(statusEl);
    }
    
    let dbUrls = []; 

    try {
        const urlParams = new URLSearchParams({ barkod: barkod, urunKodu: data.urunKodu, urunAdi: data.urunAdi, refNo: data.refNo });
        const response = await fetch(MERKEZ_API_ADRESI + '/api/uts?' + urlParams.toString(), {
            headers: { "Bypass-Tunnel-Reminder": "true", "ngrok-skip-browser-warning": "true" }
        });

        if (!response.body) throw new Error();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let partialChunk = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            partialChunk += decoder.decode(value, { stream: true });
            const lines = partialChunk.split('\n\n');
            partialChunk = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const resData = JSON.parse(line.substring(6));
                    
                    if (resData.type === "INFO") {
                        if (statusEl) statusEl.innerHTML = '<span style="color:#00ccff;">' + resData.msg + '</span>';
                    } else if (resData.type === "COUNT") {
                        if (statusEl) statusEl.innerHTML = '<span style="color:#ffbc00;">' + resData.count + ' adet görsel bulundu. Aktarım başlatılıyor...</span>';
                    } else if (resData.type === "PROGRESS") {
                        if (statusEl) statusEl.innerHTML = '<span style="color:#00ff00;">' + resData.total + ' görsel bulundu. ' + resData.current + '. görsel yüklendi. (' + resData.current + '/' + resData.total + ')</span>';
                    } else if (resData.type === "DONE") {
                        dbUrls = resData.data;
                        break;
                    } else if (resData.type === "ERROR") {
                        throw new Error(resData.msg);
                    }
                }
            }
        }
    } catch(e) {
        if (statusEl) statusEl.innerHTML = '<span style="color:#ff3333;">Sistem Hatası: Arka plan servisine ulaşılamadı.</span>';
        return;
    }

    if (dbUrls.length === 0) {
        dbUrls.push(noImageSvg);
        if (statusEl) statusEl.innerHTML = '<span style="color:#ffbc00;">Sistemde kayıtlı görsel bulunamadı.</span>';
    } else {
        if (statusEl) {
            statusEl.innerHTML = '<span style="color:#00ff00;">✅ Görseller başarıyla hazırlandı! Ekrana yansıtılıyor...</span>';
            setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 3000);
        }
    }

    const updateData = { utsGorseller: dbUrls };
    
    try {
        let activeLoc = localStorage.getItem('active_loc') || localStorage.getItem('user_loc') || 'merkez';
        if (activeLoc === 'tumu') activeLoc = 'merkez';
        const colAnaName = activeLoc === 'merkez' ? 'ana_depo' : 'ana_depo_' + activeLoc;
        const colAmName = activeLoc === 'merkez' ? 'ameliyathane' : 'ameliyathane_' + activeLoc;

        const anaRef = doc(db, colAnaName, id);
        const amRef = doc(db, colAmName, id);
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);

        const catItem = productCatalog.find(m => m.docId === id);
        if(catItem) {
            catItem.utsGorseller = dbUrls;
            const CACHE_KEY = 'terminux_catalog_cache_' + activeLoc;
            localStorage.setItem(CACHE_KEY, JSON.stringify(productCatalog));
        }
    } catch (dbError) {}

    if (gorselContainer) {
        const imgWrapperDiv = document.createElement('div');
        imgWrapperDiv.style.cssText = "display: flex; gap: 15px; margin-top: 15px; flex-wrap: wrap; width: 100%;";
        gorselContainer.appendChild(imgWrapperDiv);

        window.lightboxImages = []; 

        if (dbUrls[0] === noImageSvg) {
            window.lightboxImages.push(noImageSvg);
            imgWrapperDiv.innerHTML += '<img src="' + noImageSvg + '" onclick="openLightbox(0)" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #333; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">';
        } else {
            for (let idx = 0; idx < dbUrls.length; idx++) {
                window.lightboxImages.push(dbUrls[idx]); 
                const imgId = 'img-fetch-' + id + '-' + idx;
                const loadingSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23111' rx='8'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='11' font-weight='bold' fill='%23555' text-anchor='middle'%3EY%C3%9CKLEN%C4%B0YOR...%3C/text%3E%3C/svg%3E";
                imgWrapperDiv.insertAdjacentHTML('beforeend', '<img id="' + imgId + '" src="' + loadingSvg + '" onclick="openLightbox(' + idx + ')" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #333; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">');
            }

            for (let idx = 0; idx < dbUrls.length; idx++) {
                const imgEl = document.getElementById('img-fetch-' + id + '-' + idx);
                if(imgEl) {
                    await loadTelegramImage(imgEl, dbUrls[idx], idx);
                }
            }
        }
    }
};

window.editField = (id, type) => {
    document.getElementById('txt-container-' + type + '-' + id).style.display = 'none';
    document.getElementById('edit-' + type + '-' + id).style.display = 'flex';
};

window.cancelEdit = (id, type) => {
    document.getElementById('txt-container-' + type + '-' + id).style.display = 'flex';
    document.getElementById('edit-' + type + '-' + id).style.display = 'none';
};

window.saveUpdate = async (id, type) => {
    const inputEl = document.getElementById('man-' + type + '-' + id);
    const newVal = inputEl ? inputEl.value.trim() : null;

    if (!newVal) return;

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
        let activeLoc = localStorage.getItem('active_loc') || localStorage.getItem('user_loc') || 'merkez';
        if (activeLoc === 'tumu') activeLoc = 'merkez';
        const colAnaName = activeLoc === 'merkez' ? 'ana_depo' : 'ana_depo_' + activeLoc;
        const colAmName = activeLoc === 'merkez' ? 'ameliyathane' : 'ameliyathane_' + activeLoc;

        const anaRef = doc(db, colAnaName, id);
        const amRef = doc(db, colAmName, id);
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);
        
        const catItem = productCatalog.find(m => m.docId === id);
        if (catItem) {
            if (type === 'b') catItem.barkod = newVal;
            if (type === 'r') catItem.refNo = newVal;
            catItem.searchString = trToLower(catItem.urunAdi + ' ' + catItem.urunKodu + ' ' + catItem.barkod + ' ' + catItem.refNo + ' ' + catItem.altGrup);
            const CACHE_KEY = 'terminux_catalog_cache_' + activeLoc;
            localStorage.setItem(CACHE_KEY, JSON.stringify(productCatalog));
        }
        
        fetchAndDisplayProduct(id); 
    } catch (err) {}
};

function createEditUI(id, type, val, placeholder, colorClass) {
    const isSet = val && val !== "TANIMLI DEĞİL" && val !== "BULUNAMADI" && val !== "-" && val !== "TAM EŞLEŞME YOK" && val !== "SONUÇ YOK";
    if (isSet) {
        return '<div id="txt-container-' + type + '-' + id + '" class="flex-edit">' +
               '<span style="color: ' + colorClass + ';" class="value-text mobile-break">' + val + '</span>' +
               '<button onclick="editField(\'' + id + '\', \'' + type + '\')" class="btn-edit">DÜZENLE</button>' +
               '</div>' +
               '<div id="edit-' + type + '-' + id + '" class="flex-edit" style="display:none;">' +
               '<input type="text" id="man-' + type + '-' + id + '" value="' + val + '" class="input-style">' +
               '<div class="edit-btn-group">' +
               '<button onclick="saveUpdate(\'' + id + '\', \'' + type + '\')" class="btn-save" style="background:#ffbc00; color:#000;">KAYDET</button>' +
               '<button onclick="cancelEdit(\'' + id + '\', \'' + type + '\')" class="btn-cancel">İPTAL</button>' +
               '</div>' +
               '</div>';
    } else {
        return '<div class="flex-edit">' +
               '<input type="text" id="man-' + type + '-' + id + '" placeholder="' + placeholder + '" class="input-style">' +
               '<button onclick="saveUpdate(\'' + id + '\', \'' + type + '\')" class="btn-save">KAYDET</button>' +
               '</div>';
    }
}

window.fetchAndDisplayProduct = async (code) => {
    if(resultContainer) {
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = '<div style="color: #666; font-size: 24px;">Kayıtlar Senkronize Ediliyor...</div>';
    }

    try {
        let activeLoc = localStorage.getItem('active_loc') || localStorage.getItem('user_loc') || 'merkez';
        if (activeLoc === 'tumu') activeLoc = 'merkez';
        const colAnaName = activeLoc === 'merkez' ? 'ana_depo' : 'ana_depo_' + activeLoc;
        const colAmName = activeLoc === 'merkez' ? 'ameliyathane' : 'ameliyathane_' + activeLoc;

        const [anaDoc, amDoc] = await Promise.all([getDoc(doc(db, colAnaName, code)), getDoc(doc(db, colAmName, code))]);

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

            const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
            let crossRefText = "";
            let exactName = trToLower(mergedData.urunAdi).trim();
            if (mergedData.surecTipi === "R") {
                const sifirUrun = productCatalog.find(p => trToLower(p.urunAdi).trim() === exactName && p.surecTipi !== "R");
                if (sifirUrun) crossRefText = '<div style="font-size: 12px; color: #ffbc00; margin-top: 5px;">SIFIR KODU: <b style="color:#fff;">' + sifirUrun.urunKodu + '</b></div>';
            } else {
                const reuseUrun = productCatalog.find(p => trToLower(p.urunAdi).trim() === exactName && p.surecTipi === "R");
                if (reuseUrun) crossRefText = '<div style="font-size: 12px; color: #ff3333; margin-top: 5px;">REUSE KODU: <b style="color:#fff;">' + reuseUrun.urunKodu + '</b></div>';
            }
            mergedData.crossRefText = crossRefText;

            renderCard(mergedData);

            let targetBarcode = mergedData.urunKodu;
            if (mergedData.barkod && invalidCodes.indexOf(mergedData.barkod) === -1) targetBarcode = mergedData.barkod;

            if (targetBarcode && targetBarcode !== mergedData.urunKodu) {
                if (!mergedData.utsGorseller || mergedData.utsGorseller.length === 0 || mergedData.utsGorseller.indexOf(noImageSvg) !== -1) {
                    window.autoFetchCentral(mergedData, targetBarcode);
                }
            }

        } else {
            if(resultContainer) {
                resultContainer.innerHTML = '<div class="card-main" style="text-align:center; border-color:#330000; background:#110000;">' +
                                            '<div style="color: #ff3333; font-size: 28px; font-weight: 800; margin-bottom: 10px;">KAYIT BULUNAMADI</div>' +
                                            '<div style="color: #888; font-size: 16px; font-family: monospace;">Sorgulanan Parametre: <span style="color:#fff;">' + code + '</span></div>' +
                                            '</div>';
            }
        }
    } catch (err) {}
};

function renderCard(data) {
    window.currentRenderedProduct = data;

    const min = parseInt(data.minAlert) || 0;
    const max = parseInt(data.max) || 0;
    const getS = (val, has) => (!has ? { c: '#fb0', t: 'TANIMSIZ' } : { c: val <= min ? '#ff3333' : '#fff', t: val });
    const sAna = getS(data.anaMiktar, data.hasAna);
    const sAm = getS(data.amMiktar, data.hasAm);

    const invalidCodes = ["TANIMLI DEĞİL", "EŞLEŞME YOK", "REF BULUNAMADI", "TAM EŞLEŞME YOK", "SONUÇ YOK", "-"];
    const hasValidBarcode = data.barkod && invalidCodes.indexOf(data.barkod) === -1;

    const barkodUI = createEditUI(data.urunKodu, 'b', data.barkod, 'Barkod Girişi', '#ccc');
    const barkodEkSVG = hasValidBarcode ? '<div style="background: #fff; padding: 4px; border-radius: 4px; margin-top: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><svg id="ui-barcode-real" style="max-height: 28px; width: auto;"></svg></div>' : '';

    const refUI = createEditUI(data.urunKodu, 'r', data.refNo, 'Ref Numarası', '#fff');
    const miatUI = createEditUI(data.urunKodu, 'm', data.miatTarihi, 'GG.AA.YYYY', '#ff3333');

    let gorselHTML = '';

    if (data.utsGorseller && data.utsGorseller.length > 0) {
        let internalImgs = '';
        window.lightboxImages = []; 
        data.utsGorseller.forEach((url, index) => {
            window.lightboxImages.push(url); 
            const imgId = 'img-render-' + data.docId + '-' + index;
            const loadingSvg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23111' rx='8'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='11' font-weight='bold' fill='%23555' text-anchor='middle'%3EY%C3%9CKLEN%C4%B0YOR...%3C/text%3E%3C/svg%3E";
            internalImgs += '<img id="' + imgId + '" src="' + loadingSvg + '" onclick="openLightbox(' + index + ')" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #333; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">';
        });
        gorselHTML = '<div style="display: flex; gap: 15px; flex-wrap: wrap; width: 100%;">' + internalImgs + '</div>';
        
        setTimeout(() => {
            data.utsGorseller.forEach((url, index) => {
                const imgEl = document.getElementById('img-render-' + data.docId + '-' + index);
                if(imgEl) loadTelegramImage(imgEl, url, index);
            });
        }, 100);
    } else if (hasValidBarcode) {
        gorselHTML = '<div style="color:#00ccff; font-size:12px; font-weight:bold; padding: 10px 0; width:100%;">Senkronizasyon Bekleniyor...</div>';
    } else {
        gorselHTML = '<div style="width: 100px; height: 100px; background: #111; border: 1px dashed #333; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #555; font-size: 11px; font-weight: bold; text-align: center; line-height:1.4;">BARKOD<br>GEREKLİ</div>';
    }

    let sAnaHTML = '';
    if (data.hasAna) {
        const anaDummyColor = data.anaDummy === 'DUMMY' ? '#ffbc00' : '#00ff00';
        const anaReuseColor = data.anaReuse === 'REUSE' ? '#ff3333' : '#00ccff';
        sAnaHTML = '<div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ' + data.minAlert + ' | MAX: ' + data.max + '</div>' +
                   '<div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>' +
                   '<div style="text-align: left; padding: 0 10px;">' +
                   '<div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">' + data.anaStokAdresi + '</span></div>' +
                   '<div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ' + anaDummyColor + ';">' + data.anaDummy + '</span></div>' +
                   '<div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ' + anaReuseColor + ';">' + data.anaReuse + '</span></div>' +
                   data.crossRefText +
                   '</div>';
    }

    let sAmHTML = '';
    if (data.hasAm) {
        const amDummyColor = data.amDummy === 'DUMMY' ? '#ffbc00' : '#00ff00';
        const amReuseColor = data.amReuse === 'REUSE' ? '#ff3333' : '#00ccff';
        sAmHTML = '<div style="font-size: 13px; color: #555; margin-top: 15px;">MİN: ' + data.minAlert + ' | MAX: ' + data.max + '</div>' +
                  '<div style="width: 100%; height: 1px; background: #1a1a1a; margin: 15px 0;"></div>' +
                  '<div style="text-align: left; padding: 0 10px;">' +
                  '<div style="font-size: 13px; color: #666; margin-bottom: 5px;">ADRES: <span style="color: #fff;">' + data.amStokAdresi + '</span></div>' +
                  '<div style="font-size: 13px; color: #666; margin-bottom: 5px;">DUMMY: <span style="color: ' + amDummyColor + ';">' + data.amDummy + '</span></div>' +
                  '<div style="font-size: 13px; color: #666;">CİHAZ: <span style="color: ' + amReuseColor + ';">' + data.amReuse + '</span></div>' +
                  data.crossRefText +
                  '</div>';
    }

    if(resultContainer) {
        resultContainer.innerHTML = '<div class="card-wrapper">' +
            '<div class="card-main">' +
            '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 35px; gap: 20px; flex-wrap: wrap;">' +
            '<div style="flex: 1; min-width: 250px;">' +
            '<div class="label-text">ÜRÜN BİLGİSİ</div>' +
            '<div class="title-text">' + data.urunAdi + '</div>' +
            '</div>' +
            '<button onclick="openPrintModal()" class="btn-save btn-print-mobile" style="background: #00ccff; color: #000; padding: 14px 28px; font-size: 13px; width: auto; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,204,255,0.2);">ETİKET YAZDIR</button>' +
            '</div>' +
            '<div class="grid-details">' +
            '<div>' +
            '<div class="label-text">ÜRÜN KODU</div>' +
            '<div class="value-text" style="color:#00ff00; margin-bottom: 12px;">' + data.urunKodu + '</div>' +
            '<div style="background: #fff; padding: 6px; border-radius: 4px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">' +
            '<svg id="ui-barcode-urunkodu" style="max-height: 42px; width: auto;"></svg>' +
            '</div>' +
            '</div>' +
            '<div><div class="label-text">REF NO</div><div>' + refUI + '</div></div>' +
            '<div><div class="label-text">BARKOD</div><div>' + barkodUI + '</div>' + barkodEkSVG + '</div>' +
            '<div><div class="label-text">MİAT TARİHİ</div><div>' + miatUI + '</div></div>' +
            '<div><div class="label-text">ALT GRUP</div><div class="value-text" style="color:#ffbc00;">' + data.altGrup + '</div></div>' +
            '<div><div class="label-text">SÜREÇ TİPİ</div><div class="value-text" style="color:#ccc;">' + data.surecTipi + '</div></div>' +
            '</div>' +
            '<div style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 30px;">' +
            '<div class="label-text" style="margin-bottom:15px;">ÜRÜN GÖRSELLERİ</div>' +
            '<div id="gorsel-container" style="min-height: 100px;">' +
            gorselHTML +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="card-sidebar">' +
            '<div class="stock-box">' +
            '<div class="label-text" style="margin-bottom:15px; font-size:14px;">ANA DEPO STOK</div>' +
            '<div class="stock-value" style="color:' + sAna.c + ';">' + sAna.t + '</div>' +
            sAnaHTML +
            '</div>' +
            '<div class="stock-box">' +
            '<div class="label-text" style="margin-bottom:15px; font-size:14px;">AMELİYATHANE STOK</div>' +
            '<div class="stock-value" style="color:' + sAm.c + ';">' + sAm.t + '</div>' +
            sAmHTML +
            '</div>' +
            '</div>' +
            '</div>';
    }

    setTimeout(() => {
        if(window.JsBarcode) {
            if (data.urunKodu) JsBarcode("#ui-barcode-urunkodu", data.urunKodu, { format: "CODE128", width: 1.5, height: 40, displayValue: false, lineColor: "#000", background: "transparent", margin: 0 });
            if (hasValidBarcode && data.barkod) JsBarcode("#ui-barcode-real", data.barkod, { format: "CODE128", width: 1.2, height: 28, displayValue: false, lineColor: "#000", background: "transparent", margin: 0 });
        }
    }, 150);
}

document.addEventListener('input', (e) => {
    if (e.target.id === 'scan-code' || e.target.id === 'main-search' || e.target.id === 'search-input') {
        let val = e.target.value;
        let cleaned = val.replace(/^\][a-zA-Z0-9]{2}/, '').replace(/^JD/i, '').trimStart();
        if (val !== cleaned) {
            e.target.value = cleaned;
        }
    }
});
