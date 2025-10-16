// backend/src/config/env.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Search .env in multiple places (monorepo-friendly)
const CANDIDATES = [ 
path.resolve(__dirname, '../.env'), // backend/.env ✅ 
path.resolve(__dirname, '../../.env'), // repo/.env 
path.resolve(process.cwd(), '.env'), 
path.resolve(__dirname, '../.env.local'), 
path.resolve(process.cwd(), '.env.local'),
];

let loadedEnvPath = null;
let parsed = {};

for (const p of CANDIDATES) { 
if (!fs.existsSync(p)) continue; 
try {
// 2) Read raw & normalize (fix BOM / "export " / "KEY: value" / CRLF)
let raw = fs.readFileSync(p, 'utf8');
raw = raw
.replace(/^\uFEFF/, '') // BOM
.replace(/^\s*export\s+/gm, '') // bash style
.replace(/^(\w+)\s*:\s*(.*)$/gm, '$1=$2'); // YAML style → .env
// (don't strip comments because dotenv.parse automatically handles # at the beginning of the line)

// 3) Parse with dotenv.parse and put it in process.env if not already there
parsed = dotenv.parse(raw);
Object.entries(parsed).forEach(([k, v]) => { 
if (!(k in process.env)) process.env[k] = String(v ?? ''); 
}); 

loadedEnvPath = p; 
break; break; 
} catch (e) { 
// try next candidate 
}
}

console.log('🧩 ENV | loaded from =', loadedEnvPath || 'NOT FOUND');
console.log('🧪 ENV | keys parsed =', Object.keys(parsed).length);

// 4) Validate required variables
const REQUIRED = [ 
'JWT_SECRET', 
'MONGODB_URI', 
'NODE_ENV', 
'SESSION_SECRET', 
'SMTP_USER', 
'SMTP_PASS', 
'ZEGO_APP_ID', 
'ZEGO_SERVER_SECRET', 
'ZEGO_CALLBACK_SECRET',
];

const missing = REQUIRED.filter(k => !process.env[k] || String(process.env[k]).trim() === '');

if (missing.length) { 
console.error('================================'); 
console.error('Missing environment variables:'); 
for (const k of missing) console.error(' ', k); 
console.error(' Hints: .env candidates =', CANDIDATES.join(' , ')); 
console.error('Sample readback:', 
'JWT_SECRET.len =', (process.env.JWT_SECRET || '').length, 
' | NODE_ENV =', process.env.NODE_ENV, 
); 
console.error('================================'); 
process.exit(1);
}

// (optional) export path if you want to log elsewhere
export const LOADED_ENV_PATH = loadedEnvPath;