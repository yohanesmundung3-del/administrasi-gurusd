/* ==========================================================================
    MODUL GENERATOR PDF ABSENSI: BULANAN, SEMESTER & TAHUNAN (JS/PDF-ABSENSI.JS)
    ========================================================================== */

function generateAbsensiPdf(reportType, actionType = 'download', fileName = ''){
  if(typeof savePdfColWidthsConfig === 'function') savePdfColWidthsConfig();
  saveState();
  const { jsPDF } = window.jspdf;
  const m = state.meta || {};
  const paperVal = document.getElementById('cfgPaper')?.value || 'f4';
  const fontVal = document.getElementById('cfgFont')?.value || 'helvetica';
  const fontSizeVal = parseInt(document.getElementById('cfgFontSize')?.value) || 10;
  const marginX = parseInt(document.getElementById('cfgMargin')?.value) || 20;
  const rowHeightVal = parseFloat(document.getElementById('cfgRowHeight')?.value) || 5;
  const showNis = m.pdfShowNis ?? true;
  const showPct = m.pdfShowPct ?? false;
  const showKet = m.pdfShowKet ?? false;
  const selectedClassOption = document.getElementById('pdfClassSelect')?.value || 'Kelas 4';
  
  let formatOption = 'a4';
  if(paperVal === 'f4') formatOption = [215.9, 330.2];
  else formatOption = paperVal;
  
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: formatOption });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  
  let classesToPrint = [];
  if(selectedClassOption === 'ALL'){
    const uniqueClasses = [...new Set(state.students.map(st => st.kelas || 'Kelas 4'))];
    classesToPrint = uniqueClasses.length > 0 ? uniqueClasses : ['Kelas 4'];
  } else {
    classesToPrint = [selectedClassOption];
  }
  
  classesToPrint.forEach((targetClass, classIndex) => {
    if(classIndex > 0) doc.addPage();
    doc.setTextColor(0, 0, 0);
    const classStudents = getSortedStudents(targetClass);
    let totalL = 0, totalP = 0, totalUnsetJk = 0;
    classStudents.forEach(st => {
      const jkUpper = (st.jk || '').toUpperCase().trim();
      if(jkUpper === 'L') totalL++;
      else if(jkUpper === 'P') totalP++;
      else totalUnsetJk++;
    });
    
    let y = 34;
    let groupedPdfHolidays = [];
    
    if(reportType === 'semester' || reportType === 'tahunan'){
      const semChoice = document.getElementById('pdfSemesterChoiceSelect')?.value || 'Ganjil';
      const semTahunNum = parseInt(document.getElementById('pdfTahunSemesterInput')?.value) || 2026;
      const mainTitle = (reportType === 'tahunan') ? 'LAPORAN REKAPITULASI PRESENSI 1 TAHUN AJARAN' : `LAPORAN REKAPITULASI PRESENSI SEMESTER ${semChoice.toUpperCase()}`;
      
      doc.setFont(fontVal, 'bold'); doc.setFontSize(13);
      doc.text(mainTitle, pageW / 2, 14, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`TAHUN PELAJARAN ${m.tahunAjaran||''}`, pageW / 2, 20, { align: 'center' });
      doc.setFontSize(9.5);
      
      const rightX = pageW / 2 + 10;
      const renderMetaLine = (label, value, x, labelW) => {
        doc.setFont(fontVal, 'normal'); doc.text(label, x, y); doc.text(':', x + labelW, y);
        doc.setFont(fontVal, 'bold'); doc.text(value || '', x + labelW + 3, y);
      };
      
      renderMetaLine('Nama Sekolah', m.sekolah, marginX, 26);
      renderMetaLine('Wali Kelas / Guru', m.guru, rightX, 28);
      y += 5.5;
      renderMetaLine('Kelas / Fase', targetClass, marginX, 26);
      renderMetaLine('Mata Pelajaran', m.mapel || 'Semua Mapel', rightX, 28);
      
      let monthsInMode = [];
      if(reportType === 'tahunan') monthsInMode = [0,1,2,3,4,5,6,7,8,9,10,11];
      else if(semChoice === 'Ganjil') monthsInMode = [6,7,8,9,10,11];
      else monthsInMode = [0,1,2,3,4,5];
      
      let headRow = [{ content: 'No' }];
      if(showNis) headRow.push({ content: 'NISN/NIS' });
      headRow.push({ content: 'Nama Siswa' }, { content: 'L/P' });
      monthsInMode.forEach(mIdx => headRow.push({ content: SHORT_MONTHS_ID[mIdx] }));
      headRow.push({ content: 'H' }, { content: 'S' }, { content: 'I' }, { content: 'A' }, { content: '%' });
      
      const body = classStudents.map((st, i) => {
        let row = [i + 1];
        if(showNis) row.push(st.nis || '');
        row.push(st.nama || '', st.jk || '');
        let totH = 0, totS = 0, totI = 0, totA = 0;
        monthsInMode.forEach(mIdx => {
          let mH = 0, mS = 0, mI = 0, mA = 0;
          const totalDays = new Date(semTahunNum, mIdx + 1, 0).getDate();
          for(let d = 1; d <= totalDays; d++){
            const dayStr = String(d).padStart(2,'0');
            const monthStr = String(mIdx + 1).padStart(2,'0');
            const dateISO = `${semTahunNum}-${monthStr}-${dayStr}`;
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
        return row;
      });

      const colCfg = (state.meta && state.meta.colWidths && state.meta.colWidths[reportType]) ? state.meta.colWidths[reportType] : {};
      let columnStyles = {};
      let currIdx = 0;

      const cNo = getWidthVal(colCfg.no, 7);
      const cNis = getWidthVal(colCfg.nis, 25);
      const cNama = getWidthVal(colCfg.nama, 'auto');
      const cJk = getWidthVal(colCfg.jk, 8);
      const cBulan = getWidthVal(colCfg.bulan, reportType === 'tahunan' ? 11 : 15);
      const cRekap = getWidthVal(colCfg.rekap, 6.5);
      const cPct = getWidthVal(colCfg.pct, 11);

      columnStyles[currIdx++] = { cellWidth: cNo, halign: 'center' };
      if(showNis){ columnStyles[currIdx++] = { cellWidth: cNis, halign: 'center' }; }
      columnStyles[currIdx++] = { cellWidth: cNama, halign: 'left' };
      columnStyles[currIdx++] = { cellWidth: cJk, halign: 'center' };

      monthsInMode.forEach(() => {
        columnStyles[currIdx++] = { cellWidth: cBulan, halign: 'center' };
      });
      for(let r = 0; r < 4; r++){
        columnStyles[currIdx++] = { cellWidth: cRekap, halign: 'center' };
      }
      columnStyles[currIdx++] = { cellWidth: cPct, halign: 'center' };
      
      doc.autoTable({
        theme: 'grid', head: [headRow], body, startY: y + 4,
        margin: { top: 10, left: marginX, right: marginX, bottom: 14 },
        styles: { font: fontVal, fontSize: fontSizeVal, textColor: [0,0,0], cellPadding: 1, valign: 'middle', lineColor: [60,60,60], lineWidth: 0.1 },
        headStyles: { fillColor: [234, 232, 222], textColor: [0,0,0], fontStyle: 'bold', halign: 'center', fontSize: Math.min(fontSizeVal, 9.5) },
        bodyStyles: { fillColor: [255,255,255], textColor: [0,0,0], minCellHeight: rowHeightVal },
        columnStyles
      });
    } else {
      const selectedBulanNama = document.getElementById('pdfBulanSelect')?.value || (m.bulan || 'Juli');
      const selectedTahunNum = parseInt(document.getElementById('pdfTahunInput')?.value) || (parseInt(m.tahun) || 2026);
      const isBlankMode = document.getElementById('pdfBlankMode')?.checked || false;
      
      const monthIdx = MONTHS_ID.indexOf(selectedBulanNama);
      const totalDays = (monthIdx !== -1) ? new Date(selectedTahunNum, monthIdx + 1, 0).getDate() : 31;
      
      const dateInfos = [];
      const pdfMonthlyHolidays = [];
      for(let d = 1; d <= totalDays; d++){
        const dayStr = String(d).padStart(2,'0');
        const monthStr = String((monthIdx !== -1 ? monthIdx : 0) + 1).padStart(2,'0');
        const dateISO = `${selectedTahunNum}-${monthStr}-${dayStr}`;
        const dayOfWeekJs = new Date(selectedTahunNum, monthIdx !== -1 ? monthIdx : 0, d).getDay();
        const isWeekend = (dayOfWeekJs === 0 || dayOfWeekJs === 6);
        const dayStatus = getResolvedDayStatus(dateISO);
        const isHoliday = dayStatus && dayStatus.status === 'libur';
        const hasCustomNote = dayStatus && dayStatus.ket && dayStatus.ket.trim() !== '';
        if(isHoliday && hasCustomNote){
          pdfMonthlyHolidays.push({ day: d, dateISO: dateISO, ket: dayStatus.ket.trim() });
        }
        dateInfos.push({ day: d, dateISO: dateISO, isWeekend: isWeekend, isHoliday: isHoliday, isMerged: isWeekend || isHoliday });
      }
      
      groupedPdfHolidays = groupConsecutiveHolidays(pdfMonthlyHolidays, selectedBulanNama, selectedTahunNum);
      
      doc.setFont(fontVal, 'bold'); doc.setFontSize(13);
      doc.text('BUKU PRESENSI & REKAPITULASI KEHADIRAN SISWA', pageW / 2, 14, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`SEMESTER ${(m.semester||'').toUpperCase()} TAHUN PELAJARAN ${m.tahunAjaran||''}`, pageW / 2, 20, { align: 'center' });
      doc.text(`BULAN ${selectedBulanNama.toUpperCase()} ${selectedTahunNum}`, pageW / 2, 26, { align: 'center' });
      doc.setFontSize(9.5);
      
      const rightX = pageW / 2 + 10;
      const renderMetaLine = (label, value, x, labelW) => {
        doc.setFont(fontVal, 'normal'); doc.text(label, x, y); doc.text(':', x + labelW, y);
        doc.setFont(fontVal, 'bold'); doc.text(value || '', x + labelW + 3, y);
      };
      
      renderMetaLine('Nama Sekolah', m.sekolah, marginX, 26);
      renderMetaLine('Wali Kelas / Guru', m.guru, rightX, 28);
      y += 5.5;
      renderMetaLine('Kelas / Fase', targetClass, marginX, 26);
      renderMetaLine('Mata Pelajaran', m.mapel || 'Semua Mapel', rightX, 28);
      
      let headRow1 = [{ content: 'No', rowSpan: 2 }];
      if(showNis) headRow1.push({ content: 'NISN/NIS', rowSpan: 2 });
      headRow1.push({ content: 'Nama Siswa', rowSpan: 2 });
      headRow1.push({ content: 'L/P', rowSpan: 2 });
      headRow1.push({ content: `TANGGAL BULAN ${selectedBulanNama.toUpperCase()} ${selectedTahunNum}`, colSpan: totalDays });
      headRow1.push({ content: 'REKAP', colSpan: 4 });
      if(showPct) headRow1.push({ content: '%', rowSpan: 2 });
      if(showKet) headRow1.push({ content: 'Ket', rowSpan: 2 });
      
      let headRow2 = [];
      for(let d = 1; d <= totalDays; d++) headRow2.push({ content: String(d) });
      headRow2.push({ content: 'H' }, { content: 'S' }, { content: 'I' }, { content: 'A' });
      
      const body = classStudents.map((st, i) => {
        let row = [i + 1];
        if(showNis) row.push(st.nis || '');
        row.push(st.nama || '', st.jk || '');
        let countH = 0, countS = 0, countI = 0, countA = 0;
        dateInfos.forEach((info) => {
          if(isBlankMode){
            row.push('');
          } else {
            const dayRecord = state.attendance ? state.attendance[info.dateISO] : null;
            const rec = dayRecord ? dayRecord[st.id] : null;
            let stVal = '';
            if (rec && rec.status !== undefined && rec.status !== '') {
              stVal = rec.status;
            } else if (info.isHoliday && !info.isWeekend) {
              stVal = 'L';
            } else {
              stVal = '';
            }
            if(stVal === 'H') countH++;
            else if(stVal === 'S') countS++;
            else if(stVal === 'I') countI++;
            else if(stVal === 'A') countA++;
            row.push(stVal);
          }
        });
        if(isBlankMode){
          row.push('', '', '', '');
          if(showPct) row.push('');
          if(showKet) row.push('');
        } else {
          const totalEffective = countH + countS + countI + countA;
          const pct = totalEffective > 0 ? Math.round((countH / totalEffective) * 100) : 0;
          row.push(countH, countS, countI, countA);
          if(showPct) row.push(`${pct}%`);
          if(showKet) row.push('');
        }
        return row;
      });

      const colCfg = (state.meta && state.meta.colWidths && state.meta.colWidths['bulanan']) ? state.meta.colWidths['bulanan'] : {};
      let columnStyles = {};
      let currIdx = 0;

      const cNo = getWidthVal(colCfg.no, 7);
      const cNis = getWidthVal(colCfg.nis, 25);
      const cNama = getWidthVal(colCfg.nama, 'auto');
      const cJk = getWidthVal(colCfg.jk, 8);
      const cTgl = getWidthVal(colCfg.tanggal, 5);
      const cRekap = getWidthVal(colCfg.rekap, 6.5);
      const cPct = getWidthVal(colCfg.pct, 9.5);
      const cKet = getWidthVal(colCfg.ket, 11);

      columnStyles[currIdx++] = { cellWidth: cNo, halign: 'center' };
      if(showNis){ columnStyles[currIdx++] = { cellWidth: cNis, halign: 'center' }; }
      columnStyles[currIdx++] = { cellWidth: cNama, halign: 'left' };
      columnStyles[currIdx++] = { cellWidth: cJk, halign: 'center' };

      const dateStartIdx = currIdx;
      const dateFontSize = (typeof cTgl === 'number' && cTgl >= 5.5) ? fontSizeVal : ((typeof cTgl === 'number' && cTgl >= 4.8) ? Math.min(fontSizeVal, 9.5) : Math.min(fontSizeVal, 8.5));
      for(let d = 0; d < totalDays; d++){
        columnStyles[currIdx++] = { cellWidth: cTgl, halign: 'center', cellPadding: 0.3, fontSize: dateFontSize };
      }
      for(let r = 0; r < 4; r++){
        columnStyles[currIdx++] = { cellWidth: cRekap, halign: 'center', cellPadding: 0.3, fontSize: dateFontSize };
      }
      if(showPct){ columnStyles[currIdx++] = { cellWidth: cPct, halign: 'center', cellPadding: 0.3, fontSize: dateFontSize }; }
      if(showKet){ columnStyles[currIdx++] = { cellWidth: cKet, halign: 'center', cellPadding: 0.5 }; }
      
      doc.autoTable({
        theme: 'grid', head: [headRow1, headRow2], body, startY: y + 4,
        margin: { top: 10, left: marginX, right: marginX, bottom: 14 },
        styles: { font: fontVal, fontSize: fontSizeVal, textColor: [0,0,0], cellPadding: 0.8, valign: 'middle', lineColor: [60,60,60], lineWidth: 0.1 },
        headStyles: { fillColor: [234, 232, 222], textColor: [0,0,0], fontStyle: 'bold', halign: 'center', fontSize: Math.min(fontSizeVal, 9.5) },
        bodyStyles: { fillColor: [255,255,255], textColor: [0,0,0], minCellHeight: rowHeightVal },
        columnStyles
      });
    }
    
    let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : y + 30;
    finalY += 5;
    const leftMarginX = marginX;
    const rightEdgeX = pageW - marginX;
    
    /* 1. SEBELAH KANAN: CATATAN HARI LIBUR BULAN INI */
    let rightY = finalY;
    if(reportType === 'bulanan' && groupedPdfHolidays && groupedPdfHolidays.length > 0){
      doc.setFont(fontVal, 'bold');
      doc.setFontSize(8.5);
      let titleStr = 'Catatan Hari Libur Bulan Ini:';
      doc.setFont(fontVal, 'normal');
      doc.setFontSize(8);
      let maxDateWidth = 0;
      groupedPdfHolidays.forEach(h => {
        let dateTxt = `  ${h.rangeStr}`;
        let w = doc.getTextWidth(dateTxt);
        if(w > maxDateWidth) maxDateWidth = w;
      });
      let maxTotalLineWidth = doc.getTextWidth(titleStr);
      groupedPdfHolidays.forEach(h => {
        let totalW = maxDateWidth + 5 + doc.getTextWidth(h.ket);
        if(totalW > maxTotalLineWidth) maxTotalLineWidth = totalW;
      });
      let startRightX = Math.max(rightEdgeX - maxTotalLineWidth, pageW / 2 + 10);
      let rightColonX = startRightX + maxDateWidth + 2;
      let ketStartX = rightColonX + 3;
      let availKetW = Math.max(rightEdgeX - ketStartX, 35);
      
      doc.setFont(fontVal, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(180, 50, 50);
      doc.text(titleStr, startRightX, rightY);
      doc.setFont(fontVal, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      
      groupedPdfHolidays.forEach(h => {
        rightY += 4;
        doc.text(`  ${h.rangeStr}`, startRightX, rightY);
        doc.text(':', rightColonX, rightY);
        let lines = doc.splitTextToSize(h.ket, availKetW);
        for(let l = 0; l < lines.length; l++){
          if(l > 0) rightY += 3.8;
          doc.text(lines[l], ketStartX, rightY);
        }
      });
    }
    
    /* 2. SEBELAH KIRI: REKAP JUMLAH SISWA */
    let leftY = finalY;
    doc.setFont(fontVal, 'bold'); doc.setFontSize(8.5); doc.setTextColor(31, 77, 64);
    doc.text('Rekap Jumlah Siswa:', leftMarginX, leftY);
    doc.setFont(fontVal, 'normal'); doc.setFontSize(8); doc.setTextColor(50, 50, 50);
    const leftColonX = leftMarginX + 30;
    const leftValX = leftColonX + 3;
    const printLeftRow = (label, valStr) => {
      leftY += 4;
      doc.text(label, leftMarginX + 2, leftY);
      doc.text(':', leftColonX, leftY);
      doc.text(valStr, leftValX, leftY);
    };
    
    printLeftRow('  Total Siswa', `${classStudents.length}`);
    printLeftRow('  Laki-laki (L)', `${totalL}`);
    printLeftRow('  Perempuan (P)', `${totalP}`);
    if(totalUnsetJk > 0){
      printLeftRow('  Belum diisi L/P', `${totalUnsetJk}`);
    }
    
    finalY = Math.max(leftY, rightY);
    
    /* 3. LEMBAR TANDA TANGAN PENGESAHAN */
    const showSig = document.getElementById('cfgShowSignature')?.checked;
    if(showSig){
      const jumlahTtd = m.jumlahTtd || '2';
      const requiredSpace = (jumlahTtd === '3') ? 60 : 42;
      if(pageH - finalY - 14 < requiredSpace){
        doc.addPage();
        finalY = 15;
      } else {
        finalY += 8;
      }
      
      doc.setFont(fontVal, 'normal'); doc.setFontSize(fontSizeVal); doc.setTextColor(0, 0, 0);
      const kotaRaw = (m.kota || '').trim();
      const tglRaw = (m.tglTtd || '').trim();
      const displayKota = kotaRaw || '....................';
      const displayTgl = tglRaw || '....................';
      const dateHeaderStr = `${displayKota}, ${displayTgl}`;
      
      if(jumlahTtd === '3'){
        const colWidth = 70; const gapWidth = 12;
        const totalBlockWidth = (colWidth * 3) + (gapWidth * 2);
        const startX = (pageW - totalBlockWidth) / 2;
        const posX_Left = startX + (colWidth / 2);
        const posX_Center = startX + colWidth + gapWidth + (colWidth / 2);
        const posX_Right = startX + (colWidth * 2) + (gapWidth * 2) + (colWidth / 2);
        const offsetY_Center = finalY + 18;
        
        const jabKiri = m.jabatanKiri || 'Kepala Sekolah';
        const kepsekName = m.kepsek || '...........................................';
        const nipKepsek = m.nipKepsek ? `NIP. ${m.nipKepsek}` : 'NIP. ....................................';
        
        doc.text('Mengetahui,', posX_Left, finalY, { align: 'center' });
        doc.text(jabKiri, posX_Left, finalY + 5, { align: 'center' });
        doc.setFont(fontVal, 'bold'); doc.text(kepsekName, posX_Left, finalY + 24, { align: 'center' });
        doc.setFont(fontVal, 'normal'); doc.text(nipKepsek, posX_Left, finalY + 29, { align: 'center' });
        
        const jabAKanan = m.jabatanKanan || 'Wali Kelas';
        const guruName = m.guru || '...........................................';
        const nipGuru = m.nipGuru ? `NIP. ${m.nipGuru}` : 'NIP. ....................................';
        
        doc.text(dateHeaderStr, posX_Right, finalY, { align: 'center' });
        doc.text(jabAKanan, posX_Right, finalY + 5, { align: 'center' });
        doc.setFont(fontVal, 'bold'); doc.text(guruName, posX_Right, finalY + 24, { align: 'center' });
        doc.setFont(fontVal, 'normal'); doc.text(nipGuru, posX_Right, finalY + 29, { align: 'center' });
        
        const jabTengah = m.jabatanTengah || 'Guru Mata Pelajaran';
        const namaTengah = m.namaTengah || '...........................................';
        const nipTengah = m.nipTengah ? `NIP. ${m.nipTengah}` : 'NIP. ....................................';
        
        doc.text('Mengetahui,', posX_Center, offsetY_Center, { align: 'center' });
        doc.text(jabTengah, posX_Center, offsetY_Center + 5, { align: 'center' });
        doc.setFont(fontVal, 'bold'); doc.text(namaTengah, posX_Center, offsetY_Center + 24, { align: 'center' });
        doc.setFont(fontVal, 'normal'); doc.text(nipTengah, posX_Center, offsetY_Center + 29, { align: 'center' });
      } else {
        const colWidth = 75; const gapWidth = 40;
        const totalBlockWidth = (colWidth * 2) + gapWidth;
        const startX = (pageW - totalBlockWidth) / 2;
        const centerX_Left = startX + (colWidth / 2);
        const centerX_Right = startX + colWidth + gapWidth + (colWidth / 2);
        
        const jabKiri = m.jabatanKiri || 'Kepala Sekolah';
        const kepsekName = m.kepsek || '...........................................';
        const nipKepsek = m.nipKepsek ? `NIP. ${m.nipKepsek}` : 'NIP. ....................................';
        
        doc.text('Mengetahui,', centerX_Left, finalY, { align: 'center' });
        doc.text(jabKiri, centerX_Left, finalY + 5, { align: 'center' });
        doc.setFont(fontVal, 'bold'); doc.text(kepsekName, centerX_Left, finalY + 24, { align: 'center' });
        doc.setFont(fontVal, 'normal'); doc.text(nipKepsek, centerX_Left, finalY + 29, { align: 'center' });
        
        const jabAKanan = m.jabatanKanan || 'Wali Kelas';
        const guruName = m.guru || '...........................................';
        const nipGuru = m.nipGuru ? `NIP. ${m.nipGuru}` : 'NIP. ....................................';
        
        doc.text(dateHeaderStr, centerX_Right, finalY, { align: 'center' });
        doc.text(jabAKanan, centerX_Right, finalY + 5, { align: 'center' });
        doc.setFont(fontVal, 'bold'); doc.text(guruName, centerX_Right, finalY + 24, { align: 'center' });
        doc.setFont(fontVal, 'normal'); doc.text(nipGuru, centerX_Right, finalY + 29, { align: 'center' });
      }
    }
  });
  
  const totalPages = doc.internal.getNumberOfPages();
  for(let p = 1; p <= totalPages; p++){
    doc.setPage(p); doc.setFont(fontVal, 'normal'); doc.setFontSize(8); doc.setTextColor(128, 128, 128);
    doc.text(`Halaman ${p} dari ${totalPages}`, pageW / 2, pageH - 6, { align: 'center' });
  }
  
  const finalFileName = fileName || `Absensi-${reportType}-${selectedClassOption}.pdf`;
  handlePdfDocumentAction(doc, actionType, finalFileName);
}