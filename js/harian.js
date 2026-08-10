/* ==========================================================================
    MODUL PRESENSI HARIAN & DOKUMEN KALENDER
    ========================================================================== */

function addActivityLog(msg){
  if(!state) state = {};
  if(!Array.isArray(state.activityLogs)) state.activityLogs = [];
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  state.activityLogs.unshift({ time: timeStr, msg });
  if(state.activityLogs.length > 50) state.activityLogs.pop();
  saveState();
  renderActivityLogList();
}

function renderActivityLogList(){
  const container = document.getElementById('activityLogListContainer');
  if(!container) return;
  const logs = (state && state.activityLogs) ? state.activityLogs : [];
  if(logs.length === 0){
    container.innerHTML = `<div class="empty-state" style="padding:10px; font-size:11.5px;">Belum ada riwayat aktivitas dicatat.</div>`;
    return;
  }
  container.innerHTML = logs.map(l => `
    <div style="padding:6px 8px; border-bottom:1px dashed var(--line); display:flex; justify-content:space-between; gap:8px;">
      <span style="color:var(--ink);">${escHTML(l.msg)}</span>
      <span style="color:var(--muted); font-size:10px; white-space:nowrap;">${escHTML(l.time)}</span>
    </div>
  `).join('');
}

function clearActivityLog(){
  if(state) state.activityLogs = [];
  saveState();
  renderActivityLogList();
  showStatus('Log aktivitas dibersihkan');
}

