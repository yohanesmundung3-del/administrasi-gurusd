/* ==========================================================================
    MODUL PDF CORE: CONTROLLER, MODAL & EKSEKUSI UTAMA (JS/PDF-CORE.JS)
    ========================================================================== */

function exportGradesToPdfModalFromModule(){
  const activeMapel = document.getElementById('pMapelSelect')?.value;
  const activeClass = document.getElementById('pKelasSelect')?.value;
  openExportPdfModal();
  const reportTypeSel = document.getElementById('pdfReportTypeSelect');
  if(reportTypeSel){
    reportTypeSel.value = 'penilaian';
    togglePdfReportTypeUI();
  }
  const pdfClassSel = document.getElementById('pdfClassSelect');
  if(pdfClassSel && activeClass) pdfClassSel.value = activeClass;
  const pdfMapelSel = document.getElementById('pdfMapelSelect');
  if(pdfMapelSel && activeMapel) pdfMapelSel.value = activeMapel;
  updatePdfFileNamePreview();
}

function printStudentsListPdf(){
  const activeClass = document.getElementById('manageClassSelect')?.value || 'Kelas 4';
  openExportPdfModal();
  const reportTypeSel = document.getElementById('pdfReportTypeSelect');
  if(reportTypeSel){
    reportTypeSel.value = 'bulanan';
    togglePdfReportTypeUI();
  }
  const pdfClassSel = document.getElementById('pdfClassSelect');
  if(pdfClassSel) pdfClassSel.value = activeClass;
  const pdfBlankMode = document.getElementById('pdfBlankMode');
  if(pdfBlankMode) pdfBlankMode.checked = true;
  updatePdfFileNamePreview();
}

function openExportPdfModal(){
  if(!state.students || state.students.length === 0){
    showStatus('Masukkan data siswa terlebih dahulu!');
    showAlertModal('Data Siswa Kosong', 'Belum ada siswa terdaftar. Buka menu Data Siswa untuk mengisi nama murid.', 'warning');
    return;
  }
  const elB = document.getElementById('pdfBulanSelect');
  const elT = document.getElementById('pdfTahunInput');
  if(elB && state.meta.bulan) elB.value = state.meta.bulan;
  if(elT && state.meta.tahun) elT.value = state.meta.tahun;
  const pdfMapelSel = document.getElementById('pdfMapelSelect');
  if(pdfMapelSel){
    pdfMapelSel.innerHTML = (state.subjectList || []).map(s => `<option value="${escAttr(s)}">${escHTML(s)}</option>`).join('');
  }
  try {
    togglePdfReportTypeUI();
    updatePdfFileNamePreview();
  } catch(e) { console.log('PDF sync preview:', e); }
  openModal('modalExportPdf');
}

function togglePdfReportTypeUI(){
  const reportType = document.getElementById('pdfReportTypeSelect')?.value || 'bulanan';
  const bulananRow = document.getElementById('pdfBulananRow');
  const semesterRow = document.getElementById('pdfSemesterRow');
  const penilaianRow = document.getElementById('pdfPenilaianRow');
  const blankBox = document.getElementById('pdfBlankModeBox');
  const classSelectBox = document.getElementById('pdfClassSelectBox');
  
  if(reportType === 'bulanan'){
    if(bulananRow) bulananRow.style.display = 'grid';
    if(semesterRow) semesterRow.style.display = 'none';
    if(penilaianRow) penilaianRow.style.display = 'none';
    if(blankBox) blankBox.style.display = 'block';
    if(classSelectBox) classSelectBox.style.display = 'block';
  } else if(reportType === 'penilaian'){
    if(bulananRow) bulananRow.style.display = 'none';
    if(semesterRow) semesterRow.style.display = 'none';
    if(penilaianRow) penilaianRow.style.display = 'block';
    if(blankBox) blankBox.style.display = 'none';
    if(classSelectBox) classSelectBox.style.display = 'block';
  } else if(reportType === 'soal' || reportType === 'kunciSoal'){
    if(bulananRow) bulananRow.style.display = 'none';
    if(semesterRow) semesterRow.style.display = 'none';
    if(penilaianRow) penilaianRow.style.display = 'block';
    if(blankBox) blankBox.style.display = 'none';
    if(classSelectBox) classSelectBox.style.display = 'block';
  } else {
    if(bulananRow) bulananRow.style.display = 'none';
    if(semesterRow) semesterRow.style.display = 'grid';
    if(penilaianRow) penilaianRow.style.display = 'none';
    if(blankBox) blankBox.style.display = 'none';
    if(classSelectBox) classSelectBox.style.display = 'block';
  }
  updatePdfFileNamePreview();
}

