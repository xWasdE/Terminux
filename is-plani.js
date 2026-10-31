import { db, auth } from './core-auth.js';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const daysTR = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'];
const hourSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00+"];
let currentTasks = [];

const toYMD = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const mapTimeToBlock = (timeStr) => {
    if (!timeStr) return "18:00+";
    const h = parseInt(timeStr.split(':')[0]);
    if (h < 8 || h >= 18) return "18:00+";
    return (h < 10 ? '0' + h : h) + ":00";
};

const checkMesaiDisi = (dayIdx, timeStr) => {
    const [hour] = timeStr.split(':').map(Number);
    if (dayIdx === 0) return true; // Pazar her saat mesai dışı
    if (dayIdx >= 1 && dayIdx <= 5 && (hour < 8 || hour >= 18)) return true; // H.içi 08-18 dışı
    if (dayIdx === 6 && (hour < 8 || hour >= 14)) return true; // C.tesi 08-14 dışı
    return false;
};

window.openTaskModal = (forcedDate = null, forcedTime = null) => {
    document.getElementById('task-form').reset();
    const dateInput = document.getElementById('task-date');
    const timeInput = document.getElementById('task-time');
    
    dateInput.value = forcedDate || toYMD(new Date());
    
    if (forcedTime && forcedTime !== "18:00+") {
        timeInput.value = forcedTime;
    } else if (forcedTime === "18:00+") {
        timeInput.value = "18:30";
    } else {
        timeInput.value = "09:00";
    }

    document.getElementById('task-modal').style.display = 'flex';
    document.getElementById('task-title').focus();
};

window.closeTaskModal = () => {
    document.getElementById('task-modal').style.display = 'none';
};

document.getElementById('task-fixed').addEventListener('change', (e) => {
    const isFixed = e.target.checked;
    const dateLabel = document.getElementById('label-date');
    if (isFixed) {
        dateLabel.innerHTML = 'BAŞLANGIÇ / REFERANS TARİHİ <span style="color:#ffbc00; font-size:9px;">(Sadece günü baz alınır)</span>';
    } else {
        dateLabel.innerHTML = 'TARİH';
    }
});

document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.querySelector('.btn-save');
    saveBtn.innerText = 'İŞLENİYOR...';
    saveBtn.disabled = true;
    
    const title = document.getElementById('task-title').value.trim();
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const notes = document.getElementById('task-notes').value.trim();
    const reminder = document.getElementById('task-reminder').checked;
    const isFixed = document.getElementById('task-fixed').checked;
    
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const isMesai = checkMesaiDisi(dayOfWeek, time);

    const taskData = {
        title, date, time, notes, reminder, isFixed, dayOfWeek,
        isMesaiDisi: isMesai,
        status: 'pending',
        completedDates: [],
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "work_plans"), taskData);
        closeTaskModal();
    } catch (error) {
        alert("Kayıt başarısız oldu. Ağ bağlantınızı kontrol edin.");
    } finally {
        saveBtn.innerText = 'SİSTEME İŞLE';
        saveBtn.disabled = false;
    }
});

window.toggleTaskStatus = async (id, isFixed, currentDateStr, currentStatus) => {
    try {
        const task = currentTasks.find(t => t.id === id);
        if(!task) return;

        if (isFixed) {
            let completedDates = task.completedDates || [];
            if (completedDates.includes(currentDateStr)) {
                completedDates = completedDates.filter(d => d !== currentDateStr);
            } else {
                completedDates.push(currentDateStr);
            }
            await updateDoc(doc(db, "work_plans", id), { completedDates });
        } else {
            const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
            await updateDoc(doc(db, "work_plans", id), { status: newStatus });
        }
    } catch (error) {}
};

