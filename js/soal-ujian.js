/* ==========================================================================
    MODUL SOAL UJIAN (BANK, PEMBUAT NASKAH & IMPOR TEKS AI)
    ========================================================================== */

let tempParsedAiQuestions = [];

function getExamKey(){
  const exKelas = document.getElementById('exKelasSelect')?.value || 'Kelas 4';
  const exMapel = document.getElementById('exMapelSelect')?.value || (state.subjectList[0] || 'Umum');
  const exType = document.getElementById('exTypeSelect')?.value || 'SAS';
  const exSem = document.getElementById('exSemesterSelect')?.value || 'Genap';
  const exTahun = document.getElementById('exTahunInput')?.value || '2026';
  return `${exKelas}_${exMapel}_${exType}_${exSem}_${exTahun}`.replace(/\s+/g, '_');
}

function updateExamFilterBadge(){
  const badgeEl = document.getElementById('examFilterBadgeText');
  if(!badgeEl) return;
  const exKelas = document.getElementById('exKelasSelect')?.value || 'Kelas 4';
  const exMapel = document.getElementById('exMapelSelect')?.value || (state.subjectList[0] || 'Umum');
  const exType = document.getElementById('exTypeSelect')?.value || 'SAS';
  badgeEl.textContent = `📋 Filter Ujian: ${exType} | ${exKelas} | ${exMapel}`;
}

function openFilterExamModal(){
  updateExamFilterBadge();
  openModal('modalFilterExam');
}

function applyFilterExamModal(){
  updateExamFilterBadge();
  renderSoalUjianUI();
  closeModal('modalFilterExam');
  showStatus('Filter soal ujian diterapkan');
}

function openExamKopModal(){
  renderSoalUjianUI();
  openModal('modalExamKop');
}

function saveExamKopFromModal(){
  saveExamKopSettings();
  closeModal('modalExamKop');
  showStatus('Pengaturan Kop Ujian disimpan');
}

function openAddExamQuestionModal(){
  toggleQuestionOptionsUI();
  openModal('modalAddExamQuestion');
}

function addExamQuestionFromModal(){
  addExamQuestion();
  closeModal('modalAddExamQuestion');
}

function openExamPdfModal(reportType){
  const activeMapel = document.getElementById('exMapelSelect')?.value;
  const activeClass = document.getElementById('exKelasSelect')?.value;
  
  openExportPdfModal();
  
  const reportTypeSel = document.getElementById('pdfReportTypeSelect');
  if(reportTypeSel){
    reportTypeSel.value = reportType || 'soal';
    togglePdfReportTypeUI();
  }
  
  const pdfClassSel = document.getElementById('pdfClassSelect');
  if(pdfClassSel && activeClass) pdfClassSel.value = activeClass;
  
  const pdfMapelSel = document.getElementById('pdfMapelSelect');
  if(pdfMapelSel && activeMapel) pdfMapelSel.value = activeMapel;
  
  updatePdfFileNamePreview();
}

