import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = usernameInput.value.trim().toLowerCase();
    const passVal = passwordInput.value;
    let finalEmail = userVal === 'test' ? 'test@terminux.com.tr' : (userVal.includes('@') ? userVal : `${userVal}@terminux.com.tr`);
    let finalPass = (userVal === 'test' && passVal === 'test') ? 'testtest' : passVal;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, finalEmail, finalPass);
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        appScreen.style.display = 'flex';
        appScreen.style.flexDirection = 'column';
        globalUser = userCredential.user.email.split('@')[0].toUpperCase();
        loadTerminal();
    } catch (error) {
        alert("Giriş Başarısız: Bilgileri kontrol edin.");
    }
});

function loadTerminal() {
    appScreen.innerHTML = `
        <header style="padding: 20px 40px; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; background: #050505;">
            <div style="font-weight: 800; font-size: 24px; letter-spacing: -1px; color: #fff;">TERMINUX <span style="color:#444; font-size:12px;">WMS</span></div>
            <div style="display: flex; gap: 20px; align-items: center;">
                <span style="font-size: 12px; color: #666;">OPERATÖR: <b style="color: #00ff00;">${globalUser}</b></span>
                <button id="btn-logout" style="background: #111; color: #fff; border: 1px solid #333; padding: 8px 15px; cursor: pointer; font-size: 11px;">ÇIKIŞ</button>
            </div>
        </header>
        <main style="flex: 1; padding: 40px; max-width: 1200px; margin: 0 auto; width: 100%; background: #000;">
            <div style="margin-bottom: 40px; position: relative;">
                <input type="text" id="main-search" placeholder="BARKOD, REF NO VEYA ÜRÜN İSMİ YAZIN..." style="width: 100%; background: #050505; border: 1px solid #222; color: #00ff00; padding: 25px; font-size: 24px; font-family: monospace; outline: none;" autofocus autocomplete="off">
                <div id="dropdown-results" style="display: none; position: absolute; top: 100%; left: 0; width: 100%; background: #111; border: 1px solid #333; z-index: 100; max-height: 300px; overflow-y: auto;"></div>
            </div>
            <div id="result-container" style="display: none; border: 1px solid #1a1a1a; padding: 40px; background: #050505;"></div>
        </main>
    `;

    document.getElementById('btn-logout').addEventListener('click', () => { signOut(auth); window.location.reload(); });
    
    const input = document.getElementById('main-search');
    const dropdown = document.getElementById('dropdown-results');
    const res = document.getElementById('result-container');

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
        if(!['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
            input.focus();
        }
    });

    // Otomatik tamamlama (İsim veya REF ile arama)
    input.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        clearTimeout(searchTimeout);
        
        if (val.length < 3) {
            dropdown.style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(async () => {
            dropdown.innerHTML = '<div style="padding: 15px; color: #666;">Aranıyor...</div>';
            dropdown.style.display = 'block';

            const q = query(collection(db, "ana_depo"), limit(10));
            const querySnapshot = await getDocs(q);
            
            let matches = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const ad = (data.urunAdi || "").toLowerCase();
                const ref = (data.refNo || "").toLowerCase();
                const kod = (data.urunKodu || "").toLowerCase();
                
                if (ad.includes(val.toLowerCase()) || ref.includes(val.toLowerCase()) || kod.includes(val.toLowerCase())) {
                    matches.push(data);
                }
            });

            if (matches.length > 0) {
                dropdown.innerHTML = matches.map(m => `
                    <div class="search-item" data-id="${m.urunKodu}" style="padding: 15px; border-bottom: 1px solid #222; cursor: pointer; color: #fff;">
                        <span style="color: #00ff00;">[${m.urunKodu}]</span> ${m.urunAdi} ${m.refNo ? `| REF: ${m.refNo}` : ''}
                    </div>
                `).join('');

                document.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', () => {
                        input.value = '';
                        dropdown.style.display = 'none';
                        fetchAndDisplayProduct(item.getAttribute('data-id'));
                    });
                });
            } else {
                dropdown.innerHTML = '<div style="padding: 15px; color: #ff3333;">Eşleşme bulunamadı.</div>';
            }
        }, 500);
    });

    // Barkod okuyucu (Enter tuşu ile direkt getirme)
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            dropdown.style.display = 'none';
            
            const code = input.value.trim();
            if (!code) return;
            
            input.value = '';
            fetchAndDisplayProduct(code);
        }
    });

    async function fetchAndDisplayProduct(code) {
        res.style.display = 'block';
        res.innerHTML = '<div style="color: #444;">Sorgulanıyor...</div>';

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
                anaDepoMiktar: anaData ? anaData.miktar : 0,
                hasAm: amDoc.exists(),
                ameliyathaneMiktar: amData ? amData.miktar : 0
            };

            renderCard(mergedData, res);
        } else {
            res.innerHTML = `<div style="color: #ff0000; font-size: 20px;">KAYIT BULUNAMADI: ${code}</div>`;
        }
    }
}

