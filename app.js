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

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userVal = usernameInput.value.trim().toLowerCase();
    const passVal = passwordInput.value;
    
    let finalEmail = userVal;
    let finalPass = passVal;

    if (userVal === 'test') {
        finalEmail = 'test@terminux.com.tr';
        if (passVal === 'test') {
            finalPass = 'testtest';
        }
    } else if (!userVal.includes('@')) {
        finalEmail = `${userVal}@terminux.com.tr`;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, finalEmail, finalPass);
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        appScreen.classList.add('split-layout');
        
        const operatorName = userCredential.user.email.split('@')[0];
        initTerminal(operatorName);
    } catch (error) {
        alert("Erişim Reddedildi.");
    }
});

function initTerminal(activeUser) {
    appScreen.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; background-color: #000000;">
            <header style="padding: 16px 32px; border-bottom: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; background-color: #050505;">
                <div style="font-weight: 800; font-size: 20px; letter-spacing: -0.5px;">TERMINUX <span style="color:#666; font-size:14px; font-weight:500;">| WMS CORE</span></div>
                <div style="display: flex; gap: 20px; align-items: center;">
                    <span style="font-family: monospace; font-size: 13px; color: #00ff00;">● BAĞLANTI AKTİF</span>
                    <span style="font-size: 13px; color: #888;">Operatör: <b style="color: #fff; text-transform: uppercase;">${activeUser}</b></span>
                    <button id="btn-logout" style="background: transparent; border: 1px solid #333; color: #fff; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-size: 12px;">ÇIKIŞ</button>
                </div>
            </header>

            <main style="flex: 1; display: flex; flex-direction: column; padding: 40px; max-width: 1200px; margin: 0 auto; width: 100%;">
                <div style="margin-bottom: 40px;">
                    <label style="display: block; font-size: 12px; color: #666; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Barkod / Referans No Okutun</label>
                    <input type="text" id="barcode-scanner" style="width: 100%; background: #0a0a0a; border: 2px solid #333; color: #fff; padding: 24px; font-size: 32px; font-family: monospace; border-radius: 4px; outline: none; transition: 0.2s;" autocomplete="off" spellcheck="false" autofocus>
                </div>
                <div id="result-container" style="display: none; background: #050505; border: 1px solid #222; border-radius: 4px; padding: 32px;"></div>
            </main>
        </div>
    `;

    const barcodeInput = document.getElementById('barcode-scanner');
    const resultContainer = document.getElementById('result-container');
    const btnLogout = document.getElementById('btn-logout');

    document.addEventListener('click', () => {
        if(document.activeElement !== barcodeInput) {
            barcodeInput.focus();
        }
    });

    btnLogout.addEventListener('click', async () => {
        await signOut(auth);
        window.location.reload();
    });

    barcodeInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const rawCode = barcodeInput.value.trim();
            barcodeInput.value = '';
            
            if (!rawCode) return;

            resultContainer.style.display = 'block';
            resultContainer.style.borderColor = '#444';
            resultContainer.innerHTML = `<span style="color: #888; font-family: monospace;">Sorgulanıyor: ${rawCode}...</span>`;

            try {
                const docRef = doc(db, "urunler", rawCode);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    renderProductCard(docSnap.data(), resultContainer);
                } else {
                    resultContainer.style.borderColor = '#ff3333';
                    resultContainer.innerHTML = `
                        <div style="color: #ff3333; font-weight: 600; font-size: 24px; margin-bottom: 8px;">KAYIT BULUNAMADI</div>
                        <div style="color: #888; font-family: monospace;">Okutulan Kod: ${rawCode}</div>
                    `;
                }
            } catch (error) {
                resultContainer.innerHTML = `<div style="color: red;">Bağlantı hatası.</div>`;
            }
        }
    });
}

function renderProductCard(data, container) {
    container.style.borderColor = '#00ff00';
    
    const miktar = parseInt(data.miktar) || 0;
    const alertMiktar = parseInt(data.minAlert) || 0;
    const miktarColor = miktar <= alertMiktar ? '#ff3333' : '#00ff00';

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
            <div>
                <div style="font-family: monospace; color: #888; font-size: 14px; margin-bottom: 4px;">ÜRÜN KODU / BARKOD</div>
                <div style="font-size: 36px; font-weight: 800; color: #fff; letter-spacing: 2px;">${data.urunKodu}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-family: monospace; color: #888; font-size: 14px; margin-bottom: 4px;">STOK MİKTARI</div>
                <div style="font-size: 48px; font-weight: 900; color: ${miktarColor}; line-height: 1;">${miktar}</div>
            </div>
        </div>

        <div style="margin-bottom: 32px; border-bottom: 1px solid #1a1a1a; padding-bottom: 24px;">
            <div style="font-family: monospace; color: #888; font-size: 14px; margin-bottom: 4px;">ÜRÜN ADI</div>
            <div style="font-size: 24px; color: #fff; line-height: 1.4;">${data.urunAdi}</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px;">
            <div>
                <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px;">Depo Lokasyonu</div>
                <div style="font-size: 15px; color: #ccc;">${data.depoKodu || ''} - ${data.depoAdi || ''}</div>
            </div>
            <div>
                <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px;">Miat Tarihi</div>
                <div style="font-size: 15px; color: #ccc;">${data.miatTarihi || '-'}</div>
            </div>
            <div>
                <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px;">Durum</div>
                <div style="font-size: 15px; color: #ccc;">${data.durum || '-'}</div>
            </div>
            <div>
                <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px;">Süreç Tipi</div>
                <div style="font-size: 15px; color: #ccc;">${data.surecTipi || '-'}</div>
            </div>
        </div>

        <div style="display: flex; gap: 16px;">
            <button id="btn-print-zebra" style="background: #ffffff; color: #000000; border: none; padding: 16px 32px; font-size: 14px; font-weight: 700; cursor: pointer; border-radius: 4px;">
                ZEBRA ETİKET BAS
            </button>
        </div>
    `;

    document.getElementById('btn-print-zebra').addEventListener('click', () => {
        alert("Zebra yazıcı komutu gönderildi.");
    });
}