function updateBottomNavActive(viewId){
  const navMap = {
    'viewDashboard': 'navItemDashboard',
    'viewHarian': 'navItemHarian',
    'viewRekap': 'navItemRekap',
    'viewPenilaian': 'navItemPenilaian',
    'viewConfig': 'navItemConfig'
  };
  document.querySelectorAll('.android-bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
  const activeNavId = navMap[viewId] || 'navItemDashboard';
  const activeEl = document.getElementById(activeNavId);
  if(activeEl) activeEl.classList.add('active');
}

function openModule(viewId, isBackAction = false){
  closeAllModals();
  document.querySelectorAll('.view-screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(viewId);
  if(target) target.classList.add('active');
  if(state){
    state.lastActiveView = viewId;
    localStorage.setItem('absensi_last_view', viewId);
    saveState();
  }
  if(!isBackAction){
    history.pushState({ view: viewId }, '', '#' + viewId);
  }
  updateBottomNavActive(viewId);
  if(viewId === 'viewHarian'){
    const now = new Date();
    const realBulanNama = MONTHS_ID[now.getMonth()];
    const realTahunNum = now.getFullYear();
    state.meta.bulan = realBulanNama;
    state.meta.tahun = realTahunNum;
    const elBulanMeta = document.getElementById('mBulan');
    const elTahunMeta = document.getElementById('mTahun');
    if(elBulanMeta) elBulanMeta.value = realBulanNama;
    if(elTahunMeta) elTahunMeta.value = realTahunNum;
    renderCalendar();
  }
  if(viewId === 'viewDashboard') renderTodayWidget();
  if(viewId === 'viewRekap') renderMonthlyMatrix();
  if(viewId === 'viewSiswa') renderStudentsList();
  if(viewId === 'viewConfig') renderActivityLogList();
  if(viewId === 'viewPenilaian') renderPenilaianMatrix();
  if(viewId === 'viewSoalUjian') renderSoalUjianUI();
}

function showDashboard(isBackAction = false){
  closeAllModals();
  document.querySelectorAll('.view-screen').forEach(el => el.classList.remove('active'));
  const dash = document.getElementById('viewDashboard');
  if(dash) dash.classList.add('active');
  if(state){
    state.lastActiveView = 'viewDashboard';
    localStorage.setItem('absensi_last_view', 'viewDashboard');
    saveState();
  }
  if(!isBackAction){
    history.pushState({ view: 'viewDashboard' }, '', '#dashboard');
  }
  updateBottomNavActive('viewDashboard');
  renderTodayWidget();
}

/* HELPER TANGGAL LOKAL PRESISI (SESUAI ZONA WAKTU HP) */
function getLocalTodayISO(){
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* LOGIKA HEADER DINAMIS & JAM REAL-TIME */
function renderTodayWidget(){
  const widgetEl = document.getElementById('todaySummaryWidget');
  if(!widgetEl) return;
  const now = new Date();
  const todayISO = getLocalTodayISO();
  const daysList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayNameToday = daysList[now.getDay()];
  const dateFormatted = `${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
  const todayAttendance = (state.attendance && state.attendance[todayISO]) ? state.attendance[todayISO] : {};
  let countH = 0, countS = 0, countI = 0, countA = 0;
  const allStudents = state.students || [];
  allStudents.forEach(st => {
    const rec = todayAttendance[st.id];
    if(rec && rec.status === 'H') countH++;
    else if(rec && rec.status === 'S') countS++;
    else if(rec && rec.status === 'I') countI++;
    else if(rec && rec.status === 'A') countA++;
  });
  widgetEl.className = 'today-widget-card clickable-card';
  widgetEl.setAttribute('onclick', 'openTodayDetailModal()');
  widgetEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:20px;">📅</span>
        <div>
          <div style="font-size:13.5px; font-weight:800; color:var(--accent-dark);">Ringkasan Hari Ini</div>
          <div style="font-size:11px; color:var(--muted);">${dayNameToday}, ${dateFormatted}</div>
        </div>
      </div>
      <span style="font-size:13px; font-weight:bold; color:var(--accent-dark); background:var(--accent-light); width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;">➔</span>
    </div>
    <div class="today-stat-grid" style="margin-top:10px;">
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--accent);">${countH}</div><div class="today-stat-lbl">Hadir</div></div>
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--amber);">${countS}</div><div class="today-stat-lbl">Sakit</div></div>
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--info);">${countI}</div><div class="today-stat-lbl">Izin</div></div>
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--danger);">${countA}</div><div class="today-stat-lbl">Alfa</div></div>
    </div>
  `;
}

function openTodayDetailModal(){
  const now = new Date();
  const todayISO = getLocalTodayISO();
  const daysList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayNameToday = daysList[now.getDay()];
  const dateFormatted = `${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById('todayDetailModalTitle').textContent = `Ringkasan ${dayNameToday}, ${dateFormatted}`;
  const todayAttendance = (state.attendance && state.attendance[todayISO]) ? state.attendance[todayISO] : {};
  let countH = 0, countS = 0, countI = 0, countA = 0;
  const allStudents = state.students || [];
  allStudents.forEach(st => {
    const rec = todayAttendance[st.id];
    if(rec && rec.status === 'H') countH++;
    else if(rec && rec.status === 'S') countS++;
    else if(rec && rec.status === 'I') countI++;
    else if(rec && rec.status === 'A') countA++;
  });
  const statGrid = document.getElementById('todayDetailStatGrid');
  if(statGrid){
    statGrid.innerHTML = `
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--accent);">${countH}</div><div class="today-stat-lbl">Hadir</div></div>
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--amber);">${countS}</div><div class="today-stat-lbl">Sakit</div></div>
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--info);">${countI}</div><div class="today-stat-lbl">Izin</div></div>
      <div class="today-stat-item"><div class="today-stat-num" style="color:var(--danger);">${countA}</div><div class="today-stat-lbl">Alfa</div></div>
    `;
  }
  const todayJadwal = (state.jadwal || []).filter(j => j.hari === dayNameToday);
  const jadwalEl = document.getElementById('todayDetailJadwalContent');
  if(jadwalEl){
    if(todayJadwal.length > 0){
      jadwalEl.innerHTML = todayJadwal.map(j => `
        <div style="padding:4px 0; border-bottom:1px dashed var(--line);">
          <b>${escHTML(j.kelas)}</b>: ${escHTML(j.mapel)} (${escHTML(j.waktu)}) | Ruang: ${escHTML(j.ruang || '-')}
        </div>
      `).join('');
    } else {
      jadwalEl.innerHTML = `<i>Tidak ada jadwal mengajar tercatat untuk hari ${dayNameToday}.</i>`;
    }
  }
  const absentListEl = document.getElementById('todayDetailAbsentListContent');
  if(absentListEl){
    const nonHadir = [];
    allStudents.forEach(st => {
      const rec = todayAttendance[st.id];
      if(rec && (rec.status === 'S' || rec.status === 'I' || rec.status === 'A')){
        const stLabel = rec.status === 'S' ? '😷 Sakit' : (rec.status === 'I' ? '✉️ Izin' : '❌ Alfa');
        const noteStr = rec.note ? ` (${rec.note.trim()})` : '';
        nonHadir.push(`📌 <b>${escHTML(st.nama)}</b> (${escHTML(st.kelas)}) - ${stLabel}${escHTML(noteStr)}`);
      }
    });
    if(nonHadir.length > 0){
      absentListEl.innerHTML = nonHadir.join('<br>');
    } else {
      absentListEl.innerHTML = `<i>Nihil (Seluruh siswa yang diabsen hari ini berstatus HADIR).</i>`;
    }
  }
  openModal('modalTodaySummaryDetail');
}

function sendTodayWaReport(){
  const now = new Date();
  const todayISO = getLocalTodayISO();
  const daysList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayNameToday = daysList[now.getDay()];
  const dateFormatted = `${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;
  const todayAttendance = (state.attendance && state.attendance[todayISO]) ? state.attendance[todayISO] : {};
  let countH = 0, countS = 0, countI = 0, countA = 0;
  const nonHadirWA = [];
  const allStudents = state.students || [];
  allStudents.forEach(st => {
    const rec = todayAttendance[st.id];
    if(rec && rec.status === 'H') countH++;
    else if(rec && rec.status === 'S'){ countS++; nonHadirWA.push(`  *Sakit*: ${st.nama} (${st.kelas})${rec.note ? ' - ' + rec.note : ''}`); }
    else if(rec && rec.status === 'I'){ countI++; nonHadirWA.push(`  *Izin*: ${st.nama} (${st.kelas})${rec.note ? ' - ' + rec.note : ''}`); }
    else if(rec && rec.status === 'A'){ countA++; nonHadirWA.push(`  *Alfa*: ${st.nama} (${st.kelas})${rec.note ? ' - ' + rec.note : ''}`); }
  });
  const m = state.meta || {};
  let waText = `*LAPORAN PRESENSI HARI INI*\n`;
  if(m.sekolah) waText += `🏫 Sekolah: ${m.sekolah}\n`;
  waText += `📅 Hari/Tgl: ${dayNameToday}, ${dateFormatted}\n\n`;
  waText += `📊 *RINGKASAN PRESENSI:*\n`;
  waText += `✅ Total Hadir (H): ${countH}\n`;
  waText += `😷 Sakit (S): ${countS}\n`;
  waText += `✉️ Izin (I): ${countI}\n`;
  waText += `❌ Alfa (A): ${countA}\n\n`;
  waText += `📝 *KETERANGAN SISWA TIDAK HADIR:*\n`;
  if(nonHadirWA.length > 0){
    waText += nonHadirWA.join('\n') + `\n`;
  } else {
    waText += `_Nihil (Seluruh siswa hadir lengkap)_\n`;
  }
  waText += `\n_Laporan dikirim otomatis via Aplikasi Absensi Guru._`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
  window.open(waUrl, '_blank');
  showStatus('Membuka WhatsApp...');
}

function openTodayAttendanceFromModal(){
  closeModal('modalTodaySummaryDetail');
  const todayISO = getLocalTodayISO();
  openSelectClassModal(todayISO);
}

/* Helpers */
function updateDashboardCalendarIcon(){
  const now = new Date();
  const monthShort = SHORT_MONTHS_ID[now.getMonth()];
  const dayNum = now.getDate();
  const elMonth = document.getElementById('dashIconMonth');
  const elDay = document.getElementById('dashIconDay');
  if(elMonth) elMonth.textContent = monthShort;
  if(elDay) elDay.textContent = dayNum;
}

function renderJadwalUI(){
  const tabsContainer = document.getElementById('jadwalDayTabsContainer');
  const contentContainer = document.getElementById('jadwalContentContainer');
  if(!tabsContainer || !contentContainer) return;
  const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const now = new Date();
  const todayJsIdx = now.getDay();
  const todayDayName = (todayJsIdx >= 1 && todayJsIdx <= 6) ? daysList[todayJsIdx - 1] : 'Senin';
  if(!activeJadwalTabDay) activeJadwalTabDay = todayDayName;
  tabsContainer.innerHTML = daysList.map(h => {
    const isToday = (h === todayDayName);
    const isActive = (h === activeJadwalTabDay);
    let cls = 'jadwal-day-btn';
    if(isActive) cls += ' active';
    if(isToday) cls += ' is-today-badge';
    return `<button type="button" class="${cls}" onclick="switchJadwalTab('${h}')">${h}${isToday ? ' (Hari Ini)' : ''}</button>`;
  }).join('');
  const filteredJadwal = (state.jadwal || []).filter(j => j.hari === activeJadwalTabDay);
  if(filteredJadwal.length === 0){
    contentContainer.innerHTML = `<div class="empty-state" style="padding:12px; margin-top:6px; font-size:12px;">Belum ada jadwal mengajar di hari <b>${activeJadwalTabDay}</b>. Klik <b>Kelola Jadwal</b> untuk memasukkan jadwal.</div>`;
    return;
  }
  let tableHTML = `
    <table class="jadwal-table">
      <thead>
        <tr>
          <th style="width:50px;">Jam</th>
          <th style="width:85px;">Waktu</th>
          <th style="width:65px;">Kelas</th>
          <th>Mata Pelajaran</th>
          <th>Ruang/Ket</th>
        </tr>
      </thead>
      <tbody>
  `;
  filteredJadwal.forEach(j => {
    tableHTML += `
      <tr>
        <td style="font-weight:700; text-align:center;">${escHTML(j.jamKe || '-')}</td>
        <td style="font-size:10.5px; white-space:nowrap;">${escHTML(j.waktu || '-')}</td>
        <td style="font-weight:700; color:var(--accent-dark);">${escHTML(j.kelas || '-')}</td>
        <td style="font-weight:700;">${escHTML(j.mapel || '-')}</td>
        <td style="color:var(--muted); font-size:11px;">${escHTML(j.ruang || '-')}</td>
      </tr>
    `;
  });
  tableHTML += `</tbody></table>`;
  contentContainer.innerHTML = tableHTML;
}

function switchJadwalTab(dayName){
  activeJadwalTabDay = dayName;
  renderJadwalUI();
}

function openManageJadwalModal(){
  const editIdEl = document.getElementById('editingJadwalId');
  if(editIdEl) editIdEl.value = '';
  
  const mapelSelect = document.getElementById('jMapelSelect');
  if(mapelSelect){
    mapelSelect.innerHTML = (state.subjectList || []).map(s => `<option value="${escAttr(s)}">${escHTML(s)}</option>`).join('');
  }
  
  const btnSave = document.getElementById('btnSaveJadwal');
  if(btnSave) btnSave.textContent = '+ Tambah Ke Jadwal Hari Ini';
  
  document.getElementById('jJamKe').value = '';
  document.getElementById('jWaktu').value = '';
  document.getElementById('jRuang').value = '';
  
  renderJadwalManageList();
  openModal('modalManageJadwal');
}

function renderJadwalManageList(){
  const container = document.getElementById('jadwalManageListContainer');
  if(!container) return;
  const list = state.jadwal || [];
  if(list.length === 0){
    container.innerHTML = `<div class="empty-state" style="padding:10px; font-size:12px;">Belum ada jadwal tersimpan.</div>`;
    return;
  }
  container.innerHTML = list.map(j => `
    <div class="col-manager-item">
      <div class="col-info">
        <span style="font-size:11px; font-weight:800; background:var(--accent-dark); color:#fff; padding:2px 5px; border-radius:4px;">${escHTML(j.hari)}</span>
        <div style="margin-left:4px;">
          <div style="font-size:12px; font-weight:700; color:var(--ink);">${escHTML(j.mapel)} (${escHTML(j.kelas)})</div>
          <div style="font-size:10.5px; color:var(--muted);">Jam: ${escHTML(j.jamKe)} | ${escHTML(j.waktu)} | Ruang: ${escHTML(j.ruang || '-')}</div>
        </div>
      </div>
      <div style="display:flex; gap:4px;">
        <button type="button" class="btn-move" style="border-color:var(--accent); color:var(--accent-dark);" onclick="editJadwalItem('${j.id}')">Edit</button>
        <button type="button" class="btn-move" style="border-color:#e6c9c0; color:var(--danger);" onclick="deleteJadwalItem('${j.id}')">Hapus</button>
      </div>
    </div>
  `).join('');
}

function editJadwalItem(id){
  const j = (state.jadwal || []).find(x => x.id === id);
  if(!j) return;
  
  const editIdEl = document.getElementById('editingJadwalId');
  if(editIdEl) editIdEl.value = id;
  
  const mapelSelect = document.getElementById('jMapelSelect');
  if(mapelSelect){
    mapelSelect.innerHTML = (state.subjectList || []).map(s => `<option value="${escAttr(s)}">${escHTML(s)}</option>`).join('');
    mapelSelect.value = j.mapel || (state.subjectList[0] || '');
  }
  
  const hariSelect = document.getElementById('jHariSelect');
  if(hariSelect) hariSelect.value = j.hari || 'Senin';
  
  const kelasSelect = document.getElementById('jKelasSelect');
  if(kelasSelect) kelasSelect.value = j.kelas || 'Kelas 4';
  
  const jamKeEl = document.getElementById('jJamKe');
  if(jamKeEl) jamKeEl.value = j.jamKe || '';
  
  const waktuEl = document.getElementById('jWaktu');
  if(waktuEl) waktuEl.value = j.waktu || '';
  
  const ruangEl = document.getElementById('jRuang');
  if(ruangEl) ruangEl.value = j.ruang || '';
  
  const btnSave = document.getElementById('btnSaveJadwal');
  if(btnSave) btnSave.textContent = '💾 Simpan Perubahan Jadwal';
}

function addJadwalItem(){
  const editId = document.getElementById('editingJadwalId')?.value || '';
  const hari = document.getElementById('jHariSelect')?.value || 'Senin';
  const jamKe = document.getElementById('jJamKe')?.value.trim();
  const waktu = document.getElementById('jWaktu')?.value.trim();
  const kelas = document.getElementById('jKelasSelect')?.value || 'Kelas 4';
  const mapelSelect = document.getElementById('jMapelSelect');
  const mapel = mapelSelect ? mapelSelect.value : '';
  const ruang = document.getElementById('jRuang')?.value.trim();
  
  if(!mapel){ showStatus('Pilih mata pelajaran terlebih dahulu!'); return; }
  if(!state.jadwal) state.jadwal = [];
  
  if(editId){
    const idx = state.jadwal.findIndex(x => x.id === editId);
    if(idx !== -1){
      state.jadwal[idx] = {
        id: editId,
        hari,
        jamKe: jamKe || '1',
        waktu: waktu || '-',
        kelas,
        mapel,
        ruang: ruang || '-'
      };
      showStatus(`Jadwal ${mapel} (${kelas}) berhasil diperbarui`);
    }
  } else {
    state.jadwal.push({
      id: uid(),
      hari,
      jamKe: jamKe || '1',
      waktu: waktu || '-',
      kelas,
      mapel,
      ruang: ruang || '-'
    });
    showStatus(`Jadwal ${mapel} (${kelas}) berhasil ditambahkan`);
  }
  
  const editIdEl = document.getElementById('editingJadwalId');
  if(editIdEl) editIdEl.value = '';
  document.getElementById('jJamKe').value = '';
  document.getElementById('jWaktu').value = '';
  document.getElementById('jRuang').value = '';
  
  const btnSave = document.getElementById('btnSaveJadwal');
  if(btnSave) btnSave.textContent = '+ Tambah Ke Jadwal Hari Ini';
  
  saveState();
  renderJadwalManageList();
  renderJadwalUI();
}

function deleteJadwalItem(id){
  state.jadwal = (state.jadwal || []).filter(j => j.id !== id);
  saveState();
  renderJadwalManageList();
  renderJadwalUI();
  showStatus('Jadwal dihapus');
}

function buildMonthGridHTML(tahunNum, monthIdx){
  const firstDayJs = new Date(tahunNum, monthIdx, 1).getDay();
  const firstDayMon = (firstDayJs + 6) % 7;
  const totalDays = new Date(tahunNum, monthIdx + 1, 0).getDate();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  let html = '';
  for(let i = 0; i < firstDayMon; i++){
    html += `<div class="day-cell other-month"></div>`;
  }
  const validStudentIds = new Set((state.students || []).map(s => s.id));
  for(let day = 1; day <= totalDays; day++){
    const dayStr = String(day).padStart(2,'0');
    const monthStr = String(monthIdx + 1).padStart(2,'0');
    const dateISO = `${tahunNum}-${monthStr}-${dayStr}`;
    const dayOfWeekJs = new Date(tahunNum, monthIdx, day).getDay();
    let isWeekendClass = (dayOfWeekJs === 0 || dayOfWeekJs === 6) ? 'is-weekend' : '';
    const isToday = (tahunNum === todayYear && monthIdx === todayMonth && day === todayDay);
    let todayClass = isToday ? ' is-today' : '';
    const dayStatus = getResolvedDayStatus(dateISO);
    let cellClass = 'day-cell ' + isWeekendClass + todayClass;
    if(dayStatus && dayStatus.status === 'libur'){
      cellClass += ' is-libur';
    }
    let badgeHTML = '';
    const dayAttendanceObj = (state && state.attendance) ? state.attendance[dateISO] : null;
    
    if(dayAttendanceObj && Object.keys(dayAttendanceObj).length > 0){
      let countRec = Object.keys(dayAttendanceObj).filter(stId => validStudentIds.has(stId) && dayAttendanceObj[stId].status !== '').length;
      if(countRec > 0){
        badgeHTML = `<div class="day-badge">${countRec} Absen</div>`;
        cellClass += ' has-data';
      }
    }
    let liburHTML = '';
    if(dayStatus && dayStatus.status === 'libur'){
      liburHTML = `<div class="day-libur-label">${escHTML(dayStatus.ket || 'Libur')}</div>`;
    }
    html += `
      <div class="${cellClass}" data-date="${dateISO}">
        <span class="day-num">${day}</span>
        ${badgeHTML}
        ${liburHTML}
      </div>
    `;
  }
  return html;
}

function renderCalendarUI(){
  const calHeader = document.getElementById('calendarHeader');
  const prevGrid = document.getElementById('prevMonthDays');
  const currGrid = document.getElementById('currentMonthDays');
  const nextGrid = document.getElementById('nextMonthDays');
  if(!calHeader || !prevGrid || !currGrid || !nextGrid) return;
  if(!state) state = {};
  if(!Array.isArray(state.students)) state.students = [];
  if(!state.attendance) state.attendance = {};
  if(!state.dayStatuses) state.dayStatuses = {};
  if(!state.meta) state.meta = {};
  const selectBulan = document.getElementById('mBulan');
  const inputTahun = document.getElementById('mTahun');
  const bulanNama = (selectBulan && selectBulan.value) ? selectBulan.value : (state.meta.bulan || 'Januari');
  const tahunNum = (inputTahun && inputTahun.value) ? parseInt(inputTahun.value) : (parseInt(state.meta.tahun) || new Date().getFullYear());
  state.meta.bulan = bulanNama;
  state.meta.tahun = tahunNum;
  const monthIdx = MONTHS_ID.indexOf(bulanNama);
  if(monthIdx === -1) return;
  calHeader.textContent = `${bulanNama} ${tahunNum}`;
  let prevMonthIdx = monthIdx - 1;
  let prevTahunNum = tahunNum;
  if(prevMonthIdx < 0){ prevMonthIdx = 11; prevTahunNum -= 1; }
  let nextMonthIdx = monthIdx + 1;
  let nextTahunNum = tahunNum;
  if(nextMonthIdx > 11){ nextMonthIdx = 0; nextTahunNum += 1; }
  prevGrid.innerHTML = buildMonthGridHTML(prevTahunNum, prevMonthIdx);
  currGrid.innerHTML = buildMonthGridHTML(tahunNum, monthIdx);
  nextGrid.innerHTML = buildMonthGridHTML(nextTahunNum, nextMonthIdx);
  currGrid.querySelectorAll('.day-cell[data-date]').forEach(cell => {
    attachDayEvents(cell, cell.dataset.date);
  });
  const totalDays = new Date(tahunNum, monthIdx + 1, 0).getDate();
  const calendarHolidays = [];
  for(let d = 1; d <= totalDays; d++){
    const dayStr = String(d).padStart(2,'0');
    const monthStr = String(monthIdx + 1).padStart(2,'0');
    const dateISO = `${tahunNum}-${monthStr}-${dayStr}`;
    const dayStatus = getResolvedDayStatus(dateISO);
    const isHoliday = dayStatus && dayStatus.status === 'libur';
    const hasCustomNote = dayStatus && dayStatus.ket && dayStatus.ket.trim() !== '';
    if(isHoliday && hasCustomNote){
      calendarHolidays.push({ day: d, dateISO: dateISO, ket: dayStatus.ket.trim() });
    }
  }
  const groupedCalHolidays = groupConsecutiveHolidays(calendarHolidays, bulanNama, tahunNum);
  const calLegendBox = document.getElementById('calendarHolidayLegend');
  const calLegendList = document.getElementById('calendarHolidayList');
  if(calLegendBox && calLegendList){
    if(groupedCalHolidays.length > 0){
      calLegendList.innerHTML = `<div style="display:grid; grid-template-columns: max-content auto 1fr; gap:3px 6px; align-items:start;">` +
        groupedCalHolidays.map(h => `
          <div style="font-weight:700; white-space:nowrap;">📌 ${h.rangeStr}</div>
          <div style="font-weight:700;">:</div>
          <div>${escHTML(h.ket)}</div>
        `).join('') +
        `</div>`;
      calLegendBox.style.display = 'block';
    } else {
      calLegendBox.style.display = 'none';
    }
  }
}

function renderCalendar(){
  renderCalendarUI();
  attachCalendarSwipe();
}

function attachCalendarSwipe(){
  const trackWrapper = document.querySelector('.calendar-track-wrapper');
  const track = document.getElementById('calendarTrack');
  if(!trackWrapper || !track || trackWrapper.dataset.swipeAttached) return;
  trackWrapper.dataset.swipeAttached = 'true';
  let startX = 0, startY = 0, currentDiffX = 0, isDragging = false;
  const baseOffsetPct = -33.333333;
  trackWrapper.addEventListener('touchstart', (e) => {
    if(isMonthSliding || e.touches.length !== 1) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    currentDiffX = 0; isDragging = true;
    track.style.transition = 'none';
  }, { passive: true });
  trackWrapper.addEventListener('touchmove', (e) => {
    if(!isDragging || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX;
    const diffY = currentY - startY;
    if(Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8){
      currentDiffX = diffX;
      const wrapperW = trackWrapper.clientWidth || 300;
      const pxToPct = (diffX / wrapperW) * 33.333333;
      track.style.transform = `translateX(${baseOffsetPct + pxToPct}%)`;
    }
  }, { passive: true });
  trackWrapper.addEventListener('touchend', () => {
    if(!isDragging) return;
    isDragging = false;
    const threshold = 65;
    track.style.transition = 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
    if(currentDiffX < -threshold){
      track.style.transform = 'translateX(-66.666666%)';
      setTimeout(() => { changeMonthStep(1); }, 280);
    } else if(currentDiffX > threshold){
      track.style.transform = 'translateX(0%)';
      setTimeout(() => { changeMonthStep(-1); }, 280);
    } else {
      track.style.transform = `translateX(${baseOffsetPct}%)`;
    }
  }, { passive: true });
}

function changeMonthStep(delta){
  isMonthSliding = true;
  const bulanNama = state.meta.bulan || 'Januari';
  let tahunNum = parseInt(state.meta.tahun) || new Date().getFullYear();
  let monthIdx = MONTHS_ID.indexOf(bulanNama);
  if(monthIdx === -1) monthIdx = 0;
  monthIdx += delta;
  if(monthIdx > 11){ monthIdx = 0; tahunNum += 1; }
  else if(monthIdx < 0){ monthIdx = 11; tahunNum -= 1; }
  const nextBulanNama = MONTHS_ID[monthIdx];
  state.meta.bulan = nextBulanNama;
  state.meta.tahun = tahunNum;
  const elBulan = document.getElementById('mBulan');
  const elTahun = document.getElementById('mTahun');
  if(elBulan) elBulan.value = nextBulanNama;
  if(elTahun) elTahun.value = tahunNum;
  saveState();
  renderCalendarUI();
  const track = document.getElementById('calendarTrack');
  if(track){
    track.style.transition = 'none';
    track.style.transform = 'translateX(-33.333333%)';
  }
  setTimeout(() => { isMonthSliding = false; }, 80);
}

/* PENDEKTETSI GESTUR DOUBLE TAP BEBAS COPY-PASTE */
let lastTapTimeMap = {};
let doubleTapTimerMap = {};

function attachDayEvents(el, dateStr){
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
  
  el.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = new Date().getTime();
    const lastTap = lastTapTimeMap[dateStr] || 0;
    const tapInterval = now - lastTap;
    
    if (tapInterval < 300 && tapInterval > 0) {
      if (doubleTapTimerMap[dateStr]) {
        clearTimeout(doubleTapTimerMap[dateStr]);
        doubleTapTimerMap[dateStr] = null;
      }
      openDayStatusModal(dateStr);
    } else {
      doubleTapTimerMap[dateStr] = setTimeout(() => {
        openSelectClassModal(dateStr);
      }, 250);
    }
    lastTapTimeMap[dateStr] = now;
  });
}

