/* ==========================================================================
   MODUL DATA SISWA & DETAIL INDIVIDUAL
   ========================================================================== */

function renderStudentsList(){
  const container = document.getElementById('studentsListContainer');
  const countTxt = document.getElementById('countStudentText');
  const activeClass = document.getElementById('manageClassSelect')?.value || 'Kelas 4';
  const query = document.getElementById('searchStudentInput')?.value.trim().toLowerCase() || '';
  if(!container) return;
  const classStudents = getSortedStudents(activeClass);
  if(countTxt) countTxt.textContent = classStudents.length;
  if(classStudents.length === 0){
    container.innerHTML = `<div class="empty-state">Belum ada siswa terdaftar di <b>${activeClass}</b>.<br>Klik tombol <b>Tambah Siswa Baru</b> di atas.</div>`;
    return;
  }
  const filteredStudents = classStudents.filter(st => {
    return (st.nama || '').toLowerCase().includes(query) || (st.nis || '').toLowerCase().includes(query);
  });
  if(filteredStudents.length === 0){
    container.innerHTML = `<div class="empty-state">Siswa dengan pencarian "<b>${escHTML(query)}</b>" tidak ditemukan.</div>`;
    return;
  }
  container.innerHTML = '';
  filteredStudents.forEach((st) => {
    const origIdx = classStudents.findIndex(s => s.id === st.id);
    const item = document.createElement('div');
    item.className = 'col-manager-item';
    item.style.cursor = 'pointer';
    item.setAttribute('onclick', `openStudentDetailModal('${st.id}')`);
    const displayJk = st.jk ? `Gender: ${st.jk}` : '';
    const displayNis = st.nis ? `NISN: ${escHTML(st.nis)}` : '';
    const subInfo = [displayJk, displayNis].filter(Boolean).join(' | ');
    item.innerHTML = `
      <div class="col-info">
        <span style="font-size:12px; font-weight:700; color:var(--accent-dark);">${origIdx + 1}.</span>
        <span class="col-label-text">${escHTML(st.nama)} <small style="color:var(--muted); font-weight:normal;">(${subInfo})</small></span>
      </div>
      <span style="font-size:12px; color:var(--accent-dark); font-weight:bold;">➔</span>
    `;
    container.appendChild(item);
  });
}

function openAddStudentModal(){
  document.getElementById('sNis').value = '';
  document.getElementById('sNama').value = '';
  document.getElementById('sJk').value = '';
  openModal('modalAddStudent');
}

function addSingleStudentFromModal(){
  addSingleStudent();
  closeModal('modalAddStudent');
}

function openImportStudentsModal(){
  document.getElementById('bulkStudentsInput').value = '';
  openModal('modalImportStudents');
}

function importBulkStudentsFromModal(){
  importBulkStudents();
  closeModal('modalImportStudents');
}

function openStudentDetailModal(studentId){
  const st = state.students.find(s => s.id === studentId);
  if(!st) return;
  document.getElementById('activeDetailStudentId').value = studentId;
  document.getElementById('stDetailNama').textContent = st.nama;
  const displayJk = st.jk === 'L' ? 'Laki-laki (L)' : (st.jk === 'P' ? 'Perempuan (P)' : 'Belum diisi L/P');
  const displayNis = st.nis ? `NISN: ${st.nis}` : 'NISN: -';
  document.getElementById('stDetailSubInfo').textContent = `${displayNis} | Gender: ${displayJk} | ${st.kelas || 'Kelas 4'}`;
  let countH = 0, countS = 0, countI = 0, countA = 0;
  if(state.attendance){
    Object.keys(state.attendance).forEach(dateISO => {
      const rec = state.attendance[dateISO][studentId];
      if(rec && rec.status === 'H') countH++;
      else if(rec && rec.status === 'S') countS++;
      else if(rec && rec.status === 'I') countI++;
      else if(rec && rec.status === 'A') countA++;
    });
  }
  const gridEl = document.getElementById('stDetailAttendanceGrid');
  if(gridEl){
    gridEl.innerHTML = `
      <div style="background:#fff; border-radius:6px; padding:4px;"><b style="color:var(--accent);">${countH}</b><br><small>Hadir</small></div>
      <div style="background:#fff; border-radius:6px; padding:4px;"><b style="color:var(--amber);">${countS}</b><br><small>Sakit</small></div>
      <div style="background:#fff; border-radius:6px; padding:4px;"><b style="color:var(--info);">${countI}</b><br><small>Izin</small></div>
      <div style="background:#fff; border-radius:6px; padding:4px;"><b style="color:var(--danger);">${countA}</b><br><small>Alfa</small></div>
    `;
  }
  openModal('modalStudentDetail');
}

function openEditStudentFromDetailModal(){
  const studentId = document.getElementById('activeDetailStudentId').value;
  openEditStudentModal(studentId);
}

function deleteStudentFromDetailModal(){
  const studentId = document.getElementById('activeDetailStudentId').value;
  deleteStudent(studentId);
}

function openEditStudentModal(id){
  const st = state.students.find(s => s.id === id);
  if(!st) return;
  document.getElementById('editStudentId').value = st.id;
  document.getElementById('editSNis').value = st.nis || '';
  document.getElementById('editSNama').value = st.nama || '';
  document.getElementById('editSJk').value = st.jk || '';
  document.getElementById('editSKelas').value = st.kelas || 'Kelas 4';
  openModal('modalEditStudent');
}

