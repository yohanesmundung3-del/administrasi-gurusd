function syncRekapDateAndRender(){
  const elBulan = document.getElementById('rekapBulanSelect');
  const elTahun = document.getElementById('rekapTahunInput');

  if(elBulan && elBulan.value) state.meta.bulan = elBulan.value;
  if(elTahun && elTahun.value) state.meta.tahun = elTahun.value;

  const mBulan = document.getElementById('mBulan');
  const mTahun = document.getElementById('mTahun');
  if(mBulan) mBulan.value = state.meta.bulan;
  if(mTahun) mTahun.value = state.meta.tahun;

  saveState();
  renderMonthlyMatrix();
  renderCalendarUI();
}


function toggleRekapModeUI(){
  const mode = document.getElementById('rekapModeSelect')?.value || 'bulanan';
  const ctrlBulanan = document.getElementById('rekapBulananControls');
  const ctrlSemester = document.getElementById('rekapSemesterControls');

  if(mode === 'bulanan'){
    if(ctrlBulanan) ctrlBulanan.style.display = 'grid';
    if(ctrlSemester) ctrlSemester.style.display = 'none';
  } else {
    if(ctrlBulanan) ctrlBulanan.style.display = 'none';
    if(ctrlSemester) ctrlSemester.style.display = 'block';
  }
}


function updateRekapFilterBadge(){
  const badgeEl = document.getElementById('rekapFilterBadgeText');
  if(!badgeEl) return;

  const mode = document.getElementById('rekapModeSelect')?.value || 'bulanan';
  const kelas = document.getElementById('rekapClassSelect')?.value || 'Kelas 4';

  if(mode === 'semester'){
    const sem = document.getElementById('rekapSemesterSelect')?.value || 'Ganjil';
    badgeEl.textContent = `⚙️ Filter: Rekap Semester ${sem} • ${kelas}`;
  } else if(mode === 'tahunan'){
    badgeEl.textContent = `⚙️ Filter: Rekap 1 Tahun Ajaran • ${kelas}`;
  } else {
    const bulan = document.getElementById('rekapBulanSelect')?.value || (state.meta.bulan || 'Juli');
    const tahun = document.getElementById('rekapTahunInput')?.value || (state.meta.tahun || '2026');
    badgeEl.textContent = `⚙️ Filter: Rekap Bulanan • ${kelas} • ${bulan} ${tahun}`;
  }
}


function openFilterRekapModal(){
  toggleRekapModeUI();
  updateRekapFilterBadge();
  openModal('modalFilterRekap');
}


function applyFilterRekapModal(){
  const elBulan = document.getElementById('rekapBulanSelect');
  const elTahun = document.getElementById('rekapTahunInput');

  if(elBulan && elBulan.value) state.meta.bulan = elBulan.value;
  if(elTahun && elTahun.value) state.meta.tahun = elTahun.value;

  const mBulan = document.getElementById('mBulan');
  const mTahun = document.getElementById('mTahun');
  if(mBulan) mBulan.value = state.meta.bulan;
  if(mTahun) mTahun.value = state.meta.tahun;

  saveState();
  updateRekapFilterBadge();
  renderMonthlyMatrix();
  closeModal('modalFilterRekap');
  showStatus('Filter laporan rekap diterapkan');
}