function openSelectClassModal(dateStr){
  activeClickedDate = dateStr;
  document.getElementById('selectClassModalTitle').textContent = `Pilih Kelas (${formatDateID(dateStr)})`;
  openModal('modalSelectClass');
}

function openDayStatusFromSelectClassModal(){
  closeModal('modalSelectClass');
  openDayStatusModal(activeClickedDate);
}

function selectClassForAttendance(className){
  closeModal('modalSelectClass');
  activeModalClass = className;
  document.getElementById('classAttendanceModalTitle').textContent = `Absensi ${className} (${formatDateID(activeClickedDate)})`;
  const searchInput = document.getElementById('modalSearchStudentInput');
  if(searchInput) searchInput.value = '';
  tempModalAttendance = {};
  renderModalStudentsAttendance();
  openModal('modalClassAttendance');
}

function renderModalStudentsAttendance(){
  const container = document.getElementById('modalStudentsListContainer');
  const summaryTxt = document.getElementById('modalSummaryText');
  const query = document.getElementById('modalSearchStudentInput')?.value.trim().toLowerCase() || '';
  if(!container) return;
  const classStudents = getSortedStudents(activeModalClass);
  if(classStudents.length === 0){
    container.innerHTML = `<div class="empty-state">Belum ada murid di <b>${activeModalClass}</b>.<br>Buka menu <b>Data Siswa</b> untuk memasukkan daftar nama siswa kelas ini.</div>`;
    if(summaryTxt) summaryTxt.textContent = `${activeModalClass} (0): 0 H, 0 S, 0 I, 0 A`;
    return;
  }
  const existingDayData = state.attendance[activeClickedDate] || {};
  classStudents.forEach(st => {
    if(!tempModalAttendance[st.id]){
      const stRecord = existingDayData[st.id] || { status: '', note: '' };
      tempModalAttendance[st.id] = { status: stRecord.status || '', note: stRecord.note || '' };
    }
  });
  const filteredList = classStudents.filter(st => {
    return (st.nama || '').toLowerCase().includes(query) || (st.nis || '').toLowerCase().includes(query);
  });
  container.innerHTML = '';
  let countH = 0, countS = 0, countI = 0, countA = 0;
  classStudents.forEach(st => {
    const status = tempModalAttendance[st.id]?.status || '';
    if(status === 'H') countH++;
    else if(status === 'S') countS++;
    else if(status === 'I') countI++;
    else if(status === 'A') countA++;
  });
  if(filteredList.length === 0){
    container.innerHTML = `<div class="empty-state">Tidak ada siswa yang cocok dengan pencarian "<b>${escHTML(query)}</b>".</div>`;
  } else {
    filteredList.forEach((st) => {
      const origIdx = classStudents.findIndex(s => s.id === st.id);
      const status = tempModalAttendance[st.id]?.status || '';
      const note = tempModalAttendance[st.id]?.note || '';
      const card = document.createElement('div');
      card.className = 'attendance-card';
      card.id = 'modalStCard_' + st.id;
      const displayJk = st.jk ? `Gender: ${st.jk}` : '';
      const displayNis = st.nis ? `NISN: ${escHTML(st.nis)}` : '';
      const subText = [displayNis, displayJk].filter(Boolean).join(' | ');
      card.innerHTML = `
        <div class="student-info">
          <div>
            <span class="student-name">${origIdx + 1}. ${escHTML(st.nama)}</span>
            <div class="student-sub">${subText}</div>
          </div>
        </div>
        <div class="status-pill-group">
          <button type="button" class="btn-pill ${status==='H'?'active-h':''}" onclick="setModalPillStatus('${st.id}', 'H')">H</button>
          <button type="button" class="btn-pill ${status==='S'?'active-s':''}" onclick="setModalPillStatus('${st.id}', 'S')">S</button>
          <button type="button" class="btn-pill ${status==='I'?'active-i':''}" onclick="setModalPillStatus('${st.id}', 'I')">I</button>
          <button type="button" class="btn-pill ${status==='A'?'active-a':''}" onclick="setModalPillStatus('${st.id}', 'A')">A</button>
          <button type="button" class="btn-pill ${status===''?'active-empty':''}" onclick="setModalPillStatus('${st.id}', '')">Kosong</button>
        </div>
        <input type="text" class="st-note-input" placeholder="Catatan/Alasan Sakit/Izin (Opsional)..." value="${escAttr(note)}" oninput="setModalNote('${st.id}', this.value)">
      `;
      container.appendChild(card);
    });
  }
  if(summaryTxt){
    summaryTxt.textContent = `${activeModalClass} (${classStudents.length}): ${countH} H, ${countS} S, ${countI} I, ${countA} A`;
  }
}