function renderSoalUjianUI(){
  const exMapelSel = document.getElementById('exMapelSelect');
  if(exMapelSel && exMapelSel.options.length === 0){
    exMapelSel.innerHTML = (state.subjectList || []).map(s => `<option value="${escAttr(s)}">${escHTML(s)}</option>`).join('');
  }
  
  updateExamFilterBadge();
  
  const eKey = getExamKey();
  if(!state.examBank) state.examBank = {};
  
  const examData = state.examBank[eKey] || {
    time: '90 Menit',
    date: '',
    instructions: '1. Berdoalah sebelum mengerjakan.\n2. Tulislah nama dan nomor pada lembar jawab.',
    questions: []
  };
  state.examBank[eKey] = examData;
  
  const timeEl = document.getElementById('exTimeInput');
  const dateEl = document.getElementById('exDateInput');
  const instEl = document.getElementById('exInstructionsInput');
  if(timeEl) timeEl.value = examData.time || '90 Menit';
  if(dateEl) dateEl.value = examData.date || '';
  if(instEl) instEl.value = examData.instructions || '';
  
  const container = document.getElementById('examQuestionsListContainer');
  const countTxt = document.getElementById('countExamQuestionsText');
  const questions = examData.questions || [];
  if(countTxt) countTxt.textContent = questions.length;
  if(!container) return;
  
  if(questions.length === 0){
    container.innerHTML = `<div class="empty-state" style="padding:14px;">Belum ada butir soal pada naskah ujian ini.<br>Klik tombol <b>➕ Tambah Butir Soal Baru</b> atau <b>🤖 Impor Teks AI</b> di atas.</div>`;
    return;
  }
  
  container.innerHTML = questions.map((q, idx) => {
    let typeLabel = (q.type === 'PG') ? 'Pilihan Ganda (PG)' : (q.type === 'ISIAN' ? 'Isian Singkat' : 'Uraian / Essay');
    let optsHtml = '';
    if(q.type === 'PG' && q.options){
      optsHtml = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:6px; font-size:11.5px; color:var(--ink);">
          <div><b>A.</b> ${escHTML(q.options.A || '-')}</div>
          <div><b>B.</b> ${escHTML(q.options.B || '-')}</div>
          <div><b>C.</b> ${escHTML(q.options.C || '-')}</div>
          <div><b>D.</b> ${escHTML(q.options.D || '-')}</div>
        </div>
      `;
    }
    return `
      <div class="col-manager-item" style="flex-direction:column; align-items:flex-start; gap:4px; padding:10px;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <span style="font-size:12px; font-weight:800; color:var(--accent-dark);">${idx + 1}. [${typeLabel}] - Bobot: ${q.weight || 1}</span>
          <button type="button" class="btn-move" style="color:var(--danger); border-color:#f5c2c2;" onclick="deleteExamQuestion('${eKey}', '${q.id}')">🗑️ Hapus Soal</button>
        </div>
        <div style="font-size:12.5px; color:var(--ink); margin-top:4px; line-height:1.35;">${escHTML(q.text)}</div>
        ${optsHtml}
        <div style="font-size:11px; color:var(--accent); font-weight:700; margin-top:4px; background:var(--paper); padding:3px 6px; border-radius:4px; width:100%;">
            🗝️ Kunci / Pedoman: ${escHTML(q.key || '-')}
        </div>
      </div>
    `;
  }).join('');
}

function toggleQuestionOptionsUI(){
  const qType = document.getElementById('qTypeSelect')?.value || 'PG';
  const pgBox = document.getElementById('qPgOptionsBox');
  const essayBox = document.getElementById('qEssayKeyBox');
  if(qType === 'PG'){
    if(pgBox) pgBox.style.display = 'block';
    if(essayBox) essayBox.style.display = 'none';
  } else {
    if(pgBox) pgBox.style.display = 'none';
    if(essayBox) essayBox.style.display = 'block';
  }
}

function saveExamKopSettings(){
  const eKey = getExamKey();
  if(!state.examBank) state.examBank = {};
  if(!state.examBank[eKey]) state.examBank[eKey] = { questions: [] };
  state.examBank[eKey].time = document.getElementById('exTimeInput')?.value || '90 Menit';
  state.examBank[eKey].date = document.getElementById('exDateInput')?.value || '';
  state.examBank[eKey].instructions = document.getElementById('exInstructionsInput')?.value || '';
  saveState();
  showStatus('Pengaturan Kop Ujian Disimpan');
}

function addExamQuestion(){
  const eKey = getExamKey();
  saveExamKopSettings();
  const qType = document.getElementById('qTypeSelect')?.value || 'PG';
  const qWeight = parseFloat(document.getElementById('qWeightInput')?.value) || 1;
  const qText = document.getElementById('qTextInput')?.value.trim();
  if(!qText){ showStatus('⚠️ Rumuskan pertanyaan soal!'); return; }
  
  let qOptions = null;
  let qKey = '';
  if(qType === 'PG'){
    qOptions = {
      A: document.getElementById('qOptA')?.value.trim() || '',
      B: document.getElementById('qOptB')?.value.trim() || '',
      C: document.getElementById('qOptC')?.value.trim() || '',
      D: document.getElementById('qOptD')?.value.trim() || ''
    };
    qKey = document.getElementById('qKeyPgSelect')?.value || 'A';
  } else {
    qKey = document.getElementById('qKeyEssayInput')?.value.trim() || '-';
  }
  
  const newQ = {
    id: 'q_' + Date.now(),
    type: qType,
    weight: qWeight,
    text: qText,
    options: qOptions,
    key: qKey
  };
  
  state.examBank[eKey].questions.push(newQ);
  document.getElementById('qTextInput').value = '';
  if(qOptions){
    document.getElementById('qOptA').value = '';
    document.getElementById('qOptB').value = '';
    document.getElementById('qOptC').value = '';
    document.getElementById('qOptD').value = '';
  }
  const essayKeyEl = document.getElementById('qKeyEssayInput');
  if(essayKeyEl) essayKeyEl.value = '';
  saveState();
  renderSoalUjianUI();
  addActivityLog(`Menambah butir soal ujian [${qType}]`);
  showStatus(`Soal #${state.examBank[eKey].questions.length} berhasil disimpan`);
}

function deleteExamQuestion(eKey, qId){
  if(state.examBank && state.examBank[eKey] && state.examBank[eKey].questions){
    state.examBank[eKey].questions = state.examBank[eKey].questions.filter(x => x.id !== qId);
    saveState();
    renderSoalUjianUI();
    showStatus('Butir soal dihapus');
  }
}

/* ==========================================================================
    FITUR BARU: GENERATOR PROMPT & IMPOR TEKS AI SOAL UJIAN
    ========================================================================== */

function openImportExamAiModal(){
  const mapelSel = document.getElementById('promptMapelSelect');
  if(mapelSel){
    mapelSel.innerHTML = (state.subjectList || []).map(s => `<option value="${escAttr(s)}">${escHTML(s)}</option>`).join('');
    const activeExMapel = document.getElementById('exMapelSelect')?.value;
    if(activeExMapel) mapelSel.value = activeExMapel;
  }
  
  const activeExKelas = document.getElementById('exKelasSelect')?.value;
  const promptKelasSel = document.getElementById('promptKelasSelect');
  if(promptKelasSel && activeExKelas) promptKelasSel.value = activeExKelas;
  
  const activeExSem = document.getElementById('exSemesterSelect')?.value;
  const promptSemSel = document.getElementById('promptSemesterSelect');
  if(promptSemSel && activeExSem) promptSemSel.value = activeExSem;
  
  document.getElementById('aiExamTextInput').value = '';
  document.getElementById('aiExamPreviewBox').style.display = 'none';
  document.getElementById('aiImportFooter').style.display = 'none';
  tempParsedAiQuestions = [];
  
  openModal('modalImportExamAI');
}

function copyAiPrompt(){
  const mapel = document.getElementById('promptMapelSelect')?.value || 'Mata Pelajaran';
  const kelas = document.getElementById('promptKelasSelect')?.value || 'Kelas 4';
  const semester = document.getElementById('promptSemesterSelect')?.value || 'Genap';
  const difficulty = document.getElementById('promptDifficultySelect')?.value || 'Sedang / MOTS';
  const count = document.getElementById('promptCountInput')?.value || '10';
  const type = document.getElementById('promptTypeSelect')?.value || 'Campuran';
  
  const promptText = `Buatkan ${count} butir soal ujian Mata Pelajaran ${mapel} untuk ${kelas} Semester ${semester} dengan tingkat kesulitan ${difficulty}. Bentuk/Jenis Soal: ${type}.

Petunjuk Penulisan Format Output:
Wajib gunakan format teks baku di bawah ini agar dapat diimpor otomatis oleh sistem:

1. [Teks Pertanyaan Soal Pilihan Ganda]
A. [Pilihan A]
B. [Pilihan B]
C. [Pilihan C]
D. [Pilihan D]
Kunci: A
Bobot: 1

2. [Teks Pertanyaan Soal Isian]
Kunci: [Jawaban Singkat]
Bobot: 2

3. [Teks Pertanyaan Soal Uraian / Essay]
Kunci: [Pedoman Penskoran]
Bobot: 3

Ketentuan Penting:
- Berikan nomor soal berurutan (1, 2, 3, dst).
- WAJIB: Setiap Pilihan Ganda (PG), opsi A, B, C, D HARUS dituliskan masing-masing pada BARIS BARU tersendiri (Jangan digabung dalam 1 paragraf).
- Setiap nomor wajib dilengkapi baris 'Kunci:' dan 'Bobot:'.
- Jangan berikan kalimat pembuka atau penutup di luar format soal tersebut.`;

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(promptText).then(() => {
      showStatus('📋 Prompt ChatGPT berhasil disalin!');
      showAlertModal('Prompt Disalin', 'Prompt ChatGPT telah disalin ke Clipboard! Silakan buka ChatGPT/Claude lalu Paste dan kirim.', 'success');
    }).catch(() => fallbackCopyPrompt(promptText));
  } else {
    fallbackCopyPrompt(promptText);
  }
}

function fallbackCopyPrompt(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showStatus('📋 Prompt ChatGPT berhasil disalin!');
  showAlertModal('Prompt Disalin', 'Prompt ChatGPT telah disalin ke Clipboard! Silakan buka ChatGPT/Claude lalu Paste dan kirim.', 'success');
}

function processAiExamText(){
  const rawText = document.getElementById('aiExamTextInput')?.value || '';
  if(!rawText.trim()){
    showStatus('⚠️ Tempelkan teks soal dari ChatGPT terlebih dahulu!');
    return;
  }
  
  tempParsedAiQuestions = parseExamTextAI(rawText);
  
  const previewBox = document.getElementById('aiExamPreviewBox');
  const previewContainer = document.getElementById('aiExamPreviewContainer');
  const countText = document.getElementById('aiParsedCountText');
  const footer = document.getElementById('aiImportFooter');
  
  if(tempParsedAiQuestions.length === 0){
    showStatus('⚠️ Teks tidak dapat dibaca. Pastikan memuat nomor soal.');
    showAlertModal('Gagal membaca Soal', 'Format teks tidak terdeteksi. Pastikan naskah soal memuat nomor (misal: 1., 2.) dan opsi A, B, C, D untuk PG.', 'warning');
    if(previewBox) previewBox.style.display = 'none';
    if(footer) footer.style.display = 'none';
    return;
  }
  
  if(countText) countText.textContent = tempParsedAiQuestions.length;
  
  if(previewContainer){
    previewContainer.innerHTML = tempParsedAiQuestions.map((q, idx) => {
      let typeLabel = (q.type === 'PG') ? 'Pilihan Ganda' : (q.type === 'ISIAN' ? 'Isian Singkat' : 'Uraian / Essay');
      let optsHtml = '';
      if(q.type === 'PG' && q.options){
        optsHtml = `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-top:4px; font-size:11px; color:var(--ink);">
            <div><b>A.</b> ${escHTML(q.options.A || '-')}</div>
            <div><b>B.</b> ${escHTML(q.options.B || '-')}</div>
            <div><b>C.</b> ${escHTML(q.options.C || '-')}</div>
            <div><b>D.</b> ${escHTML(q.options.D || '-')}</div>
          </div>
        `;
      }
      return `
        <div style="padding:8px; background:#fff; border:1px solid var(--line); border-radius:8px; margin-bottom:6px;">
          <div style="font-size:11.5px; font-weight:800; color:var(--accent-dark);">${idx + 1}. [${typeLabel}] - Bobot: ${q.weight || 1}</div>
          <div style="font-size:12px; color:var(--ink); margin-top:3px;">${escHTML(q.text)}</div>
          ${optsHtml}
          <div style="font-size:10.5px; color:var(--accent); font-weight:700; margin-top:3px;">🗝️ Kunci: ${escHTML(q.key || '-')}</div>
        </div>
      `;
    }).join('');
  }
  
  if(previewBox) previewBox.style.display = 'block';
  if(footer) footer.style.display = 'block';
  showStatus(`⚡ Berhasil mengekstrak ${tempParsedAiQuestions.length} butir soal`);
}

function parseExamTextAI(rawText){
  if(!rawText || !rawText.trim()) return [];
  
  // PRE-PROCESSOR AUTO-FORMATTER:
  // Memotong otomatis opsi A. B. C. D. yang ditulis menyambung dalam 1 baris menjadi baris baru (\n)
  let formattedText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  formattedText = formattedText.replace(/([^\n])\s+([A-D])[\.\)]\s+/gi, '$1\n$2. ');
  
  const blocks = formattedText.split(/(?=\n\s*\d+[\.\)\:]|\n\s*Soal\s+\d+[\.\)\:])/i);
  const results = [];
  
  blocks.forEach((block) => {
    let str = block.trim();
    if(!str) return;
    
    // Bersihkan nomor di awal baris (1., 1), Soal 1:, 1:)
    str = str.replace(/^(\d+[\.\)\:]|Soal\s+\d+[\.\)\:])\s*/i, '').trim();
    if(!str) return;
    
    // Ekstraksi Bobot
    let weight = 1;
    const weightMatch = str.match(/(?:Bobot|Poin|Nilai)\s*[:=]\s*(\d+(?:\.\d+)?)/i);
    if(weightMatch){
      weight = parseFloat(weightMatch[1]) || 1;
      str = str.replace(/(?:Bobot|Poin|Nilai)\s*[:=]\s*\d+(?:\.\d+)?/gi, '').trim();
    }
    
    // Ekstraksi Kunci
    let key = '';
    const keyMatch = str.match(/(?:Kunci|Jawaban|Kunci\s+Jawaban)\s*[:=]\s*([^\n]+)/i);
    if(keyMatch){
      key = keyMatch[1].trim();
      str = str.replace(/(?:Kunci|Jawaban|Kunci\s+Jawaban)\s*[:=]\s*[^\n]+/gi, '').trim();
    }
    
    // Ekstraksi Opsi A, B, C, D
    const optA = str.match(/(?:^|\n)\s*[A|a][\.\)\:]\s*([^\n]+)/);
    const optB = str.match(/(?:^|\n)\s*[B|b][\.\)\:]\s*([^\n]+)/);
    const optC = str.match(/(?:^|\n)\s*[C|c][\.\)\:]\s*([^\n]+)/);
    const optD = str.match(/(?:^|\n)\s*[D|d][\.\)\:]\s*([^\n]+)/);
    
    if(optA && optB){
      let qText = str.split(/(?=\n\s*[A|a][\.\)\:]|\n\s*A[\.\)\:])/i)[0].trim();
      if(key){
        const letterMatch = key.match(/^[A-Da-d]\b/);
        if(letterMatch) key = letterMatch[0].toUpperCase();
      } else {
        key = 'A';
      }
      
      results.push({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        type: 'PG',
        weight: weight || 1,
        text: qText || str,
        options: {
          A: optA[1].trim(),
          B: optB[1].trim(),
          C: optC ? optC[1].trim() : '',
          D: optD ? optD[1].trim() : ''
        },
        key: key
      });
    } else {
      let isEssay = /jelaskan|sebutkan|bagaimana|mengapa|uraikan|tuliskan|bandingkan|analisis/i.test(str);
      results.push({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        type: isEssay ? 'ESSAY' : 'ISIAN',
        weight: weight || (isEssay ? 3 : 2),
        text: str,
        options: null,
        key: key || '-'
      });
    }
  });
  
  return results;
}

function saveImportedAiQuestions(){
  if(!tempParsedAiQuestions || tempParsedAiQuestions.length === 0){
    showStatus('⚠️ Tidak ada soal untuk disimpan!');
    return;
  }
  
  const eKey = getExamKey();
  saveExamKopSettings();
  
  if(!state.examBank[eKey].questions) state.examBank[eKey].questions = [];
  
  tempParsedAiQuestions.forEach(q => {
    state.examBank[eKey].questions.push(q);
  });
  
  const addedCount = tempParsedAiQuestions.length;
  tempParsedAiQuestions = [];
  
  saveState();
  closeModal('modalImportExamAI');
  renderSoalUjianUI();
  addActivityLog(`Mengimpor masal ${addedCount} soal ujian via AI`);
  showStatus(`🎉 Berhasil mengimpor ${addedCount} butir soal ke naskah ujian`);
}