window.deleteTask = async (id) => {
    if(confirm('Kayıtlı operasyon planını sistemden kalıcı olarak SİLMEK istediğinize emin misiniz?')) {
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
    const todayStr = toYMD(curr);
    
    const dayOfWeek = curr.getDay();
    const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    
    for(let i=0; i<7; i++) {
        const d = new Date(curr.setDate(diffToMonday + i));
        targetDates.push({ dateStr: toYMD(d), dayIdx: d.getDay() });
    }

    targetDates.forEach(({dateStr, dayIdx}) => {
        const isWeekend = dayIdx === 0 || dayIdx === 6;
        const isToday = dateStr === todayStr;
        
        // Bu güne ait işleri bul (Normal veya Sabit)
        const dayTasks = currentTasks.filter(t => {
            if (t.isFixed) return t.dayOfWeek === dayIdx;
            return t.date === dateStr;
        });

        let timelineHTML = '';
        
        hourSlots.forEach(slotHour => {
            const tasksInSlot = dayTasks.filter(t => mapTimeToBlock(t.time) === slotHour).sort((a, b) => a.time.localeCompare(b.time));
            
            let slotContentHTML = '';
            
            if (tasksInSlot.length > 0) {
                tasksInSlot.forEach(t => {
                    const isCompleted = t.isFixed ? (t.completedDates || []).includes(dateStr) : (t.status === 'completed');
                    const statusClass = isCompleted ? 'completed' : (t.isMesaiDisi ? 'mesai-disi' : (t.isFixed ? 'fixed-task' : ''));
                    
                    const mesaiBadge = t.isMesaiDisi ? '<span class="badge badge-fixed" style="background:var(--accent-red); color:#fff;">MESAİ DIŞI</span>' : '';
                    const fixedBadge = t.isFixed ? '<span class="badge badge-fixed">SABİT OPRS.</span>' : '';
                    const reminderBadge = (t.reminder && !isCompleted) ? '<span class="badge badge-reminder">ÖNEMLİ</span>' : '';

                    slotContentHTML += `
                        <div class="task-card ${statusClass}">
                            <div class="task-header">
                                <span class="task-time">${t.time}</span>
                                <div class="task-badges">${fixedBadge}${reminderBadge}${mesaiBadge}</div>
                            </div>
                            <div class="task-title">${t.title}</div>
                            ${t.notes ? `<div class="task-notes">${t.notes}</div>` : ''}
                            <div class="task-controls">
                                <button class="btn-action complete" onclick="toggleTaskStatus('${t.id}', ${t.isFixed}, '${dateStr}', '${t.status}')">
                                    ${isCompleted ? 'GERİ AL' : 'TAMAMLA'}
                                </button>
                                <button class="btn-action delete" onclick="deleteTask('${t.id}')">SİL</button>
                            </div>
                        </div>
                    `;
                });
            } else {
                slotContentHTML = `<div class="empty-slot" onclick="openTaskModal('${dateStr}', '${slotHour}')">+ PLANLA (${slotHour})</div>`;
            }

            timelineHTML += `
                <div class="hour-block">
                    <div class="hour-label">${slotHour}</div>
                    <div class="hour-content">${slotContentHTML}</div>
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
                <div class="timeline-container">
                    ${timelineHTML}
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', colHTML);
    });

    // Otomatik olarak bugünün sütununa scroll yap
    setTimeout(() => {
        const todayCol = document.querySelector('.day-column.today');
        if (todayCol && window.innerWidth < 768) {
            todayCol.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }, 150);
};

const evaluateReminders = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = toYMD(today);
    const tomorrowStr = toYMD(tomorrow);
    
    const alertTasks = currentTasks.filter(t => {
        if (!t.reminder) return false;
        
        let appliesToToday = false;
        let appliesToTomorrow = false;
        
        if (t.isFixed) {
            appliesToToday = (t.dayOfWeek === today.getDay()) && !(t.completedDates || []).includes(todayStr);
            appliesToTomorrow = (t.dayOfWeek === tomorrow.getDay()) && !(t.completedDates || []).includes(tomorrowStr);
        } else {
            appliesToToday = (t.date === todayStr) && (t.status === 'pending');
            appliesToTomorrow = (t.date === tomorrowStr) && (t.status === 'pending');
        }
        
        return appliesToToday || appliesToTomorrow;
    });
    
    const banner = document.getElementById('reminder-banner');
    const textEl = document.getElementById('reminder-text');
    
    if(alertTasks.length > 0) {
        textEl.innerHTML = `SİSTEM UYARISI: Bugün veya yarına ait tamamlanmamış ${alertTasks.length} adet yüksek öncelikli operasyon görevi bulunmaktadır!`;
        banner.classList.add('active');
    } else {
        banner.classList.remove('active');
    }
};

// Bileşik indeks hatasından kaçınmak için sıralama parametrelerini kaldırdık
onSnapshot(collection(db, "work_plans"), (snapshot) => {
    currentTasks = [];
    snapshot.forEach(doc => {
        currentTasks.push({ id: doc.id, ...doc.data() });
    });
    renderGrid();
    evaluateReminders();
}, (error) => {
    console.error("Firestore Bağlantı Hatası:", error);
});
