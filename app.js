import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = usernameInput.value.trim().toLowerCase();
    const passVal = passwordInput.value;
    let finalEmail = userVal;
    let finalPass = passVal;

    if (userVal === 'test') {
        finalEmail = 'test@terminux.com.tr';
        if (passVal === 'test') finalPass = 'testtest';
    } else if (!userVal.includes('@')) {
        finalEmail = `${userVal}@terminux.com.tr`;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, finalEmail, finalPass);
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        appScreen.style.display = 'flex';
        appScreen.style.flexDirection = 'column';
        
        globalUser = userCredential.user.email.split('@')[0].toUpperCase();
        loadDashboard();
    } catch (error) {
        alert("Erişim Reddedildi.");
    }
});

function loadDashboard() {
    appScreen.innerHTML = `
        <header style="padding: 20px 40px; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; background: #050505;">
            <div style="font-weight: 800; font-size: 24px; letter-spacing: -1px; color: #fff;">TERMINUX <span style="color:#444; font-size:12px;">WMS CORE</span></div>
            <div style="display: flex; gap: 20px; align-items: center;">
                <span style="font-size: 12px; color: #666;">OPERATÖR: <b style="color: #00ff00;">${globalUser}</b></span>
                <button id="btn-logout" style="background: #111; color: #fff; border: 1px solid #333; padding: 8px 15px; cursor: pointer; font-size: 11px;">GÜVENLİ ÇIKIŞ</button>
            </div>
        </header>
        <main style="flex: 1; padding: 60px 40px; max-width: 1200px; margin: 0 auto; width: 100%; background: #000;">
            <div style="margin-bottom: 40px;">
                <h2 style="color: #fff; font-size: 32px; font-weight: 800; letter-spacing: -1px; margin-bottom: 10px;">ANA MENÜ</h2>
                <p style="color: #666; font-size: 14px;">Yapmak istediğiniz işlemi seçin.</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div id="card-terminal" style="background: #0a0a0a; border: 1px solid #222; padding: 40px 30px; cursor: pointer; transition: 0.2s; border-radius: 4px;">
                    <div style="color: #00ff00; font-size: 40px; margin-bottom: 20px;">■</div>
                    <h3 style="color: #fff; font-size: 18px; margin-bottom: 10px;">Hızlı Sorgu & Etiket</h3>
                    <p style="color: #666; font-size: 13px; line-height: 1.5;">Barkod okutarak her iki depodaki güncel stok durumunu görün ve zebra yazıcıya etiket gönderin.</p>
                </div>

                <div id="card-cikis" style="background: #0a0a0a; border: 1px solid #222; padding: 40px 30px; cursor: pointer; transition: 0.2s; border-radius: 4px;">
                    <div style="color: #00ccff; font-size: 40px; margin-bottom: 20px;">▼</div>
                    <h3 style="color: #fff; font-size: 18px; margin-bottom: 10px;">Stok Çıkış (Sarf)</h3>
                    <p style="color: #666; font-size: 13px; line-height: 1.5;">Ameliyathane veya Ana Depo'dan ürün düşümü yapın.</p>
                </div>

                <div id="card-rapor" style="background: #0a0a0a; border: 1px solid #222; padding: 40px 30px; cursor: pointer; transition: 0.2s; border-radius: 4px;">
                    <div style="color: #ffbc00; font-size: 40px; margin-bottom: 20px;">≡</div>
                    <h3 style="color: #fff; font-size: 18px; margin-bottom: 10px;">Envanter Raporu</h3>
                    <p style="color: #666; font-size: 13px; line-height: 1.5;">Kritik seviyedeki ürünleri ve genel stok tablosunu görüntüleyin.</p>
                </div>
            </div>
        </main>
    `;

    document.getElementById('btn-logout').addEventListener('click', () => { signOut(auth); window.location.reload(); });
    
    document.getElementById('card-terminal').addEventListener('click', loadTerminal);
    document.getElementById('card-cikis').addEventListener('click', () => alert("Stok Çıkış ekranı kodlanacak."));
    document.getElementById('card-rapor').addEventListener('click', () => alert("Envanter Raporu ekranı kodlanacak."));
}

