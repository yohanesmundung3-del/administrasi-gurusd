function switchCfgSubTab(panelId){
  document.querySelectorAll('.cfg-subtab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.cfg-subtab-panel').forEach(p => p.classList.remove('active'));
  const targetPanel = document.getElementById(panelId);
  if(targetPanel) targetPanel.classList.add('active');
  const activeBtn = Array.from(document.querySelectorAll('.cfg-subtab-btn')).find(b => b.getAttribute('onclick')?.includes(panelId));
  if(activeBtn) activeBtn.classList.add('active');
  
  if (state) {
    state.lastActiveCfgSubTab = panelId;
    saveState();
  }
  
  if(panelId === 'cfgPanelGuruMapel' || panelId === 'cfgPanelProfil'){
    renderTeacherAndSubjectUI();
  }
  if(panelId === 'cfgPanelKolom'){
    loadPdfColWidthsToInputs();
    const activeType = document.getElementById('cfgColReportTypeSelect')?.value || 'bulanan';
    switchColConfigPanelUI(activeType);
  }
}

function switchColConfigPanelUI(reportType){
  if(!reportType) reportType = document.getElementById('cfgColReportTypeSelect')?.value || 'bulanan';
  document.querySelectorAll('.cfg-col-panel').forEach(p => p.style.display = 'none');
  const targetId = 'cfgColPanel' + reportType.charAt(0).toUpperCase() + reportType.slice(1);
  const targetPanel = document.getElementById(targetId);
  if(targetPanel) {
    targetPanel.style.display = 'block';
  } else {
    const defaultBulanan = document.getElementById('cfgColPanelBulanan');
    if(defaultBulanan) defaultBulanan.style.display = 'block';
  }
}

function toggleTtdFieldsUI(){
  const val = document.getElementById('mJumlahTtd')?.value || '2';
  state.meta.jumlahTtd = val;
  const boxTengah = document.getElementById('ttdTengahBox');
  if(boxTengah){
    boxTengah.style.display = (val === '3') ? 'block' : 'none';
  }
  saveState();
}

function savePdfColConfig(){
  state.meta.pdfShowNis = document.getElementById('pdfShowNis')?.checked ?? true;
  state.meta.pdfShowPct = document.getElementById('pdfShowPct')?.checked ?? false;
  state.meta.pdfShowKet = document.getElementById('pdfShowKet')?.checked ?? false;
  saveState();
}

function savePdfColWidthsConfig(){
  if(!state.meta.colWidths) state.meta.colWidths = {};
  
  const parseOrAuto = (id, defaultVal) => {
    const el = document.getElementById(id);
    if(!el) return defaultVal;
    const val = el.value.trim();
    return (val !== '' && !isNaN(parseFloat(val))) ? parseFloat(val) : defaultVal;
  };
  
  state.meta.colWidths.bulanan = {
    no: parseOrAuto('cfgColWidthNo', 7),
    nis: parseOrAuto('cfgColWidthNis', 25),
    nama: parseOrAuto('cfgColWidthNama', 'auto'),
    jk: parseOrAuto('cfgColWidthJk', 8),
    tanggal: parseOrAuto('cfgColWidthTanggal', 5),
    rekap: parseOrAuto('cfgColWidthRekap', 6.5),
    pct: parseOrAuto('cfgColWidthPct', 9.5),
    ket: parseOrAuto('cfgColWidthKet', 11)
  };
  
  state.meta.colWidths.semester = {
    no: parseOrAuto('cfgSemColWidthNo', 7),
    nis: parseOrAuto('cfgSemColWidthNis', 25),
    nama: parseOrAuto('cfgSemColWidthNama', 'auto'),
    jk: parseOrAuto('cfgSemColWidthJk', 8),
    bulan: parseOrAuto('cfgSemColWidthBulan', 15),
    rekap: parseOrAuto('cfgSemColWidthRekap', 6.5),
    pct: parseOrAuto('cfgSemColWidthPct', 11)
  };
  
  state.meta.colWidths.tahunan = {
    no: parseOrAuto('cfgTahColWidthNo', 7),
    nis: parseOrAuto('cfgTahColWidthNis', 25),
    nama: parseOrAuto('cfgTahColWidthNama', 'auto'),
    jk: parseOrAuto('cfgTahColWidthJk', 8),
    bulan: parseOrAuto('cfgTahColWidthBulan', 11),
    rekap: parseOrAuto('cfgTahColWidthRekap', 6.5),
    pct: parseOrAuto('cfgTahColWidthPct', 11)
  };
  
  state.meta.colWidths.penilaian = {
    no: parseOrAuto('cfgPenColWidthNo', 7),
    nis: parseOrAuto('cfgPenColWidthNis', 25),
    nama: parseOrAuto('cfgPenColWidthNama', 'auto'),
    jk: parseOrAuto('cfgPenColWidthJk', 8),
    tp: parseOrAuto('cfgPenColWidthTp', 12),
    nilai: parseOrAuto('cfgPenColWidthNilai', 12),
    deskripsi: parseOrAuto('cfgPenColWidthDeskripsi', 'auto')
  };
  
  saveState();
}

