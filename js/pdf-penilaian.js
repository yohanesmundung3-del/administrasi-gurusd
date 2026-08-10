/* ==========================================================================
    MODUL GENERATOR PDF PENILAIAN: LEGER NILAI & RAPOR (JS/PDF-PENILAIAN.JS)
    ========================================================================== */

function generatePenilaianPdf(actionType = 'download', fileName = ''){
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
    const activeMapel = document.getElementById('pdfMapelSelect')?.value || (document.getElementById('pMapelSelect')?.value || state.meta.mapel || 'Pendidikan Agama Kristen');
    const pSem = document.getElementById('pSemesterSelect')?.value || (state.meta.semester || 'Genap');
    const pTahun = state.meta.tahun || '2026';
    
    const exactKey = `${targetClass}_${activeMapel}_${pSem}_${pTahun}`.replace(/\s+/g, '_');
    let currentTps = (state.tpList && state.tpList[exactKey]) ? state.tpList[exactKey] : [];
    
    doc.setFont(fontVal, 'bold'); doc.setFontSize(13);
    doc.text('LEGER NILAI ASESMEN SUMATIF & DESKRIPSI RAPOR', pageW / 2, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`KURIKULUM MERDEKA SD - ${targetClass.toUpperCase()}`, pageW / 2, 20, { align: 'center' });
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
    renderMetaLine('Mata Pelajaran', activeMapel, rightX, 28);
    
    let headRow = [{ content: 'No' }];
    if(showNis) headRow.push({ content: 'NISN/NIS' });
    headRow.push({ content: 'Nama Siswa' }, { content: 'L/P' });
    
    if(currentTps.length === 0){
      headRow.push({ content: 'TP' });
    } else {
      currentTps.forEach((tp, idx) => headRow.push({ content: `TP ${idx + 1}` }));
    }
    headRow.push({ content: 'Rata SLM' }, { content: 'SAS' }, { content: 'NA' }, { content: 'Deskripsi Capaian Rapor' });
    
    const body = classStudents.map((st, i) => {
      const stGradesKey = `${exactKey}_${st.id}`;
      const g = state.grades ? state.grades[stGradesKey] || {} : {};
      let row = [i + 1];
      if(showNis) row.push(st.nis || '');
      row.push(st.nama || '', st.jk || '');
      let totalSlm = 0, countSlm = 0;
      let highestTp = { score: -1, name: '' }, lowestTp = { score: 999, name: '' };
      
      if(currentTps.length === 0){
        row.push('-');
        const sasVal = g['SAS'] !== undefined ? g['SAS'] : '';
        const numSas = parseFloat(sasVal);
        const finalNa = !isNaN(numSas) ? numSas : 0;
        row.push('-', sasVal, finalNa || '', '-');
      } else {
        currentTps.forEach(tp => {
          let cleanTpName = (tp.name || '').replace(/^TP\s*\d+\s*[-:\s]*/i, '').trim();
          if(!cleanTpName) cleanTpName = tp.name;
          let naturalTpName = cleanTpName.charAt(0).toLowerCase() + cleanTpName.slice(1);

          const scoreVal = g[tp.id] !== undefined ? g[tp.id] : '';
          row.push(scoreVal);
          const numScore = parseFloat(scoreVal);
          if(!isNaN(numScore) && scoreVal !== ''){
            totalSlm += numScore; countSlm++;
            if(numScore > highestTp.score){ highestTp.score = numScore; highestTp.name = naturalTpName; }
            if(numScore < lowestTp.score){ lowestTp.score = numScore; lowestTp.name = naturalTpName; }
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
      }
      return row;
    });

    const colCfg = (state.meta && state.meta.colWidths && state.meta.colWidths['penilaian']) ? state.meta.colWidths['penilaian'] : {};
    let columnStyles = {};
    let currIdx = 0;

    const cNo = getWidthVal(colCfg.no, 7);
    const cNis = getWidthVal(colCfg.nis, 25);
    const cNama = getWidthVal(colCfg.nama, 'auto');
    const cJk = getWidthVal(colCfg.jk, 8);
    const cTp = getWidthVal(colCfg.tp, 12);
    const cNilai = getWidthVal(colCfg.nilai, 12);
    const cDeskripsi = getWidthVal(colCfg.deskripsi, 'auto');

    columnStyles[currIdx++] = { cellWidth: cNo, halign: 'center' };
    if(showNis){ columnStyles[currIdx++] = { cellWidth: cNis, halign: 'center' }; }
    columnStyles[currIdx++] = { cellWidth: cNama, halign: 'left' };
    columnStyles[currIdx++] = { cellWidth: cJk, halign: 'center' };

    if(currentTps.length === 0){
      columnStyles[currIdx++] = { cellWidth: cTp, halign: 'center' };
    } else {
      currentTps.forEach(() => {
        columnStyles[currIdx++] = { cellWidth: cTp, halign: 'center' };
      });
    }
    columnStyles[currIdx++] = { cellWidth: cNilai, halign: 'center' }; // Rata SLM
    columnStyles[currIdx++] = { cellWidth: cNilai, halign: 'center' }; // SAS
    columnStyles[currIdx++] = { cellWidth: cNilai, halign: 'center' }; // NA
    columnStyles[currIdx++] = { cellWidth: cDeskripsi, halign: 'left' }; // Deskripsi Capaian Rapor
    
    doc.autoTable({
      theme: 'grid', head: [headRow], body, startY: y + 4,
      margin: { top: 10, left: marginX, right: marginX, bottom: 14 },
      styles: { font: fontVal, fontSize: fontSizeVal, textColor: [0,0,0], cellPadding: 1, valign: 'middle', lineColor: [60,60,60], lineWidth: 0.1 },
      headStyles: { fillColor: [234, 232, 222], textColor: [0,0,0], fontStyle: 'bold', halign: 'center', fontSize: Math.min(fontSizeVal, 9.5) },
      bodyStyles: { fillColor: [255,255,255], textColor: [0,0,0], minCellHeight: rowHeightVal },
      columnStyles
    });

    let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : y + 30;
    finalY += 5;
    const leftMarginX = marginX;
    const rightEdgeX = pageW - marginX;
    
    /* 1. SEBELAH KANAN: KETERANGAN TP (TANPA EMOJI AGAR BERSIH) */
    let rightY = finalY;
    if(currentTps.length > 0){
      doc.setFont(fontVal, 'bold');
      doc.setFontSize(8.5);
      let titleStr = `Keterangan TP (${targetClass}) :`;
      doc.setFont(fontVal, 'normal');
      doc.setFontSize(8);
      let maxCodeWidth = 0;
      currentTps.forEach((tp, idx) => {
        let codeTxt = `  TP ${idx + 1}`;
        let w = doc.getTextWidth(codeTxt);
        if(w > maxCodeWidth) maxCodeWidth = w;
      });
      const cleanedTps = currentTps.map(tp => {
        let cleanName = (tp.name || '').replace(/^TP\s*\d+\s*[-:\s]*/i, '').trim();
        if(!cleanName) cleanName = tp.name;
        return cleanName;
      });
      let maxTotalLineWidth = doc.getTextWidth(titleStr);
      cleanedTps.forEach(cleanName => {
        let totalW = maxCodeWidth + 5 + doc.getTextWidth(cleanName);
        if(totalW > maxTotalLineWidth) maxTotalLineWidth = totalW;
      });
      let startRightX = Math.max(rightEdgeX - maxTotalLineWidth, pageW / 2 + 10);
      let rightColonX = startRightX + maxCodeWidth + 2;
      let nameStartX = rightColonX + 3;
      let availNameW = Math.max(rightEdgeX - nameStartX, 35);
      
      doc.setFont(fontVal, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(31, 77, 64);
      doc.text(titleStr, startRightX, rightY);
      doc.setFont(fontVal, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      
      currentTps.forEach((tp, idx) => {
        rightY += 4;
        const cleanName = cleanedTps[idx];
        doc.text(`  TP ${idx + 1}`, startRightX, rightY);
        doc.text(':', rightColonX, rightY);
        let lines = doc.splitTextToSize(cleanName, availNameW);
        for(let l = 0; l < lines.length; l++){
          if(l > 0) rightY += 3.8;
          doc.text(lines[l], nameStartX, rightY);
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
  
  const finalFileName = fileName || `Leger-Nilai-${activeMapel}-${selectedClassOption}.pdf`;
  handlePdfDocumentAction(doc, actionType, finalFileName);
}