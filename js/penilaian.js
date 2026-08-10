/* ==========================================================================
    MODUL PENILAIAN MAPEL (KURIKULUM MERDEKA SD)
    ========================================================================== */

function getPenilaianKey(){
  const pKelas = document.getElementById('pKelasSelect')?.value || 'Kelas 4';
  const pMapel = document.getElementById('pMapelSelect')?.value || (state.subjectList[0] || 'Umum');
  const pSem = document.getElementById('pSemesterSelect')?.value || 'Genap';
  const pTahun = state.meta.tahun || '2026';
  return `${pKelas}_${pMapel}_${pSem}_${pTahun}`.replace(/\s+/g, '_');
}

function updatePenilaianFilterBadge(){
  const badgeEl = document.getElementById('penilaianFilterBadgeText');
  if(!badgeEl) return;
  const pKelas = document.getElementById('pKelasSelect')?.value || 'Kelas 4';
  const pMapel = document.getElementById('pMapelSelect')?.value || (state.subjectList[0] || 'Umum');
  const pSem = document.getElementById('pSemesterSelect')?.value || 'Genap';
  badgeEl.textContent = `📋 Filter Penilaian: ${pKelas} | ${pMapel} | ${pSem}`;
}

function openFilterPenilaianModal(){
  updatePenilaianFilterBadge();
  openModal('modalFilterPenilaian');
}

function applyFilterPenilaianModal(){
  updatePenilaianFilterBadge();
  renderPenilaianMatrix();
  closeModal('modalFilterPenilaian');
  showStatus('Filter penilaian diterapkan');
}

function openManageTpModal(){
  const pKey = getPenilaianKey();
  const pKelas = document.getElementById('pKelasSelect')?.value || 'Kelas 4';
  const pMapel = document.getElementById('pMapelSelect')?.value || (state.subjectList[0] || 'Umum');
  
  const subContext = document.getElementById('tpModalSubContext');
  if(subContext){
    subContext.textContent = `📌 Konteks: ${pKelas} | ${pMapel}`;
  }
  
  renderTpListUI(pKey);
  openModal('modalManageTp');
}