function loadTerminal() {
    appScreen.innerHTML = `
        <header style="padding: 20px 40px; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; background: #050505;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <button id="btn-back" style="background: transparent; color: #888; border: 1px solid #333; padding: 8px 15px; cursor: pointer; font-size: 11px;">◀ GERİ DÖN</button>
                <div style="font-weight: 800; font-size: 20px; letter-spacing: -1px; color: #fff;">HIZLI SORGU TERMİNALİ</div>
            </div>
            <div style="display: flex; gap: 20px; align-items: center;">
                <span style="font-size: 12px; color: #666;">OPERATÖR: <b style="color: #00ff00;">${globalUser}</b></span>
            </div>
        </header>
        <main style="flex: 1; padding: 40px; max-width: 1000px; margin: 0 auto; width: 100%; background: #000;">
            <div style="margin-bottom: 40px;">
                <label style="display: block; font-size: 11px; color: #444; margin-bottom: 10px; letter-spacing: 2px;">BARKOD / REFERANS NO</label>
                <input type="text" id="barcode-scanner" style="width: 100%; background: #050505; border: 1px solid #222; color: #00ff00; padding: 30px; font-size: 40px; font-family: monospace; outline: none;" autofocus autocomplete="off">
            </div>
            <div id="result-container" style="display: none; border: 1px solid #1a1a1a; padding: 40px; background: #050505;"></div>
        </main>
    `;

    document.getElementById('btn-back').addEventListener('click', loadDashboard);

    const input = document.getElementById('barcode-scanner');
    const res = document.getElementById('result-container');

    document.addEventListener('click', (e) => {
        if(document.getElementById('barcode-scanner') && !['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
            input.focus();
        }
    });

    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const code = input.value.trim();
            input.value = '';
            if (!code) return;

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
                    urunAdi: baseData.urunAdi,
                    miatTarihi: baseData.miatTarihi,
                    durum: baseData.durum,
                    surecTipi: baseData.surecTipi,
                    minAlert: baseData.minAlert,
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
    });
}

function renderCard(data, container) {
    const crit = data.minAlert || 0;

    const anaContent = data.hasAna 
        ? `<div style="font-size: 48px; font-weight: 800; color: ${data.anaDepoMiktar <= crit ? '#ff0000' : '#fff'};">${data.anaDepoMiktar}</div>`
        : `<div style="font-size: 12px; color: #ffbc00; font-weight: 600; margin-top: 10px; letter-spacing:1px;">BU ÜRÜN ANA DEPODA TANIMLI DEĞİL</div>`;

    const amContent = data.hasAm 
        ? `<div style="font-size: 48px; font-weight: 800; color: ${data.ameliyathaneMiktar <= crit ? '#ff0000' : '#fff'};">${data.ameliyathaneMiktar}</div>`
        : `<div style="font-size: 12px; color: #ffbc00; font-weight: 600; margin-top: 10px; letter-spacing:1px;">BU ÜRÜN AMELİYATHANEDE TANIMLI DEĞİL</div>`;

    container.innerHTML = `
        <div style="margin-bottom: 30px;">
            <div style="font-size: 12px; color: #444; margin-bottom: 5px;">ÜRÜN BİLGİSİ</div>
            <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: #fff;">${data.urunAdi}</div>
            <div style="font-family: monospace; color: #888;">KOD: ${data.urunKodu}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="border: 1px solid #1a1a1a; padding: 25px; min-height: 140px; display: flex; flex-direction: column; justify-content: center; background: #080808;">
                <div style="font-size: 11px; color: #444; margin-bottom: 10px; letter-spacing: 1px;">ANA DEPO STOK</div>
                ${anaContent}
            </div>
            <div style="border: 1px solid #1a1a1a; padding: 25px; min-height: 140px; display: flex; flex-direction: column; justify-content: center; background: #080808;">
                <div style="font-size: 11px; color: #444; margin-bottom: 10px; letter-spacing: 1px;">AMELİYATHANE STOK</div>
                ${amContent}
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px; color: #666; font-size: 13px;">
            <div>MIAT: <span style="color:#eee">${data.miatTarihi || '-'}</span></div>
            <div>DURUM: <span style="color:#eee">${data.durum || '-'}</span></div>
            <div>TİP: <span style="color:#eee">${data.surecTipi || '-'}</span></div>
        </div>
        <div style="display: flex; gap: 10px; border-top: 1px solid #1a1a1a; padding-top: 30px;">
            <select id="p-sel" style="flex: 1; background: #000; color: #fff; border: 1px solid #333; padding: 15px; outline: none; cursor: pointer;">
                <option value="ANA">ANA DEPO ZEBRA</option>
                <option value="AM">AMELİYATHANE ZEBRA</option>
            </select>
            <button onclick="alert('Baskı komutu gönderildi')" style="background: #fff; color: #000; border: none; padding: 0 30px; font-weight: 800; cursor: pointer;">ETİKET BAS</button>
        </div>
    `;
}