function setModalNote(studentId, noteVal){
  if(tempModalAttendance[studentId]){
    tempModalAttendance[studentId].note = noteVal;
  }
}

function setModalPillStatus(studentId, statusVal){
  if(tempModalAttendance[studentId]){
    tempModalAttendance[studentId].status = statusVal;
  }
  const card = document.getElementById('modalStCard_' + studentId);
  if(card){
    const pills = card.querySelectorAll('.btn-pill');
    pills[0].className = `btn-pill ${statusVal==='H'?'active-h':''}`;
    pills[1].className = `btn-pill ${statusVal==='S'?'active-s':''}`;
    pills[2].className = `btn-pill ${statusVal==='I'?'active-i':''}`;
    pills[3].className = `btn-pill ${statusVal==='A'?'active-a':''}`;
    pills[4].className = `btn-pill ${statusVal===''?'active-empty':''}`;
  }
  let countH = 0, countS = 0, countI = 0, countA = 0;
  const classStudents = getSortedStudents(activeModalClass);
  classStudents.forEach(st => {
    const stVal = tempModalAttendance[st.id] ? tempModalAttendance[st.id].status : '';
    if(stVal === 'H') countH++;
    else if(stVal === 'S') countS++;
    else if(stVal === 'I') countI++;
    else if(stVal === 'A') countA++;
  });
  const summaryTxt = document.getElementById('modalSummaryText');
  if(summaryTxt){
    summaryTxt.textContent = `${activeModalClass} (${classStudents.length}): ${countH} H, ${countS} S, ${countI} I, ${countA} A`;
  }
}

