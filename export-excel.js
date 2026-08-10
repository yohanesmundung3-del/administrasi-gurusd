function exportGradesToExcel(){
  if(!window.XLSX){ showAlertModal('Modul Belum Siap', 'Library SheetJS belum siap.', 'warning'); return; }
  const pKey = getPenilaianKey();
  const activeClass = document.getElementById('pKelasSelect')?.value || 'Kelas 4';
  const activeMapel = document.getElementById('pMapelSelect')?.value || 'Pendidikan Agama Kristen';
  const classStudents = getSortedStudents(activeClass);
  const currentTps = state.tpList[pKey] || [];
  if(classStudents.length === 0){ showAlertModal('Data Siswa Kosong', 'Belum ada siswa terdaftar di kelas ini!', 'warning'); return; }

  const aoa = [
    [`DAFTAR NILAI ASESMEN SUMATIF & DESKRIPSI RAPOR (KURIKULUM MERDEKA)`],
    [`MATA PELAJARAN: ${activeMapel.toUpperCase()} - ${activeClass.toUpperCase()}`],
    [`SEMESTER ${state.meta.semester || 'GENAP'} TAHUN PELAJARAN ${state.meta.tahunAjaran || ''}`],
    []
  ];

  let headRow = ["No", "NISN/NIS", "Nama Siswa", "L/P"];
  currentTps.forEach(tp => headRow.push(tp.name));
  headRow.push("Rata SLM", "SAS", "Nilai Akhir (NA)", "Deskripsi Capaian Rapor");
  aoa.push(headRow);

  classStudents.forEach((st, idx) => {
    const stGradesKey = `${pKey}_${st.id}`;
    const g = state.grades[stGradesKey] || {};
    let row = [idx + 1, st.nis || '', st.nama || '', st.jk || ''];

    let totalSlm = 0, countSlm = 0;
    let highestTp = { score: -1, name: '' }, lowestTp = { score: 999, name: '' };

    currentTps.forEach(tp => {
      const scoreVal = g[tp.id] !== undefined ? g[tp.id] : '';
      row.push(scoreVal);
      const numScore = parseFloat(scoreVal);
      if(!isNaN(numScore) && scoreVal !== ''){
        totalSlm += numScore; countSlm++;
        if(numScore > highestTp.score){ highestTp.score = numScore; highestTp.name = tp.name; }
        if(numScore < lowestTp.score){ lowestTp.score = numScore; lowestTp.name = tp.name; }
      }
    });

    const avgSlm = countSlm > 0 ? Math.round(totalSlm / countSlm) : 0;
    const sasVal = g['SAS'] !== undefined ? g['SAS'] : '';
    const numSas = parseFloat(sasVal);

    let finalNa = 0;
    if(countSlm > 0 && !isNaN(numSas) && sasVal !== ''){ finalNa = Math.round((avgSlm + numSas) / 2); }
    else if(countSlm > 0){ finalNa = avgSlm; }
    else if(!isNaN(numSas)){ finalNa = numSas; }

    let deskripsiText = '-';
    if(countSlm > 0){
      let parts = [];
      if(highestTp.score >= 75) parts.push(`Menunjukkan penguasaan sangat baik dalam ${highestTp.name}`);
      if(lowestTp.score < 75 && lowestTp.name !== highestTp.name) parts.push(`Perlu bimbingan lebih lanjut dalam ${lowestTp.name}`);
      else if(parts.length === 0) parts.push(`Menunjukkan penguasaan yang cukup dalam materi mapel ${activeMapel}`);
      deskripsiText = parts.join('. ') + '.';
    }

    row.push(countSlm > 0 ? avgSlm : '', sasVal, finalNa || '', deskripsiText);
    aoa.push(row);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, 'LegerNilai');
  XLSX.writeFile(wb, `Leger-Nilai-${activeMapel}-${activeClass}.xlsx`);
  showStatus('📊 Berhasil mengunduh Leger Nilai (.xlsx)');
}


function exportToExcel(){
  if(!window.XLSX){
    alert('Library SheetJS belum siap.');
    return;
  }

  const activeClass = document.getElementById('rekapClassSelect')?.value || 'Kelas 4';
  const classStudents = getSortedStudents(activeClass);

  if(classStudents.length === 0){
    alert('Belum ada data siswa di kelas ini!');
    return;
  }

  const m = state.meta || {};
  const mode = document.getElementById('rekapModeSelect')?.value || 'bulanan';
  const semesterChoice = document.getElementById('rekapSemesterSelect')?.value || 'Ganjil';
  const bulanNama = m.bulan || 'Januari';
  const tahunNum = parseInt(m.tahun) || new Date().getFullYear();

  const aoa = [];

  if(mode === 'semester' || mode === 'tahunan'){
    const modeTitle = (mode === 'tahunan') ? '1 TAHUN AJARAN' : `SEMESTER ${semesterChoice.toUpperCase()}`;
    aoa.push([`LAPORAN REKAPITULASI PRESENSI SISWA ${modeTitle}`]);
    aoa.push([`TAHUN PELAJARAN ${m.tahunAjaran||''}`]);
    aoa.push([]);
    aoa.push(["Nama Sekolah", ": " + (m.sekolah || ''), "", "Wali Kelas / Guru", ": " + (m.guru || '')]);
    aoa.push(["Kelas / Fase", ": " + activeClass, "", "Mata Pelajaran", ": " + (m.mapel || 'Semua Mapel')]);
    aoa.push([]);

    let monthsInMode = [];
    if(mode === 'tahunan') monthsInMode = [0,1,2,3,4,5,6,7,8,9,10,11];
    else if(semesterChoice === 'Ganjil') monthsInMode = [6,7,8,9,10,11];
    else monthsInMode = [0,1,2,3,4,5];

    const headRow = ["No", "NISN/NIS", "Nama Siswa", "L/P"];
    monthsInMode.forEach(mIdx => headRow.push(SHORT_MONTHS_ID[mIdx]));
    headRow.push("Total H", "Total S", "Total I", "Total A", "% Kehadiran");
    aoa.push(headRow);

    classStudents.forEach((st, idx) => {
      const row = [idx + 1, st.nis || '', st.nama || '', st.jk || ''];
      let totH = 0, totS = 0, totI = 0, totA = 0;

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
        row.push(`${mH}H ${mS>0?mS+'S ':''}${mI>0?mI+'I ':''}${mA>0?mA+'A':''}`);
      });

      const totEff = totH + totS + totI + totA;
      const pct = totEff > 0 ? Math.round((totH / totEff) * 100) : 0;
      row.push(totH, totS, totI, totA, `${pct}%`);
      aoa.push(row);
    });

  } else {
    const monthIdx = MONTHS_ID.indexOf(bulanNama);
    const totalDays = (monthIdx !== -1) ? new Date(tahunNum, monthIdx + 1, 0).getDate() : 31;

    aoa.push(["BUKU PRESENSI & REKAPITULASI KEHADIRAN SISWA"]);
    aoa.push([`SEMESTER ${(m.semester||'').toUpperCase()} TAHUN PELAJARAN ${m.tahunAjaran||''}`]);
    aoa.push([`BULAN ${bulanNama.toUpperCase()} ${tahunNum}`]);
    aoa.push([]);
    aoa.push(["Nama Sekolah", ": " + (m.sekolah || ''), "", "Wali Kelas / Guru", ": " + (m.guru || '')]);
    aoa.push(["Kelas / Fase", ": " + activeClass, "", "Mata Pelajaran", ": " + (m.mapel || 'Semua Mapel')]);
    aoa.push([]);

    const headRow1 = ["No", "NISN/NIS", "Nama Siswa", "L/P"];
    for(let d = 1; d <= totalDays; d++) headRow1.push(String(d));
    headRow1.push("H", "S", "I", "A", "%");
    aoa.push(headRow1);

    classStudents.forEach((st, idx) => {
      const row = [idx + 1, st.nis || '', st.nama || '', st.jk || ''];
      let countH = 0, countS = 0, countI = 0, countA = 0;

      for(let d = 1; d <= totalDays; d++){
        const dayStr = String(d).padStart(2,'0');
        const monthStr = String((monthIdx !== -1 ? monthIdx : 0) + 1).padStart(2,'0');
        const dateISO = `${tahunNum}-${monthStr}-${dayStr}`;

        const rec = state.attendance[dateISO] ? state.attendance[dateISO][st.id] : null;
        let stVal = rec ? (rec.status || '') : '';
        if(stVal === 'H') countH++;
        else if(stVal === 'S') countS++;
        else if(stVal === 'I') countI++;
        else if(stVal === 'A') countA++;

        row.push(stVal);
      }

      const totalEff = countH + countS + countI + countA;
      const pct = totalEff > 0 ? Math.round((countH / totalEff) * 100) : 0;
      row.push(countH, countS, countI, countA, `${pct}%`);

      aoa.push(row);
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  XLSX.utils.book_append_sheet(wb, ws, activeClass);
  XLSX.writeFile(wb, `Absensi-${activeClass}-${mode.toUpperCase()}-${tahunNum}.xlsx`);
  addActivityLog(`Mengunduh laporan Excel (.xlsx) ${activeClass}`);
  showStatus('📊 Berhasil mengunduh File Excel (.xlsx)');
}

