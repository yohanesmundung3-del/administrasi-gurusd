const DB_NAME = 'AbsensiSiswaDB';

let dbInstance = null;


function openDB(){
  return new Promise((resolve,reject)=>{
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('state')) db.createObjectStore('state', {keyPath:'id'});
    };
    req.onsuccess = (e)=>{ dbInstance = e.target.result; resolve(dbInstance); };
    req.onerror = (e)=> reject(e);
  });
}


async function saveState(){
  try{
    const db = dbInstance || await openDB();
    const tx = db.transaction('state','readwrite');
    tx.objectStore('state').put({id:'current', data: state});
  }catch(err){ console.error('Gagal menyimpan', err); }
}


async function loadState(){
  try{
    const db = dbInstance || await openDB();
    return new Promise((resolve)=>{
      const tx = db.transaction('state','readonly');
      const req = tx.objectStore('state').get('current');
      req.onsuccess = ()=>{
        if(req.result && req.result.data){
          state = req.result.data;
          if(!state.meta) state.meta = {};
          if(!Array.isArray(state.students)) state.students = [];
          if(!state.attendance) state.attendance = {};
          if(!state.dayStatuses) state.dayStatuses = {};
          if(!state.importedHolidays) state.importedHolidays = {};
          if(!state.customHolidaysText) state.customHolidaysText = '';
          if(!Array.isArray(state.jadwal)) state.jadwal = [];
          if(!Array.isArray(state.activityLogs)) state.activityLogs = [];
          if(!Array.isArray(state.teacherList)) state.teacherList = [];
          if(!Array.isArray(state.subjectList)) state.subjectList = [];
          if(!state.tpList) state.tpList = {};
          if(!state.grades) state.grades = {};
          if(!state.examBank) state.examBank = {};
        }
        resolve();
      };
      req.onerror = ()=> resolve();
    });
  }catch(err){ return Promise.resolve(); }
}

