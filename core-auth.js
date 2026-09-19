import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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


const path = window.location.pathname.toLowerCase();
let requiredModule = null;
if (path.includes('sayim.html')) requiredModule = 'sayim';
else if (path.includes('sevkiyat.html')) requiredModule = 'sevkiyat';
else if (path.includes('lens.html')) requiredModule = 'lens';
else if (path.includes('adres.html') || path.includes('teyit.html')) requiredModule = 'adres';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            

            if (userData.status !== 'active') {
                await signOut(auth);
                window.location.href = 'index.html';
                return;
            }


            if (userData.role !== 'admin' && requiredModule) {
                if (!userData.modules || userData.modules[requiredModule] !== true) {
                    alert("YETKİSİZ ERİŞİM: Bu modüle giriş yetkiniz bulunmuyor.");
                    window.location.href = 'index.html';
                    return;
                }
            }
        } else {
            await signOut(auth);
            window.location.href = 'index.html';
            return;
        }


        onSnapshot(doc(db, "system", "settings"), (docSnap) => {
            if (docSnap.exists() && docSnap.data().maintenanceMode === true) {
                if (!sessionStorage.getItem('bypass_maintenance')) {
                    window.location.href = 'bakim.html';
                }
            }
        });

    } else {

        if (!path.includes('index.html') && !path.includes('bakim.html') && path !== '/' && path !== '') {
            window.location.href = 'index.html';
        }
    }
});


export { app, auth, db, onAuthStateChanged };
