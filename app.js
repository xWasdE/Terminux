import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');

let globalUser = "";
let searchTimeout = null;
let productCatalog = [];

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        appScreen.style.display = 'flex';
        appScreen.style.flexDirection = 'column';
        globalUser = user.email.split('@')[0].toUpperCase();
        loadTerminal();
        buildCatalog();
    } else {
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        appScreen.style.display = 'none';
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
        alert("Giriş Başarısız: Bilgileri kontrol edin.");
    }
});

async function buildCatalog() {
    try {
        productCatalog = [];
        const [anaSnap, amSnap] = await Promise.all([
            getDocs(collection(db, "ana_depo")),
            getDocs(collection(db, "ameliyathane"))
        ]);
        
        const tempMap = new Map();
        
        anaSnap.forEach(doc => {
            tempMap.set(doc.id, { docId: doc.id, ...doc.data() });
        });
        
        amSnap.forEach(doc => {
            if (!tempMap.has(doc.id)) {
                tempMap.set(doc.id, { docId: doc.id, ...doc.data() });
            }
        });
        
        productCatalog = Array.from(tempMap.values());
    } catch (error) {}
}

function loadTerminal() {
    appScreen.innerHTML = `
        <header style="padding: 25px 50px; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; background: #050505;">
            <div style="font-weight: 800; font-size: 28px; letter-spacing: -1px; color: #fff;">TERMINUX <span style="color:#444; font-size:14px; font-weight: 600;">WMS CORE</span></div>
            <div style="display: flex; gap: 30px; align-items: center;">
                <span style="font-size: 13px; color: #666; letter-spacing: 1px;">OPERATÖR: <b style="color: #00ff00;">${globalUser}</b></span>
                <button id="btn-logout" style="background: #ffffff; color: #000000; border: none; padding: 10px 25px; cursor: pointer; font-size: 12px; font-weight: 800; border-radius: 4px; transition: 0.2s;">GÜVENLİ ÇIKIŞ</button>
            </div>
        </header>
        <main style="flex: 1; padding: 50px; max-width: 1400px; margin: 0 auto; width: 100%; background: #000;">
            <div style="margin-bottom: 50px; position: relative;">
                <input type="text" id="main-search" placeholder="BARKOD, REF NO VEYA ÜRÜN İSMİ OKUTUN..." style="width: 100%; background: #080808; border: 2px solid #222; color: #00ff00; padding: 35px; font-size: 32px; font-family: monospace; outline: none; border-radius: 8px; transition: border-color 0.2s; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" autofocus autocomplete="off">
                <div id="dropdown-results" style="display: none; position: absolute; top: 110%; left: 0; width: 100%; background: #0a0a0a; border: 1px solid #333; z-index: 100; max-height: 400px; overflow-y: auto; border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);"></div>
            </div>
            <div id="result-container" style="display: none;"></div>
        </main>
    `;

    document.getElementById('btn-logout').addEventListener('click', () => { signOut(auth); });
    
    const input = document.getElementById('main-search');
    const dropdown = document.getElementById('dropdown-results');
    const res = document.getElementById('result-container');

    input.addEventListener('focus', () => { input.style.borderColor = '#444'; });
    input.addEventListener('blur', () => { input.style.borderColor = '#222'; });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
        if(!['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
            input.focus();
        }
    });

    input.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        clearTimeout(searchTimeout);
        
        if (val.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(() => {
            dropdown.innerHTML = '<div style="padding: 20px; color: #666; font-size: 18px;">Aranıyor...</div>';
            dropdown.style.display = 'block';

            let matches = productCatalog.filter(m => {
                const ad = (m.urunAdi || "").toLowerCase();
                const ref = (m.refNo || "").toLowerCase();
                const kod = (m.urunKodu || "").toLowerCase();
                const barkod = (m.barkod || "").toLowerCase();
                return ad.includes(val) || ref.includes(val) || kod.includes(val) || barkod.includes(val);
            }).slice(0, 15);

            if (matches.length > 0) {
                dropdown.innerHTML = matches.map(m => `
                    <div class="search-item" data-id="${m.docId}" style="padding: 20px 25px; border-bottom: 1px solid #1a1a1a; cursor: pointer; display: flex; flex-direction: column; gap: 5px; transition: background 0.2s;">
                        <div style="color: #fff; font-size: 18px; font-weight: 600;">${m.urunAdi}</div>
                        <div style="color: #888; font-size: 13px; font-family: monospace;">KOD: <span style="color: #00ff00;">${m.urunKodu}</span> &nbsp;|&nbsp; REF: ${m.refNo || '-'} &nbsp;|&nbsp; BARKOD: ${m.barkod || '-'}</div>
                    </div>
                `).join('');

                document.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('mouseenter', () => item.style.background = '#111');
                    item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                    item.addEventListener('click', () => {
                        input.value = '';
                        dropdown.style.display = 'none';
                        fetchAndDisplayProduct(item.getAttribute('data-id'));
                    });
                });
            } else {
                dropdown.innerHTML = '<div style="padding: 20px; color: #ff3333; font-size: 18px;">Eşleşme bulunamadı.</div>';
            }
        }, 150);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            dropdown.style.display = 'none';
            
            const code = input.value.trim();
            if (!code) return;
            
            input.value = '';

            const directMatch = productCatalog.find(m => 
                (m.docId.toLowerCase() === code.toLowerCase()) || 
                ((m.urunKodu || "").toLowerCase() === code.toLowerCase()) || 
                ((m.barkod || "").toLowerCase() === code.toLowerCase()) || 
                ((m.refNo || "").toLowerCase() === code.toLowerCase())
            );

            if (directMatch) {
                fetchAndDisplayProduct(directMatch.docId);
            } else {
                fetchAndDisplayProduct(code);
            }
        }
    });

    async function fetchAndDisplayProduct(code) {
        res.style.display = 'block';
        res.innerHTML = '<div style="color: #666; font-size: 24px;">Sorgulanıyor...</div>';

        const anaDoc = await getDoc(doc(db, "ana_depo", code));
        const amDoc = await getDoc(doc(db, "ameliyathane", code));

        if (anaDoc.exists() || amDoc.exists()) {
            const anaData = anaDoc.exists() ? anaDoc.data() : null;
            const amData = amDoc.exists() ? amDoc.data() : null;
            const baseData = anaData || amData; 

            const mergedData = {
                urunKodu: code,
                barkod: baseData.barkod || code,
                urunAdi: baseData.urunAdi || "-",
                refNo: baseData.refNo || "-",
                classTipi: baseData.classTipi || "-",
                surecTipi: baseData.surecTipi || "-",
                miatTarihi: baseData.miatTarihi || "-",
                minAlert: baseData.minAlert || 0,
                max: baseData.max || 0,
                hasAna: anaDoc.exists(),
                anaDepoMiktar: anaData ? parseInt(anaData.miktar) : 0,
                hasAm: amDoc.exists(),
                ameliyathaneMiktar: amData ? parseInt(amData.miktar) : 0
            };

            renderCard(mergedData, res);
        } else {
            res.innerHTML = `
                <div style="background: #110000; border: 1px solid #330000; padding: 40px; border-radius: 8px;">
                    <div style="color: #ff3333; font-size: 32px; font-weight: 800; margin-bottom: 15px;">KAYIT BULUNAMADI</div>
                    <div style="color: #888; font-size: 18px; font-family: monospace;">Okutulan Kod: <span style="color: #fff;">${code}</span></div>
                </div>
            `;
        }
    }
}

