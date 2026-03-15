// src/models/database.js
// Pure JSON file database — zero dependencies, works on ALL Node versions
// Data saved to skillmatchai.db.json (same folder as server.js)
const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../skillmatchai.db.json');

// In-memory store
let _data = {
  users:        [],
  certificates: [],
  jobs:         [],
  applications: [],
  interviews:   [],
  _counters:    { users: 0, certificates: 0, jobs: 0, applications: 0, interviews: 0 },
};

// ── Persist to disk ───────────────────────────────────────────────────────────
const _save = () => {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(_data, null, 2)); }
  catch (e) { console.error('[db] Save error:', e.message); }
};

// ── Load from disk ────────────────────────────────────────────────────────────
const _load = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      _data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      // ensure counters exist
      if (!_data._counters) _data._counters = { users:0,certificates:0,jobs:0,applications:0,interviews:0 };
      console.log('[db] ✅ Loaded from', DB_FILE);
    } else {
      console.log('[db] ✅ New database created at', DB_FILE);
    }
  } catch (e) {
    console.error('[db] Load error — starting fresh:', e.message);
  }
};

// ── Seed sample jobs ──────────────────────────────────────────────────────────
const _seedJobs = () => {
  if (_data.jobs.length > 0) return;
  const jobs = [
    { title:'Senior React Developer',   description:'Build web apps with React 18 and TypeScript.',        required_skills:['React','TypeScript','Node.js'],     location:'Bangalore',  salary_min:1200000, salary_max:2000000, is_remote:false },
    { title:'Full Stack Engineer',       description:'Work on frontend and backend of SaaS platform.',       required_skills:['React','Node.js','MongoDB','Docker'], location:'Mumbai',     salary_min:800000,  salary_max:1500000, is_remote:true  },
    { title:'Frontend Engineer',         description:'Create responsive UIs using React and Tailwind CSS.',  required_skills:['React','Tailwind CSS','JavaScript'],  location:'Hyderabad',  salary_min:600000,  salary_max:1200000, is_remote:true  },
    { title:'Data Scientist',            description:'Build ML models for analytics platform.',              required_skills:['Python','TensorFlow','SQL','Pandas'],  location:'Pune',       salary_min:900000,  salary_max:1800000, is_remote:false },
    { title:'DevOps Engineer',           description:'Manage CI/CD pipelines on AWS with Docker.',           required_skills:['Docker','Kubernetes','AWS','Linux'],   location:'Remote',     salary_min:1000000, salary_max:1900000, is_remote:true  },
    { title:'Backend Developer',         description:'Design REST APIs using Node.js and Express.',          required_skills:['Node.js','Express','PostgreSQL'],      location:'Chennai',    salary_min:700000,  salary_max:1400000, is_remote:false },
    { title:'Python Developer',          description:'Build automation scripts and Django services.',         required_skills:['Python','Django','PostgreSQL'],        location:'Noida',      salary_min:600000,  salary_max:1200000, is_remote:true  },
    { title:'UI/UX Developer',           description:'Design and build responsive interfaces.',               required_skills:['Figma','React','CSS','JavaScript'],    location:'Bangalore',  salary_min:500000,  salary_max:1000000, is_remote:false },
  ];
  for (const job of jobs) {
    db.create('jobs', { ...job, recruiter_id: null, is_active: true, created_at: new Date().toISOString() });
  }
  console.log('[db] ✅ Sample jobs seeded');
};

// ── Init (called once from server.js) ────────────────────────────────────────
const initDB = async () => {
  _load();
  _seedJobs();
  _save();
  console.log('[db] ✅ Tables ready | users:', _data.users.length, '| jobs:', _data.jobs.length);
};

// ── Core CRUD ─────────────────────────────────────────────────────────────────
const db = {

  findOne(collection, id) {
    const num = Number(id);
    return _data[collection]?.find(r => r.id === num) || null;
  },

  findMany(collection, { filter = {}, sort = [], limit = 500, offset = 0 } = {}) {
    let rows = [...(_data[collection] || [])];

    for (const [key, cond] of Object.entries(filter)) {
      const [op, val] = Object.entries(cond)[0];
      rows = rows.filter(r => {
        if (op === '_eq')        return r[key] == val;
        if (op === '_neq')       return r[key] != val;
        if (op === '_gt')        return r[key] >  val;
        if (op === '_lt')        return r[key] <  val;
        if (op === '_nnull')     return r[key] != null;
        if (op === '_null')      return r[key] == null;
        if (op === '_icontains') return String(r[key]||'').toLowerCase().includes(String(val).toLowerCase());
        return true;
      });
    }

    for (const s of [...sort].reverse()) {
      const desc = s.startsWith('-');
      const key  = desc ? s.slice(1) : s;
      rows.sort((a, b) => {
        if (a[key] < b[key]) return desc ? 1 : -1;
        if (a[key] > b[key]) return desc ? -1 : 1;
        return 0;
      });
    }

    return rows.slice(offset, offset + limit);
  },

  create(collection, data) {
    if (!_data[collection]) _data[collection] = [];
    if (!_data._counters[collection]) _data._counters[collection] = 0;
    _data._counters[collection]++;
    const record = { id: _data._counters[collection], ...data };
    _data[collection].push(record);
    _save();
    return record;
  },

  update(collection, id, data) {
    const num = Number(id);
    const idx = _data[collection]?.findIndex(r => r.id === num);
    if (idx === -1 || idx === undefined) return null;
    _data[collection][idx] = { ..._data[collection][idx], ...data };
    _save();
    return _data[collection][idx];
  },

  remove(collection, id) {
    const num = Number(id);
    _data[collection] = _data[collection]?.filter(r => r.id !== num) || [];
    _save();
  },

  findOneWhere(collection, filter) {
    return this.findMany(collection, { filter, limit: 1 })[0] || null;
  },

  // Expose raw data for debug
  _raw: () => _data,
};

module.exports = { initDB, db };
