/* ==========================================================================
    HELPERS & GLOBAL MODAL STACK SYSTEM (WITH POPSTATE ISOLATION & STATE PERSISTENCE)
    ========================================================================== */

let modalStack = [];
let isSuppressingPopState = false;

function uid(){ return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function showStatus(msg){
  const el = document.getElementById('statusMsg');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showStatus._t);
  showStatus._t = setTimeout(()=> el.classList.remove('show'), 2200);
}

function toggleSubCard(id){ document.getElementById(id).classList.toggle('collapsed'); }

function formatDateID(iso){
  if(!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if(isNaN(d)) return '';
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function escHTML(s){ return (s===undefined||s===null)?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s){ return (s===undefined||s===null)?'':String(s).replace(/"/g,'&quot;'); }

/* LOGIKA MANAGEMENT TUMPUKAN MODAL (DYNAMIC MODAL STACK WITH STATE PERSISTENCE) */
function closeAllModals(){
  isSuppressingPopState = true;
  document.querySelectorAll('.modal-overlay.active').forEach(el => {
    el.classList.remove('active');
    el.style.zIndex = '';
  });
  const popCount = modalStack.length;
  modalStack = [];
  if(state) state.activeModalStack = [];
  document.body.classList.remove('modal-open');
  if(popCount > 0 && history.state && history.state.modalId){
    try {
      history.go(-popCount);
    } catch(e) {}
  }
  setTimeout(() => { isSuppressingPopState = false; }, 150);
  if(typeof saveState === 'function') saveState();
}

function openModal(id, keepParent = true){
  const el = document.getElementById(id);
  if(!el) return;
  if(!keepParent){
    closeAllModals();
  }
  const existingIdx = modalStack.indexOf(id);
  if(existingIdx !== -1){
    modalStack.splice(existingIdx, 1);
  }
  modalStack.push(id);
  const baseZIndex = 1000;
  el.style.zIndex = baseZIndex + (modalStack.length * 10);
  const box = el.querySelector('.modal-box');
  if(box && typeof box.resetPosition === 'function') box.resetPosition();
  el.classList.add('active');
  document.body.classList.add('modal-open');
  if(!history.state || history.state.modalId !== id){
    history.pushState({ modalId: id, stackLen: modalStack.length }, '', '#' + id);
  }
  if (state) {
    state.activeModalStack = [...modalStack];
    if(typeof saveState === 'function') saveState();
  }
}

function closeModal(id, isPopState = false){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove('active');
  el.style.zIndex = '';
  modalStack = modalStack.filter(mId => mId !== id);
  if(modalStack.length === 0){
    document.body.classList.remove('modal-open');
  } else {
    const topModalId = modalStack[modalStack.length - 1];
    const topEl = document.getElementById(topModalId);
    if(topEl && !topEl.classList.contains('active')){
      topEl.classList.add('active');
    }
  }
  if(!isPopState && history.state && history.state.modalId === id){
    isSuppressingPopState = true;
    history.back();
  }
  if (state) {
    state.activeModalStack = [...modalStack];
    if(typeof saveState === 'function') saveState();
  }
}

function showAlertModal(title, msg, type = 'warning'){
  const elTitle = document.getElementById('alertModalTitle');
  const elMsg = document.getElementById('alertModalMessage');
  const elIcon = document.getElementById('alertModalIcon');
  if(elTitle) elTitle.textContent = title || 'Pemberitahuan';
  if(elMsg) elMsg.textContent = msg || '';
  if(elIcon){
    let iconChar = '⚠️';
    if(type === 'info') iconChar = 'ℹ️';
    else if(type === 'success') iconChar = '✅';
    else if(type === 'danger' || type === 'error') iconChar = '❌';
    elIcon.textContent = iconChar;
  }
  openModal('modalAlert');
}

function showConfirmModal(title, msg, onConfirm){
  document.getElementById('confirmModalTitle').textContent = title || 'Konfirmasi';
  document.getElementById('confirmModalMessage').textContent = msg || 'Apakah Anda yakin?';
  const btnAction = document.getElementById('confirmModalBtnAction');
  btnAction.onclick = () => {
    closeModal('modalConfirm');
    if(typeof onConfirm === 'function') onConfirm();
  };
  openModal('modalConfirm');
}

function makeModalsDraggable(){
  const modalBoxes = document.querySelectorAll('.modal-box');
  modalBoxes.forEach(box => {
    const header = box.querySelector('.modal-header');
    if(!header || box.dataset.draggable) return;
    box.dataset.draggable = 'true';
    let isDragging = false, startX = 0, startY = 0, currentX = 0, currentY = 0, initialX = 0, initialY = 0;
    
    box.resetPosition = function(){
      currentX = 0; currentY = 0; initialX = 0; initialY = 0;
      box.style.transform = 'translate(0px, 0px)';
    };

    function dragStart(e){
      if(e.target.closest('.modal-close')) return;
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX - initialX; startY = clientY - initialY;
      box.style.transition = 'none';
    }

    function dragMove(e){
      if(!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      currentX = clientX - startX; currentY = clientY - startY;
      initialX = currentX; initialY = currentY;
      box.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    function dragEnd(){
      if(!isDragging) return;
      isDragging = false;
      box.style.transition = '';
    }

    header.addEventListener('mousedown', dragStart);
    header.addEventListener('touchstart', dragStart, {passive: true});
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('touchmove', dragMove, {passive: true});
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('touchend', dragEnd);
  });
}

/* EVENT LISTENER: TUTUP MODAL TERATAS SAAT LAYAR GELAP (BACKDROP) DIKLIK */
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    const activeId = e.target.id;
    if (activeId) {
      closeModal(activeId);
    }
  }
});

/* EVENT LISTENER: TOMBOL BACK HP/BROWSER UNTUK TUTUP MODAL TERATAS */
window.addEventListener('popstate', (e) => {
  if (isSuppressingPopState) {
    isSuppressingPopState = false;
    return;
  }
  if (modalStack.length > 0) {
    const topModalId = modalStack[modalStack.length - 1];
    closeModal(topModalId, true);
  }
});

function getSortedStudents(className){
  let list = Array.isArray(state.students) ? [...state.students] : [];
  if(className){
    list = list.filter(st => (st.kelas || 'Kelas 4') === className);
  }
  return list.sort((a,b) => (a.nama || '').localeCompare((b.nama || ''), 'id', { sensitivity: 'base' }));
}

function getResolvedDayStatus(dateISO){
  if(state.dayStatuses && state.dayStatuses[dateISO]){
    return state.dayStatuses[dateISO];
  }
  if(state.importedHolidays && state.importedHolidays[dateISO]){
    return { status: 'libur', ket: state.importedHolidays[dateISO] };
  }
  if(BUILTIN_KALDIK_MANADO_2026_2027[dateISO]){
    return { status: 'libur', ket: BUILTIN_KALDIK_MANADO_2026_2027[dateISO] };
  }
  return null;
}

function groupConsecutiveHolidays(holidaysList, bulanNama, tahunNum){
  if(!holidaysList || holidaysList.length === 0) return [];
  holidaysList.sort((a,b) => a.day - b.day);
  const grouped = [];
  let currentGroup = null;
  holidaysList.forEach(item => {
    if(!currentGroup){
      currentGroup = { startDay: item.day, endDay: item.day, ket: item.ket };
    } else if(item.day === currentGroup.endDay + 1 && item.ket === currentGroup.ket){
      currentGroup.endDay = item.day;
    } else {
      grouped.push(currentGroup);
      currentGroup = { startDay: item.day, endDay: item.day, ket: item.ket };
    }
  });
  if(currentGroup) grouped.push(currentGroup);
  return grouped.map(g => {
    let rangeStr = '';
    if(g.startDay === g.endDay){
      rangeStr = `${g.startDay} ${bulanNama} ${tahunNum}`;
    } else {
      rangeStr = `${g.startDay} s/d ${g.endDay} ${bulanNama} ${tahunNum}`;
    }
    return { rangeStr, ket: g.ket, startDay: g.startDay };
  });
}

function formatNIP(rawNip){
  if(!rawNip) return '';
  const digits = String(rawNip).replace(/\D/g, '');
  if(digits.length === 18){
    return `${digits.slice(0,8)} ${digits.slice(8,14)} ${digits.slice(14,15)} ${digits.slice(15,18)}`;
  }
  return rawNip;
}

function openUniversalSelectPicker(selectEl){
  if(!selectEl || selectEl.options.length === 0) return;
  const container = document.getElementById('customPickerContainer');
  const title = document.getElementById('customPickerTitle');
  if(!container || !title) return;
  let fieldLabel = selectEl.closest('.field')?.querySelector('label')?.textContent || 'Pilih Opsi';
  fieldLabel = fieldLabel.replace(/[* :]/g, '').trim();
  title.textContent = fieldLabel;
  let html = '';
  const currentValue = selectEl.value;
  Array.from(selectEl.options).forEach(opt => {
    if(opt.disabled) return;
    const isSelected = (opt.value === currentValue);
    const activeStyle = isSelected ? 'border: 1.5px solid var(--accent); background: #eef5f1;' : '';
    const checkBadge = isSelected ? '<span style="color:var(--accent); font-weight:bold; font-size:14px;">✓</span>' : '<span style="color:var(--muted); font-size:14px;"></span>';
    html += `
      <div class="col-manager-item" style="cursor:pointer; padding:10px 12px; margin-bottom:6px; ${activeStyle}"
           onclick="applyUniversalSelectChoice('${selectEl.id}', '${escAttr(opt.value)}')">
        <span style="font-size:13px; font-weight:${isSelected ? '800' : '600'}; color:var(--ink);">${escHTML(opt.text)}</span>
        ${checkBadge}
      </div>
    `;
  });
  container.innerHTML = html;
  openModal('modalCustomPicker');
}

function applyUniversalSelectChoice(selectId, chooseValue){
  closeModal('modalCustomPicker');
  const selectEl = document.getElementById(selectId);
  if(!selectEl) return;
  selectEl.value = chooseValue;
  if(selectId === 'mKepsekSelect') selectTeacherForLeft(chooseValue);
  else if(selectId === 'mGuruSelect') selectTeacherForRight(chooseValue);
  else if(selectId === 'mTengahSelect') selectTeacherForCenter(chooseValue);
  else if(selectId === 'mMapelSelect') selectSubjectFromDropdown(chooseValue);
  else if(selectId === 'mKelasSelect') selectClassFromDropdown(chooseValue);
  else if(selectId === 'cfgColReportTypeSelect' && typeof switchColConfigPanelUI === 'function') switchColConfigPanelUI(chooseValue);
  
  selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  selectEl.dispatchEvent(new Event('input', { bubbles: true }));
  if(typeof selectEl.onchange === 'function') {
    selectEl.onchange();
  }
}