function loadPdfColWidthsToInputs(){
  if(!state.meta || !state.meta.colWidths) return;
  const cw = state.meta.colWidths;
  
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.value = (val !== undefined && val !== 'auto' && val !== '' && !isNaN(parseFloat(val))) ? val : '';
  };
  
  if(cw.bulanan){
    setVal('cfgColWidthNo', cw.bulanan.no);
    setVal('cfgColWidthNis', cw.bulanan.nis);
    setVal('cfgColWidthNama', cw.bulanan.nama);
    setVal('cfgColWidthJk', cw.bulanan.jk);
    setVal('cfgColWidthTanggal', cw.bulanan.tanggal);
    setVal('cfgColWidthRekap', cw.bulanan.rekap);
    setVal('cfgColWidthPct', cw.bulanan.pct);
    setVal('cfgColWidthKet', cw.bulanan.ket);
  }
  
  if(cw.semester){
    setVal('cfgSemColWidthNo', cw.semester.no);
    setVal('cfgSemColWidthNis', cw.semester.nis);
    setVal('cfgSemColWidthNama', cw.semester.nama);
    setVal('cfgSemColWidthJk', cw.semester.jk);
    setVal('cfgSemColWidthBulan', cw.semester.bulan);
    setVal('cfgSemColWidthRekap', cw.semester.rekap);
    setVal('cfgSemColWidthPct', cw.semester.pct);
  }
  
  if(cw.tahunan){
    setVal('cfgTahColWidthNo', cw.tahunan.no);
    setVal('cfgTahColWidthNis', cw.tahunan.nis);
    setVal('cfgTahColWidthNama', cw.tahunan.nama);
    setVal('cfgTahColWidthJk', cw.tahunan.jk);
    setVal('cfgTahColWidthBulan', cw.tahunan.bulan);
    setVal('cfgTahColWidthRekap', cw.tahunan.rekap);
    setVal('cfgTahColWidthPct', cw.tahunan.pct);
  }
  
  if(cw.penilaian){
    setVal('cfgPenColWidthNo', cw.penilaian.no);
    setVal('cfgPenColWidthNis', cw.penilaian.nis);
    setVal('cfgPenColWidthNama', cw.penilaian.nama);
    setVal('cfgPenColWidthJk', cw.penilaian.jk);
    setVal('cfgPenColWidthTp', cw.penilaian.tp);
    setVal('cfgPenColWidthNilai', cw.penilaian.nilai);
    setVal('cfgPenColWidthDeskripsi', cw.penilaian.deskripsi);
  }
}

function updatePwaIconFromInput(){
  const urlVal = document.getElementById('mPwaIconUrl')?.value.trim() || 'https://cdn-icons-png.flaticon.com/512/2641/2641409.png';
  state.meta.pwaIconUrl = urlVal;
  const previewImg = document.getElementById('pwaIconPreview');
  if(previewImg) previewImg.src = urlVal;
  const manifestLink = document.getElementById('pwaManifestLink');
  if(manifestLink){
    const manifestObj = {
      "name": "Absensi Siswa",
      "short_name": "Absensi",
      "start_url": ".",
      "display": "standalone",
      "background_color": "#1f4d40",
      "theme_color": "#1f4d40",
      "icons": [{"src": urlVal, "sizes": "512x512", "type": "image/png"}]
    };
    manifestLink.href = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(manifestObj));
  }
  saveState();
}