function markAllModalPresent(){
  Object.keys(tempModalAttendance).forEach(stId => {
    if(!tempModalAttendance[stId]) tempModalAttendance[stId] = {};
    tempModalAttendance[stId].status = 'H';
  });
  renderModalStudentsAttendance();
  showStatus('Seluruh siswa diset HADIR');
}

function clearAllModalAttendance(){
  Object.keys(tempModalAttendance).forEach(stId => {
    if(!tempModalAttendance[stId]) tempModalAttendance[stId] = {};
    tempModalAttendance[stId].status = '';
    tempModalAttendance[stId].note = '';
  });
  renderModalStudentsAttendance();
  showStatus('Seluruh absensi diset KOSONG');
}

function sendWaReport(){
  const classStudents = getSortedStudents(activeModalClass);
  if(classStudents.length === 0){ showStatus('Belum ada siswa!'); return; }
  let countH = 0, countS = 0, countI = 0, countA = 0, countEmpty = 0;
  const listTidakHadir = [];
  classStudents.forEach(stObj => {
    const rec = tempModalAttendance[stObj.id] || { status: '', note: '' };
    const statusVal = rec.status;
    const noteStr = rec.note ? ` (${rec.note.trim()})` : '';
    if(statusVal === 'H') countH++;
    else if(statusVal === 'S'){ countS++; listTidakHadir.push(`  *Sakit*: ${stObj.nama}${noteStr}`); }
    else if(statusVal === 'I'){ countI++; listTidakHadir.push(`  *Izin*: ${stObj.nama}${noteStr}`); }
    else if(statusVal === 'A'){ countA++; listTidakHadir.push(`  *Alfa*: ${stObj.nama}${noteStr}`); }
    else countEmpty++;
  });
  const tglFormatted = formatDateID(activeClickedDate);
  const m = state.meta || {};
  let waText = `*LAPORAN PRESENSI HARIAN SISWA*\n`;
  if(m.sekolah) waText += `🏫 Sekolah: ${m.sekolah}\n`;
  waText += `📌 Kelas: ${activeModalClass}\n`;
  waText += `📅 Tanggal: ${tglFormatted}\n\n`;
  waText += `📊 *RINGKASAN KEHADIRAN:*\n`;
  waText += `👥 Total Siswa: ${classStudents.length}\n`;
  waText += `✅ Hadir (H): ${countH}\n`;
  waText += `😷 Sakit (S): ${countS}\n`;
  waText += `✉️ Izin (I): ${countI}\n`;
  waText += `❌ Alfa (A): ${countA}\n`;
  if(countEmpty > 0) waText += `⚠️ Belum Diabsen: ${countEmpty}\n`;
  waText += `\n📝 *SISWA TIDAK HADIR / KETERANGAN:*\n`;
  if(listTidakHadir.length > 0){
    waText += listTidakHadir.join('\n') + `\n`;
  } else {
    waText += `_Nihil (Seluruh siswa hadir lengkap)_\n`;
  }
  waText += `\n_Laporan dibuat otomatis via Aplikasi Absensi Siswa._`;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
  window.open(waUrl, '_blank');
  showStatus('Membuka aplikasi WhatsApp...');
}