function updatePdfFileNamePreview(){
  const nameInput = document.getElementById('pdfFileNameInput');
  if(!nameInput) return;
  const m = state.meta || {};
  const reportType = document.getElementById('pdfReportTypeSelect')?.value || 'bulanan';
  const selectedClass = document.getElementById('pdfClassSelect')?.value || 'Kelas-4';
  const cleanStr = (s) => (s || '').toString().trim().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const kelasStr = (selectedClass === 'ALL') ? 'Semua-Kelas' : cleanStr(selectedClass);
  const sekolahStr = cleanStr(m.sekolah || 'SD-Negeri');
  
  if(reportType === 'semester'){
    const semChoice = document.getElementById('pdfSemesterChoiceSelect')?.value || 'Ganjil';
    const semTahun = document.getElementById('pdfTahunSemesterInput')?.value || '2026';
    nameInput.value = `Absensi-Semester-${semChoice}-${kelasStr}-${semTahun}-${sekolahStr}`;
  } else if(reportType === 'tahunan'){
    const semTahun = document.getElementById('pdfTahunSemesterInput')?.value || '2026';
    nameInput.value = `Absensi-1-Tahun-Ajaran-${kelasStr}-${semTahun}-${sekolahStr}`;
  } else if(reportType === 'penilaian'){
    const mapelChoice = document.getElementById('pdfMapelSelect')?.value || 'Pendidikan-Agama';
    nameInput.value = `Leger-Nilai-${cleanStr(mapelChoice)}-${kelasStr}-${sekolahStr}`;
  } else if(reportType === 'soal'){
    const mapelChoice = document.getElementById('exMapelSelect')?.value || 'Pendidikan-Agama';
    nameInput.value = `Naskah-Soal-${cleanStr(mapelChoice)}-${kelasStr}-${sekolahStr}`;
  } else if(reportType === 'kunciSoal'){
    const mapelChoice = document.getElementById('exMapelSelect')?.value || 'Pendidikan-Agama';
    nameInput.value = `Kunci-Jawaban-${cleanStr(mapelChoice)}-${kelasStr}-${sekolahStr}`;
  } else {
    const selectedBulan = document.getElementById('pdfBulanSelect')?.value || (m.bulan || 'Juli');
    const selectedTahun = document.getElementById('pdfTahunInput')?.value || (m.tahun || '2026');
    nameInput.value = `Absensi-Siswa-${kelasStr}-${cleanStr(selectedBulan)}-${cleanStr(selectedTahun)}-${sekolahStr}`;
  }
}

function getWidthVal(val, defaultVal){
  if (val === 'auto' || val === '' || val === undefined || isNaN(parseFloat(val))) {
    return defaultVal;
  }
  const num = parseFloat(val);
  return num > 0 ? num : 'auto';
}

function handlePdfDocumentAction(doc, actionType, fileName){
  if(actionType === 'download'){
    doc.save(fileName);
    showStatus('File PDF berhasil diunduh');
  } else if(actionType === 'preview'){
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
    showStatus('PDF dibuka di tab baru');
  } else if(actionType === 'share'){
    try {
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Laporan PDF',
          text: `Berikut file PDF Laporan: ${fileName}`
        });
        showStatus('PDF berhasil dibagikan');
      } else {
        showStatus('Share tidak didukung. Otomatis mengunduh.');
        doc.save(fileName);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        doc.save(fileName);
      }
    }
  } else {
    doc.save(fileName);
    showStatus('File PDF berhasil diunduh');
  }
}

async function executePdfAction(actionType){
  try {
    showStatus('Memproses dokumen PDF...');
    const reportType = document.getElementById('pdfReportTypeSelect')?.value || 'bulanan';
    const rawInput = document.getElementById('pdfFileNameInput')?.value.trim() || 'Laporan-Sekolah';
    let fileName = rawInput.replace(/[^a-zA-Z0-9\-_]/g, '-').replace(/-+/g, '-');
    if(!fileName.toLowerCase().endsWith('.pdf')){
      fileName += '.pdf';
    }

    if(reportType === 'soal'){
      closeModal('modalExportPdf');
      if(typeof exportExamToPdf === 'function'){
        exportExamToPdf(actionType, fileName);
      }
      return;
    }
    if(reportType === 'kunciSoal'){
      closeModal('modalExportPdf');
      if(typeof exportAnswerKeyToPdf === 'function'){
        exportAnswerKeyToPdf(actionType, fileName);
      }
      return;
    }
    if(reportType === 'penilaian'){
      closeModal('modalExportPdf');
      if(typeof generatePenilaianPdf === 'function'){
        generatePenilaianPdf(actionType, fileName);
      }
      return;
    }
    if(reportType === 'bulanan' || reportType === 'semester' || reportType === 'tahunan'){
      closeModal('modalExportPdf');
      if(typeof generateAbsensiPdf === 'function'){
        generateAbsensiPdf(reportType, actionType, fileName);
      }
      return;
    }
  } catch(err) {
    console.error('Gagal mengeksekusi PDF:', err);
    alert('Terjadi kesalahan saat memproses PDF: ' + err.message);
    showStatus('Gagal memproses PDF.');
  }
}