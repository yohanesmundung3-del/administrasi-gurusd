function applyTheme(themeName){
  if(!themeName) themeName = 'teal';
  document.body.setAttribute('data-theme', themeName);
  
  if(!state.meta) state.meta = {};
  state.meta.theme = themeName;
  saveState();

  const themeBtns = ['teal', 'navy', 'maroon', 'purple', 'dark'];
  themeBtns.forEach(t => {
    const btn = document.getElementById('btnTheme' + t.charAt(0).toUpperCase() + t.slice(1));
    if(btn){
      if(t === themeName) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

/* LOGIKA WIDGET INTERAKTIF & MODAL DETAIL HARI INI */