function bindMetaInputs(){
  const now = new Date();
  const mIdx = now.getMonth();
  const yNum = now.getFullYear();
  const realBulan = MONTHS_ID[mIdx];
  const realTahun = yNum;
  const realSemester = (mIdx >= 6) ? 'Ganjil' : 'Genap';
  const realTahunAjaran = (mIdx >= 6) ? `${yNum}/${yNum + 1}` : `${yNum - 1}/${yNum}`;
  if(!state.meta.bulan) state.meta.bulan = realBulan;
  if(!state.meta.tahun) state.meta.tahun = realTahun;
  if(!state.meta.semester) state.meta.semester = realSemester;
  if(!state.meta.tahunAjaran) state.meta.tahunAjaran = realTahunAjaran;
  
  Object.entries(metaFields).forEach(([elId,key])=>{
    const el = document.getElementById(elId);
    if(!el) return;
    el.value = (state.meta[key] !== undefined && state.meta[key] !== '') ? state.meta[key] : '';
    
    const updateHandler = () => {
      state.meta[key] = el.value;
      saveState();
      updateHeaderDisplay();
    };
    el.addEventListener('input', updateHandler);
    el.addEventListener('change', updateHandler);
  });
  
  ['mNipKepsek', 'mNipGuru', 'mNipTengah', 'tgNip'].forEach(id => {
    const el = document.getElementById(id);
    if(el){
      el.addEventListener('blur', () => {
        if(el.value){
          el.value = formatNIP(el.value);
          if(id === 'mNipKepsek') state.meta.nipKepsek = el.value;
          if(id === 'mNipGuru') state.meta.nipGuru = el.value;
          if(id === 'mNipTengah') state.meta.nipTengah = el.value;
          saveState();
        }
      });
    }
  });
  
  const pdfShowNis = document.getElementById('pdfShowNis');
  const pdfShowPct = document.getElementById('pdfShowPct');
  const pdfShowKet = document.getElementById('pdfShowKet');
  if(pdfShowNis) pdfShowNis.checked = state.meta.pdfShowNis ?? true;
  if(pdfShowPct) pdfShowPct.checked = state.meta.pdfShowPct ?? false;
  if(pdfShowKet) pdfShowKet.checked = state.meta.pdfShowKet ?? false;
  
  const colReportSel = document.getElementById('cfgColReportTypeSelect');
  if(colReportSel){
    colReportSel.addEventListener('change', (e) => switchColConfigPanelUI(e.target.value));
  }
  
  const kaldikInput = document.getElementById('kaldikImportInput');
  if(kaldikInput && state.customHolidaysText){
    kaldikInput.value = state.customHolidaysText;
  }
  toggleTtdFieldsUI();
  updatePwaIconFromInput();
  renderTeacherAndSubjectUI();
  loadPdfColWidthsToInputs();
  updateHeaderDisplay();
}

function renderTeacherAndSubjectUI(){
  let isUpdated = false;
  if(!state.teacherList || !Array.isArray(state.teacherList) || state.teacherList.length === 0){
    state.teacherList = [...DEFAULT_TEACHERS];
    isUpdated = true;
  }
  if(!state.subjectList || !Array.isArray(state.subjectList) || state.subjectList.length === 0){
    state.subjectList = [...DEFAULT_SUBJECTS];
    isUpdated = true;
  } else {
    const pakIdx = state.subjectList.indexOf('Pendidikan Agama Kristen dan Budi Pekerti');
    if(pakIdx > 0){
      state.subjectList.splice(pakIdx, 1);
      state.subjectList.unshift('Pendidikan Agama Kristen dan Budi Pekerti');
      isUpdated = true;
    }
  }
  if(isUpdated) saveState();

  const teacherContainer = document.getElementById('teacherListContainer');
  if(teacherContainer){
    if(state.teacherList.length === 0){
      teacherContainer.innerHTML = `<div class="empty-state" style="padding:10px; font-size:11.5px;">Belum ada guru tersimpan.</div>`;
    } else {
      teacherContainer.innerHTML = state.teacherList.map(t => `
        <div class="col-manager-item">
          <div class="col-info">
            <span style="font-size:12px; font-weight:700; color:var(--ink);">${escHTML(t.nama)}</span>
            <small style="color:var(--muted); font-size:10.5px; margin-left:4px;">(NIP: ${escHTML(formatNIP(t.nip) || '-')}) - ${escHTML(t.jabatan || '-')}</small>
          </div>
          <button type="button" class="btn-move" style="color:var(--danger); border-color:#f5c2c2;" onclick="deleteTeacherItem('${t.id}')">🗑️ Hapus</button>
        </div>
      `).join('');
    }
  }

  const subjectContainer = document.getElementById('subjectListContainer');
  if(subjectContainer){
    if(state.subjectList.length === 0){
      subjectContainer.innerHTML = `<div class="empty-state" style="padding:10px; font-size:11.5px;">Belum ada mata pelajaran tersimpan.</div>`;
    } else {
      subjectContainer.innerHTML = state.subjectList.map((s, idx) => `
        <div class="col-manager-item">
          <span style="font-size:12px; font-weight:700; color:var(--ink);">${escHTML(s)}</span>
          <button type="button" class="btn-move" style="color:var(--danger); border-color:#f5c2c2;" onclick="deleteSubjectItem(${idx})">🗑️ Hapus</button>
        </div>
      `).join('');
    }
  }
}

