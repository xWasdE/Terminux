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
    document.getElementById('task-title').focus();
};

window.closeTaskModal = () => {
    document.getElementById('task-modal').style.display = 'none';
};

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.querySelector('.btn-save');
    saveBtn.innerText = 'KAYDEDİLİYOR...';
    saveBtn.disabled = true;
    
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
    } catch (error) {
        alert("Kayıt başarısız oldu. Ağ bağlantınızı kontrol edin.");
    } finally {
        saveBtn.innerText = 'KAYDET';
        saveBtn.disabled = false;
    }
});

window.toggleTaskStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
        await updateDoc(doc(db, "work_plans", id), { status: newStatus });
    } catch (error) {}
};

window.deleteTask = async (id) => {
    if(confirm('Kayıtlı operasyon planını sistemden kalıcı olarak silmek istediğinize emin misiniz?')) {
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
    const todayStr = curr.toISOString().split('T')[0];
    
    const dayOfWeek = curr.getDay();
    const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    
    for(let i=0; i<7; i++) {
        const d = new Date(curr.setDate(diffToMonday + i));
        targetDates.push(d.toISOString().split('T')[0]);
    }

    targetDates.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        const dayIdx = dateObj.getDay();
        const isWeekend = dayIdx === 0 || dayIdx === 6;
        const isToday = dateStr === todayStr;
        
        const dayTasks = currentTasks.filter(t => t.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));
        
        let tasksHTML = '';
        dayTasks.forEach(t => {
            const mesaiBadge = t.isMesaiDisi ? '<span class="badge badge-mesai">MESAİ DIŞI</span>' : '';
            const reminderBadge = (t.reminder && t.status === 'pending') ? '<span class="badge badge-reminder">ÖNEMLİ</span>' : '';
            const statusClass = t.status === 'completed' ? 'completed' : (t.isMesaiDisi ? 'mesai-disi' : '');

            tasksHTML += `
                <div class="task-card ${statusClass}">
                    <div class="task-header">
                        <span class="task-time">${t.time}</span>
                        <div class="task-badges">${reminderBadge}${mesaiBadge}</div>
                    </div>
                    <div class="task-title">${t.title}</div>
                    ${t.notes ? `<div class="task-notes">${t.notes}</div>` : ''}
                    <div class="task-controls">
                        <button class="btn-action complete" onclick="toggleTaskStatus('${t.id}', '${t.status}')">
                            ${t.status === 'completed' ? 'GERİ AL' : 'TAMAMLA'}
                        </button>
                        <button class="btn-action delete" onclick="deleteTask('${t.id}')">SİL</button>
                    </div>
                </div>
            `;
        });

        const formattedDate = dateStr.split('-').reverse().join('.');
        
        const colHTML = `
            <div class="day-column ${isToday ? 'today' : ''}">
                <div class="day-header">
                    <span class="day-name ${isWeekend ? 'weekend' : ''}">${daysTR[dayIdx]}</span>
                    <span class="day-date">${formattedDate}</span>
                </div>
                <div class="task-list">
                    ${tasksHTML || '<div style="color:#555; font-size:12px; font-family:monospace; text-align:center; margin-top:20px;">[ BOŞ ]</div>'}
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', colHTML);
    });

    setTimeout(() => {
        const todayCol = document.querySelector('.day-column.today');
        if (todayCol && window.innerWidth < 768) {
            todayCol.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }, 100);
};

const evaluateReminders = () => {
    const { todayStr, tomorrowStr } = getRelativeDateInfo();
    const banner = document.getElementById('reminder-banner');
    const textEl = document.getElementById('reminder-text');
    
    const alertTasks = currentTasks.filter(t => t.reminder && t.status === 'pending' && (t.date === todayStr || t.date === tomorrowStr));
    
    if(alertTasks.length > 0) {
        textEl.innerHTML = `Sisteme kayıtlı <b>bugün veya yarına ait ${alertTasks.length} adet yüksek öncelikli</b> operasyon göreviniz bulunmaktadır.`;
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