function renderCard(data, container) {
    const min = data.minAlert;
    const max = data.max;

    const anaContent = data.hasAna 
        ? `<div style="font-size: 64px; font-weight: 800; color: ${data.anaDepoMiktar <= min ? '#ff0000' : '#fff'};">${data.anaDepoMiktar}</div>
           <div style="font-size: 12px; color: #666; margin-top: 10px;">MİN: ${min} | MAX: ${max}</div>`
        : `<div style="font-size: 14px; color: #ffbc00; letter-spacing: 1px;">BU DEPO İÇİN TANIMLI DEĞİL</div>`;

    const amContent = data.hasAm 
        ? `<div style="font-size: 64px; font-weight: 800; color: ${data.ameliyathaneMiktar <= min ? '#ff0000' : '#fff'};">${data.ameliyathaneMiktar}</div>
           <div style="font-size: 12px; color: #666; margin-top: 10px;">MİN: ${min} | MAX: ${max}</div>`
        : `<div style="font-size: 14px; color: #ffbc00; letter-spacing: 1px;">BU DEPO İÇİN TANIMLI DEĞİL</div>`;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 40px;">
            
            <div>
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 11px; color: #666; letter-spacing: 2px; margin-bottom: 5px;">ÜRÜN İSMİ</div>
                    <div style="font-size: 32px; font-weight: 800; color: #fff;">${data.urunAdi}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #1a1a1a; padding-top: 20px;">
                    <div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 4px;">ÜRÜN KODU</div>
                        <div style="font-size: 16px; color: #00ff00; font-family: monospace;">${data.urunKodu}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 4px;">BARKOD</div>
                        <div style="font-size: 16px; color: #ccc; font-family: monospace;">${data.barkod}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 4px;">REF NO</div>
                        <div style="font-size: 16px; color: #ccc;">${data.refNo}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 4px;">CLASS (SINIF)</div>
                        <div style="font-size: 16px; color: #ffbc00;">${data.classTipi}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 4px;">MİAT TARİHİ</div>
                        <div style="font-size: 16px; color: #ff3333;">${data.miatTarihi}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 4px;">SÜREÇ TİPİ</div>
                        <div style="font-size: 16px; color: #ccc;">${data.surecTipi}</div>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div style="border: 1px solid #222; padding: 25px; background: #0a0a0a; text-align: center;">
                    <div style="font-size: 12px; color: #888; margin-bottom: 15px; letter-spacing: 1px;">ANA DEPO STOK</div>
                    ${anaContent}
                </div>
                
                <div style="border: 1px solid #222; padding: 25px; background: #0a0a0a; text-align: center;">
                    <div style="font-size: 12px; color: #888; margin-bottom: 15px; letter-spacing: 1px;">AMELİYATHANE STOK</div>
                    ${amContent}
                </div>
            </div>
        </div>
    `;
}