function renderAttendanceChartSVG(totalH, totalS, totalI, totalA){
  const totalAbsen = totalH + totalS + totalI + totalA;
  if(totalAbsen === 0){
    return `<div style="text-align:center; padding:12px; font-size:11px; color:var(--muted);">Grafik statistik belum memiliki data absensi.</div>`;
  }

  const pctH = Math.round((totalH / totalAbsen) * 100);
  const pctS = Math.round((totalS / totalAbsen) * 100);
  const pctI = Math.round((totalI / totalAbsen) * 100);
  const pctA = Math.round((totalA / totalAbsen) * 100);

  const maxVal = Math.max(totalH, totalS, totalI, totalA, 1);
  const chartH = 80;

  const barH_H = Math.round((totalH / maxVal) * chartH);
  const barH_S = Math.round((totalS / maxVal) * chartH);
  const barH_I = Math.round((totalI / maxVal) * chartH);
  const barH_A = Math.round((totalA / maxVal) * chartH);

  return `
    <div style="background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:12px; margin-bottom:12px;">
      <div style="font-size:12px; font-weight:700; color:var(--accent-dark); margin-bottom:8px;">📈 Grafik Distribusi Presensi Siswa</div>
      <svg viewBox="0 0 320 160" style="width:100%; height:150px;">
        <line x1="30" y1="30" x2="310" y2="30" stroke="#eee" stroke-dasharray="2"/>
        <line x1="30" y1="82" x2="310" y2="82" stroke="#eee" stroke-dasharray="2"/>
        <line x1="30" y1="135" x2="310" y2="135" stroke="#ccc"/>

        <rect x="45" y="${135 - barH_H}" width="40" height="${barH_H}" fill="#2f6f5e" rx="4"/>
        <text x="65" y="${135 - barH_H - 6}" font-size="10" font-weight="bold" fill="#2f6f5e" text-anchor="middle">${totalH} (${pctH}%)</text>
        <text x="65" y="152" font-size="10" font-weight="bold" fill="var(--ink)" text-anchor="middle">Hadir</text>

        <rect x="115" y="${135 - barH_S}" width="40" height="${barH_S}" fill="#c07f2c" rx="4"/>
        <text x="135" y="${135 - barH_S - 6}" font-size="10" font-weight="bold" fill="#c07f2c" text-anchor="middle">${totalS} (${pctS}%)</text>
        <text x="135" y="152" font-size="10" font-weight="bold" fill="var(--ink)" text-anchor="middle">Sakit</text>

        <rect x="185" y="${135 - barH_I}" width="40" height="${barH_I}" fill="#2980b9" rx="4"/>
        <text x="205" y="${135 - barH_I - 6}" font-size="10" font-weight="bold" fill="#2980b9" text-anchor="middle">${totalI} (${pctI}%)</text>
        <text x="205" y="152" font-size="10" font-weight="bold" fill="var(--ink)" text-anchor="middle">Izin</text>

        <rect x="255" y="${135 - barH_A}" width="40" height="${barH_A}" fill="#b3452f" rx="4"/>
        <text x="275" y="${135 - barH_A - 6}" font-size="10" font-weight="bold" fill="#b3452f" text-anchor="middle">${totalA} (${pctA}%)</text>
        <text x="275" y="152" font-size="10" font-weight="bold" fill="var(--ink)" text-anchor="middle">Alfa</text>
      </svg>
    </div>
  `;
}