function saveClassAttendanceModal(){
  if(!state.attendance[activeClickedDate]){
    state.attendance[activeClickedDate] = {};
  }
  Object.entries(tempModalAttendance).forEach(([stId, data]) => {
    state.attendance[activeClickedDate][stId] = data;
  });
  saveState();
  renderCalendar();
  renderTodayWidget();
  closeModal('modalClassAttendance');
  addActivityLog(`Menyimpan presensi ${activeModalClass} (${formatDateID(activeClickedDate)})`);
  showStatus(`Presensi ${activeModalClass} berhasil disimpan`);
}

function openDayStatusModal(dateStr){
  activeClickedDate = dateStr;
  document.getElementById('modalStatusTitle').textContent = `Edit Status: ${formatDateID(dateStr)}`;
  const statusData = getResolvedDayStatus(dateStr) || { status: 'efektif', ket: '' };
  document.getElementById('statusHariSelect').value = statusData.status || 'efektif';
  document.getElementById('liburNoteInput').value = statusData.ket || '';
  toggleLiburNoteField();
  openModal('modalStatusHari');
}

function toggleLiburNoteField(){
  const selectVal = document.getElementById('statusHariSelect').value;
  document.getElementById('liburNoteField').style.display = (selectVal === 'libur') ? 'block' : 'none';
}

