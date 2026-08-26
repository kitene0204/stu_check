import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// File path for server persistent store
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'class_data_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read data store
function readStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read store file:', err);
  }
  return null;
}

// Helper to write data store
function writeStore(data: any) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write store file:', err);
    return false;
  }
}

// ================= API ROUTES =================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Get full server data store
app.get('/api/store', (req, res) => {
  const data = readStore();
  if (data) {
    res.json({ success: true, data });
  } else {
    res.json({ success: true, data: null });
  }
});

// 3. Save / update full server data store
app.post('/api/store', (req, res) => {
  const incoming = req.body;
  if (!incoming) {
    return res.status(400).json({ success: false, error: 'No data provided' });
  }

  const existing = readStore() || {};
  const merged = {
    ...existing,
    ...incoming,
    updatedAt: new Date().toISOString()
  };

  const ok = writeStore(merged);
  if (ok) {
    res.json({ success: true, data: merged });
  } else {
    res.status(500).json({ success: false, error: 'Failed to persist store' });
  }
});

// 4. Save students roster specifically
app.post('/api/roster', (req, res) => {
  const { students, classId } = req.body;
  if (!Array.isArray(students)) {
    return res.status(400).json({ success: false, error: 'Invalid students array' });
  }

  const existing = readStore() || {};
  existing.students = students;
  if (classId) existing.classId = classId;
  existing.updatedAt = new Date().toISOString();

  writeStore(existing);
  res.json({ success: true, count: students.length });
});

// 5. Save Supabase config
app.post('/api/config/supabase', (req, res) => {
  const config = req.body;
  const existing = readStore() || {};
  existing.supabaseConfig = config;
  existing.updatedAt = new Date().toISOString();

  writeStore(existing);
  res.json({ success: true, config });
});

// 6. Save Google Sheets config
app.post('/api/config/sheets', (req, res) => {
  const config = req.body;
  const existing = readStore() || {};
  existing.sheetsConfig = config;
  existing.updatedAt = new Date().toISOString();

  writeStore(existing);
  res.json({ success: true, config });
});

// ================= VITE MIDDLEWARE & STATIC SERVING =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Class Submission Tracker server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
