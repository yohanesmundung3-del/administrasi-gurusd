/* ==========================================================================
   LOGIKA JAVASCRIPT UTAMA APLIKASI ABSENSI SISWA
   ========================================================================== */


let state = {
  meta: { 
    semester:'', tahunAjaran:'', bulan:'', tahun:'', sekolah:'', kelas:'Kelas IV / Fase B', mapel:'Semua Mapel / Tematik', guru:'', nipGuru:'',
    kota:'', tglTtd:'', jumlahTtd:'2', jabatanKiri:'Kepala Sekolah', kepsek:'', nipKepsek:'',
    jabatanTengah:'Guru Mata Pelajaran', namaTengah:'', nipTengah:'',
    jabatanKanan:'Wali Kelas',
    pdfShowNis: true, pdfShowPct: false, pdfShowKet: false,
    pwaIconUrl: 'https://cdn-icons-png.flaticon.com/512/2641/2641409.png', theme: 'teal'
  },
  students: [],     
  attendance: {},   
  dayStatuses: {},
  importedHolidays: {},
  customHolidaysText: '',
  jadwal: [],
  activityLogs: [],
  teacherList: [],
  subjectList: [],
  tpList: {},
  grades: {},
  examBank: {}
};


const DAY_NAMES = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const SHORT_MONTHS_ID = ['JAN','FEB','MAR','APR','MEI','JUN','JUL','AGU','SEP','OKT','NOV','DES'];


let activeClickedDate = new Date().toISOString().slice(0, 10);

let activeModalClass = 'Kelas 4';

let activeJadwalTabDay = 'Senin';

let tempModalAttendance = {};

let isMonthSliding = false;

let longPressTimer = null;

let isLongPress = false;

/* DATA DEFAULT MASTER GURU & MAPEL */

const DEFAULT_TEACHERS = [
  { id: 't1', nama: 'Margaretha Pantow, S.Pd.', nip: '19960130 202521 2 035', jabatan: 'Guru PAK' },
  { id: 't2', nama: 'Octavianus Johan Rompis, S.Pd.', nip: '19661013 198802 1 001', jabatan: 'Kepala Sekolah' },
  { id: 't3', nama: 'Anneke A. Moningka, S.Pd.', nip: '19720403 200103 2 001', jabatan: 'Kepala Sekolah' }
];


const DEFAULT_SUBJECTS = [
  'Pendidikan Agama Kristen dan Budi Pekerti',
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Pendidikan Agama Katolik dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial',
  'Bahasa Inggris',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan',
  'Seni Musik',
  'Seni Rupa',
  'Seni Tari',
  'Seni Teater',
  'Muatan Lokal'
];

/* PRESET KALENDER PENDIDIKAN MANADO 2026/2027 */

const BUILTIN_KALDIK_MANADO_2026_2027 = {
  "2026-07-01": "Libur Semester 2 (TA 2025/2026)", "2026-07-02": "Libur Semester 2 (TA 2025/2026)",
  "2026-07-03": "Libur Semester 2 (TA 2025/2026)", "2026-07-06": "Libur Semester 2 (TA 2025/2026)",
  "2026-07-07": "Libur Semester 2 (TA 2025/2026)", "2026-07-08": "Libur Semester 2 (TA 2025/2026)",
  "2026-07-09": "Libur Semester 2 (TA 2025/2026)", "2026-07-10": "Libur Semester 2 (TA 2025/2026)",
  "2026-08-17": "HUT RI (Proklamasi Kemerdekaan)", "2026-08-25": "Maulid Nabi Muhammad SAW",
  "2026-12-21": "Libur Semester 1", "2026-12-22": "Libur Semester 1", "2026-12-23": "Libur Semester 1",
  "2026-12-24": "Cuti Bersama Natal", "2026-12-25": "Hari Raya Natal", "2026-12-28": "Libur Semester 1",
  "2026-12-29": "Libur Semester 1", "2026-12-30": "Libur Semester 1", "2026-12-31": "Libur Semester 1",
  "2027-01-01": "Tahun Baru Masehi", "2027-01-02": "Libur Semester 1", "2027-01-04": "Libur Semester 1",
  "2027-01-05": "Isra Mi'raj Nabi Muhammad SAW", "2027-02-06": "Tahun Baru Imlek 2578",
  "2027-02-08": "Perkiraan Awal Puasa", "2027-02-09": "Perkiraan Awal Puasa", "2027-02-10": "Perkiraan Awal Puasa",
  "2027-03-09": "Hari Raya Nyepi 1949 Saka", "2027-03-10": "Hari Raya Idulfitri 1448 H", "2027-03-11": "Hari Raya Idulfitri 1448 H",
  "2027-03-26": "Wafat Yesus Kristus", "2027-05-01": "Hari Buruh Internasional", "2027-05-06": "Kenaikan Yesus Kristus",
  "2027-05-16": "Hari Raya Idul Adha 1448 H", "2027-05-20": "Hari Raya Waisak 2571 BE", "2027-06-01": "Hari Lahir Pancasila",
  "2027-06-06": "Tahun Baru Hijriyah 1449 H", "2027-06-21": "Libur Semester Genap", "2027-06-22": "Libur Semester Genap"
};

/* IndexedDB Persistence */

const metaFields = {
  mSemester:'semester', mTahunAjaran:'tahunAjaran', mBulan:'bulan', mTahun:'tahun',
  mSekolah:'sekolah', mKelas:'kelas', mMapel:'mapel', mGuru:'guru',
  mKota:'kota', mTglTtd:'tglTtd', mJumlahTtd:'jumlahTtd',
  mJabatanKiri:'jabatanKiri', mKepsek:'kepsek', mNipKepsek:'nipKepsek',
  mJabatanTengah:'jabatanTengah', mNamaTengah:'namaTengah', mNipTengah:'nipTengah',
  mJabatanKanan:'jabatanKanan', mNipGuru:'nipGuru', mPwaIconUrl:'pwaIconUrl'
};


let touchStartX = 0;

let touchStartY = 0;

let isTouchScrolling = false;

window.addEventListener('touchstart', function(e) {
  if (e.touches && e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isTouchScrolling = false;
  }
}, { passive: true });

window.addEventListener('touchmove', function(e) {
  if (e.touches && e.touches.length === 1) {
    const diffX = Math.abs(e.touches[0].clientX - touchStartX);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY);
    if (diffX > 8 || diffY > 8) {
      isTouchScrolling = true;
    }
  }
}, { passive: true });

document.addEventListener('click', function(e) {
  const selectEl = e.target.closest('select');
  if (!selectEl) return;

  if (isTouchScrolling) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  selectEl.blur();
  openUniversalSelectPicker(selectEl);
}, true);

/* PRESENSI HARIAN MODE KALENDER */
