// backend/src/utils/jwt.js
import jwt from 'jsonwebtoken';

// === Read from env (env.js is already loaded) ===
const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || ACCESS_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

if (!ACCESS_SECRET || !String(ACCESS_SECRET).trim()) {
  throw new Error(
    '[JWT] Missing JWT_SECRET. Check backend/.env and env loader.'
  );
}

// === Core APIs (clear name, direct use) ===
export function sign(payload, options = {}) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
    ...options,
  });
}
export function verify(token, options = {}) {
  return jwt.verify(token, ACCESS_SECRET, options);
}
export function signRefresh(payload, options = {}) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
    ...options,
  });
}
export function verifyRefresh(token, options = {}) {
  return jwt.verify(token, REFRESH_SECRET, options);
}
export function decode(token) {
  return jwt.decode(token);
}

// === Backward-compat ALIASES (so you don't have to edit old code) ===
// Access token
export const generateToken = (payload, opts) => sign(payload, opts);
export const verifyToken = (token, opts) => verify(token, opts);
export const generateAccessToken = (payload, opts) => sign(payload, opts);
export const verifyAccessToken = (token, opts) => verify(token, opts);
// Refresh token
export const generateRefreshToken = (payload, opts) =>
  signRefresh(payload, opts);
export const verifyRefreshToken = (token, opts) => verifyRefresh(token, opts);
// Misc
export const decodeToken = (token) => decode(token);
// Some projects often use these aliases:
export const issueToken = (payload, opts) => sign(payload, opts);
export const createToken = (payload, opts) => sign(payload, opts);

// Default export so old-style imports still run: `import jwtUtil from ...`
export default {
  sign,
  verify,
  decode,
  signRefresh,
  verifyRefresh,
  // aliases
  generateToken,
  verifyToken,
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
  issueToken,
  createToken,
};