function renderMonthlyMatrix(){
  const wrapper = document.getElementById('monthlyMatrixWrapper');
  const table = document.getElementById('monthlyMatrixTable');
  if(!table || !wrapper) return;

  updateRekapFilterBadge();

  const mode = document.getElementById('rekapModeSelect')?.value || 'bulanan';

  if(mode === 'semester' || mode === 'tahunan'){
    renderSemesterMatrix(mode);
    return;
  }

  const savedScrollLeft = wrapper.scrollLeft;
  const savedScrollTop = wrapper.scrollTop;

  const activeClass = document.getElementById('rekapClassSelect')?.value || 'Kelas 4';
  const elBulan = document.getElementById('rekapBulanSelect');
  const elTahun = document.getElementById('rekapTahunInput');

  const bulanNama = (elBulan && elBulan.value) ? elBulan.value : (state.meta.bulan || 'Juli');
  const tahunNum = (elTahun && elTahun.value) ? parseInt(elTahun.value) : (parseInt(state.meta.tahun) || 2026);

  state.meta.bulan = bulanNama;
  state.meta.tahun = tahunNum;

  const monthIdx = MONTHS_ID.indexOf(bulanNama);
  if(monthIdx === -1) return;

  const totalDays = new Date(tahunNum, monthIdx + 1, 0).getDate();
  const classStudents = getSortedStudents(activeClass);

  document.getElementById('stTotalSiswa').textContent = classStudents.length;

  const dateInfos = [];
  const monthlyHolidays = [];

  for(let d = 1; d <= totalDays; d++){
    const dayStr = String(d).padStart(2,'0');
    const monthStr = String(monthIdx + 1).padStart(2,'0');
    const dateISO = `${tahunNum}-${monthStr}-${dayStr}`;

    const dayOfWeekJs = new Date(tahunNum, monthIdx, d).getDay();
    const isWeekend = (dayOfWeekJs === 0 || dayOfWeekJs === 6);

    const dayStatus = getResolvedDayStatus(dateISO);
    const isHoliday = dayStatus && dayStatus.status === 'libur';
    const hasCustomNote = dayStatus && dayStatus.ket && dayStatus.ket.trim() !== '';

    if(isHoliday && hasCustomNote){
      monthlyHolidays.push({ day: d, dateISO: dateISO, ket: dayStatus.ket.trim() });
    }

    dateInfos.push({ day: d, dateISO: dateISO, isWeekend: isWeekend, isHoliday: isHoliday, isMerged: isWeekend || isHoliday });
  }

  let totalL = 0, totalP = 0, totalUnsetJk = 0;
  classStudents.forEach(st => {
    const jkUpper = (st.jk || '').toUpperCase().trim();
    if(jkUpper === 'L') totalL++;
    else if(jkUpper === 'P') totalP++;
    else totalUnsetJk++;
  });

  const statsContent = document.getElementById('rekapStudentStatsContent');
  const holidayContent = document.getElementById('rekapHolidayLegendContent');

  if(statsContent){
    let statsHTML = `<div style="display:grid; grid-template-columns: max-content auto 1fr; gap:3px 6px; align-items:start;">`;
    statsHTML += `<div>Total Siswa</div><div>:</div><div><b>${classStudents.length}</b></div>`;
    statsHTML += `<div>Laki-laki (L)</div><div>:</div><div><b>${totalL}</b></div>`;
    statsHTML += `<div>Perempuan (P)</div><div>:</div><div><b>${totalP}</b></div>`;
    if(totalUnsetJk > 0) statsHTML += `<div>Belum diisi L/P</div><div>:</div><div><b>${totalUnsetJk}</b></div>`;
    statsHTML += `</div>`;
    statsContent.innerHTML = statsHTML;
  }

  const groupedHolidays = groupConsecutiveHolidays(monthlyHolidays, bulanNama, tahunNum);

  if(holidayContent){
    if(groupedHolidays.length > 0){
      holidayContent.innerHTML = `<div style="display:grid; grid-template-columns: max-content auto 1fr; gap:3px 6px; align-items:start;">` + 
        groupedHolidays.map(h => `
          <div style="font-weight:700; white-space:nowrap;">• ${h.rangeStr}</div>
          <div style="font-weight:700;">:</div>
          <div>${escHTML(h.ket)}</div>
        `).join('') + 
        `</div>`;
    } else {
      holidayContent.innerHTML = `<i style="color:var(--muted);">Tidak ada tanggal libur dengan keterangan khusus bulan ini.</i>`;
    }
  }

  let headHTML = `
    <thead>
      <tr>
        <th rowspan="2">No</th>
        <th rowspan="2">Nama Siswa (${activeClass})</th>
        <th rowspan="2">NISN/NIS</th>
        <th rowspan="2">L/P</th>
        <th colspan="${totalDays}">Tanggal (${bulanNama} ${tahunNum})</th>
        <th colspan="4">Rekap</th>
        <th rowspan="2">%</th>
      </tr>
      <tr>
  `;

  for(let d = 1; d <= totalDays; d++){
    headHTML += `<th>${d}</th>`;
  }
  headHTML += `<th>H</th><th>S</th><th>I</th><th>A</th></tr></thead>`;

  let bodyHTML = '<tbody>';
  let grandTotalH = 0, grandTotalS = 0, grandTotalI = 0, grandTotalA = 0;
  let grandTotalPossible = 0;
  let countWarningSiswa = 0;

  if(classStudents.length === 0){
    bodyHTML += `<tr><td colspan="${totalDays + 9}" style="padding:20px;">Belum ada siswa di <b>${activeClass}</b>.</td></tr>`;
  } else {
    classStudents.forEach((st, idx) => {
      let countH = 0, countS = 0, countI = 0, countA = 0;
      let daysCells = '';

      dateInfos.forEach((info) => {
        const dayRecord = state.attendance ? state.attendance[info.dateISO] : null;
        const rec = dayRecord ? dayRecord[st.id] : null;

        let stVal = '';
        let noteStr = '';
        if (rec && rec.status !== undefined && rec.status !== '') {
          stVal = rec.status;
          noteStr = rec.note ? ` [Alasan: ${rec.note.trim()}]` : '';
        } else if (info.isHoliday && !info.isWeekend) {
          stVal = 'L';
        } else {
          stVal = '';
        }

        if(stVal === 'H') countH++;
        else if(stVal === 'S') countS++;
        else if(stVal === 'I') countI++;
        else if(stVal === 'A') countA++;

        let cellCls = info.isMerged ? 'weekend' : '';
        if(stVal === 'H') cellCls += ' cell-h';
        if(stVal === 'S') cellCls += ' cell-s';
        if(stVal === 'I') cellCls += ' cell-i';
        if(stVal === 'A') cellCls += ' cell-a';

        daysCells += `<td class="${cellCls} clickable-cell" title="${escAttr(st.nama)} (Tgl ${info.day}): ${stVal}${escAttr(noteStr)}" onclick="openQuickEditCell('${info.dateISO}', '${st.id}', '${escAttr(st.nama)}', ${info.day})">${stVal}</td>`;
      });

      const totalEffectiveDays = countH + countS + countI + countA;
      const pct = totalEffectiveDays > 0 ? Math.round((countH / totalEffectiveDays) * 100) : 0;

      const isWarning = (countA >= 3) || ((countS + countI + countA) >= 5);
      if(isWarning) countWarningSiswa++;

      const warnBadgeHTML = isWarning ? `<span class="warn-badge">⚠️ Perlu Pembinaan</span>` : '';

      grandTotalH += countH; grandTotalS += countS; grandTotalI += countI; grandTotalA += countA;
      grandTotalPossible += totalEffectiveDays;

      bodyHTML += `
        <tr>
          <td>${idx + 1}</td>
          <td style="text-align:left; font-weight:700;" title="${escAttr(st.nama)}">${escHTML(st.nama)}${warnBadgeHTML}</td>
          <td>${escHTML(st.nis || '')}</td>
          <td>${escHTML(st.jk || '')}</td>
          ${daysCells}
          <td class="cell-h">${countH || 0}</td>
          <td class="cell-s">${countS || 0}</td>
          <td class="cell-i">${countI || 0}</td>
          <td class="cell-a">${countA || 0}</td>
          <td style="font-weight:700;">${pct}%</td>
        </tr>
      `;
    });
  }

  bodyHTML += '</tbody>';
  table.innerHTML = headHTML + bodyHTML;

  const chartWrapper = document.getElementById('rekapChartContainer') || document.createElement('div');
  chartWrapper.id = 'rekapChartContainer';
  chartWrapper.innerHTML = renderAttendanceChartSVG(grandTotalH, grandTotalS, grandTotalI, grandTotalA);
  
  if(!document.getElementById('rekapChartContainer')){
    wrapper.parentNode.insertBefore(chartWrapper, wrapper);
  }

  wrapper.scrollLeft = savedScrollLeft;
  wrapper.scrollTop = savedScrollTop;

  const avgPct = grandTotalPossible > 0 ? Math.round((grandTotalH / grandTotalPossible) * 100) : 0;
  document.getElementById('stRataHadir').textContent = `${avgPct}%`;
  document.getElementById('stTotalAbsen').textContent = (grandTotalS + grandTotalI + grandTotalA);
  
  const warnEl = document.getElementById('stWarningSiswa');
  if(warnEl) warnEl.textContent = countWarningSiswa;
}