function renderCard(data, container) {
    const min = parseInt(data.minAlert) || 0;
    const max = parseInt(data.max) || 0;

    const getStockStyle = (amount, hasDepo) => {
        if (!hasDepo) return { color: '#ffbc00', text: 'TANIMLI DEĞİL', size: '18px' };
        if (amount <= min) return { color: '#ff3333', text: amount, size: '80px' };
        return { color: '#ffffff', text: amount, size: '80px' };
    };

    const anaStyle = getStockStyle(data.anaDepoMiktar, data.hasAna);
    const amStyle = getStockStyle(data.ameliyathaneMiktar, data.hasAm);

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div style="background: #080808; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="margin-bottom: 40px;">
                    <div style="font-size: 12px; color: #666; letter-spacing: 3px; margin-bottom: 10px; font-weight: 600;">ÜRÜN İSMİ</div>
                    <div style="font-size: 42px; font-weight: 800; color: #fff; line-height: 1.2;">${data.urunAdi}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px;">ÜRÜN KODU</div>
                        <div style="font-size: 20px; color: #00ff00; font-family: monospace; font-weight: 600;">${data.urunKodu}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px;">BARKOD</div>
                        <div style="font-size: 20px; color: #ccc; font-family: monospace;">${data.barkod}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px;">REF NO</div>
                        <div style="font-size: 20px; color: #fff; font-weight: 500;">${data.refNo}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px;">CLASS (SINIF)</div>
                        <div style="font-size: 20px; color: #ffbc00; font-weight: 500;">${data.classTipi}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px;">MİAT TARİHİ</div>
                        <div style="font-size: 20px; color: #ff3333; font-weight: 600;">${data.miatTarihi}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 8px; letter-spacing: 1px;">SÜREÇ TİPİ</div>
                        <div style="font-size: 20px; color: #ccc;">${data.surecTipi}</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 40px;">
                <div style="flex: 1; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; background: #080808; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="font-size: 14px; color: #888; margin-bottom: 20px; letter-spacing: 2px; font-weight: 600;">ANA DEPO STOK</div>
                    <div style="font-size: ${anaStyle.size}; font-weight: 800; color: ${anaStyle.color}; line-height: 1;">${anaStyle.text}</div>
                    ${data.hasAna ? `<div style="font-size: 14px; color: #555; margin-top: 20px; font-weight: 500;">MİN: <span style="color:#888">${min}</span> &nbsp;|&nbsp; MAX: <span style="color:#888">${max}</span></div>` : ''}
                </div>
                
                <div style="flex: 1; border: 1px solid #1a1a1a; border-radius: 12px; padding: 40px; background: #080808; display: flex; flex-direction: column; justify-content: center; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <div style="font-size: 14px; color: #888; margin-bottom: 20px; letter-spacing: 2px; font-weight: 600;">AMELİYATHANE STOK</div>
                    <div style="font-size: ${amStyle.size}; font-weight: 800; color: ${amStyle.color}; line-height: 1;">${amStyle.text}</div>
                    ${data.hasAm ? `<div style="font-size: 14px; color: #555; margin-top: 20px; font-weight: 500;">MİN: <span style="color:#888">${min}</span> &nbsp;|&nbsp; MAX: <span style="color:#888">${max}</span></div>` : ''}
                </div>
            </div>
        </div>
    `;
}