function openTeacherPicker(position){
  if (isTouchScrolling) return;
  const container = document.getElementById('customPickerContainer');
  const title = document.getElementById('customPickerTitle');
  if(!container || !title) return;
  const posName = (position === 'left') ? 'Atasan / Kepsek (Kiri)' : (position === 'right' ? 'Guru / Wali Kelas (Kanan)' : 'Penanda Tangan Tengah');
  title.textContent = `Pilih ${posName}`;
  let html = `
    <div class="col-manager-item" style="cursor:pointer; padding:10px 12px; margin-bottom:6px; border:1px solid #f5c2c2;" onclick="applyTeacherSelection('${position}', '__MANUAL__')">
      <span style="font-size:13px; font-weight:bold; color:var(--danger);">✏️ Kosongkan / Ketik Manual</span>
      <span style="color:var(--danger); font-size:14px;">➔</span>
    </div>
  `;
  (state.teacherList || []).forEach(t => {
    html += `
      <div class="col-manager-item" style="cursor:pointer; padding:10px 12px; margin-bottom:6px;" onclick="applyTeacherSelection('${position}', '${t.id}')">
        <div class="col-info">
          <div>
            <div style="font-size:12.5px; font-weight:bold; color:var(--accent-dark);">${escHTML(t.nama)}</div>
            <div style="font-size:11px; color:var(--muted);">${escHTML(t.jabatan || 'Guru')} - NIP: ${escHTML(formatNIP(t.nip) || '-')}</div>
          </div>
        </div>
        <span style="color:var(--accent); font-size:14px;">➔</span>
      </div>
    `;
  });
  container.innerHTML = html;
  openModal('modalCustomPicker');
}

function applyTeacherSelection(position, teacherId){
  closeModal('modalCustomPicker');
  if(position === 'left') selectTeacherForLeft(teacherId);
  else if(position === 'right') selectTeacherForRight(teacherId);
  else if(position === 'center') selectTeacherForCenter(teacherId);
}

function openClassPicker(){
  if (isTouchScrolling) return;
  const container = document.getElementById('customPickerContainer');
  const title = document.getElementById('customPickerTitle');
  if(!container || !title) return;
  title.textContent = 'Pilih Kelas / Fase';
  const classes = ['Kelas I / Fase A', 'Kelas II / Fase A', 'Kelas III / Fase B', 'Kelas IV / Fase B', 'Kelas V / Fase C', 'Kelas VI / Fase C'];
  let html = `
    <div class="col-manager-item" style="cursor:pointer; padding:10px 12px; margin-bottom:6px; border:1px solid var(--line);" onclick="applyClassSelection('__MANUAL__')">
      <span style="font-size:13px; font-weight:bold; color:var(--accent-dark);">✏️ Ketik Manual...</span>
      <span style="color:var(--accent); font-size:14px;">➔</span>
    </div>
  `;
  classes.forEach(c => {
    html += `
      <div class="col-manager-item" style="cursor:pointer; padding:10px 12px; margin-bottom:6px;" onclick="applyClassSelection('${c}')">
        <span style="font-size:12.5px; font-weight:bold; color:var(--ink);">${escHTML(c)}</span>
        <span style="color:var(--accent); font-size:14px;">➔</span>
      </div>
    `;
  });
  container.innerHTML = html;
  openModal('modalCustomPicker');
}

function applyClassSelection(classVal){
  closeModal('modalCustomPicker');
  selectClassFromDropdown(classVal);
}