function renderSemesterMatrix(mode){
  const table = document.getElementById('monthlyMatrixTable');
  if(!table) return;

  const activeClass = document.getElementById('rekapClassSelect')?.value || 'Kelas 4';
  const classStudents = getSortedStudents(activeClass);
  const semesterChoice = document.getElementById('rekapSemesterSelect')?.value || 'Ganjil';
  const tahunNum = parseInt(state.meta.tahun) || 2026;

  let monthsInMode = [];
  if(mode === 'tahunan'){
    monthsInMode = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  } else if(semesterChoice === 'Ganjil'){
    monthsInMode = [6, 7, 8, 9, 10, 11];
  } else {
    monthsInMode = [0, 1, 2, 3, 4, 5];
  }

  let headHTML = `
    <thead>
      <tr>
        <th rowspan="2">No</th>
        <th rowspan="2">Nama Siswa (${activeClass})</th>
        <th rowspan="2">NISN/NIS</th>
        <th rowspan="2">L/P</th>
        <th colspan="${monthsInMode.length}">Rincian Kehadiran Per Bulan</th>
        <th colspan="4">Total Kehadiran (${mode === 'tahunan' ? '1 Tahun' : 'Semester ' + semesterChoice})</th>
        <th rowspan="2">% Total</th>
      </tr>
      <tr>
  `;

  monthsInMode.forEach(mIdx => {
    headHTML += `<th>${SHORT_MONTHS_ID[mIdx]}</th>`;
  });
  headHTML += `<th>H</th><th>S</th><th>I</th><th>A</th></tr></thead>`;

  let bodyHTML = '<tbody>';
  let grandTotalH = 0, grandTotalS = 0, grandTotalI = 0, grandTotalA = 0;

  if(classStudents.length === 0){
    bodyHTML += `<tr><td colspan="${monthsInMode.length + 9}" style="padding:20px;">Belum ada siswa di <b>${activeClass}</b>.</td></tr>`;
  } else {
    classStudents.forEach((st, idx) => {
      let totH = 0, totS = 0, totI = 0, totA = 0;
      let monthCells = '';

      monthsInMode.forEach(mIdx => {
        let mH = 0, mS = 0, mI = 0, mA = 0;
        const totalDays = new Date(tahunNum, mIdx + 1, 0).getDate();

        for(let d = 1; d <= totalDays; d++){
          const dayStr = String(d).padStart(2,'0');
          const monthStr = String(mIdx + 1).padStart(2,'0');
          const dateISO = `${tahunNum}-${monthStr}-${dayStr}`;

          const rec = state.attendance[dateISO] ? state.attendance[dateISO][st.id] : null;
          if(rec && rec.status === 'H') mH++;
          else if(rec && rec.status === 'S') mS++;
          else if(rec && rec.status === 'I') mI++;
          else if(rec && rec.status === 'A') mA++;
        }

        totH += mH; totS += mS; totI += mI; totA += mA;
        monthCells += `<td style="font-size:10px;">${mH}H ${mS>0?mS+'S ':''}${mI>0?mI+'I ':''}${mA>0?mA+'A':''}</td>`;
      });

      const totEff = totH + totS + totI + totA;
      const pct = totEff > 0 ? Math.round((totH / totEff) * 100) : 0;

      grandTotalH += totH; grandTotalS += totS; grandTotalI += totI; grandTotalA += totA;

      bodyHTML += `
        <tr>
          <td>${idx + 1}</td>
          <td style="text-align:left; font-weight:700;">${escHTML(st.nama)}</td>
          <td>${escHTML(st.nis || '')}</td>
          <td>${escHTML(st.jk || '')}</td>
          ${monthCells}
          <td class="cell-h">${totH}</td>
          <td class="cell-s">${totS}</td>
          <td class="cell-i">${totI}</td>
          <td class="cell-a">${totA}</td>
          <td style="font-weight:700;">${pct}%</td>
        </tr>
      `;
    });
  }

  bodyHTML += '</tbody>';
  table.innerHTML = headHTML + bodyHTML;

  const chartWrapper = document.getElementById('rekapChartContainer') || document.createElement('div');
  chartWrapper.id = 'rekapChartContainer';
  chartWrapper.innerHTML = renderAttendanceChartSVG(grandTotalH, grandTotalS, grandTotalI, grandTotalA);
}

