import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// File path for server persistent store
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'class_data_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read data store
function readStore(): any {
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
function writeStore(data: any): boolean {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write store file:', err);
    return false;
  }
}

// SSE (Server-Sent Events) active clients list for instant real-time sync across all devices
type SSEClient = { id: string; res: express.Response };
let sseClients: SSEClient[] = [];

function broadcastToClients(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

// ================= API ROUTES =================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), clientsCount: sseClients.length });
});

// 2. Real-time Server-Sent Events (SSE) stream for instant sub-millisecond sync
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  sseClients.push({ id: clientId, res });

  // Send initial ping and current store immediately on connect
  const currentStore = readStore();
  res.write(`event: init\ndata: ${JSON.stringify(currentStore || {})}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// 3. Get full server data store
app.get('/api/store', (req, res) => {
  const data = readStore();
  res.json({ success: true, data: data || null });
});

// 4. Save / update full server data store
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
    broadcastToClients('store_update', merged);
    res.json({ success: true, data: merged });
  } else {
    res.status(500).json({ success: false, error: 'Failed to persist store' });
  }
});

// 5. Save students roster specifically
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
  broadcastToClients('roster_update', { students, classId, updatedAt: existing.updatedAt });
  res.json({ success: true, count: students.length });
});

// 6. Save submissions for assignments specifically
app.post('/api/submissions', (req, res) => {
  const { assignmentId, submissions, submissionsMap } = req.body;
  const existing = readStore() || {};
  if (!existing.submissionsMap) existing.submissionsMap = {};

  if (submissionsMap) {
    existing.submissionsMap = { ...existing.submissionsMap, ...submissionsMap };
  } else if (assignmentId && submissions) {
    existing.submissionsMap[assignmentId] = {
      ...(existing.submissionsMap[assignmentId] || {}),
      ...submissions
    };
  }

  existing.updatedAt = new Date().toISOString();
  writeStore(existing);
  broadcastToClients('submissions_update', { 
    assignmentId, 
    submissionsMap: existing.submissionsMap, 
    updatedAt: existing.updatedAt 
  });
  res.json({ success: true, submissionsMap: existing.submissionsMap });
});

// 7. Save Supabase config
app.post('/api/config/supabase', (req, res) => {
  const config = req.body;
  const existing = readStore() || {};
  existing.supabaseConfig = config;
  existing.updatedAt = new Date().toISOString();

  writeStore(existing);
  broadcastToClients('config_update', { supabaseConfig: config });
  res.json({ success: true, config });
});

// 8. Save Google Sheets config
app.post('/api/config/sheets', (req, res) => {
  const config = req.body;
  const existing = readStore() || {};
  existing.sheetsConfig = config;
  existing.updatedAt = new Date().toISOString();

  writeStore(existing);
  broadcastToClients('config_update', { sheetsConfig: config });
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