function openSubjectPicker(){
  if (isTouchScrolling) return;
  const container = document.getElementById('customPickerContainer');
  const title = document.getElementById('customPickerTitle');
  if(!container || !title) return;
  title.textContent = 'Pilih Mata Pelajaran';
  let html = `
    <div class="col-manager-item" style="cursor:pointer; padding:10px 12px; margin-bottom:6px; border:1px solid var(--line);" onclick="applySubjectSelection('__MANUAL__')">
      <span style="font-size:13px; font-weight:bold; color:var(--accent-dark);">✏️ Ketik Manual...</span>
      <span style="color:var(--accent); font-size:14px;">➔</span>
    </div>
  `;
  (state.subjectList || []).forEach(s => {
    html += `
      <div class="col-manager-item" style="cursor:pointer; padding:10px 12px; margin-bottom:6px;" onclick="applySubjectSelection('${escAttr(s)}')">
        <span style="font-size:12.5px; font-weight:bold; color:var(--ink);">${escHTML(s)}</span>
        <span style="color:var(--accent); font-size:14px;">➔</span>
      </div>
    `;
  });
  container.innerHTML = html;
  openModal('modalCustomPicker');
}

function applySubjectSelection(subjectVal){
  closeModal('modalCustomPicker');
  selectSubjectFromDropdown(subjectVal);
}

function selectClassFromDropdown(classVal){
  const elKelas = document.getElementById('mKelas');
  const elLbl = document.getElementById('lblClassSelect');
  if(classVal === '__MANUAL__' || !classVal){
    if(elKelas){ elKelas.value = ''; elKelas.readOnly = false; elKelas.style.background = '#fffdf9'; elKelas.focus(); }
    if(elLbl) elLbl.textContent = '✏️ Mode Ketik Manual';
    showStatus('Kelas: Mode Ketik Manual');
    return;
  }
  if(elKelas){ elKelas.value = classVal; elKelas.readOnly = true; elKelas.style.background = '#f0f4f2'; }
  if(elLbl) elLbl.textContent = classVal;
  state.meta.kelas = classVal;
  saveState();
  showStatus(`Kelas (Terkunci): ${classVal}`);
}

function selectSubjectFromDropdown(subjectVal){
  const elMapel = document.getElementById('mMapel');
  const elLbl = document.getElementById('lblSubjectSelect');
  if(subjectVal === '__MANUAL__' || !subjectVal){
    if(elMapel){ elMapel.value = ''; elMapel.readOnly = false; elMapel.style.background = '#fffdf9'; elMapel.focus(); }
    if(elLbl) elLbl.textContent = '✏️ Mode Ketik Manual';
    showStatus('Mapel: Mode Ketik Manual');
    return;
  }
  if(elMapel){ elMapel.value = subjectVal; elMapel.readOnly = true; elMapel.style.background = '#f0f4f2'; }
  if(elLbl) elLbl.textContent = subjectVal;
  state.meta.mapel = subjectVal;
  saveState();
  showStatus(`Mapel (Terkunci): ${subjectVal}`);
}

function selectTeacherForLeft(teacherId){
  const elNama = document.getElementById('mKepsek');
  const elNip = document.getElementById('mNipKepsek');
  const elJab = document.getElementById('mJabatanKiri');
  const elLbl = document.getElementById('lblKepsekSelect');
  if(teacherId === '__MANUAL__' || teacherId === '__EMPTY__' || !teacherId){
    if(elNama){ elNama.value = ''; elNama.readOnly = false; elNama.style.background = '#fffdf9'; }
    if(elNip){ elNip.value = ''; elNip.readOnly = false; elNip.style.background = '#fffdf9'; }
    if(elJab){ elJab.readOnly = false; elJab.style.background = '#fffdf9'; }
    if(elLbl) elLbl.textContent = '✏️ Kosong / Ketik Manual';
    state.meta.kepsek = '';
    state.meta.nipKepsek = '';
    saveState();
    showStatus('Atasan Kiri: Mode Ketik Manual');
    return;
  }
  const t = (state.teacherList || []).find(x => x.id === teacherId);
  if(!t) return;
  const formattedNip = formatNIP(t.nip);
  if(elNama){ elNama.value = t.nama; elNama.readOnly = true; elNama.style.background = '#f0f4f2'; }
  if(elNip){ elNip.value = formattedNip; elNip.readOnly = true; elNip.style.background = '#f0f4f2'; }
  if(elJab && t.jabatan){ elJab.value = t.jabatan; elJab.readOnly = true; elJab.style.background = '#f0f4f2'; }
  if(elLbl) elLbl.textContent = `${t.nama} (${t.jabatan || 'Guru'})`;
  state.meta.kepsek = t.nama;
  state.meta.nipKepsek = formattedNip;
  if(t.jabatan) state.meta.jabatanKiri = t.jabatan;
  saveState();
  showStatus(`Atasan Kiri (Terkunci): ${t.nama}`);
}

