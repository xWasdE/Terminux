import { db, auth } from './core-auth.js';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const daysTR = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
let currentTasks = [];

const checkMesaiDisi = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    const day = d.getDay(); 
    const [hour, minute] = timeStr.split(':').map(Number);

    if (day === 0) return true; 
    if (day >= 1 && day <= 5) {
        if (hour < 8 || hour >= 18) return true;
    }
    if (day === 6) {
        if (hour < 8 || hour >= 14) return true;
    }
    return false;
};

const getRelativeDateInfo = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
        todayStr: today.toISOString().split('T')[0],
        tomorrowStr: tomorrow.toISOString().split('T')[0]
    };
};

window.openTaskModal = () => {
    document.getElementById('task-form').reset();
    document.getElementById('task-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('task-modal').style.display = 'flex';
};

window.closeTaskModal = () => {
    document.getElementById('task-modal').style.display = 'none';
};

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const notes = document.getElementById('task-notes').value.trim();
    const reminder = document.getElementById('task-reminder').checked;
    const isMesai = checkMesaiDisi(date, time);

    const taskData = {
        title, date, time, notes, reminder, isMesaiDisi: isMesai,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "work_plans"), taskData);
        closeTaskModal();
    } catch (error) {}
});

window.toggleTaskStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
        await updateDoc(doc(db, "work_plans", id), { status: newStatus });
    } catch (error) {}
};

window.deleteTask = async (id) => {
    if(confirm('Bu iş planını silmek istediğinize emin misiniz?')) {
        try {
            await deleteDoc(doc(db, "work_plans", id));
        } catch (error) {}
    }
};

const renderGrid = () => {
    const grid = document.getElementById('week-grid');
    grid.innerHTML = '';
    
    const targetDates = [];
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; 
    
    for(let i=0; i<7; i++) {
        const d = new Date(curr.setDate(first + i));
        targetDates.push(d.toISOString().split('T')[0]);
    }

    targetDates.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        const dayIdx = dateObj.getDay();
        const isWeekend = dayIdx === 0 || dayIdx === 6;
        
        const dayTasks = currentTasks.filter(t => t.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
        
        let tasksHTML = '';
        dayTasks.forEach(t => {
            const mesaiBadge = t.isMesaiDisi ? '<div class="badge-mesai">MESAİ DIŞI</div>' : '';
            const reminderBadge = (t.reminder && t.status === 'pending') ? '<div class="badge-reminder">🔔 HATIRLATICI</div>' : '';
            const statusClass = t.status === 'completed' ? 'completed' : (t.isMesaiDisi ? 'mesai-disi' : '');
            const checkColor = t.status === 'completed' ? '#00ff00' : '#888';

            tasksHTML += `
                <div class="task-card ${statusClass}">
                    ${mesaiBadge}
                    ${reminderBadge}
                    <div class="task-time">${t.time}</div>
                    <div class="task-title">${t.title}</div>
                    ${t.notes ? `<div class="task-notes">${t.notes}</div>` : ''}
                    <div class="task-actions">
                        <button onclick="toggleTaskStatus('${t.id}', '${t.status}')" style="background:transparent; border:1px solid ${checkColor}; color:${checkColor}; border-radius:4px; padding:4px 8px; font-size:10px; cursor:pointer;">${t.status === 'completed' ? 'GERİ AL' : 'TAMAMLANDI'}</button>
                        <button onclick="deleteTask('${t.id}')" style="background:transparent; border:1px solid #ff3333; color:#ff3333; border-radius:4px; padding:4px 8px; font-size:10px; cursor:pointer;">SİL</button>
                    </div>
                </div>
            `;
        });

        const colHTML = `
            <div class="day-col">
                <div class="day-title ${isWeekend ? 'weekend' : ''}">${daysTR[dayIdx]} <span style="color:#555; font-size:10px; float:right;">${dateStr.split('-').reverse().join('.')}</span></div>
                ${tasksHTML || '<div style="color:#555; font-size:12px; font-style:italic;">Planlanmış iş yok.</div>'}
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', colHTML);
    });
};

const evaluateReminders = () => {
    const { todayStr, tomorrowStr } = getRelativeDateInfo();
    const banner = document.getElementById('reminder-banner');
    const textEl = document.getElementById('reminder-text');
    
    const alertTasks = currentTasks.filter(t => t.reminder && t.status === 'pending' && (t.date === todayStr || t.date === tomorrowStr));
    
    if(alertTasks.length > 0) {
        textEl.innerHTML = `🔔 <b>DİKKAT:</b> Bugün veya yarına ait <b>${alertTasks.length} adet</b> önemli bekleyen işiniz bulunmaktadır!`;
        banner.classList.add('active');
    } else {
        banner.classList.remove('active');
    }
};

const q = query(collection(db, "work_plans"), orderBy("date", "asc"), orderBy("time", "asc"));
onSnapshot(q, (snapshot) => {
    currentTasks = [];
    snapshot.forEach(doc => {
        currentTasks.push({ id: doc.id, ...doc.data() });
    });
    renderGrid();
    evaluateReminders();
});
