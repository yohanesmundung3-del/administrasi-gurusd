/* ==========================================================================
    MODUL GENERATOR PDF SOAL UJIAN & KUNCI JAWABAN (JS/PDF-SOAL.JS)
    ========================================================================== */

function exportExamToPdf(actionType = 'download', fileName = ''){
  saveState();
  const { jsPDF } = window.jspdf;
  const eKey = typeof getExamKey === 'function' ? getExamKey() : 'exam_key';
  const exKelas = document.getElementById('exKelasSelect')?.value || 'Kelas 4';
  const exMapel = document.getElementById('exMapelSelect')?.value || 'Pendidikan Agama Kristen';
  const exType = document.getElementById('exTypeSelect')?.value || 'Sumatif Akhir Semester';
  const exSem = document.getElementById('exSemesterSelect')?.value || 'Genap';
  const examData = (state.examBank && state.examBank[eKey]) ? state.examBank[eKey] : { questions: [] };
  const questions = examData.questions || [];
  
  if (questions.length === 0) { 
    showAlertModal('Naskah Soal Kosong', 'Belum ada soal ujian untuk dicetak!', 'warning'); 
    return; 
  }
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();  // 210 mm
  const pageH = doc.internal.pageSize.getHeight(); // 297 mm
  const m = state.meta || {};
  
  // Header / Kop Naskah Ujian
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text((m.sekolah || 'NASKAH UJIAN SEKOLAH DASAR').toUpperCase(), pageW / 2, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`${exType.toUpperCase()} SEMESTER ${exSem.toUpperCase()}`, pageW / 2, 20, { align: 'center' });
  doc.text(`TAHUN PELAJARAN ${m.tahunAjaran || ''}`, pageW / 2, 26, { align: 'center' });
  doc.setLineWidth(0.5); doc.line(15, 29, pageW - 15, 29);
  
  let y = 35;
  doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
  doc.text(`Mata Pelajaran : ${exMapel}`, 15, y);
  doc.text(`Nama Siswa : ....................................`, pageW / 2 + 10, y);
  y += 5.5;
  doc.text(`Kelas / Fase    : ${exKelas}`, 15, y);
  doc.text(`Nomor Absen : ....................................`, pageW / 2 + 10, y);
  y += 5.5;
  doc.text(`Hari / Tanggal  : ${examData.date || '....................'}`, 15, y);
  doc.text(`Waktu            : ${examData.time || '90 Menit'}`, pageW / 2 + 10, y);
  y += 8;
  
  doc.setLineWidth(0.2); doc.line(15, y, pageW - 15, y);
  y += 6;
  
  if(examData.instructions){
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('PETUNJUK UMUM:', 15, y);
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const instLines = doc.splitTextToSize(examData.instructions, pageW - 30);
    instLines.forEach(l => { doc.text(l, 15, y); y += 4; });
    y += 3;
  }
  
  // SINKRONISASI PENGELOMPOKAN BAGIAN SOAL (PG, ISIAN, URAIAN)
  const sections = [
    {
      type: 'PG',
      title: 'PILIHAN GANDA',
      instruction: 'Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling tepat!'
    },
    {
      type: 'ISIAN',
      title: 'ISIAN SINGKAT',
      instruction: 'Isilah titik-titik di bawah ini dengan jawaban yang singkat dan benar!'
    },
    {
      type: 'ESSAY',
      title: 'URAIAN / ESSAY',
      instruction: 'Jawablah pertanyaan-pertanyaan di bawah ini secara jelas dan lengkap!'
    }
  ];

  let globalQuestionNumber = 1;
  let activeSectionIndex = 0;
  const sectionLetters = ['A', 'B', 'C', 'D'];

  sections.forEach(sec => {
    const secQuestions = questions.filter(q => q.type === sec.type);
    if(secQuestions.length === 0) return;
    
    const letter = sectionLetters[activeSectionIndex++] || 'A';
    
    // Page Break Check untuk Header Bagian
    if (y > pageH - 30) {
      doc.addPage();
      y = 15;
    }
    
    // Cetak Judul Bagian (Contoh: A. PILIHAN GANDA)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`${letter}. ${sec.title}`, 15, y);
    y += 4.5;
    
    // Cetak Petunjuk Bagian
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5);
    doc.text(sec.instruction, 15, y);
    y += 6;
    
    doc.setFontSize(9.5);
    
    secQuestions.forEach((q) => {
      const qNum = globalQuestionNumber++;
      
      // 1. Hitung Kebutuhan Tinggi Pertanyaan & Hanging Indent
      doc.setFont('helvetica', 'bold');
      const numStr = `${qNum}.`;
      const qTextWidth = pageW - 15 - 22; // 210 - 15 - 22 = 173mm lebar bersih teks pertanyaan
      doc.setFont('helvetica', 'normal');
      const qLines = doc.splitTextToSize(q.text, qTextWidth);
      const qHeight = qLines.length * 4.5;
      
      // 2. Hitung Kebutuhan Tinggi Pilihan Jawaban & Tentukan Jumlah Kolom
      let isPg = (q.type === 'PG' && q.options);
      let useOneColumn = false;
      let optLinesA = [], optLinesB = [], optLinesC = [], optLinesD = [];
      let totalOptionsHeight = 0;
      
      const col1PrefixX = 22;  // Posisi Huruf 'A.'
      const col1TextX = 28;    // Posisi Teks Opsi Baris 1 & 2 (Hanging Indent)
      const col2PrefixX = 105; // Posisi Huruf 'B.'
      const col2TextX = 111;   // Posisi Teks Opsi Baris 1 & 2 (Hanging Indent)
      
      if(isPg){
        const txtA = q.options.A || '-';
        const txtB = q.options.B || '-';
        const txtC = q.options.C || '-';
        const txtD = q.options.D || '-';
        
        // Ukur lebar fisik setiap teks pilihan
        const wA = doc.getTextWidth(txtA);
        const wB = doc.getTextWidth(txtB);
        const wC = doc.getTextWidth(txtC);
        const wD = doc.getTextWidth(txtD);
        
        // BATAS AMBANG: Jika ADA SALAH SATU pilihan > 72mm, paksa 1 Kolom 4 Baris!
        if (wA > 72 || wB > 72 || wC > 72 || wD > 72) {
          useOneColumn = true;
        }
        
        if (useOneColumn) {
          // 1 Kolom 4 Baris (Lebar Teks = 167mm)
          const singleColWidth = pageW - 15 - col1TextX; // 210 - 15 - 28 = 167mm
          optLinesA = doc.splitTextToSize(txtA, singleColWidth);
          optLinesB = doc.splitTextToSize(txtB, singleColWidth);
          optLinesC = doc.splitTextToSize(txtC, singleColWidth);
          optLinesD = doc.splitTextToSize(txtD, singleColWidth);
          
          totalOptionsHeight = (optLinesA.length + optLinesB.length + optLinesC.length + optLinesD.length) * 4.5 + 4;
        } else {
          // 2 Kolom 2 Baris (Lebar Teks = 72mm)
          const doubleColWidth = col2PrefixX - col1TextX - 5; // 105 - 28 - 5 = 72mm
          optLinesA = doc.splitTextToSize(txtA, doubleColWidth);
          optLinesB = doc.splitTextToSize(txtB, doubleColWidth);
          optLinesC = doc.splitTextToSize(txtC, doubleColWidth);
          optLinesD = doc.splitTextToSize(txtD, doubleColWidth);
          
          const row1H = Math.max(optLinesA.length, optLinesB.length) * 4.5;
          const row2H = Math.max(optLinesC.length, optLinesD.length) * 4.5;
          totalOptionsHeight = row1H + row2H + 4;
        }
      } else {
        totalOptionsHeight = 8; // Spasi kosong untuk soal Isian / Uraian
      }
      
      const neededTotalHeight = qHeight + totalOptionsHeight + 4;
      
      // 3. Smart Page Break Check (Mencegah Soal Terpotong di Batas Halaman)
      if (y + neededTotalHeight > pageH - 20) {
        doc.addPage();
        y = 15;
      }
      
      // 4. Cetak Nomor Soal & Pertanyaan dengan Hanging Indent Presisi
      doc.setFont('helvetica', 'bold');
      doc.text(numStr, 15, y);
      doc.setFont('helvetica', 'normal');
      
      qLines.forEach((l) => {
        doc.text(l, 22, y); // Sejajar di X = 22mm
        y += 4.5;
      });
      y += 1;
      
      // 5. Cetak Opsi Jawaban dengan Hanging Indent & Layout Cerdas
      if (isPg) {
        doc.setFont('helvetica', 'normal');
        
        if (useOneColumn) {
          // --- LAYOUT 1 KOLOM (4 BARIS) ---
          // Opsi A
          doc.setFont('helvetica', 'bold'); doc.text('A.', col1PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesA.forEach((l) => { doc.text(l, col1TextX, y); y += 4.5; });
          
          // Opsi B
          doc.setFont('helvetica', 'bold'); doc.text('B.', col1PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesB.forEach((l) => { doc.text(l, col1TextX, y); y += 4.5; });
          
          // Opsi C
          doc.setFont('helvetica', 'bold'); doc.text('C.', col1PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesC.forEach((l) => { doc.text(l, col1TextX, y); y += 4.5; });
          
          // Opsi D
          doc.setFont('helvetica', 'bold'); doc.text('D.', col1PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesD.forEach((l) => { doc.text(l, col1TextX, y); y += 4.5; });
          
          y += 2.5;
        } else {
          // --- LAYOUT 2 KOLOM (2 BARIS) ---
          const startY_row1 = y;
          
          // Baris 1 - Opsi A (Kolom Kiri)
          doc.setFont('helvetica', 'bold'); doc.text('A.', col1PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesA.forEach((l) => { doc.text(l, col1TextX, y); y += 4.5; });
          const endY_A = y;
          
          // Baris 1 - Opsi B (Kolom Kanan)
          y = startY_row1;
          doc.setFont('helvetica', 'bold'); doc.text('B.', col2PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesB.forEach((l) => { doc.text(l, col2TextX, y); y += 4.5; });
          const endY_B = y;
          
          y = Math.max(endY_A, endY_B) + 0.5;
          const startY_row2 = y;
          
          // Baris 2 - Opsi C (Kolom Kiri)
          doc.setFont('helvetica', 'bold'); doc.text('C.', col1PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesC.forEach((l) => { doc.text(l, col1TextX, y); y += 4.5; });
          const endY_C = y;
          
          // Baris 2 - Opsi D (Kolom Kanan)
          y = startY_row2;
          doc.setFont('helvetica', 'bold'); doc.text('D.', col2PrefixX, y); doc.setFont('helvetica', 'normal');
          optLinesD.forEach((l) => { doc.text(l, col2TextX, y); y += 4.5; });
          const endY_D = y;
          
          y = Math.max(endY_C, endY_D) + 3;
        }
      } else {
        y += 5; // Spasi untuk soal Isian / Uraian
      }
    });
    
    y += 3; // Jarak antar bagian jenis soal
  });
  
  const finalFileName = fileName || `Naskah-Soal-${exMapel}-${exKelas}.pdf`;
  handlePdfDocumentAction(doc, actionType, finalFileName);
}

function exportAnswerKeyToPdf(actionType = 'download', fileName = ''){
  saveState();
  const { jsPDF } = window.jspdf;
  const eKey = typeof getExamKey === 'function' ? getExamKey() : 'exam_key';
  const exKelas = document.getElementById('exKelasSelect')?.value || 'Kelas 4';
  const exMapel = document.getElementById('exMapelSelect')?.value || 'Pendidikan Agama Kristen';
  const exType = document.getElementById('exTypeSelect')?.value || 'Sumatif Akhir Semester';
  const examData = (state.examBank && state.examBank[eKey]) ? state.examBank[eKey] : { questions: [] };
  const questions = examData.questions || [];
  
  if(questions.length === 0){ 
    showAlertModal('Naskah Soal Kosong', 'Belum ada butir soal ujian tersimpan untuk dibuat kunci jawabannya.', 'warning'); 
    return; 
  }
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(`KUNCI JAWABAN & PEDOMAN PENSKORAN`, pageW / 2, 14, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`MATA PELAJARAN: ${exMapel.toUpperCase()} - ${exKelas.toUpperCase()}`, pageW / 2, 20, { align: 'center' });
  doc.text(`${exType.toUpperCase()}`, pageW / 2, 25, { align: 'center' });
  
  // Urutkan Kunci Jawaban Sesuai Kelompok Jenis Soal (PG, ISIAN, ESSAY)
  const sortedQuestions = [];
  ['PG', 'ISIAN', 'ESSAY'].forEach(t => {
    questions.filter(q => q.type === t).forEach(q => sortedQuestions.push(q));
  });
  
  let headRow = [{ content: 'No' }, { content: 'Bentuk Soal' }, { content: 'Kunci Jawaban / Pedoman Penskoran' }, { content: 'Bobot' }];
  const body = sortedQuestions.map((q, i) => [
    i + 1,
    q.type === 'PG' ? 'Pilihan Ganda' : (q.type === 'ISIAN' ? 'Isian Singkat' : 'Uraian / Essay'),
    q.key || '-',
    q.weight || 1
  ]);
  
  doc.autoTable({
    theme: 'grid', head: [headRow], body, startY: 30,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 1.5, valign: 'middle' },
    headStyles: { fillColor: [234, 232, 222], textColor: [0,0,0], fontStyle: 'bold', halign: 'center' }
  });
  
  const finalFileName = fileName || `Kunci-Jawaban-${exMapel}-${exKelas}.pdf`;
  handlePdfDocumentAction(doc, actionType, finalFileName);
}