function saveDayStatus(){
  if(!activeClickedDate) return;
  const statusVal = document.getElementById('statusHariSelect').value;
  const noteVal = document.getElementById('liburNoteInput').value;
  if(!state.dayStatuses) state.dayStatuses = {};
  state.dayStatuses[activeClickedDate] = { status: statusVal, ket: noteVal };
  saveState();
  renderCalendar();
  renderMonthlyMatrix();
  renderTodayWidget();
  closeModal('modalStatusHari');
  showStatus('Status tanggal disimpan');
}

function saveKaldikImportB(){
  const inputEl = document.getElementById('kaldikImportInput');
  const rawText = inputEl ? inputEl.value.trim() : '';
  state.customHolidaysText = rawText;
  state.importedHolidays = {};
  if(rawText){
    const lines = rawText.split('\n');
    let importedCount = 0;
    lines.forEach(line => {
      const parts = line.split('=').map(s => s.trim());
      if(parts.length < 2) return;
      const datePart = parts[0];
      const ketText = parts.slice(1).join('=');
      if(datePart.includes('s/d') || datePart.includes('-')){
        const range = datePart.split(/s\/d|-/).map(s => s.trim());
        if(range.length === 2 && range[0].match(/^\d{4}-\d{2}-\d{2}$/) && range[1].match(/^\d{4}-\d{2}-\d{2}$/)){
          let start = new Date(range[0] + 'T00:00:00');
          let end = new Date(range[1] + 'T00:00:00');
          while(start <= end){
            const iso = start.toISOString().slice(0, 10);
            state.importedHolidays[iso] = ketText;
            importedCount++;
            start.setDate(start.getDate() + 1);
          }
        }
      } else if(datePart.match(/^\d{4}-\d{2}-\d{2}$/)){
        state.importedHolidays[datePart] = ketText;
        importedCount++;
      }
    });
    showStatus(`Berhasil menyimpan Kalender Opsi B (${importedCount} tanggal)`);
  } else {
    showStatus('Data Opsi B dikosongkan');
  }
  saveState();
  renderCalendar();
  renderMonthlyMatrix();
}