function saveEditedStudent(){
  const id = document.getElementById('editStudentId').value;
  const st = state.students.find(s => s.id === id);
  if(!st) return;
  const nisVal = document.getElementById('editSNis').value.trim();
  const namaVal = document.getElementById('editSNama').value.trim();
  const kelasVal = document.getElementById('editSKelas').value;
  if(!namaVal){
    showStatus('Nama siswa tidak boleh kosong!');
    return;
  }
  if(nisVal !== ''){
    const isDuplicate = state.students.some(s => s.id !== id && (s.nis || '').trim() === nisVal);
    if (isDuplicate) {
  const dupStudent = state.students.find(s => s.id !== id && (s.nis || '').trim() === nisVal);
  showStatus(`NISN/NIS '${nisVal}' sudah digunakan!`);
  showAlertModal('NISN / NIS Ganda', `NISN/NIS '${nisVal}' sudah digunakan oleh siswa lain (${dupStudent.nama}). Gunakan NISN/NIS yang unik!`, 'danger');
  return;
}
  }
  st.nis = nisVal;
  st.nama = namaVal;
  st.jk = document.getElementById('editSJk').value;
  st.kelas = kelasVal;
  saveState();
  renderStudentsList();
  renderMonthlyMatrix();
  closeModal('modalEditStudent');
  addActivityLog(`Mengedit data siswa: ${namaVal}`);
  showStatus(`Data siswa "${namaVal}" berhasil diperbarui`);
}

function addSingleStudent(){
  const activeClass = document.getElementById('manageClassSelect')?.value || 'Kelas 4';
  const nisEl = document.getElementById('sNis');
  const namaEl = document.getElementById('sNama');
  const jkEl = document.getElementById('sJk');
  const nisVal = nisEl.value.trim();
  const namaVal = namaEl.value.trim();
  if(!namaVal){
    showStatus('Masukkan nama lengkap siswa!');
    return;
  }
  if(nisVal !== ''){
    const isDuplicate = state.students.some(s => (s.nis || '').trim() === nisVal);
    if (isDuplicate) {
  const dupStudent = state.students.find(s => s.id !== id && (s.nis || '').trim() === nisVal);
  showStatus(`NISN/NIS '${nisVal}' sudah digunakan!`);
  showAlertModal('NISN / NIS Ganda', `NISN/NIS '${nisVal}' sudah digunakan oleh siswa lain (${dupStudent.nama}). Gunakan NISN/NIS yang unik!`, 'danger');
  return;
}
  }
  state.students.push({
    id: uid(),
    nis: nisVal,
    nama: namaVal,
    jk: jkEl.value || '',
    kelas: activeClass
  });
  nisEl.value = ''; namaEl.value = ''; jkEl.value = '';
  saveState();
  renderStudentsList();
  addActivityLog(`Menambah siswa: ${namaVal} (${activeClass})`);
  showStatus(`Siswa "${namaVal}" ditambahkan ke ${activeClass}`);
}

function importBulkStudents(){
  const activeClass = document.getElementById('manageClassSelect')?.value || 'Kelas 4';
  const inputEl = document.getElementById('bulkStudentsInput');
  const rawText = inputEl.value.trim();
  if(!rawText){
    showStatus('Tempelkan daftar nama siswa terlebih dahulu!');
    return;
  }
  const lines = rawText.split('\n').map(s => s.trim()).filter(Boolean);
  let addedCount = 0;
  lines.forEach(line => {
    const cleanName = line.replace(/^[\s\d.\)\-\* a-zA-Z]*[.\)\-]\s*/, '').trim();
    if(cleanName){
      state.students.push({
        id: uid(),
        nis: '',
        nama: cleanName,
        jk: '',
        kelas: activeClass
      });
      addedCount++;
    }
  });
  inputEl.value = '';
  saveState();
  renderStudentsList();
  addActivityLog(`Mengimpor ${addedCount} siswa baru ke ${activeClass}`);
  showStatus(`Berhasil mengimpor ${addedCount} siswa (Nomor dibersihkan)`);
}

function deleteStudent(id){
  const st = state.students.find(s => s.id === id);
  if(!st) return;
  showConfirmModal('Hapus Siswa', `Hapus siswa "${st.nama}" dari daftar?`, () => {
    state.students = state.students.filter(s => s.id !== id);
    if(state.attendance){
      Object.keys(state.attendance).forEach(dateISO => {
        if(state.attendance[dateISO] && state.attendance[dateISO][id]){
          delete state.attendance[dateISO][id];
        }
      });
    }
    saveState();
    renderStudentsList();
    renderCalendar();
    renderMonthlyMatrix();
    if(document.getElementById('modalStudentDetail')?.classList.contains('active')){
      closeModal('modalStudentDetail');
    }
    addActivityLog(`Menghapus siswa: ${st.nama}`);
    showStatus('Siswa dihapus');
  });
}

function confirmDeleteAllStudents(){
  const activeClass = document.getElementById('manageClassSelect')?.value || 'Kelas 4';
  showConfirmModal('Hapus Semua Siswa', `Apakah Anda yakin ingin MENGHAPUS SELURUH SISWA di ${activeClass}?`, () => {
    const deletedStudentIds = new Set(
      state.students.filter(st => (st.kelas || 'Kelas 4') === activeClass).map(s => s.id)
    );
    state.students = state.students.filter(st => (st.kelas || 'Kelas 4') !== activeClass);
    if(state.attendance){
      Object.keys(state.attendance).forEach(dateISO => {
        if(state.attendance[dateISO]){
          deletedStudentIds.forEach(id => {
            delete state.attendance[dateISO][id];
          });
        }
      });
    }
    saveState();
    renderStudentsList();
    renderCalendar();
    renderMonthlyMatrix();
    addActivityLog(`Menghapus seluruh siswa di ${activeClass}`);
    showStatus(`Seluruh siswa ${activeClass} telah dihapus`);
  });
}