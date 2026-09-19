import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

window.showAlert = (title, desc) => {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-desc').innerText = desc;
    document.getElementById('custom-alert').style.display = 'flex';
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin' && userDoc.data().status === 'active') {
            const loader = document.getElementById('global-loader');
            if (loader) loader.style.display = 'none';
            const displayUser = document.getElementById('display-user');
            if (displayUser) displayUser.innerText = user.email;
        } else {
            window.location.href = "/index.html";
        }
    } else {
        window.location.href = "/index.html";
    }
});

const logoutBtn = document.getElementById('btn-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
    });
}

export { app, auth, db };