function renderPenilaianMatrix(){
  const wrapper = document.getElementById('penilaianMatrixWrapper');
  const table = document.getElementById('penilaianMatrixTable');
  const mapelSelect = document.getElementById('pMapelSelect');
  if(!table || !wrapper) return;
  
  updatePenilaianFilterBadge();
  
  if(mapelSelect && mapelSelect.options.length === 0){
    mapelSelect.innerHTML = (state.subjectList || []).map(s => `<option value="${escAttr(s)}">${escHTML(s)}</option>`).join('');
  }
  
  const pKey = getPenilaianKey();
  const activeClass = document.getElementById('pKelasSelect')?.value || 'Kelas 4';
  const activeMapel = document.getElementById('pMapelSelect')?.value || (state.subjectList[0] || 'Pendidikan Agama Kristen');
  const classStudents = getSortedStudents(activeClass);
  
  if(!state.tpList) state.tpList = {};
  if(!state.grades) state.grades = {};
  
  // MURNI TERISOLASI PER KELAS & MAPEL (Jika belum ada TP, default array kosong [])
  const currentTps = state.tpList[pKey] || [];
  state.tpList[pKey] = currentTps;
  
  // Header tabel
  let headHTML = `
    <thead>
      <tr>
        <th rowspan="2">No</th>
        <th rowspan="2">Nama Siswa (${activeClass})</th>
        <th rowspan="2">NISN/NIS</th>
        <th rowspan="2">L/P</th>
        <th colspan="${currentTps.length > 0 ? currentTps.length : 1}">Nilai Sumatif Lingkup Materi (SLM)</th>
        <th rowspan="2">Rata SLM</th>
        <th rowspan="2">SAS</th>
        <th rowspan="2">Nilai Akhir (NA)</th>
        <th rowspan="2" style="min-width:220px;">Deskripsi Capaian Rapor</th>
      </tr>
      <tr>
  `;
  
  if(currentTps.length === 0){
    headHTML += `<th style="font-size:10.5px; color:var(--muted); font-weight:normal; font-style:italic;">Belum Ada TP</th>`;
  } else {
    currentTps.forEach((tp, idx) => {
      let cleanName = (tp.name || '').replace(/^TP\s*\d+\s*[-:\s]*/i, '').trim();
      if(!cleanName) cleanName = tp.name;
      headHTML += `<th title="TP ${idx + 1}: ${escAttr(cleanName)}" style="min-width:48px; text-align:center;">TP ${idx + 1}</th>`;
    });
  }
  headHTML += `</tr></thead>`;
  
  // Body tabel
  let bodyHTML = '<tbody>';
  if(classStudents.length === 0){
    bodyHTML += `<tr><td colspan="${Math.max(currentTps.length, 1) + 8}" style="padding:20px;">Belum ada siswa terdaftar di <b>${activeClass}</b>.</td></tr>`;
  } else if(currentTps.length === 0){
    classStudents.forEach((st, idx) => {
      const stGradesKey = `${pKey}_${st.id}`;
      const g = state.grades[stGradesKey] || {};
      const sasVal = g['SAS'] !== undefined ? g['SAS'] : '';
      const numSas = parseFloat(sasVal);
      const finalNa = !isNaN(numSas) ? numSas : 0;
      
      bodyHTML += `
        <tr>
          <td>${idx + 1}</td>
          <td style="text-align:left; font-weight:700;">${escHTML(st.nama)}</td>
          <td>${escHTML(st.nis || '')}</td>
          <td>${escHTML(st.jk || '')}</td>
          <td style="color:var(--muted); font-size:10.5px; font-style:italic;">Klik 'Kelola TP' untuk isi TP ${activeClass}</td>
          <td>-</td>
          <td style="padding:2px;">
            <input type="number" min="0" max="100" style="width:50px; text-align:center; padding:4px; font-size:11px; font-weight:bold; border:1px solid var(--accent); border-radius:4px;" 
             value="${sasVal}" onchange="saveGradeCell('${stGradesKey}', 'SAS', this.value)">
          </td>
          <td style="font-weight:800; font-size:12px; color:var(--accent-dark); background:#f0f5f2;">${finalNa || '-'}</td>
          <td style="text-align:left; font-size:10px; color:var(--muted); font-style:italic;">Belum ada TP tersimpan untuk ${activeClass}</td>
        </tr>
      `;
    });
  } else {
    classStudents.forEach((st, idx) => {
      const stGradesKey = `${pKey}_${st.id}`;
      const g = state.grades[stGradesKey] || {};
      let totalSlm = 0;
      let countSlm = 0;
      let highestTp = { score: -1, name: '' };
      let lowestTp = { score: 999, name: '' };
      let tpCells = '';
      
      currentTps.forEach((tp, tpIdx) => {
        let cleanTpName = (tp.name || '').replace(/^TP\s*\d+\s*[-:\s]*/i, '').trim();
        if(!cleanTpName) cleanTpName = tp.name;
        let naturalTpName = cleanTpName.charAt(0).toLowerCase() + cleanTpName.slice(1);
        
        const scoreVal = g[tp.id] !== undefined ? g[tp.id] : '';
        const numScore = parseFloat(scoreVal);
        if(!isNaN(numScore) && scoreVal !== ''){
          totalSlm += numScore;
          countSlm++;
          if(numScore > highestTp.score){ highestTp.score = numScore; highestTp.name = naturalTpName; }
          if(numScore < lowestTp.score){ lowestTp.score = numScore; lowestTp.name = naturalTpName; }
        }
        tpCells += `
          <td style="padding:2px;">
            <input type="number" min="0" max="100" style="width:48px; text-align:center; padding:4px; font-size:11px; border:1px solid #ccc; border-radius:4px;" 
             value="${scoreVal}" onchange="saveGradeCell('${stGradesKey}', '${tp.id}', this.value)">
          </td>
        `;
      });
      
      const avgSlm = countSlm > 0 ? Math.round(totalSlm / countSlm) : 0;
      const sasVal = g['SAS'] !== undefined ? g['SAS'] : '';
      const numSas = parseFloat(sasVal);
      let finalNa = 0;
      if(countSlm > 0 && !isNaN(numSas) && sasVal !== ''){
        finalNa = Math.round((avgSlm + numSas) / 2);
      } else if(countSlm > 0){
        finalNa = avgSlm;
      } else if(!isNaN(numSas)){
        finalNa = numSas;
      }
      
      let deskripsiText = '-';
      if(countSlm > 0){
        let parts = [];
        if(highestTp.score >= 75){
          parts.push(`Menunjukkan penguasaan sangat baik dalam ${highestTp.name}`);
        }
        if(lowestTp.score < 75 && lowestTp.name !== highestTp.name){
          parts.push(`Perlu bimbingan lebih lanjut dalam ${lowestTp.name}`);
        } else if(parts.length === 0){
          parts.push(`Menunjukkan penguasaan yang cukup dalam materi mapel ${activeMapel}`);
        }
        deskripsiText = parts.join('. ') + '.';
      }
      
      bodyHTML += `
        <tr>
          <td>${idx + 1}</td>
          <td style="text-align:left; font-weight:700;">${escHTML(st.nama)}</td>
          <td>${escHTML(st.nis || '')}</td>
          <td>${escHTML(st.jk || '')}</td>
          ${tpCells}
          <td style="font-weight:700; background:#eef5f1;">${countSlm > 0 ? avgSlm : '-'}</td>
          <td style="padding:2px;">
            <input type="number" min="0" max="100" style="width:50px; text-align:center; padding:4px; font-size:11px; font-weight:bold; border:1px solid var(--accent); border-radius:4px;" 
             value="${sasVal}" onchange="saveGradeCell('${stGradesKey}', 'SAS', this.value)">
          </td>
          <td style="font-weight:800; font-size:12px; color:var(--accent-dark); background:#f0f5f2;">${finalNa || '-'}</td>
          <td style="text-align:left; font-size:10px; line-height:1.3; white-space:normal; padding:6px; max-width:240px; color:var(--ink);">${escHTML(deskripsiText)}</td>
        </tr>
      `;
    });
  }
  bodyHTML += '</tbody>';
  table.innerHTML = headHTML + bodyHTML;

  // Render Kotak Keterangan TP di bawah tabel
  renderTpLegendBox(currentTps, wrapper, activeClass, activeMapel);
}

