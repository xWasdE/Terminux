import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    } catch (error) {
        console.error("Katalog oluşturulurken hata:", error);
    }
}

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target) && !e.target.closest('.search-item')) {
        dropdown.style.display = 'none';
    }
    if(!['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName) && !appScreen.classList.contains('hidden')) {
        searchInput.focus();
    }
});

searchInput.addEventListener('focus', () => { searchInput.style.borderColor = '#444'; });
searchInput.addEventListener('blur', () => { searchInput.style.borderColor = '#222'; });

searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    clearTimeout(searchTimeout);
    
    if (val.length < 2) {
        dropdown.style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(() => {
        dropdown.innerHTML = '<div style="padding: 20px; color: #666; font-size: 18px;">Aranıyor...</div>';
        dropdown.style.display = 'block';

        const searchTerms = val.split(/\s+/);
        
        let matches = productCatalog.filter(m => {
            return searchTerms.every(term => m.searchString.includes(term));
        }).slice(0, 20);

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(m => `
                <div class="search-item" data-id="${m.docId}" style="padding: 20px 25px; border-bottom: 1px solid #1a1a1a; cursor: pointer; display: flex; flex-direction: column; gap: 5px; transition: background 0.2s;">
                    <div style="color: #fff; font-size: 18px; font-weight: 600;">${m.urunAdi}</div>
                    <div style="color: #888; font-size: 13px; font-family: monospace;">KOD: <span style="color: #00ff00;">${m.urunKodu}</span> &nbsp;|&nbsp; REF: ${m.refNo} &nbsp;|&nbsp; BARKOD: ${m.barkod || 'TANIMLI DEĞİL'} &nbsp;|&nbsp; ALT GRUP: <span style="color: #ffbc00;">${m.altGrup || '-'}</span></div>
                </div>
            `).join('');

            document.querySelectorAll('.search-item').forEach(item => {
                item.addEventListener('mouseenter', () => item.style.background = '#111');
                item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                item.addEventListener('click', () => {
                    searchInput.value = '';
                    dropdown.style.display = 'none';
                    fetchAndDisplayProduct(item.getAttribute('data-id'));
                });
            });
        } else {
            dropdown.innerHTML = '<div style="padding: 20px; color: #ff3333; font-size: 18px;">Eşleşme bulunamadı.</div>';
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

        if (directMatch) {
            fetchAndDisplayProduct(directMatch.docId);
        } else {
            fetchAndDisplayProduct(code);
        }
    }
});

