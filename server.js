const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple JSON DB initialization
function readDB() {
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

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Resolve tenantId from token or fallback to default
async function getTenantId(req) {
  const token = req.headers['authorization']?.split(' ')[1] || req.query.capibara_token;
  if (!token || token === 'mock-dev-token') {
    return 'local-dev-tenant';
  }

  try {
    const response = await fetch('https://capibara.fr/api/public/v1/embed-context', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const context = await response.json();
      return context.tenantId || 'local-dev-tenant';
    }
  } catch (err) {
    console.error('Error calling embed-context API:', err.message);
  }

  // Fallback for easy testing
  return 'local-dev-tenant';
}

// API: Get settings for the tenant
app.get('/api/settings', async (req, res) => {
  const tenantId = await getTenantId(req);
  const db = readDB();
  const settings = db[tenantId] || {};
  res.json({ tenantId, settings });
});

// API: Save settings for the tenant
app.post('/api/settings', async (req, res) => {
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
    updatedAt: new Date().toISOString()
  };
  
  writeDB(db);
  res.json({ success: true, tenantId, settings: db[tenantId] });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Capibara Weather Add-on Server running on http://localhost:${PORT}`);
  console.log(`==================================================`);
});