function selectTeacherForRight(teacherId){
  const elNama = document.getElementById('mGuru');
  const elNip = document.getElementById('mNipGuru');
  const elJab = document.getElementById('mJabatanKanan');
  const elLbl = document.getElementById('lblGuruSelect');
  if(teacherId === '__MANUAL__' || teacherId === '__EMPTY__' || !teacherId){
    if(elNama){ elNama.value = ''; elNama.readOnly = false; elNama.style.background = '#fffdf9'; }
    if(elNip){ elNip.value = ''; elNip.readOnly = false; elNip.style.background = '#fffdf9'; }
    if(elJab){ elJab.readOnly = false; elJab.style.background = '#fffdf9'; }
    if(elLbl) elLbl.textContent = '✏️ Kosong / Ketik Manual';
    state.meta.guru = '';
    state.meta.nipGuru = '';
    saveState();
    showStatus('Guru Kanan: Mode Ketik Manual');
    return;
  }
  const t = (state.teacherList || []).find(x => x.id === teacherId);
  if(!t) return;
  const formattedNip = formatNIP(t.nip);
  if(elNama){ elNama.value = t.nama; elNama.readOnly = true; elNama.style.background = '#f0f4f2'; }
  if(elNip){ elNip.value = formattedNip; elNip.readOnly = true; elNip.style.background = '#f0f4f2'; }
  if(elJab && t.jabatan){ elJab.value = t.jabatan; elJab.readOnly = true; elJab.style.background = '#f0f4f2'; }
  if(elLbl) elLbl.textContent = `${t.nama} (${t.jabatan || 'Guru'})`;
  state.meta.guru = t.nama;
  state.meta.nipGuru = formattedNip;
  if(t.jabatan) state.meta.jabatanKanan = t.jabatan;
  saveState();
  updateHeaderDisplay();
  showStatus(`Guru Kanan (Terkunci): ${t.nama}`);
}

function selectTeacherForCenter(teacherId){
  const elNama = document.getElementById('mNamaTengah');
  const elNip = document.getElementById('mNipTengah');
  const elJab = document.getElementById('mJabatanTengah');
  const elLbl = document.getElementById('lblTengahSelect');
  if(teacherId === '__MANUAL__' || teacherId === '__EMPTY__' || !teacherId){
    if(elNama){ elNama.value = ''; elNama.readOnly = false; elNama.style.background = '#fffdf9'; }
    if(elNip){ elNip.value = ''; elNip.readOnly = false; elNip.style.background = '#fffdf9'; }
    if(elJab){ elJab.readOnly = false; elJab.style.background = '#fffdf9'; }
    if(elLbl) elLbl.textContent = '✏️ Kosong / Ketik Manual';
    state.meta.namaTengah = '';
    state.meta.nipTengah = '';
    saveState();
    showStatus('TTD Tengah: Mode Ketik Manual');
    return;
  }
  const t = (state.teacherList || []).find(x => x.id === teacherId);
  if(!t) return;
  const formattedNip = formatNIP(t.nip);
  if(elNama){ elNama.value = t.nama; elNama.readOnly = true; elNama.style.background = '#f0f4f2'; }
  if(elNip){ elNip.value = formattedNip; elNip.readOnly = true; elNip.style.background = '#f0f4f2'; }
  if(elJab && t.jabatan){ elJab.value = t.jabatan; elJab.readOnly = true; elJab.style.background = '#f0f4f2'; }
  if(elLbl) elLbl.textContent = `${t.nama} (${t.jabatan || 'Guru'})`;
  state.meta.namaTengah = t.nama;
  state.meta.nipTengah = formattedNip;
  if(t.jabatan) state.meta.jabatanTengah = t.jabatan;
  saveState();
  showStatus(`TTD Tengah (Terkunci): ${t.nama}`);
}