async function fetchAndDisplayProduct(code) {
    resultContainer.style.display = 'block';
    resultContainer.innerHTML = '<div style="color: #666; font-size: 24px;">Veriler Çekiliyor...</div>';

    try {
        const anaDoc = await getDoc(doc(db, "ana_depo", code));
        const amDoc = await getDoc(doc(db, "ameliyathane", code));

        if (anaDoc.exists() || amDoc.exists()) {
            const anaData = anaDoc.exists() ? anaDoc.data() : null;
            const amData = amDoc.exists() ? amDoc.data() : null;
            const baseData = anaData || amData; 

            const altGrupGetir = (anaData && anaData.altGrup) ? anaData.altGrup : ((amData && amData.altGrup) ? amData.altGrup : "-");

            const mergedData = {
                urunKodu: code,
                barkod: baseData.barkod || "",
                urunAdi: baseData.urunAdi || "-",
                refNo: baseData.refNo || "BULUNAMADI",
                altGrup: altGrupGetir,
                surecTipi: baseData.surecTipi || "-",
                miatTarihi: baseData.miatTarihi || "-",
                docLinks: baseData.docLinks || { kunye: "", etiket: "", kilavuz: "" }, // Belge Linkleri
                minAlert: baseData.minAlert || 0,
                max: baseData.max || 0,
                hasAna: anaDoc.exists(),
                anaDepoMiktar: anaData ? parseInt(anaData.miktar) : 0,
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
                <div style="background: #110000; border: 1px solid #330000; padding: 40px; border-radius: 8px;">
                    <div style="color: #ff3333; font-size: 32px; font-weight: 800; margin-bottom: 15px;">KAYIT BULUNAMADI</div>
                    <div style="color: #888; font-size: 18px; font-family: monospace;">Okutulan Kod: <span style="color: #fff;">${code}</span></div>
                </div>
            `;
        }
    } catch (error) {
        resultContainer.innerHTML = `<div style="color: #ff3333; font-size: 18px;">Bağlantı Hatası: ${error.message}</div>`;
    }
}

// Global olarak tetiklenebilmesi için window objesine kayıt
window.saveManualData = async (urunKodu) => {
    const bInput = document.getElementById(`man-b-${urunKodu}`);
    const rInput = document.getElementById(`man-r-${urunKodu}`);
    
    const newBarkod = bInput ? bInput.value.trim() : null;
    const newRef = rInput ? rInput.value.trim() : null;
    
    if(!newBarkod && !newRef) return alert("Lütfen kaydedilecek bir değer girin.");
    
    const updateData = {};
    if(newBarkod) updateData.barkod = newBarkod;
    if(newRef) updateData.refNo = newRef;

    try {
        const anaRef = doc(db, "ana_depo", urunKodu);
        const amRef = doc(db, "ameliyathane", urunKodu);
        
        const [anaSnap, amSnap] = await Promise.all([getDoc(anaRef), getDoc(amRef)]);
        
        if(anaSnap.exists()) await updateDoc(anaRef, updateData);
        if(amSnap.exists()) await updateDoc(amRef, updateData);
        
        // Katalogu arkada tazele ve ekranı güncelle
        buildCatalog();
        fetchAndDisplayProduct(urunKodu);
    } catch (err) {
        alert("Güncelleme başarısız: " + err.message);
    }
};

function renderCard(data, container) {
    const min = parseInt(data.minAlert) || 0;
    const max = parseInt(data.max) || 0;

    const getStockStyle = (amount, hasDepo) => {
        if (!hasDepo) return { color: '#ffbc00', text: 'TANIMLI DEĞİL', size: '24px' };
        if (amount <= min) return { color: '#ff3333', text: amount, size: '90px' };
        return { color: '#ffffff', text: amount, size: '90px' };
    };

    const anaStyle = getStockStyle(data.anaDepoMiktar, data.hasAna);
    const amStyle = getStockStyle(data.amMiktar, data.hasAm);

    // PRO ÖZELLİK: Eğer barkod veya ref eksikse, arayüzden direkt manuel giriş imkanı sağla.
    let barkodUI = data.barkod 
        ? `<span style="color: #ccc;">${data.barkod}</span>` 
        : `<div style="display:flex; gap:10px;"><input type="text" id="man-b-${data.urunKodu}" placeholder="Barkod Okut..." style="background:#000; border:1px solid #333; color:#fff; padding:5px; width:130px;"><button onclick="saveManualData('${data.urunKodu}')" style="background:#00ff00; color:#000; border:none; padding:5px 10px; cursor:pointer; font-weight:bold;">KAYDET</button></div>`;
        
    let refUI = (data.refNo && data.refNo !== "BULUNAMADI")
        ? `<span style="color: #fff;">${data.refNo}</span>`
        : `<div style="display:flex; gap:10px;"><input type="text" id="man-r-${data.urunKodu}" placeholder="Ref Yaz..." style="background:#000; border:1px solid #333; color:#fff; padding:5px; width:130px;"><button onclick="saveManualData('${data.urunKodu}')" style="background:#00ff00; color:#000; border:none; padding:5px 10px; cursor:pointer; font-weight:bold;">KAYDET</button></div>`;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 40px;">
            <div style="background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="margin-bottom: 50px;">
                    <div style="font-size: 13px; color: #666; letter-spacing: 3px; margin-bottom: 15px; font-weight: 600;">ÜRÜN BİLGİSİ</div>
                    <div style="font-size: 38px; font-weight: 800; color: #fff; line-height: 1.2;">${data.urunAdi}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 35px; border-top: 1px solid #1a1a1a; padding-top: 40px;">
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px; letter-spacing: 1px;">ÜRÜN KODU</div>
                        <div style="font-size: 22px; color: #00ff00; font-family: monospace; font-weight: 600;">${data.urunKodu}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px; letter-spacing: 1px;">BARKOD</div>
                        <div style="font-size: 20px; font-family: monospace;">${barkodUI}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px; letter-spacing: 1px;">REF NO</div>
                        <div style="font-size: 20px; font-weight: 500;">${refUI}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px; letter-spacing: 1px;">ALT GRUP</div>
                        <div style="font-size: 22px; color: #ffbc00; font-weight: 500;">${data.altGrup}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px; letter-spacing: 1px;">MİAT TARİHİ</div>
                        <div style="font-size: 22px; color: #ff3333; font-weight: 600;">${data.miatTarihi}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px; letter-spacing: 1px;">SÜREÇ TİPİ</div>
                        <div style="font-size: 22px; color: #ccc;">${data.surecTipi}</div>
                    </div>
                </div>

                <div style="margin-top: 40px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
                    <div style="font-size: 13px; color: #666; letter-spacing: 2px; margin-bottom: 15px; font-weight: 600;">ÜTS BELGELERİ VE GÖRSELLER</div>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                        ${data.docLinks.kunye ? `<a href="${data.docLinks.kunye}" target="_blank" style="background: #111; border: 1px solid #333; color: #00ccff; padding: 10px 15px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background 0.2s;">📄 Ürün Künyesi</a>` : ``}
                        ${data.docLinks.etiket ? `<a href="${data.docLinks.etiket}" target="_blank" style="background: #111; border: 1px solid #333; color: #ffbc00; padding: 10px 15px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background 0.2s;">🖼️ Etiket / Ambalaj</a>` : ``}
                        ${data.docLinks.kilavuz ? `<a href="${data.docLinks.kilavuz}" target="_blank" style="background: #111; border: 1px solid #333; color: #00ff00; padding: 10px 15px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; transition: background 0.2s;">📖 Kullanma Kılavuzu</a>` : ``}
                        ${(!data.docLinks.kunye && !data.docLinks.etiket && !data.docLinks.kilavuz) ? `<span style="color:#444; font-size: 13px; font-style: italic;">Henüz belge yüklenmedi veya sistem tarafından ÜTS taraması bekleniyor.</span>` : ``}
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 40px;">
                <div style="flex: 1; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; background: #080808; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="font-size: 16px; color: #888; margin-bottom: 15px; letter-spacing: 3px; font-weight: 600;">ANA DEPO STOK</div>
                    <div style="font-size: ${anaStyle.size}; font-weight: 800; color: ${anaStyle.color}; line-height: 1;">${anaStyle.text}</div>
                    ${data.hasAna ? `
                        <div style="font-size: 16px; color: #555; margin-top: 15px; font-weight: 500;">MİN: <span style="color:#888">${min}</span> &nbsp;|&nbsp; MAX: <span style="color:#888">${max}</span></div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 20px 0;"></div>
                        <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; text-align: left; padding: 0 20px;">
                            <div style="font-size: 13px; color: #666; letter-spacing: 1px;">STOK ADRESİ: <span style="color: #fff; font-size: 15px;">${data.anaStokAdresi}</span></div>
                            <div style="font-size: 13px; color: #666; letter-spacing: 1px;">DUMMY DURUMU: <span style="color: ${data.anaDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'}; font-size: 15px; font-weight: 600;">${data.anaDummy}</span></div>
                            <div style="font-size: 13px; color: #666; letter-spacing: 1px;">CİHAZ TİPİ: <span style="color: ${data.anaReuse === 'REUSE' ? '#ff3333' : '#00ccff'}; font-size: 15px; font-weight: 600;">${data.anaReuse}</span></div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="flex: 1; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; background: #080808; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="font-size: 16px; color: #888; margin-bottom: 15px; letter-spacing: 3px; font-weight: 600;">AMELİYATHANE STOK</div>
                    <div style="font-size: ${amStyle.size}; font-weight: 800; color: ${amStyle.color}; line-height: 1;">${amStyle.text}</div>
                    ${data.hasAm ? `
                        <div style="font-size: 16px; color: #555; margin-top: 15px; font-weight: 500;">MİN: <span style="color:#888">${min}</span> &nbsp;|&nbsp; MAX: <span style="color:#888">${max}</span></div>
                        <div style="width: 100%; height: 1px; background: #1a1a1a; margin: 20px 0;"></div>
                        <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; text-align: left; padding: 0 20px;">
                            <div style="font-size: 13px; color: #666; letter-spacing: 1px;">STOK ADRESİ: <span style="color: #fff; font-size: 15px;">${data.amStokAdresi}</span></div>
                            <div style="font-size: 13px; color: #666; letter-spacing: 1px;">DUMMY DURUMU: <span style="color: ${data.amDummy === 'DUMMY' ? '#ffbc00' : '#00ff00'}; font-size: 15px; font-weight: 600;">${data.amDummy}</span></div>
                            <div style="font-size: 13px; color: #666; letter-spacing: 1px;">CİHAZ TİPİ: <span style="color: ${data.amReuse === 'REUSE' ? '#ff3333' : '#00ccff'}; font-size: 15px; font-weight: 600;">${data.amReuse}</span></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}