function resetKaldikImportB(){
  showConfirmModal('Reset Opsi B', 'Kosongkan data Kalender Opsi B dan kembali murni ke Preset A (Manado)?', () => {
    state.importedHolidays = {};
    state.customHolidaysText = '';
    const inputEl = document.getElementById('kaldikImportInput');
    if(inputEl) inputEl.value = '';
    saveState();
    renderCalendar();
    renderMonthlyMatrix();
    showStatus('Kalender Bawaan Preset A Aktif');
  });
}

function openQuickEditCell(dateISO, studentId, studentName, dayNum){
  activeQuickEditDate = dateISO;
  activeQuickEditStudentId = studentId;
  document.getElementById('quickEditTitle').textContent = `Edit Absen Tanggal ${dayNum}`;
  document.getElementById('quickEditSub').textContent = studentName;
  const rec = (state.attendance[dateISO] && state.attendance[dateISO][studentId]) ? state.attendance[dateISO][studentId] : { status: '', note: '' };
  const pills = ['qBtnH', 'qBtnS', 'qBtnI', 'qBtnA', 'qBtnEmpty'];
  pills.forEach(p => document.getElementById(p).className = 'btn-pill');
  if(rec.status === 'H') document.getElementById('qBtnH').className = 'btn-pill active-h';
  else if(rec.status === 'S') document.getElementById('qBtnS').className = 'btn-pill active-s';
  else if(rec.status === 'I') document.getElementById('qBtnI').className = 'btn-pill active-i';
  else if(rec.status === 'A') document.getElementById('qBtnA').className = 'btn-pill active-a';
  else document.getElementById('qBtnEmpty').className = 'btn-pill active-empty';
  document.getElementById('quickEditNoteInput').value = rec.note || '';
  openModal('modalQuickEditCell');
}

function applyQuickStatus(statusVal){
  if(!activeQuickEditDate || !activeQuickEditStudentId) return;
  if(!state.attendance[activeQuickEditDate]){
    state.attendance[activeQuickEditDate] = {};
  }
  const noteVal = document.getElementById('quickEditNoteInput')?.value || '';
  state.attendance[activeQuickEditDate][activeQuickEditStudentId] = { status: statusVal, note: noteVal };
  saveState();
  renderMonthlyMatrix();
  renderCalendar();
  renderTodayWidget();
  closeModal('modalQuickEditCell');
  showStatus('Status absensi diperbarui');
}

function printFromHarian(){
  openExportPdfModal();
  const reportTypeSel = document.getElementById('pdfReportTypeSelect');
  if(reportTypeSel){
    reportTypeSel.value = 'bulanan';
    togglePdfReportTypeUI();
  }
  const pdfBulanSel = document.getElementById('pdfBulanSelect');
  const pdfTahunInp = document.getElementById('pdfTahunInput');
  if(pdfBulanSel && state.meta.bulan) pdfBulanSel.value = state.meta.bulan;
  if(pdfTahunInp && state.meta.tahun) pdfTahunInp.value = state.meta.tahun;
  updatePdfFileNamePreview();
}