function renderTpLegendBox(currentTps, wrapper, activeClass, activeMapel){
  let legendBox = document.getElementById('tpLegendContainerBox');
  if(!legendBox){
    legendBox = document.createElement('div');
    legendBox.id = 'tpLegendContainerBox';
    wrapper.parentNode.insertBefore(legendBox, wrapper.nextSibling);
  }
  
  if(!currentTps || currentTps.length === 0){
    legendBox.innerHTML = `
      <div style="margin-top:12px; background:#f8fafc; border:1.5px dashed var(--line); border-radius:12px; padding:12px; text-align:center; font-size:11.5px; color:var(--muted);">
        <i>Belum ada Tujuan Pembelajaran (TP) tersimpan untuk <b>${escHTML(activeClass)}</b> pada mapel <b>${escHTML(activeMapel)}</b>.<br>Klik tombol <b>Kelola TP</b> di atas untuk menambahkan TP kelas ini.</i>
      </div>
    `;
    return;
  }
  
  let gridRowsHTML = currentTps.map((tp, idx) => {
    let cleanName = (tp.name || '').replace(/^TP\s*\d+\s*[-:\s]*/i, '').trim();
    if(!cleanName) cleanName = tp.name;
    return `
      <div style="font-weight:800; color:var(--accent-dark); white-space:nowrap;">TP ${idx + 1}</div>
      <div style="font-weight:700; color:var(--accent-dark);">:</div>
      <div style="color:var(--ink);">${escHTML(cleanName)}</div>
    `;
  }).join('');
  
  legendBox.innerHTML = `
    <div style="margin-top:12px; background:#f0f5f2; border:1.5px solid var(--accent); border-radius:12px; padding:12px;">
      <div style="font-size:12px; font-weight:800; color:var(--accent-dark); margin-bottom:8px;">📌 Keterangan TP (${escHTML(activeClass)} - ${escHTML(activeMapel)}):</div>
      <div style="display:grid; grid-template-columns: max-content auto 1fr; gap:4px 8px; align-items:start; font-size:11.5px;">
        ${gridRowsHTML}
      </div>
    </div>
  `;
}

function renderTpListUI(pKey){
  const container = document.getElementById('tpListContainer');
  if(!container) return;
  const list = state.tpList[pKey] || [];
  if(list.length === 0){
    container.innerHTML = `<div class="empty-state" style="padding:8px; font-size:11.5px;">Belum ada TP tersimpan untuk kelas ini.</div>`;
    return;
  }
  container.innerHTML = list.map((tp, idx) => `
    <div class="col-manager-item">
      <span style="font-size:11.5px; font-weight:700; color:var(--ink);">${idx + 1}. ${escHTML(tp.name)}</span>
      <button type="button" class="btn-move" style="color:var(--danger); border-color:#f5c2c2;" onclick="deleteTpItem('${pKey}', '${tp.id}')">🗑️ Hapus</button>
    </div>
  `).join('');
}

function addTpItem(){
  const pKey = getPenilaianKey();
  const inputEl = document.getElementById('tpInputName');
  const nameVal = inputEl ? inputEl.value.trim() : '';
  if(!nameVal){ showStatus('⚠️ Masukkan nama/ringkasan TP!'); return; }
  if(!state.tpList) state.tpList = {};
  if(!state.tpList[pKey]) state.tpList[pKey] = [];
  state.tpList[pKey].push({ id: 'tp_' + Date.now(), name: nameVal });
  if(inputEl) inputEl.value = '';
  saveState();
  renderTpListUI(pKey);
  renderPenilaianMatrix();
  addActivityLog(`Menambahkan TP: ${nameVal}`);
  showStatus(`TP "${nameVal}" ditambahkan`);
}

function deleteTpItem(pKey, tpId){
  if(state.tpList && state.tpList[pKey]){
    state.tpList[pKey] = state.tpList[pKey].filter(x => x.id !== tpId);
    saveState();
    renderTpListUI(pKey);
    renderPenilaianMatrix();
    showStatus('TP dihapus');
  }
}

function saveGradeCell(stGradesKey, field, valStr){
  if(!state.grades) state.grades = {};
  if(!state.grades[stGradesKey]) state.grades[stGradesKey] = {};
  state.grades[stGradesKey][field] = valStr !== '' ? parseFloat(valStr) : '';
  saveState();
  renderPenilaianMatrix();
}