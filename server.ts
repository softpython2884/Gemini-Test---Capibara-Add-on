import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple JSON DB initialization
function readDB(): Record<string, any> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB:', err);
  }
  return {};
}

function writeDB(data: Record<string, any>): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Resolve tenantId from token or fallback to default
async function getTenantId(req: Request): Promise<string> {
  const authHeader = req.headers['authorization'];
  const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : req.query.capibara_token as string;
  if (!token || token === 'mock-dev-token') {
    return 'local-dev-tenant';
  }
  try {
    const response = await fetch('https://capibara.fr/api/public/v1/embed-context', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) {
      const context = await response.json();
      return context.tenantId || 'local-dev-tenant';
    }
  } catch (err: any) {
    console.error('Error calling embed-context API:', err.message);
  }
  return 'local-dev-tenant';
}

// API: Get settings for the tenant
app.get('/api/settings', async (req: Request, res: Response) => {
  const tenantId = await getTenantId(req);
  const db = readDB();
  const settings = db[tenantId] || {};
  res.json({ tenantId, settings });
});

// API: Save settings for the tenant
app.post('/api/settings', async (req: Request, res: Response) => {
  const { city, latitude, longitude } = req.body;
  if (!city || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Missing city, latitude or longitude' });
  }
  const tenantId = await getTenantId(req);
  const db = readDB();
  db[tenantId] = {
    city,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
  res.json({ success: true, tenantId, settings: db[tenantId] });
});

app.listen(PORT, () => {
  console.log('==================================================');
  console.log(` Capibara Weather Add-on Server running on http://localhost:${PORT}`);
  console.log('==================================================');
});
