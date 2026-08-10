function updateHeaderDisplay(){
  const elGreeting = document.getElementById('hdrGreeting');
  const elSekolah = document.getElementById('hdrSekolah');

  const guruNama = (state.meta && state.meta.guru) ? state.meta.guru.trim() : '';
  const sekolahNama = (state.meta && state.meta.sekolah) ? state.meta.sekolah.trim() : '';

  if(elGreeting){
    elGreeting.innerHTML = `👋 Welcome, ${escHTML(guruNama || 'Guru Kelas / Mapel')}`;
  }
  if(elSekolah){
    elSekolah.textContent = sekolahNama || 'SD Negeri ...';
  }
}


function startHeaderClock(){
  function tick(){
    const elClock = document.getElementById('hdrClockText');
    if(!elClock) return;

    const now = new Date();
    const dayName = DAY_NAMES[now.getDay()];
    const dateNum = now.getDate();
    const monthName = MONTHS_ID[now.getMonth()];
    const yearNum = now.getFullYear();

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    elClock.textContent = `${dayName}, ${dateNum} ${monthName} ${yearNum} • ${hh}:${mm}:${ss}`;
  }

  tick();
  setInterval(tick, 1000);
}

/* LOGIKA PEMILIH TEMA WARNA & MODE GELAP */