/* INTERSEPTOR SENTUHAN DENGAN TOLERANSI SCROLL */
function exportJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `absensi-siswa-${(state.meta.bulan||'draft').toLowerCase()}-${state.meta.tahun||''}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  addActivityLog('Mengekspor cadangan JSON');
  showStatus('Data diekspor');
}

function triggerImport(){ document.getElementById('importFile').click(); }

function handleImport(ev){
  const file = ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const data = JSON.parse(e.target.result);
      state = data;
      saveState();
      bindMetaInputs();
      renderStudentsList();
      renderCalendar();
      renderJadwalUI();
      renderMonthlyMatrix();
      renderActivityLogList();
      renderTeacherAndSubjectUI();
      loadPdfColWidthsToInputs();
      addActivityLog('Memulihkan data dari berkas JSON');
      showStatus('Data berhasil diimpor');
    }catch(err){ showAlertModal('Gagal Impor JSON', 'File JSON yang diunggah tidak valid atau rusak.', 'danger'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
}

/* Service Worker Registration */
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    const swCode = `self.addEventListener('fetch', function(e) {});`;
    const blob = new Blob([swCode], {type: 'text/javascript'});
    const swUrl = URL.createObjectURL(blob);
    navigator.serviceWorker.register(swUrl).catch(err => console.log('SW init offline'));
  });
}

/* Inisialisasi Aplikasi Saat Dimuat (WITH COMPLETE UI STATE PERSISTENCE) */
(async function init(){
  await openDB();
  await loadState();
  const now = new Date();
  const mIdx = now.getMonth();
  const yNum = now.getFullYear();
  const realBulan = MONTHS_ID[mIdx];
  const realTahun = yNum;
  const realSemester = (mIdx >= 6) ? 'Ganjil' : 'Genap';
  const realTahunAjaran = (mIdx >= 6) ? `${yNum}/${yNum + 1}` : `${yNum - 1}/${yNum}`;
  if(!state.meta.bulan) state.meta.bulan = realBulan;
  if(!state.meta.tahun) state.meta.tahun = realTahun;
  if(!state.meta.semester) state.meta.semester = realSemester;
  if(!state.meta.tahunAjaran) state.meta.tahunAjaran = realTahunAjaran;
  
  makeModalsDraggable();
  bindMetaInputs();
  loadPdfColWidthsToInputs();
  updateDashboardCalendarIcon();
  applyTheme(state.meta.theme || 'teal');
  renderTodayWidget();
  updateHeaderDisplay();
  startHeaderClock();
  
  const elBulanRekap = document.getElementById('rekapBulanSelect');
  const elTahunRekap = document.getElementById('rekapTahunInput');
  if(elBulanRekap) elBulanRekap.value = state.meta.bulan;
  if(elTahunRekap) elTahunRekap.value = state.meta.tahun;
  
  const elBulanMeta = document.getElementById('mBulan');
  const elTahunMeta = document.getElementById('mTahun');
  if(elBulanMeta) elBulanMeta.value = state.meta.bulan;
  if(elTahunMeta) elTahunMeta.value = state.meta.tahun;
  
  const elBulanPdf = document.getElementById('pdfBulanSelect');
  const elTahunPdf = document.getElementById('pdfTahunInput');
  if(elBulanPdf) elBulanPdf.value = state.meta.bulan;
  if(elTahunPdf) elTahunPdf.value = state.meta.tahun;
  
  renderStudentsList();
  renderCalendar();
  renderJadwalUI();
  renderMonthlyMatrix();
  renderActivityLogList();
  renderTeacherAndSubjectUI();
  
  // 1. MEMULIHKAN TAMPILAN MODUL UTAMA SEBELUM REFRESH
  const savedLastView = state.lastActiveView || localStorage.getItem('absensi_last_view');
  if(savedLastView && savedLastView !== 'viewDashboard'){
    openModule(savedLastView, true);
  } else {
    showDashboard(true);
  }
  
  // 2. MEMULIHKAN SUB-TAB PENGATURAN SEBELUM REFRESH JIKA DI VIEW CONFIG
  if(savedLastView === 'viewConfig'){
    const savedSubTab = state.lastActiveCfgSubTab || 'cfgPanelProfil';
    switchCfgSubTab(savedSubTab);
  }
  
  // 3. MEMULIHKAN TUMPUKAN MODAL POPUP YANG SEDANG TERBUKA SEBELUM REFRESH
  if(Array.isArray(state.activeModalStack) && state.activeModalStack.length > 0){
    const savedModals = [...state.activeModalStack];
    modalStack = []; // reset stack memori sebelum merekonstruksi tumpukan
    savedModals.forEach(mId => {
      openModal(mId, true);
    });
  }
})();