/* LOGIKA POPUP MODAL PENILAIAN MAPEL & SOAL UJIAN */

function printFromRekap(){
  openExportPdfModal();
  const rekapMode = document.getElementById('rekapModeSelect')?.value || 'bulanan';
  const activeClass = document.getElementById('rekapClassSelect')?.value || 'Kelas 4';
  
  const reportTypeSel = document.getElementById('pdfReportTypeSelect');
  if(reportTypeSel){
    reportTypeSel.value = rekapMode;
    togglePdfReportTypeUI();
  }

  const pdfClassSel = document.getElementById('pdfClassSelect');
  if(pdfClassSel && activeClass) pdfClassSel.value = activeClass;

  if(rekapMode === 'bulanan'){
    const rekapBulan = document.getElementById('rekapBulanSelect')?.value;
    const rekapTahun = document.getElementById('rekapTahunInput')?.value;
    const pdfBulanSel = document.getElementById('pdfBulanSelect');
    const pdfTahunInp = document.getElementById('pdfTahunInput');
    if(pdfBulanSel && rekapBulan) pdfBulanSel.value = rekapBulan;
    if(pdfTahunInp && rekapTahun) pdfTahunInp.value = rekapTahun;
  } else {
    const rekapSem = document.getElementById('rekapSemesterSelect')?.value;
    const pdfSemSel = document.getElementById('pdfSemesterChoiceSelect');
    if(pdfSemSel && rekapSem) pdfSemSel.value = rekapSem;
  }

  updatePdfFileNamePreview();
}

